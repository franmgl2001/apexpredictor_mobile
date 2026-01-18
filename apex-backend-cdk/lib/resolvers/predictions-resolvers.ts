import * as appsync from "aws-cdk-lib/aws-appsync";

/**
 * Creates prediction-related resolvers (race prediction queries and mutations)
 */
export function createPredictionsResolvers(dataSource: appsync.DynamoDbDataSource) {
    dataSource.createResolver("UpsertPredictionResolver", {
        typeName: "Mutation",
        fieldName: "upsertPrediction",
        requestMappingTemplate: appsync.MappingTemplate.fromString(`
#set($identity = $ctx.identity)
#if($util.isNull($identity) || $util.isNull($identity.sub))
  $util.unauthorized()
#end

#set($userId = $identity.sub)
#set($input = $ctx.args.input)

#set($series = $input.series)
#set($season = $input.season)
#set($raceId = $input.raceId)

## prediction is a STRING in your schema, store exactly as string
#set($prediction = $input.prediction)

#set($pk = "prediction#" + $userId + "#" + $series + "#" + $season + "#" + $raceId)
#set($sk = "PTS#0000000000")

#set($now = $util.time.nowISO8601())
#set($byUserPK = "user#" + $userId)
#set($byUserSK = "race#" + $series + "#" + $season + "#" + $raceId)

{
  "version": "2018-05-29",
  "operation": "UpdateItem",
  "key": {
    "PK": $util.dynamodb.toDynamoDB($pk),
    "SK": $util.dynamodb.toDynamoDB($sk)
  },
  "update": {
    "expression": "SET #et=:et, #userId=:userId, #series=:series, #season=:season, #raceId=:raceId, #prediction=:prediction, #byUserPK=:byUserPK, #byUserSK=:byUserSK, #updatedAt=:now, #createdAt=if_not_exists(#createdAt,:now), #points=if_not_exists(#points,:zero)",
    "expressionNames": {
      "#et": "entityType",
      "#userId": "userId",
      "#series": "series",
      "#season": "season",
      "#raceId": "raceId",
      "#prediction": "prediction",
      "#byUserPK": "byUserPK",
      "#byUserSK": "byUserSK",
      "#createdAt": "createdAt",
      "#updatedAt": "updatedAt",
      "#points": "points"
    },
    "expressionValues": {
      ":et": $util.dynamodb.toDynamoDB("RacePrediction"),
      ":userId": $util.dynamodb.toDynamoDB($userId),
      ":series": $util.dynamodb.toDynamoDB($series),
      ":season": $util.dynamodb.toDynamoDB($season),
      ":raceId": $util.dynamodb.toDynamoDB($raceId),
      ":prediction": $util.dynamodb.toDynamoDB($prediction),
      ":byUserPK": $util.dynamodb.toDynamoDB($byUserPK),
      ":byUserSK": $util.dynamodb.toDynamoDB($byUserSK),
      ":now": $util.dynamodb.toDynamoDB($now),
      ":zero": $util.dynamodb.toDynamoDB(0)
    }
  },
  "returnValues": "ALL_NEW"
}
    `),
        responseMappingTemplate: appsync.MappingTemplate.fromString(`
#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type, $ctx.error.data)
#end

#if($util.isNull($ctx.result) || $util.isNull($ctx.result.attributes))
  $util.toJson(null)
#else
  $util.toJson($util.dynamodb.toMapValues($ctx.result.attributes))
#end

    `),
    });
}
