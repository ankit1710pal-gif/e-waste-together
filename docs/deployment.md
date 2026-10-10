# AWS and GitHub deployment runbook

Date: 2026-10-10 (Asia/Kolkata). **No deployment performed.** Browser AWS sign-in reported by user; local credentials and permissions unverified.

## Choose the route

**Console route:** push this tested source to your GitHub repository; connect that repository/branch in Amplify using your existing AWS browser session. This does not require local CLI credentials for Amplify's build.

**Local sandbox route:** install official AWS CLI, configure an authenticated profile, then run the included sandbox script. A sandbox provisions actual AWS resources and can incur charges.

## Required access

AWS documents `AmplifyBackendDeployFullAccess` as the managed deployment policy for the local role/permission set. It is broad Amplify/CDK deployment access, not a bespoke least-privilege policy. Prefer temporary IAM Identity Center/SSO credentials where already configured. An account administrator must create/assign roles and establish any missing bootstrap requirements. Do not grant yourself permissions through the app.

Amplify Hosting needs its own service role: use the console's **Amplify - Backend Deployment** role setup or the existing approved deployment role. The console operator also needs permission to create/manage the Amplify app and pass the selected role; missing IAM grants must be supplied by the account administrator. Do not blindly add AdministratorAccess as a fix.

GitHub: authenticate through its supported sign-in, and grant the Amplify GitHub integration access to the intended repository. No passwords/tokens/access keys in chat or Git.

Sources: [local account setup](https://docs.amplify.aws/react/start/account-setup/), [Hosting service role](https://docs.aws.amazon.com/amplify/latest/userguide/amplify-service-role.html), [fullstack Hosting](https://docs.amplify.aws/react/deploy-and-host/amplify-hosting/).

## Local cloud setup (optional)

Download the [official Windows AWS CLI installer](https://awscli.amazonaws.com/AWSCLIV2.msi). Complete installation and browser login yourself when required.

```powershell
aws configure sso --profile e-waste-dev
aws sso login --profile e-waste-dev
aws sts get-caller-identity --profile e-waste-dev
```

If IAM Identity Center is not already configured, follow the official account setup with the account administrator rather than inventing SSO values. A console login does not automatically supply CLI credentials.

After deployment authorisation and region verification:

```powershell
$env:AWS_REGION = 'eu-north-1'
npm run sandbox -- --profile e-waste-dev
```

Use `eu-north-1` as the plan's preference. Availability, account policies, service quotas and account/credit eligibility must be verified before provisioning; discuss a regional change before using another region. Keep the sandbox process running to observe changes. It generates ignored `amplify_outputs.json`.

Create a local `.env.local` with `VITE_DATA_MODE=aws` and restart Vite to use real Auth/Data/Storage. Do not commit it. Without generated outputs, the app displays a setup error.

## GitHub and Hosting

1. Use the verified repository [ankit1710pal-gif/e-waste-together](https://github.com/ankit1710pal-gif/e-waste-together), branch `main`. Source and lockfile were already published by the user; local and remote initial commit matched on 2026-10-10.
2. Inspect new changes for secrets/real records, commit and push the intended branch while preserving existing history. Generated outputs, local environment files and AWS credentials are ignored.
3. In AWS Amplify, create an app connected to this repository and branch.
4. Select the approved backend deployment service role and verify region/build-image Node compatibility (Node 22.12+ or 24).
5. Use the included `amplify.yml`: `npm ci` → `ampx pipeline-deploy` → tests and backend TypeScript check → Vite build with AWS mode. Output directory is `dist`. Do not use a frontend-only drag/drop deployment.
6. Inspect backend and frontend build results. The deployment must generate branch-specific client outputs before the frontend build.
7. Record the app ID, commit, region, URL and provisioned resources in CP-06B, then complete hosted checks in CP-06C.

## Trusted admission and organiser assignment

Signup creates an authenticated Cognito user but **does not admit them**. In the deployed Cognito user pool, a trusted AWS administrator checks campus membership and adds residents to `IIITM_MEMBERS`. Add designated organisers to `IIITM_ORGANISERS`. Residents cannot assign either group through an API or custom profile field.

Use a development branch for synthetic test accounts/records. Keep its results out of production pilot reporting. After assigning/removing groups, sign out and in again to refresh Cognito tokens. Revocation is subject to token lifetime; disable/revoke sessions as needed through the trusted AWS administration process.

## Hosted acceptance checklist — all unverified

- [ ] Backend and frontend deployed; actual commit and URL recorded.
- [ ] New unadmitted signup denied dashboard/actions/storage.
- [ ] Two admitted residents see only their own private requests/photos.
- [ ] Resident cannot invoke review, confirmation, handover, cancellation or evidence directly through API.
- [ ] Unrelated Cognito groups cannot access campus records.
- [ ] Organiser can complete review → assignment → confirmation → partial handover.
- [ ] Browser reload and a separate authenticated session verify persistence.
- [ ] Repeated action IDs do not duplicate handovers; competing revisions conflict safely.
- [ ] S3 objects remain private; another resident cannot fetch photos/receipts; signed URLs expire.
- [ ] Valid uploads succeed with actual S3 CORS; unsupported/oversized uploads fail.
- [ ] Estimates and measured/evidenced totals match known branch test records.
- [ ] Withdrawal, no-show, cancellation and closure preserve truthful totals.
- [ ] Phone layout and keyboard/modal focus usable on hosted site.
- [ ] CloudWatch logs show error type only; no contact data or payloads.

## Spending and teardown

Inspect available credits, account plan and covered services. Set a user-approved AWS Budget and notifications before provisioning; an alert is not a hard spending cap. Actual charges depend on resources and traffic, not just whether the app is opened.

The pilot state table has `RemovalPolicy.RETAIN` and point-in-time recovery. **Deleting a sandbox/stack does not delete this table**; retained tables/backups can continue charging. Export authorised data first, then inspect remaining DynamoDB, S3, CloudWatch and deployment resources with the account administrator. Request explicit authorisation before irreversible record deletion.

```powershell
npm run sandbox:delete -- --profile e-waste-dev
```

Hosting teardown is separate: disconnect automatic builds and delete the intended Amplify app/branch only after preserving needed source/records. Verify retained data resources and backups rather than assuming all costs stopped. Remove unused files/uploads through the administrator's confirmed cleanup procedure.
