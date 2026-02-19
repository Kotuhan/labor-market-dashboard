# Implementation Plan: Subtask 11.3 -- Config Page Components

Generated: 2026-02-19

## Overview

This subtask creates all configuration page components: ConfirmDialog, AddNodeForm, ConfigSubcategoryRow, ConfigIndustryRow, ConfigGenderSection, and ConfigPage. These correspond to TL design Steps 9-14. All config components live in `src/components/config/` with a barrel `index.ts`. The ConfigPage replaces the placeholder in App.tsx's `/config` route.

**Prerequisites completed by prior subtasks:**
- 11.1: Core infrastructure (action types, reducer handlers, tree utilities, slugify)
- 11.2: Layout and routing (AppLayout, Sidebar, DashboardPage, App.tsx with wouter)

## File-by-File Changes

### Files to Create (10)

| # | File | Type | Est. Lines |
|---|------|------|-----------|
| 1 | `src/components/config/ConfirmDialog.tsx` | Component | ~70 |
| 2 | `src/components/config/AddNodeForm.tsx` | Component | ~65 |
| 3 | `src/components/config/ConfigSubcategoryRow.tsx` | Component | ~55 |
| 4 | `src/components/config/ConfigIndustryRow.tsx` | Component | ~110 |
| 5 | `src/components/config/ConfigGenderSection.tsx` | Component | ~90 |
| 6 | `src/components/config/ConfigPage.tsx` | Component | ~45 |
| 7 | `src/components/config/index.ts` | Barrel | ~20 |
| 8 | `src/__tests__/components/config/ConfirmDialog.test.tsx` | Test | ~130 |
| 9 | `src/__tests__/components/config/AddNodeForm.test.tsx` | Test | ~120 |
| 10 | `src/__tests__/components/config/ConfigGenderSection.test.tsx` | Test | ~160 |
| 11 | `src/__tests__/components/config/ConfigPage.test.tsx` | Test | ~90 |

### Files to Modify (2)

| # | File | Change |
|---|------|--------|
| 1 | `src/components/index.ts` | Add config barrel re-export |
| 2 | `src/App.tsx` | Replace `/config` route placeholder with `<ConfigPage>` |

---

## Implementation Steps

### Step 1: Create ConfirmDialog component (TL Step 9)

**File:** `src/components/config/ConfirmDialog.tsx`

**Props interface:**

```typescript
export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Dialog title text */
  title: string;
  /** Dialog message body */
  message: string;
  /** Callback fired when user confirms */
  onConfirm: () => void;
  /** Callback fired when user cancels or presses Escape */
  onCancel: () => void;
}
```

**Component structure:**

```
ConfirmDialog
  <dialog ref={dialogRef}>
    <div>  (content wrapper with padding/spacing)
      <h3>  (title)
      <p>   (message)
      <div>  (button group, flex with gap)
        <button> Cancel (secondary styling)
        <button> Confirm (destructive red styling)
      </div>
    </div>
  </dialog>
```

**Key implementation details:**

- Use native `<dialog>` element -- no external modal library needed
- `useRef<HTMLDialogElement>(null)` for dialog reference
- `useEffect` watches `isOpen`:
  - When `isOpen` becomes `true`: call `dialogRef.current.showModal()` (native focus trap + backdrop)
  - When `isOpen` becomes `false`: call `dialogRef.current.close()`
- Handle native `<dialog>` `cancel` event (fired on Escape key) by calling `onCancel`:
  ```typescript
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (e: Event) => {
      e.preventDefault(); // Prevent default close so we control state
      onCancel();
    };
    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onCancel]);
  ```
- Cancel button: calls `onCancel` on click
- Confirm button: calls `onConfirm` on click
- Touch targets: both buttons use `h-11` (44px minimum, WCAG 2.5.5)
- Confirm button styling: `bg-red-600 text-white hover:bg-red-700` (destructive action)
- Cancel button styling: `border border-slate-300 text-slate-700 hover:bg-slate-50`
- Backdrop: native `<dialog>::backdrop` -- style via CSS `dialog::backdrop { background: rgba(0, 0, 0, 0.4); }` in `index.css` or use Tailwind `backdrop:` modifier if available; alternatively, inline style is acceptable since Tailwind v4 may not support `::backdrop` pseudo-element natively

