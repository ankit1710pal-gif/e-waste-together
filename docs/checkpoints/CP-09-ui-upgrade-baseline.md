# CP-09 — UI upgrade baseline (Step 0)

Date: 2026-10-10 (Asia/Kolkata)
Status: Step 0 complete; waiting for user approval before Step 1
Source baseline: `bfd1fddc8942ca18a6cbf77a2584417e308d2fbb`

## Scope and source inspection

This step verifies the existing implementation and records its baseline. No application code, domain rules, Lambda security model, quotas, build specification, dependencies, lockfile or runtime pins are changed. Only this checkpoint and docs/PROGRESS.md are delivery changes. No push or deployment is authorised for this step.

Read README.md, docs/PROGRESS.md, docs/review-resolution.md, docs/deployment.md and all 12 existing checkpoint files (CP-00 through CP-08, including CP-06A/B/C). Also inspected the relevant existing UI and verification records.

At the start, main had a clean working tree and HEAD/origin/main matched the source baseline. A read-only git ls-remote confirmed GitHub main at the same full commit. The fresh local clone is .npm/ui-upgrade-baseline-2026-10-10, with its own dependency installation. Its ignored log and generated verification JSON files are diagnostic artifacts, not application changes.

## Check results and proof

Runtime: **Node 22.23.3/npm 10.9.0**, matching the existing pins. Each requested command ran once on the fresh clone; no automatic dependency fixes were applied.

| Check | Result |
| --- | --- |
| npm ci | Passed; 1,067 packages added, 1,512 audited. Peer override/deprecation warnings and 48 dependency advisories reported. |
| npm run check | Passed, exit 0; includes unit/component tests, frontend build and backend TypeScript. |
| Unit/component tests | 97 passed across four files; 56.54 seconds. |
| Frontend production build | Passed; 2,435 modules transformed, Vite build completed in 26.43 seconds. |
| Backend TypeScript | Passed; tsc -p amplify/tsconfig.json, included in check exit 0. |
| npm run test:e2e | Passed, exit 0; one Chromium happy-path test, 45.4 seconds total. |
| npm audit --omit=dev | Passed, exit 0; zero reported production vulnerabilities. |
| Source changes in verification clone | Final git diff --exit-code passed; tracked source and lockfile unchanged. |

Observed output (diagnostic artifacts: .npm/ui-upgrade-baseline-2026-10-10/baseline-run.log, baseline-results.json and baseline-audit.json):

```text
v22.23.3
10.9.0
bfd1fddc8942ca18a6cbf77a2584417e308d2fbb
added 1067 packages, and audited 1512 packages in 2m
48 vulnerabilities (3 moderate, 45 high)
Test Files  4 passed (4)
Tests       97 passed (97)
vite v7.3.7 building client environment for production...
2435 modules transformed.
built in 26.43s
> tsc -p amplify/tsconfig.json
1 passed (45.4s)
Production audit: vulnerabilities.total = 0
Command exits: ci=0, check=0, e2e=0, audit=0
```

| Production output | Size (kB) | Gzip (kB) |
| --- | ---: | ---: |
| Main JavaScript | 282.08 | 89.06 |
| Lazy cloud login JavaScript | 115.50 | 32.46 |
| CSS | 20.16 | 5.37 |
| index.html | 0.60 | 0.40 |

No requested check failed. npm ci reported peer override/deprecation warnings and 48 advisories across the full dependency installation (3 moderate, 45 high); the separate production-only audit returned zero. Playwright reported a NO_COLOR/FORCE_COLOR warning. These warnings are recorded without changing dependencies or the protected lockfile. Local mocked AWS tests and the simulated browser workflow do not verify live AWS behavior.

## Actual project state

