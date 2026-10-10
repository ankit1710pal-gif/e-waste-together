# Review resolution — 2026-10-10

Implementation commit: `9f30dab`. Later build-phase and verification updates are recorded in Git history. Verification results are in [verification.md](verification.md).

| Review item | Resolution |
| --- | --- |
| 1. `npm ci` / build runtime mismatch | Regenerated the lockfile using Node 22.23.3/npm 10.9.0. Pinned `.nvmrc`, package engines/package manager and both Amplify build phases. A fresh local Git clone passes `npm ci` using those exact versions. |
| 2. AWS account access | Retried Amplify read-only; the account setup notice remains. The user or AWS Support must resolve the account-specific block. No registration submission, upgrade or resources were created. A clearly labelled demo-mode build can support a simulated walkthrough. |
| 3. Empty confirmation batch | Server-side confirmation now requires at least one assigned request, then checks partner acceptance of every assigned category. Regression tests cover withdrawal/empty-batch behavior. |
| 4. Dates | Validate actual calendar dates and explicit time zones. Proposed/collection dates cannot be in the past when submitted/confirmed; collection follows confirmation, handover follows collection and confirmation, and evidence cannot claim more weight than handovers that already occurred. Real outcome dates cannot be in the future. The visibly labelled simulation permits fictional future outcomes. Evidence now uses an IST date/time input. |
| 5. Photo replacement / orphan uploads | Reject replacement through the API and deny photo uploads for closed requests/drives. Signed POSTs write to `pending/`; verified files are copied to private keys before database references are saved, preventing POST replay from replacing linked files. Temporary objects expire after seven days and incomplete multipart uploads after one day. A failed/uncertain database write after copying can leave a private orphan; administrator reconciliation is documented. Live S3 behavior still needs hosted verification. |
| 6. One DynamoDB item / command payload growth | Idempotency now stores fixed-size SHA-256 digests, with compatibility/migration for old entries. README states the 100-request, 1,000-action, 340,000-byte limits, whole-item rewrites and revision contention. One item per record is the next architecture. |
| 7. One drive | README explicitly states that Closed/Cancelled drives cannot restart. Multiple drives require a data-model change; this prototype remains a single-drive pilot. |
| 8. Open signup / admission | Added a Cognito pre-sign-up trigger requiring the exact `@iiitm.ac.in` domain. Email verification and trusted manual admission remain required. The runbook gives exact console steps for `IIITM_MEMBERS` and `IIITM_ORGANISERS`, token refresh and admission checks. Trigger tests cover allowed addresses and bypass attempts. |
| 9. Retained DynamoDB | Runbook identifies the RETAIN table and point-in-time recovery, continued costs, resource-ID/cost tracking, export/reconciliation and deliberate cleanup after sandbox deletion. |
| 10. UI maintenance / remounting | Extracted module-level `RequestCard`, `DrivePanel`, `Upload`, common UI controls and modal forms. Formatted JSX. Browser regression verifies organiser note typing keeps focus. |
| 11. Cloud login weight | Replaced Amplify UI with lightweight, lazy-loaded forms using Amplify Auth APIs. Supports sign-in, signup/confirmation/resend, password reset and sign-out. Five mocked component tests cover core flows. MFA/federated flows and live Cognito are outside the locally verified scope. Bundle measurements are in verification.md. |
| 12. Browser happy path | Added an isolated Playwright Chromium test for submit, accept, batch, confirm, partial handover, reload persistence and zero evidenced recycling. It uses a separate local demo server. |

## Remaining acceptance

The code review fixes do not establish a cloud deployment, account activation, real campus admission, physical collection or recycling. Complete the hosted checklist in [deployment.md](deployment.md) once account access works. Production dependency audit is clean at the time of verification; development/Amplify tooling still has upstream advisories, as recorded in verification.md.
