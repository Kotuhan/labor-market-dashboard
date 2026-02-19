# CLAUDE.md

## Communication

<!-- Define your language preferences here -->
<!-- Example: User writes in Ukrainian, Claude responds in English. -->
User writes in Ukrainian, Claude responds in English.
## Project Overview

**Labor Market Dashboard Calculator** — interactive SPA for modeling "what-if" scenarios on Ukraine's labor market. Tree-structured data (gender → industry → subcategory) with real-time sliders and pie charts. No backend, hosted on GitHub Pages.

- **Total employed (default)**: 13 500 000
- **Gender split**: 52.66% male / 47.34% female (derived from weighted industry data)
- **Industries**: 16 KVED sectors per gender (32 total)
- **Subcategories**: 10 IT subcategories per gender (20 total); other industries are leaf nodes
- **Slider modes**: auto-balance (100% constraint) and free (independent)

## Tech Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **App**: React 19 with TypeScript 5.7 (strict)
- **Build**: Vite 6
- **Styling**: Tailwind CSS v4 (CSS-first config, `@tailwindcss/vite` plugin -- no `tailwind.config.js`)
- **Charts**: Recharts 2.x (2.15.x -- not 3.x, see app CLAUDE.md for rationale)
- **State**: React `useReducer` (no external state library)
- **Routing**: wouter (~2KB gzipped) for hash-based client-side routing (see ADR-0006 for rationale)
- **Tests**: Vitest + React Testing Library
- **Linting**: ESLint v8 (legacy `.eslintrc.cjs` format across monorepo)
- **Hosting**: GitHub Pages via GitHub Actions

## Project Structure

```
apps/
  labor-market-dashboard/    # Main React SPA (Vite + React + TS)
    src/
      __tests__/             # Tests mirroring src/ structure
      components/            # DashboardHeader, GenderSection, ModeToggle, ResetButton, Slider, PieChartPanel, GenderBarChart, BarChartTooltip, ChartTooltip, ChartLegend, TreePanel, TreeRow
        layout/              # AppLayout (shell), Sidebar (collapsible nav) -- wouter routing
      data/                  # defaultTree.ts, dataHelpers.ts, chartColors.ts — Ukraine labor market defaults + chart colors
      hooks/                 # useTreeState (useReducer-based state management)
      types/                 # TreeNode, GenderSplit, BalanceMode, DashboardState, TreeAction
      utils/                 # treeUtils.ts (tree ops, mutations), calculations.ts (auto-balance), format.ts (number display), chartDataUtils.ts (chart data transforms), slugify.ts (Ukrainian → ASCII slugs)
packages/config/             # Shared ESLint, TS configs
architecture/                # ADRs, contracts, diagrams, roadmap, runbooks
docs/                        # Documentation, tasks (see docs/CLAUDE.md)
knowledgebase/               # Central research repository (managed by Researcher agent)
.claude/                     # Claude Code configuration
.taskmaster/                 # Task Master AI integration
```

## Module Documentation

| Directory                          | CLAUDE.md                                                                                    | Description                              |
| ---------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `apps/labor-market-dashboard/`     | [apps/labor-market-dashboard/CLAUDE.md](apps/labor-market-dashboard/CLAUDE.md)               | React SPA -- Vite, Tailwind v4, patterns |
| `packages/config/`                 | [packages/config/CLAUDE.md](packages/config/CLAUDE.md)                                       | Shared TS/ESLint/Prettier configs        |
| `knowledgebase/`                   | [knowledgebase/CLAUDE.md](knowledgebase/CLAUDE.md)                                           | Research repository, technical docs      |
| `docs/`                            | [docs/CLAUDE.md](docs/CLAUDE.md)                                                             | Tasks, workflow docs                     |
| `architecture/`                    | [architecture/CLAUDE.md](architecture/CLAUDE.md)                                             | ADRs, contracts, diagrams, roadmap       |
| `.claude/`                         | [.claude/CLAUDE.md](.claude/CLAUDE.md)                                                       | Agent, command, skill definitions        |

## Commands

```bash
pnpm dev          # Run all apps
pnpm build        # Build all apps
pnpm lint         # Lint all apps
pnpm test         # Run all tests
pnpm format       # Format all files
```

## Verification Requirements

