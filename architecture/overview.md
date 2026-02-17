# Architecture Overview

## System Components

### Labor Market Dashboard (SPA)

Single-page application for interactive labor market modeling.

| Component | Technology | Purpose |
|-----------|------------|---------|
| App Shell | React 18+ / Vite | Component framework, fast HMR |
| State Management | Zustand / useReducer | Tree state, auto-balance logic |
| Visualization | Recharts | Animated pie charts with tooltips |
| Styling | Tailwind CSS | Utility-first responsive design |
| Hosting | GitHub Pages | Static SPA, no backend |

### Data Architecture

Tree-based model with 3 levels of depth:

```
Root: Total Employed (13,500k)
  ├─ Level 1: Gender (Male 52% / Female 48%)
  │   ├─ Level 2: Industries (15+ KVED sectors)
  │   │   └─ Level 3: Subcategories (75+ breakdowns)
```

Key interfaces:
- `TreeNode` — recursive node with percentage, absoluteValue, genderSplit, children, isLocked
- `DashboardState` — totalPopulation, balanceMode ('auto' | 'free'), tree root

### Auto-Balance Algorithm

When a slider changes in auto-balance mode:
1. Locked siblings remain fixed
2. Remaining percentage redistributed proportionally among unlocked siblings
3. Absolute values recalculated recursively down the tree
4. Sum always equals 100% at each level

Free mode: independent sliders, sum may deviate from 100% (warning shown).

## Tech Stack

| Category | Technology | Rationale |
|----------|------------|-----------|
| Framework | React 18+ | Component model, hooks, ecosystem |
| Language | TypeScript (strict) | Type safety for tree operations |
| Build | Vite | Fast HMR, optimal bundle |
| Styles | Tailwind CSS | Rapid prototyping, responsive |
| Charts | Recharts | Pie chart support, animations |
| State | Zustand / useReducer | Lightweight tree state |
| Tests | Vitest + RTL | Unit and integration tests |
| CI/CD | GitHub Actions | Auto-deploy on push to main |
| Hosting | GitHub Pages | Free, static SPA |

## Module Inventory

| Module | Location | Responsibility |
|--------|----------|----------------|
| Slider | `src/components/Slider/` | Range input + numeric input + lock toggle |
| PieChart | `src/components/PieChart/` | Recharts wrapper with animations & tooltips |
| TreePanel | `src/components/TreePanel/` | Expandable/collapsible category hierarchy |
| ModeToggle | `src/components/ModeToggle/` | Auto-balance / Free mode switch |
| SummaryBar | `src/components/SummaryBar/` | Total population input + statistics |
| ResetButton | `src/components/ResetButton/` | Reset to defaults + confirmation modal |
| useTreeState | `src/hooks/useTreeState.ts` | Tree state management (reducer/Zustand) |
| useAutoBalance | `src/hooks/useAutoBalance.ts` | Auto-balance redistribution algorithm |
| defaultTree | `src/data/defaultTree.ts` | Ukraine labor market default data |
| types | `src/types/tree.ts` | TreeNode, DashboardState interfaces |
| calculations | `src/utils/calculations.ts` | Absolute value recalculation |
| format | `src/utils/format.ts` | Number formatting (UA locale, thousands separator) |

## Security Architecture

- No backend, no authentication required
- No user data stored (pure client-side SPA)
- No API calls to external services
- All data is static, bundled with the app

## Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Slider update latency | < 100ms |
| NFR-02 | Lighthouse Performance | > 90 |
| NFR-03 | Lighthouse Accessibility | > 90 |
| NFR-04 | Desktop + Tablet responsive | 1024px+ |
| NFR-05 | Mobile responsive | 320px+ |
| NFR-06 | Browser support | Chrome, Firefox, Safari, Edge |
| NFR-07 | Bundle size | < 500KB gzipped |
| NFR-08 | Animation framerate | 60fps |

## Known Limitations

- Data accuracy: all figures after 2021 are estimates with varying methodology
- No data export (JSON/CSV/PDF) in v1
- No scenario save/load in v1
- No multi-language support in v1
- No side-by-side scenario comparison in v1