**Tailwind classes (dialog content wrapper):**
```
rounded-lg bg-white p-6 shadow-xl max-w-md w-full
```

**Accessibility:**
- `<dialog>` provides native focus trap when opened via `showModal()`
- Cancel button gets `autoFocus` so Escape is natural
- Confirm button has `aria-label` with the action context if needed (but "Confirm" text is self-explanatory)

---

### Step 2: Create AddNodeForm component (TL Step 10)

**File:** `src/components/config/AddNodeForm.tsx`

**Props interface:**

```typescript
export interface AddNodeFormProps {
  /** ID of the parent node (genderId for industries, industryId for subcategories) */
  parentId: string;
  /** Which action to dispatch */
  actionType: 'ADD_INDUSTRY' | 'ADD_SUBCATEGORY';
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
  /** Placeholder text for the input field */
  placeholder: string;
}
```

**Component structure:**

```
AddNodeForm
  <form onSubmit={handleSubmit}>
    <div className="flex items-center gap-2">
      <input type="text"
        value={label}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      <button type="submit" disabled={!label.trim()}>
        Add icon + text
      </button>
    </div>
  </form>
```

**Key implementation details:**

- Local state: `const [label, setLabel] = useState('')`
- On submit (form `onSubmit`, NOT button `onClick`):
  1. `e.preventDefault()`
  2. Guard: if `label.trim()` is empty, return early (button is also disabled)
  3. Dispatch based on `actionType`:
     - `ADD_INDUSTRY`: `dispatch({ type: 'ADD_INDUSTRY', genderId: parentId, label: label.trim() })`
     - `ADD_SUBCATEGORY`: `dispatch({ type: 'ADD_SUBCATEGORY', industryId: parentId, label: label.trim() })`
  4. Clear input: `setLabel('')`
- Input: `rounded-lg border border-slate-300 px-3 h-11 text-sm` (44px touch target)
- Button: `h-11 px-3 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed`
- Button has plus icon (inline SVG) + "Додати" text
- `aria-label` on input matches `placeholder` prop

**Pattern reference:** This follows the same controlled-input pattern as Slider's numeric input -- local string state, but simpler because there is no external percentage to sync.

---

### Step 3: Create ConfigSubcategoryRow component (TL Step 11)

**File:** `src/components/config/ConfigSubcategoryRow.tsx`

**Props interface:**

```typescript
export interface ConfigSubcategoryRowProps {
  /** Subcategory tree node */
  node: TreeNode;
  /** Callback when remove is requested (parent manages ConfirmDialog) */
  onRemoveRequest: (nodeId: string, label: string) => void;
}
```

**Component structure:**

```
ConfigSubcategoryRow
  <div className="flex items-center gap-3 py-1 pl-8">
    <span> (label text)
    <span> (percentage display -- formatPercentage)
    <span> (absolute value display -- formatAbsoluteValue)
    <button> (remove/trash icon)
  </div>
```

**Key implementation details:**

- **No dispatch prop** -- this component does NOT dispatch directly. It calls `onRemoveRequest(node.id, node.label)` and the parent (ConfigGenderSection) manages the ConfirmDialog + actual dispatch
- Display node label, `formatPercentage(node.percentage)`, `formatAbsoluteValue(node.absoluteValue)` using existing format utilities
- Remove button:
  - Trash icon SVG (Heroicons outline trash)
  - `aria-label={`Remove ${node.label}`}` (translated: `Видалити ${node.label}`)
  - `h-11 w-11` for WCAG touch target
  - Styling: `text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg`
- Left padding `pl-8` to visually indent under parent industry row
- Text styling: `text-sm text-slate-700` for label, `text-slate-500` for numeric values

---

### Step 4: Create ConfigIndustryRow component (TL Step 12)

**File:** `src/components/config/ConfigIndustryRow.tsx`

**Props interface:**

```typescript
export interface ConfigIndustryRowProps {
  /** Industry tree node */
  node: TreeNode;
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
  /** Callback when industry removal is requested */
  onRemoveRequest: (nodeId: string, label: string, hasChildren: boolean) => void;
  /** Whether this industry row is currently expanded */
  isExpanded: boolean;
  /** Callback to toggle expand/collapse */
  onToggleExpand: (id: string) => void;
  /** Whether removal is blocked (last remaining industry) */
  isRemoveBlocked: boolean;
}
```