Before completing any implementation:
1. State how you will verify the implementation
2. Run `pnpm lint` and `pnpm test`
3. Run `pnpm build` to ensure no build errors

## DO NOT

- Use `any` type - use proper types or `unknown`
- Skip error handling
- Store secrets in code
- Create components > 200 lines
- Use WebSearch/WebFetch directly - always use `/research` skill instead
- Change workflow stages/sequences without updating `docs/workflow.md` Mermaid diagrams and getting user review
- Auto-resolve open questions — ALL open questions (from PO or TL phases) must be presented to the user for decision via `AskUserQuestion`. The workflow must pause until the user answers
- Name a prop `children` when passing data arrays (e.g., `TreeNode[]`) -- `children` is reserved by React. Use `nodes`, `items`, or `data` instead

## Established Patterns

### Shared Config Extension Pattern

All apps extend shared configs from `packages/config/` (see [packages/config/CLAUDE.md](packages/config/CLAUDE.md)):
- **TypeScript**: `tsconfig.json` extends `@template/config/typescript/{variant}` (variants: `base`, `next`, `nest`, `react`)
- **ESLint**: `.eslintrc.cjs` extends via `require.resolve("@template/config/eslint/{variant}")`
- New app types require creating both a TS and ESLint variant, plus updating `packages/config/package.json` exports

### App Scaffolding Convention

- Package name: `@template/{app-name}`
- `"type": "module"` in `package.json` (required for Vite)
- `@template/config` as `workspace:*` devDependency
- Required scripts: `dev`, `build`, `lint`, `test`, `clean`
- `clean` script: `rm -rf dist node_modules .turbo`

### Vite + React App Pattern

- Build: `tsc --noEmit && vite build` (NOT `tsc -b` -- see app CLAUDE.md for why)
- Path alias: `@` -> `./src` in both `vite.config.ts` and `tsconfig.json`
- Tailwind CSS v4: `@tailwindcss/vite` plugin, CSS-first config (`@import "tailwindcss"`)
- `@types/node` required as devDependency for `vite.config.ts`
- `vite-env.d.ts` in `src/` for Vite client type declarations

### Vitest Testing Pattern

- Separate `vitest.config.ts` per app (not merged into `vite.config.ts`)
- `@` path alias must be replicated in `vitest.config.ts` (does not inherit from Vite config)
- `vitest.config.ts` must be added to `tsconfig.node.json` `include` array
- Test script: `vitest run` (not `vitest` which runs in watch mode)
- Tests in `src/__tests__/` mirroring source structure (see app CLAUDE.md for details)
- Use `.ts` extension (not `.tsx`) for files without JSX -- avoids `react-refresh/only-export-components` warning
- **jsdom environment**: Required for React component tests (`@testing-library/react`). Pure-logic tests are unaffected.
- **Test setup file**: `src/__tests__/setup.ts` imports `@testing-library/jest-dom/vitest` (note the `/vitest` entry point)
- **Vitest v3 mock syntax**: `vi.fn<(arg: Type) => ReturnType>()` -- NOT the v2 tuple style `vi.fn<[Type], ReturnType>()`
- **ResizeObserver mock**: Required for Recharts `ResponsiveContainer` in jsdom -- see app CLAUDE.md for the mock pattern
- **wouter test isolation**: Use `memoryLocation` from `wouter/memory-location` to create in-memory location hooks for routing tests -- avoids `window.location.hash` dependency. Wrap component in `<Router hook={hook}>` where `hook` comes from `memoryLocation({ path: '/' })`

### Data Conventions

