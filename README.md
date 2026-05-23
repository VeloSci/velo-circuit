# velo-circuit

Framework-agnostic SVG circuit editor for Boukamp DSL circuits used in electrochemical impedance spectroscopy (EIS).

## Why velo-circuit

- Unified circuit model from DSL parsing to rendered SVG output
- Pure TypeScript core with no runtime UI framework dependency
- Official adapters for React, Vue, Svelte, Angular, Astro and Vanilla
- Built-in editor interactions: zoom, pan, drag, diagnostics, undo/redo
- Parameterized DSL: `R0{50}-Q1{5e-5,0.8}` with strict validation mode
- SVG-first canvas with world-space infinite grid
- `createCircuitGrid()` catalog view (DSL + SVG columns) and editor grid mode
- Full parity with `velo-spectroz` circuit elements (11 types including `CC`, `HN`)
- Designed to integrate with scientific tooling such as `velo-spectroz`

## Element types (11)

Circuit symbols use the [outline symbol design system](./docs/reference/symbol-design-system.md): outline-only glyphs, **2.0 px** base stroke, and per-kind stroke colors. Parameter counts and DSL syntax are documented in [Element Types](./docs/reference/element-types.md).

| Code | Element | Params |
|------|---------|--------|
| [`R`](./docs/reference/element-types.md#resistor-r) | Resistor | 1 |
| [`C`](./docs/reference/element-types.md#capacitor-c) | Capacitor | 1 |
| [`L`](./docs/reference/element-types.md#inductor-l) | Inductor | 1 |
| [`Q`](./docs/reference/element-types.md#cpe-q) | CPE | 2 |
| [`W`](./docs/reference/element-types.md#warburg-infinite-w) | Warburg Infinite | 1 |
| [`Ws`](./docs/reference/element-types.md#warburg-short-ws) | Warburg Short | 2 |
| [`Wo`](./docs/reference/element-types.md#warburg-open-wo) | Warburg Open | 2 |
| [`G`](./docs/reference/element-types.md#gerischer-g) | Gerischer | 2 |
| [`Pdw`](./docs/reference/element-types.md#parallel-diffusion-warburg-pdw) | Parallel Diffusion Warburg | 4 |
| [`CC`](./docs/reference/element-types.md#cole-cole-cc) | Cole-Cole | 3 |
| [`HN`](./docs/reference/element-types.md#havriliak-negami-hn) | Havriliak-Negami | 4 |

## Install

```bash
pnpm add velo-circuit
```

or:

```bash
npm install velo-circuit
```

## Quick Usage (Vanilla)

```ts
import { createEditor } from 'velo-circuit';

const editor = createEditor();

editor.mount(document.getElementById('canvas'), {
  initialDsl: 'R0-p(R1,C1)-Wo2',
  width: 900,
  height: 560,
});

editor.on('ast-changed', () => {
  console.log(editor.getValue());
});
```

## Circuit grid catalog

```ts
import { createCircuitGrid } from 'velo-circuit';

const grid = createCircuitGrid({
  height: 480,
  rowHeight: 120,
  strict: true,
  columns: [
    { id: 'dsl', label: 'Linear DSL', type: 'dsl', width: 320 },
    { id: 'svg', label: 'Circuit', type: 'svg', width: 220 },
    { id: 'params', label: 'Parameters', type: 'params', width: 200 },
  ],
  initialRows: [
    { id: 'r1', dsl: 'R0{50}-p(R1{100},C1{1e-5})' },
    { id: 'r2', dsl: 'R0{10}-CC1{50,1e-3,0.8}' },
  ],
});

grid.mount(document.getElementById('grid')!);
grid.on('row-double-click', (row) => console.log(row));
```

## Local Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm docs:dev
```

## Release Workflow

CI runs in GitHub Actions on Node 22 and 24. npm publish is triggered by pushing a tag like `v0.2.0`.

You can prepare and dispatch a release with:

```bash
pnpm release:prepare -- 0.2.0
```

What it does:

- runs `typecheck`, `test`, and `build`
- bumps `package.json` and `package-lock.json` to the provided version
- creates commit `chore(release): vX.Y.Z`
- creates tag `vX.Y.Z`
- pushes branch and tag to GitHub

Required GitHub secret for publish workflow: `NPM_TOKEN`.

## License

[MIT](./LICENSE)