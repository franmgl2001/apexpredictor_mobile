import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito"; // (leave yours as-is if it works)
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as appsync from "aws-cdk-lib/aws-appsync";
import path from "path";

export class ApexBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1) Import existing User Pool (kept as-is)
    const userPool = cognito.UserPool.fromUserPoolId(
      this,
      "ExistingUserPool",
      "us-east-2_O43Zxwqdm"
    );

    // 2) DynamoDB table (single-table style)
    const table = new dynamodb.Table(this, "ApexEntityTable", {
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 3) AppSync API using Cognito User Pool auth
    const api = new appsync.GraphqlApi(this, "ApexApi", {
      name: "ApexApi",
      definition: appsync.Definition.fromFile(
        path.join(__dirname, "../graphql/schema.graphql")
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: { userPool },
        },
      },
      xrayEnabled: true,
    });

    // =========================
    // ✅ ADD RESOLVERS HERE
    // =========================

    // DynamoDB datasource
    const profileDS = api.addDynamoDbDataSource("UserProfileDS", table);

    // Mutation.upsertMyProfile resolver
    profileDS.createResolver("UpsertMyProfileResolver", {
      typeName: "Mutation",
      fieldName: "upsertMyProfile",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "PK": { "S": "user#\${ctx.identity.sub}" },
    "SK": { "S": "PROFILE" }
  },
  "attributeValues": {
    "user_id": { "S": "\${ctx.identity.sub}" },
    "email": { "S": "\${ctx.args.input.email}" },
    "username": { "S": "\${ctx.args.input.username}" },
    "country": { "S": "\${ctx.args.input.country}" },
    "createdAt": { "S": "\${util.time.nowISO8601()}" },
    "updatedAt": { "S": "\${util.time.nowISO8601()}" }
  }
}
      `),
      // IMPORTANT: PutItem may not return an item → return what your GraphQL expects
      responseMappingTemplate: appsync.MappingTemplate.fromString(`
$util.toJson({
  "user_id": $ctx.identity.sub,
  "email": $ctx.args.input.email,
  "username": $ctx.args.input.username,
  "country": $ctx.args.input.country,
  "createdAt": $util.time.nowISO8601(),
  "updatedAt": $util.time.nowISO8601()
})
      `),
    });

    // Query.getMyProfile resolver
    profileDS.createResolver("GetMyProfileResolver", {
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
$util.toJson($ctx.result)
      `),
    });

    // =========================
    // (Optional) App Client
    // =========================
    const userPoolClient = new cognito.CfnUserPoolClient(
      this,
      "MobileAppClient",
      {
        userPoolId: "us-east-2_O43Zxwqdm",
        clientName: "apex-react-native",
        generateSecret: false,
        explicitAuthFlows: [
          "ALLOW_USER_PASSWORD_AUTH",
          "ALLOW_USER_SRP_AUTH",
          "ALLOW_REFRESH_TOKEN_AUTH",
        ],
        preventUserExistenceErrors: "ENABLED",
      }
    );

    // 4) Outputs (what frontend needs)
    new cdk.CfnOutput(this, "Region", { value: this.region });
    new cdk.CfnOutput(this, "UserPoolId", { value: "us-east-2_O43Zxwqdm" });
    new cdk.CfnOutput(this, "UserPoolClientId", { value: userPoolClient.ref });
    new cdk.CfnOutput(this, "GraphqlUrl", { value: api.graphqlUrl });
    new cdk.CfnOutput(this, "DynamoTableName", { value: table.tableName });
  }
}
