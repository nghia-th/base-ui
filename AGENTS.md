# AI Coding Agent Guide

## Purpose
This guide provides reliable instructions for an AI coding agent working on the **quiz-ui** project. It ensures the agent respects the existing architecture, coding conventions, and quality gates, while allowing legitimate development tasks.

## Project Overview
- **Framework**: React 19 (Create‑React‑App) + TypeScript.
- **UI library**: MUI v6 (material, icons, X‑components) with a custom theme (`src/theme/muiTheme.ts`).
- **State / Business logic**: BLoC pattern (`src/ui/bloc/`) built on RxJS `Subject` streams, coordinated by a **singleton `BlocApplication`** instance that lives for the whole app.
- **Routing**: `react-router-dom` v6 – routes are defined in `src/AppWrapper.tsx`.
- **API layer**: Thin wrappers in `src/api/` using Axios (`RequestBase`). Calls are made through helper functions in `src/base/CallApi.ts` and the abstract `IBloc` class.
- **Testing**: Jest + React Testing Library (`npm test`). No test files exist yet, but the framework is ready.
- **Build / dev**: `react-scripts` (CRA) – scripts in `package.json` (`start`, `build`, `test`, `eject`, `format`).
- **Other utilities**: `src/base/` (LocalStorage, AppContext, PrefixService, etc.), `src/utils/`, `src/quiz-net/`.

## Language Rules
- All AI responses to the user must be written in Vietnamese with full diacritics.
- Switch to English only when the user explicitly requests English.
- Keep technical terms, code identifiers, API paths, file names, class names,
  function names, variable names, and enum values in their original form.
- Explain project behavior, implementation decisions, and errors in Vietnamese.
- Follow the existing project rules for source-code comments and documentation language.

## Source Code Language Rules
- All comments and documentation comments inside source code files must be written in English.
- Do not write Vietnamese comments in `.ts`, `.tsx`, `.js`, `.jsx`, or other source-code files.
- Technical identifiers, API paths, file names, class names, function names, variable names, and enum values must remain in their original form.
- User-facing UI text must follow the project's i18n/translation conventions; do not hard-code Vietnamese UI text when the existing project provides a translation mechanism.

## Project Documentation
The `docs/` directory contains frontend-facing product and business context.

Recommended reading order:
1. `docs/PROJECT.md` — product purpose, users, and MVP scope.
2. `docs/BUSINESS_RULES.md` — business rules that UI must respect.
3. `docs/DATA_MODEL.md` — frontend-facing entities and relationships.
4. `docs/API.md` — frontend API contract and visibility constraints.
5. `docs/UI_WORKFLOWS.md` — user-visible workflows and UI states.

Read the relevant documentation before implementing a feature. Do not load unrelated
documents when they are not needed for the current task.

The backend documentation is the source of truth for backend behavior. Do not invent
or silently change business rules when frontend requirements are unclear.

The backend remains the final authority for authorization and business validation.
The UI should prevent known invalid actions when the state is known, but must always
handle backend `401`, `403`, validation, and business-rule errors correctly.

## Architecture
```
src/
├─ api/                ← API wrapper classes (Axios based)
├─ base/               ← Core utilities (IBloc, CallApi, RequestBase, LocalStorage, AppContext)
├─ theme/              ← MUI theme helpers
├─ utils/              ← Generic helpers (DateUtils, CameraUtils, …)
├─ quiz-net/           ← Additional network helpers
├─ ui/
│   ├─ layout/        ← Sidebar, Topbar, Footer, menus, breadcrumbs
│   ├─ pages/         ← Route pages (login, dashboard, parent/*, student/*, demo pages)
│   ├─ components/    ← Re‑usable UI components and demo widgets
│   ├─ bloc/          ← BLoC classes (BlocApplication, BlocLogin, BlocDashboard, …)
│   └─ AppShell.tsx   ← Main shell (topbar + sidebar) used after login
├─ App.tsx            ← Root component – creates singleton BlocApplication, Router, SnackbarProvider
├─ AppWrapper.tsx     ← Provides ThemeProvider, UIStream, AppContext, and route definitions
├─ index.js           ← **Entry point** – ReactDOM.createRoot → <App/>
├─ reportWebVitals.js ← CRA‑generated, normally left untouched
└─ … (css, assets)
```
- **Singleton `BlocApplication`** (`src/ui/bloc/BlocApplication.ts`) stores UI state, dialog streams, and runs the `loadInit` routine.
- **UIStream** (`src/ui/components/common/UIStream.tsx`) consumes BLoC streams and re‑renders UI.
- **ThemeProvider** appears **once** in `AppWrapper.tsx`; dialogs rendered outside the normal tree still receive the correct theme.
- **LocalStorage** is the only persistence mechanism for auth token and UI preferences.

## Development Principles
1. **Primary work area** – `src/`. Top‑level files (`package.json`, `tsconfig.json`, `public/` assets) may be edited **only when the user explicitly requests** it.
2. **Inspect before you modify** – always use the `read` tool before any `edit` or `write`.
3. **Follow existing patterns** – BLoC + RxJS streams, `UIStream`, single `ThemeProvider`, MUI styling conventions.
4. **Ask when uncertain** – use the `question` tool for any ambiguous requirement or design decision.
5. **Avoid unrelated changes** – modify only the files required for the current task.

