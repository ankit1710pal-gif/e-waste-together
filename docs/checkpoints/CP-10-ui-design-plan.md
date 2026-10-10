# CP-10 — UI design plan (Step 1)

Date: 2026-10-10 (Asia/Kolkata)
Status: Proposal complete; awaiting the user's design answers and Step 2 approval
Source baseline: bfd1fdd; preceding documentation checkpoint: 4245f46

## Scope

The user approved starting the next step after CP-09. This is Step 1 only: a proposed screen list, visual direction and entry flow. No UI code, domain rules, Lambda security, quotas, build configuration, dependency versions or runtime pins have changed. The proposals below are not implemented or approved design decisions. No push or deployment is authorised.

Inspected the existing App, Root, CloudLogin, WorkflowForms and CSS to map the plan to the current implementation. Retain the existing workflow and role-filtered data. A screen or status label cannot grant access or advance the drive.

## Proposed screen list

| Screen / sheet | Audience | Content and primary action | Implementation step |
| --- | --- | --- | --- |
| Welcome | Everyone | Working name E-Waste Together; one-line promise; three steps; Sign in / Create account; small Try the demo link | 3 |
| Sign in | Campus account holders | Campus email, password, show/hide control, inline errors, reset link and loading state | 3 |
| Create account | Campus applicants | @iiitm.ac.in guidance, password requirements, show/hide control and verification explanation | 3 |
| Verify email | Unverified applicants | Code, resend, clear success/error state; return to sign-in after verification where Cognito requires it | 3 |
| Reset password / set new password | Campus account holders | Email, reset code, new password and confirmation of success | 3 |
| Waiting for admission | Signed-in account without community admission | Signed-in email, explanation of organiser admission, Check again and Sign out | 3 |
| Demo role chooser | Demo visitors | Asha, Kabir and Organiser; fictional-role descriptions; no authentication claim | 3 |
| Home | Admitted resident / organiser, or demo persona | Greeting, drive progress, four distinct metrics and the next permitted action | 4 |
| My requests / request detail | Resident | Own request cards, timeline, proposed versus confirmed collection time, optional photo and receipt access | 5 |
| New request sheet | Resident | Three stages: items; contact and condition; review and submit. Unknown weight remains optional, not zero | 5 |
| Requests / review queue | Organiser | Needs your action first, request review notes and existing permitted review actions | 6 |
| Drive / workflow forms | Organiser | Batch summary, partner confirmation, partial/measured handover, recycling evidence; cancel and close confirmations | 6 |
| Collection guide | All admitted roles / demo | Data wiping, safe preparation, damaged-battery guidance and honest collection instructions | 4–6 |
| Account menu | Signed-in account / demo persona | Name, role, privacy note, real Sign out or clearly labelled demo role switching | 4 |
| Members | Organiser only, optional | Admission into IIITM_MEMBERS; server authorisation, audit and no organiser-grant action | 8, only after explicit Yes and separate approval for protected backend changes |

Loading, empty, validation-error, connection-error, withdrawn, cancelled and closed states are variants of these screens. A failed admission check must distinguish access pending from a connection failure. Cancellation and closure must be shown honestly rather than as successful collection progress. No new drive creation or multi-community flow is proposed.

## Proposed visual direction

Calm, practical and readable: short headings, neutral surfaces, restrained green accents, clear primary actions and small category icons. Use the existing icon library. Replace the decorative Home hero with a compact greeting and drive summary in Step 4. Avoid stock photographs, animated counters and imagery that suggests real collections have happened.

Use **DM Sans** for headings and body text, with a system sans-serif fallback. It is already present in the project; removing the second heading font requires no new package. Proposed body size is 16px with generous line height, a small consistent type scale and an 8px spacing rhythm. Cards use modest rounded corners and subtle borders; dialogs become usable sheets on narrow phones.

| Colour role | Light proposal | Dark proposal |
| --- | --- | --- |
| Page | #F7FAF7 | #101A16 |
| Surface | #FFFFFF | #182820 |
| Main text | #1E3328 | #E5F0E8 |
| Secondary text | #486052 | #ADC4B4 |
| Primary action | #245A43 with white text | #9FD6A5 with #101A16 text |
| Soft green emphasis | #E5F1E8 with main text | #213C2D with light main text |

These are proposed palette values, not a contrast certification. Step 2 will measure WCAG AA text contrast and relevant control/focus contrast in both themes, adjust tokens where needed and verify disabled/error states. Use text plus an icon for warnings and statuses, not colour alone. Follow prefers-color-scheme and prefers-reduced-motion. Avoid adding a theme switch in this plan; the requested initial behavior follows the device preference.

