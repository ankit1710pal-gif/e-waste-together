# e-waste-together
E-Waste-Together Project ( AWS )

A campus e-waste collection workflow for IIITM Gwalior: residents submit devices; organisers review requests, arrange a collection drive, and record partial handovers and separate downstream recycling evidence.

The local demonstration uses fictional records and browser-local roles. No real collection or recycling has occurred. AWS backend definitions are included; hosted integration is pending.

## Run locally

Use **Node.js 22.23.3 and npm 10.9.0**, matching `.nvmrc`, `packageManager` and the Amplify build specification. Version managers can install the pinned Node release; run `npm install --global npm@10.9.0` under that runtime before installing dependencies.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173/. Demo mode is the default. Use the role selector to explore resident and organiser workflows.

```sh
npm run check
```

See [verification](docs/verification.md) for the latest check results.

For the browser regression test:

```sh
npx playwright install chromium
npm run test:e2e
```

This starts a separate local server on port 5180 and uses an isolated browser context with synthetic records. It checks submit, review, batching, confirmation, partial handover, reload persistence and zero evidenced recycling.

## Deploy on AWS

Connect this repository's `main` branch to AWS Amplify Hosting with an approved backend deployment service role. The included `amplify.yml` deploys the Amplify Gen 2 backend, generates client configuration, runs checks and builds the frontend in AWS mode.

The backend uses Cognito, AppSync, Lambda, DynamoDB and private S3 storage. Signup requires an exact `@iiitm.ac.in` email and Cognito email verification. A trusted administrator must separately admit campus residents and organisers into Cognito groups. See the [exact admission steps](docs/deployment.md#trusted-admission-and-organiser-assignment).

Follow the [deployment runbook](docs/deployment.md) for permissions, costs, admission and hosted acceptance checks. Cloud deployment can incur charges; account access and spending approval are required before provisioning.

## Pilot architecture and limits

This deployment supports **one community and one collection drive**, with at most **100 requests, 1,000 workflow actions and 340,000 serialized state bytes**. The drive cannot restart after Closed or Cancelled. Existing records must be preserved; a separately provisioned branch is a separate pilot, not a continuation of the old drive.

All requests, handovers, evidence, audit entries and action digests share one DynamoDB item. Every write replaces that item with a conditional revision check, so all organisers contend on one revision. SHA-256 command digests avoid duplicating private command payloads in the idempotency map. This design is for a small pilot; the next architecture should use one item per drive/request/handover/evidence record, pagination and transactional idempotency.

All workflow timestamps require explicit time zones. The UI records IST for confirmation, collection, handover and evidence. Real outcome timestamps cannot be in the future; visibly labelled demo mode permits fictional future handovers. A collection cannot be confirmed in the past, and outcomes must follow the confirmation/collection and handovers they support.

In AWS mode, organisers can record handovers only once the confirmed collection time has arrived. The confirmation form and confirmed drive show this warning. Use demo mode for an early simulated walkthrough; do not invent an earlier real collection time to make a test pass.

Photos and receipts cannot be replaced through the API. Photos cannot be added to closed requests or drives. Uploads go to temporary `pending/` S3 keys and are copied to private keys before their references are saved. A lifecycle rule expires temporary uploads after seven days and aborts incomplete multipart uploads after one day; it does not expire linked documents. A failed/uncertain database write after promotion can leave a private orphan, which needs administrator reconciliation against saved references.

Upload-link issuance is limited server-side to **10 valid requests per account per fixed 15-minute window** and **200 per community per UTC day**, including organisers. A DynamoDB transaction reserves both quotas before signing; unavailable quota storage denies issuance. Signing failures may consume a slot. Small quota counter items share the state table but do not rewrite the workflow item or consume workflow action IDs. Only quota rows carry `expiresAt` for TTL cleanup; new windows use different keys, so resetting a quota does not depend on immediate TTL deletion. These are issuance limits, not single-use S3 links, a general API traffic limit or a hard AWS spending cap.

The DynamoDB table has **RETAIN** removal policy and point-in-time recovery. Deleting a sandbox does **not** delete that table; retained tables/backups can continue consuming credits. Follow the [teardown and cost tracking instructions](docs/deployment.md#spending-and-teardown).

The lightweight cloud forms support email/password sign-in, signup confirmation, resend, password reset and sign-out. Live Cognito integration remains unverified; additional MFA/federated-login flows are not enabled by this prototype.

## Project records

- [Progress and next checkpoint](docs/PROGRESS.md)
- [Product specification](docs/product-spec.md)
- [Problem validation](docs/problem-validation.md)
- [Three-minute demo script](docs/demo-script.md)
- [Original project plan](PROJECT_PLAN.md)
