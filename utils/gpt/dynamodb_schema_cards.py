#!/usr/bin/env python3
"""
dynamodb_schema_cards.py
Generate "Schema Cards" markdown for a single-table DynamoDB design.

Usage:
  python dynamodb_schema_cards.py --table YourTable --region eu-west-1 --profile default --sample 400

Requires:
  pip install boto3 botocore
Permissions:
  dynamodb:DescribeTable, dynamodb:DescribeTimeToLive, dynamodb:Scan
(Optional) Query permissions if you extend sampling via GSIs.
"""
import argparse, sys, json, math, datetime
from collections import defaultdict, Counter

try:
    import boto3, botocore
except Exception as e:
    print("This script requires boto3. Install with: pip install boto3 botocore", file=sys.stderr)
    raise

TEMPLATE_HEADER = """SCHEMA CARDS — v{date}

TABLE
- name: {table_name}
- PK: {pk} (S)
- SK: {sk} (S)
- Notes: Single-table. SK prefixes distinguish entities. TTL: {ttl}. Streams: {streams}.

GLOBAL SECONDARY INDEXES
{gsi_block}
"""

ENTITY_BLOCK_TEMPLATE = """
## {entity}
Keys:
- PK pattern: {pk_pattern}
- SK pattern: {sk_pattern}
Attributes
- required: {required_attrs}
- optional: {optional_attrs}
Indexes
{index_refs}
Access Patterns (canonical)  # ← fill/curate as needed
{access_patterns}
Examples
{examples}
"""

def safe_join_list(lst):
    return ", ".join(lst) if lst else "—"

def detect_entity(item, pk_name, sk_name):
    # 1) Prefer explicit entityType (case-insensitive)
    for k in list(item.keys()):
        if k.lower() in ("entitytype","type","_et","_entity"):
            v = item[k]
            if isinstance(v, str) and v.strip():
                return v.strip().upper(), {"pk":"<unknown>", "sk":f"{item.get(sk_name,'')}"}
    # 2) Derive from SK
    sk = item.get(sk_name, "")
    if isinstance(sk, str) and sk:
        if "#" in sk:
            prefix = sk.split("#",1)[0]
            if prefix:
                return prefix.upper(), {"pk":"<unknown>", "sk":f"{prefix}#{{...}}"}
        else:
            return sk.upper(), {"pk":"<unknown>", "sk":sk}
    # 3) Fallback from PK if it looks namespaced
    pk = item.get(pk_name, "")
    if isinstance(pk, str) and "#" in pk:
        prefix = pk.split("#",1)[0]
        return prefix.upper(), {"pk":f"{prefix}#{{...}}", "sk":"<unknown>"}
    return "UNKNOWN", {"pk":"<unknown>", "sk":"<unknown>"}

def summarize_required_optional(items, exclude=set()):
    # Determine required vs optional by frequency threshold (>= 0.9 of items = required)
    if not items:
        return [], []
    counts = Counter()
    n = len(items)
    for it in items:
        for k in it.keys():
            counts[k]+=1
    required = [k for k,c in counts.items() if c >= max(1, math.ceil(0.9*n)) and k not in exclude]
    optional = [k for k,c in counts.items() if 1 <= c < max(1, math.ceil(0.9*n)) and k not in exclude]
    return sorted(required), sorted(optional)

def fetch_table_info(client, table_name):
    desc = client.describe_table(TableName=table_name)["Table"]
    ks = desc["KeySchema"]
    attr_defs = {a["AttributeName"]:a["AttributeType"] for a in desc.get("AttributeDefinitions",[])}
    pk = next(k["AttributeName"] for k in ks if k["KeyType"]=="HASH")
    sk = next((k["AttributeName"] for k in ks if k["KeyType"]=="RANGE"), None)
    gsis = []
    for g in desc.get("GlobalSecondaryIndexes",[]) or []:
        g_pk = next(k["AttributeName"] for k in g["KeySchema"] if k["KeyType"]=="HASH")
        g_sk = next((k["AttributeName"] for k in g["KeySchema"] if k["KeyType"]=="RANGE"), None)
        proj = g["Projection"]["ProjectionType"]
        non_keys = g["Projection"].get("NonKeyAttributes",[])
        gsis.append({
            "Name": g["IndexName"],
            "PK": g_pk,
            "SK": g_sk,
            "Projection": proj,
            "NonKeyAttributes": non_keys
        })
    lsis = []
    for l in desc.get("LocalSecondaryIndexes",[]) or []:
        l_sk = next(k["AttributeName"] for k in l["KeySchema"] if k["KeyType"]=="RANGE")
        proj = l["Projection"]["ProjectionType"]
        non_keys = l["Projection"].get("NonKeyAttributes",[])
        lsis.append({
            "Name": l["IndexName"],
            "PK": pk,
            "SK": l_sk,
            "Projection": proj,
            "NonKeyAttributes": non_keys
        })
    # TTL
    try:
        ttl_desc = client.describe_time_to_live(TableName=table_name).get("TimeToLiveDescription",{})
        ttl = ttl_desc.get("AttributeName") if ttl_desc.get("TimeToLiveStatus")=="ENABLED" else "none"
    except client.exceptions.ResourceNotFoundException:
        ttl = "none"
    # Streams
    stream_spec = desc.get("StreamSpecification",{})
    streams = "on" if stream_spec.get("StreamEnabled") else "off"
    return {
        "pk": pk,
        "sk": sk or "<none>",
        "attr_defs": attr_defs,
        "gsis": gsis,
        "lsis": lsis,
        "ttl": ttl,
        "streams": streams
    }

