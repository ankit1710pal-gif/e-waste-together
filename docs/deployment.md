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

For real-mode QA, use an isolated development branch with explicitly synthetic records. Schedule the test collection a few minutes ahead, wait for that time to arrive, then exercise handover using a timestamp between collection time and the current time. Future handovers are rejected. Use local demo mode for a walkthrough that cannot wait; do not backdate real pilot records or report QA fixtures as physical results.

- [ ] Backend and frontend deployed; actual commit and URL recorded.
- [ ] Amplify build logs confirm Node 22.23.3/npm 10.9.0, successful npm ci, backend deployment and generated client outputs.
- [ ] New unadmitted signup denied dashboard/actions/storage.
- [ ] Non-campus signup rejected; valid campus email verified before manual admission.
- [ ] Two admitted residents see only their own private requests/photos.
- [ ] Resident cannot invoke review, confirmation, handover, cancellation or evidence directly through API.
- [ ] Unrelated Cognito groups cannot access campus records.
- [ ] Organiser can complete review → assignment → confirmation → partial handover.
- [ ] Real-mode forms warn that handover must wait for the confirmed collection time; earlier and future handovers are rejected. Use demo mode for an early simulation.
- [ ] Browser reload and a separate authenticated session verify persistence.
- [ ] Repeated action IDs do not duplicate handovers; competing revisions conflict safely.
- [ ] S3 objects remain private; another resident cannot fetch photos/receipts; signed URLs expire.
- [ ] Valid uploads succeed with actual S3 CORS; unsupported/oversized uploads fail.
- [ ] Simultaneous upload-link requests enforce 10/account/fixed 15-minute window and 200/community/UTC day. No signed link is returned when a quota reservation fails; authorised reads remain available.
- [ ] DynamoDB quota updates are atomic across both counters. TTL is enabled for expiresAt, workflow records have no expiry, and new windows work while old quota rows still exist.
- [ ] Signed uploads write pending/ only; saved references read private/ copies. Photos/receipts cannot be replaced and closed photo uploads are denied.
- [ ] S3 lifecycle configuration expires pending/ objects after seven days and aborts incomplete multipart uploads after one day without expiring private/ documents.
- [ ] Copy followed by a conditional-write loss preserves saved references and may leave a private orphan; replay after an uncertain successful write returns the saved attachment without recopying/deleting it. Follow the procedure below.
- [ ] Estimates and measured/evidenced totals match known branch test records.
- [ ] Withdrawal, no-show, cancellation and closure preserve truthful totals.
- [ ] Phone layout and keyboard/modal focus usable on hosted site.
- [ ] CloudWatch logs show error type only; no contact data or payloads.

## Attachment race and lifecycle checks

Run these on an isolated development branch with synthetic records and an approved test budget after account access works. Mocked local tests exercise failure paths; they cannot prove AWS IAM, S3 or DynamoDB behavior.

1. Upload two different sample photos for the same eligible request, creating separate pending/private destination keys. Send both attach actions with the same known revision and different action IDs. Repeat with a fresh test request if the timing does not produce a copy followed by a conditional-write loss.
2. Read the current state with a fresh authenticated request and inspect the branch's S3 objects through the trusted administrator. Confirm the winning reference is private, readable and unchanged. If the losing copy exists, record its key as a possible orphan; it must not replace the saved reference. A failure before copying leaves only a temporary object instead.
3. For a response lost after a successful commit, replay the exact original action ID/payload/revision. Confirm the saved attachment is returned, the action is not duplicated and the private object remains readable. Do not assume a network error means the write failed.
4. Reconcile possible orphans against every saved photo, receipt and evidence document after in-flight actions have settled. Preserve uncertain/live references. Administrator-approved cleanup is separate from these checks; do not delete the entire private/ prefix.
5. Inspect the deployed lifecycle rules and TTL configuration. Record configuration verification separately from observed cleanup. After the relevant expiry periods, check abandoned pending/ objects and old quota rows are removed while linked private/ documents and the workflow item remain. Cleanup is asynchronous; passing an expiry time alone is not proof of deletion.

Quota reservations count valid authorised upload-link requests, including signing failures. Fixed windows can permit a burst across a boundary; the shared daily limit bounds newly issued object keys. Issued POSTs remain reusable until their 120-second expiry. Rejected API calls and repeated POSTs can still incur requests/costs, so this does not replace budgets or broader traffic controls. Changes to the limits require a reviewed server-side change. DynamoDB transaction/TTL behavior is described in the [AWS transaction documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transaction-apis.html) and [TTL documentation](https://docs.aws.amazon.com/us_en/amazondynamodb/latest/developerguide/ttl-expired-items.html).

## Spending and teardown

Inspect available credits, account plan and covered services. Set a user-approved AWS Budget and notifications before provisioning; an alert is not a hard spending cap. Actual charges depend on resources and traffic, not just whether the app is opened.

Record the Amplify app/branch ID and region, CloudFormation stack IDs, state table name, S3 bucket name and CloudWatch log groups in CP-06B. Check the credit balance and service usage in Billing after deployment and during the pilot; track Amplify builds/hosting, DynamoDB storage/PITR, S3 storage/requests, Lambda/AppSync and log retention. Credits can hide a bill while resources still incur usage. Account activation is independent of deployment: if Amplify opens, no fixed 24-hour deployment wait applies. If registration is complete but the access notice remains beyond its stated activation period, contact AWS Support rather than upgrading plans on an assumption.

The pilot state table has `RemovalPolicy.RETAIN` and point-in-time recovery. **Deleting a sandbox/stack does not delete this table**; retained tables/backups can continue charging. Export authorised data first, then inspect remaining DynamoDB, S3, CloudWatch and deployment resources with the account administrator. Request explicit authorisation before irreversible record deletion.

S3 temporary uploads under pending/ expire after seven days. Referenced private/ documents are preserved. Failed writes after a copy may leave private orphan objects: compare keys with request photos, handover receipts and evidence documents before administrator-approved cleanup. Do not expire the entire private/ prefix as an orphan workaround.

```powershell
npm run sandbox:delete -- --profile e-waste-dev
```

Hosting teardown is separate: disconnect automatic builds and delete the intended Amplify app/branch only after preserving needed source/records. Verify retained data resources and backups rather than assuming all costs stopped. Remove unused files/uploads through the administrator's confirmed cleanup procedure.
