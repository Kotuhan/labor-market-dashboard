# Implementation Plan: Subtask 11.1 -- Core Infrastructure

Generated: 2026-02-19

## Overview

This subtask covers TL design Steps 1-5: installing wouter, creating the slugify utility, adding tree helper functions (addChildToParent, removeChildFromParent, generateUniqueId), extending TreeAction with 4 new action types, implementing 4 new reducer handlers, and creating ADR-0006 for wouter adoption. No UI components are created in this subtask.

## Implementation Order

1. Install wouter (package.json)
2. Create `slugify.ts` utility + tests
3. Add tree utility functions to `treeUtils.ts` + tests
4. Extend `TreeAction` union in `actions.ts`
5. Implement reducer handlers in `useTreeState.ts` + tests
6. Update barrel exports (`utils/index.ts`)
7. Create ADR-0006
8. Final verification: `pnpm lint && pnpm test && pnpm build`

---

## Step 1: Install wouter

**File**: `apps/labor-market-dashboard/package.json`
**Action**: modify
**Command**: `pnpm add wouter --filter @template/labor-market-dashboard`

**Expected change in package.json**:
- A new entry `"wouter": "^3.x.x"` (latest stable) appears in `"dependencies"` alongside `react`, `react-dom`, and `recharts`.

**Verification**: Run `pnpm build` after install. Build must pass. No type errors from wouter (it ships its own TypeScript declarations).

---

## Step 2: Create `slugify.ts` utility

**File**: `apps/labor-market-dashboard/src/utils/slugify.ts`
**Action**: create

### Content Structure

The file exports a single function `slugify(label: string): string` with a JSDoc block.

**Transliteration map** -- a `Record<string, string>` constant named `CYRILLIC_TO_LATIN` covering the full Ukrainian alphabet (33 base letters). The map must handle both uppercase and lowercase input. The exact mappings:

| Cyrillic | Latin | Cyrillic | Latin |
|----------|-------|----------|-------|
| `a` | `a` | `6` | `b` |
| `B` | `v` | `r` | `h` |
| `g` | `g` | `d` | `d` |
| `e` | `e` | `ye` | `ye` |
| `zh` | `zh` | `3` | `z` |
| `y` | `y` | `i` | `i` |
| `yi` | `yi` | `i` | `i` |
| `k` | `k` | `l` | `l` |
| `m` | `m` | `H` | `n` |
| `o` | `o` | `n` | `p` |
| `p` | `r` | `c` | `s` |
| `T` | `t` | `y` | `u` |
| `f` | `f` | `kh` | `kh` |
| `ts` | `ts` | `ch` | `ch` |
| `sh` | `sh` | `shch` | `shch` |
| (empty -- soft sign dropped) | | `yu` | `yu` |
| `ya` | `ya` | | |

**Actual map entries (lowercase Cyrillic keys only)**:

```
'a' -> 'a',   '6' -> 'b',   'B' -> 'v',   'r' -> 'h',
'g' -> 'g',   'd' -> 'd',   'e' -> 'e',   'ye' -> 'ye',
'zh' -> 'zh', '3' -> 'z',   'u' -> 'y',   'i' -> 'i',
'yi' -> 'yi', 'i' -> 'i',   'k' -> 'k',   'l' -> 'l',
'm' -> 'm',   'H' -> 'n',   'o' -> 'o',   'n' -> 'p',
'p' -> 'r',   'c' -> 's',   'T' -> 't',   'y' -> 'u',
'f' -> 'f',   'x' -> 'kh',  'u' -> 'ts',  'y' -> 'ch',
'sh' -> 'sh', 'shch' -> 'shch', 'b' -> '',  'yu' -> 'yu',
'ya' -> 'ya'
```

**IMPORTANT -- use actual Ukrainian Cyrillic characters, not the Romanized representations above. The exact map**:

```typescript
const CYRILLIC_TO_LATIN: Record<string, string> = {
  'а': 'a',   'б': 'b',   'в': 'v',   'г': 'h',
  'ґ': 'g',   'д': 'd',   'е': 'e',   'є': 'ye',
  'ж': 'zh',  'з': 'z',   'и': 'y',   'і': 'i',
  'ї': 'yi',  'й': 'i',   'к': 'k',   'л': 'l',
  'м': 'm',   'н': 'n',   'о': 'o',   'п': 'p',
  'р': 'r',   'с': 's',   'т': 't',   'у': 'u',
  'ф': 'f',   'х': 'kh',  'ц': 'ts',  'ч': 'ch',
  'ш': 'sh',  'щ': 'shch','ь': '',    'ю': 'yu',
  'я': 'ya',
};
```

Note: The map only needs lowercase entries. The algorithm converts input to lowercase first.

