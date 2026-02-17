# Shared Config Package

**Package**: `@template/config`

Centralized TypeScript, ESLint, and Prettier configurations shared across the monorepo.

## Structure

```
packages/config/
  package.json           # Exports map + shared devDependencies
  typescript/
    base.json            # Base TypeScript config (strict, ES2022, NodeNext)
    next.json            # Next.js apps (jsx: "preserve", plugin: ["next"])
    nest.json            # NestJS apps (experimentalDecorators, emitDecoratorMetadata)
    react.json           # React/Vite apps (jsx: "react-jsx", Bundler resolution, noEmit)
  eslint/
    base.js              # Base ESLint (typescript-eslint, import plugin, no-explicit-any: error)
    next.js              # Next.js apps (eslint-config-next)
    nest.js              # NestJS apps (node env)
    react.js             # React/Vite apps (react-hooks, react-refresh plugins)
  prettier/
    index.js             # Shared Prettier config
```

## Adding a New Config Variant

When adding a new app type (e.g., a CLI tool, a library):

1. **TypeScript**: Create `typescript/{variant}.json` extending `./base.json`
2. **ESLint**: Create `eslint/{variant}.js` extending `./base.js`
3. **Exports**: Add both to `package.json` exports map:
   ```json
   "./typescript/{variant}": "./typescript/{variant}.json",
   "./eslint/{variant}": "./eslint/{variant}.js"
   ```
4. **Dependencies**: Add any new ESLint plugins to `devDependencies`
5. **App usage**: Extend via `@template/config/typescript/{variant}` and `require.resolve("@template/config/eslint/{variant}")`

## Key Differences Between Variants

| Setting | base | next | nest | react |
|---------|------|------|------|-------|
| `jsx` | -- | `preserve` | -- | `react-jsx` |
| `moduleResolution` | `NodeNext` | `Bundler` | `NodeNext` | `Bundler` |
| `noEmit` | -- | -- | -- | `true` |
| `target` | `ES2022` | `ES2017` | `ES2022` | `ES2020` |
| `emitDecoratorMetadata` | -- | -- | `true` | -- |

## DO NOT

- Modify `base.json` or `base.js` without checking impact on ALL app types (next, nest, react)
- Add app-specific rules to base configs -- create a variant instead
- Use ESLint v9 flat config format -- the monorepo uses v8 legacy format (`.eslintrc.cjs`). Migration to v9 is a separate monorepo-wide task.
- Forget to add new plugins to `devDependencies` when creating a new ESLint variant
