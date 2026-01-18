import * as appsync from "aws-cdk-lib/aws-appsync";

/**
 * Creates asset-related resolvers (races, drivers, results queries)
 */
export function createAssetsResolvers(
  dataSource: appsync.DynamoDbDataSource
) {
  // Query.getRaces resolver
  dataSource.createResolver("GetRacesResolver", {
    typeName: "Query",
    fieldName: "getRaces",
    requestMappingTemplate: appsync.MappingTemplate.fromString(
      `#set($pk = $ctx.args.category + "#" + $ctx.args.season)
{
  "version": "2018-05-29",
  "operation": "Query",
  "query": {
    "expression": "PK = :pk AND begins_with(SK, :skPrefix)",
    "expressionValues": {
      ":pk": $util.dynamodb.toDynamoDBJson($pk),
      ":skPrefix": { "S": "RACE#" }
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 100)
}`),
    responseMappingTemplate: appsync.MappingTemplate.fromString(`$util.toJson($ctx.result)`),
  });

  // Query.getDrivers resolver
  dataSource.createResolver("GetDriversResolver", {
    typeName: "Query",
    fieldName: "getDrivers",
    requestMappingTemplate: appsync.MappingTemplate.fromString(
      `#set($pk = $ctx.args.category + "#" + $ctx.args.season)
{
  "version": "2018-05-29",
  "operation": "Query",
  "query": {
    "expression": "PK = :pk AND begins_with(SK, :skPrefix)",
    "expressionValues": {
      ":pk": $util.dynamodb.toDynamoDBJson($pk),
      ":skPrefix": { "S": "DRIVER#" }
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 100)
}`),
    responseMappingTemplate: appsync.MappingTemplate.fromString(`$util.toJson($ctx.result)`),
  });

  // Query.getResults resolver
  dataSource.createResolver("GetResultsResolver", {
    typeName: "Query",
    fieldName: "getResults",
    requestMappingTemplate: appsync.MappingTemplate.fromString(
      `#set($pk = $ctx.args.category + "#" + $ctx.args.season)
{
  "version": "2018-05-29",
  "operation": "Query",
  "query": {
    "expression": "PK = :pk AND begins_with(SK, :skPrefix)",
    "expressionValues": {
      ":pk": $util.dynamodb.toDynamoDBJson($pk),
      ":skPrefix": { "S": "RESULTS#" }
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 100)
}`),
    responseMappingTemplate: appsync.MappingTemplate.fromString(`$util.toJson($ctx.result)`),
  });
}
