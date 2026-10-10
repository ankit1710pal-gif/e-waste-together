# CP-11 — UI design system (Step 2)

Date: 2026-10-10 (Asia/Kolkata)
Status: Implementation and local checks complete; Step 2 visual review remains incomplete pending four screenshots
Previous checkpoint: CP-10 / local commit 92a410d

## Approved scope

The user requested completion of Step 2 after the Step 1 proposal. This authorises the proposed forest-green palette, DM Sans and automatic light/dark design system for this step. It does not answer the optional Step 8 admission question. App naming and logo redesign are not part of this implementation.

Only the existing interface's design system and shared controls change. Welcome/identity flow, Home content, bottom navigation and resident/organiser workflow redesign remain in Steps 3–6. Domain rules, Lambda security model, upload quotas, amplify.yml, package-lock.json, dependency versions and Node 22.23.3/npm 10.9.0 pins are unchanged. Nothing is pushed or deployed.

## Changes

- Centralised colour, font/type scale, spacing, radius, control height, motion and shadow variables in src/styles.css. All pre-existing component colours now use tokens.
- Added a complete dark token set and native control color-scheme via prefers-color-scheme. Kept DM Sans for headings and body, with a system fallback; removed the second font import.
- Restyled buttons, icon controls, uploads, inputs, checkboxes, badges, cards, dialogs, inline status/notification messages and empty states. Destructive/warning/info statuses retain their text labels. Disabled controls remain disabled; file input overlays remain native and operable.
- Raised shared controls to a 44px minimum height, added clearer field outlines/placeholders/focus rings, readable secondary text and invalid-input styling. This does not establish whole-app accessibility or complete the Step 7 mobile audit.
- Added a reusable, aria-hidden Skeleton component to the existing community-loading state. The existing live loading message and error behavior are preserved. prefers-reduced-motion disables skeleton animation and control transitions.
- Kept the existing mobile navigation and decorative hero for their later steps. On narrow phones, existing forms stack their fields and dialogs fit the viewport as sheets; no form fields, submission rules or commands changed.
- Added scripts/check-ui-contrast.mjs, a dependency-free check that reads the actual light/dark token definitions, checks undefined references and compares configured text/control/focus pairs without rounding thresholds.

## Contrast proof

Command: node scripts/check-ui-contrast.mjs .npm/step-2-contrast.json, using the pinned Node runtime.

| Theme | Checked pairs | Minimum text ratio | Minimum control/focus ratio | Failures |
| --- | ---: | ---: | ---: | ---: |
| Light | 36 | 5.89:1 | 3.91:1 | 0 |
| Dark | 36 | 6.48:1 | 3.81:1 | 0 |

72/72 checks pass. The script compares unrounded ratios against 4.5:1 for configured text pairs and 3:1 for configured control/focus pairs, following [W3C text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [non-text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). These are palette checks, not computed-style checks of every rendered element, browser-native control or a WCAG certification. Full visual/keyboard/mobile verification remains necessary.

## Regression checks and output

Runtime: Node 22.23.3/npm 10.9.0. No dependency change or new installation was necessary.

| Check | Result |
| --- | --- |
| Unit/component tests | 97 tests across four files passed in 51.43 seconds. |
| Frontend TypeScript / production build | Passed; Vite 7.3.7, 2,435 modules; Vite build completed in 31.26 seconds. |
| Backend TypeScript | Passed; tsc -p amplify/tsconfig.json. |
| Existing Playwright workflow | Passed; one Chromium test, 38.7 seconds test time / 47.1 seconds total; exit 0. |
| Formatting | Final Prettier check passed for the four edited source/script files; initial App import-format warning was resolved. |
| git diff --check | Passed; LF line endings preserved across the edited files. |
| Protected-file diff | No protected source, dependency or runtime files changed. |

| Production output | Size (kB) | Gzip (kB) |
| --- | ---: | ---: |
| Main JavaScript | 282.31 | 89.10 |
| Lazy cloud login JavaScript | 115.50 | 32.46 |
| CSS | 31.00 | 6.31 |
| index.html | 0.60 | 0.39 |

The CSS grew by 10.84 kB (0.94 kB gzip) relative to CP-09 for the tokens and shared-control styles. Main JavaScript grew by 0.23 kB (0.04 kB gzip) for the loading skeleton; the login chunk remains the same size. These are build measurements, not a measured network-performance claim.

Logs: .npm/step-2-check.log, .npm/step-2-e2e.log, .npm/step-2-results.json and .npm/step-2-contrast.json. No final regression check failed. Playwright emitted the existing NO_COLOR/FORCE_COLOR warning. The Step 0 production audit (zero findings) remains the dependency baseline; no new audit result is claimed here.

```text
Node v22.23.3 / npm 10.9.0
Test Files 4 passed (4)
Tests 97 passed (97)
Vite: 2435 modules transformed; built in 31.26s
Backend: tsc -p amplify/tsconfig.json
Playwright: 1 passed (47.1s)
Command exits: check=0, e2e=0
Theme contrast: 72/72 pass
Prettier: All matched files use Prettier code style
Protected-file diff: empty
```

## Screenshots and verification limit

Required screenshots: mobile at 360px and desktop, each in light and dark mode. **No new screenshots have been captured.** Earlier automated browser access to the local preview URL was explicitly rejected with an instruction not to bypass the rejection through another browser/control path. This step does not route screenshot capture through another tool. Existing functional Playwright regression runs remain the established test workflow; no screenshot workaround or new browser inspection is added.

The existing local preview URL is http://127.0.0.1:5173/. The user can inspect it in their browser and supply the four screenshots for review. Screenshot capture and rendered layout review remain an outstanding requirement of Step 2. Historical screenshots do not prove this theme update. Do not label the entire step visually verified until this requirement is satisfied.

## Left and exact next task

Implementation and local checks are complete. Save a small local commit and stop for the user's reply. **The exact next task is to obtain and review the four screenshots to finish Step 2's visual verification.** Once that review is complete and the user approves continuing, Step 3 is Welcome and identity screens, including honest demo entry and mocked Cognito component tests. Do not start Step 3 in this turn or label Step 2 fully verified yet.

AWS account access, hosted Cognito/S3/Amplify verification and real campus/partner validation remain unresolved. All demo people, partners and outcomes remain simulated. Optional in-app admission still requires an explicit Yes and separate protected-backend approval.