def sample_items(table, limit=500):
    items = []
    scan_kwargs = {"Limit": min(limit, 1000)}
    scanned = 0
    while True:
        resp = table.scan(**scan_kwargs)
        items.extend(resp.get("Items",[]))
        scanned += len(resp.get("Items",[]))
        if scanned >= limit or "LastEvaluatedKey" not in resp:
            break
        scan_kwargs["ExclusiveStartKey"] = resp["LastEvaluatedKey"]
    return items

def guess_pk_sk_patterns(entity_items, pk_name, sk_name):
    # Analyze patterns like "TYPE#id" and constant literals like "PROFILE"
    sks = [it.get(sk_name,"") for it in entity_items if sk_name in it]
    pks = [it.get(pk_name,"") for it in entity_items if pk_name in it]
    def pattern_from(values):
        if not values: return "<unknown>"
        # If many values share "PREFIX#" then show PREFIX#...
        prefixes = Counter()
        for v in values:
            if isinstance(v,str) and "#" in v:
                prefixes[v.split("#",1)[0]] += 1
        if prefixes:
            top = prefixes.most_common(1)[0][0]
            return f'{top}#{{...}}'
        # If many are identical constants like "PROFILE"
        consts = Counter([v for v in values if isinstance(v,str)])
        if consts and consts.most_common(1)[0][1] >= max(3, math.ceil(0.5*len(values))):
            return consts.most_common(1)[0][0]
        # Fallback generic
        return "<var>"
    return pattern_from(pks), pattern_from(sks)

