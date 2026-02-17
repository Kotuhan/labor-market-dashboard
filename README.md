# Labor Market Dashboard Calculator

Interactive web tool for modeling "what-if" scenarios on Ukraine's labor market. Visualizes employment distribution by gender, industries, and subcategories as a tree structure with real-time sliders and pie charts.

## Key Features

- **Tree-based data model**: 3-level hierarchy — gender → industry (KVED) → subcategory
- **Real data**: default values from official Ukrainian statistics (2021–2024)
- **Interactive sliders**: auto-balance and free modes with lock per category
- **Pie charts**: animated, with tooltips showing absolute numbers and percentages
- **SPA**: no backend, hosted on GitHub Pages

## Tech Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Framework**: React 18+ with TypeScript (strict)
- **Build**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State**: Zustand / useReducer
- **Tests**: Vitest + React Testing Library
- **Hosting**: GitHub Pages via GitHub Actions

## Prerequisites

- Node.js 22+
- pnpm 9+

## Getting Started

```bash
pnpm install
pnpm dev
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run all apps in dev mode |
| `pnpm build` | Build all apps |
| `pnpm lint` | Lint all apps |
| `pnpm test` | Run all tests |
| `pnpm format` | Format all files |
| `pnpm clean` | Clean all build outputs |

## Project Structure

```
apps/
  labor-market-dashboard/    # Main React SPA
    src/
      components/            # UI components (Slider, PieChart, TreePanel, etc.)
      data/                  # Default Ukraine labor market data
      hooks/                 # useTreeState, useAutoBalance
      types/                 # TreeNode, DashboardState interfaces
      utils/                 # Calculations, formatting
packages/
  config/                    # Shared ESLint, TS, Prettier configs
architecture/                # ADRs, contracts, diagrams
docs/                        # Tasks, workflow docs
knowledgebase/               # Research repository
```

## Data Sources

Default values based on:
- State Statistics Service of Ukraine (2019–2021)
- UNICEF HSES 2024
- NBU Inflation Report 2024–2025
- World Bank / ILO
- DOU.ua — IT Specialist Portrait 2024
- DOU.ua — Programming Languages Rating 2024–2025

> All data after 2021 are estimates with varying methodology. Gender proportions within sectors based on State Statistics and FAO National Gender Profile 2021.

## License

Private - All rights reserved
