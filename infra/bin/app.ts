#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ApiStack } from "../lib/api-stack";
import { CiStack } from "../lib/ci-stack";
import { WebStack } from "../lib/web-stack";

const app = new cdk.App();

const githubRepo =
  app.node.tryGetContext("githubRepo") ?? "PMCorbett/animal-sound-game";
const githubOwnerId =
  app.node.tryGetContext("githubOwnerId") ?? "15815504";
const githubRepoId =
  app.node.tryGetContext("githubRepoId") ?? "1367630187";

const AWS_ACCOUNT_ID = "963777545862";

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT ?? AWS_ACCOUNT_ID,
  region: process.env.CDK_DEFAULT_REGION ?? "eu-west-2",
};

const webStack = new WebStack(app, "AnimalSoundGame-WebStack", {
  env,
  description: "Animal Sound Game — S3, CloudFront, reference sounds",
});

const apiStack = new ApiStack(app, "AnimalSoundGame-ApiStack", {
  env,
  description: "Animal Sound Game — API Gateway, Lambda, DynamoDB",
  allowedOrigins: [
    `https://${webStack.distributionDomainName}`,
    "http://localhost:5173",
  ],
});
apiStack.addStackDependency(webStack);

new CiStack(app, "AnimalSoundGame-CiStack", {
  env,
  description: "Animal Sound Game — GitHub Actions OIDC deploy role",
  githubRepo,
  githubOwnerId,
  githubRepoId,
});
