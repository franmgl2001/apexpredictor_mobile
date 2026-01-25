import * as appsync from "aws-cdk-lib/aws-appsync";

/**
 * Creates leaderboard-related resolvers (total points leaderboard queries and mutations)
 */
export function createLeaderboardResolvers(dataSource: appsync.DynamoDbDataSource) {
    // Mutation.upsertLeaderboardEntry resolver
    dataSource.createResolver("UpsertLeaderboardEntryResolver", {
        typeName: "Mutation",
        fieldName: "upsertLeaderboardEntry",
        requestMappingTemplate: appsync.MappingTemplate.fromString(
            `#set($identity = $ctx.identity)
#if($util.isNull($identity) || $util.isNull($identity.sub))
$util.unauthorized()
#end
#set($userId = $identity.sub)
#set($input = $ctx.args.input)
#set($pk = "LEADERBOARD#" + $input.category + "#" + $input.season)
## Calculate padded points: 1000000 - points, padded to 7 digits
#set($points = $input.totalPoints)
#set($score = 1000000 - $points)
#set($scoreStr = $score.toString())
#set($zeros = "0000000")
#set($scoreLen = $scoreStr.length())
#set($padLen = 7 - $scoreLen)
#if($padLen > 0)
  #set($padding = $zeros.substring(0, $padLen))
  #set($paddedPoints = $padding + $scoreStr)
#else
  #set($paddedPoints = $scoreStr)
#end
#set($sk = "PTS#" + $paddedPoints + "#" + $userId)
#set($byUserPK = "USER#" + $userId)
#set($byUserSK = "LEADERBOARD#" + $input.category + "#" + $input.season)
#set($now = $util.time.nowISO8601())
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "PK": $util.dynamodb.toDynamoDBJson($pk),
    "SK": $util.dynamodb.toDynamoDBJson($sk)
  },
  "attributeValues": {
    "entityType": $util.dynamodb.toDynamoDBJson("LeaderboardEntry"),
    "userId": $util.dynamodb.toDynamoDBJson($userId),
    "category": $util.dynamodb.toDynamoDBJson($input.category),
    "season": $util.dynamodb.toDynamoDBJson($input.season),
    "totalPoints": $util.dynamodb.toDynamoDBJson($input.totalPoints),
    "username": $util.dynamodb.toDynamoDBJson($input.username),
    "numberOfRaces": $util.dynamodb.toDynamoDBJson($input.numberOfRaces),
    "nationality": $util.dynamodb.toDynamoDBJson($input.nationality),
    "byUserPK": $util.dynamodb.toDynamoDBJson($byUserPK),
    "byUserSK": $util.dynamodb.toDynamoDBJson($byUserSK),
    "createdAt": $util.dynamodb.toDynamoDBJson($now),
    "updatedAt": $util.dynamodb.toDynamoDBJson($now)
  }
}`
        ),
        responseMappingTemplate: appsync.MappingTemplate.fromString(
            `$util.toJson($ctx.result)`
        ),
    });

    // Query.getLeaderboard resolver
    dataSource.createResolver("GetLeaderboardResolver", {
        typeName: "Query",
        fieldName: "getLeaderboard",
        requestMappingTemplate: appsync.MappingTemplate.fromString(
            `#set($pk = "LEADERBOARD#" + $ctx.args.category + "#" + $ctx.args.season)
{
  "version": "2018-05-29",
  "operation": "Query",
  "query": {
    "expression": "PK = :pk AND begins_with(SK, :skPrefix)",
    "expressionValues": {
      ":pk": $util.dynamodb.toDynamoDBJson($pk),
      ":skPrefix": { "S": "PTS#" }
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 50)
}`
        ),
        responseMappingTemplate: appsync.MappingTemplate.fromString(
            `$util.toJson($ctx.result)`
        ),
    });

    // Query.getMyLeaderboardEntry resolver
    dataSource.createResolver("GetMyLeaderboardEntryResolver", {
        typeName: "Query",
        fieldName: "getMyLeaderboardEntry",
        requestMappingTemplate: appsync.MappingTemplate.fromString(
            `#set($identity = $ctx.identity)
#if($util.isNull($identity) || $util.isNull($identity.sub))
$util.unauthorized()
#end
#set($userId = $identity.sub)
#set($byUserPK = "USER#" + $userId)
#set($byUserSK = "LEADERBOARD#" + $ctx.args.category + "#" + $ctx.args.season)
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byUser",
  "query": {
    "expression": "byUserPK = :pk AND byUserSK = :sk",
    "expressionValues": {
      ":pk": $util.dynamodb.toDynamoDBJson($byUserPK),
      ":sk": $util.dynamodb.toDynamoDBJson($byUserSK)
    }
  },
  "limit": 1
}`
        ),
        responseMappingTemplate: appsync.MappingTemplate.fromString(
            `#if($ctx.result.items.size() == 0)
$util.toJson(null)
#else
$util.toJson($ctx.result.items[0])
#end`
        ),
    });

    // Query.getLeaderboardsByUserId resolver
    dataSource.createResolver("GetLeaderboardsByUserIdResolver", {
        typeName: "Query",
        fieldName: "getLeaderboardsByUserId",
        requestMappingTemplate: appsync.MappingTemplate.fromString(
            `#set($userId = $ctx.args.userId)
#set($byUserPK = "USER#" + $userId)
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byUser",
  "query": {
    "expression": "byUserPK = :pk AND begins_with(byUserSK, :skPrefix)",
    "expressionValues": {
      ":pk": $util.dynamodb.toDynamoDBJson($byUserPK),
      ":skPrefix": $util.dynamodb.toDynamoDBJson("LEADERBOARD#")
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 50),
  "nextToken": $util.toJson($util.defaultIfNullOrEmpty($ctx.args.nextToken, null))
}`
        ),
        responseMappingTemplate: appsync.MappingTemplate.fromString(
            `$util.toJson($ctx.result)`
        ),
    });
}
