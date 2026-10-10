# E-Waste Together — complete Codex → GitHub → AWS Amplify guide

## Start here: the exact route

This guide combines product phases, progress checkpoints, implementation prompts, and publishing steps. Read the detailed phases below, then use the master prompt at the end. The project has not been implemented or deployed by creating this guide.

**Recommended route: Codex → local development and testing → GitHub → AWS Amplify → verified public website.**

Use React, TypeScript, Vite, and Amplify Gen 2. This guide replaces the earlier separate API Gateway architecture recommendation with Amplify-managed authentication, data, and storage. Use backend functions only where needed for protected workflow actions.

### Step 1 — Open your project in Codex

1. Create a folder called `e-waste-together` in a location where you keep projects.
2. Open that folder as a local project in Codex.
3. Copy this file into the project as `PROJECT_PLAN.md`.
4. Paste the master implementation prompt at the end of this guide.
5. Codex should inspect the folder and check Node.js, npm, and Git before scaffolding. If dependencies are missing, it should explain the required installation.

**Your action:** Select the folder and provide any missing account or community details.

**Codex action:** Create the app, documentation, and initial checkpoint. A separate AWS Agent Toolkit installation is optional, not a prerequisite for writing code.

### Step 2 — Build and test before publishing

1. Complete the product phases below, keeping local validation and partner commitments truthful.
2. Preview the interface locally using the project's documented development command.
3. When AWS credentials are available, create an Amplify development sandbox for real backend integration.
4. Test residents, organisers, file access, cancellations, and partial handovers.
5. Run the build and meaningful checks; fix failures before publishing.

**Important:** A local frontend can use mock data, but a conventional Amplify Gen 2 cloud sandbox provisions actual AWS resources and may incur charges. A local preview is not proof that the real backend works.

**Checkpoint:** CP-05 records the working application; CP-06 records verified deployment readiness and hosting. Keep them separate.

### Step 3 — Put the code in GitHub

1. Sign in to GitHub and create a repository named `e-waste-together`. A private repository is fine unless the event requires public source code.
2. Have Codex inspect the existing Git state before initialising a repository or changing a remote.
3. Ensure `.gitignore` excludes dependencies, build output, private environment files, AWS credentials, and real pilot records or receipts.
4. Commit the source, dependency lockfile, Amplify backend definitions, build configuration, README, and checkpoint documents.
5. Connect the repository's actual GitHub URL and push the intended branch. Authenticate through GitHub's supported sign-in flow; do not paste tokens into chat.
6. Verify the uploaded files and record the commit SHA.

Example commands for a NEW folder, to be adapted by Codex after inspection:

```powershell
git init
git add .
git commit -m "Build E-Waste Together MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/e-waste-together.git
git push -u origin main
```

`YOUR_USERNAME` is a placeholder. Do not run these blindly in an existing repository. Check staged files for secrets before committing. A push to an Amplify-connected branch can trigger deployment.

**Checkpoint CP-06A:** GitHub repository URL, branch, actual commit SHA, completed checks, and remaining deployment tasks. This is an additional publishing checkpoint between CP-06 preparation and hosted verification; record the actual chronology clearly.

### Step 4 — Connect GitHub to AWS Amplify

1. Sign in to your AWS console. Your previously shared URL selects `eu-north-1` (Stockholm); verify the required services are available there before provisioning.
2. Search for **AWS Amplify** and open the service.
3. Start the create/deploy app flow and select **GitHub** as the source.
4. Authorise access to the intended repository and select its deployment branch, normally `main`.
5. Use a Gen 2 fullstack build configuration prepared and verified by Codex. It must deploy the backend and build the frontend; a frontend-only upload is insufficient.
6. Review the required deployment service role, app name, region, and build settings. Follow the current Amplify setup flow rather than inventing permission policies.
7. For a Vite app, the frontend output is commonly `dist`; confirm this from the project's build configuration.
8. Start deployment and inspect both backend and frontend build results.
9. Open the deployed branch's public URL after success.

