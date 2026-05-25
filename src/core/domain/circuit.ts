export enum ElementKind {
  Resistor = 'R',
  Capacitor = 'C',
  Inductor = 'L',
  Cpe = 'Q',
  WarburgInfinite = 'W',
  WarburgShort = 'Ws',
  WarburgOpen = 'Wo',
  Gerischer = 'G',
  ParallelDiffusionWarburg = 'Pdw',
  ColeCole = 'CC',
  HavriliakNegami = 'HN',
}

export type ElementCode = 'R' | 'C' | 'L' | 'Q' | 'W' | 'Ws' | 'Wo' | 'G' | 'Pdw' | 'CC' | 'HN';

export interface ParamDef {
  /** Compact label for menus and on-canvas values (≤2 chars, Greek when needed). */
  short: string;
  /** Full description shown in tooltips / property titles. */
  title: string;
}

export interface ElementKindDef {
  code: ElementCode;
  label: string;
  nParams: number;
  params: ParamDef[];
}

export const ELEMENT_KINDS: ReadonlyMap<ElementKind, ElementKindDef> = new Map([
  [ElementKind.Resistor, {
    code: 'R', label: 'Resistor', nParams: 1,
    params: [{ short: 'R', title: 'R — resistance (Ω)' }],
  }],
  [ElementKind.Capacitor, {
    code: 'C', label: 'Capacitor', nParams: 1,
    params: [{ short: 'C', title: 'C — capacitance (F)' }],
  }],
  [ElementKind.Inductor, {
    code: 'L', label: 'Inductor', nParams: 1,
    params: [{ short: 'L', title: 'L — inductance (H)' }],
  }],
  [ElementKind.Cpe, {
    code: 'Q', label: 'CPE', nParams: 2,
    params: [
      { short: 'Q₀', title: 'Q₀ — CPE magnitude (S·sⁿ)' },
      { short: 'n', title: 'n — CPE exponent' },
    ],
  }],
  [ElementKind.WarburgInfinite, {
    code: 'W', label: 'Warburg (infinite)', nParams: 1,
    params: [{ short: 'σ', title: 'σ — Warburg coefficient (Ω·s⁻½)' }],
  }],
  [ElementKind.WarburgShort, {
    code: 'Ws', label: 'Warburg (short)', nParams: 2,
    params: [
      { short: 'Y₀', title: 'Y₀ — admittance scale (S·s½)' },
      { short: 'B', title: 'B — time scale (s½)' },
    ],
  }],
  [ElementKind.WarburgOpen, {
    code: 'Wo', label: 'Warburg (open)', nParams: 2,
    params: [
      { short: 'Y₀', title: 'Y₀ — admittance scale (S·s½)' },
      { short: 'B', title: 'B — time scale (s½)' },
    ],
  }],
  [ElementKind.Gerischer, {
    code: 'G', label: 'Gerischer', nParams: 2,
    params: [
      { short: 'Y₀', title: 'Y₀ — admittance scale (S·s½)' },
      { short: 'K', title: 'K — reaction rate (s⁻¹)' },
    ],
  }],
  [ElementKind.ParallelDiffusionWarburg, {
    code: 'Pdw', label: 'Parallel Diffusion Warburg', nParams: 4,
    params: [
      { short: 'D1', title: 'D1 — diffusion coefficient (cm²/s)' },
      { short: 'D2', title: 'D2 — diffusion coefficient (cm²/s)' },
      { short: 'θ', title: 'θ — branch fraction' },
      { short: 'Λ', title: 'Λ — molar concentration (mol/cm³)' },
    ],
  }],
  [ElementKind.ColeCole, {
    code: 'CC', label: 'Cole-Cole', nParams: 3,
    params: [
      { short: 'R', title: 'R — resistance (Ω)' },
      { short: 'τ', title: 'τ — relaxation time (s)' },
      { short: 'α', title: 'α — dispersion exponent' },
    ],
  }],
  [ElementKind.HavriliakNegami, {
    code: 'HN', label: 'Havriliak-Negami', nParams: 4,
    params: [
      { short: 'R', title: 'R — resistance (Ω)' },
      { short: 'τ', title: 'τ — relaxation time (s)' },
      { short: 'α', title: 'α — asymmetric broadening exponent' },
      { short: 'β', title: 'β — symmetric broadening exponent' },
    ],
  }],
]);

