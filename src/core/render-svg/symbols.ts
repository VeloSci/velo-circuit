import type { CircuitNode, ElementKind } from '../domain/circuit.js';
import { ELEMENT_KINDS } from '../domain/circuit.js';

export interface ThemeColors {
  stroke: string;
  fill: string;
  text: string;
  highlight: string;
  error: string;
  warning: string;
  grid: string;
}

export interface RenderTheme {
  colors: ThemeColors;
  strokeWidth: number;
  fontSize: number;
  fontFamily: string;
  elementWidth: number;
  elementHeight: number;
}

/** Canonical stroke width for symbols and connections. */
export const SYMBOL_STROKE_WIDTH = 2;

export const DEFAULT_THEME: RenderTheme = {
  colors: {
    stroke: 'var(--ce-text, #1a1a2e)',
    fill: 'var(--ce-surface, #ffffff)',
    text: 'var(--ce-text, #16213e)',
    highlight: 'var(--ce-accent, #4cc9f0)',
    error: 'var(--ce-error, #e63946)',
    warning: 'var(--ce-warn, #f4a261)',
    grid: 'var(--ce-border, #e0e0e0)',
  },
  strokeWidth: SYMBOL_STROKE_WIDTH,
  fontSize: 12,
  fontFamily: 'monospace',
  elementWidth: 80,
  elementHeight: 40,
};

/** Horizontal lead: left terminal → body. */
const L = 12;
/** Horizontal lead: body → right terminal. */
const R = 68;
/** Left diffusion electrode (Warburg family). */
const WB = 20;
/** Diffusion front / right hub x. */
const WE = 54;
/** Cole–Cole / HN arc span. */
const ARC_L = 20;
const ARC_R = 60;

/**
 * W — semi-infinite: bar + diagonal only (no end cap).
 * Trace: lead → bar → diagonal tip → drop to rail → lead.
 */
const W_PATH = `M0,20 L${WB},20 L${WB},32 L${WE},10 L${WE},20 L80,20`;

/**
 * Ws — finite transmissive: same spine + closing vertical at the diffusion front.
 */
const WS_PATH = `M0,20 L${WB},20 L${WB},32 L${WE},10 L${WE},32 L${WE},20 L80,20`;

/**
 * Wo — finite reflecting: spine + open-end horizontal bars (no closing vertical).
 */
const WO_PATH =
  `M0,20 L${WB},20 L${WB},32 L${WE},10 L${WE + 8},10 M${WE - 8},32 L${WE + 8},32 M${WE},20 L80,20`;

/** G — diffusion diagonal + small reaction hook at the front. */
const G_PATH = `M0,20 L${WB},20 L${WB},32 L48,12 L58,12 L58,20 L80,20`;

/** Pdw — symmetric Y-fork (dual diffusion paths) meeting at the right hub. */
const PDW_PATH =
  `M0,20 L${WB},20 L${WB},12 L28,12 L${WE},8 L${R},12 L${R},20 L80,20 M${WB},20 L${WB},28 L28,28 L${WE},32 L${R},28 L${R},20`;

/** CC — single dispersion arc above the rail. */
const CC_PATH = `M0,20 L${ARC_L},20 A20,14 0 0 1 ${ARC_R},20 L80,20`;

/** HN — nested dispersion arcs (wider + tighter). */
const HN_OUTER = `M0,20 L${ARC_L},20 A20,14 0 0 1 ${ARC_R},20 L80,20`;
const HN_INNER = `M26,23 A14,8 0 0 1 54,23`;

/**
 * Standard electrical schematic symbols as SVG.
 * All symbols fit within 80×40 with terminals at (0,20) and (80,20).
 */
