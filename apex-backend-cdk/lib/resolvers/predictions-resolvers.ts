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
#set($pk = "PREDICTION#" + $input.category + "#" + $input.raceId)
#set($sk = "USER#" + $userId)
#set($byUserPK = "USER#" + $userId)
#set($byUserSK = "RACE#" + $input.category + "#" + $input.season + "#" + $input.raceId)
#set($points = 0)
#set($score = 1000000 - $points)
#set($paddedPoints = "1000000")
#set($byLeaderboardPK = "PREDICTION#" + $input.category + "#" + $input.raceId)
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
    "category": $util.dynamodb.toDynamoDBJson($input.category),
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
      `#if($ctx.error)
$util.error($ctx.error.message, $ctx.error.type)
#end
#set($input = $ctx.args.input)
{
  "category": $util.toJson($input.category),
  "season": $util.toJson($input.season),
  "raceId": $util.toJson($input.raceId),
  "userId": $util.toJson($ctx.identity.sub),
  "prediction": $util.toJson($input.prediction),
  "points": 0,
  "createdAt": $util.toJson($ctx.result.createdAt),
  "updatedAt": $util.toJson($ctx.result.updatedAt)
}`
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
#if($ctx.args.category)
#set($skPrefix = $skPrefix + $ctx.args.category + "#")
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
      `#if($ctx.error)
$util.error($ctx.error.message, $ctx.error.type)
#end
#set($items = [])
#foreach($item in $ctx.result.items)
#set($obj = {
  "category": $item.category,
  "season": $item.season,
  "raceId": $item.raceId,
  "userId": $item.userId,
  "prediction": $util.defaultIfNull($item.prediction, {}),
  "points": $item.points,
  "createdAt": $item.createdAt,
  "updatedAt": $item.updatedAt
})
$util.qr($items.add($obj))
#end
{
  "items": $util.toJson($items),
  "nextToken": $util.toJson($ctx.result.nextToken)
}`
    ),
  });

  // Query.getMyPrediction resolver
  dataSource.createResolver("GetMyPredictionResolver", {
    typeName: "Query",
    fieldName: "getMyPrediction",
    requestMappingTemplate: appsync.MappingTemplate.fromString(
      `#set($identity = $ctx.identity)
#if($util.isNull($identity) || $util.isNull($identity.sub))
$util.unauthorized()
#end
#set($userId = $identity.sub)
#set($pk = "PREDICTION#" + $ctx.args.category + "#" + $ctx.args.raceId)
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
      `#if($ctx.error)
$util.error($ctx.error.message, $ctx.error.type)
#end
#if($ctx.result)
{
  "category": $util.toJson($ctx.result.category),
  "season": $util.toJson($ctx.result.season),
  "raceId": $util.toJson($ctx.result.raceId),
  "userId": $util.toJson($ctx.result.userId),
  "prediction": $util.toJson($util.defaultIfNull($ctx.result.prediction, {})),
  "points": $util.toJson($ctx.result.points),
  "createdAt": $util.toJson($ctx.result.createdAt),
  "updatedAt": $util.toJson($ctx.result.updatedAt)
}
#else
null
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
#if($ctx.args.category)
#set($skPrefix = $skPrefix + $ctx.args.category + "#")
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
      `#if($ctx.error)
$util.error($ctx.error.message, $ctx.error.type)
#end
#set($items = [])
#foreach($item in $ctx.result.items)
#set($obj = {
  "category": $item.category,
  "season": $item.season,
  "raceId": $item.raceId,
  "userId": $item.userId,
  "prediction": $util.defaultIfNull($item.prediction, {}),
  "points": $item.points,
  "createdAt": $item.createdAt,
  "updatedAt": $item.updatedAt
})
$util.qr($items.add($obj))
#end
{
      "items": $util.toJson($items),
      "nextToken": $util.toJson($ctx.result.nextToken)
}`
    ),
  });

  // Query.getRaceLeaderboard resolver
  // Uses byLeaderboard GSI to get all predictions for a race, sorted by points (descending)
  dataSource.createResolver("GetRaceLeaderboardResolver", {
    typeName: "Query",
    fieldName: "getRaceLeaderboard",
    requestMappingTemplate: appsync.MappingTemplate.fromString(
      `#set($byLeaderboardPK = "PREDICTION#" + $ctx.args.category + "#" + $ctx.args.raceId)
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byLeaderboard",
  "query": {
    "expression": "byLeaderboardPK = :pk",
    "expressionValues": {
      ":pk": $util.dynamodb.toDynamoDBJson($byLeaderboardPK)
    }
  },
  "scanIndexForward": true,
  "limit": $util.defaultIfNull($ctx.args.limit, 50),
  "nextToken": $util.toJson($util.defaultIfNullOrEmpty($ctx.args.nextToken, null))
}`
    ),
    responseMappingTemplate: appsync.MappingTemplate.fromString(
      `#if($ctx.error)
$util.error($ctx.error.message, $ctx.error.type)
#end
#set($items = [])
#foreach($item in $ctx.result.items)
#set($obj = {
  "category": $item.category,
  "season": $item.season,
  "raceId": $item.raceId,
  "userId": $item.userId,
  "prediction": $util.defaultIfNull($item.prediction, {}),
  "points": $item.points,
  "createdAt": $item.createdAt,
  "updatedAt": $item.updatedAt
})
$util.qr($items.add($obj))
#end
{
  "items": $util.toJson($items),
  "nextToken": $util.toJson($ctx.result.nextToken)
}`
    ),
  });
}
