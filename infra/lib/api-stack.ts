import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

export interface ApiStackProps extends cdk.StackProps {
  allowedOrigins: string[];
}

export class ApiStack extends cdk.Stack {
  readonly apiUrl: string;

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
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: "node22",
      },
    });

    scoresTable.grantReadWriteData(apiHandler);

    const httpApi = new apigwv2.HttpApi(this, "HttpApi", {
      apiName: "animal-sound-game",
      corsPreflight: {
        allowHeaders: ["Content-Type"],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: props.allowedOrigins,
        maxAge: cdk.Duration.hours(1),
      },
    });

    const integration = new integrations.HttpLambdaIntegration(
      "ApiIntegration",
      apiHandler,
    );

    httpApi.addRoutes({
      path: "/leaderboard",
      methods: [apigwv2.HttpMethod.GET],
      integration,
    });

    httpApi.addRoutes({
      path: "/scores",
      methods: [apigwv2.HttpMethod.POST],
      integration,
    });

    const stage = httpApi.defaultStage!;
    const cfnStage = stage.node.defaultChild as apigwv2.CfnStage;
    cfnStage.defaultRouteSettings = {
      throttlingBurstLimit: 50,
      throttlingRateLimit: 25,
    };

    this.apiUrl = httpApi.apiEndpoint;

    new cdk.CfnOutput(this, "ApiUrl", {
      value: this.apiUrl,
      description: "HTTP API endpoint URL",
      exportName: `${this.stackName}-ApiUrl`,
    });

    new cdk.CfnOutput(this, "ScoresTableName", {
      value: scoresTable.tableName,
    });
  }
}
