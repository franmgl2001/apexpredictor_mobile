import * as appsync from "aws-cdk-lib/aws-appsync";

/**
 * Creates prediction-related resolvers (race prediction queries and mutations)
 */
export function createPredictionsResolvers(dataSource: appsync.DynamoDbDataSource) {
  // Mutation.upsertPrediction resolver
  dataSource.createResolver("UpsertPredictionResolver", {
    typeName: "Mutation",
    fieldName: "upsertPrediction",
    requestMappingTemplate: appsync.MappingTemplate.fromString(
      `#set($identity = $ctx.identity)
#if($util.isNull($identity) || $util.isNull($identity.sub))
$util.unauthorized()
#end
#set($userId = $identity.sub)
#set($input = $ctx.args.input)
#set($pk = "PREDICTION#" + $input.series + "#" + $input.raceId)
## New stable SK structure: USER#<userId> (doesn't change when points update)
#set($sk = "USER#" + $userId)
#set($byUserPK = "USER#" + $userId)
#set($byUserSK = "RACE#" + $input.series + "#" + $input.season + "#" + $input.raceId)
## Calculate padded points: 1000000 - points, padded to 7 digits (for GSI sorting)
## For new predictions, points start at 0 (points are updated separately when race results are calculated)
#set($points = 0)
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
#set($byLeaderboardPK = "PREDICTION#" + $input.series + "#" + $input.raceId)
#set($byLeaderboardSK = $paddedPoints + "#USER#" + $userId)
#set($now = $util.time.nowISO8601())
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "PK": $util.dynamodb.toDynamoDBJson($pk),
    "SK": $util.dynamodb.toDynamoDBJson($sk)
  },
  "attributeValues": {
    "entityType": $util.dynamodb.toDynamoDBJson("RacePrediction"),
    "userId": $util.dynamodb.toDynamoDBJson($userId),
    "series": $util.dynamodb.toDynamoDBJson($input.series),
    "season": $util.dynamodb.toDynamoDBJson($input.season),
    "raceId": $util.dynamodb.toDynamoDBJson($input.raceId),
    "prediction": $util.dynamodb.toDynamoDBJson($input.prediction),
    "points": $util.dynamodb.toDynamoDBJson(0),
    "byUserPK": $util.dynamodb.toDynamoDBJson($byUserPK),
    "byUserSK": $util.dynamodb.toDynamoDBJson($byUserSK),
    "byLeaderboardPK": $util.dynamodb.toDynamoDBJson($byLeaderboardPK),
    "byLeaderboardSK": $util.dynamodb.toDynamoDBJson($byLeaderboardSK),
    "createdAt": $util.dynamodb.toDynamoDBJson($now),
    "updatedAt": $util.dynamodb.toDynamoDBJson($now)
  }
}`
    ),
    responseMappingTemplate: appsync.MappingTemplate.fromString(
      `$util.toJson($ctx.result)`
    ),
  });

  // Query.listMyRaces resolver
  dataSource.createResolver("ListMyRacesResolver", {
    typeName: "Query",
    fieldName: "listMyRaces",
    requestMappingTemplate: appsync.MappingTemplate.fromString(
      `#set($identity = $ctx.identity)
#if($util.isNull($identity) || $util.isNull($identity.sub))
$util.unauthorized()
#end
#set($userId = $identity.sub)
#set($byUserPK = "USER#" + $userId)
#set($skPrefix = "RACE#")
#if($ctx.args.series)
#set($skPrefix = $skPrefix + $ctx.args.series + "#")
#end
#if($ctx.args.season)
#set($skPrefix = $skPrefix + $ctx.args.season + "#")
#end
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byUser",
  "query": {
    "expression": "byUserPK = :pk AND begins_with(byUserSK, :skPrefix)",
    "expressionValues": {
      ":pk": $util.dynamodb.toDynamoDBJson($byUserPK),
      ":skPrefix": $util.dynamodb.toDynamoDBJson($skPrefix)
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

  // Query.getMyPrediction resolver
  // Uses direct GetItem with new stable SK structure
  dataSource.createResolver("GetMyPredictionResolver", {
    typeName: "Query",
    fieldName: "getMyPrediction",
    requestMappingTemplate: appsync.MappingTemplate.fromString(
      `#set($identity = $ctx.identity)
#if($util.isNull($identity) || $util.isNull($identity.sub))
$util.unauthorized()
#end
#set($userId = $identity.sub)
#set($pk = "PREDICTION#" + $ctx.args.series + "#" + $ctx.args.raceId)
#set($sk = "USER#" + $userId)
{
  "version": "2018-05-29",
  "operation": "GetItem",
  "key": {
    "PK": $util.dynamodb.toDynamoDBJson($pk),
    "SK": $util.dynamodb.toDynamoDBJson($sk)
  }
}`
    ),
    responseMappingTemplate: appsync.MappingTemplate.fromString(
      `#if($ctx.result == null || $util.isNull($ctx.result))
$util.toJson(null)
#else
$util.toJson($ctx.result)
#end`
    ),
  });

  // Query.getPredictions resolver
  dataSource.createResolver("GetPredictionsResolver", {
    typeName: "Query",
    fieldName: "getPredictions",
    requestMappingTemplate: appsync.MappingTemplate.fromString(
      `#set($identity = $ctx.identity)
#if($util.isNull($identity) || $util.isNull($identity.sub))
$util.unauthorized()
#end
#set($byUserPK = "USER#" + $ctx.args.userId)
#set($skPrefix = "RACE#")
#if($ctx.args.series)
#set($skPrefix = $skPrefix + $ctx.args.series + "#")
#end
#if($ctx.args.season)
#set($skPrefix = $skPrefix + $ctx.args.season + "#")
#end
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byUser",
  "query": {
    "expression": "byUserPK = :pk AND begins_with(byUserSK, :skPrefix)",
    "expressionValues": {
      ":pk": $util.dynamodb.toDynamoDBJson($byUserPK),
      ":skPrefix": $util.dynamodb.toDynamoDBJson($skPrefix)
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
