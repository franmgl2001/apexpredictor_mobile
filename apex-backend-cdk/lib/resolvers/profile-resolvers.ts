import * as appsync from "aws-cdk-lib/aws-appsync";

/**
 * Creates profile-related resolvers (user profile queries and mutations)
 * 
 * Naming standards:
 * - Field names: camelCase (userId, not user_id)
 * - Entity types: UPPERCASE with underscores (USER)
 * - GraphQL types: PascalCase (UserProfile)
 * - DynamoDB PK/SK: UPPERCASE prefixes (USER#)
 */
export function createProfileResolvers(
  dataSource: appsync.DynamoDbDataSource,
  tableName: string
) {
  // 1. Mutation.upsertMyProfile (Simple profile metadata update)
  dataSource.createResolver("UpsertMyProfileResolver", {
    typeName: "Mutation",
    fieldName: "upsertMyProfile",
    requestMappingTemplate: appsync.MappingTemplate.fromString(`
#set($userId = $ctx.identity.sub)
#set($input = $ctx.args.input)
#set($now = $util.time.nowISO8601())

{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "PK": $util.dynamodb.toDynamoDBJson("USER#$userId"),
    "SK": $util.dynamodb.toDynamoDBJson("PROFILE")
  },
  "attributeValues": {
    "userId": $util.dynamodb.toDynamoDBJson($userId),
    "email": $util.dynamodb.toDynamoDBJson($input.email),
    "username": $util.dynamodb.toDynamoDBJson($input.username),
    "country": $util.dynamodb.toDynamoDBJson($input.country),
    "createdAt": $util.dynamodb.toDynamoDBJson($now),
    "updatedAt": $util.dynamodb.toDynamoDBJson($now)
  }
}
    `),
    responseMappingTemplate: appsync.MappingTemplate.fromString(`
#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type)
#end
$util.toJson($ctx.result)
    `),
  });

  // 2. Mutation.initMyLeaderboards (Standalone call to initialize all categories)
  dataSource.createResolver("InitMyLeaderboardsResolver", {
    typeName: "Mutation",
    fieldName: "initMyLeaderboards",
    requestMappingTemplate: appsync.MappingTemplate.fromString(`
#set($userId = $ctx.identity.sub)
#set($now = $util.time.nowISO8601())
#set($season = "2026")
#set($categories = ["f1", "wec", "wrc", "indycar", "motogp", "nascar", "fe"])

{
  "version": "2018-05-29",
  "operation": "TransactWriteItems",
  "transactItems": [
    #foreach($cat in $categories)
    #if($foreach.index > 0) , #end
    {
      "table": "${tableName}",
      "operation": "PutItem",
      "key": {
        "PK": $util.dynamodb.toDynamoDBJson("LEADERBOARD#$cat#$season"),
        "SK": $util.dynamodb.toDynamoDBJson("PTS#0000000000#$userId")
      },
      "attributeValues": {
        "entityType": $util.dynamodb.toDynamoDBJson("LeaderboardEntry"),
        "userId": $util.dynamodb.toDynamoDBJson($userId),
        "category": $util.dynamodb.toDynamoDBJson($cat),
        "season": $util.dynamodb.toDynamoDBJson($season),
        "totalPoints": $util.dynamodb.toDynamoDBJson(0),
        "username": $util.dynamodb.toDynamoDBJson($ctx.identity.username),
        "numberOfRaces": $util.dynamodb.toDynamoDBJson(0),
        "byUserPK": $util.dynamodb.toDynamoDBJson("USER#$userId"),
        "byUserSK": $util.dynamodb.toDynamoDBJson("LEADERBOARD#$cat#$season"),
        "createdAt": $util.dynamodb.toDynamoDBJson($now),
        "updatedAt": $util.dynamodb.toDynamoDBJson($now)
      },
      "condition": {
        "expression": "attribute_not_exists(PK)"
      }
    }
    #end
  ]
}
    `),
    responseMappingTemplate: appsync.MappingTemplate.fromString(`
#if($ctx.error)
  #if($ctx.error.type == "DynamoDB:TransactionCanceledException" && $ctx.error.message.contains("ConditionCheckFailed"))
    $util.toJson(true)
  #else
    $util.error($ctx.error.message, $ctx.error.type)
  #end
#else
  $util.toJson(true)
#end
    `),
  });

  // Query.getMyProfile resolver (gets user from token)
  dataSource.createResolver("GetMyProfileResolver", {
    typeName: "Query",
    fieldName: "getMyProfile",
    requestMappingTemplate: appsync.MappingTemplate.fromString(`
#set($userId = $ctx.identity.sub)
{
  "version": "2018-05-29",
  "operation": "GetItem",
  "key": {
    "PK": $util.dynamodb.toDynamoDBJson("USER#$userId"),
    "SK": $util.dynamodb.toDynamoDBJson("PROFILE")
  }
}
    `),
    responseMappingTemplate: appsync.MappingTemplate.fromString(`
#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type)
#end
$util.toJson($ctx.result)
    `),
  });
}