**Algorithm**:
1. `label.toLowerCase()`
2. Iterate character by character, replacing each via the map. Characters not in the map and not ASCII alphanumeric or spaces are dropped.
3. Replace sequences of whitespace and hyphens with a single hyphen.
4. Trim leading/trailing hyphens.
5. Return the result. If result is empty, return `"node"` (fallback for edge cases).

**Pattern reference**: Follow the same file structure as `apps/labor-market-dashboard/src/utils/format.ts` -- named export, JSDoc, no default export.

---

## Step 3: Create `slugify.test.ts`

**File**: `apps/labor-market-dashboard/src/__tests__/utils/slugify.test.ts`
**Action**: create

### Pattern Reference

Follow the exact pattern from `apps/labor-market-dashboard/src/__tests__/utils/treeUtils.test.ts`:
- Import `{ describe, it, expect }` from `vitest`
- Import `{ slugify }` from `@/utils/slugify`
- Use `.ts` extension (no JSX)

### Test Cases

**describe('slugify')**:

1. `'transliterates a simple Ukrainian word'`
   - Input: `"Кібербезпека"`
   - Expected: `"kiberbezpeka"`

2. `'transliterates multi-word Ukrainian label'`
   - Input: `"Розробка ПЗ"`
   - Expected: `"rozrobka-pz"`

3. `'handles Ukrainian soft sign (ь)'`
   - Input: `"Сільське господарство"`
   - Expected: `"silske-hospodarstvo"`

4. `'handles special Ukrainian characters (є, ї, ґ)'`
   - Input: `"Європейська їжа ґатунок"`
   - Expected: `"yevropeiska-yizha-gatunok"`

5. `'handles already-Latin input'`
   - Input: `"DevOps / SRE"`
   - Expected: `"devops-sre"` (slashes and spaces become hyphens, collapsed)

6. `'handles mixed Cyrillic and Latin'`
   - Input: `"UI/UX Дизайн"`
   - Expected: `"ui-ux-dyzain"`

7. `'returns fallback for empty string'`
   - Input: `""`
   - Expected: `"node"`

8. `'returns fallback for whitespace-only input'`
   - Input: `"   "`
   - Expected: `"node"`

9. `'collapses multiple hyphens and trims'`
   - Input: `"  Тест -- значення  "`
   - Expected: `"test-znachennia"` (leading/trailing spaces removed, double hyphens collapsed)

10. `'handles numbers in label'`
    - Input: `"Категорія 3"`
    - Expected: `"katehoriia-3"`

---

## Step 4: Add tree utility functions to `treeUtils.ts`

**File**: `apps/labor-market-dashboard/src/utils/treeUtils.ts`
**Action**: modify

### New import

Add at the top, after the existing `import type { TreeNode } from '@/types';`:
```
import { largestRemainder } from '@/data/dataHelpers';
```

This follows the existing pattern where `calculations.ts` already imports from `@/data/dataHelpers`.

### Function 1: `generateUniqueId`

Add after the existing `collectSiblingInfo` function. Include JSDoc.

**Signature**:
```typescript
export function generateUniqueId(
  tree: TreeNode,
  prefix: string,
  slug: string,
): string
```

**Algorithm**:
1. Build candidate: `${prefix}-${slug}`
2. If `findNodeById(tree, candidate)` returns `undefined`, return `candidate`
3. Otherwise, start counter at 2. Build candidate: `${prefix}-${slug}-${counter}`
4. Increment counter until `findNodeById` returns `undefined`
5. Return the unique candidate

**Key detail**: Uses the existing `findNodeById` from the same file (no import needed, just a direct call to the sibling function).

### Function 2: `addChildToParent`

Add after `generateUniqueId`. Include JSDoc.

**Signature**:
```typescript
export function addChildToParent(
  tree: TreeNode,
  parentId: string,
  newChild: TreeNode,
): TreeNode
```

**Algorithm**:
1. Use `updateChildrenInTree(tree, parentId, (children) => { ... })` to immutably update the parent's children.
2. Inside the updater:
   a. Build `newChildren = [...children, newChild]`
   b. Calculate `N = newChildren.length`
   c. Build raw equal percentages: `Array.from({ length: N }, () => 100 / N)`
   d. Apply `largestRemainder(rawPercentages, 100, 1)` to get exact-100 rounded values
   e. Return `newChildren.map((child, i) => ({ ...child, percentage: rounded[i] }))`
3. Return the result of `updateChildrenInTree`.

**Key details**:
- Reuses the existing `updateChildrenInTree` helper (already in the same file).
- The new `largestRemainder` import is the only new dependency.
- The caller (reducer) is responsible for calling `recalcAbsoluteValues` afterward.

### Function 3: `removeChildFromParent`

Add after `addChildToParent`. Include JSDoc.

