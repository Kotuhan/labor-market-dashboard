# Implementation Plan: Subtask 11.2 -- Layout and Routing

Generated: 2026-02-19

## Overview

This subtask introduces client-side routing with wouter, creates AppLayout and Sidebar navigation components, extracts DashboardPage from the current App.tsx, and restructures App.tsx to be the router boundary. After this subtask, the app has two navigable pages (Dashboard at `/#/` and a placeholder Config at `/#/config`) with a collapsible sidebar for navigation.

**Prerequisite**: Subtask 11.1 already installed wouter v3.9.0 and added the 4 new reducer actions, tree mutation utilities, and slugify utility.

## TL Design Steps Covered

- **Step 7**: Create layout components (AppLayout + Sidebar)
- **Step 8**: Create DashboardPage component
- **Step 15**: Restructure App.tsx with hash router

## Implementation Order

1. Create `Sidebar.tsx` (leaf component, no dependencies on other new components)
2. Create `AppLayout.tsx` (depends on Sidebar)
3. Create `layout/index.ts` barrel
4. Create `DashboardPage.tsx` (extracts current App.tsx JSX)
5. Modify `App.tsx` (restructure as router boundary)
6. Update `components/index.ts` barrel
7. Create `Sidebar.test.tsx`
8. Create `DashboardPage.test.tsx`
9. Final verification (lint, test, build)

---

## File-by-File Changes

### File 1: `apps/labor-market-dashboard/src/components/layout/Sidebar.tsx`

**Action**: CREATE

**Props Interface**:

```typescript
/** Props for the Sidebar component. */
export interface SidebarProps {
  /** Whether the sidebar is expanded */
  isOpen: boolean;
  /** Callback to toggle sidebar open/closed */
  onToggle: () => void;
}
```

**Component Structure**:

- Import `Link` and `useLocation` from `wouter`
- Call `useLocation()` to get `[location]` -- the current path (wouter normalizes this relative to the router base, so it returns `/` or `/config`)
- Render a `<nav aria-label="Main navigation">` wrapper
- Toggle button at the top: hamburger icon when collapsed, X/close icon when open
  - `aria-label="Toggle navigation"`
  - Minimum 44x44px touch target (`h-11 w-11`)
  - SVG icons inline (same pattern as Slider lock icons)
- Two navigation links using wouter `<Link>`:
  - "Dashboard" with `href="/"` -- icon: grid/dashboard icon (4-square grid SVG)
  - "Configuration" with `href="/config"` -- icon: cog/settings SVG
- Active link detection: compare `location` against each link's path
  - `/` is active when `location === "/"`
  - `/config` is active when `location === "/config"`
- When collapsed (`isOpen === false`): show only icons, hide text labels
- When expanded (`isOpen === true`): show icons + text labels

**Tailwind Styling**:

```
<nav>:
  className="flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-200"
  + dynamic width: isOpen ? "w-56" : "w-14"

Toggle button container:
  className="flex h-14 items-center justify-center border-b border-slate-200"
  (or justify-end when open, so the X button is on the right)

Toggle button:
  className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900"

Nav links container:
  className="flex flex-col gap-1 p-2"

Each nav link (inactive):
  className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  + when collapsed: "justify-center px-0" (center the icon, no text)

Each nav link (active):
  className="... bg-blue-50 text-blue-700 hover:bg-blue-100"

Link icon wrapper:
  className="h-5 w-5 shrink-0" (consistent icon size)

Link text span:
  className={isOpen ? "block" : "hidden"} (show/hide based on sidebar state)
```

**Key Implementation Details**:

- wouter's `<Link>` component renders an `<a>` tag by default. Use `href` prop (not `to`), as per the wouter v3 API. The `to` prop also works but `href` is more idiomatic for v3.
- `<Link>` supports a `className` prop that can be a function: `className={(isActive) => ...}`. However, this `isActive` only works when `<Link>` has a matching `href` exactly. For the root `/`, this is fine. For `/config`, also fine. Use this API instead of manual `useLocation` comparison for cleaner code.
  - Actually, upon reviewing the wouter types: `className?: string | undefined | ((isActive: boolean) => string | undefined)`. This IS supported. Use it.
