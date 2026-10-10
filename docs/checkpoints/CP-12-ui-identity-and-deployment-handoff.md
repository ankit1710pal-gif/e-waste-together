# CP-12 — Identity screens and deployment handoff (Step 3)

Date: 2026-10-10 (Asia/Kolkata)
Status: Step 3 implementation and local checks saved; visual review and live AWS verification outstanding
Previous local commit: 193beb8 (Step 2)
Last verified published application commit: bfd1fddc8942ca18a6cbf77a2584417e308d2fbb

## Saved scope and user handoff

The user explicitly requested Step 3 after Step 2, then requested a checkpoint and an AWS console login tab so they can try deployment themselves. Preserve Step 2's outstanding screenshots; the Step 3 instruction authorises proceeding without claiming that visual review was completed. This checkpoint saves the actual progress for that handoff. Step 4 is not started. Optional Step 8 remains undecided.

An AWS Stockholm console tab was requested through open_in_codex at https://eu-north-1.console.aws.amazon.com/console/home?region=eu-north-1. The tool returned queued, not a verified page load or account activation. If a sign-in is required, the console handles it. No AWS account settings, plan, credentials, permissions or resources were changed by the agent.

GitHub deployment uses the last published main branch, not the current local UI upgrades. Steps 0–3 are local commits only; no push or deployment is authorised. The user should report whether Amplify is accessible and any exact console error. Publishing these local changes requires separate push approval; no successful deployment is claimed.

## Step 3 implementation

- Welcome uses the existing recycle logo and app name, a one-line promise, three explanatory steps, Sign in / Create account and a small Try the demo action. Naming/logo redesign remains a proposal; no new logo asset was invented.
- The demo chooser offers Asha, Kabir and Organiser, with explicit fictional roles. Every demo app view has the sticky banner: **Demo — simulated people and data, not real sign-in**. Existing role switching and Reset demo remain labelled as demo actions; Exit demo returns to Welcome.
- Demo-only builds explain that campus sign-in/account creation needs AWS setup. In AWS builds, an explicit demo choice uses browser-local state/files. A connection failure never substitutes demo state. Refresh returns to Welcome; choosing the demo again reopens its saved data.
- Campus forms provide inline validation, associated errors, show/hide password, password requirements for signup/reset, disabled busy controls and loading/error/success messages. Campus-domain signup guidance complements the existing server pre-sign-up trigger. Passwords remain component state only and are cleared on successful sign-in and step changes.
- Email verification returns to sign-in and never grants admission. Unsupported extra Cognito sign-in steps remain explicit errors rather than opening the workflow. Existing sign-in, signup, confirmation/resend and password-reset SDK calls remain the mechanisms.
- Waiting for admission shows the signed-in email, explains organiser admission and offers Check again / Sign out. Check again forces a fresh Cognito session before reading the existing allowed groups. Connection failures are displayed separately from pending admission. A sign-out failure remains visible and does not claim success.
- The AWS data SDK is imported only when cloud setup is explicitly requested. API defaults still follow VITE_DATA_MODE; the demo choice is an explicit frontend data path. Pending action keys include their mode, and demo reset does not clear uncertain AWS action attempts. Server authorisation, domain transitions, quotas and S3 access rules are unchanged.
- Entry screens, identity forms and admission handling are separate components. Existing App changes are confined to entry persona, explicit data mode, honest demo banner/exit and file-limit wording. Home, navigation and resident/organiser redesign belong to later steps.

