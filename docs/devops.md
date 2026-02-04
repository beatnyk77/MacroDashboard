# Supabase Edge Functions CI/CD

This document outlines the fully automated CI/CD pipeline for deploying Supabase Edge Functions.

## CI/CD Flow

The deployment is handled by a GitHub Actions workflow defined in `.github/workflows/deploy-supabase-functions.yml`.

1. **Trigger**: The workflow is triggered automatically on every push to the `main` branch, but only if files within the `supabase/functions/**` directory have changed. It can also be triggered manually via the "Actions" tab in GitHub (using `workflow_dispatch`).
2. **Environment**: The workflow runs on the latest Ubuntu runner.
3. **Internal Steps**:
   - Checks out the repository code.
   - Installs the Supabase CLI.
   - Links the project using `SUPABASE_PROJECT_ID`.
   - Deploys all functions to the linked project using `SUPABASE_ACCESS_TOKEN`.

## Required GitHub Secrets

To make this workflow function correctly, the following repository secrets must be configured in GitHub (Settings > Secrets and variables > Actions):

- `SUPABASE_ACCESS_TOKEN`: A Supabase Personal Access Token (PAT).
- `SUPABASE_PROJECT_ID`: The project reference ID (e.g., `debdriyzfcwvgrhzzzre`).

## Rotating the Supabase Access Token

If you need to rotate the access token:
1. Go to your [Supabase Dashboard > Account > Access Tokens](https://supabase.com/dashboard/account/tokens).
2. Generate a new token and copy it.
3. Go to your GitHub repository > Settings > Secrets and variables > Actions.
4. Update the `SUPABASE_ACCESS_TOKEN` secret with the new value.
5. To re-run the deployment, you can manually trigger the "Deploy Supabase Edge Functions" workflow from the Actions tab or push a dummy change to any file under `supabase/functions/`.

## Manual Verification

You can verify the status of the deployment in the "Actions" tab of your GitHub repository. The "Debug Project ID" step in the workflow will print the length of the project ID to confirm that the secret is correctly loaded without exposing the secret itself.
