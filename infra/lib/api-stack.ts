import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

export interface ApiStackProps extends cdk.StackProps {
  allowedOrigins: string[];
  webAdminSuccessUrl: string;
}

export class ApiStack extends cdk.Stack {
  readonly apiUrl: string;
  readonly webSocketUrl: string;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const scoresTable = new dynamodb.Table(this, "ScoresTable", {
      tableName: "AnimalSoundGame-Scores",
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "ttl",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const adminAuthSecret = new secretsmanager.Secret(this, "AdminAuthSecret", {
      secretName: "animal-sound-game/admin-auth",
      description:
        "Admin session signing key and GitHub OAuth client secret (update githubClientSecret after creating the OAuth app)",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ githubClientSecret: "REPLACE_ME" }),
        generateStringKey: "sessionSecret",
        passwordLength: 48,
        excludePunctuation: true,
      },
    });

    const githubOAuthClientId =
      this.node.tryGetContext("githubOAuthClientId") ?? "";

    const lambdaBundling = {
      minify: true,
      sourceMap: true,
      target: "node22",
    };

    const apiHandler = new NodejsFunction(this, "ApiHandler", {
      entry: path.join(
        __dirname,
        "..",
        "..",
        "services",
        "api",
        "src",
        "handler.ts",
      ),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      environment: {
        SCORES_TABLE_NAME: scoresTable.tableName,
        GITHUB_CLIENT_ID: githubOAuthClientId,
        ADMIN_GITHUB_ALLOWLIST: "PMCorbett",
        WEB_ADMIN_SUCCESS_URL: props.webAdminSuccessUrl,
        ADMIN_AUTH_SECRET_ARN: adminAuthSecret.secretArn,
      },
      bundling: lambdaBundling,
    });

    adminAuthSecret.grantRead(apiHandler);

    const wsHandler = new NodejsFunction(this, "WsHandler", {
      entry: path.join(
        __dirname,
        "..",
        "..",
        "services",
        "api",
        "src",
        "ws-handler.ts",
      ),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      environment: {
        SCORES_TABLE_NAME: scoresTable.tableName,
      },
      bundling: lambdaBundling,
    });

    scoresTable.grantReadWriteData(apiHandler);
    scoresTable.grantReadWriteData(wsHandler);

    const webSocketApi = new apigwv2.WebSocketApi(this, "WebSocketApi", {
      apiName: "animal-sound-game-ws",
      connectRouteOptions: {
        integration: new integrations.WebSocketLambdaIntegration(
          "WsConnectIntegration",
          wsHandler,
        ),
      },
      disconnectRouteOptions: {
        integration: new integrations.WebSocketLambdaIntegration(
          "WsDisconnectIntegration",
          wsHandler,
        ),
      },
    });

    const webSocketStage = new apigwv2.WebSocketStage(this, "WebSocketStage", {
      webSocketApi,
      stageName: "prod",
      autoDeploy: true,
    });

    const managementApiEndpoint = `https://${webSocketApi.apiId}.execute-api.${this.region}.amazonaws.com/${webSocketStage.stageName}`;
    apiHandler.addEnvironment(
      "WEBSOCKET_API_ENDPOINT",
      managementApiEndpoint,
    );

    const manageConnectionsPolicy = new iam.PolicyStatement({
      actions: ["execute-api:ManageConnections"],
      resources: [
        `arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.apiId}/${webSocketStage.stageName}/POST/@connections/*`,
      ],
    });
    apiHandler.addToRolePolicy(manageConnectionsPolicy);

    const httpApi = new apigwv2.HttpApi(this, "HttpApi", {
      apiName: "animal-sound-game",
      corsPreflight: {
        allowHeaders: ["Content-Type", "X-Requested-With"],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.PATCH,
          apigwv2.CorsHttpMethod.DELETE,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: props.allowedOrigins,
        allowCredentials: true,
        maxAge: cdk.Duration.hours(1),
      },
    });

    apiHandler.addEnvironment(
      "ADMIN_OAUTH_REDIRECT_URI",
      `${httpApi.apiEndpoint}/admin/auth/callback`,
    );

    const integration = new integrations.HttpLambdaIntegration(
      "ApiIntegration",
      apiHandler,
    );

    // Do not register OPTIONS on Lambda routes — HttpApi corsPreflight handles
    // preflight; explicit OPTIONS integrations return 404 without CORS method headers.
    const routes: Array<{
      path: string;
      methods: apigwv2.HttpMethod[];
    }> = [
      { path: "/leaderboard", methods: [apigwv2.HttpMethod.GET] },
      {
        path: "/scores",
        methods: [apigwv2.HttpMethod.GET, apigwv2.HttpMethod.POST],
      },
      { path: "/admin/auth/github", methods: [apigwv2.HttpMethod.GET] },
      { path: "/admin/auth/callback", methods: [apigwv2.HttpMethod.GET] },
      { path: "/admin/session", methods: [apigwv2.HttpMethod.GET] },
      { path: "/admin/logout", methods: [apigwv2.HttpMethod.POST] },
      { path: "/admin/leaderboard", methods: [apigwv2.HttpMethod.GET] },
      {
        path: "/admin/scores",
        methods: [apigwv2.HttpMethod.PATCH, apigwv2.HttpMethod.DELETE],
      },
    ];

    for (const { path: routePath, methods } of routes) {
      httpApi.addRoutes({
        path: routePath,
        methods,
        integration,
      });
    }

    const stage = httpApi.defaultStage!;
    const cfnStage = stage.node.defaultChild as apigwv2.CfnStage;
    cfnStage.defaultRouteSettings = {
      throttlingBurstLimit: 50,
      throttlingRateLimit: 25,
    };

    this.apiUrl = httpApi.apiEndpoint;
    this.webSocketUrl = webSocketStage.url;

    new cdk.CfnOutput(this, "ApiUrl", {
      value: this.apiUrl,
      description: "HTTP API endpoint URL",
      exportName: `${this.stackName}-ApiUrl`,
    });

    new cdk.CfnOutput(this, "AdminOAuthCallbackUrl", {
      value: `${this.apiUrl}/admin/auth/callback`,
      description: "GitHub OAuth app authorization callback URL",
    });

    new cdk.CfnOutput(this, "WebSocketUrl", {
      value: this.webSocketUrl,
      description: "WebSocket API endpoint URL",
      exportName: `${this.stackName}-WebSocketUrl`,
    });

    new cdk.CfnOutput(this, "ScoresTableName", {
      value: scoresTable.tableName,
    });

    new cdk.CfnOutput(this, "AdminAuthSecretArn", {
      value: adminAuthSecret.secretArn,
      description: "Secrets Manager ARN — set githubClientSecret JSON field after OAuth app creation",
    });
  }
}
