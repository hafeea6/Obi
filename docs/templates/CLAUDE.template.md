<!--
CLAUDE.md TEMPLATE

How to use:
1. Copy this file to the root of a new repo as CLAUDE.md.
2. Replace every {{PLACEHOLDER}}. Each section has a comment saying what belongs there; delete the comment once it's filled in.
3. Delete any section marked OPTIONAL that doesn't apply.
4. Sections without placeholders (Workflow, Testing, Engineering principles) work as written for any TypeScript project. Edit them only to match how you like to work.
-->

# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**{{PROJECT_NAME}}** is {{ONE_SENTENCE_DESCRIPTION}}. The core flow: {{CORE_USER_FLOW}}.

<!-- Who uses it and what the single most important flow is, in 2–3 sentences. -->

The full requirements are in [{{PRD_PATH}}]({{PRD_PATH}}). Read it before planning any feature, and reference requirement IDs (`FR-n`) in plans and commit messages.

### Stack

- {{RUNTIME_AND_FRAMEWORKS}} <!-- e.g. Electron (Forge + Vite), React 19, TypeScript. -->
- Storage: {{STORAGE}}
- Validation: `zod`. Shared UI state: `zustand` (see State management).
- {{OTHER_LIBRARIES}}

<!--
Record a stack decision only if it isn't obvious from package.json:
- Why a dependency is pinned or installed from a non-default source.
- Native modules and how they're built or packaged.
- Known gaps and which build-order step will fix them.
- Installed dependencies that must NOT be used, and why.
-->

### Domain rules (non-negotiable)

<!--
Invariants that must never be broken, each with its requirement ID. These are the rules a reviewer would reject a PR for. Examples of the kind of rule that belongs here:
- Where data is allowed to go (e.g. local only, no telemetry).
- Single source of truth for derived data.
- Invariants enforced in the backend, not just the UI.
- Isolation between tenants/clients/workspaces.
- Representation rules (e.g. money as integer cents, dates as YYYY-MM-DD).
-->

- {{DOMAIN_RULE_1}}
- {{DOMAIN_RULE_2}}

### Build order

<!-- Keep this list current. Mark each step "(done)" when it's finished. -->

1. {{STEP_1}}
2. {{STEP_2}}

Treat each step as a module made up of small phases (see Workflow). Out of scope for now: {{OUT_OF_SCOPE}}.

### Privacy

{{SENSITIVE_DATA}} must never be committed, logged, or pasted into prompts or tests. Use made-up data for fixtures and tests. `.env` is git-ignored; never commit it or print its contents.

## Commands

Package manager is **{{PACKAGE_MANAGER}}**.

- `{{PM}} install`: install dependencies
- `{{PM}} start`: {{START_DESCRIPTION}}
- `{{PM}} lint`: lint
- `{{PM}} exec tsc --noEmit`: type-check
- `{{PM}} test`: run all tests once; `{{PM}} test:watch` runs them in watch mode
- {{BUILD_COMMANDS}}

<!-- Note version pins and why, e.g. "Vitest is pinned to 3.x because the app uses Vite 5". -->

## Architecture

```
{{FOLDER_TREE}}
```

<!--
One line per folder saying what lives there and what must not. Typical layered layout:
  common/      Shared by every layer, with no platform imports (schemas, types, channel names)
  backend/     Composition root, services, repositories, handlers, errors, test helpers
  frontend/    API clients, stores, components grouped by feature
-->

### Adding a new feature

<!--
Write the end-to-end recipe for a vertical slice and name a real, finished slice to copy, e.g. "Follow the Clients slice (ClientService → ClientHandlers → ClientsClient → useClientStore)". Number the steps from shared schema to UI, and include the gotchas (restart needed, where things are registered, etc.).
-->

Follow the {{REFERENCE_SLICE}} slice end to end:

1. {{RECIPE_STEP_1}}
2. {{RECIPE_STEP_2}}

## Workflow

### Keep these instructions current

Update this file (and the PRD when requirements change) as part of the same change that makes it necessary, not as an afterthought. Typical triggers:

- A dependency, command, script or tool is added or removed.
- The folder structure, architecture or a recurring pattern changes.
- A decision is made, or an open question in the PRD is answered.
- The user corrects how something should be done, or states a new preference.
- Something here turns out to be wrong, stale or missing (e.g. a build-order step is finished).

Keep edits short and specific, and put them in the matching section. Remove outdated text instead of adding to it, and mention the update in the summary to the user.

### Plan, then build

<!-- Pick one autonomy level and delete the other. -->

<!-- Option A: autonomous -->
- Plan internally before coding, but don't share the plan or wait for approval. Ask only when a decision genuinely can't be made from the PRD or sensible defaults.
- Work through each build-order step as a series of small phases. Each phase must leave the project building, linting and passing tests.
- Don't check in after each phase. When a whole module is done, run the app so the user can try it, and tell them briefly what to try and any decisions made along the way.

