import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { resolveHostedZone } from "./hosted-zone";

export interface CertificateStackProps extends cdk.StackProps {
  domainName: string;
  hostedZoneDomain: string;
  hostedZoneId?: string;
}

export class CertificateStack extends cdk.Stack {
  readonly certificate: acm.Certificate;

  constructor(scope: Construct, id: string, props: CertificateStackProps) {
    super(scope, id, props);

    const hostedZone = resolveHostedZone(
      this,
      "HostedZone",
      props.hostedZoneDomain,
      props.hostedZoneId,
    );

    this.certificate = new acm.Certificate(this, "Certificate", {
      domainName: props.domainName,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    new cdk.CfnOutput(this, "CertificateArn", {
      value: this.certificate.certificateArn,
      description: "ACM certificate ARN (us-east-1, for CloudFront)",
    });
  }
}
