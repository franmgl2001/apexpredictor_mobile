import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as appsync from "aws-cdk-lib/aws-appsync";
import path from "path";
import { createProfileResolvers } from "./resolvers/profile-resolvers";
import { createAssetsResolvers } from "./resolvers/assets-resolvers";
import { createPredictionsResolvers } from "./resolvers/predictions-resolvers";
import { createLeaderboardResolvers } from "./resolvers/leaderboard-resolvers";
import { createLeagueResolvers } from "./resolvers/league-resolvers";

export class ApexBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1) Create a new User Pool
    const userPool = new cognito.UserPool(this, "ApexUserPool", {
      userPoolName: "ApexUserPool",
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 2) DynamoDB table (single-table style)
    const table = new dynamodb.Table(this, "ApexEntityTable", {
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add GSI1: USER#<userId> / RACE#<category>#<season>#<raceId>
    table.addGlobalSecondaryIndex({
      indexName: "byUser",
      partitionKey: { name: "byUserPK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "byUserSK", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Add GSI2: LEAGUE#<code>
    table.addGlobalSecondaryIndex({
      indexName: "byCode",
      partitionKey: { name: "byCode", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Add GSI3: LEADERBOARD#<category>#<season> / <paddedPoints>#USER#<userId> (for sorted leaderboard queries)
    table.addGlobalSecondaryIndex({
      indexName: "byLeaderboard",
      partitionKey: { name: "byLeaderboardPK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "byLeaderboardSK", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
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
    // ✅ RESOLVERS
    // =========================

    // DynamoDB datasource
    const profileDS = api.addDynamoDbDataSource("UserProfileDS", table);

    // Create profile resolvers (user profile queries and mutations)
    createProfileResolvers(profileDS, table.tableName, api);

    // Create assets resolvers (races, drivers, results queries)
    createAssetsResolvers(profileDS);

    // Create predictions resolvers (race prediction queries and mutations)
    createPredictionsResolvers(profileDS);

    // Create leaderboard resolvers (total points leaderboard queries and mutations)
    createLeaderboardResolvers(profileDS);

    // Create league resolvers (league creation and management)
    createLeagueResolvers(profileDS, table.tableName);


    // =========================
    // ✅ App Client
    // =========================
    const userPoolClient = userPool.addClient("MobileAppClient", {
      userPoolClientName: "apex-react-native",
      authFlows: {
        userSrp: true,
        userPassword: true,
      },
      preventUserExistenceErrors: true,
    });

    // 4) Outputs (what frontend needs)
    new cdk.CfnOutput(this, "Region", { value: this.region });
    new cdk.CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, "GraphqlUrl", { value: api.graphqlUrl });
    new cdk.CfnOutput(this, "DynamoTableName", { value: table.tableName });
  }
}