The password hint matches the installed @aws-amplify/auth-construct default policy (8 characters, uppercase/lowercase/digit/symbol); no backend password policy was changed. Session refresh follows the [Amplify session API documentation](https://docs.amplify.aws/react/frontend/auth/manage-user-sessions/). Cognito remains authoritative for signup/reset and recovery, as described in the [AWS password documentation](https://docs.aws.amazon.com/cognito/latest/developerguide/managing-users-passwords.html). Actual hosted configuration remains unverified.

## Checks and proof

Runtime: Node 22.23.3/npm 10.9.0. No dependencies were added; package.json, lockfile and pins are unchanged.

| Check | Actual result |
| --- | --- |
| Unit/component suite | 124 tests across seven files pass; 4.94 seconds on final rerun. |
| Domain / mocked Lambda / pre-sign-up | Existing 57 / 27 / 8 tests remain passing. |
| Mocked identity / entry / admission / API boundary | 14 / 7 / 4 / 7 tests pass; covers validation, verification, busy/repeated actions, failure paths, explicit demo isolation and refreshed groups. |
| npm run check | Exit 0: initial full tests, frontend build and backend TypeScript passed. |
| Final frontend rerun | Tests/build exit 0 after lazy data-SDK refinement; final Vite build 6.61 seconds, 2,439 modules. |
| Existing Playwright happy path | Initial run failed because its refresh step assumed direct app entry; updated to re-enter the explicit demo after refresh. Final rerun passed: one test, 16.5 seconds test time / 24.2 seconds total, exit 0. |
| Palette contrast | 72/72 configured token pairs still pass; no whole-page accessibility certification claimed. |
| Protected source / dependency diff | Empty for shared/domain.ts, amplify/, amplify.yml, package.json, package-lock.json and Node/npm pins. |
| Formatting / whitespace | Prettier source checks and git diff --check pass; existing LF conventions preserved. |

```text
Test Files 7 passed (7)
Tests 124 passed (124)
Full check exit: 0 (includes backend TypeScript)
Final frontend: tests=0, build=0
Final Playwright: 1 passed (24.2s), exit=0
Theme contrast: 72/72 pass
```

| Final production output | Size (kB) | Gzip (kB) |
| --- | ---: | ---: |
| Main JavaScript (index-DXdsA2pv.js) | 291.82 | 91.76 |
| CloudLogin form chunk | 7.29 | 2.72 |
| Lazy supporting JS chunks | 0.09, 0.33, 18.98, 22.75, 24.61, 67.93, 123.14 | 0.11, 0.25, 6.91, 6.73, 9.94, 17.12, 36.37 |
| CSS | 33.25 | 6.67 |
| index.html | 0.60 | 0.39 |

The form chunk is only one piece of cloud sign-in's lazy dependencies; do not present 7.29 kB as the total AWS sign-in download. The first build exposed excessive eager SDK code; keeping the data SDK lazy reduced main output from 439.93 kB to 291.82 kB. These are bundle measurements, not measured campus-network timings.

Logs: .npm/step-3-check.log, step-3-e2e.log, step-3-results.json, step-3-final-frontend.log, step-3-final-frontend-results.json, step-3-final-e2e.log, step-3-final-e2e-results.json and step-3-contrast.json. The Step 0 audit remains the unchanged-dependency baseline: zero production findings, 48 advisories across the full installation. No new audit or clean-install result is claimed here.

## Screenshots and remaining limits

No new screenshots are captured. Earlier automated access to the local preview URL was explicitly rejected, including bypass through another control path. The established functional test workflow is preserved; no alternate screenshot/browser inspection is used. Automatically produced failure artifacts from the initial regression are not the requested light/dark visual proof. Step 2's four mobile/desktop light/dark screenshots and Step 3's rendered visual review remain outstanding.

The preview remains http://127.0.0.1:5173/ and now opens Welcome. All demo interviews, people, partners, dates, measurements and outcomes remain synthetic; nothing establishes a real handover or recycling result.

## Resume from here

1. Local implementation and final checks are complete. Save this checkpoint with the source in a small local commit; no push.
2. User checks the AWS console/Amplify access and reports success or the exact error. AWS activation and any actual deployment remain unverified until that report and hosted acceptance checks.
3. With separate approval, publish the local source before deploying that version through GitHub/Amplify. Follow docs/deployment.md and then CP-06C; the retained-table/cost/privacy/hosted upload checks remain applicable.
4. Only after the user's next instruction, start Step 4 (app shell and Home). Keep outstanding screenshot review visible. No backend/domain/quotas/build/pin changes without approval; optional member admission requires explicit Yes.

Stop after the checkpoint. Do not push, provision resources, retry account registration or start Step 4 on the user's behalf during the deployment handoff.
