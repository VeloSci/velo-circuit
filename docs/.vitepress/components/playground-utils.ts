/** Shared helpers for VitePress playground previews (SVG-first editor). */

export function findPlaygroundSvg(root: ParentNode | null | undefined): SVGSVGElement | null {
  if (!root) return null;
  return root.querySelector('svg.circuit-editor-root, svg.circuit-editor, svg.circuit-grid-root');
}

export function copyPlaygroundSvg(root: ParentNode | null | undefined): boolean {
  const svg = findPlaygroundSvg(root);
  if (!svg) return false;
  return navigator.clipboard.writeText(svg.outerHTML).then(() => true).catch(() => false);
}

export const defaultMountHeight = 520;
