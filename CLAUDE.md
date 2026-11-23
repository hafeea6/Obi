# CLAUDE.md

Guidance for Claude when working in this repository.

## Project overview

`agentobi` is an Electron desktop app built with Electron Forge, Vite, React 19 and TypeScript. It talks to LLMs through `@openrouter/agent`, and validates data with `zod`. pnpm is the package manager.

## Commands

| Task | Command |
| --- | --- |
| Run the app | `pnpm start` |
| Run tests once | `pnpm test` |
| Watch tests | `pnpm test:watch` |
| Lint | `pnpm lint` |
| Type-check | `npx tsc --noEmit -p .` |
| Package / make installers | `pnpm package` / `pnpm make` |

Before calling a task done, run `pnpm test`, `pnpm lint` and the type-check. All three must pass.

## Architecture

```
src/
  main.ts                 Electron main process entry: window creation, handler registration only
  preload.ts              Preload entry: exposes renderer clients only
  renderer.tsx            React entry
  common/                 Code shared by every process (no Electron or DOM imports)
    ipc/AppChannels.ts    Single source of truth for IPC channel names
  backend/                Main-process code
    services/             Business logic as classes, with no Electron dependencies
    ipc/                  Thin ipcMain handlers that delegate to services
  frontend/               Renderer and preload code
    ipc/                  contextBridge clients wrapping ipcRenderer.invoke
    components/           React components
global.d.ts               Types for APIs exposed on `window`
```

### Adding a feature that crosses IPC

1. Add the channel to `APP_CHANNELS` in `src/common/ipc/AppChannels.ts`, named `app:camelCaseName`.
2. Put the logic in a service class under `src/backend/services/`.
3. Add a thin handler in `src/backend/ipc/` that only validates input and delegates to the service. Register it from `main.ts`.
4. Add a client in `src/frontend/ipc/` and expose it in `preload.ts`.
5. Declare the exposed API on `Window` in `global.d.ts`.
6. Add tests for the service and the handler.

### Process boundaries

- The renderer never imports `electron` or Node modules. It reaches the backend only through the clients exposed in preload.
- Keep `contextIsolation` on and `nodeIntegration` off. Expose narrow, purpose-specific functions over `contextBridge`, never raw `ipcRenderer`.
- Treat every IPC payload from the renderer as untrusted. Validate it with a zod schema in the handler before it reaches a service.
- Secrets such as API keys come from `.env` and stay in the main process. Never send them to the renderer, log them or commit them.

## SOLID principles

- **Single responsibility.** A module or class has one reason to change. Handlers do transport, services do business logic, components do presentation, and clients do IPC calls. Split a file once it starts mixing these concerns.
- **Open/closed.** Extend behavior by adding new services, handlers or strategy implementations rather than adding branches to existing ones. Prefer a map of handlers or a strategy interface over a growing `switch`.
- **Liskov substitution.** Any implementation of an interface must honor its full contract: the same input expectations, return types and error behavior. A test double has to behave like the real thing.
- **Interface segregation.** Keep interfaces small and specific to the client. Expose one focused client per feature on `window` (for example `window.helloWorld`), not one large API object.
- **Dependency inversion.** High-level code depends on abstractions. Pass dependencies such as LLM clients, file systems and clocks into service constructors instead of creating them inside the class, so tests can substitute fakes. Handlers receive their service; they don't build hidden singletons that tests can't replace.

## DRY

- Every piece of knowledge has one authoritative home. Channel names live only in `APP_CHANNELS`. Shared types and zod schemas live in `src/common/`. Derive TypeScript types from schemas with `z.infer` rather than writing them twice.
- Extract a helper once the same logic appears for the third time ("rule of three"). Two similar snippets that may diverge are fine; premature abstraction is worse than small duplication.
- Never copy and paste string literals, magic numbers or config values. Name them as constants.
- DRY applies to knowledge, not to code that merely looks the same. Don't merge two functions that look alike but serve different purposes.

## TypeScript standards

- Strict typing. Don't use `any`. Use `unknown` and narrow it. Avoid non-null assertions (`!`) and unchecked `as` casts outside tests.
- Use `import type` for type-only imports.
- Mark constant objects `as const` and readonly where possible. Prefer immutable data and pure functions.
- Give exported functions and public methods explicit return types.
- Naming: `PascalCase` for classes, components, types and the files that contain them (`HelloWorldService.ts`), `camelCase` for variables and functions, and `UPPER_SNAKE_CASE` for module-level constants.
- Add JSDoc to every exported class, function and method, explaining why rather than restating what the code does.
- Use `async`/`await` rather than promise chains. Never leave a promise floating.

## Error handling

- Fail fast at boundaries: validate input with zod at the IPC handler and at external API responses.
- Throw `Error` objects (or subclasses) with actionable messages, never strings.
- Don't swallow errors. Either handle them meaningfully or let them propagate. The renderer turns errors into user-facing messages, as `HelloWorld.tsx` does.
- Never surface stack traces or secrets in UI messages.

## React standards

- Use function components and hooks only.
- Keep components presentational where possible. Move side effects and IPC calls into custom hooks (`useXxx`) once they grow beyond trivial size.
- Each component file exports one component, named the same as the file.
- Use semantic HTML and accessible markup: labelled controls and `type` on every button.

## Testing

- Use Vitest with fast-check. Put test files next to the code they test as `*.test.ts`.
- Use **property-based tests** (`fc.assert` with `fc.property` or `fc.asyncProperty`) for logic with a meaningful input space, such as parsers, validators, transformations and state reducers. State invariants: round-trips, idempotence, ordering, and "never throws on valid input / always rejects invalid input".
- Use example-based tests for specific, known edge cases and regressions.
- Import fast-check as `import * as fc from "fast-check"` to satisfy the lint rules.
- Test services in isolation by injecting fakes. Test handlers with a fake `IpcMain` that records the registered handlers, as `HelloWorldHandlers.test.ts` does.
- Never make real network or LLM calls in tests.
- Every bug fix comes with a test that would have caught it.

## Self-healing

Hooks in `.claude/settings.json` enforce the checks. Don't work around them.

- After every edit to a `.ts`/`.tsx` file, ESLint runs on that file (`.claude/hooks/lint-edited-file.mjs`). Fix any errors it reports before moving on.
- Before a turn ends, tests, lint and type-check run (`.claude/hooks/verify-on-stop.mjs`). If any fail, the turn continues with the errors. The hook skips the run when nothing has changed since the last green run.

When a check fails:

1. Read the full error and find the root cause before changing anything. Reproduce it with the narrowest command, e.g. `pnpm test <file>`.
2. Fix the cause, not the symptom. Never skip, delete or weaken a test, loosen a type to `any`, add `eslint-disable`, `@ts-ignore` or `--no-verify`, or change config, just to get green.
3. If a test itself is wrong because the requirement changed, update it deliberately and say so in the summary.
4. Rerun the failing check, then the full suite.
5. After three failed attempts at the same problem, or if the fix would break a domain rule or needs a product decision, stop. Explain what's failing, what you tried, and the options.

## Workflow

- Make small, focused changes. Don't refactor unrelated code in the same change.
- Follow the existing patterns in the codebase before introducing new ones. If a new pattern is warranted, apply it consistently and update this file.
- Don't add dependencies without a clear need. Prefer what's already installed (zod, React, Node built-ins).
- Commits use short imperative messages (for example "add property based tests"). Branch off `main` for feature work. Never commit `.env` or other secrets.
- Keep this file up to date when the architecture, commands or conventions change.
