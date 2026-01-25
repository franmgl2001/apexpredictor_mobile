import * as appsync from "aws-cdk-lib/aws-appsync";

/**
 * Creates league-related resolvers
 * 
 * Naming standards:
 * - Field names: camelCase (leagueId, leagueName, userId)
 * - Entity types: UPPERCASE with underscores (LEAGUE, LEAGUE_MEMBER)
 * - GraphQL types: PascalCase (League, LeagueMember)
 * - DynamoDB PK/SK: UPPERCASE prefixes, lowercase values (LEAGUE#<lowercaseId>, MEMBER#<lowercaseId>)
 */
export function createLeagueResolvers(
  dataSource: appsync.DynamoDbDataSource,
  tableName: string
) {
  // Mutation.createLeague resolver
  // This creates the league and adds the creator as admin member
  dataSource.createResolver("CreateLeagueResolver", {
    typeName: "Mutation",
    fieldName: "createLeague",
    requestMappingTemplate: appsync.MappingTemplate.fromString(
      `#set($identity = $ctx.identity)
#if($util.isNull($identity) || $util.isNull($identity.sub))
$util.unauthorized()
#end
#set($userId = $identity.sub)
#set($input = $ctx.args.input)
#set($timestamp = $util.time.nowEpochMilliSeconds())
#set($randomSuffix = $util.autoId())
#set($leagueId = "l" + $timestamp + "_" + $randomSuffix.toLowerCase())
#set($codeStr = $randomSuffix.toUpperCase())
#set($code = $codeStr.substring(0, 6))
#set($now = $util.time.nowISO8601())
#set($pk = "LEAGUE#" + $leagueId.toLowerCase())
#set($sk = "META")

## Store values for response template
#set($ctx.stash.leagueId = $leagueId)
#set($ctx.stash.userId = $userId)
#set($ctx.stash.code = $code)
#set($ctx.stash.name = $input.name)
#set($ctx.stash.description = $util.defaultIfNull($input.description, ""))
#set($ctx.stash.createdAt = $now)
#set($ctx.stash.category = $input.category)
#set($ctx.stash.season = $input.season)

## Create league item
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "PK": $util.dynamodb.toDynamoDBJson($pk),
    "SK": $util.dynamodb.toDynamoDBJson($sk)
  },
  "attributeValues": {
    "entityType": $util.dynamodb.toDynamoDBJson("LEAGUE"),
    "leagueId": $util.dynamodb.toDynamoDBJson($leagueId),
    "name": $util.dynamodb.toDynamoDBJson($input.name),
    "createdByUserId": $util.dynamodb.toDynamoDBJson($userId),
    "createdAt": $util.dynamodb.toDynamoDBJson($now),
    "byCode": $util.dynamodb.toDynamoDBJson($code),
    "description": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($input.description, ""))
  }
}`
    ),
    responseMappingTemplate: appsync.MappingTemplate.fromString(
      `#set($league = $ctx.result)
#set($userId = $ctx.stash.userId)
#set($leagueId = $ctx.stash.leagueId)
#set($memberPk = "LEAGUE#" + $leagueId.toLowerCase())
#set($memberSk = "MEMBER#" + $userId.toLowerCase())
#set($now = $util.time.nowISO8601())

## Create member entry - we'll use $util.dynamodb.invoke to create it
## But since we can't write in response template, we'll return the league
## and the frontend can create the member, or we use a pipeline resolver
## For now, return the league - member will be created via pipeline or separate call
$util.toJson({
  "PK": $league.PK,
  "SK": $league.SK,
  "entityType": $league.entityType,
  "leagueId": $league.leagueId,
  "name": $league.name,
  "createdByUserId": $league.createdByUserId,
  "createdAt": $league.createdAt,
  "byCode": $league.byCode,
  "description": $league.description
})`
    ),
  });

  // Mutation.batchCreateLeagueLeaderboardEntries resolver
  dataSource.createResolver("BatchCreateLeagueLeaderboardEntriesResolver", {
    typeName: "Mutation",
    fieldName: "batchCreateLeagueLeaderboardEntries",
    requestMappingTemplate: appsync.MappingTemplate.fromString(
      `#set($entries = $ctx.args.entries)
#set($now = $util.time.nowISO8601())
#set($items = [])

#foreach($entry in $entries)
  #set($points = $entry.totalPoints)
  ## Extract padded points from source entry if available, otherwise calculate
  #set($paddedPoints = "")
  #if($entry.pointsPadded && $entry.pointsPadded != "")
    ## Use the padded points from the source leaderboard entry
    #set($paddedPoints = $entry.pointsPadded)
  #else
    ## Calculate padded points: 1000000 - points, padded to 7 digits (matching regular leaderboards)
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
  #end
  #set($pk = "LEAGUE#" + $entry.leagueId.toLowerCase() + "#LEADERBOARD")
  ## New stable SK structure: USER#<userId>#<category>#<season> (doesn't change when points update)
  #set($sk = "USER#" + $entry.userId.toLowerCase() + "#" + $entry.category.toLowerCase() + "#" + $entry.season)
  ## Build GSI SK string with padded points
  #set($byLeaderboardSK = $paddedPoints + "#USER#" + $entry.userId.toLowerCase() + "#" + $entry.category.toLowerCase() + "#" + $entry.season)
  
  ## Build item map with plain values first
  #set($itemMap = {
    "PK": $pk,
    "SK": $sk,
    "entityType": "LEAGUE_LEADERBOARD_ENTRY",
    "leagueId": $entry.leagueId,
    "userId": $entry.userId,
    "username": $entry.username,
    "totalPoints": $entry.totalPoints,
    "numberOfRaces": $entry.numberOfRaces,
    "category": $entry.category,
    "season": $entry.season,
    "nationality": $util.defaultIfNull($entry.nationality, ""),
    "byLeaderboardPK": $pk,
    "byLeaderboardSK": $byLeaderboardSK,
    "createdAt": $now,
    "updatedAt": $now
  })
  ## Convert the entire map to DynamoDB format
  $util.qr($items.add($util.dynamodb.toMapValues($itemMap)))
#end

{
  "version": "2018-05-29",
  "operation": "BatchPutItem",
  "tables": {
    "${tableName}": $util.toJson($items)
  }
}`
    ),
    responseMappingTemplate: appsync.MappingTemplate.fromString(
      `#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type)
#else
  $util.toJson(true)
#end`
    ),
  });

  // Mutation.batchCreateLeaguePredictionEntries resolver
  dataSource.createResolver("BatchCreateLeaguePredictionEntriesResolver", {
    typeName: "Mutation",
    fieldName: "batchCreateLeaguePredictionEntries",
    requestMappingTemplate: appsync.MappingTemplate.fromString(
      `#set($entries = $ctx.args.entries)
#set($now = $util.time.nowISO8601())
#set($items = [])

#foreach($entry in $entries)
  #set($points = $entry.points)
  ## Extract padded points from source entry if available, otherwise calculate
  #set($paddedPoints = "")
  #if($entry.pointsPadded && $entry.pointsPadded != "")
    ## Use the padded points from the source prediction entry
    #set($paddedPoints = $entry.pointsPadded)
  #else
    ## Calculate padded points: 1000000 - points, padded to 7 digits (matching regular predictions)
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
  #end
  ## PK groups all predictions for a race in a league (similar to leaderboard grouping by category/season)
  #set($pk = "LEAGUE#" + $entry.leagueId.toLowerCase() + "#PREDICTION#" + $entry.series.toLowerCase() + "#" + $entry.raceId)
  ## Stable SK structure: USER#<userId> (doesn't change when points update, matches leaderboard pattern)
  #set($sk = "USER#" + $entry.userId.toLowerCase())
  ## byUser GSI for querying all league predictions for a user
  #set($byUserPK = "USER#" + $entry.userId.toLowerCase())
  #set($byUserSK = "LEAGUE#" + $entry.leagueId.toLowerCase() + "#PREDICTION#" + $entry.series.toLowerCase() + "#" + $entry.season + "#" + $entry.raceId)
  ## byLeaderboard GSI for querying predictions for a race sorted by points
  #set($byLeaderboardPK = "LEAGUE#" + $entry.leagueId.toLowerCase() + "#PREDICTION#" + $entry.series.toLowerCase() + "#" + $entry.raceId)
  #set($byLeaderboardSK = $paddedPoints + "#USER#" + $entry.userId.toLowerCase())
  
  ## Build item map with plain values first
  #set($itemMap = {
    "PK": $pk,
    "SK": $sk,
    "entityType": "LEAGUE_PREDICTION_ENTRY",
    "leagueId": $entry.leagueId,
    "userId": $entry.userId,
    "series": $entry.series,
    "season": $entry.season,
    "raceId": $entry.raceId,
    "prediction": $entry.prediction,
    "points": $entry.points,
    "byUserPK": $byUserPK,
    "byUserSK": $byUserSK,
    "byLeaderboardPK": $byLeaderboardPK,
    "byLeaderboardSK": $byLeaderboardSK,
    "createdAt": $now,
    "updatedAt": $now
  })
  ## Convert the entire map to DynamoDB format
  $util.qr($items.add($util.dynamodb.toMapValues($itemMap)))
#end

{
  "version": "2018-05-29",
  "operation": "BatchPutItem",
  "tables": {
    "${tableName}": $util.toJson($items)
  }
}`
    ),
    responseMappingTemplate: appsync.MappingTemplate.fromString(
      `#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type)
#else
  $util.toJson(true)
#end`
    ),
  });

  // Mutation.copyLeaderboardToLeague resolver
  // This copies all leaderboard entries from total points to the league
  // Note: This is a simplified version - for production, consider using a Lambda function
  // to handle batching and pagination
  dataSource.createResolver("CopyLeaderboardToLeagueResolver", {
    typeName: "Mutation",
    fieldName: "copyLeaderboardToLeague",
    requestMappingTemplate: appsync.MappingTemplate.fromString(
      `#set($identity = $ctx.identity)
#if($util.isNull($identity) || $util.isNull($identity.sub))
$util.unauthorized()
#end
#set($input = $ctx.args.input)
#set($leaderboardPk = "LEADERBOARD#" + $input.category + "#" + $input.season)

## Query all leaderboard entries
{
  "version": "2018-05-29",
  "operation": "Query",
  "query": {
    "expression": "PK = :pk AND begins_with(SK, :skPrefix)",
    "expressionValues": {
      ":pk": $util.dynamodb.toDynamoDBJson($leaderboardPk),
      ":skPrefix": { "S": "PTS#" }
    }
  },
  "limit": 1000
}`
    ),
    responseMappingTemplate: appsync.MappingTemplate.fromString(
      `## This resolver queries the leaderboard but doesn't copy entries
## For production, use a Lambda function to handle the copying
## For now, return true - the actual copying will be handled in the frontend
$util.toJson(true)`
    ),
  });

  // Mutation.createLeagueMember resolver
  // Creates a league member entry
  // Note: role defaults to "member" unless explicitly set to "admin" (for league creators)
  // If role is "admin", the code should be passed in the input to store on the member
  dataSource.createResolver("CreateLeagueMemberResolver", {
    typeName: "Mutation",
    fieldName: "createLeagueMember",
    requestMappingTemplate: appsync.MappingTemplate.fromString(
      `#set($identity = $ctx.identity)
#if($util.isNull($identity) || $util.isNull($identity.sub))
$util.unauthorized()
#end
#set($userId = $identity.sub)
#set($input = $ctx.args.input)
#set($now = $util.time.nowISO8601())
#set($memberPk = "LEAGUE#" + $input.leagueId.toLowerCase())
#set($memberSk = "MEMBER#" + $userId.toLowerCase())
#set($byUserPK = "USER#" + $userId)
#set($byUserSK = "LEAGUE#" + $input.leagueId.toLowerCase())
#set($role = $util.defaultIfNull($input.role, "member"))

## Build attribute values
#set($attributeValues = {
  "entityType": "LEAGUE_MEMBER",
  "leagueId": $input.leagueId,
  "userId": $userId,
  "byUserPK": $byUserPK,
  "byUserSK": $byUserSK,
  "role": $role,
  "leagueName": $input.leagueName,
  "createdAt": $now,
  "updatedAt": $now
})

## Store code if provided (for now, show to everyone)
#if($input.code)
  $util.qr($attributeValues.put("code", $input.code))
#end

{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "PK": $util.dynamodb.toDynamoDBJson($memberPk),
    "SK": $util.dynamodb.toDynamoDBJson($memberSk)
  },
  "attributeValues": $util.dynamodb.toMapValuesJson($attributeValues)
}
`
    ),
    responseMappingTemplate: appsync.MappingTemplate.fromString(
      `#set($member = $ctx.result)
#set($response = {
  "PK": $member.PK,
  "SK": $member.SK,
  "entityType": $member.entityType,
  "leagueId": $member.leagueId,
  "userId": $member.userId,
  "username": $util.defaultIfNull($member.username, ""),
  "role": $member.role,
  "leagueName": $member.leagueName,
  "description": $util.defaultIfNull($member.description, ""),
  "createdAt": $member.createdAt,
  "updatedAt": $member.updatedAt
})
## Include code if it exists on member (for now, show to everyone)
#if($member.code)
  $util.qr($response.put("code", $member.code))
#end
$util.toJson($response)`
    ),
  });

  // Query.getMyLeagues resolver
  // Gets all leagues the user is a member of by querying memberships
  // Uses the byUser GSI
  dataSource.createResolver("GetMyLeaguesResolver", {
    typeName: "Query",
    fieldName: "getMyLeagues",
    requestMappingTemplate: appsync.MappingTemplate.fromString(
      `#set($identity = $ctx.identity)
#if($util.isNull($identity) || $util.isNull($identity.sub))
$util.unauthorized()
#end
#set($userId = $identity.sub)
#set($byUserPK = "USER#" + $userId)
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byUser",
  "query": {
    "expression": "byUserPK = :pk AND begins_with(byUserSK, :skPrefix)",
    "expressionValues": {
      ":pk": $util.dynamodb.toDynamoDBJson($byUserPK),
      ":skPrefix": $util.dynamodb.toDynamoDBJson("LEAGUE#")
    }
  },
  "filter": {
    "expression": "entityType = :entityType",
    "expressionValues": {
      ":entityType": $util.dynamodb.toDynamoDBJson("LEAGUE_MEMBER")
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 50),
  "nextToken": $util.toJson($util.defaultIfNullOrEmpty($ctx.args.nextToken, null)),
  "scanIndexForward": false
}`
    ),
    responseMappingTemplate: appsync.MappingTemplate.fromString(
      `#set($result = $ctx.result)
#set($items = [])
#foreach($item in $result.items)
  #set($mappedItem = {
    "PK": $item.PK,
    "SK": $item.SK,
    "entityType": $item.entityType,
    "leagueId": $item.leagueId,
    "userId": $item.userId,
    "username": $util.defaultIfNull($item.username, ""),
    "role": $item.role,
    "leagueName": $item.leagueName,
    "description": $util.defaultIfNull($item.description, ""),
    "createdAt": $item.createdAt,
    "updatedAt": $item.updatedAt
  })
  ## Include code if it exists on member (for now, show to everyone)
  #if($item.code)
    $util.qr($mappedItem.put("code", $item.code))
  #end
  $util.qr($items.add($mappedItem))
#end
$util.toJson({
  "items": $items,
  "nextToken": $result.nextToken
})`
    ),
  });

  // Query.getLeagueByCode resolver
  // Finds a league by its join code using the byCode GSI
  dataSource.createResolver("GetLeagueByCodeResolver", {
    typeName: "Query",
    fieldName: "getLeagueByCode",
    requestMappingTemplate: appsync.MappingTemplate.fromString(
      `{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byCode",
  "query": {
    "expression": "byCode = :code",
    "expressionValues": {
      ":code": $util.dynamodb.toDynamoDBJson($ctx.args.byCode)
    }
  },
  "filter": {
    "expression": "entityType = :entityType",
    "expressionValues": {
      ":entityType": $util.dynamodb.toDynamoDBJson("LEAGUE")
    }
  },
  "limit": 1
}`
    ),
    responseMappingTemplate: appsync.MappingTemplate.fromString(
      `#set($items = $ctx.result.items)
#if($items.isEmpty())
  #return
#end
#set($league = $items.get(0))
$util.toJson({
  "PK": $league.PK,
  "SK": $league.SK,
  "entityType": $league.entityType,
  "leagueId": $league.leagueId,
  "name": $league.name,
  "createdByUserId": $league.createdByUserId,
  "createdAt": $league.createdAt,
  "byCode": $league.byCode,
  "description": $league.description
})`
    ),
  });
}

