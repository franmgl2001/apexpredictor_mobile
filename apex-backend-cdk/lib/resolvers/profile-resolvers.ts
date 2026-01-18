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
  dataSource: appsync.DynamoDbDataSource
) {
  // Mutation.upsertMyProfile resolver
  dataSource.createResolver("UpsertMyProfileResolver", {
    typeName: "Mutation",
    fieldName: "upsertMyProfile",
    requestMappingTemplate: appsync.MappingTemplate.fromString(`
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "PK": { "S": "USER#\${ctx.identity.sub}" },
    "SK": { "S": "PROFILE" }
  },
  "attributeValues": {
    "userId": { "S": "\${ctx.identity.sub}" },
    "email": { "S": "\${ctx.args.input.email}" },
    "username": { "S": "\${ctx.args.input.username}" },
    "country": { "S": "\${ctx.args.input.country}" },
    "createdAt": { "S": "\${util.time.nowISO8601()}" },
    "updatedAt": { "S": "\${util.time.nowISO8601()}" }
  }
}
    `),
    responseMappingTemplate: appsync.MappingTemplate.fromString(`
$util.toJson({
  "userId": $ctx.identity.sub,
  "email": $ctx.args.input.email,
  "username": $ctx.args.input.username,
  "country": $ctx.args.input.country,
  "createdAt": $util.time.nowISO8601(),
  "updatedAt": $util.time.nowISO8601()
})
    `),
  });

  // Query.getMyProfile resolver (gets user from token)
  dataSource.createResolver("GetMyProfileResolver", {
    typeName: "Query",
    fieldName: "getMyProfile",
    requestMappingTemplate: appsync.MappingTemplate.fromString(`
{
  "version": "2018-05-29",
  "operation": "GetItem",
  "key": {
    "PK": { "S": "USER#\${ctx.identity.sub}" },
    "SK": { "S": "PROFILE" }
  }
}
    `),
    responseMappingTemplate: appsync.MappingTemplate.fromString(`
#set($profile = $ctx.result)
#if($util.isNull($profile))
$util.toJson(null)
#else
$util.toJson({
  "userId": $profile.userId,
  "email": $profile.email,
  "username": $profile.username,
  "country": $profile.country,
  "createdAt": $profile.createdAt,
  "updatedAt": $profile.updatedAt
})
#end
    `),
  });
}