## Coding Rules
- **File naming**: Components & pages → `PascalCase.tsx`; utils/helpers → `camelCase.ts`; API wrappers → `PascalCaseApi.ts`.
- **Component style**: functional components with hooks; no class components.
- **Hooks**: use `useMemo`, `useEffect`, `useCallback` only when the existing code already does so; avoid unnecessary memoisation.
- **State**: never store BLoC‑derived data directly in component state; use `UIStream` and the appropriate stream keys.
- **Theme**: never introduce another `ThemeProvider`; rely on the single provider in `AppWrapper.tsx`.
- **Dialogs**: invoke via `BlocApplication.showAlert*` / `showConfirm`; do not render `AlertDialog` or `ConfirmDialog` directly.
- **API calls**: must use the helpers in `IBloc` (`apiRequest`, `apiSyncMultiRequest`, `apiMultiRequest`). Direct `axios` usage is prohibited.
- **Error handling**: use the `apiHandler` contract (`showLoading`, `onUnAuth`, `onError`) supplied by `AppWrapper`.
- **LocalStorage**: access only through the `LocalStorage` class.
- **Create new source files** only within the appropriate `src/` sub‑folder (e.g., `src/ui/components`, `src/ui/bloc`, `src/api`). Documentation files may be added under `docs/`.
- **Tests**: when new BLoC, component, or API wrapper is added, write at least one Jest/React‑Testing‑Library test covering the core behavior.

## File and Change Management
1. **Read → Write**: always `read` a file before editing it with `edit`/`write`.
2. **Report changes**: after a modification, list every file that was added, edited, or deleted.
3. **Atomic changes**: keep each logical change in a minimal set of files; do not mix unrelated edits.
4. **Documentation**: add comments only when they clarify non‑obvious logic; avoid excessive comments or emojis.

## State Management
- All mutable state lives inside BLoC classes (`_blocData` and `_stream`).
- UI subscribes via `UIStream`; the only direct UI‑state read is `BlocApplication.getUI()`.
- `AppContext` provides `apiHandler`, the singleton `app`, translation (`t`), and date‑time formats – **no other global state** should be introduced.
- `LocalStorage` persists UI preferences and auth token; never store additional data there without explicit user request.

## UI Development
- Use **MUI components**; follow the existing theme usage (`muiTheme.ts`).
- Layout components (`AppShell`, sidebars, topbars) must remain wrapped by the single `ThemeProvider` in `AppWrapper.tsx`.
- New UI components belong under `src/ui/components/` (or a suitable sub‑folder) and should be exported as the default export.
- Dialogs (`AlertDialog`, `ConfirmDialog`) must be invoked through the streams (`dialogAlert`, `dialogConfirm`) defined in `BlocApplication`.

## API Development
- Define a new endpoint as a class in `src/api/` that returns a `RequestBase` instance.
- Do **not** import `axios` directly; use the provided `RequestBase` wrapper.
- Call the endpoint from a BLoC method using the `apiRequest`, `apiSyncMultiRequest`, or `apiMultiRequest` helpers.
- Errors are handled through the `apiHandler` supplied by `AppWrapper` (shows snackbar, handles 401/999, etc.).

## Testing and Verification
1. **Write tests** for any new BLoC, component, or API wrapper (Jest + React Testing Library). Place them next to the implementation (`MyComponent.test.tsx`).
2. **Run the full verification pipeline** after changes:
   ```bash
   npm run format            # Prettier
   # If a lint script exists:
   # npm run lint
   npm test -- --watchAll=false   # Jest, non-interactive verification
   npm run build                  # Ensure production build succeeds
   ```
3. All commands must exit with status 0; any failure blocks the AI from reporting success.
4. The AI must include a concise summary of the command output (or indicate success) in its final report.

## Error Handling
- All API calls go through `CallApi` / `CallMultiApi` (see `src/base/CallApi.ts`).
- `httpError` with `code === 401` or `999` triggers `onUnAuth` (clears token, redirects to login).
- Other errors are sent to `onError`, which the UI displays via a snackbar (`useSnackbar`).
- Loading state is controlled through `showLoading` passed in the `apiHandler`.

## Git Rules
- **Never commit, push, or open a PR** without an explicit request from the user.
- When committing, **stage only** the files that belong to the current task (`git add <list>`).
- Do not amend or rewrite commits created by someone else unless the user asks for it.
- Do not use destructive Git commands (`reset --hard`, `checkout --`) unless explicitly authorized.

## Definition of Done
A task is complete when **all** of the following are true:
1. Code compiles (`npm run build` succeeds) **or** the dev server starts without type errors (`npm start`).
2. All **new or modified** files are listed in the AI’s final report.
3. `npm run format` completes with no pending changes.
4. If a lint script exists, `npm run lint` completes without errors.
5. `npm test` runs and returns exit code 0 (including any new tests the AI added).
6. The requested behavior is verified either by test assertions or by manual inspection of the running app.
7. No unrelated files were touched.
8. The AI reports any remaining manual steps (e.g., “run `npm start` to view the UI”) and confirms that the repository is in a clean state.

---
*This file contains only guidance and does not modify any source code.*