**Signature**:
```typescript
export function removeChildFromParent(
  tree: TreeNode,
  parentId: string,
  childId: string,
): TreeNode
```

**Algorithm**:
1. First, find the parent via `findNodeById(tree, parentId)`.
2. If the parent is not found OR `parent.children.length <= 1`, return the original `tree` unchanged (block removal of last child).
3. Use `updateChildrenInTree(tree, parentId, (children) => { ... })`:
   a. `remaining = children.filter(c => c.id !== childId)`
   b. If `remaining.length === children.length`, the child was not found; return `children` unchanged.
   c. Calculate `N = remaining.length`
   d. Build raw equal percentages: `Array.from({ length: N }, () => 100 / N)`
   e. Apply `largestRemainder(rawPercentages, 100, 1)`
   f. Return `remaining.map((child, i) => ({ ...child, percentage: rounded[i] }))`
4. Return the result.

**Key details**:
- The "block removal of last child" check must happen BEFORE calling `updateChildrenInTree` to avoid unnecessary tree cloning.
- The caller (reducer) is responsible for `recalcAbsoluteValues`.

---

## Step 5: Add tree utility function tests

**File**: `apps/labor-market-dashboard/src/__tests__/utils/treeUtils.test.ts`
**Action**: modify

### Changes

Add new imports at the top -- add `addChildToParent`, `removeChildFromParent`, `generateUniqueId` to the existing import from `@/utils/treeUtils`.

The existing `createTestTree()` fixture is sufficient for most tests. For some tests, a helper to create a new child node is needed.

### Helper: `createLeafNode`

Add a small helper (inside the test file, not exported) that creates a minimal TreeNode leaf:

```typescript
function createLeafNode(id: string, label: string): TreeNode {
  return {
    id,
    label,
    percentage: 0,
    defaultPercentage: 0,
    absoluteValue: 0,
    genderSplit: { male: 50, female: 50 },
    isLocked: false,
    children: [],
  };
}
```

### New Test Blocks

Add after the existing `describe('collectSiblingInfo')` block:

**describe('generateUniqueId')**:

1. `'returns base ID when no collision'`
   - Setup: `createTestTree()` (has ids: root, child-a, child-b, grandchild-a1, grandchild-a2)
   - Call: `generateUniqueId(tree, 'child', 'c')`
   - Expected: `'child-c'`

2. `'appends -2 suffix when base ID collides'`
   - Call: `generateUniqueId(tree, 'child', 'a')` (collides with `'child-a'`)
   - Expected: `'child-a-2'`

3. `'appends -3 suffix when both base and -2 collide'`
   - Create a tree that has nodes with ids `'child-a'` and `'child-a-2'`:
     - Modify `createTestTree` result by adding a child to root with id `'child-a-2'` via spread
   - Call: `generateUniqueId(modifiedTree, 'child', 'a')`
   - Expected: `'child-a-3'`

4. `'handles empty slug'`
   - Call: `generateUniqueId(tree, 'male', 'node')` (no collision expected)
   - Expected: `'male-node'`

**describe('addChildToParent')**:

5. `'adds child to parent with existing children and redistributes equally'`
   - Setup: `createTestTree()` -- root has 2 children (child-a 60%, child-b 40%)
   - Call: `addChildToParent(tree, 'root', createLeafNode('child-c', 'Child C'))`
   - Assert: root now has 3 children
   - Assert: each child's percentage is approximately 33.3 or 33.4 (via `largestRemainder`)
   - Assert: percentages sum to exactly 100.0

6. `'adds child to parent with no existing children'`
   - Setup: `createTestTree()` -- child-b has 0 children
   - Call: `addChildToParent(tree, 'child-b', createLeafNode('sub-b1', 'Sub B1'))`
   - Assert: child-b now has 1 child
   - Assert: that single child has percentage 100.0

7. `'preserves immutability (original tree unchanged)'`
   - Setup: `createTestTree()`
   - Call: `addChildToParent(tree, 'root', createLeafNode('child-c', 'Child C'))`
   - Assert: original `tree.children.length` is still 2
   - Assert: result `children.length` is 3
   - Assert: result is not the same reference as tree (`result !== tree`)

8. `'redistributes with largestRemainder precision for many children'`
   - Setup: Build a tree where root has 6 children, each at some percentage
   - Call: `addChildToParent(tree, 'root', createLeafNode('new', 'New'))`
   - Assert: 7 children, all with percentage approximately `100/7 = 14.28...`
   - Assert: sum is exactly 100.0

**describe('removeChildFromParent')**:

9. `'removes child and redistributes equally'`
   - Setup: `createTestTree()` -- root has child-a (60%) and child-b (40%)
   - Call: `removeChildFromParent(tree, 'root', 'child-b')`
   - Assert: root now has 1 child (child-a)
   - Assert: child-a percentage is 100.0