export interface ElementSlot {
  kind: ElementKind;
  id: number;
  paramOffset: number;
}

export interface SeriesNode {
  type: 'series';
  children: CircuitNode[];
}

export interface ParallelNode {
  type: 'parallel';
  children: CircuitNode[];
}

export type CircuitNode =
  | {
      type: 'element';
      kind: ElementKind;
      id: number;
      paramOffset: number;
      /** Visual-editor parameter overrides. */
      params?: number[];
      /** Values parsed from inline `{...}` / `[...]` in the current DSL. */
      embedded?: (number | null)[];
      /** Source span in the DSL string (byte offsets). */
      span?: { start: number; end: number };
      kindIds?: Partial<Record<ElementKind, number>>;
    }
  | SeriesNode
  | ParallelNode;

export function elementKindFromCode(code: string): ElementKind | null {
  if (code === 'R') return ElementKind.Resistor;
  if (code === 'C') return ElementKind.Capacitor;
  if (code === 'L') return ElementKind.Inductor;
  if (code === 'Q') return ElementKind.Cpe;
  if (code === 'W') return ElementKind.WarburgInfinite;
  if (code === 'Ws') return ElementKind.WarburgShort;
  if (code === 'Wo') return ElementKind.WarburgOpen;
  if (code === 'G') return ElementKind.Gerischer;
  if (code === 'Pdw') return ElementKind.ParallelDiffusionWarburg;
  if (code === 'CC') return ElementKind.ColeCole;
  if (code === 'HN') return ElementKind.HavriliakNegami;
  return null;
}

export function elementKindToCode(kind: ElementKind): ElementCode {
  return kind as string as ElementCode;
}

export function createElement(kind: ElementKind, id: number, paramOffset: number, params?: number[]): CircuitNode {
  return { type: 'element', kind, id, paramOffset, params };
}

export function createSeries(children: CircuitNode[]): CircuitNode {
  if (children.length === 1) return children[0];
  return { type: 'series', children };
}

export function createParallel(children: CircuitNode[]): CircuitNode {
  if (children.length === 1) return children[0];
  return { type: 'parallel', children };
}

export function nodeParameterCount(node: CircuitNode): number {
  switch (node.type) {
    case 'element':
      return node.paramOffset + nParams(node.kind);
    case 'series':
    case 'parallel':
      return Math.max(0, ...node.children.map(nodeParameterCount));
  }
}

export function nParams(kind: ElementKind): number {
  switch (kind) {
    case ElementKind.Resistor:
    case ElementKind.Capacitor:
    case ElementKind.Inductor:
    case ElementKind.WarburgInfinite:
      return 1;
    case ElementKind.Cpe:
    case ElementKind.WarburgShort:
    case ElementKind.WarburgOpen:
    case ElementKind.Gerischer:
      return 2;
    case ElementKind.ParallelDiffusionWarburg:
      return 4;
    case ElementKind.ColeCole:
      return 3;
    case ElementKind.HavriliakNegami:
      return 4;
  }
}

export function traverseNodes(
  node: CircuitNode,
  visitor: (node: CircuitNode, depth: number) => void,
  depth = 0,
): void {
  visitor(node, depth);
  if (node.type === 'series' || node.type === 'parallel') {
    for (const child of node.children) {
      traverseNodes(child, visitor, depth + 1);
    }
  }
}

export function cloneNode(node: CircuitNode): CircuitNode {
  switch (node.type) {
    case 'element':
      return { ...node };
    case 'series':
      return { type: 'series', children: node.children.map(cloneNode) };
    case 'parallel':
      return { type: 'parallel', children: node.children.map(cloneNode) };
  }
}