def main():
    ap = argparse.ArgumentParser(description="Generate Schema Cards markdown for a single-table DynamoDB design.")
    ap.add_argument("--table", required=True, help="DynamoDB table name")
    ap.add_argument("--region", default=None, help="AWS region (defaults to your AWS config)")
    ap.add_argument("--profile", default=None, help="AWS profile name in your credentials")
    ap.add_argument("--sample", type=int, default=400, help="Max items to scan to infer entities (default 400)")
    ap.add_argument("--examples-per-entity", type=int, default=2, help="Number of example items to include per entity (default 2)")
    args = ap.parse_args()

    session_kwargs = {}
    if args.profile:
        session_kwargs["profile_name"] = args.profile
    session = boto3.Session(**session_kwargs)
    client = session.client("dynamodb", region_name=args.region) if args.region else session.client("dynamodb")
    resource = session.resource("dynamodb", region_name=args.region) if args.region else session.resource("dynamodb")
    table = resource.Table(args.table)

    try:
        meta = fetch_table_info(client, args.table)
    except botocore.exceptions.ClientError as e:
        sys.stderr.write(f"Error describing table: {e}\n")
        sys.exit(1)

    pk, sk = meta["pk"], meta["sk"]

    # Build GSI/LSI block
    gsi_lines = []
    if meta["gsis"]:
        for g in meta["gsis"]:
            proj = g["Projection"]
            if proj == "INCLUDE":
                proj_str = f'INCLUDE({", ".join(g.get("NonKeyAttributes",[]))})'
            else:
                proj_str = proj
            gsi_lines.append(f"- {g['Name']}:\n  - PK: {g['PK']}\n  - SK: {g['SK'] if g['SK'] else 'null'}\n  - PROJECTION: {proj_str}\n  - Purpose: <fill intent>")
    if meta["lsis"]:
        for l in meta["lsis"]:
            proj = l["Projection"]
            if proj == "INCLUDE":
                proj_str = f'INCLUDE({", ".join(l.get("NonKeyAttributes",[]))})'
            else:
                proj_str = proj
            gsi_lines.append(f"- {l['Name']} (LSI):\n  - PK: {l['PK']}\n  - SK: {l['SK']}\n  - PROJECTION: {proj_str}\n  - Purpose: <fill intent>")
    if not gsi_lines:
        gsi_lines = ["- (none)"]
    gsi_block = "\n".join(gsi_lines)

    header = TEMPLATE_HEADER.format(
        date=datetime.date.today().isoformat(),
        table_name=args.table,
        pk=pk, sk=sk,
        ttl=meta["ttl"],
        streams=meta["streams"],
        gsi_block=gsi_block
    )

    # Sample items and group by entity
    try:
        items = sample_items(table, limit=args.sample)
    except botocore.exceptions.ClientError as e:
        print(f"Scan failed (need dynamodb:Scan permission). Error: {e}", file=sys.stderr)
        items = []

    entities = defaultdict(list)
    entity_patterns = {}
    for it in items:
        ent, patterns = detect_entity(it, pk, sk if sk != "<none>" else pk)
        entities[ent].append(it)
        entity_patterns.setdefault(ent, patterns)

    # Build entity blocks
    blocks = []
    for ent, ent_items in sorted(entities.items(), key=lambda kv: (-len(kv[1]), kv[0])):
        exclude = set([pk])
        if sk != "<none>":
            exclude.add(sk)
        req, opt = summarize_required_optional(ent_items, exclude=exclude)

        pk_pat, sk_pat = guess_pk_sk_patterns(ent_items, pk, sk if sk != "<none>" else pk)

        # Index references that touch attributes in this entity
        idx_refs_lines = []
        for g in meta["gsis"]:
            used = []
            if g["PK"] in req or g["PK"] in opt or g["PK"] in (pk, sk):
                used.append(g["PK"])
            if g["SK"] and (g["SK"] in req or g["SK"] in opt or g["SK"] in (pk, sk)):
                used.append(g["SK"])
            if used:
                proj = g["Projection"]
                idx_refs_lines.append(f"- {g['Name']}: PK={g['PK']}, SK={g['SK'] or 'null'}, PROJECTION={proj}")
        for l in meta["lsis"]:
            if l["SK"] in req or l["SK"] in opt or l["SK"] in (pk, sk):
                idx_refs_lines.append(f"- {l['Name']} (LSI): PK={l['PK']}, SK={l['SK']}, PROJECTION={l['Projection']}")
        if not idx_refs_lines:
            idx_refs_lines = ["- (none)"]
        index_refs = "\n".join(idx_refs_lines)

        # Access pattern placeholders
        ap_lines = [
            f"- Get{ent.title()}ByPK/SK: GetItem(PK=?, SK=?)",
            f"- List{ent.title()}ByPK: Query PK=? [optional begins_with(SK,'{ent.title()}#')]"
        ]
        access_patterns = "\n".join(ap_lines)

        # Examples (trim to keys + a few attrs)
        examples_lines = []
        for ex in ent_items[:args.examples_per_entity]:
            shown = {}
            # Always include keys, then up to 6 more attrs
            key_first = []
            if pk in ex: key_first.append(pk)
            if sk in ex and sk != pk: key_first.append(sk)
            rest = [k for k in ex.keys() if k not in key_first]
            ordered = key_first + rest[:6]
            for k in ordered:
                shown[k] = ex[k]
            examples_lines.append(f"- {json.dumps(shown, ensure_ascii=False)}")
        if not examples_lines:
            examples_lines = ["- (no examples sampled)"]
        examples = "\n".join(examples_lines)

        block = ENTITY_BLOCK_TEMPLATE.format(
            entity=ent,
            pk_pattern=pk_pat,
            sk_pattern=sk_pat,
            required_attrs=safe_join_list(req) if req else "—",
            optional_attrs=safe_join_list(opt) if opt else "—",
            index_refs=index_refs,
            access_patterns=access_patterns,
            examples=examples
        )
        blocks.append(block)

    md = header + "\nENTITIES\n" + ("\n".join(blocks) if blocks else "\n- (no items sampled; add examples manually)\n")

    out_path = "schema_cards.md"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(md)

    print(md)
    print(f"\nWrote: {out_path}")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Fatal error: {e}", file=sys.stderr)
        sys.exit(2)