10. `'blocks removal when parent has only 1 child'`
    - Setup: Build a tree where root has only 1 child
    - Call: `removeChildFromParent(tree, 'root', 'only-child')`
    - Assert: returns the original tree reference (`result === tree`)
    - Assert: child is still present

11. `'returns original tree when parentId not found'`
    - Call: `removeChildFromParent(tree, 'nonexistent', 'child-a')`
    - Assert: returns original tree reference

12. `'returns unchanged children when childId not found in parent'`
    - Call: `removeChildFromParent(tree, 'root', 'nonexistent-child')`
    - Assert: result still has 2 children with same percentages

13. `'preserves immutability on removal'`
    - Setup: `createTestTree()`
    - Call: `removeChildFromParent(tree, 'root', 'child-b')`
    - Assert: original tree still has 2 children
    - Assert: result !== tree

14. `'redistributes correctly when removing from a group of 3+'`
    - Setup: Build a tree where root has 3 children (each ~33.3%)
    - Call: remove one child
    - Assert: 2 remaining, each at 50.0%
    - Assert: sum is exactly 100.0

---

## Step 6: Extend TreeAction union

**File**: `apps/labor-market-dashboard/src/types/actions.ts`
**Action**: modify

### Exact Changes

**Update the JSDoc** at the top of the `TreeAction` type to list all 9 action types. Add these lines to the JSDoc comment:
```
 * - `ADD_INDUSTRY`: Add a new industry node under a gender node
 * - `REMOVE_INDUSTRY`: Remove an industry node (and its subcategories)
 * - `ADD_SUBCATEGORY`: Add a new subcategory under an industry node
 * - `REMOVE_SUBCATEGORY`: Remove a subcategory from an industry node
```

**Add 4 new union members** at the end of the existing `TreeAction` type, after the `| { type: 'RESET' }` line and before the semicolon:

```typescript
  | { type: 'ADD_INDUSTRY'; genderId: string; label: string }
  | { type: 'REMOVE_INDUSTRY'; nodeId: string }
  | { type: 'ADD_SUBCATEGORY'; industryId: string; label: string }
  | { type: 'REMOVE_SUBCATEGORY'; nodeId: string };
```

The final type will have 9 union members total. The semicolon moves to the last new member.

**Pattern reference**: The existing 5 union members in `apps/labor-market-dashboard/src/types/actions.ts` each have their fields on one line. Follow the same style.

**No change needed to `types/index.ts`** -- it already re-exports `TreeAction` via `export type { TreeAction } from './actions'`.

---

## Step 7: Implement reducer handlers

**File**: `apps/labor-market-dashboard/src/hooks/useTreeState.ts`
**Action**: modify

### New Imports

Add to the existing import from `@/utils/treeUtils`: `addChildToParent`, `removeChildFromParent`, `generateUniqueId`.

The full import line becomes:
```typescript
import {
  addChildToParent,
  collectSiblingInfo,
  findNodeById,
  findParentById,
  generateUniqueId,
  removeChildFromParent,
  updateChildrenInTree,
  updateNodeInTree,
} from '@/utils/treeUtils';
```

Add a new import for slugify:
```typescript
import { slugify } from '@/utils/slugify';
```

Modify the existing `@/data` import to also include `largestRemainder`:
```typescript
import { defaultTree, largestRemainder } from '@/data';
```

### Update `treeReducer` JSDoc

Change "Handles 5 action types" to "Handles 9 action types" and add the 4 new types to the doc list:
```
 * - ADD_INDUSTRY: Add a new industry under a gender node
 * - REMOVE_INDUSTRY: Remove an industry (and all its subcategories)
 * - ADD_SUBCATEGORY: Add a new subcategory under an industry
 * - REMOVE_SUBCATEGORY: Remove a subcategory (industry may become leaf)
```

### New Case Handlers

Add 4 new case blocks in the `switch` statement, BETWEEN the existing `case 'SET_TOTAL_POPULATION'` block and `case 'RESET'`.

#### Case `'ADD_INDUSTRY'`

**Logic**:
1. Destructure `genderId` and `label` from action.
2. Find the gender node via `findNodeById(state.tree, genderId)`. If not found, return `state`.
3. Generate slug: `const slug = slugify(label);`
4. Extract gender prefix: `const genderPrefix = genderId.replace('gender-', '');` -- converts `'gender-male'` to `'male'`, `'gender-female'` to `'female'`.
5. Generate unique ID: `const nodeId = generateUniqueId(state.tree, genderPrefix, slug);`
6. Determine genderSplit: `genderPrefix === 'male' ? { male: 100, female: 0 } : { male: 0, female: 100 }`
7. Create new TreeNode with: `id: nodeId`, `label`, `percentage: 0`, `defaultPercentage: 0`, `absoluteValue: 0`, the computed `genderSplit`, `isLocked: false`, `children: []`.
8. Call `addChildToParent(state.tree, genderId, newNode)` to get new tree.
9. Call `recalcTreeFromRoot(newTree, state.totalPopulation)` to recalculate absolute values.
10. Return `{ ...state, tree: newTree }`.

