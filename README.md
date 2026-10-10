# e-waste-together
E-Waste-Together Project ( AWS )

A campus e-waste collection workflow for IIITM Gwalior: residents submit devices; organisers review requests, arrange a collection drive, and record partial handovers and separate downstream recycling evidence.

The local demonstration uses fictional records and browser-local roles. No real collection or recycling has occurred. AWS backend definitions are included; hosted integration is pending.

## Run locally

Requires Node.js 22.12+ (verified with Node 24).

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173/. Demo mode is the default. Use the role selector to explore resident and organiser workflows.

```sh
npm run check
```

The latest local verification passed 48 tests, the production build, and backend TypeScript. See [verification](docs/verification.md).

## Deploy on AWS

Connect this repository's `main` branch to AWS Amplify Hosting with an approved backend deployment service role. The included `amplify.yml` deploys the Amplify Gen 2 backend, generates client configuration, runs checks and builds the frontend in AWS mode.

The backend uses Cognito, AppSync, Lambda, DynamoDB and private S3 storage. A trusted administrator must admit campus residents and organisers into Cognito groups. Signup alone does not grant access.

Follow the [deployment runbook](docs/deployment.md) for permissions, costs, admission and hosted acceptance checks. Cloud deployment can incur charges; account access and spending approval are required before provisioning.

## Project records

- [Progress and next checkpoint](docs/PROGRESS.md)
- [Product specification](docs/product-spec.md)
- [Problem validation](docs/problem-validation.md)
- [Three-minute demo script](docs/demo-script.md)
- [Original project plan](PROJECT_PLAN.md)
