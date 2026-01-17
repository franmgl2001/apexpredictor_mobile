import * as appsync from "aws-cdk-lib/aws-appsync";

/**
 * Creates prediction-related resolvers (race prediction queries and mutations)
 */
export function createPredictionsResolvers(
    dataSource: appsync.DynamoDbDataSource
) {
    // Mutation.upsertPrediction resolver
    dataSource.createResolver("UpsertPredictionResolver", {
        typeName: "Mutation",
        fieldName: "upsertPrediction",
        requestMappingTemplate: appsync.MappingTemplate.fromString(`
#set($userId = $ctx.identity.sub)
#set($series = $ctx.args.input.series)
#set($season = $ctx.args.input.season)
#set($raceId = $ctx.args.input.raceId)
#set($pk = "prediction#" + $userId + "#" + $series + "#" + $season + "#" + $raceId)
#set($sk = "RACEPREDICTION")
#set($points = 0)
#set($now = $util.time.nowISO8601())
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "PK": $util.dynamodb.toDynamoDB($pk),
    "SK": $util.dynamodb.toDynamoDB($sk)
  },
  "attributeValues": {
    "entityType": $util.dynamodb.toDynamoDB("RacePrediction"),

    "userId": $util.dynamodb.toDynamoDB($userId),
    "series": $util.dynamodb.toDynamoDB($series),
    "season": $util.dynamodb.toDynamoDB($season),
    "raceId": $util.dynamodb.toDynamoDB($raceId),

    "prediction": $util.dynamodb.toDynamoDB($ctx.args.input.prediction),
    "points": $util.dynamodb.toDynamoDB($points),

    "byUserPK": $util.dynamodb.toDynamoDB("USER#" + $userId),
    "byUserSK": $util.dynamodb.toDynamoDB("RACE#" + $series + "#" + $season + "#" + $raceId),

    "createdAt": $util.dynamodb.toDynamoDB($now),
    "updatedAt": $util.dynamodb.toDynamoDB($now)
  }
}
    `),
        responseMappingTemplate: appsync.MappingTemplate.fromString(`
$util.toJson($ctx.result)
    `),
    });
}