**Note**: `percentage: 0` is immediately overwritten by `addChildToParent` which applies equal redistribution. `defaultPercentage: 0` persists and marks this as a custom node.

#### Case `'REMOVE_INDUSTRY'`

**Logic**:
1. Destructure `nodeId` from action.
2. Find parent via `findParentById(state.tree, nodeId)`. If not found, return `state`.
3. Call `removeChildFromParent(state.tree, parent.id, nodeId)`.
4. If the result is the same reference as `state.tree` (blocked), return `state`.
5. Call `recalcTreeFromRoot(newTree, state.totalPopulation)`.
6. Return `{ ...state, tree: recalced }`.

**Note**: Subcategories are removed implicitly -- removing the industry node removes its entire subtree since the child filtering in `removeChildFromParent` drops the node and all its descendants.

#### Case `'ADD_SUBCATEGORY'`

**Logic**:
1. Destructure `industryId` and `label` from action.
2. Find industry node via `findNodeById(state.tree, industryId)`. If not found, return `state`.
3. Generate slug: `const slug = slugify(label);`
4. Generate unique ID using `industryId` as prefix: `const nodeId = generateUniqueId(state.tree, industryId, slug);`
5. Create new TreeNode with: `id: nodeId`, `label`, `percentage: 0`, `defaultPercentage: 0`, `absoluteValue: 0`, `genderSplit: { ...industryNode.genderSplit }` (clone from parent), `isLocked: false`, `children: []`.
6. Call `addChildToParent(state.tree, industryId, newNode)`.
7. Call `recalcTreeFromRoot(newTree, state.totalPopulation)`.
8. Return `{ ...state, tree: newTree }`.

**Note**: The subcategory ID uses `industryId` as prefix (e.g., `'male-j'` produces `'male-j-kiberbezpeka'`), matching the existing convention in `defaultTree.ts`.

#### Case `'REMOVE_SUBCATEGORY'`

**IMPORTANT**: This case does NOT use `removeChildFromParent` because that function blocks removal when `children.length <= 1`. The acceptance criteria requires that removing the last subcategory makes the industry a leaf node (`children: []`).

**Logic**:
1. Destructure `nodeId` from action.
2. Find parent via `findParentById(state.tree, nodeId)`. If not found, return `state`.
3. Call `updateChildrenInTree(state.tree, parent.id, (children) => { ... })`:
   a. `const remaining = children.filter(c => c.id !== nodeId);`
   b. If `remaining.length === children.length`, return `children` (child not found).
   c. If `remaining.length === 0`, return `[]` (industry becomes leaf).
   d. Calculate `N = remaining.length`.
   e. Build raw: `Array.from({ length: N }, () => 100 / N)`.
   f. Apply `largestRemainder(rawPercentages, 100, 1)`.
   g. Return `remaining.map((child, i) => ({ ...child, percentage: rounded[i] }))`.
4. If result is same reference as `state.tree`, return `state`.
5. Call `recalcTreeFromRoot(newTree, state.totalPopulation)`.
6. Return `{ ...state, tree: recalced }`.

**Why inline logic instead of `removeChildFromParent`**: The `removeChildFromParent` utility is designed for industry-level removal where a gender must always have >= 1 industry. Subcategory removal has different semantics -- removing the last subcategory is valid and turns the industry into a leaf. To keep `removeChildFromParent` clean (single responsibility: remove-with-minimum-1-guard), the subcategory case handles its own logic using `updateChildrenInTree` directly.

---

## Step 8: Add reducer handler tests

**File**: `apps/labor-market-dashboard/src/__tests__/hooks/useTreeState.test.ts`
**Action**: modify

### New Imports

No new imports needed -- the test file already imports `treeReducer`, `initialState`, `TreeAction`, `TreeNode`, `DashboardState`, and `findNodeById`.

### New Helper

Add a new helper `createGenderState()` that creates a gender-like tree structure. Place it after the existing `createSmallState()`:

```
function createGenderState(): DashboardState
```

This helper creates:
```
root (100%, abs=10000)
  gender-male (50%, abs=5000)
    male-a (60%, abs=3000) -- leaf
    male-b (40%, abs=2000) -- has 2 children
      male-b-sub1 (50%, abs=1000)
      male-b-sub2 (50%, abs=1000)
  gender-female (50%, abs=5000)
    female-a (100%, abs=5000) -- leaf
```