Codex should generate the appropriate `amplify.yml` using current documentation, with backend deployment, generated client configuration, dependency installation, and frontend build in the correct order. Do not copy a static-site build configuration for this fullstack app.

**Your action:** Complete AWS/GitHub sign-in and account authorisation when required.

**Codex action:** Prepare configurations, explain exact settings, diagnose build errors, and verify accessible results when tools and credentials permit.

**Checkpoint CP-06B:** Deployment URL, region, deployed commit, backend resources, build results, and production smoke-test results. A successful upload without a working backend does not pass.

### Step 5 — Verify the public app and update it

1. Open the site on a phone and in a separate browser session.
2. Sign in as two distinct residents and an organiser. Confirm private requests and uploads stay restricted.
3. Complete one test request through review, confirmation, and handover using labelled sample data.
4. Refresh and sign back in to verify persistence.
5. Verify cancellation, partial collection, and evidence-based metrics.
6. Configure a budget alert appropriate to your account; alerts are notifications, not a guaranteed spending cap.
7. For updates, ask Codex to edit and test locally, then commit and push. Amplify's configured automatic deployment rebuilds the connected branch.
8. Delete unused development sandboxes when appropriate using documented teardown commands; preserve needed records first.

**Checkpoint CP-06C:** Hosted acceptance checklist, verified public URL, known limitations, and readiness for the physical pilot. Continue CP-07 and CP-08 for the actual collection and submission.

### Official documentation

