# CP-06C — Hosted acceptance

Date: 2026-10-10 (Asia/Kolkata)
Status: Not started

## Current progress
- What exists: Exact cloud smoke-test checklist is documented.
- What remains: A deployed URL, test branch/accounts, persistence and private file-access evidence.

## Deliverables and evidence
- docs/deployment.md hosted acceptance checklist. All hosted assertions remain unverified.

## Acceptance checklist
- [x] Prepare manual hosted checks for high-impact behaviors
- [ ] Execute and pass checks on actual deployed app

## Decisions and assumptions
- One IIITM Gwalior drive. Simulation is isolated from real pilot reporting.
- Local software verification does not establish AWS or physical outcomes.

## Risks / blockers
- A deployed URL, test branch/accounts, persistence and private file-access evidence.
- Owner: user for account/repository and external validation; developer for implementation/verification.

## Resume instructions
- Verify two residents, unadmitted user, organiser, private files, duplicates, partial handover, cancellation and metrics after CP-06B.
- Local commands: npm run dev; npm run test; npm run build; npm run check:backend.
- Actual commit ID: unavailable; no Git repository or commit has been created.

