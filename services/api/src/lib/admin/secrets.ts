import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

export interface AdminAuthSecrets {
  githubClientSecret: string;
  sessionSecret: string;
}

let cachedSecrets: AdminAuthSecrets | null = null;

function secretsFromEnv(): AdminAuthSecrets {
  return {
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET?.trim() ?? "",
    sessionSecret: process.env.SESSION_SECRET?.trim() ?? "",
  };
}

export async function loadAdminAuthSecrets(): Promise<AdminAuthSecrets> {
  if (cachedSecrets) {
    return cachedSecrets;
  }

  const secretArn = process.env.ADMIN_AUTH_SECRET_ARN?.trim();
  if (!secretArn) {
    cachedSecrets = secretsFromEnv();
    return cachedSecrets;
  }

  const client = new SecretsManagerClient({});
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretArn }),
  );

  if (!response.SecretString) {
    throw new Error("Admin auth secret is empty");
  }

  const parsed = JSON.parse(response.SecretString) as {
    githubClientSecret?: string;
    sessionSecret?: string;
  };

  cachedSecrets = {
    githubClientSecret: parsed.githubClientSecret?.trim() ?? "",
    sessionSecret: parsed.sessionSecret?.trim() ?? "",
  };

  return cachedSecrets;
}

export function clearAdminAuthSecretsCache(): void {
  cachedSecrets = null;
}