- Icons: Use inline SVGs from Heroicons (MIT license, same approach as Slider lock icons). Dashboard = `Squares2X2Icon` (4 squares), Configuration = `Cog6ToothIcon` (gear).
- The sidebar does NOT handle scroll -- it is a short navigation with only 2 items.

**Accessibility**:

- `<nav aria-label="Main navigation">` -- landmark role
- Toggle button: `aria-label="Toggle navigation"`, `aria-expanded={isOpen}`
- Links are standard `<a>` tags (via wouter `<Link>`), naturally keyboard-focusable
- Active link has `aria-current="page"` attribute for screen readers
- All interactive elements >= 44x44px

---

### File 2: `apps/labor-market-dashboard/src/components/layout/AppLayout.tsx`

**Action**: CREATE

**Props Interface**:

```typescript
/** Props for the AppLayout component. */
export interface AppLayoutProps {
  /** Dashboard state (passed through to page content) */
  state: DashboardState;
  /** Dispatch function (passed through to page content) */
  dispatch: React.Dispatch<TreeAction>;
  /** Page content rendered by the router */
  children: React.ReactNode;
}
```

**Component Structure**:

- Local state: `const [isSidebarOpen, setIsSidebarOpen] = useState(false)` -- sidebar starts collapsed
- Toggle handler: `const handleToggle = () => setIsSidebarOpen(prev => !prev)`
- Layout: flex row, full viewport height
  - Left: `<Sidebar isOpen={isSidebarOpen} onToggle={handleToggle} />`
  - Right: `<div className="flex-1 overflow-auto">{children}</div>` -- the page content area

**Tailwind Styling**:

```
Root container:
  className="flex h-screen bg-slate-50"

Main content area:
  className="flex flex-1 flex-col overflow-auto"
```

**Key Implementation Details**:

- `state` and `dispatch` are accepted as props but NOT used directly by AppLayout. They exist in the interface because the TL design specifies AppLayout as the passthrough point. However, since we use `<Route>` children render pattern, the actual passing of state/dispatch to page components happens in App.tsx (inside Route render functions), not in AppLayout.
- **Decision**: After analysis, `state` and `dispatch` props on AppLayout are unnecessary. The children (rendered by `<Route>`) already receive state/dispatch from App.tsx's closure. AppLayout only needs `children: React.ReactNode`.
- **Revised Props Interface**:

```typescript
/** Props for the AppLayout component. */
export interface AppLayoutProps {
  /** Page content rendered by the router */
  children: React.ReactNode;
}
```

This is cleaner -- AppLayout is purely a layout shell (sidebar + content area). The state/dispatch wiring happens in App.tsx's Route render callbacks.

**Estimated Lines**: ~30

---

### File 3: `apps/labor-market-dashboard/src/components/layout/index.ts`

**Action**: CREATE

**Content**:

```typescript
export { AppLayout } from './AppLayout';
export type { AppLayoutProps } from './AppLayout';

export { Sidebar } from './Sidebar';
export type { SidebarProps } from './Sidebar';
```

---

### File 4: `apps/labor-market-dashboard/src/components/DashboardPage.tsx`

**Action**: CREATE

**Props Interface**:

```typescript
/** Props for the DashboardPage component. */
export interface DashboardPageProps {
  /** Dashboard state from useTreeState */
  state: DashboardState;
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
}
```

**Component Structure**:

This is a direct extraction of the current App.tsx return block. The component:

1. Destructures `state.tree.children[0]` as `maleNode` and `state.tree.children[1]` as `femaleNode`
2. Renders the exact same JSX currently in App.tsx:

```
<div className="min-h-screen bg-slate-50">  -->  REMOVE this wrapper (AppLayout provides bg-slate-50)
  <DashboardHeader ... />
  <main className="mx-auto max-w-7xl px-4 py-6">
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <GenderSection ... (male) />
      <GenderSection ... (female) />
    </div>
  </main>
</div>
```

**Important change from current App.tsx**: The outermost `<div className="min-h-screen bg-slate-50">` wrapper is NO LONGER needed here because:
- `min-h-screen` is handled by AppLayout's `h-screen` flex container
- `bg-slate-50` is handled by AppLayout

So DashboardPage renders:

