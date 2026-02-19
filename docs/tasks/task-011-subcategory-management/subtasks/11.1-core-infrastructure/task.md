# Subtask 11.1: Core Infrastructure

## Parent Task
task-011-subcategory-management

## Description
Install wouter routing library, create slugify utility for Ukrainian label-to-slug conversion, add tree utility functions for adding/removing children with equal redistribution, extend TreeAction with 4 new action types, implement reducer handlers, and create ADR-0006 for wouter adoption. Covers TL design Steps 1-5.

## Acceptance Criteria

* Given wouter is installed
  When `pnpm build` runs
  Then the build succeeds and bundle size increases by ~2KB gzipped

* Given a Ukrainian label (e.g., "Кібербезпека")
  When `slugify()` is called
  Then it returns a kebab-case ASCII slug (e.g., "kiberbezpeka")

* Given a tree and a parent node
  When `addChildToParent()` is called with a new child
  Then all siblings (including the new child) get equal redistribution summing to 100.0%

* Given a tree and a parent node with >1 child
  When `removeChildFromParent()` is called
  Then the child is removed and remaining siblings get equal redistribution summing to 100.0%

* Given a tree with an existing node ID
  When `generateUniqueId()` is called with a colliding slug
  Then it appends a numeric suffix to make it unique

* Given the ADD_INDUSTRY action is dispatched with a genderId and label
  When the reducer processes it
  Then a new industry node appears under the gender with correct ID, genderSplit, and redistributed percentages

* Given the REMOVE_INDUSTRY action is dispatched for an industry with subcategories
  When the reducer processes it
  Then the industry and all subcategories are removed, remaining industries redistribute

* Given the ADD_SUBCATEGORY action is dispatched
  When the reducer processes it
  Then a new subcategory appears with correct ID and redistributed percentages

* Given the REMOVE_SUBCATEGORY action removes the last subcategory
  When the reducer processes it
  Then the industry becomes a leaf node (empty children array)

* Given ADR-0006 is created
  When reviewed
  Then it documents wouter selection rationale, hash routing, and escalation path

## Verification Steps

1. `pnpm build` passes after wouter install
2. `pnpm test` -- slugify tests pass (Cyrillic transliteration, edge cases)
3. `pnpm test` -- addChildToParent, removeChildFromParent, generateUniqueId tests pass
4. `pnpm build` -- no type errors after TreeAction extension
5. `pnpm test` -- all 4 new reducer action tests pass
6. `pnpm lint` -- no errors
7. ADR-0006 exists and follows template format

## Files to Create/Modify

### Create
- `src/utils/slugify.ts`
- `src/__tests__/utils/slugify.test.ts`
- `architecture/decisions/adr-0006-adopt-wouter-for-hash-routing.md`

### Modify
- `package.json` (add wouter dependency)
- `src/types/actions.ts` (add 4 new action types)
- `src/utils/treeUtils.ts` (add addChildToParent, removeChildFromParent, generateUniqueId)
- `src/utils/index.ts` (add exports)
- `src/hooks/useTreeState.ts` (add 4 case handlers)
- `src/__tests__/utils/treeUtils.test.ts` (add test cases)
- `src/__tests__/hooks/useTreeState.test.ts` (add test cases)