| State | What exists / remains | Evidence or responsible party |
| --- | --- | --- |
| DONE and verified locally | Source published on GitHub; reproducible pinned dependency installation; domain, mocked Lambda/pre-sign-up and login component checks; frontend build, backend TypeScript and simulated browser happy path. Existing tests cover authorisation, quotas, timestamps, immutable files, idempotency and copy/write failure paths. | Current source/Git inspection; 97 tests across four files and one Chromium test pass; all command exits 0. Bundle sizes and zero production audit findings recorded above. Developer owns local verification. |
| DONE but unverified in AWS | Cognito domain trigger and group admission; AppSync/Lambda authorisation; DynamoDB conditional writes and quota transactions/TTL; signed S3 uploads, copies, lifecycle and private reads; Amplify build specification. | Definitions and local mocks only. No deployed URL/resources or hosted acceptance results exist. |
| LEFT | UI upgrade Steps 1–7 and 9: design decisions, full light/dark token system, welcome/identity/admission flow, mobile bottom tabs, home tracker, resident/organiser screens, 360px accessibility/browser checks, four light/dark screenshots and final documentation. Step 8 in-app admission is optional and requires explicit Yes. Dependency/tooling advisories and older documentation need review. | Developer implements after each separate user approval. Changes to dependencies/protected files need explicit approval; historical records are preserved in Step 0. |
| BLOCKED | AWS deployment and live checks. The last recorded console attempt redirected Amplify to an account setup notice; no account activation result is available. Permissions, role, region/service availability and approved spending remain unverified. | User/AWS Support resolve account access; user/account administrator approve permissions and spending. Step 0 does not retry or alter the account. |
| BLOCKED | Genuine field validation, campus permission, partner/recycler agreement and physical collection/recycling evidence. | User, campus/community and actual collection/recycling partners. Synthetic prototype data is not evidence of those outcomes. |

## Existing interface and limits

Source inspection shows the current overview, resident requests, organiser drive workflow and collection guide, plus cloud login/reset/verification forms. The waiting-for-admission view is currently a simple pending/error view, without the requested email/Check again treatment. The mobile sidebar becomes a top navigation row. Styling imports two fonts, uses a small set of colour variables and includes reduced-motion support; a complete light/dark system and WCAG AA verification have not been delivered. Existing modal focus/ARIA and status controls are useful baseline features, not an accessibility certification.

This deployment remains one community/one drive with one workflow-state DynamoDB item, at most 100 requests, 1,000 actions and 340,000 serialized state bytes. Separate small quota rows share the table. Copy-before-write can leave private orphans; cleanup requires reconciliation. Quotas bound issuance, not all API traffic or POST replay. Retained DynamoDB/PITR resources require deliberate teardown and cost tracking. These limits are preserved during the UI upgrade.

Some older checkpoints say Git is not initialised, show earlier test counts or refer to the older Authenticator UI. They are historical records and do not override this baseline. Reconcile current documentation in Step 9; do not claim those older counts are the present test suite.

## Screenshots and real-world outcomes

No screenshots are captured in Step 0; test output is the proof for this verification-only step. Existing docs/screenshots/mobile-overview.jpg is historical synthetic-demo evidence. New mobile 360px/desktop light/dark screenshots belong to Steps 2 and 7 and have not been taken.

No real interviews, partner agreements, handovers, measurements, recycling, deployment, recorded video or event submission are claimed. Browser workflow fixtures remain explicitly simulated.

## Next step and approval gate

Step 0 is complete. Stop and wait for the user's approval. The exact next task is **Step 1 — propose the screen list, design direction and entry flow, and ask the user's open design questions; no code**. Step 1 may start only after the user replies continue/approval. Do not start Step 2 without another reply.

Keep every later step separate and end it with changes, checks/proof, screenshots or their status, checkpoint, remaining work and a question. Optional Step 8 requires explicit Yes. Never push or deploy without separate user approval. Do not change shared/domain.ts, the Lambda security model, quotas, amplify.yml, the lockfile or Node 22.23.3/npm 10.9.0 pins without approval. Avoid new dependencies; essential additions must be exactly pinned and verified with clean npm ci. Preserve existing LF/CRLF conventions and make small local commits.
