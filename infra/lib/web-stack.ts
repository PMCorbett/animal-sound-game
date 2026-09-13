import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";

export interface WebStackProps extends cdk.StackProps {}

export class WebStack extends cdk.Stack {
  readonly distributionDomainName: string;
  readonly websiteUrl: string;

  constructor(scope: Construct, id: string, props?: WebStackProps) {
    super(scope, id, props);

    const websiteBucket = new s3.Bucket(this, "WebsiteBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const assetsBucket = new s3.Bucket(this, "AssetsBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket),
        viewerProtocolPolicy:
          cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        "/sounds/*": {
          origin: origins.S3BucketOrigin.withOriginAccessControl(assetsBucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.minutes(5),
        },
      ],
    });

    const repoRoot = path.join(__dirname, "..", "..");
    const webDistPath = path.join(repoRoot, "apps", "web", "dist");
    const soundsPath = path.join(repoRoot, "assets", "sounds");

    new s3deploy.BucketDeployment(this, "DeployWebsite", {
      sources: [s3deploy.Source.asset(webDistPath)],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ["/*"],
      prune: true,
    });

    new s3deploy.BucketDeployment(this, "DeploySounds", {
      sources: [s3deploy.Source.asset(soundsPath)],
      destinationBucket: assetsBucket,
      destinationKeyPrefix: "sounds",
      distribution,
      distributionPaths: ["/sounds/*"],
      prune: true,
    });

    this.distributionDomainName = distribution.distributionDomainName;
    this.websiteUrl = `https://${distribution.distributionDomainName}`;

    new cdk.CfnOutput(this, "WebsiteUrl", {
      value: this.websiteUrl,
      description: "CloudFront URL for the web app",
    });

    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: distribution.distributionDomainName,
      exportName: `${this.stackName}-DistributionDomain`,
    });

    new cdk.CfnOutput(this, "AssetsBaseUrl", {
      value: `${this.websiteUrl}/sounds`,
      description: "Base URL for reference animal sounds",
    });
  }
}