```
<>
  <DashboardHeader
    totalPopulation={state.totalPopulation}
    balanceMode={state.balanceMode}
    dispatch={dispatch}
  />
  <main className="mx-auto max-w-7xl px-4 py-6">
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <GenderSection
        genderNode={maleNode}
        genderSiblings={state.tree.children}
        balanceMode={state.balanceMode}
        dispatch={dispatch}
      />
      <GenderSection
        genderNode={femaleNode}
        genderSiblings={state.tree.children}
        balanceMode={state.balanceMode}
        dispatch={dispatch}
      />
    </div>
  </main>
</>
```

Uses a Fragment (`<>...</>`) as the root since there is no need for a wrapper div.

**Imports**:

```typescript
import { DashboardHeader, GenderSection } from '@/components';
import type { DashboardState, TreeAction } from '@/types';
```

**Estimated Lines**: ~45

---

### File 5: `apps/labor-market-dashboard/src/App.tsx`

**Action**: MODIFY (full rewrite)

**Current Content** (for reference):

```typescript
import { DashboardHeader, GenderSection } from '@/components';
import { useTreeState } from '@/hooks';

export function App() {
  const { state, dispatch } = useTreeState();
  const maleNode = state.tree.children[0];
  const femaleNode = state.tree.children[1];

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader ... />
      <main ...>
        <div className="grid ...">
          <GenderSection ... />
          <GenderSection ... />
        </div>
      </main>
    </div>
  );
}
```

**New Content Structure**:

```typescript
import { Route, Router, Switch } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';

import { DashboardPage } from '@/components/DashboardPage';
import { AppLayout } from '@/components/layout';
import { useTreeState } from '@/hooks';

export function App() {
  const { state, dispatch } = useTreeState();

  return (
    <Router hook={useHashLocation}>
      <AppLayout>
        <Switch>
          <Route path="/">
            <DashboardPage state={state} dispatch={dispatch} />
          </Route>
          <Route path="/config">
            <div className="p-8">
              <h1 className="text-2xl font-bold text-slate-900">
                Configuration
              </h1>
              <p className="mt-2 text-slate-600">
                Configuration page coming soon.
              </p>
            </div>
          </Route>
        </Switch>
      </AppLayout>
    </Router>
  );
}
```

**Key Implementation Details**:

- `useTreeState()` is called ABOVE the `<Router>`, so state persists across route changes. This is the critical architectural requirement.
- `<Router hook={useHashLocation}>` enables hash-based routing (`/#/`, `/#/config`).
- `<Switch>` ensures only one route matches at a time (prevents both `/` and `/config` from matching simultaneously if paths overlap). wouter's `<Switch>` is equivalent to react-router's `<Routes>` -- it renders only the first matching route.
- The config page placeholder is a simple div with heading and paragraph. Subtask 11.3 will replace this with the real `ConfigPage` component.
- `state` and `dispatch` are passed directly to `DashboardPage` via JSX props (and will be passed to `ConfigPage` the same way in subtask 11.3).

**Import Analysis**:

- `Router`, `Route`, `Switch` from `wouter` (main package)
- `useHashLocation` from `wouter/use-hash-location` (sub-path export)
- `DashboardPage` from `@/components/DashboardPage`
- `AppLayout` from `@/components/layout`
- `useTreeState` from `@/hooks`

**Estimated Lines**: ~35

---

### File 6: `apps/labor-market-dashboard/src/components/index.ts`

**Action**: MODIFY

**Changes**: Add exports for DashboardPage and layout barrel re-export.

Add after the existing exports:

```typescript
export { DashboardPage } from './DashboardPage';
export type { DashboardPageProps } from './DashboardPage';

// Layout components
export { AppLayout, Sidebar } from './layout';
export type { AppLayoutProps, SidebarProps } from './layout';
```

The existing 10 component exports remain unchanged.

---

### File 7: `apps/labor-market-dashboard/src/__tests__/components/layout/Sidebar.test.tsx`

**Action**: CREATE

**Test Strategy**:

Use wouter's `memoryLocation` for test isolation -- this creates an in-memory location hook that avoids dependency on `window.location.hash`. Import from `wouter/memory-location`.

**Test Helper**:

```typescript
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';

import { Sidebar } from '@/components/layout/Sidebar';
import type { SidebarProps } from '@/components/layout/Sidebar';

/** Create default props. */
function makeProps(overrides?: Partial<SidebarProps>): SidebarProps {
  return {
    isOpen: true,
    onToggle: vi.fn(),
    ...overrides,
  };
}

/** Render Sidebar within a wouter Router using memoryLocation. */
function renderSidebar(
  props: SidebarProps,
  options?: { path?: string },
) {
  const { hook } = memoryLocation({ path: options?.path ?? '/' });
  return render(
    <Router hook={hook}>
      <Sidebar {...props} />
    </Router>,
  );
}
```

**Test Cases** (~12 tests):

```
describe('Sidebar rendering')
  - it('renders nav landmark with aria-label')
    Assert: screen.getByRole('navigation', { name: 'Main navigation' })

  - it('renders toggle button with aria-label')
    Assert: screen.getByRole('button', { name: 'Toggle navigation' })

  - it('renders Dashboard link')
    Assert: screen.getByRole('link', { name: /Dashboard/i }) exists, href ends with '/'

  - it('renders Configuration link')
    Assert: screen.getByRole('link', { name: /Configuration/i }) exists, href contains '/config'

describe('Sidebar active state')
  - it('marks Dashboard as active on root path')
    Render with path='/', assert Dashboard link has aria-current="page"

  - it('marks Configuration as active on /config path')
    Render with path='/config', assert Configuration link has aria-current="page"

  - it('does not mark Dashboard as active on /config')
    Render with path='/config', assert Dashboard link does NOT have aria-current

describe('Sidebar toggle')
  - it('shows link text when open')
    Render with isOpen=true, assert 'Dashboard' text visible
    (getByText('Dashboard') should be visible)

  - it('hides link text when collapsed')
    Render with isOpen=false, assert 'Dashboard' text is hidden
    (use a hidden class check or check the text container has 'hidden' class)

  - it('calls onToggle when toggle button is clicked')
    Click the toggle button, assert onToggle called once

describe('Sidebar keyboard navigation')
  - it('all links are reachable via Tab')
    Press Tab multiple times, assert each link receives focus
    (user.tab() -> toggle button, user.tab() -> Dashboard link, user.tab() -> Config link)

describe('Sidebar toggle accessibility')
  - it('toggle button has aria-expanded matching isOpen')
    Render with isOpen=true, assert aria-expanded="true"
    Render with isOpen=false, assert aria-expanded="false"
```

**Important note about testing wouter links**: wouter's `<Link>` renders `<a href="...">`. In hash mode, the actual href rendered in the DOM depends on the router's `hrefs` formatter. In tests using `memoryLocation`, hrefs may appear as plain paths (`/` and `/config`). Test assertions should check the link role and accessible name rather than exact href values.

**No ResizeObserver mock needed**: Sidebar does not use Recharts.

---

### File 8: `apps/labor-market-dashboard/src/__tests__/components/DashboardPage.test.tsx`

**Action**: CREATE

**Test Strategy**:

DashboardPage renders DashboardHeader + 2 GenderSections. Since it has Recharts (via GenderSection -> PieChartPanel), it needs the ResizeObserver mock. The test pattern follows GenderSection.test.tsx closely.

**Test Helper**:

```typescript
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { DashboardPage } from '@/components/DashboardPage';
import type { DashboardPageProps } from '@/components/DashboardPage';
import type { DashboardState, TreeAction } from '@/types';

// ResizeObserver mock (same as GenderSection.test.tsx)
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver { ... };
});

/** Create a minimal test tree for DashboardPage. */
function makeTestState(): DashboardState {
  return {
    totalPopulation: 10_000_000,
    balanceMode: 'auto',
    tree: {
      id: 'root',
      label: 'Total',
      percentage: 100,
      defaultPercentage: 100,
      absoluteValue: 10_000_000,
      genderSplit: { male: 60, female: 40 },
      isLocked: false,
      children: [
        {
          id: 'gender-male',
          label: 'Чоловіки',
          percentage: 60,
          defaultPercentage: 60,
          absoluteValue: 6_000_000,
          genderSplit: { male: 100, female: 0 },
          isLocked: false,
          children: [
            {
              id: 'male-g',
              label: 'Торгівля',
              kvedCode: 'G',
              percentage: 100,
              defaultPercentage: 100,
              absoluteValue: 6_000_000,
              genderSplit: { male: 100, female: 0 },
              isLocked: false,
              children: [],
            },
          ],
        },
        {
          id: 'gender-female',
          label: 'Жінки',
          percentage: 40,
          defaultPercentage: 40,
          absoluteValue: 4_000_000,
          genderSplit: { male: 0, female: 100 },
          isLocked: false,
          children: [
            {
              id: 'female-g',
              label: 'Торгівля',
              kvedCode: 'G',
              percentage: 100,
              defaultPercentage: 100,
              absoluteValue: 4_000_000,
              genderSplit: { male: 0, female: 100 },
              isLocked: false,
              children: [],
            },
          ],
        },
      ],
    },
  };
}

function makeProps(overrides?: Partial<DashboardPageProps>): DashboardPageProps {
  return {
    state: makeTestState(),
    dispatch: vi.fn<(action: TreeAction) => void>(),
    ...overrides,
  };
}
```

**Test Cases** (~7 tests):

```
describe('DashboardPage rendering')
  - it('renders the dashboard header with h1 title')
    Assert: screen.getByRole('heading', { name: 'Зайняте населення', level: 1 })

  - it('renders the population input')
    Assert: screen.getByLabelText('Загальна кількість зайнятих')

  - it('renders male gender section')
    Assert: screen.getByRole('region', { name: 'Чоловіки' })

  - it('renders female gender section')
    Assert: screen.getByRole('region', { name: 'Жінки' })

  - it('renders both gender headings at h2 level')
    Assert: screen.getByRole('heading', { name: 'Чоловіки', level: 2 })
    Assert: screen.getByRole('heading', { name: 'Жінки', level: 2 })

  - it('renders pie charts for both genders')
    Assert: screen.getByRole('img', { name: /Розподіл галузей -- Чоловіки/ })
    Assert: screen.getByRole('img', { name: /Розподіл галузей -- Жінки/ })

  - it('renders main content area')
    Assert: screen.getByRole('main') exists
```

---

### File 9: `apps/labor-market-dashboard/src/main.tsx`

**Action**: NO CHANGE

The entry point remains unchanged. It already renders `<App />` inside `<StrictMode>`. The routing wrapping happens inside App.tsx, not in main.tsx.

---

## Summary of All Files

| # | File Path | Action | Est. Lines |
|---|-----------|--------|------------|
| 1 | `src/components/layout/Sidebar.tsx` | CREATE | ~90 |
| 2 | `src/components/layout/AppLayout.tsx` | CREATE | ~30 |
| 3 | `src/components/layout/index.ts` | CREATE | ~6 |
| 4 | `src/components/DashboardPage.tsx` | CREATE | ~45 |
| 5 | `src/App.tsx` | MODIFY | ~35 |
| 6 | `src/components/index.ts` | MODIFY | +6 lines |
| 7 | `src/__tests__/components/layout/Sidebar.test.tsx` | CREATE | ~150 |
| 8 | `src/__tests__/components/DashboardPage.test.tsx` | CREATE | ~120 |

## Component Architecture After This Subtask

```
App.tsx (router boundary)
  useTreeState() -- state above router
  <Router hook={useHashLocation}>
    <AppLayout>
      <Sidebar /> -- collapsible nav, uses useLocation for active state
      <main content area>
        <Switch>
          <Route path="/">
            <DashboardPage state dispatch>
              <DashboardHeader />
              <GenderSection male />
              <GenderSection female />
            </DashboardPage>
          </Route>
          <Route path="/config">
            <placeholder div /> -- replaced by ConfigPage in subtask 11.3
          </Route>
        </Switch>
      </main>
    </AppLayout>
  </Router>
```

## State Management Notes

- `useTreeState()` remains in App.tsx, called ABOVE the `<Router>`. This ensures state persists when navigating between routes.
- No new state management patterns introduced. `isSidebarOpen` is local state in AppLayout (UI-only, not in reducer -- per existing convention).
- No React Context needed for state passing. Both pages receive `state` and `dispatch` via props from App.tsx's Route render callbacks.