- **Percentages are source of truth** -- absolute values are derived via `Math.round(parent.absoluteValue * percentage / 100)`
- **Rounding**: Largest-remainder method (Hamilton's method) via `largestRemainder()` in `src/data/dataHelpers.ts` -- ensures sibling percentages sum to exactly 100.0
- **Node ID scheme**: flat, predictable IDs -- `root`, `gender-male`, `gender-female`, `{gender}-{kved}`, `{gender}-{kved}-{slug}` (all lowercase, kebab-case)
- **Labels**: Ukrainian language for all node labels
- **Gender split**: Derived from weighted industry data (52.66/47.34), NOT the PRD's rounded 52/48
- **Numeric formatting in code**: Underscore separators for large numbers (`13_500_000`, `1_194_329`)
- **Display formatting**: Ukrainian "тис." abbreviation for values >= 1000 (e.g., "13 500 тис."); percentages always 1 decimal place (e.g., "18.5%"); full numbers with space-separated thousands (e.g., "13 500 000") for population input. Use `formatAbsoluteValue()`, `formatPercentage()`, and `formatPopulation()` from `src/utils/format.ts`

### State Management Pattern

- **useReducer** with exported reducer function for direct testing (no `renderHook` needed)
- Pure utility functions in `utils/` for testability; reducer composes them; hook is a thin wrapper
- Immutable tree updates via recursive spread (no Immer, no structural sharing)
- `largestRemainder()` used for all percentage rounding (1 decimal place, exact 100.0 sums)
- **Tree mutations**: `addChildToParent()` and `removeChildFromParent()` always use `largestRemainder()` for equal redistribution. Both are followed by `recalcTreeFromRoot()` to update all `absoluteValue` fields.
- **Custom nodes**: User-added industries/subcategories marked with `defaultPercentage: 0` (vs. default nodes with `defaultPercentage > 0`)
- **Label-to-ID conversion**: `slugify()` transliterates Ukrainian labels to kebab-case ASCII slugs (e.g., "Кібербезпека" → "kiberbezpeka"). Combined with `generateUniqueId()` to prevent collisions.
- **UI-only state stays local**: Expand/collapse, focus tracking, etc. use `useState` in the component -- NOT added to the reducer. Only data with business logic implications goes in the reducer.
- See [apps/labor-market-dashboard/CLAUDE.md](apps/labor-market-dashboard/CLAUDE.md) for full details

### Component Pattern

- **Router boundary**: App.tsx is the router boundary -- calls `useTreeState()` ABOVE `<Router>` so state persists across route transitions. Uses `<Router hook={useHashLocation}>` + `<Switch>` from wouter. AppLayout (sidebar + content shell) wraps all routes. Pages receive `state`/`dispatch` via props (no React Context).
- **Page components**: DashboardPage extracts the former App.tsx content (DashboardHeader + 2 GenderSections). Future pages (ConfigPage) follow the same `{state, dispatch}` props pattern.
- **Controlled components**: No internal value state -- receive percentage/values as props, dispatch actions upward
- **Minimal local state**: Only for input fields needing partial-typing support (string state synced from props via `useEffect`). Pattern used by Slider and DashboardHeader (population input).
- **Read-only visualization**: Chart components (pie + bar) receive data as props, render only, no dispatch. Use `React.memo` for performance. Pie charts use `nodes: TreeNode[]`; bar chart uses `maleNode` + `femaleNode` props.
- **Layout components**: `components/layout/` subdirectory contains AppLayout (flex shell with local `isSidebarOpen` state) and Sidebar (collapsible nav with wouter `Link` + `useLocation` for active styling). Layout has its own barrel (`layout/index.ts`) re-exported from the main barrel.
- **Section container**: GenderSection pairs TreePanel + PieChartPanel per gender. TreePanel uses single-gender API (`genderNode` prop, not full tree root).
- **Container + recursive child**: TreePanel (container, manages UI-only expand/collapse state via `useState<Set<string>>`) + TreeRow (recursive, `React.memo`, renders mini pie charts for expanded nodes).
- **Barrel exports**: `components/index.ts` exports component + `export type` for props interface (15 dashboard + 6 config components + layout re-exports)
- **Touch targets**: All interactive elements >= 44x44px (WCAG 2.5.5)
- **Heading hierarchy**: `<h1>` in DashboardHeader (title) -> `<h2>` in TreePanel (gender sections). Required by WCAG 1.3.1.
- See [apps/labor-market-dashboard/CLAUDE.md](apps/labor-market-dashboard/CLAUDE.md) for full details

### Chart Color Conventions

- **Industry colors**: Fixed KVED-code-to-hex mapping in `src/data/chartColors.ts` -- ensures consistent colors across male/female charts and future chart types
- **Hex values required**: Recharts `<Cell fill={color}>` needs hex strings, not Tailwind class names or CSS custom properties
- **Subcategory colors**: Opacity-based shading from parent industry color via `generateSubcategoryColors()`
- **Ghost slice**: Gray unallocated slice in free mode when sum < 100%; overflow badge when > 100%

### Utility Module Conventions

- Interfaces co-located with producing functions in `utils/` (not in `types/`), e.g., `SiblingInfo` in `treeUtils.ts`
- Barrel exports in `utils/index.ts`: value exports for functions, `export type` for interfaces
- ESLint enforces import ordering: external packages first, then `@/` aliases (grouped and separated by blank line), then relative imports

### Type Definition Conventions

- Named exports only, no default exports (no exceptions -- App.tsx also uses named export)
- Barrel re-exports use `export type { ... }` syntax for type-only modules
- JSDoc on all interfaces and type aliases, with field-level docs for non-obvious fields
- String literal union types preferred over enums for small fixed sets

## Agent Rules

### Research Policy (MANDATORY FOR ALL AGENTS)

**ALL research and web searches MUST go through the `researcher` agent.**

This rule applies to:
- Main Claude Code session
- ALL sub-agents spawned via Task tool (Explore, Plan, backend-developer, etc.)
- ANY agent that needs external information

#### How to Do Research

```yaml
# CORRECT: Spawn researcher agent
Task(
  subagent_type: "researcher",
  prompt: "Research topic XYZ"
)

# ALSO CORRECT: Use /research skill (which spawns researcher agent)
/research topic XYZ
```

```yaml
# WRONG: Direct tool usage (NEVER DO THIS)
WebSearch("topic XYZ")
WebFetch("https://example.com/...")
```

#### Why This Matters

1. **Knowledge base indexing** - Researcher updates `knowledgebase/CLAUDE.md` index
2. **Deduplication** - Researcher checks existing research first
3. **Persistence** - Findings saved for future sessions
4. **Staleness tracking** - Research has expiration dates

#### Researcher Agent Responsibilities

The researcher agent (spawned via Task tool) will:
1. Check `knowledgebase/CLAUDE.md` index for existing research
2. Use WebSearch/WebFetch if new research needed
3. Create file in `knowledgebase/{domain}/{topic-slug}.md`
4. Update the index in `knowledgebase/CLAUDE.md`
5. Return summary to calling agent

## Multi-Agent Workflow

Use `/workflow/invoke-director TASK-ID` to orchestrate development tasks. See `.claude/agents/` for available agents.

## Available Commands

- `/build-check` - Build all apps and verify success
- `/lint-fix` - Run formatters and linters
- `/test-all` - Run all tests across monorepo
- `/research <topic> [--task <id>]` - Find or conduct research on technical topics

## Task Master Integration

Use Task Master for project management:

- `task-master list` - Show all tasks
- `task-master next` - Get next task
- `task-master show <id>` - View task details

### Subtask Workflow (Decomposition)

Large or complex tasks can be decomposed into subtasks after TL design. The Director recommends decomposition based on step count and complexity.

**Parent task lifecycle:**
```
backlog -> arch-context? -> po -> tl -> arch-review -> decomposed -> (subtasks execute) -> parent-qa -> context-update -> arch-update -> po-summary -> git-commit -> done
```

**Subtask lifecycle (simplified -- skips PO/TL):**
```
dev-planning -> implementation -> qa-verification -> context-update -> git-commit -> done
```

**Visual workflow**: See [docs/workflow.md](docs/workflow.md) for Mermaid diagrams.

**Directory structure:**
```
docs/tasks/task-{id}-{slug}/
  task.md, insights/, research/     # Parent artifacts
  subtasks/
    {id}.1-{slug}/
      task.md, plan.md
      insights/workflow-history.md
    {id}.2-{slug}/ ...
```

**Key rules:**
- Parent provides "what/why" (PO + TL). Subtasks provide "how" (DEV + code).
- Subtasks share parent's `research/` directory.
- Each subtask is independently committable.
- When all subtasks done -> parent-level integrated QA -> context-update -> arch-update -> po-summary -> done.
- Subtasks skip all architect stages (arch-context, arch-review, arch-update) -- architect governs parent-level only.
- arch-review is a mandatory hard gate after TL design (max 2 rejections before user escalation).
- PO Summary creates `insights/summary.md` and updates `docs/README.md`.

**Decomposition criteria** (Director recommends when ANY of):
- Steps >= 5 (regardless of complexity)
- Steps >= 3 AND high complexity (new module, multiple tech domains, external integrations)
- TL design estimates total effort > 2 days

## Implementation Status

Managed via TaskMaster. Use `task-master list` to see current tasks and their statuses.