export function buildSvgElementSymbol(kind: ElementKind, theme: RenderTheme): string {
  const label = ELEMENT_KINDS.get(kind)?.label ?? String(kind);
  const { strokeWidth, fontSize, fontFamily, colors } = theme;
  const sw = strokeWidth;
  const plate = sw * 1.25;
  const anno = fontSize * 0.65;
  const kindStroke = `var(--ce-${kind}-stroke, ${colors.stroke})`;
  const strokeRound = `stroke="${kindStroke}" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
  const strokeSw = `${strokeRound} stroke-width="${sw}"`;
  const strokePlate = `${strokeRound} stroke-width="${plate}"`;

  switch (kind) {
    case 'R' as ElementKind: {
      const points = `0,20 ${L},20 17,8 23,32 29,8 35,32 41,8 47,32 53,8 59,32 ${R},20 80,20`;
      return `<g><polyline points="${points}" ${strokeSw} /></g>`;
    }

    case 'C' as ElementKind: {
      const pL = 36;
      const pR = 44;
      return `<g>
        <line x1="0" y1="20" x2="${pL}" y2="20" ${strokeSw} />
        <line x1="${pL}" y1="6" x2="${pL}" y2="34" ${strokePlate} />
        <line x1="${pR}" y1="6" x2="${pR}" y2="34" ${strokePlate} />
        <line x1="${pR}" y1="20" x2="80" y2="20" ${strokeSw} />
      </g>`;
    }

    case 'L' as ElementKind: {
      return `<g><path d="M0,20 L${L},20 A6,6 0 0 1 28,20 A6,6 0 0 1 40,20 A6,6 0 0 1 52,20 A6,6 0 0 1 ${R},20 L80,20" ${strokeSw} /></g>`;
    }

    case 'Q' as ElementKind: {
      const pL = 36;
      const pR = 44;
      return `<g>
        <line x1="0" y1="20" x2="${pL}" y2="20" ${strokeSw} />
        <line x1="${pL}" y1="6" x2="${pL}" y2="34" ${strokePlate} />
        <line x1="${pR}" y1="10" x2="40" y2="30" ${strokePlate} />
        <line x1="${pR}" y1="20" x2="80" y2="20" ${strokeSw} />
        <text x="40" y="4" text-anchor="middle" font-size="${anno}" font-family="${fontFamily}" fill="${kindStroke}" font-style="italic">n</text>
      </g>`;
    }

    case 'W' as ElementKind: {
      return `<g><path d="${W_PATH}" ${strokeSw} /></g>`;
    }

    case 'Ws' as ElementKind: {
      return `<g>
        <path d="${WS_PATH}" ${strokeSw} />
        <text x="39" y="38" text-anchor="middle" font-size="${anno}" font-family="${fontFamily}" fill="${kindStroke}">s</text>
      </g>`;
    }

    case 'Wo' as ElementKind: {
      return `<g>
        <path d="${WO_PATH}" ${strokeSw} />
        <text x="39" y="38" text-anchor="middle" font-size="${anno}" font-family="${fontFamily}" fill="${kindStroke}">o</text>
      </g>`;
    }

    case 'G' as ElementKind: {
      return `<g><path d="${G_PATH}" ${strokeSw} /></g>`;
    }

    case 'Pdw' as ElementKind: {
      return `<g><path d="${PDW_PATH}" ${strokeSw} /></g>`;
    }

    case 'CC' as ElementKind: {
      return `<g>
        <path d="${CC_PATH}" ${strokeSw} />
        <text x="40" y="36" text-anchor="middle" font-size="${anno}" font-family="${fontFamily}" fill="${kindStroke}">α</text>
      </g>`;
    }

    case 'HN' as ElementKind: {
      return `<g>
        <path d="${HN_OUTER}" ${strokeSw} />
        <path d="${HN_INNER}" ${strokeSw} />
        <text x="40" y="36" text-anchor="middle" font-size="${anno}" font-family="${fontFamily}" fill="${kindStroke}">α,β</text>
      </g>`;
    }

    default: {
      return `<g>
        <line x1="0" y1="20" x2="${L}" y2="20" ${strokeSw} />
        <rect x="${L}" y="10" width="${R - L}" height="20" ${strokeSw} rx="2" />
        <text x="40" y="24" text-anchor="middle" font-size="${fontSize * 0.7}" font-family="${fontFamily}" fill="${kindStroke}">${label}</text>
        <line x1="${R}" y1="20" x2="80" y2="20" ${strokeSw} />
      </g>`;
    }
  }
}

/** Junction dot used at parallel branch points */
export function buildJunctionDot(x: number, y: number, theme: RenderTheme): string {
  return `<circle cx="${x}" cy="${y}" r="3" fill="${theme.colors.stroke}" />`;
}

export function buildParallelSymbol(theme: RenderTheme): string {
  const { strokeWidth, colors } = theme;
  const sw = strokeWidth;
  return `<g>
    <line x1="0" y1="20" x2="16" y2="20" stroke="${colors.stroke}" stroke-width="${sw}" />
    <line x1="16" y1="6" x2="16" y2="34" stroke="${colors.stroke}" stroke-width="${sw}" />
    <line x1="16" y1="12" x2="64" y2="12" stroke="${colors.stroke}" stroke-width="${sw}" stroke-dasharray="4,2" />
    <line x1="16" y1="28" x2="64" y2="28" stroke="${colors.stroke}" stroke-width="${sw}" stroke-dasharray="4,2" />
    <line x1="64" y1="6" x2="64" y2="34" stroke="${colors.stroke}" stroke-width="${sw}" />
    <line x1="64" y1="20" x2="80" y2="20" stroke="${colors.stroke}" stroke-width="${sw}" />
    <text x="40" y="23" text-anchor="middle" font-size="10" font-family="monospace" fill="${colors.text}">∥</text>
  </g>`;
}

export function buildSeriesSymbol(theme: RenderTheme): string {
  const { strokeWidth, colors } = theme;
  return `<g>
    <line x1="0" y1="20" x2="80" y2="20" stroke="${colors.stroke}" stroke-width="${strokeWidth}" />
    <text x="40" y="23" text-anchor="middle" font-size="10" font-family="monospace" fill="${colors.text}">—</text>
  </g>`;
}
