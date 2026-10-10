# CP-06B — Amplify backend and frontend deployment

Date: 2026-10-10 (Asia/Kolkata)
Status: Not started

## Current progress
- What exists: Fullstack amplify.yml deploys backend before AWS-mode frontend build. User reports browser AWS sign-in.
- What remains: Connected repository, deployment role, verified account permissions, region/service availability, spending budget and deployment result.

## Deliverables and evidence
- amplify.yml; docs/deployment.md. No Amplify app ID, region deployment, resource identifiers or public URL available.

## Acceptance checklist
- [x] Prepare Gen 2 fullstack build specification
- [ ] Deploy actual backend/frontend and record resources and public URL

## Decisions and assumptions
- One IIITM Gwalior drive. Simulation is isolated from real pilot reporting.
- Local software verification does not establish AWS or physical outcomes.

## Risks / blockers
- Connected repository, deployment role, verified account permissions, region/service availability, spending budget and deployment result.
- Owner: user for account/repository and external validation; developer for implementation/verification.

## Resume instructions
- Use the authenticated AWS console with the intended GitHub branch and approved service role, confirm eu-north-1 availability and deployment authorisation, then inspect builds.
- Local commands: npm run dev; npm run test; npm run build; npm run check:backend.
- Actual commit ID: unavailable; no Git repository or commit has been created.

