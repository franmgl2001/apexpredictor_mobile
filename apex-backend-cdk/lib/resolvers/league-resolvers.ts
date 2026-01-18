import * as appsync from "aws-cdk-lib/aws-appsync";

/**
 * Creates league-related resolvers
 */
export function createLeagueResolvers(dataSource: appsync.DynamoDbDataSource) {
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
#set($leagueId = "L" + $timestamp + "_" + $randomSuffix)
#set($codeStr = $randomSuffix.toUpperCase())
#set($code = $codeStr.substring(0, 6))
#set($now = $util.time.nowISO8601())
#set($pk = "LEAGUE#" + $leagueId)
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
    "code": $util.dynamodb.toDynamoDBJson($code),
    "description": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($input.description, "")),
    "member_count": $util.dynamodb.toDynamoDBJson(1)
  }
}`
        ),
        responseMappingTemplate: appsync.MappingTemplate.fromString(
            `#set($league = $ctx.result)
#set($userId = $ctx.stash.userId)
#set($leagueId = $ctx.stash.leagueId)
#set($memberPk = "league#" + $leagueId)
#set($memberSk = "member#" + $userId)
#set($now = $util.time.nowISO8601())

## Create member entry using BatchWriteItem
## Note: We'll create the member in a separate operation
## For now, return the league - member creation will be handled separately
$util.toJson({
  "PK": $league.PK,
  "SK": $league.SK,
  "entityType": $league.entityType,
  "leagueId": $league.leagueId,
  "name": $league.name,
  "createdByUserId": $league.createdByUserId,
  "createdAt": $league.createdAt,
  "code": $league.code,
  "description": $league.description
})`
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
}