<!-- Option B: collaborative -->
- For anything larger than a small fix, share a short plan and wait for approval before coding.
- Check in after each phase with what changed and what's next.

### Commits

- One logical change per commit. Don't mix refactors, formatting and behavior changes.
- Every commit must build, lint, type-check and pass tests on its own.
- Use imperative, descriptive messages that reference requirement IDs where relevant (`add trial balance report (FR-29)`, not `updates`).
- {{COMMIT_POLICY}} <!-- e.g. "Commit and push each finished phase without asking." or "Commit locally; push only when asked." -->
- Never force-push, rewrite pushed history, or push code that fails checks.

### Testing

- Use **property-based testing** for logic: state the invariants that must hold for all inputs and let the framework generate the inputs. Use [fast-check](https://github.com/dubzzz/fast-check) with Vitest (`import * as fc from "fast-check"`). See `{{REFERENCE_TEST_FILE}}` for the pattern.
- Typical properties: round-trips (`parse(serialize(x))` equals `x`), invariants (output always matches its zod schema), idempotence, and equivalence with a simpler reference implementation, such as a model-based test checking that a real repository and an in-memory one behave the same.
- Add example-based tests alongside them for specific known cases and regressions. Every bug fix gets a test that would have caught it.
- Put tests next to the code as `*.test.ts`. Never make real network calls or use real user data in tests.
- Write or update tests in the same change as the code they cover.

### Self-healing

<!--
Pair this section with hooks in .claude/settings.json so the checks actually run (CLAUDE.md alone is advisory):
- PostToolUse on Edit|Write: lint the edited file; exit 2 feeds errors back to Claude.
- Stop: run tests, lint and type-check; exit 2 keeps the turn going with the errors. Cap the retries (e.g. 3) and skip the run when nothing has changed since the last green run.
A working Node implementation lives in {{HOOKS_REFERENCE}} (e.g. another repo's .claude/hooks/).
-->

Hooks in `.claude/settings.json` lint each edited file and run the full checks before a turn ends. Don't work around them. When a check fails:

1. Read the full error and find the root cause before changing anything. Reproduce it with the narrowest command.
2. Fix the cause, not the symptom. Never skip, delete or weaken a test, loosen types to `any`, add lint/type suppressions, use `--no-verify`, or change config, just to get green.
3. If a test itself is wrong because the requirement changed, update it deliberately and say so in the summary.
4. Rerun the failing check, then the full suite.
5. After {{MAX_REPAIR_ATTEMPTS}} failed attempts at the same problem, or if the fix would break a domain rule or needs a product decision, stop. Explain what's failing, what you tried, and the options.

## Engineering principles

Follow industry-standard best practices for the stack, including its security guidance. {{SECURITY_CHECKLIST}} <!-- e.g. Electron: contextIsolation on, nodeIntegration off, narrow preload APIs. -->

- **DRY:** every piece of knowledge has one authoritative source: constants, channel names, shared types and schemas (derive types with `z.infer`). Extract once duplication is real (the third occurrence), not on the first. Don't merge code that only looks alike but serves different purposes.
- **SOLID:**
  - *Single responsibility:* each class, module and component does one thing. Services hold logic, handlers only wire transport, components only render.
  - *Open/closed:* add features by adding modules, not by growing existing ones with conditionals.
  - *Liskov substitution:* implementations of an interface must be interchangeable, test doubles included.
  - *Interface segregation:* expose small, purpose-specific interfaces, with one client per feature rather than one large API object.
  - *Dependency inversion:* services depend on interfaces and receive their dependencies through the constructor, wired in one composition root.
- Prefer clear names, small functions, early returns, and explicit types at module boundaries. No `any`; use `unknown` and narrow it.
- Handle errors explicitly. Never swallow them; surface safe, useful messages to the UI and never leak stack traces or secrets.

## Conventions

- Keep platform-only code (filesystem, database, OS APIs) in the backend layer. The UI talks to it only through the exposed clients.
- Read secrets and env vars only in the backend; the UI never sees them.
- Validate all data crossing a trust boundary (IPC, HTTP, file imports) with `zod`.
- Add JSDoc to exported functions, classes and methods.
- {{STYLE_RULES}} <!-- e.g. double quotes, semicolons, trailing commas in multi-line literals. -->

### State management (OPTIONAL: React apps)

- Use React's built-in state (`useState`, `useReducer`) for state owned by one component or a small subtree.
- When state must be shared across components, use **Zustand**. Don't add it until that need actually exists, and don't use Redux, MobX or React Context as a global store.
- Stores live in `{{STORES_DIR}}` as `use<Feature>Store.ts`, one store per feature.
- Stores hold UI state only. Persistent data, secrets and API calls stay in the backend; store actions call the clients and keep the results.
- Put state transitions in pure functions and cover them with property-based tests.