**Component structure:**

```
ConfigIndustryRow
  <div>
    <div className="flex items-center gap-2">  (main row)
      <button> (expand/collapse chevron -- only if node has children)
        OR <div> (spacer 8x8 if no children and no expandability potential)
      <span> (industry label, font-medium)
      <span> (percentage -- formatPercentage)
      <span> (absolute value -- formatAbsoluteValue)
      <button> (remove button with trash icon)
    </div>
    {isExpanded && (
      <div className="ml-4">  (expanded content)
        {node.children.map(child =>
          <ConfigSubcategoryRow key={child.id} ... />
        )}
        <AddNodeForm
          parentId={node.id}
          actionType="ADD_SUBCATEGORY"
          dispatch={dispatch}
          placeholder="Назва підкатегорії"
        />
      </div>
    )}
  </div>
```

**Key implementation details:**

- Expand/collapse chevron: only rendered if `node.children.length > 0`. Uses same chevron SVGs as TreeRow (down-chevron when expanded, right-chevron when collapsed)
- If node has no children, render a small spacer `<div className="w-5" />` to keep alignment (narrower than TreeRow's spacer since config rows are simpler)
- Chevron button: `h-11 w-11` touch target, `aria-expanded={isExpanded}`, `aria-label="Expand {label}"` / `"Collapse {label}"`
- Remove button behavior:
  - If `isRemoveBlocked` is true: button is `disabled`, with `opacity-50 cursor-not-allowed`, and a `title="Cannot remove the last industry"` tooltip
  - Otherwise: calls `onRemoveRequest(node.id, node.label, node.children.length > 0)`
- Remove button: same trash icon and styling as ConfigSubcategoryRow
- When expanded, shows subcategory rows + AddNodeForm for adding subcategories
- Clicking the chevron calls `onToggleExpand(node.id)` -- expand state is managed by parent (ConfigGenderSection)

**Line count strategy:** ~110 lines. If SVG icons push it close to limit, the chevron SVGs can be extracted to a small helper, but the TL design shows similar inline SVGs in TreeRow (~173 lines with memo wrapper) so this should be fine.

---

### Step 5: Create ConfigGenderSection component (TL Step 13)

**File:** `src/components/config/ConfigGenderSection.tsx`

**Props interface:**

```typescript
export interface ConfigGenderSectionProps {
  /** Gender tree node (male or female) */
  genderNode: TreeNode;
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
}
```

**Component structure:**

```
ConfigGenderSection
  <section aria-label={genderNode.label}>
    <h2> (gender label)
    <div>  (industry list)
      {genderNode.children.map(industry =>
        <ConfigIndustryRow
          key={industry.id}
          node={industry}
          dispatch={dispatch}
          onRemoveRequest={handleRemoveRequest}
          isExpanded={expandedIds.has(industry.id)}
          onToggleExpand={handleToggleExpand}
          isRemoveBlocked={genderNode.children.length <= 1}
        />
      )}
    </div>
    <AddNodeForm
      parentId={genderNode.id}
      actionType="ADD_INDUSTRY"
      dispatch={dispatch}
      placeholder="Назва галузі"
    />
    <ConfirmDialog
      isOpen={pendingRemoval !== null}
      title="Видалити?"
      message={confirmMessage}
      onConfirm={handleConfirmRemoval}
      onCancel={handleCancelRemoval}
    />
  </section>
```

**Key implementation details:**

**Local state (all UI-only, not in reducer):**

```typescript
// Expand/collapse state for industry rows
const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

// Pending removal state for ConfirmDialog
const [pendingRemoval, setPendingRemoval] = useState<{
  nodeId: string;
  label: string;
  hasChildren: boolean;
} | null>(null);
```

**Expand/collapse handlers:**

```typescript
const handleToggleExpand = useCallback((id: string) => {
  setExpandedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  });
}, []);
```

Note: `useCallback` is justified here because `handleToggleExpand` is passed to ConfigIndustryRow. While ConfigIndustryRow is not wrapped in `React.memo`, `useCallback` avoids unnecessary reference changes. This matches the TreePanel pattern.

**Remove flow handlers:**

```typescript
function handleRemoveRequest(nodeId: string, label: string, hasChildren: boolean) {
  setPendingRemoval({ nodeId, label, hasChildren });
}

function handleConfirmRemoval() {
  if (!pendingRemoval) return;
  // Determine if this is an industry or subcategory removal
  // by checking if the pending node is a direct child of genderNode
  const isIndustry = genderNode.children.some(
    (child) => child.id === pendingRemoval.nodeId,
  );
  if (isIndustry) {
    dispatch({ type: 'REMOVE_INDUSTRY', nodeId: pendingRemoval.nodeId });
  } else {
    dispatch({ type: 'REMOVE_SUBCATEGORY', nodeId: pendingRemoval.nodeId });
  }
  setPendingRemoval(null);
}

function handleCancelRemoval() {
  setPendingRemoval(null);
}
```

**Confirm dialog message construction:**

```typescript
const confirmMessage = pendingRemoval
  ? pendingRemoval.hasChildren
    ? `"${pendingRemoval.label}" та всі підкатегорії будуть видалені. Відсотки перерозподіляться рівномірно.`
    : `"${pendingRemoval.label}" буде видалено. Відсотки перерозподіляться рівномірно.`
  : '';
```

**Heading:** `<h2 className="text-lg font-semibold text-slate-800 mb-3">{genderNode.label}</h2>`

**Section:** `<section aria-label={genderNode.label}>` -- same pattern as TreePanel, maps to `role="region"` in tests.

**isRemoveBlocked:** Passed to each ConfigIndustryRow as `genderNode.children.length <= 1`. This prevents removing the last industry -- the TL design says "gender must always have >= 1 industry."

---

### Step 6: Create ConfigPage component (TL Step 14)

**File:** `src/components/config/ConfigPage.tsx`

**Props interface:**

```typescript
export interface ConfigPageProps {
  /** Dashboard state from useTreeState */
  state: DashboardState;
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
}
```

**Component structure:**

```
ConfigPage
  <div className="p-8">
    <h1 className="text-2xl font-bold text-slate-900 mb-6">
      Configuration
    </h1>
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <ConfigGenderSection
        genderNode={state.tree.children[0]}
        dispatch={dispatch}
      />
      <ConfigGenderSection
        genderNode={state.tree.children[1]}
        dispatch={dispatch}
      />
    </div>
  </div>
```

**Key implementation details:**

- Simple composition root -- no local state, no hooks
- Same pattern as DashboardPage: receives `state` and `dispatch`, extracts gender nodes from `state.tree.children[0]` (male) and `state.tree.children[1]` (female)
- `<h1>` for page title (heading hierarchy: h1 in ConfigPage, h2 in ConfigGenderSection)
- Two-column grid on large screens (`lg:grid-cols-2`), single column on small
- Padding `p-8` for comfortable spacing within the content area

---

### Step 7: Create barrel index.ts

**File:** `src/components/config/index.ts`

```typescript
export { ConfirmDialog } from './ConfirmDialog';
export type { ConfirmDialogProps } from './ConfirmDialog';

export { AddNodeForm } from './AddNodeForm';
export type { AddNodeFormProps } from './AddNodeForm';

export { ConfigSubcategoryRow } from './ConfigSubcategoryRow';
export type { ConfigSubcategoryRowProps } from './ConfigSubcategoryRow';

export { ConfigIndustryRow } from './ConfigIndustryRow';
export type { ConfigIndustryRowProps } from './ConfigIndustryRow';

export { ConfigGenderSection } from './ConfigGenderSection';
export type { ConfigGenderSectionProps } from './ConfigGenderSection';

export { ConfigPage } from './ConfigPage';
export type { ConfigPageProps } from './ConfigPage';
```

This follows the exact barrel pattern from `src/components/index.ts` -- value export for component, `export type` for props interface.

---

### Step 8: Modify `src/components/index.ts` -- add config re-exports

**Current state:** The barrel re-exports layout components. Add config re-exports in the same pattern.

**Add to end of file:**

```typescript
// Config components
export {
  AddNodeForm,
  ConfigGenderSection,
  ConfigIndustryRow,
  ConfigPage,
  ConfigSubcategoryRow,
  ConfirmDialog,
} from './config';
export type {
  AddNodeFormProps,
  ConfigGenderSectionProps,
  ConfigIndustryRowProps,
  ConfigPageProps,
  ConfigSubcategoryRowProps,
  ConfirmDialogProps,
} from './config';
```

---

### Step 9: Modify `src/App.tsx` -- replace config route placeholder

**Current state:** The `/config` route renders a placeholder `<div>` with "Configuration page coming soon."

**Change:** Replace the placeholder with `<ConfigPage state={state} dispatch={dispatch} />`

**Before:**
```typescript
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
```

**After:**
```typescript
<Route path="/config">
  <ConfigPage state={state} dispatch={dispatch} />
</Route>
```

**New import:** `import { ConfigPage } from '@/components/config';`

---

### Step 10: Create ConfirmDialog tests

**File:** `src/__tests__/components/config/ConfirmDialog.test.tsx`

**Test structure:**

```
describe('ConfirmDialog rendering')
  it('does not show content when isOpen is false')
  it('shows title and message when isOpen is true')
  it('shows Cancel and Confirm buttons')

describe('ConfirmDialog interactions')
  it('calls onConfirm when Confirm button is clicked')
  it('calls onCancel when Cancel button is clicked')
  it('calls onCancel when dialog cancel event fires (Escape key)')

describe('ConfirmDialog accessibility')
  it('Confirm and Cancel buttons meet 44px touch target (h-11)')
  it('dialog has role="dialog"')  -- native <dialog> provides this
```

**Test setup details:**

- Need to mock `HTMLDialogElement.prototype.showModal` and `HTMLDialogElement.prototype.close` because jsdom does not implement native `<dialog>` methods:

```typescript
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function(this: HTMLDialogElement) {
    this.removeAttribute('open');
  });
});
```

- `makeProps()` factory with `vi.fn()` for `onConfirm` and `onCancel`
- Test Escape: Simulate the `cancel` event on the dialog element:
  ```typescript
  const dialog = container.querySelector('dialog');
  fireEvent(dialog, new Event('cancel'));
  expect(onCancel).toHaveBeenCalledOnce();
  ```

---

### Step 11: Create AddNodeForm tests

**File:** `src/__tests__/components/config/AddNodeForm.test.tsx`

**Test structure:**

```
describe('AddNodeForm rendering')
  it('renders input with placeholder')
  it('renders disabled Add button when input is empty')
  it('enables Add button when input has text')

describe('AddNodeForm submission')
  it('dispatches ADD_INDUSTRY with correct payload on submit')
  it('dispatches ADD_SUBCATEGORY with correct payload on submit')
  it('clears input after successful submit')
  it('trims whitespace from label before dispatch')

describe('AddNodeForm validation')
  it('does not dispatch when label is only whitespace')
  it('button remains disabled for whitespace-only input')

describe('AddNodeForm accessibility')
  it('input has aria-label matching placeholder')
  it('button meets 44px touch target (h-11)')
```

**Test pattern:**

```typescript
function makeProps(overrides?: Partial<AddNodeFormProps>): AddNodeFormProps {
  return {
    parentId: 'gender-male',
    actionType: 'ADD_INDUSTRY',
    dispatch: vi.fn<(action: TreeAction) => void>(),
    placeholder: 'Назва галузі',
    ...overrides,
  };
}
```

- Use `userEvent.setup()` for typing into input and clicking submit
- Assert dispatch payload: `expect(dispatch).toHaveBeenCalledWith({ type: 'ADD_INDUSTRY', genderId: 'gender-male', label: 'Кібербезпека' })`
- For ADD_SUBCATEGORY test: override `actionType` and `parentId` in props

---

### Step 12: Create ConfigGenderSection tests

**File:** `src/__tests__/components/config/ConfigGenderSection.test.tsx`

**Test structure:**

```
describe('ConfigGenderSection rendering')
  it('renders gender heading as h2')
  it('renders section with aria-label matching gender label')
  it('renders an industry row for each child')
  it('renders "Add industry" form')

describe('ConfigGenderSection add industry')
  it('dispatches ADD_INDUSTRY when form is submitted')

describe('ConfigGenderSection remove flow')
  it('shows confirmation dialog when remove is clicked')
  it('dispatches REMOVE_INDUSTRY on confirm')
  it('closes dialog without dispatch on cancel')
  it('shows warning about subcategories when industry has children')

describe('ConfigGenderSection remove blocked')
  it('remove button is disabled when only one industry remains')

describe('ConfigGenderSection expand/collapse')
  it('expands industry to show subcategories on chevron click')
  it('shows add subcategory form when industry is expanded')
```

**Test tree fixture:**

```typescript
function makeGenderNode(): TreeNode {
  return {
    id: 'gender-male',
    label: 'Чоловіки',
    percentage: 50,
    defaultPercentage: 50,
    absoluteValue: 5_000_000,
    genderSplit: { male: 100, female: 0 },
    isLocked: false,
    children: [
      {
        id: 'male-a',
        label: 'Сільське господарство',
        kvedCode: 'A',
        percentage: 60,
        defaultPercentage: 60,
        absoluteValue: 3_000_000,
        genderSplit: { male: 100, female: 0 },
        isLocked: false,
        children: [],
      },
      {
        id: 'male-j',
        label: 'IT та телеком',
        kvedCode: 'J',
        percentage: 40,
        defaultPercentage: 40,
        absoluteValue: 2_000_000,
        genderSplit: { male: 100, female: 0 },
        isLocked: false,
        children: [
          {
            id: 'male-j-dev',
            label: 'Розробка ПЗ',
            percentage: 100,
            defaultPercentage: 100,
            absoluteValue: 2_000_000,
            genderSplit: { male: 100, female: 0 },
            isLocked: false,
            children: [],
          },
        ],
      },
    ],
  };
}
```

**Important test notes:**

- ConfirmDialog uses native `<dialog>` -- need the `showModal`/`close` mock from Step 10
- For "remove blocked" test: use a single-industry gender node fixture
- For subcategory tests: expand IT industry, verify subcategory rows appear, add subcategory dispatches correctly

---

### Step 13: Create ConfigPage tests

**File:** `src/__tests__/components/config/ConfigPage.test.tsx`

**Test structure:**

```
describe('ConfigPage rendering')
  it('renders page title as h1')
  it('renders male gender section')
  it('renders female gender section')
  it('renders both gender headings at h2 level')
```

**Test setup:**

- Uses `makeTestState()` similar to DashboardPage.test.tsx -- minimal tree with 2 genders, 1 industry each
- NO ResizeObserver mock needed (config page has no Recharts components)
- NO wouter Router wrapper needed (ConfigPage does not use routing hooks)
- Need the `HTMLDialogElement` mock since ConfigGenderSection renders ConfirmDialog

```typescript
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
            { id: 'male-g', label: 'Торгівля', kvedCode: 'G', percentage: 100, defaultPercentage: 100, absoluteValue: 6_000_000, genderSplit: { male: 100, female: 0 }, isLocked: false, children: [] },
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
            { id: 'female-g', label: 'Торгівля', kvedCode: 'G', percentage: 100, defaultPercentage: 100, absoluteValue: 4_000_000, genderSplit: { male: 0, female: 100 }, isLocked: false, children: [] },
          ],
        },
      ],
    },
  };
}
```

---

## Implementation Order

The steps should be implemented in this order to satisfy dependency requirements:

1. **ConfirmDialog** -- standalone, no dependencies on other config components
2. **AddNodeForm** -- standalone, depends only on TreeAction type
3. **ConfigSubcategoryRow** -- standalone, depends only on TreeNode type + format utils
4. **ConfigIndustryRow** -- depends on ConfigSubcategoryRow + AddNodeForm
5. **ConfigGenderSection** -- depends on ConfigIndustryRow + AddNodeForm + ConfirmDialog
6. **ConfigPage** -- depends on ConfigGenderSection
7. **Barrel index.ts** -- depends on all config components
8. **Modify `components/index.ts`** -- depends on barrel
9. **Modify `App.tsx`** -- depends on ConfigPage
10. **ConfirmDialog tests**
11. **AddNodeForm tests**
12. **ConfigGenderSection tests**
13. **ConfigPage tests**

Tests can be written alongside their components (e.g., ConfirmDialog + test together), but they are listed separately above for clarity.

---

## Patterns to Follow (from existing codebase)

### Named exports only

```typescript
// Correct
export function ConfigPage(...) { ... }

// Wrong
export default function ConfigPage(...) { ... }
```

### Props interface exported alongside component

```typescript
/** Props for the ConfigPage component. */
export interface ConfigPageProps {
  /** Dashboard state from useTreeState */
  state: DashboardState;
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
}
```

JSDoc on interface + field-level docs for non-obvious fields. See DashboardPage.tsx for exact pattern.

### Import ordering

External packages first, then `@/` aliases (grouped), then relative imports. Blank line between groups:

```typescript
import { useCallback, useState } from 'react';

import type { DashboardState, TreeAction, TreeNode } from '@/types';
import { formatAbsoluteValue, formatPercentage } from '@/utils/format';

import { AddNodeForm } from './AddNodeForm';
import { ConfigIndustryRow } from './ConfigIndustryRow';
import { ConfirmDialog } from './ConfirmDialog';
```

### Section aria-label pattern

```typescript
<section aria-label={genderNode.label}>
```

In tests, query with: `screen.getByRole('region', { name: 'Чоловіки' })`

### Test makeProps factory pattern

```typescript
function makeProps(overrides?: Partial<ConfigPageProps>): ConfigPageProps {
  return {
    state: makeTestState(),
    dispatch: vi.fn<(action: TreeAction) => void>(),
    ...overrides,
  };
}
```

### Test imports

```typescript
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
```

Always `afterEach(() => { cleanup(); })` since `globals: false`.

### Vitest v3 mock syntax

```typescript
// Correct
const dispatch = vi.fn<(action: TreeAction) => void>();

// Wrong (v2 syntax)
const dispatch = vi.fn<[TreeAction], void>();
```

### Touch targets

All interactive buttons must use `h-11` (44px) or `h-11 w-11` (44x44px) classes per WCAG 2.5.5.

---

## Potential Issues and Mitigations

### 1. Native `<dialog>` in jsdom

jsdom does not fully implement `HTMLDialogElement`. `showModal()` and `close()` are not available. The tests must mock these methods on the prototype (see Step 10). The `cancel` event must be manually fired via `fireEvent`.

### 2. Remove subcategory vs remove industry dispatch

ConfigGenderSection's `handleConfirmRemoval` must distinguish between industry removal and subcategory removal. The approach is to check if the pending node ID exists as a direct child of `genderNode`. If yes, dispatch `REMOVE_INDUSTRY`. Otherwise, dispatch `REMOVE_SUBCATEGORY`.

### 3. Subcategory row onRemoveRequest bubbles through ConfigIndustryRow

ConfigSubcategoryRow's `onRemoveRequest` is passed from ConfigGenderSection through ConfigIndustryRow. ConfigIndustryRow forwards its own `onRemoveRequest` prop to child ConfigSubcategoryRow instances. This callback chain ensures all removal confirmations go through a single ConfirmDialog per gender section.

### 4. Expand state after add

When a user adds the first subcategory to a leaf industry, that industry becomes expandable. The expand state (`expandedIds`) does not automatically include the new ID. The implementation should auto-expand after add by watching `genderNode.children` for newly expandable nodes. This can be done with a `useEffect`:

```typescript
useEffect(() => {
  const newExpandable = genderNode.children
    .filter((child) => child.children.length > 0)
    .filter((child) => !expandedIds.has(child.id));
  if (newExpandable.length > 0) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      newExpandable.forEach((n) => next.add(n.id));
      return next;
    });
  }
}, [genderNode.children, expandedIds]);
```

Note: This auto-expand behavior is also handled in subtask 11.4 for the dashboard's TreePanel. The config page's expand state is independent -- it only affects the config page's own expand/collapse.

### 5. ConfirmDialog backdrop styling

Tailwind v4 may not support `::backdrop` pseudo-element styling via utility classes. Fallback: add a CSS rule in `src/index.css`:

```css
dialog::backdrop {
  background-color: rgba(0, 0, 0, 0.4);
}
```

This is minimal CSS and acceptable since native `<dialog>` backdrop is a pseudo-element outside normal DOM flow.

---

## Build Verification

After implementing all steps, run these commands and verify they pass:

```bash
pnpm lint          # Must pass with 0 errors
pnpm test          # All tests must pass (existing 246+ and new config tests)
pnpm build         # Web app must compile successfully
```

If `pnpm build` fails, fix the issue before proceeding. A broken build blocks all further workflow stages.
