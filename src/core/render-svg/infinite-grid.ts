import type { RenderTheme } from './symbols.js';

export interface InfiniteGridOptions {
  /** World-space grid step in px. */
  step?: number;
  /** Extra margin around visible area (world units). */
  margin?: number;
}

/**
 * Build an SVG grid layer in world coordinates.
 * Lines extend to cover the visible viewport after pan/zoom transform.
 */
export function buildInfiniteGridLayer(
  viewportWidth: number,
  viewportHeight: number,
  panX: number,
  panY: number,
  zoom: number,
  theme: RenderTheme,
  options?: InfiniteGridOptions,
): string {
  const step = options?.step ?? 20;
  const margin = options?.margin ?? step * 2;
  const scaledStep = step;

  // Visible world bounds from screen corners
  const worldLeft = (-panX) / zoom - margin;
  const worldTop = (-panY) / zoom - margin;
  const worldRight = (viewportWidth - panX) / zoom + margin;
  const worldBottom = (viewportHeight - panY) / zoom + margin;

  const startX = Math.floor(worldLeft / scaledStep) * scaledStep;
  const startY = Math.floor(worldTop / scaledStep) * scaledStep;

  const lines: string[] = [];
  const gridColor = theme.colors.grid;

  for (let x = startX; x <= worldRight; x += scaledStep) {
    lines.push(
      `<line x1="${x}" y1="${worldTop}" x2="${x}" y2="${worldBottom}" stroke="${gridColor}" stroke-width="0.5" vector-effect="non-scaling-stroke" opacity="0.45"/>`,
    );
  }
  for (let y = startY; y <= worldBottom; y += scaledStep) {
    lines.push(
      `<line x1="${worldLeft}" y1="${y}" x2="${worldRight}" y2="${y}" stroke="${gridColor}" stroke-width="0.5" vector-effect="non-scaling-stroke" opacity="0.45"/>`,
    );
  }

  // Dot at origin
  lines.push(`<circle cx="0" cy="0" r="2" fill="${gridColor}" opacity="0.6"/>`);

  return `<g id="grid-layer" class="layer-grid" pointer-events="none">${lines.join('')}</g>`;
}

export function buildEditorSvgShell(
  viewportWidth: number,
  viewportHeight: number,
  theme: RenderTheme,
): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${viewportWidth}" height="${viewportHeight}" class="circuit-editor-root" overflow="hidden">
  <style>
    .circuit-node { cursor: pointer; }
    .circuit-node:hover .node-bg { stroke: ${theme.colors.highlight}; stroke-width: 2; }
    .circuit-connection { transition: stroke 0.15s; }
    .circuit-connection:hover { stroke: ${theme.colors.highlight}; stroke-width: 2; }
    .circuit-junction { pointer-events: none; }
    .node-error .node-bg { stroke: ${theme.colors.error}; stroke-width: 2; }
    .param-edit-input { font: 10px monospace; border: 1px solid ${theme.colors.highlight}; border-radius: 2px; padding: 1px 3px; width: 100%; box-sizing: border-box; background: ${theme.colors.fill}; color: ${theme.colors.text}; }
    .param-edit-input.invalid { border-color: ${theme.colors.error}; }
  </style>
  <g id="viewport">
    <g id="grid-layer"></g>
    <g id="content-layer">
      <g id="connections"></g>
      <g id="nodes"></g>
    </g>
    <g id="overlay-layer"></g>
    <g id="param-edit-layer"></g>
  </g>
</svg>`.trim();
}
