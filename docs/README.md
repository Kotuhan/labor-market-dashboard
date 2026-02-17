# Project Documentation

## Product

- [PRD: Labor Market Dashboard Calculator](product/PRD_Labor_Market_Dashboard.md)

## Workflow

See [workflow.md](workflow.md) for visual Mermaid diagrams of the task workflow.

## Task Roadmap

| ID | Task | Priority | Complexity | Subtasks | Status |
|----|------|----------|------------|----------|--------|
| 1 | Setup React app (Vite + TS + Tailwind + monorepo) | High | 4 | — | Pending |
| 2 | TypeScript data model (TreeNode, DashboardState) | High | 3 | — | Pending |
| 3 | Ukraine labor market default data (75+ nodes) | High | 6 | 4 | Pending |
| 4 | Core state management + auto-balance algorithm | High | 8 | 5 | Pending |
| 5 | Interactive slider components | Medium | 5 | — | Pending |
| 6 | Pie chart visualizations (Recharts) | Medium | 5 | — | Pending |
| 7 | Expandable tree panel UI | Medium | 6 | 4 | Pending |
| 8 | Dashboard layout + mode controls | Medium | 5 | — | Pending |
| 9 | Integration + real-time performance | Medium | 7 | 4 | Pending |
| 10 | Polish UI/UX + GitHub Pages deploy | Medium | 6 | 4 | Pending |

### Dependency Graph

```
1 → 2 → 3 → 4 ─┬─ 5 → 7 ─┬─ 8 → 9 → 10
                └─ 6 ──────┘
```

## Completed Tasks

| Task | Date | Summary |
|------|------|---------|
| task-004 | 2026-02-17 | Implement core state management and auto-balance logic |
| task-005 | 2026-02-17 | Build interactive slider components with lock toggle and number formatting |
| task-006 | 2026-02-17 | Pie chart visualization components with Recharts |
<!-- Completed tasks logged here by PO Summary stage -->

## Task Directory

All task artifacts are in `docs/tasks/task-{id}-{slug}/`. Each contains:

- `task.md` — requirements (PO) + technical design (TL)
- `plan.md` — file-by-file implementation plan
- `insights/` — agent outputs (po-analysis, tl-design, qa-plan, summary, workflow-history)
- `research/` — domain and technical research

## Other Documentation

- [Architecture](../architecture/) — ADRs, contracts, diagrams, roadmap, runbooks
- [Knowledge Base](../knowledgebase/) — Research repository managed by Researcher agent
