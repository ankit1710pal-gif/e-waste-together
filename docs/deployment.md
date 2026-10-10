# AWS and GitHub deployment runbook

Date: 2026-10-10 (Asia/Kolkata). **No deployment performed.** Browser AWS sign-in verified; Amplify redirected to an account setup/access notice. Registration then returned a temporary too-many-requests error. Local credentials and deployment permissions remain unverified. CP-06B records the blocker.

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
4. Select the approved backend deployment service role and Amazon Linux 2023 build image. The repository build specification pins Node 22.23.3 and npm 10.9.0 before npm ci; retain those commands.
5. Use the included `amplify.yml`: `npm ci` → `ampx pipeline-deploy` → tests and backend TypeScript check → Vite build with AWS mode. Output directory is `dist`. Do not use a frontend-only drag/drop deployment.
6. Inspect backend and frontend build results. The deployment must generate branch-specific client outputs before the frontend build.
7. Record the app ID, commit, region, URL and provisioned resources in CP-06B, then complete hosted checks in CP-06C.

## Trusted admission and organiser assignment

Signup is filtered by a Cognito pre-sign-up trigger to the exact `@iiitm.ac.in` domain. Cognito still verifies email ownership. Successful signup **does not admit the user**. An administrator must verify membership independently; the email domain alone is not organiser authorisation.

1. Have the resident register on the hosted site with their campus email and complete the emailed verification code.
2. In Amplify, open the deployed main branch and **Deployed backend resources**. Follow the Cognito user pool link for this branch; do not select another branch's pool.
3. In Cognito, open **Users**, select the verified user's email, and check their identity against the campus admission process.
4. Choose **Add user to group** and select `IIITM_MEMBERS` for a resident. Check membership in the user's Groups list after saving.
5. For a specifically designated organiser, add `IIITM_ORGANISERS` instead. This group grants review, confirmation, handover and evidence actions; do not grant it to ordinary residents.
6. Have the user sign out and sign in again so their tokens contain the new group. Confirm residents see only their own requests and organisers see the management page.

Residents cannot assign either group through an API or custom profile field. Test accounts for this cloud deployment also need campus-controlled email addresses; do not bypass the filter by silently admitting personal email accounts.

Use a development branch for synthetic test accounts/records. Keep its results out of production pilot reporting. After assigning/removing groups, sign out and in again to refresh Cognito tokens. Revocation is subject to token lifetime; disable/revoke sessions as needed through the trusted AWS administration process.

## Hosted acceptance checklist — all unverified

- [ ] Backend and frontend deployed; actual commit and URL recorded.
- [ ] New unadmitted signup denied dashboard/actions/storage.
- [ ] Non-campus signup rejected; valid campus email verified before manual admission.
- [ ] Two admitted residents see only their own private requests/photos.
- [ ] Resident cannot invoke review, confirmation, handover, cancellation or evidence directly through API.
- [ ] Unrelated Cognito groups cannot access campus records.
- [ ] Organiser can complete review → assignment → confirmation → partial handover.
- [ ] Browser reload and a separate authenticated session verify persistence.
- [ ] Repeated action IDs do not duplicate handovers; competing revisions conflict safely.
- [ ] S3 objects remain private; another resident cannot fetch photos/receipts; signed URLs expire.
- [ ] Valid uploads succeed with actual S3 CORS; unsupported/oversized uploads fail.
- [ ] Signed uploads write pending/ only; saved references read private/ copies. Photos/receipts cannot be replaced and closed photo uploads are denied.
- [ ] S3 lifecycle configuration expires pending/ objects after seven days and aborts incomplete multipart uploads after one day without expiring private/ documents.
- [ ] Estimates and measured/evidenced totals match known branch test records.
- [ ] Withdrawal, no-show, cancellation and closure preserve truthful totals.
- [ ] Phone layout and keyboard/modal focus usable on hosted site.
- [ ] CloudWatch logs show error type only; no contact data or payloads.

## Spending and teardown

Inspect available credits, account plan and covered services. Set a user-approved AWS Budget and notifications before provisioning; an alert is not a hard spending cap. Actual charges depend on resources and traffic, not just whether the app is opened.

Record the Amplify app/branch ID and region, CloudFormation stack IDs, state table name, S3 bucket name and CloudWatch log groups in CP-06B. Check the credit balance and service usage in Billing after deployment and during the pilot; track Amplify builds/hosting, DynamoDB storage/PITR, S3 storage/requests, Lambda/AppSync and log retention. Credits can hide a bill while resources still incur usage. Account activation is independent of deployment: if Amplify opens, no fixed 24-hour deployment wait applies. If registration is complete but the access notice remains beyond its stated activation period, contact AWS Support rather than upgrading plans on an assumption.

The pilot state table has `RemovalPolicy.RETAIN` and point-in-time recovery. **Deleting a sandbox/stack does not delete this table**; retained tables/backups can continue charging. Export authorised data first, then inspect remaining DynamoDB, S3, CloudWatch and deployment resources with the account administrator. Request explicit authorisation before irreversible record deletion.

S3 temporary uploads under pending/ expire after seven days. Referenced private/ documents are preserved. Failed writes after a copy may leave private orphan objects: compare keys with request photos, handover receipts and evidence documents before administrator-approved cleanup. Do not expire the entire private/ prefix as an orphan workaround.

```powershell
npm run sandbox:delete -- --profile e-waste-dev
```

Hosting teardown is separate: disconnect automatic builds and delete the intended Amplify app/branch only after preserving needed source/records. Verify retained data resources and backups rather than assuming all costs stopped. Remove unused files/uploads through the administrator's confirmed cleanup procedure.
