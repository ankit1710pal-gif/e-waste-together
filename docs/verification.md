# Verification report — reviewed local prototype

Date: 2026-10-10 (Asia/Kolkata)

## Follow-up risk checks

After adding upload quotas and real-mode timing warnings, using Node 22.23.3/npm 10.9.0:

- `npm run test`: **97 passed**, four files: 57 domain, 27 mocked Lambda, eight pre-sign-up and five login component cases.
- Frontend TypeScript and Vite production build: **passed**, 2,435 modules; main JavaScript 282.08 kB (89.06 kB gzip), login 115.50 kB (32.46 kB gzip), stylesheet 20.16 kB (5.37 kB gzip).
- `npm run check:backend`: **passed**.
- Playwright Chromium rerun: **one passed**, 52.9 seconds for the complete workflow, approximately 1.1 minutes total including server/browser startup.

Ten new mocked Lambda cases cover simultaneous account quotas, cross-request quotas, window rollover without TTL deletion, community/day limits across accounts, invalid filenames, unavailable quota storage, signing failures, unaffected reads, copy-before-conditional-write loss and replay after a committed write's response is lost. These model database/S3 behavior; actual transactions, TTL deletion, copying and hosted limits still need the live checklist in deployment.md. No new dependencies or lockfile changes were required.

## Completed checks

The review implementation is `9f30dab`, corrected by `93f4fc7`. Verification uses an isolated **Node 22.23.3/npm 10.9.0** runtime, matching the deployment pins.

- Fresh local Git clone, without node_modules: **`npm ci` passed**. The dependency lockfile was generated with npm 10, including the missing peer/deployment tooling dependencies. Later correction `93f4fc7` changes only an icon import and the frontend runtime command; the lockfile is unchanged.
- Clean-clone `npm run test`: **87 passed**, four files: 57 shared domain, 17 mocked Lambda, eight pre-sign-up and five login component tests.
- Corrected clean-clone frontend build: **passed**, frontend TypeScript and Vite 7.3.7, 2,435 modules. Main JavaScript is 281.72 kB (88.96 kB gzip), lazy cloud login is 115.50 kB (32.46 kB gzip), and the entire application stylesheet is 20.16 kB (5.37 kB gzip). The login chunk is substantially smaller than the review's approximately 490 kB Amplify UI login; Amplify UI's stylesheet is no longer included.
- Corrected clean-clone `npm run check:backend`: **passed**.
- Corrected clean-clone Playwright test: **one passed**, 11.6 seconds total, 4.1 seconds for the workflow. Timing configuration is committed in `812138e`.
- `npm audit --omit=dev` in the clean clone: **zero reported vulnerabilities** on 2026-10-10. The complete installation reports 48 development/deployment-tooling advisories (three moderate, 45 high, zero critical). Compatible updates and the Handlebars patch override were applied; forced breaking changes/downgrades were not used. This audit does not establish live-cloud security.
- The earlier source/docs scan found no common AWS access-key, GitHub PAT or private-key patterns. This was a limited pattern check, not a comprehensive security audit. No applicable parent AGENTS.md files were found.

An initial clean-clone build caught a missing notification icon import introduced during refactoring; `93f4fc7` restores it. Results above do not count that failed attempt as a successful build. Windows sandbox dependency/source resolution also produced EPERM in earlier attempts; approved checks run outside that restricted sandbox.

The first clean-clone browser run exceeded its 45-second total budget after typing the review note; the failure snapshot showed the correct full value and retained focus. The test now allows 120 seconds for the entire multi-step workflow, with 15-second action and 10-second assertion bounds. The rerun passed every workflow assertion; the earlier timeout is not counted as a pass.

## Automated browser regression (synthetic data)

`e2e/workflow.spec.ts` uses a separate Vite server on port 5180 and an isolated Chromium context. It submits three phones, reloads, switches to organiser, types a review note without losing focus, accepts and assigns the request, requests and records simulated partner confirmation, records one phone/0.2 kg as a partial handover, and checks that evidenced recycling stays at zero after another reload. No evidence document or real-world receipt is fabricated by this test.

## Earlier manual browser checks (synthetic local data)

1. Submitted three Small electronics items with unknown weight and explicitly synthetic contact/notes. The resident interface showed the saved request.
2. Reloaded and verified the request persisted in the browser.
3. Switched to Kabir; only Kabir's charger request was visible. This tests the demo view logic, not real authentication.
4. Switched to organiser; all sample requests appeared. Typed a full eligibility note without losing input focus, accepted Phones and assigned the request.
5. Moved the batch to Awaiting confirmation and completed the explicitly fictional partner form. IST date/time values displayed correctly.
6. Received one of two phones and recorded 0.2 measured kg. Request became Partial handover, showing one item remaining. Recycling stayed at zero.
7. Attached docs/screenshots/mobile-overview.jpg as a **sample upload fixture**, not a genuine collection receipt. The local UI exposed View receipt, preserved the attachment and resolved it to the Open / download file control. No real-world receipt is claimed.
8. Checked responsive layout at 1,280 px and 390 px: DOM width checks found no horizontal overflow. Mobile screenshot was inspected and saved. In-app browser desktop screenshot rendering did not show the entire overridden viewport; desktop verification was based on DOM/layout and interaction, not a complete desktop image.

The saved screenshot is docs/screenshots/mobile-overview.jpg. Browser workflow data remains visibly labelled demonstration data and is excluded from real pilot results.

## What the automated tests cover

Community admission, unrelated roles, cross-resident isolation, organiser-only actions, owner-only withdrawal, integer counts/weight bounds, review requirements, legal transitions, explicit category acceptance, partial handovers, remaining-count enforcement, no-shows, cancellation/closure preservation, metrics, idempotency, actor-namespaced record IDs, stale revisions, conditional database writes and conflict handling.

Review regression tests also cover empty confirmation batches, past/impossible/timezone-free timestamps, handover/evidence ordering, real future outcomes, photo/receipt immutability, closed requests/drives, command digests and legacy idempotency entries. File tests cover authorisation before signing, private record access, upload expiry/size/type conditions, record-scoped paths, unsupported types, metadata verification, temporary-to-private promotion and failures before saving references. DynamoDB and S3 are mocked in Lambda boundary tests.

Pre-sign-up tests reject non-campus and deceptive addresses. Login tests mock Amplify Auth for session restoration, sign-in, signup confirmation, password reset and error handling; they do not call Cognito.

## Unverified / remaining

No AWS deployment or CDK cloud assembly synthesis has been performed. TypeScript compilation does not prove infrastructure deployment. Actual IAM permissions, service region availability, CloudFormation dependencies, Cognito admission, AppSync authorisation, S3 CORS, signed-URL expiry, cloud persistence, CloudWatch behavior and hosted workflow remain unverified.

A read-only Amplify retry during review still redirected to the AWS account setup notice. No registration form, plan upgrade or resource creation was performed. Actual pending-object promotion, S3 lifecycle rules and the Cognito pre-sign-up trigger require the hosted acceptance checks after account access is resolved.

No intended-user usability sessions, genuine interviews, collection partner agreement, verified receiving recycler, physical handover, recycling certificate, demo video or actual submission exists. Files are validated by metadata and bounds; content authenticity/malware scanning is not implemented.

See docs/deployment.md for the exact hosted acceptance checklist. Do not mark CP-04, CP-05 or CP-06 complete based solely on these local results.
