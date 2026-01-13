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
    requestMappingTemplate: appsync.MappingTemplate.fromString(`
#set($category = $util.defaultIfNullOrBlank($ctx.args.category, "f1"))
#set($categoryLower = $util.toLower($category))
#set($season = $util.defaultIfNullOrBlank($ctx.args.season, "2026"))
#set($pk = "$categoryLower#$season")
#set($limit = $util.defaultIfNullOrBlank($ctx.args.limit, 100))
{
  "version": "2018-05-29",
  "operation": "Query",
  "query": {
    "expression": "PK = :pk AND begins_with(SK, :skPrefix)",
    "expressionValues": {
      ":pk": { "S": "$pk" },
      ":skPrefix": { "S": "race#" }
    }
  },
  "limit": $limit
  #if($ctx.args.nextToken)
  ,"nextToken": "$ctx.args.nextToken"
  #end
}
    `),
    responseMappingTemplate: appsync.MappingTemplate.fromString(`
#set($items = [])
#foreach($item in $ctx.result.items)
  $util.qr($items.add($util.dynamodb.toMapValues($item)))
#end
{
  "items": $util.toJson($items),
  "nextToken": $util.toJson($ctx.result.nextToken)
}
    `),
  });

  // Query.getDrivers resolver
  dataSource.createResolver("GetDriversResolver", {
    typeName: "Query",
    fieldName: "getDrivers",
    requestMappingTemplate: appsync.MappingTemplate.fromString(`
#set($category = $util.defaultIfNullOrBlank($ctx.args.category, "f1"))
#set($categoryLower = $util.toLower($category))
#set($season = $util.defaultIfNullOrBlank($ctx.args.season, "2026"))
#set($pk = "$categoryLower#$season")
#set($limit = $util.defaultIfNullOrBlank($ctx.args.limit, 100))
{
  "version": "2018-05-29",
  "operation": "Query",
  "query": {
    "expression": "PK = :pk AND begins_with(SK, :skPrefix)",
    "expressionValues": {
      ":pk": { "S": "$pk" },
      ":skPrefix": { "S": "drivers#" }
    }
  },
  "limit": $limit
  #if($ctx.args.nextToken)
  ,"nextToken": "$ctx.args.nextToken"
  #end
}
    `),
    responseMappingTemplate: appsync.MappingTemplate.fromString(`
    #set($items = [])
  #foreach($item in $ctx.result.items)
    $util.qr($items.add($util.dynamodb.toMapValues($item)))
  #end
  {
    "items": $util.toJson($items),
    "nextToken": $util.toJson($ctx.result.nextToken)
}
    `),
  });

  // Query.getResults resolver
  dataSource.createResolver("GetResultsResolver", {
    typeName: "Query",
    fieldName: "getResults",
    requestMappingTemplate: appsync.MappingTemplate.fromString(`
#set($category = $util.defaultIfNullOrBlank($ctx.args.category, "f1"))
#set($categoryLower = $util.toLower($category))
#set($season = $util.defaultIfNullOrBlank($ctx.args.season, "2026"))
#set($pk = "$categoryLower#$season")
#set($limit = $util.defaultIfNullOrBlank($ctx.args.limit, 100))
{
  "version": "2018-05-29",
  "operation": "Query",
  "query": {
    "expression": "PK = :pk AND begins_with(SK, :skPrefix)",
    "expressionValues": {
      ":pk": { "S": "$pk" },
      ":skPrefix": { "S": "results#" }
    }
  },
  "limit": $limit
  #if($ctx.args.nextToken)
  ,"nextToken": "$ctx.args.nextToken"
  #end
}
    `),
    responseMappingTemplate: appsync.MappingTemplate.fromString(`
#set($items = [])
#foreach($item in $ctx.result.items)
  $util.qr($items.add($util.dynamodb.toMapValues($item)))
#end
{
  "items": $util.toJson($items),
  "nextToken": $util.toJson($ctx.result.nextToken)
}
    `),
  });
}
