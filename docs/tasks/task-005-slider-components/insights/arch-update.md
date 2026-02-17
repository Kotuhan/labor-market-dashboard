# Architecture Update: task-005
Generated: 2026-02-17

## Impact Assessment

Task-005 introduced the first interactive UI component (Slider) and established patterns that all future dashboard components will follow. The architectural impact is moderate -- no new ADRs are needed, but the architecture documentation required updates to reflect new modules, a changed test environment, and the emergence of the controlled component pattern as a documented convention.

Key changes:
1. **New `src/components/` module** -- First UI component directory. The Slider establishes the controlled component pattern (props-driven, dispatch upward) and the barrel export convention for components.
2. **New `src/utils/format.ts` module** -- Reusable formatting utilities (Ukrainian "тис." abbreviation, percentage formatting). Shared by Slider now, PieChart and SummaryBar in future tasks.
3. **Vitest environment changed from `'node'` to `'jsdom'`** -- Global change affecting all tests. Existing pure-logic tests (types, data, utils, hooks) are unaffected by jsdom availability, but the default environment is now jsdom.
4. **New test infrastructure** -- `setupFiles`, `css: false`, and 4 new devDependencies (`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`). This is the standard test setup for all future component tests.
5. **Custom CSS for native range inputs** -- Added to `index.css` with vendor-prefixed pseudo-elements and Tailwind v4 CSS custom properties. This is component-specific CSS, not an architectural pattern change.

## Updates Made

- `architecture/overview.md`: Module Inventory -- moved Slider and format.ts from "Planned" to "Implemented", added 6 new entries (Slider, Components Barrel, Format Utility, Test Setup, Format Tests, Slider Tests) with task-005 attribution. Removed Slider and format from "Planned" section.
- `architecture/overview.md`: Vitest Configuration Pattern -- updated `environment` from `'node'` to `'jsdom'`, added `setupFiles` and `css` settings, clarified plugin guidance.
- `architecture/overview.md`: Added "Component Testing Convention" subsection documenting RTL libraries, versions, and testing patterns (userEvent, cleanup, makeProps factory, vi.fn dispatch mock, setup file).
- `architecture/overview.md`: Added "Controlled Component Pattern" subsection documenting the component design pattern established by Slider (props-driven, minimal local state, dispatch upward, useEffect prop sync, no premature useCallback).

## Retroactive ADRs Created

None -- no implicit architectural decisions found. The key decisions in this task are all component-level implementation choices:
- Native HTML5 `input[type=range]` (no third-party slider library) -- this is a component-level decision, not architecture-level
- Manual `formatWithSpaces()` over `Intl.NumberFormat` -- a utility implementation detail, documented in app CLAUDE.md
- jsdom as Vitest environment -- standard practice for React component testing, not a novel architectural decision

## Recommendations

1. **Future component tasks (PieChart, TreePanel, ModeToggle, SummaryBar, ResetButton)** should follow the controlled component pattern and component testing conventions now documented in `architecture/overview.md`.
2. **The test infrastructure is complete** -- future component tasks do not need to add RTL dependencies or modify vitest.config.ts. They only need to create new `*.test.tsx` files in `src/__tests__/components/`.
3. **Consider a shared icon approach** if more components need SVG icons beyond Slider's lock/unlock. Currently inline SVGs from Heroicons (MIT) are used, which is fine for 2 icons but may warrant a lightweight icon utility if the count grows significantly.
