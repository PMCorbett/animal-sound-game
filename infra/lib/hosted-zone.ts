import * as route53 from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

export function resolveHostedZone(
  scope: Construct,
  id: string,
  zoneName: string,
  zoneId?: string,
): route53.IHostedZone {
  if (zoneId) {
    return route53.HostedZone.fromHostedZoneAttributes(scope, id, {
      hostedZoneId: zoneId,
      zoneName,
    });
  }

  return route53.HostedZone.fromLookup(scope, id, {
    domainName: zoneName,
  });
}