All nodes have:
- `defaultPercentage` matching `percentage`
- Male subtree: `genderSplit: { male: 100, female: 0 }`
- Female subtree: `genderSplit: { male: 0, female: 100 }`
- Root: `genderSplit: { male: 50, female: 50 }`
- `isLocked: false`
- `totalPopulation: 10000`, `balanceMode: 'auto'`

### New Test Blocks

Add after the existing `describe('performance')` block:

**describe('ADD_INDUSTRY')**:

1. `'adds a new industry under a gender node with equal redistribution'`
   - Setup: `createGenderState()` -- gender-male has 2 industries (male-a, male-b)
   - Action: `{ type: 'ADD_INDUSTRY', genderId: 'gender-male', label: 'Тест' }`
   - Assert: gender-male now has 3 children
   - Assert: all 3 children have percentage approximately 33.3 or 33.4
   - Assert: child percentages sum to exactly 100.0 (use `childPercentageSum`)
   - Assert: new node ID starts with `'male-'`

2. `'generates correct node ID from Ukrainian label'`
   - Action: `{ type: 'ADD_INDUSTRY', genderId: 'gender-male', label: 'Кібербезпека' }`
   - Assert: find a node whose id is `'male-kiberbezpeka'` (use `findNodeById`)

3. `'sets defaultPercentage to 0 for custom nodes'`
   - Action: `{ type: 'ADD_INDUSTRY', genderId: 'gender-male', label: 'Нова' }`
   - Assert: new node's `defaultPercentage` is `0`

4. `'sets correct genderSplit for male industry'`
   - Action: `{ type: 'ADD_INDUSTRY', genderId: 'gender-male', label: 'Тест' }`
   - Assert: new node's `genderSplit` is `{ male: 100, female: 0 }`

5. `'sets correct genderSplit for female industry'`
   - Action: `{ type: 'ADD_INDUSTRY', genderId: 'gender-female', label: 'Тест' }`
   - Assert: new node's `genderSplit` is `{ male: 0, female: 100 }`

6. `'recalculates absolute values after adding'`
   - Action: add industry to gender-male
   - Assert: new node's `absoluteValue` is `Math.round(genderAbsoluteValue * newPercentage / 100)`
   - Assert: existing sibling absolute values are recalculated consistently

7. `'is no-op when genderId does not exist'`
   - Action: `{ type: 'ADD_INDUSTRY', genderId: 'nonexistent', label: 'Тест' }`
   - Assert: `newState === state` (same reference)

**describe('REMOVE_INDUSTRY')**:

8. `'removes an industry and redistributes equally'`
   - Setup: `createGenderState()` -- gender-male has 2 industries
   - Action: `{ type: 'REMOVE_INDUSTRY', nodeId: 'male-a' }`
   - Assert: gender-male now has 1 child
   - Assert: remaining child has percentage 100.0
   - Assert: absolute values recalculated

9. `'removes an industry with subcategories (cascade)'`
   - Action: `{ type: 'REMOVE_INDUSTRY', nodeId: 'male-b' }` (has 2 subcategories)
   - Assert: gender-male now has 1 child (male-a)
   - Assert: `findNodeById(newState.tree, 'male-b-sub1')` is undefined
   - Assert: `findNodeById(newState.tree, 'male-b-sub2')` is undefined

10. `'blocks removal of last industry under a gender'`
    - Setup: First remove male-a, then try to remove male-b (the last one)
    - Assert: second removal returns same state reference (`newState === intermediateState`)

11. `'is no-op when nodeId not found'`
    - Action: `{ type: 'REMOVE_INDUSTRY', nodeId: 'nonexistent' }`
    - Assert: `newState === state`

**describe('ADD_SUBCATEGORY')**:

12. `'adds first subcategory to a leaf industry (becomes expandable)'`
    - Setup: `createGenderState()` -- male-a is a leaf
    - Action: `{ type: 'ADD_SUBCATEGORY', industryId: 'male-a', label: 'Підкатегорія' }`
    - Assert: male-a now has 1 child
    - Assert: that child has percentage 100.0
    - Assert: child inherits genderSplit from parent (`{ male: 100, female: 0 }`)

13. `'adds subcategory to industry with existing subcategories'`
    - Action: `{ type: 'ADD_SUBCATEGORY', industryId: 'male-b', label: 'Нова' }`
    - Assert: male-b now has 3 children
    - Assert: all 3 children percentages sum to exactly 100.0

14. `'generates subcategory ID with industry prefix'`
    - Action: `{ type: 'ADD_SUBCATEGORY', industryId: 'male-b', label: 'Тест' }`
    - Assert: new node ID is `'male-b-test'`

15. `'is no-op when industryId does not exist'`
    - Action: `{ type: 'ADD_SUBCATEGORY', industryId: 'nonexistent', label: 'Test' }`
    - Assert: `newState === state`

