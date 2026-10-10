# Verification report — local prototype

Date: 2026-10-10 (Asia/Kolkata)

## Completed checks

After resuming an interrupted verification run:

- `npm run test`: **48 passed**, two test files; 34 shared domain tests and 14 mocked Lambda boundary tests.
- `npm run build`: frontend TypeScript passed; Vite 7.3.7 production build passed, 3,238 modules transformed.
- `npm run check:backend`: backend TypeScript passed.
- Node 24.15.0/npm 11.6.2 on the development machine; dependency lockfile generated.
- Source/docs scan found no matches for common AWS access-key, GitHub PAT or private-key patterns. This is a limited pattern check, not a comprehensive security audit. No applicable parent AGENTS.md files were found.

Windows sandbox dependency/source resolution produced EPERM during initial test/build attempts. Approved runs outside that restricted sandbox passed. No application test failures were hidden.

## Browser tests (synthetic local data)

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

File tests cover authorisation before signing, private record access, upload expiry/size/type conditions, record-scoped paths, unsupported types and checking stored object metadata before linking uploads. DynamoDB and S3 are mocked in Lambda boundary tests.

## Unverified / remaining

No AWS deployment or CDK cloud assembly synthesis has been performed. TypeScript compilation does not prove infrastructure deployment. Actual IAM permissions, service region availability, CloudFormation dependencies, Cognito admission, AppSync authorisation, S3 CORS, signed-URL expiry, cloud persistence, CloudWatch behavior and hosted workflow remain unverified.

No intended-user usability sessions, genuine interviews, collection partner agreement, verified receiving recycler, physical handover, recycling certificate, demo video or actual submission exists. Files are validated by metadata and bounds; content authenticity/malware scanning is not implemented.

See docs/deployment.md for the exact hosted acceptance checklist. Do not mark CP-04, CP-05 or CP-06 complete based solely on these local results.
