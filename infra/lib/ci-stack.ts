import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export interface CiStackProps extends cdk.StackProps {
  githubRepo: string;
}

function githubSubPatterns(owner: string, repo: string): string[] {
  const owners = new Set([owner, owner.toLowerCase()]);
  return [...owners].map((o) => `repo:${o}/${repo}:*`);
}

export class CiStack extends cdk.Stack {
  readonly deployRoleArn: string;

  constructor(scope: Construct, id: string, props: CiStackProps) {
    super(scope, id, props);

    const [owner, repo] = props.githubRepo.split("/");
    if (!owner || !repo) {
      throw new Error(`Invalid githubRepo: ${props.githubRepo}`);
    }

    const subPatterns = githubSubPatterns(owner, repo);

    // CDK custom resource creates or updates the provider (incl. thumbprints).
    const provider = new iam.OpenIdConnectProvider(this, "GitHubOidcProvider", {
      url: "https://token.actions.githubusercontent.com",
      clientIds: ["sts.amazonaws.com"],
    });

    const deployRole = new iam.Role(this, "GitHubActionsDeployRole", {
      roleName: "AnimalSoundGame-GitHubActionsDeploy",
      assumedBy: new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, {
        StringEquals: {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:iss":
            "https://token.actions.githubusercontent.com",
        },
        StringLike: {
          "token.actions.githubusercontent.com:sub": subPatterns,
        },
      }),
      description: "Role assumed by GitHub Actions to deploy Animal Sound Game",
      maxSessionDuration: cdk.Duration.hours(1),
    });

    deployRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AdministratorAccess"),
    );

    this.deployRoleArn = deployRole.roleArn;

    new cdk.CfnOutput(this, "GitHubActionsRoleArn", {
      value: deployRole.roleArn,
      description: "Set as AWS_ROLE_ARN in GitHub repository secrets",
      exportName: `${this.stackName}-GitHubActionsRoleArn`,
    });

    new cdk.CfnOutput(this, "GitHubOidcProviderArn", {
      value: provider.openIdConnectProviderArn,
    });

    new cdk.CfnOutput(this, "GitHubOidcSubPatterns", {
      value: subPatterns.join(", "),
      description:
        "GitHub OIDC sub claim must match one of these (see github.repository in Actions logs)",
    });
  }
}
