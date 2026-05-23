# Migration to v1.0

This guide covers upgrading from `velo-circuit` 0.x to **1.0.0**.

## Package name

If you previously used the working name `velo-circuit-editor`, switch imports to `velo-circuit`:

```ts
// Before (0.x docs / internal name)
import { createEditor } from 'velo-circuit-editor';

// After (1.0.0)
import { createEditor } from 'velo-circuit';
```

Framework adapters use subpath exports:

```ts
import { CircuitEditor } from 'velo-circuit/react';
import { CircuitEditor } from 'velo-circuit/vue';
```

## Static SVG rendering

**Recommended in 1.0.0:** use `renderDslPreviewSvg()` for docs, thumbnails, and read-only output. It parses DSL, lays out the graph, renders preview-mode SVG, and embeds theme CSS in one call:

```ts
import { renderDslPreviewSvg } from 'velo-circuit';

const svg = renderDslPreviewSvg('R0-p(R1,C1)-Wo2', {
  themeMode: 'dark',
  colorMode: 'multicolor',
  connectionStyle: 'curved',
});
```

For lower-level control, use `renderDslToSvg()` with `preview: true`:

```ts
import { renderDslToSvg, exportPreviewSvgWithStyles, getTheme } from 'velo-circuit';

const theme = getTheme('dark');
const raw = renderDslToSvg('R0-C1', { preview: true, theme, connectionStyle: 'curved' });
const svg = exportPreviewSvgWithStyles(raw, theme, { colorMode: 'multicolor' });
```

Preview mode omits selection chrome (`node-bg`, `node-hit`) and uses transparent backgrounds suitable for documentation sites.

## Wire routing

Curved wires are the **default** in 1.0.0. If you relied on straight orthogonal routing from earlier preview builds, pass `connectionStyle: 'orthogonal'` explicitly:

```ts
renderDslPreviewSvg(dsl, { connectionStyle: 'orthogonal' });
```

## Junction dots

Parallel branches (`p(R1,C1)`) insert empty junction nodes. In 1.0.0, junction dots render at the **wire hub port** where connections converge (`getJunctionHub()`), not at the geometric center of the junction box.

No DSL changes are required — existing circuits render correctly with improved dot placement.

## Theme colors

Use `colorMode: 'multicolor'` (per-element stroke colors) or `colorMode: 'bicolor'` (single accent + neutral) on preview APIs. Editor mode continues to use `buildThemeCSS()` with the full interactive theme.

## Breaking changes

There are **no intentional breaking API changes** between 0.4.0 and 1.0.0 for core editor usage. The 1.0.0 release stabilizes the static preview API and documents previously internal behavior.

If you embedded raw SVG from `renderCircuit()` without theme CSS, consider switching to `renderDslPreviewSvg()` or `exportPreviewSvgWithStyles()` for correct colors in standalone output.

## Further reading

- [Static SVG Rendering](/guide/static-rendering)
- [Render & Themes API](/api/render)
- [CHANGELOG](https://github.com/jigonzalez930209/velo-circuit/blob/main/CHANGELOG.md)