**describe('REMOVE_SUBCATEGORY')**:

16. `'removes a subcategory and redistributes equally'`
    - Setup: `createGenderState()` -- male-b has 2 subcategories (sub1, sub2)
    - Action: `{ type: 'REMOVE_SUBCATEGORY', nodeId: 'male-b-sub1' }`
    - Assert: male-b now has 1 child (male-b-sub2)
    - Assert: remaining child has percentage 100.0

17. `'removes last subcategory (industry becomes leaf)'`
    - Apply two sequential actions: remove sub1, then remove sub2 on the result
    - Assert: male-b now has 0 children (`children.length === 0`)
    - Assert: male-b still exists in the tree
    - Assert: male-b's percentage is unchanged within gender context

18. `'is no-op when nodeId not found'`
    - Action: `{ type: 'REMOVE_SUBCATEGORY', nodeId: 'nonexistent' }`
    - Assert: `newState === state`

19. `'recalculates absolute values after subcategory removal'`
    - Action: remove a subcategory from male-b
    - Assert: remaining subcategory `absoluteValue` equals `Math.round(maleB.absoluteValue * 100 / 100)` (since it gets 100%)

---

## Step 9: Update barrel exports

**File**: `apps/labor-market-dashboard/src/utils/index.ts`
**Action**: modify

### Changes

1. **Add slugify export**: Add a new line between the `format.ts` exports and the `treeUtils.ts` exports:
```typescript
export { slugify } from './slugify';
```

2. **Add new treeUtils exports**: Update the existing treeUtils export block to include the 3 new functions. Maintain alphabetical order:

The full treeUtils export block becomes:
```typescript
export {
  addChildToParent,
  collectSiblingInfo,
  findNodeById,
  findParentById,
  generateUniqueId,
  removeChildFromParent,
  updateChildrenInTree,
  updateNodeInTree,
} from './treeUtils';
```

---

## Step 10: Create ADR-0006

**File**: `architecture/decisions/adr-0006-adopt-wouter-for-hash-routing.md`
**Action**: create

### Full Content

Follow the template from `architecture/decisions/_template.md` and the style from `architecture/decisions/adr-0005-use-recharts-2x-for-pie-chart-visualization.md`.

**Frontmatter**:
```yaml
---
status: accepted
date: 2026-02-19
triggered-by: task-011
---
```

**Title**: `ADR-0006: Adopt wouter for Hash-Based Client-Side Routing`

**Context and Problem Statement** (2-3 sentences):
The Labor Market Dashboard needs client-side routing to support a new Tree Configuration Page alongside the existing Dashboard view. The application is hosted on GitHub Pages, which does not support server-side URL rewriting, making hash-based routing (`/#/config`) necessary. The project's architecture favors minimal dependencies (see ADR-0004 for useReducer over Zustand, ADR-0005 for Recharts 2.x over 3.x), so the routing library must be lightweight.

**Decision Drivers**:
- GitHub Pages hosting requires hash-based routing (no server-side rewrites)
- Bundle size target: < 500KB gzipped (NFR-07); current bundle is ~175KB
- Only 2 routes needed (`/` and `/config`) -- minimal routing features required
- Must support React 19 and TypeScript with built-in type declarations
- Hash routing hook must be available (not just history-based routing)

**Considered Options**:
- wouter (~2KB gzipped)
- react-router-dom (~18KB gzipped)
- TanStack Router (~12KB gzipped)
- Manual `window.location.hash` with custom hooks (0KB)

**Decision Outcome**:
Chosen option: "wouter", because it provides the smallest bundle impact (~2KB gzipped) while offering proper React integration (Router, Route, Link components, `useHashLocation` hook) that the manual approach lacks. react-router-dom was rejected as significantly heavier (~18KB) with far more features than needed for 2 routes. TanStack Router was rejected for higher config overhead and larger bundle. The manual approach was rejected because it lacks declarative route matching, Link components with active state, and would require reimplementing routing primitives.

**Consequences**:
- Good, because ~2KB gzipped addition keeps total bundle well under the 500KB budget (~177KB total)
- Good, because wouter ships TypeScript declarations and supports React 19
- Good, because `useHashLocation` hook enables hash routing with zero configuration
- Good, because the API is minimal (Router, Route, Link, useLocation) matching the project's lightweight philosophy
- Bad, because wouter has a smaller community than react-router-dom, with fewer StackOverflow answers and tutorials
- Bad, because if routing needs grow significantly (nested layouts, route guards, data loaders), migration to react-router-dom may be warranted

