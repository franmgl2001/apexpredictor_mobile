import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
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
      removalPolicy: cdk.RemovalPolicy.DESTROY, // change to RETAIN for prod
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


    // (Optional but common) Create an App Client for your RN app
    // If you ALREADY have a client ID you want to keep, skip this and output your existing one.
    const userPoolClient = new cognito.CfnUserPoolClient(this, "MobileAppClient", {
      userPoolId: "us-east-2_O43Zxwqdm",
      clientName: "apex-react-native",
      generateSecret: false, // IMPORTANT for public clients (mobile/web)
      explicitAuthFlows: [
        "ALLOW_USER_PASSWORD_AUTH",
        "ALLOW_USER_SRP_AUTH",
        "ALLOW_REFRESH_TOKEN_AUTH",
      ],
      preventUserExistenceErrors: "ENABLED",
    });

    // 4) Outputs (what frontend needs)
    new cdk.CfnOutput(this, "Region", { value: this.region });
    new cdk.CfnOutput(this, "UserPoolId", { value: "us-east-2_O43Zxwqdm" });
    new cdk.CfnOutput(this, "UserPoolClientId", { value: userPoolClient.ref });
    new cdk.CfnOutput(this, "GraphqlUrl", { value: api.graphqlUrl });
    new cdk.CfnOutput(this, "DynamoTableName", { value: table.tableName });
  }
}
