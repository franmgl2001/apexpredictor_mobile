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
  tableName: string,
  api: appsync.GraphqlApi
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
  // Uses pipeline resolver to first get the profile username, then create leaderboards
  const getProfileFunction = new appsync.AppsyncFunction(api, "InitMyLeaderboardsGetProfileFunction", {
    name: "InitMyLeaderboardsGetProfileFunction",
    api: api,
    dataSource: dataSource,
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
  ## If profile doesn't exist, use defaults from identity
  #set($username = $ctx.identity.sub)
  #set($nationality = "")
#else
  #set($profile = $ctx.result)
  #set($username = $util.defaultIfNullOrBlank($profile.username, $ctx.identity.sub))
  #set($nationality = $util.defaultIfNullOrBlank($profile.country, ""))
#end
#set($ctx.stash.username = $username)
#set($ctx.stash.nationality = $nationality)
#set($ctx.stash.userId = $ctx.identity.sub)
#if($ctx.error)
  $util.toJson({})
#else
  $util.toJson($profile)
#end
    `),
  });

  const createLeaderboardsFunction = new appsync.AppsyncFunction(api, "InitMyLeaderboardsCreateEntriesFunction", {
    name: "InitMyLeaderboardsCreateEntriesFunction",
    api: api,
    dataSource: dataSource,
    requestMappingTemplate: appsync.MappingTemplate.fromString(`
#set($userId = $ctx.stash.userId)
#set($username = $ctx.stash.username)
#set($nationality = $util.defaultIfNullOrBlank($ctx.stash.nationality, ""))
#set($now = $util.time.nowISO8601())
#set($season = "2026")
#set($categories = ["f1", "wec", "wrc", "indycar", "motogp", "nascar", "fe"])
## Calculate padded points: 1000000 - points (0 for initial), padded to 7 digits
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
## Initialize items list
#set($items = [])

#foreach($cat in $categories)
  ## Build GSI SK string with padded points
  #set($byLeaderboardSK = $paddedPoints + "#USER#" + $userId)
  ## Build item map with plain values first
  #set($itemMap = {
    "PK": "LEADERBOARD#$cat#$season",
    "SK": "USER#$userId",
    "entityType": "LeaderboardEntry",
    "userId": $userId,
    "category": $cat,
    "season": $season,
    "totalPoints": 0,
    "username": $username,
    "numberOfRaces": 0,
    "nationality": $nationality,
    "byUserPK": "USER#$userId",
    "byUserSK": "LEADERBOARD#$cat#$season",
    "byLeaderboardPK": "LEADERBOARD#$cat#$season",
    "byLeaderboardSK": $byLeaderboardSK,
    "createdAt": $now,
    "updatedAt": $now
  })
  ## Convert the entire map to DynamoDB format and add to items list
  $util.qr($items.add($util.dynamodb.toMapValues($itemMap)))
#end

{
  "version": "2018-05-29",
  "operation": "BatchPutItem",
  "tables": {
    "${tableName}": $util.toJson($items)
  }
}
    `),
    responseMappingTemplate: appsync.MappingTemplate.fromString(`
$util.toJson(true)
    `),
  });

  // Create pipeline resolver on the API, not on the data source
  new appsync.Resolver(api, "InitMyLeaderboardsResolver", {
    api: api,
    typeName: "Mutation",
    fieldName: "initMyLeaderboards",
    pipelineConfig: [getProfileFunction, createLeaderboardsFunction],
    requestMappingTemplate: appsync.MappingTemplate.fromString(`
## Pipeline resolver - pass through
$util.toJson({})
    `),
    responseMappingTemplate: appsync.MappingTemplate.fromString(`
#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type)
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

