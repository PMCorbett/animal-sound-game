#!/usr/bin/env bash
# Fix GitHub Actions OIDC provider thumbprints and audience in AWS IAM.
# Run once if GitHub Actions fails with:
#   "The web identity token provided could not be validated"
#
# Usage: AWS_PROFILE=your-profile ./scripts/fix-github-oidc.sh

set -euo pipefail

ACCOUNT_ID="${AWS_ACCOUNT_ID:-963777545862}"
PROVIDER_ARN="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"

echo "Checking OIDC provider: ${PROVIDER_ARN}"
aws iam get-open-id-connect-provider --open-id-connect-provider-arn "${PROVIDER_ARN}"

echo ""
echo "Updating thumbprints (40-char SHA-1, per GitHub/AWS docs)..."
aws iam update-open-id-connect-provider-thumbprint \
  --open-id-connect-provider-arn "${PROVIDER_ARN}" \
  --thumbprint-list \
    6938fd4d98bab03faadb97b34396831e3780aea1 \
    1c58a3a8518e8759bf075b76b750d4f2df264fcd

echo ""
echo "Ensuring audience client ID sts.amazonaws.com is registered..."
if aws iam get-open-id-connect-provider \
  --open-id-connect-provider-arn "${PROVIDER_ARN}" \
  --query 'ClientIDList' \
  --output text | grep -q 'sts.amazonaws.com'; then
  echo "sts.amazonaws.com already present"
else
  aws iam add-client-id-to-open-id-connect-provider \
    --open-id-connect-provider-arn "${PROVIDER_ARN}" \
    --client-id sts.amazonaws.com
fi

echo ""
echo "Done. Re-run the GitHub Actions deploy workflow."
