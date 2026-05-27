import type { CircuitNode } from '../domain/circuit.js';
import { serialize } from '../parser-bridge/serializer.js';
import { renderDslPreviewSvg } from '../render-svg/renderer-ex.js';
import type { ThemeMode } from '../render-svg/themes.js';

export interface DownloadCircuitSvgOptions {
  /** Default `light`. Use dark only when the user opts in. */
  themeMode?: ThemeMode;
  showParams?: boolean;
}

/** Standalone SVG for file download: transparent background, no grid, light theme by default. */
export function buildDownloadCircuitSvg(dsl: string, options: DownloadCircuitSvgOptions = {}): string {
  return renderDslPreviewSvg(dsl, {
    themeMode: options.themeMode ?? 'light',
    showParams: options.showParams ?? true,
    showGrid: false,
    colorMode: 'multicolor',
  });
}

export function serializeAstForExport(ast: CircuitNode, showParams: boolean): string {
  return serialize(ast, { showParams });
}
