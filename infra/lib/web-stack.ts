import * as path from "node:path";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import { resolveHostedZone } from "./hosted-zone";

export interface WebStackProps extends cdk.StackProps {
  certificate: acm.ICertificate;
  domainName: string;
  hostedZoneDomain: string;
  hostedZoneId?: string;
}

export class WebStack extends cdk.Stack {
  readonly distributionDomainName: string;
  readonly websiteUrl: string;
  readonly customDomainUrl: string;

  constructor(scope: Construct, id: string, props: WebStackProps) {
    super(scope, id, props);

    const hostedZone = resolveHostedZone(
      this,
      "HostedZone",
      props.hostedZoneDomain,
      props.hostedZoneId,
    );

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
      domainNames: [props.domainName],
      certificate: props.certificate,
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

    const recordName = props.domainName.replace(
      new RegExp(`\\.${props.hostedZoneDomain}$`),
      "",
    );

    new route53.ARecord(this, "AliasRecord", {
      zone: hostedZone,
      recordName,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution),
      ),
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
    this.customDomainUrl = `https://${props.domainName}`;
    this.websiteUrl = this.customDomainUrl;

    new cdk.CfnOutput(this, "WebsiteUrl", {
      value: this.websiteUrl,
      description: "Primary URL for the web app (custom domain)",
    });

    new cdk.CfnOutput(this, "CustomDomainUrl", {
      value: this.customDomainUrl,
      description: "Custom domain URL",
    });

    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: distribution.distributionDomainName,
      exportName: `${this.stackName}-DistributionDomain`,
      description: "CloudFront distribution domain (fallback)",
    });

    new cdk.CfnOutput(this, "AssetsBaseUrl", {
      value: `${this.customDomainUrl}/sounds`,
      description: "Base URL for reference animal sounds",
    });
  }
}