## Potential Issues and Mitigations

1. **DashboardHeader sticky positioning**: After the layout change, DashboardHeader is inside AppLayout's scrollable content area (not the full viewport). The `sticky top-0 z-10` on DashboardHeader should still work correctly because it sticks to the nearest scrollable ancestor (which is AppLayout's content `<div className="flex-1 overflow-auto">`).

2. **`min-h-screen` removal from DashboardPage**: The current App.tsx has `min-h-screen` on its root div. After the restructure, AppLayout uses `h-screen` on the flex container, so each page fills available space naturally via `flex-1`. DashboardPage does NOT need `min-h-screen`.

3. **Hash routing and default URL**: When a user visits the app at the bare URL (no hash), wouter with `useHashLocation` will treat the location as `/`. The dashboard renders at `/`, so this is the correct default behavior. No redirect needed.

4. **Link href format in tests**: When using `memoryLocation` in tests, links render with regular paths (`/`, `/config`) not hash paths (`/#/`, `/#/config`). This is expected -- the hash handling is transparent to components.

5. **`<Switch>` import**: wouter exports `Switch` from the main `wouter` package. It ensures exclusive route matching. Without it, `<Route path="/">` would also match when the URL is `/config` (since `/` is a prefix of `/config`). Using `<Switch>` prevents this.

## Sidebar Visual Design Details

### Collapsed State (default, `isOpen = false`):
- Width: `w-14` (56px)
- Shows: toggle button (hamburger icon) at top, then two icon-only nav links vertically
- No text labels visible

### Expanded State (`isOpen = true`):
- Width: `w-56` (224px)
- Shows: toggle button (X/close icon) at top, then two nav links with icon + text
- Transition: `transition-all duration-200` for smooth width animation

### Nav Link Icons (inline SVGs):
- Dashboard: 4-square grid icon (Heroicons `Squares2X2Icon` path)
  ```
  M3.75 3.75h6.5v6.5h-6.5zM13.75 3.75h6.5v6.5h-6.5zM3.75 13.75h6.5v6.5h-6.5zM13.75 13.75h6.5v6.5h-6.5z
  ```
  (Simplified: `viewBox="0 0 24 24"`, `strokeWidth="1.5"`, `stroke="currentColor"`, `fill="none"`)

- Configuration: Cog/gear icon (Heroicons `Cog6ToothIcon` paths)
  Standard heroicon cog outline path

### Toggle Button Icons:
- Hamburger (collapsed): 3 horizontal lines
  ```
  M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5
  ```
- Close (expanded): X mark
  ```
  M6 18L18 6M6 6l12 12
  ```

## Accessibility Checklist

- [x] `<nav aria-label="Main navigation">` landmark
- [x] Toggle button: `aria-label="Toggle navigation"`, `aria-expanded`
- [x] Active link: `aria-current="page"`
- [x] All interactive elements >= 44x44px
- [x] Keyboard navigation: all links and buttons focusable via Tab
- [x] Heading hierarchy preserved: `<h1>` in DashboardHeader, `<h2>` in TreePanel

## Build Verification

After implementing all steps, run these commands and verify they pass:

```bash
pnpm lint          # Must pass with 0 errors
pnpm test          # All tests must pass (existing 246+ plus new ~19 tests)
pnpm build         # Web app must compile successfully
```

If `pnpm build` fails, fix the issue before proceeding. A broken build blocks all further workflow stages.

### Manual Smoke Test Checklist:

1. `pnpm dev` -- app loads at `http://localhost:5173`
2. Dashboard renders identically to before (header, gender sections, pie charts)
3. Sidebar is visible on the left (collapsed by default)
4. Click toggle -- sidebar expands with "Dashboard" and "Configuration" links
5. Click "Configuration" -- URL changes to `/#/config`, placeholder page renders
6. Click "Dashboard" -- URL changes to `/#/`, dashboard renders with all state preserved
7. Navigate directly to `http://localhost:5173/#/config` -- config placeholder loads correctly
8. Navigate directly to `http://localhost:5173/` (no hash) -- dashboard loads correctly
9. Keyboard: Tab through sidebar links and toggle, Enter/Space activates them
