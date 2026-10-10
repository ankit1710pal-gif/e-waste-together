# E-Waste Together — progress

Date: 2026-10-10 (Asia/Kolkata)

Current delivery checkpoint: **CP-06 — local readiness verified; cloud deployment pending.**

Current UI-upgrade checkpoint: **CP-09 — Step 0 complete; waiting for approval before Step 1.** Follow docs/checkpoints/CP-09-ui-upgrade-baseline.md. A fresh clone of bfd1fdd passed npm ci, all 97 unit/component tests, the frontend build, backend TypeScript and one Chromium workflow test. The production audit reports zero vulnerabilities; installation reports 48 advisories across all dependencies. Bundles: main JS 282.08 kB, lazy login JS 115.50 kB, CSS 20.16 kB. Application code is unchanged. Steps 1–9 have not started. Work proceeds one step at a time and stops for the user's reply after each checkpoint; no push/deployment is authorised by this UI-upgrade request.

The starting folder contained PROJECT_PLAN.md only. The user subsequently initialised and published the project to GitHub. The project now pins Node 22.23.3/npm 10.9.0, and an isolated copy of that runtime is installed for verification. AWS CLI was not found on PATH. AWS browser sign-in in Stockholm was verified, but Amplify redirected to an account setup/access notice. The user supplied a screenshot showing USD 100 credits; local credentials, permissions, approved credit budget, service availability and deployment remain unverified.

Community: IIITM Gwalior. Interviews and collection partner are synthetic for the demonstration. No real collection or recycling has occurred.

The local implementation and review fixes now exist. **97 unit/component tests pass**, and a Playwright regression covers submission, refresh persistence, organiser review, batching, simulated confirmation and partial handover. Measured handover is 0.2 kg while evidenced recycling remains 0 kg. No actual pickup occurred. Clean-clone installation and current build/backend check results are recorded in docs/verification.md; older manual browser checks remain historical evidence.

Review fixes include strict date ordering, nonempty confirmation batches, immutable attachments with temporary-upload expiry, compact action digests, campus email signup, modular UI and lighter login forms. The one-community/one-drive/single-item architecture and retained DynamoDB teardown behavior are explicitly documented. See docs/review-resolution.md for all review items.

Follow-up hardening adds atomic upload-link quotas (10/account/fixed 15-minute window; 200/community/UTC day), TTL cleanup of separate quota rows, real-mode collection-time warnings and hosted race/replay/lifecycle checks. Local tests cover conditional-write loss and a response lost after an attachment was committed; private-orphan reconciliation remains an administrator operation, not automatic deletion. Current check results are in docs/verification.md.

| Record | Actual status |
|---|---|
| CP-00 inspection | Complete |
| CP-01 local validation | Blocked on human interviews / community / partner |
| CP-02 specification | Provisional; in progress pending real validation |
| CP-03 interface | Internally verified; intended-user testing pending |
| CP-04 backend | Definitions and local tests pass; AWS unverified |
| CP-05 integration | Local workflow works; cloud integration unverified |
| CP-06 readiness | Local checks pass; deployment acceptance incomplete |
| CP-06A GitHub | Source published on main; remote commit verified |
| CP-06B deployment | Account inspection started; blocked on AWS account access |
| CP-06C hosted checks | Not started |
| CP-07 physical pilot | Blocked; no real partner or handover |
| CP-08 submission | Docs/script prepared; recording/submission pending |
| CP-09 UI-upgrade baseline | Step 0 complete: fresh install/check/e2e/production audit exit 0; 97 unit/component tests + one browser test pass; waiting for Step 1 approval |

Future-phase records document dependencies, not completed phases. Repository: [ankit1710pal-gif/e-waste-together](https://github.com/ankit1710pal-gif/e-waste-together). The original published source was `2ace11a`; review implementation is `9f30dab`, with later verification updates recorded in Git history. AWS URL and resource IDs remain unavailable.

Next cloud task: resolve the AWS account setup/access notice, then connect the published main branch to Amplify after separate deployment approval. A read-only retry during review showed the account block. Registration previously returned a temporary too-many-requests error; no plan upgrade or provisioning was performed. A clearly labelled static demo build is the fallback for a simulated walkthrough, not proof of deployed AWS services. Follow docs/deployment.md, then execute CP-06C.

Next UI task: wait for approval; Step 0 is complete. Only after the user replies continue/approval, perform Step 1 (screen list, design direction, entry flow and open questions; no code). Optional in-app member admission requires explicit Yes. The domain rules, Lambda security model, quotas, amplify.yml, lockfile and Node/npm pins require explicit approval before any change. Later design/accessibility work must preserve honest demo wording and keep real AWS outcomes unverified until hosted acceptance passes.

Local preview: npm run dev (http://127.0.0.1:5173/ when using the default port). It uses simulated browser-local roles; it is not proof of cloud security. Verification details: docs/verification.md.
