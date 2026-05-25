# CPE and Complex Elements

The Constant Phase Element (CPE) models non-ideal behavior at electrode interfaces.

## CPE vs Capacitor

A pure capacitor assumes ideal behavior. Real electrodes show non-ideal (depressed semi-circles) due to surface heterogeneity.

```ts
// Capacitor (ideal)
editor.setValue('R0-p(R1,C1)-Wo2')

// CPE (non-ideal) — use Q instead of C
editor.setValue('R0-p(R1,Q1)-Wo2')
```

<CircuitSvgPreview dsl="R0-p(R1,Q1)-Wo2" caption="Randles with CPE and Warburg open" />

## CPE Parameters

CPE has two parameters:

- `Q₀` — pseudo-capacitance (S·sⁿ)
- `n` — ideality factor (0 < n ≤ 1)

```ts
// n=1 → pure capacitor
// n=0.8 → typical depressed semi-circle
// n=0.5 → Warburg-like behavior
```

## Element Code

> **Important**: CPE uses the code `Q`, not `CPE`. The Boukamp DSL uses single-character codes where possible.

```ts
// Correct ✓
editor.setValue('R0-p(R1,Q1)')

// Incorrect ✗ — "CPE" is not a valid element code
// editor.setValue('R0-p(R1,CPE1)')
```

## Full Complex Circuit

```ts
// Multi-element model with CPE and Warburg
editor.setValue('R0-p(R1,Q1)-p(R2,C2)-Wo3')
```

<CircuitSvgPreview dsl="R0-p(R1,Q1)-p(R2,C2)-Wo3" maxWidth="520px" />

## Validation Rules

```ts
const result = editor.getValidation()
result.issues.forEach(issue => {
  if (issue.type === 'error') {
    // blocking: duplicate IDs, syntax errors, empty parallel groups
  } else {
    // warning: no DC path, conflicting reactive elements
  }
})
```

## API

- [Render API](/api/render) — `renderDslPreviewSvg`
- [Element Types](/reference/element-types)


## Next

[API Reference](/api/core)