Proposed logo: a simple leaf-and-device mark using existing vector icons, paired with the app name. The user may instead supply a preferred logo. No logo asset has been created.

## Navigation and Home

Design for 360px-wide phones first. Below a proposed 768px breakpoint use a fixed bottom tab bar, safe-area padding and content padding so the bar does not cover controls. Above it use a desktop sidebar. Step 2 styles controls; Step 4 implements this navigation layout. Step 7 verifies 44px targets, keyboard operation, focus, landmarks and no horizontal overflow at 360x740.

- Resident tabs: Home, My requests, Guide.
- Organiser tabs: Home, Requests, Drive, Guide.
- Keep account actions in the header/menu; optional Members belongs in organiser navigation only if separately approved.
- Keep a permanent demo banner visible without covering page actions.

Home shows Open → Review → Partner confirmed → Handover → Evidence as a presentation of the existing drive state, including explicit cancellation/closure when applicable. Keep requested quantity, confirmed quantity, measured handover in kg and evidenced recycling separate, using existing metrics and their units. An estimate is never a measurement; handover is never automatically recycling. Resident cards and totals continue to use the existing role-filtered view, without exposing another resident's requests or receipts.

## Entry flow and wording

New campus account: **Welcome → Create account → Verify email → Sign in when required → Waiting for admission → App after admission**.

Existing verified account: **Welcome → Sign in → Check admission → App or Waiting for admission**. Already admitted signed-in sessions may go directly to the App after their access check. The waiting screen's Check again refreshes access; it does not admit a member. Signup and verified email alone do not grant community access.

Demo path: **Welcome → Try the demo → Choose Asha / Kabir / Organiser → Demo app**. Display the permanent wording: **Demo — simulated people and data, not real sign-in**. Demo reset and role switching are explicitly demo actions. Keep AWS and demo data paths separate; an AWS connection failure never silently substitutes simulated data. A demo-only build must explain that real sign-in requires AWS setup rather than show a fake working sign-in.

Proposed promise: **Coordinate campus e-waste collection, from request to recycling evidence.**

Welcome's three explanatory steps: **Submit your items → Wait for a confirmed collection → Track handover and recycling evidence**. Show identity wording only where justified: **verified campus email + organiser admission**. Do not claim ID verification, a verified human, an actual partner, a successful deployment or real recycling.

## Open decisions for the user

1. **Name:** keep E-Waste Together, or supply a different name?
2. **Logo:** approve the proposed simple leaf-and-device mark, or supply/prefer another direction?
3. **Colours and font:** approve forest green with neutral light/dark surfaces and DM Sans, or specify changes?
4. **Optional Step 8:** Yes or No to in-app resident admission? No keeps the current documented administrator/group admission process. Yes schedules a separate protected backend approval; it does not authorise security changes now.

The recommended starting choices are the current name, the simple vector mark and the palette/font above. Optional Step 8 remains undecided until the user explicitly answers. The proposal does not lock in any unanswered choice.

## Checks, proof and screenshots

Documentation-only verification passed: git diff --check exited 0; git status --short showed only this new checkpoint and the docs/PROGRESS.md update. Both files retain LF line endings (zero CRLF). The initial working tree was clean. Make a small local documentation commit; do not push it.

```text
git diff --check: exit 0
 M docs/PROGRESS.md
?? docs/checkpoints/CP-10-ui-design-plan.md
Line endings: both files LF, CRLF count 0
Application / protected-file changes: none
```

No npm install, build, tests or audit are rerun because application code and dependencies are unchanged. CP-09 remains the tested baseline: 97 unit/component tests and one Chromium workflow passed; build/backend checks passed; production audit zero. Those results are historical baseline evidence, not tests of an implemented redesign.

No screenshots are taken because no design has been implemented. This screen/palette/flow proposal is the Step 1 review artifact. Implemented mobile and desktop light/dark screenshots are due in later steps.

## Left, blocked and exact next task

Left: user design answers, Step 2 design-system implementation, subsequent separate UI steps and optional Step 8 decision. AWS account access and hosted acceptance remain unresolved; genuine campus/partner/physical validation remains human work. Neither block prevents the local UI design system once the user approves it.

**Stop now.** After the user answers and approves continuing, the exact next task is **Step 2 — implement approved tokens and shared controls, preserve behavior, run checks and capture mobile/desktop light/dark screenshots**. Do not start Welcome, navigation or workflow redesign in Step 2. No push or deployment without separate approval; protected files, quotas and Node/npm pins remain unchanged unless explicitly approved.