- [Codex / desktop app documentation](https://learn.chatgpt.com/docs/app)
- [Amplify React quickstart](https://docs.amplify.aws/react/start/quickstart/)
- [Amplify Gen 2 Git-based hosting](https://docs.amplify.aws/react/deploy-and-host/amplify-hosting/)
- [Configure AWS for local Amplify development](https://docs.amplify.aws/react/start/account-setup/)

Commands and console labels can change. Codex should check current official instructions before setup or deployment.

## 1. Project purpose

Help one college or apartment society combine small quantities of unwanted electronics into a shared collection drive with a real collection partner. Track the journey from a resident's request to an evidenced handover.

The environmental problem is documented; whether batching requests makes collection easier or economically worthwhile in your locality is a hypothesis to validate.

### Evidence and existing services

- Government data estimated 16.01 lakh tonnes of e-waste in 2021–22, covering 21 equipment categories notified under the rules then. This is historical data, not the current total: [Ministry of Environment, via PIB](https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=1943201&lang=2&reg=48).
- Karo Sambhav describes locations where collection centres have been unviable and already conducts society and institutional collection drives: [operational FAQ](https://www.karosambhav.com/faqs).
- Check prospective recycler credentials against current official information, and confirm the collection partner's relationship to the receiving recycler: [CPCB e-waste portal](https://eprewaste.cpcb.gov.in/).

Existing collection services mean the product must add useful coordination, visibility, and records. Do not claim to have invented collection or recycling.

## 2. Current progress — truthful starting point

| Area | Current state |
|---|---|
| Problem research | Initial secondary research completed; sources listed above |
| Concept | Defined: shared collection and handover tracking |
| Local interviews | Not completed |
| Pilot community | Not confirmed |
| Collection partner | Not confirmed |
| Interface and implementation | Not started |
| AWS deployment | Not started |
| Physical collection / recycling evidence | Not obtained |

**Current checkpoint: CP-00 — concept and planning documented.** This file is a plan, not evidence that the phases below have been completed.

## 3. Scope and operating rules

### First-version scope

- One community, one organiser, one collection partner, one active drive.
- Residents submit item categories, counts, optional photos, and optional estimated weight.
- Organiser reviews requests and combines them into a batch.
- Partner or organiser records an explicit partner confirmation of accepted items, date, location, and collection terms.
- Actual handover records include measured weight, received items, date, recipient, and receipt.
- Dashboard separates requested, confirmed, handed-over, and evidenced-recycled quantities.

### Defer until the pilot proves usefulness

AI classification, payments, reward points, national coverage, route optimisation, carbon calculators, municipal integrations, and a native mobile app.

### Important distinctions

- A submitted request is not a confirmed collection.
- Estimated item weight is not measured collection weight.
- A pickup or handover receipt is not proof of recycling.
- A proposed date is not a confirmed date.
- Partner credentials and accepted categories must be verified; do not automatically label any signup as verified.
- Residents retain items until the agreed handover. Do not create an unattended storage point. For damaged batteries or other items needing special handling, defer to the partner's instructions.
- Explain device data removal before handover; the app does not erase devices or certify data destruction.

## 4. Checkpoint system

Create a Markdown record after **every phase**, including incomplete or blocked phases. Store records in `docs/checkpoints/CP-XX.md` and maintain `docs/PROGRESS.md` in the implementation repository.

Each record must contain:

```markdown
# CP-XX — Phase name
Date/time:
Status: Not started | In progress | Complete | Blocked

## Current progress
- What exists and works now:
- What remains unfinished:

## Deliverables and evidence
- File paths, screenshots, test results, interview notes, or deployment URL:
- Real / simulated data explicitly identified:

## Acceptance checklist
- [ ] Criterion 1
- [ ] Criterion 2

## Decisions and assumptions
- Confirmed facts:
- Assumptions requiring validation:

## Risks / blockers
- Issue, owner, and next action:

## Resume instructions
- Exact next task:
- Commands needed, where relevant:
- Latest commit ID, if using Git:
```

Update the progress tracker with the latest checkpoint, phase status, unresolved blockers, and next task. Commit completed phase work when using Git; record the actual commit ID. Never invent a checkpoint's results or mark a phase complete with failed acceptance criteria.

## Phase 1 — Validate the local workflow

**Purpose:** Determine whether people and a service provider actually need this coordination tool.

### Work

1. Choose a reachable college or society and identify the person who could organise a drive.
2. Interview approximately five residents, one organiser, and one prospective collection partner. These are proposed pilot targets, not completed interviews.
3. Ask residents what unwanted electronics they have, how they currently dispose of them, what stops them, and whether they would attend a shared collection.
4. Ask the organiser about permissions, communications, volunteer time, collection location, and existing spreadsheets or messaging groups.
5. Ask the partner about service area, accepted and rejected items, minimum quantity if any, fees, pickup lead time, weighing, receipts, and recycling documentation.
6. Document the partner's receiving recycler and how its credentials were checked. Confirm current arrangements directly rather than relying solely on a directory listing.
7. Summarise the actual gap: for example, the organiser cannot reliably estimate batch size or residents cannot see whether a drive is confirmed.

### Deliverables

`docs/problem-validation.md`, anonymised interview notes, partner requirements, and a one-paragraph problem statement.

### Completion criteria

- A specific community and organiser are identified.
- At least one concrete coordination problem is supported by interviews.
- Partner feasibility and outstanding unknowns are recorded.

### Checkpoint CP-01

**Expected progress if passed:** Local problem and operating requirements are understood; implementation has not begun.

Record whether a partner is committed, merely contacted, or unavailable. If no partner is secured, a prototype may continue with explicitly simulated collection data, but the real pilot remains blocked.

## Phase 2 — Define the product and collection lifecycle

**Purpose:** Turn findings into a narrow, testable specification.

### Work

1. Write user stories for resident, organiser, and partner.
2. Define required fields: community, item category, count, optional estimated weight, resident contact preference, request status, and assigned drive.
3. Define a drive lifecycle: `Draft → Open → Awaiting partner confirmation → Confirmed → Closed`, with a separate `Cancelled` outcome where appropriate.
4. Define request states: `Submitted → Accepted / Needs clarification / Rejected → Assigned → Handed over`, plus `Withdrawn`. Assignment does not itself prove partner acceptance.
5. Keep actual handover and recycling evidence in separate records. A confirmed drive may close with partial collection; record uncollected and rejected items explicitly.
6. Define permitted transitions and who can perform them. Residents cannot confirm a drive or mark recycling complete.
7. Define contact-data visibility and retention. Public summaries must exclude names, phone numbers, private addresses, and private photos.
8. Confirm pilot success metrics: participation, completed handovers, actual kilograms, and organiser time spent.

### Deliverables

`docs/product-spec.md`, lifecycle diagram, access matrix, metric definitions, and prioritised backlog.

### Completion criteria

- Every first-version feature supports an observed need.
- Cancellation, withdrawal, partial handover, and rejected items have defined behaviour.
- Metrics distinguish estimated and measured quantities.

### Checkpoint CP-02

**Expected progress if passed:** Scope, roles, states, and success criteria are agreed; next step is interface design.

Record assumptions still awaiting the partner and any deliberate scope reductions.

## Phase 3 — Design the mobile-first workflow

**Purpose:** Make the app usable by residents and organisers without training.

### Work

1. Design a community landing page with drive status, accepted categories, and a clear submit action.
2. Design a short request form with explicit units and an “I don't know the weight” option.
3. Design a resident request page showing status, confirmed instructions, and withdrawal controls where allowed.
4. Design an organiser dashboard with batch totals, unresolved questions, and items needing review.
5. Design partner confirmation and handover screens. Include optional receipt upload and measured weight entered only at handover.
6. Include empty, loading, validation-error, cancellation, and partial-collection states.
7. Test a clickable or lightweight prototype with a few intended users; document confusing labels and fix them.

### Deliverables

Screen sketches or prototype, UI copy, and usability notes.

### Completion criteria

- A resident can submit a request without assistance.
- Users can distinguish proposed and confirmed collection details.
- Organiser can find outstanding actions quickly.
- Forms are usable on a phone and with keyboard navigation.

### Checkpoint CP-03

**Expected progress if passed:** Main screens and wording are validated; backend development can begin.

Record which users tried the prototype and what changed. If testing was simulated internally, say so.

## Phase 4 — Build the AWS backend and access controls

**Purpose:** Store requests reliably and restrict sensitive actions and information.

### Suggested architecture

- React + TypeScript frontend, hosted on AWS Amplify Hosting.
- Amplify Auth backed by Amazon Cognito for authentication.
- Amplify Data for the schema and authorised data API, with managed database resources.
- Amplify backend functions/custom mutations where required for protected workflow actions and validation.
- Amplify Storage backed by private S3 storage for photos and receipts, with restricted access and expiring links.
- CloudWatch for operational logs, excluding private request contents and contact data.

Use infrastructure as code and a small deployment configuration. An alternative AWS-managed architecture is acceptable if it reduces setup effort while preserving access controls. Verify current official documentation before choosing commands and framework versions.

### Work

1. Create the repository, configuration template, and infrastructure definitions.
2. Model records and IDs; scope requests and drives to their community.
3. Enforce authenticated community membership and role permissions on the server.
4. Implement request creation, review, withdrawal, and batch assignment.
5. Implement drive confirmation and cancellation, with an audit event for each important change.
6. Implement handover records and separate downstream evidence attachments.
7. Validate counts, nonnegative weights, allowed categories, upload size/type, and legal state transitions.
8. Prevent repeated action submissions from double-counting handovers; reject conflicting updates or use conditional writes.
9. Keep buckets private and secrets out of source code.

### Deliverables

Working API, schema documentation, infrastructure files, and meaningful backend tests.

### Completion criteria

- Data persists across sessions.
- A resident cannot access another resident's private request or perform organiser actions.
- A user from another community cannot access its private records.
- Invalid transitions and duplicate handovers are prevented.
- Photos and receipts are not public.

### Checkpoint CP-04

**Expected progress if passed:** Backend supports the core lifecycle with verified access controls; interface integration remains.

Record deployed resources, test results, limitations, and exact setup instructions without exposing credentials.

## Phase 5 — Connect the complete application

**Purpose:** Make one end-to-end collection workflow operate through the interface.

### Work

1. Connect sign-in, community access, and role-specific views.
2. Connect the request form, optional uploads, and resident status view.
3. Connect organiser review, batch totals, and drive management.
4. Add partner confirmation. For a small pilot, the organiser may record an externally obtained confirmation with its source and timestamp; do not impersonate a partner approval.
5. Connect handover entry, actual weights, receipts, and downstream evidence.
6. Add impact summaries using defined metrics. Display estimated batch weight separately from measured handover weight.
7. Handle failed requests, expired sessions, upload failures, and repeated clicks without losing data or duplicating submissions.
8. Add a clearly labelled sample dataset for demonstrations, isolated from real pilot metrics.

### Deliverables

Working mobile-friendly application and an end-to-end demo script.

### Completion criteria

- A request can move from submission to evidenced handover through the UI.
- Withdrawal and cancellation work.
- Partial collections do not mark all assigned requests handed over.
- Recycling totals remain zero or unavailable until supporting evidence is recorded.
- There are no essential screens backed only by placeholder controls.

### Checkpoint CP-05

**Expected progress if passed:** A complete prototype works with test data; deployment and pilot verification remain.

Record exactly which actions work and which external outcomes are still simulated.

## Phase 6 — Verify and deploy

**Purpose:** Produce a stable AWS-hosted version suitable for a small pilot.

### Work

1. Test the happy path and high-impact failures: unauthorised access, invalid counts, duplicate submission, partial handover, cancellation, and failed uploads.
2. Check metric calculations using known test records.
3. Check phone layouts, form labels, readable status text, and keyboard access.
4. Deploy the frontend and backend to AWS; configure production API URLs and permitted origins.
5. Check the production workflow with separate resident and organiser accounts.
6. Set a spending budget/alert appropriate to the account and document teardown steps. Do not promise zero cost.
7. Remove unnecessary sample accounts and ensure real contact data cannot appear in public pages or screenshots.

### Deliverables

Deployment URL, verification report, README, environment configuration instructions, and teardown notes.

### Completion criteria

- The hosted app completes the core workflow.
- Access-control and metric tests pass.
- Operational errors can be inspected without logging sensitive content.
- Deployment steps are reproducible.

### Checkpoint CP-06

**Expected progress if passed:** AWS-hosted prototype is ready for a pilot; real environmental impact is not yet established.

Record the actual URL, AWS services used, verification evidence, and unresolved defects.

## Phase 7 — Run one real collection pilot

**Purpose:** Test whether the software helps people complete a physical collection.

### Work

1. Obtain community permission and confirmed partner terms, including accepted items and handling instructions.
2. Invite a small group of residents using the organiser's normal communication channel.
3. Collect requests and resolve item eligibility before confirming instructions.
4. Run the drive at the agreed location without setting up unapproved storage or handling arrangements.
5. Record actual received items, weight, and recipient; attach the receipt.
6. Track no-shows, rejected items, and incomplete requests accurately.
7. Ask participants and the organiser what the app improved and what remained awkward.
8. Compare organiser effort with their existing method where a credible baseline is available.

### Deliverables

Anonymised pilot report, handover documentation, measured results, and a prioritised improvement list.

### Completion criteria

- At least one real handover is documented.
- Participation and quantities are backed by records.
- Sample data is excluded from pilot results.
- Recycling is described as pending unless downstream evidence exists.

### Checkpoint CP-07

**Expected progress if passed:** Real collection usefulness has been tested on a small scale; wider adoption remains unproven.

If collection cannot happen before the hackathon deadline, record this phase as incomplete, explain the dependency, and present the application as a prototype with a planned pilot.

## Phase 8 — Prepare the submission and next iteration

**Purpose:** Explain the problem, working solution, AWS implementation, and actual evidence clearly.

### Work

1. Write a README covering the local problem, users, setup, AWS architecture, limitations, and existing services.
2. Record the three-minute demo specified in the uploaded brief:
   - 0:00–0:30: problem and intended community.
   - 0:30–1:10: resident submits an item.
   - 1:10–1:50: organiser batches requests and records partner confirmation.
   - 1:50–2:25: handover and receipt, clearly real or simulated.
   - 2:25–3:00: measured results, AWS services, and next steps.
3. Check current submission requirements, student verification, and the exact deadline before submitting.
4. Prepare a short build blog if pursuing the blog opportunity described in the brief.
5. Select the next feature from pilot feedback rather than adding speculative AI or rewards.

### Deliverables

Submission package, demo video, final progress report, and next-iteration backlog.

### Completion criteria

- Video shows working behaviour and explains where AWS fits.
- Claims match available evidence.
- Documentation allows another developer to run the project.
- Real-world pilot completion and software completion are reported separately.

### Checkpoint CP-08

**Expected progress if passed:** Submission materials are ready. Mark submission itself complete only after an actual submission confirmation is recorded.

## 5. Short-deadline priorities

If time is tight, preserve validation, the complete core workflow, server-side permissions, AWS deployment, and honest evidence. Simplify to one community and let the organiser record the partner's external confirmation. Defer a dedicated partner portal and automated notifications. Never mark the physical pilot complete just because the demo works.

## 6. Reusable AI implementation prompt

Copy the following into your coding assistant. Replace bracketed fields where known; otherwise the assistant should document assumptions and continue independent work.

```text
Act as a product engineer helping me build E-Waste Together for an environmental hackathon's Waste and Energy track.

PROBLEM
Residents of a college or apartment society may have small quantities of unwanted electronics that are inconvenient to channel into organised collection. Build a tool to combine requests into a shared drive, record collection-partner confirmation, and document actual handover. Batching's local usefulness is a hypothesis; do not present it as already validated.

CONTEXT
Community/city: IIITM GWALIOR COLLEGE
Time available: 25 Hours
AWS account/deployment access: [insert]
Collection partner: use dummy/artifical one
Local interview findings: use synthetic data/ create a dummy set

READ FIRST
Read the attached E-Waste Together project plan and inspect the existing repository and applicable project instructions. Report the actual current state before changing files. Do not invent interviews, partner commitments, measurements, deployments, receipts, or recycling outcomes.

SCOPE
Build for one community, one organiser, one collection partner, and one drive. Residents submit item category, count, optional photo, and optional estimated weight. Organisers review and batch requests. Record explicit partner confirmation of accepted items, date, location, fees if any, and collection instructions. Record actual handover quantities and private receipts separately from downstream recycling evidence.

ARCHITECTURE
Use React, TypeScript, Vite, AWS Amplify Gen 2 Auth, Data, Storage, and Hosting. Add backend functions/custom mutations where required for protected workflow actions. Verify current official AWS documentation before choosing setup commands and versions. Keep credentials out of source code. Do not promise a free deployment.

PRODUCT REQUIREMENTS
- Mobile-first, short forms, clear statuses, accessible labels, and useful empty/error/loading states.
- Resident, organiser, and partner permissions enforced on the server.
- Community isolation and restricted resident contact data.
- Legal state transitions, withdrawal, cancellation, rejected items, and partial handover.
- Prevent repeated submissions and duplicate handover accounting.
- Estimated weights, measured handovers, and evidenced recycling shown separately.
- No invented CO2 savings, payment flows, rewards, or AI classification.
- An organiser may record a genuine external partner confirmation with source and timestamp; never fabricate partner approval.
- Mark demonstration data visibly and exclude it from real pilot totals.
- Explain device data removal without claiming the app erases or certifies devices.
- Do not advise unapproved storage or handling of damaged batteries; follow confirmed partner instructions.

PHASES
1. Local validation and partner feasibility.
2. Specification, roles, lifecycle, and metrics.
3. Mobile-first design and usability feedback.
4. AWS backend and access controls.
5. Complete frontend integration.
6. Meaningful verification and AWS deployment.
7. Real collection pilot.
8. Demo, documentation, and submission package.

CHECKPOINT RULES
After every phase, create docs/checkpoints/CP-XX.md and update docs/PROGRESS.md. Include date, actual status, working deliverables, evidence, acceptance checklist, assumptions, blockers, and exact next task. Record actual commit IDs if using Git. Create checkpoints even for incomplete or blocked phases. Do not mark phases complete while required criteria fail. Explain current progress and current checkpoint in your response after each phase.

AUTONOMY AND LIMITS
Make routine implementation choices and finish authorised, reversible work. Ask only for information that materially blocks dependent work; continue useful independent work meanwhile. You cannot conduct physical interviews, secure partner agreements, or complete a collection without actual human input and evidence. Record these dependencies honestly. Do not contact external people or submit/publish on my behalf without authorisation. Use simulated data only when clearly labelled.

VALIDATION
Prioritise meaningful tests for server-side permissions, community isolation, state transitions, duplicate submissions, partial handovers, and metric calculations. Verify the hosted core workflow with distinct roles. Document deployment and teardown instructions.

START NOW
Assess the repository and available context. Create CP-00 and the progress tracker. Identify the smallest useful first version and the critical external dependencies. Then begin Phase 1 documentation and any independent preparation that does not require fabricated user research. Carry implementation forward phase by phase, preserving truthful checkpoints.
```

## 7. Prompt for resuming from a checkpoint

```text
Resume E-Waste Together from the latest checkpoint. Read docs/PROGRESS.md, the most recent checkpoint, and the repository instructions. Verify that claimed deliverables actually exist. Summarise current progress, unresolved blockers, and the next task. Continue unfinished authorised work without repeating completed phases. Create the next checkpoint with real evidence and update the progress tracker. Keep software completion, collection handover, and recycling evidence distinct.
```

## 8. Master Codex prompt — build, GitHub, AWS, and public verification

Use this prompt as your first message after opening the project folder. The more detailed implementation prompt in section 6 supplies additional product context; this master prompt defines the complete delivery route.

```text
Build my project “E-Waste Together” in this folder. Read PROJECT_PLAN.md
and follow its phased requirements and checkpoint system.

GOAL
Deliver a working mobile-friendly web app that helps one college or
apartment society combine small quantities of unwanted electronics into
one shared collection drive. Prepare the code for GitHub, deploy through
AWS Amplify when account access and publication authorisation are available,
and verify the public website. Do implementation work, not just a plan.

DELIVERY ROUTE
Codex → local build and tests → GitHub repository → AWS Amplify → public site.

TECHNOLOGY
React + TypeScript + Vite + AWS Amplify Gen 2.
Use Amplify Auth, Data, Storage, and Hosting. Use backend functions or
custom mutations for actions that need protected state changes.
Preferred deployment region: eu-north-1. Verify availability; explain any
required regional change before provisioning in a different region.
Check current official documentation for installation and deployment.

MVP
1. Sign-in and separate resident and organiser permissions.
2. Resident requests with category, item count, optional estimated weight,
   optional photo, and status tracking.
3. Organiser review, accepted-item checking, grouping, and batch totals.
4. Drive details and explicit partner confirmation. An organiser can record
   genuine external confirmation with its source and timestamp; a dedicated
   partner portal is optional for the first version.
5. Actual handover with received items, measured weight, recipient, and receipt.
6. Dashboard showing requests, participating households, completed handovers,
   and measured kilograms. Define how households are identified; do not equate
   account count with household count without an explicit pilot assumption.
7. Separate recycling evidence: pickup alone must never count as recycling.
8. Withdrawal, cancellation, rejected items, partial collection, and no-shows.

DATA AND SECURITY
Enforce roles, ownership, community access, and allowed field changes on the
backend. Users must not grant themselves organiser roles or modify handover
status through unrestricted model writes. Never rely on hidden UI controls
as authorisation. For the one-community pilot, document the trusted process
for assigning organisers and admitting members.
Keep files private and restrict access to their authorised audience. Restrict
uploads by size/type. Prevent duplicate handover totals and conflicting
updates. Do not expose contact data in public metrics or logs. Keep AWS/GitHub
credentials and real pilot records out of Git. No invented carbon savings.

LOCAL DEVELOPMENT
Inspect existing files and instructions first. Check Node.js, npm, and Git.
Scaffold only after confirming the directory state. Provide npm scripts for
development, production build, and meaningful verification. Use labelled
mock data for frontend development until a real backend is available. State
clearly when functionality is simulated. An Amplify cloud sandbox uses AWS
resources even when the frontend runs locally; document cost and teardown.

PHASES AND CHECKPOINTS
Follow validation, specification, design, backend, frontend, verification,
pilot, and submission phases in PROJECT_PLAN.md. After EACH phase create
docs/checkpoints/CP-XX.md and update docs/PROGRESS.md. Include actual status,
working deliverables, evidence, passed/failed acceptance criteria, blockers,
next actions, and actual commit ID where available. Summarise current
progress and current checkpoint after each phase. Create additional CP-06A,
CP-06B, and CP-06C publishing records for GitHub, deployment, and hosted checks.

Do not fabricate resident interviews, partner agreements, or physical pickups.
If external validation is pending, document the hypothesis and continue
independent prototype work. Physical pilot completion remains separate from
software completion. On resuming, verify the latest checkpoint before work.

GITHUB
Prepare .gitignore, README, lockfile, deployment configuration, and a clean
commit. Inspect staged files for secrets. Preserve existing remotes and
history. Obtain the actual repository URL and use supported sign-in; never
request secret tokens in chat. If publication is authorised, push the tested
branch. Otherwise prepare everything locally and request only the missing
publication authorisation once the result is concrete and reviewable.

AWS AMPLIFY
Prepare a Gen 2 fullstack amplify.yml using current official guidance.
Include backend deployment and generated frontend connection configuration,
not merely a static frontend build. Document GitHub connection, branch,
deployment role, region, build output, and environment requirements.
When authorised and authenticated, deploy and inspect build failures until
resolved. If I must complete a browser sign-in or GitHub/AWS authorisation,
give me the exact action and continue independent work where possible.
Do not request passwords or access keys in chat. Do not claim deployment
success until the actual URL and backend have been verified.

TESTING AND DONE CONDITIONS
Run meaningful tests for unauthorised access, cross-resident isolation,
state transitions, partial handovers, duplicate accounting, and metrics.
Build successfully. Verify mobile layout and a complete hosted workflow
with separate roles. Check refresh persistence and restricted file access.
Document a budget alert and teardown; do not promise zero cost.

When delivery is complete, report the repository URL, deployed URL, commit,
current checkpoint, completed features, checks, remaining pilot dependencies,
and exact steps for future updates. Report missing access honestly if it
prevents publication, while finishing all independent local preparation.

START NOW
Inspect this folder, create the initial progress checkpoint, and begin the
smallest complete implementation. Ask concise questions only where a missing
answer materially blocks the next dependent action. Keep making useful
progress on authorised work.
```

## 9. Prompts for individual delivery steps

### Prepare GitHub

```text
Read the current checkpoint. Verify the application build and meaningful
tests. Prepare this project for GitHub: inspect Git state, check staged files
for secrets, update README and .gitignore, and create a clean commit if Git
is configured. Preserve existing history and remotes. Tell me the exact
remaining repository/sign-in action. Record CP-06A with actual evidence.
```

### Deploy the tested project

```text
Read the latest checkpoint and verify deployment readiness. Prepare the
Amplify Gen 2 fullstack build for my GitHub repository and eu-north-1 where
supported. Deploy when authorisation and account access are available.
Guide me through any required console sign-in. Inspect backend and frontend
build results and fix failures. Record CP-06B with the actual URL, deployed
commit, resources, and any remaining blockers. Never claim a static frontend
alone is the completed application.
```

### Verify the public website

```text
Verify the deployed E-Waste Together website using separate resident and
organiser accounts. Check request creation, review, confirmation, private
uploads, persistence, cancellation, partial handover, and correct metrics.
Keep sample data out of real pilot totals. Fix defects and record CP-06C
with evidence. If account access prevents a check, mark it unverified and
give me its exact manual test steps.
```