**More Information**:
- wouter hash routing: `<Router hook={useHashLocation}>` wraps the app; `<Route path="/config">` matches `/#/config`
- State preservation: `useTreeState()` is called in App.tsx above the Router, so state persists across route changes
- Escalation path: If a third page or complex routing features (nested routes, loaders, route-level code splitting) are added, re-evaluate migration to react-router-dom or TanStack Router. The current wouter integration touches only `App.tsx` and `Sidebar.tsx`, making migration straightforward.
- Related: [ADR-0004](adr-0004-use-react-usereducer-for-state-management.md) (lightweight state), [ADR-0005](adr-0005-use-recharts-2x-for-pie-chart-visualization.md) (lightweight charting)

---

## Step 11: Update architecture CLAUDE.md

**File**: `architecture/CLAUDE.md`
**Action**: modify

### Change

Update the "Next available" ADR number from `0006` to `0007`:
```
- Next available: 0007
```

---

## Step 12: Final Verification

Run in order:
1. `pnpm lint` -- must pass with 0 errors
2. `pnpm test` -- all existing tests + all new tests must pass
3. `pnpm build` -- must compile successfully with no type errors

---

## File Summary

### Files to Create (3)

| # | File Path | Description |
|---|-----------|-------------|
| 1 | `apps/labor-market-dashboard/src/utils/slugify.ts` | Ukrainian-to-slug transliteration utility |
| 2 | `apps/labor-market-dashboard/src/__tests__/utils/slugify.test.ts` | Slugify unit tests (10 test cases) |
| 3 | `architecture/decisions/adr-0006-adopt-wouter-for-hash-routing.md` | ADR documenting wouter adoption |

### Files to Modify (8)

| # | File Path | Change |
|---|-----------|--------|
| 1 | `apps/labor-market-dashboard/package.json` | Add `wouter` to dependencies |
| 2 | `apps/labor-market-dashboard/src/utils/treeUtils.ts` | Add `addChildToParent`, `removeChildFromParent`, `generateUniqueId`; add import for `largestRemainder` |
| 3 | `apps/labor-market-dashboard/src/types/actions.ts` | Add 4 new union members to `TreeAction`; update JSDoc |
| 4 | `apps/labor-market-dashboard/src/hooks/useTreeState.ts` | Add 4 case handlers; add imports for `slugify`, new treeUtils functions, `largestRemainder` |
| 5 | `apps/labor-market-dashboard/src/utils/index.ts` | Add exports for `slugify`, `addChildToParent`, `generateUniqueId`, `removeChildFromParent` |
| 6 | `apps/labor-market-dashboard/src/__tests__/utils/treeUtils.test.ts` | Add test cases for 3 new functions (~14 tests) |
| 7 | `apps/labor-market-dashboard/src/__tests__/hooks/useTreeState.test.ts` | Add test cases for 4 new actions (~19 tests) |
| 8 | `architecture/CLAUDE.md` | Update next available ADR number to 0007 |

## Build Verification

After implementing all steps, run these commands and verify they pass:

```bash
pnpm lint          # Must pass with 0 errors
pnpm test          # All tests must pass (existing ~246 + ~43 new)
pnpm build         # Web app must compile successfully
```

If `pnpm build` fails, fix the issue before proceeding. A broken build blocks all further workflow stages.

## Critical Implementation Notes

1. **`REMOVE_SUBCATEGORY` must NOT use `removeChildFromParent`** -- it needs to allow removal down to 0 children (industry becomes leaf). Use `updateChildrenInTree` with inline filtering logic and `largestRemainder` instead. This is the most important design decision in the subtask.

2. **`REMOVE_INDUSTRY` DOES use `removeChildFromParent`** -- which blocks removal of the last industry (correct behavior: gender must have >= 1 industry).

3. **The `slugify` function must handle the edge case of empty/whitespace input** by returning `"node"` as a fallback. This prevents empty node IDs.

4. **`generateUniqueId` counter starts at 2** (not 1), producing suffixes like `-2`, `-3`, etc. This is because the base ID without suffix is attempt 1.

5. **Import `largestRemainder` into `useTreeState.ts`** from `@/data` (it is already exported from the data barrel). This is needed for the `REMOVE_SUBCATEGORY` handler's inline redistribution logic.

6. **All new TreeNode fields for custom nodes**: `percentage: 0` (overwritten by `addChildToParent`), `defaultPercentage: 0` (persists -- marks custom), `absoluteValue: 0` (overwritten by `recalcTreeFromRoot`), `isLocked: false`, `children: []`.

7. **Gender prefix extraction**: `genderId.replace('gender-', '')` converts `'gender-male'` to `'male'`. This relies on the node ID convention from `defaultTree.ts` and must NOT be changed.

8. **Subcategory ID prefix is the full `industryId`**: e.g., for `industryId = 'male-j'` and label "Кібербезпека", the ID becomes `'male-j-kiberbezpeka'`. This matches existing convention (e.g., `male-j-software-dev`).
