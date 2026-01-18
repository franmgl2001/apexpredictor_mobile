import * as appsync from "aws-cdk-lib/aws-appsync";

/**
 * Creates leaderboard-related resolvers (total points leaderboard queries and mutations)
 */
export function createLeaderboardResolvers(dataSource: appsync.DynamoDbDataSource) {
    // Mutation.upsertLeaderboardEntry resolver
    // PK: LEADERBOARD#{category}#{season}
    // SK: PTS#{paddedPoints} (padded to 10 digits for proper sorting, inverted for descending order)
    dataSource.createResolver("UpsertLeaderboardEntryResolver", {
        typeName: "Mutation",
        fieldName: "upsertLeaderboardEntry",
        requestMappingTemplate: appsync.MappingTemplate.fromString(`
#set($identity = $ctx.identity)
#if($util.isNull($identity) || $util.isNull($identity.sub))
  $util.unauthorized()
#end

#set($userId = $identity.sub)
#set($input = $ctx.args.input)

#set($category = $input.category)
#set($season = $input.season)
#set($totalPoints = $input.totalPoints)
#set($username = $input.username)
#set($numberOfRaces = $input.numberOfRaces)

## PK: LEADERBOARD#{category}#{season}
#set($pk = "LEADERBOARD#" + $category + "#" + $season)

## SK: PTS#0000000000 - starts at 0, updated separately when points are calculated
#set($sk = "PTS#0000000000")

## GSI keys for user lookup
#set($byUserPK = "USER#" + $userId)
#set($byUserSK = "LEADERBOARD#" + $category + "#" + $season)

#set($now = $util.time.nowISO8601())

{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "PK": $util.dynamodb.toDynamoDB($pk),
    "SK": $util.dynamodb.toDynamoDB($sk)
  },
  "attributeValues": {
    "entityType": $util.dynamodb.toDynamoDB("LeaderboardEntry"),
    "userId": $util.dynamodb.toDynamoDB($userId),
    "category": $util.dynamodb.toDynamoDB($category),
    "season": $util.dynamodb.toDynamoDB($season),
    "totalPoints": $util.dynamodb.toDynamoDB($totalPoints),
    "username": $util.dynamodb.toDynamoDB($username),
    "numberOfRaces": $util.dynamodb.toDynamoDB($numberOfRaces),
    "byUserPK": $util.dynamodb.toDynamoDB($byUserPK),
    "byUserSK": $util.dynamodb.toDynamoDB($byUserSK),
    "createdAt": $util.dynamodb.toDynamoDB($now),
    "updatedAt": $util.dynamodb.toDynamoDB($now)
  }
}
    `),
        responseMappingTemplate: appsync.MappingTemplate.fromString(`
#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type, $ctx.error.data)
#end

$util.toJson($ctx.result)
    `),
    });

    // Query.getLeaderboard resolver - gets leaderboard entries for a category/season
    dataSource.createResolver("GetLeaderboardResolver", {
        typeName: "Query",
        fieldName: "getLeaderboard",
        requestMappingTemplate: appsync.MappingTemplate.fromString(`
#set($category = $ctx.args.category)
#set($season = $ctx.args.season)
#set($limit = $util.defaultIfNull($ctx.args.limit, 50))

#set($pk = "LEADERBOARD#" + $category + "#" + $season)

{
  "version": "2018-05-29",
  "operation": "Query",
  "query": {
    "expression": "PK = :pk AND begins_with(SK, :skPrefix)",
    "expressionValues": {
      ":pk": $util.dynamodb.toDynamoDB($pk),
      ":skPrefix": $util.dynamodb.toDynamoDB("PTS#")
    }
  },
  "limit": $limit,
  #if($ctx.args.nextToken)
  "nextToken": "$ctx.args.nextToken",
  #end
  "scanIndexForward": true
}
    `),
        responseMappingTemplate: appsync.MappingTemplate.fromString(`
#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type, $ctx.error.data)
#end

{
  "items": $util.toJson($ctx.result.items),
  "nextToken": $util.toJson($ctx.result.nextToken)
}
    `),
    });

    // Query.getMyLeaderboardEntry resolver - gets the current user's leaderboard entry via GSI
    dataSource.createResolver("GetMyLeaderboardEntryResolver", {
        typeName: "Query",
        fieldName: "getMyLeaderboardEntry",
        requestMappingTemplate: appsync.MappingTemplate.fromString(`
#set($identity = $ctx.identity)
#if($util.isNull($identity) || $util.isNull($identity.sub))
  $util.unauthorized()
#end

#set($userId = $identity.sub)
#set($category = $ctx.args.category)
#set($season = $ctx.args.season)

#set($byUserPK = "USER#" + $userId)
#set($byUserSK = "LEADERBOARD#" + $category + "#" + $season)

{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byUser",
  "query": {
    "expression": "byUserPK = :pk AND byUserSK = :sk",
    "expressionValues": {
      ":pk": $util.dynamodb.toDynamoDB($byUserPK),
      ":sk": $util.dynamodb.toDynamoDB($byUserSK)
    }
  },
  "limit": 1
}
    `),
        responseMappingTemplate: appsync.MappingTemplate.fromString(`
#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type, $ctx.error.data)
#end

#if($ctx.result.items.isEmpty())
  $util.toJson(null)
#else
  $util.toJson($ctx.result.items[0])
#end
    `),
    });
}

