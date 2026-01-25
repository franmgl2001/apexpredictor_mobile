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
#set($sk = "PTS#0000000000#" + $userId)
#set($byUserPK = "USER#" + $userId)
#set($byUserSK = "RACE#" + $input.series + "#" + $input.season + "#" + $input.raceId)
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
  dataSource.createResolver("GetMyPredictionResolver", {
    typeName: "Query",
    fieldName: "getMyPrediction",
    requestMappingTemplate: appsync.MappingTemplate.fromString(
      `#set($identity = $ctx.identity)
#if($util.isNull($identity) || $util.isNull($identity.sub))
$util.unauthorized()
#end
#set($userId = $identity.sub)
#set($byUserPK = "USER#" + $userId)
#set($byUserSK = "RACE#" + $ctx.args.series + "#" + $ctx.args.season + "#" + $ctx.args.raceId)
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
