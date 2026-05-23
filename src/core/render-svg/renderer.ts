import type { EditableGraph, ElementNode, Connection } from '../domain/graph.js';
import { getJunctionHub } from '../domain/graph.js';
import type { CircuitNode, ElementKind } from '../domain/circuit.js';
import { ELEMENT_KINDS } from '../domain/circuit.js';
import type { ViewportState } from '../domain/document.js';
import { paramShortLabel } from '../domain/param-labels.js';
import { buildSvgElementSymbol, buildParallelSymbol, buildSeriesSymbol, DEFAULT_THEME, type RenderTheme } from './symbols.js';
import { parseBoukamp } from '../parser-bridge/index.js';
import { buildLayout } from '../layout/index.js';
import { invalidParameterReason } from '../parser-bridge/physical.js';

export type ConnectionStyle = 'curved' | 'orthogonal';

export interface SvgRenderOptions {
  theme?: RenderTheme;
  /** Static docs/thumbnail render — no selection chrome, transparent bg */
  preview?: boolean;
  /** Wire routing between elements. Default: curved (matches the editor). */
  connectionStyle?: ConnectionStyle;
  showGrid?: boolean;
  showLabels?: boolean;
  showParams?: boolean;
  selectedNodeIds?: Set<string>;
  invalidElementIds?: Set<string>;
  width?: number | string;
  height?: number | string;
  viewBox?: string;
}

export interface CircuitLayerContent {
  connections: string;
  nodes: string;
}

function buildConnectionPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  style: ConnectionStyle = 'curved',
): string {
  const dy = Math.abs(to.y - from.y);
  if (dy < 2) {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }
  const midX = (from.x + to.x) / 2;
  if (style === 'orthogonal') {
    return `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`;
  }
  return `M ${from.x} ${from.y} C ${midX} ${from.y} ${midX} ${to.y} ${to.x} ${to.y}`;
}

function isJunctionNode(node: ElementNode): boolean {
  return node.circuitNode.type === 'parallel' &&
    (node.circuitNode as { children?: unknown[] }).children?.length === 0;
}

function formatParamLabel(kind: ElementKind, params: number[]): string {
  const def = ELEMENT_KINDS.get(kind);
  if (!def) return params.join(',');
  return params.map((v, i) => {
    const name = paramShortLabel(kind, i);
    return `${name}=${v}`;
  }).join(',');
}

function buildNodeElement(
  node: ElementNode,
  graph: EditableGraph,
  theme: RenderTheme,
  isSelected: boolean,
  isInvalid: boolean,
  showParams: boolean,
  preview: boolean,
  showLabels: boolean,
): string {
  const x = node.visualX;
  const y = node.visualY;
  const w = node.width;
  const h = node.height;

  if (isJunctionNode(node)) {
    const hub = getJunctionHub(node, graph);
    return `<g id="${node.nodeId}" class="circuit-junction" data-node-id="${node.nodeId}">
      <circle cx="${hub.x}" cy="${hub.y}" r="3" fill="${theme.colors.stroke}" />
    </g>`;
  }

  const circuit = node.circuitNode;
  let innerSvg = '';

  if (circuit.type === 'element') {
    innerSvg = buildSvgElementSymbol(circuit.kind, theme);
  } else if (circuit.type === 'parallel') {
    innerSvg = buildParallelSymbol(theme);
  } else if (circuit.type === 'series') {
    innerSvg = buildSeriesSymbol(theme);
  }

  const label = circuit.type === 'element' ? `${circuit.kind}${circuit.id}` : '';
  const elementIdAttr = label ? ` data-element-id="${label}"` : '';
  const kindAttr = circuit.type === 'element' ? ` data-kind="${circuit.kind}"` : '';
  const errorClass = isInvalid ? ' node-error' : '';

  let paramLabel = '';
  if (showParams && circuit.type === 'element' && circuit.params && circuit.params.length > 0) {
    paramLabel = formatParamLabel(circuit.kind, circuit.params);
  }

  const labelText = showLabels ? (paramLabel || label) : '';
  const labelY = h + 14;

  if (preview) {
    return `
    <g id="${node.nodeId}" transform="translate(${x}, ${y})" class="circuit-node${errorClass}" data-node-id="${node.nodeId}"${elementIdAttr}${kindAttr}>
      <svg width="${w}" height="${h}" viewBox="0 0 ${theme.elementWidth} ${theme.elementHeight}">
        ${innerSvg}
      </svg>
      ${labelText ? `<text class="node-label" x="${w / 2}" y="${labelY}" text-anchor="middle" font-size="${theme.fontSize}" font-family="${theme.fontFamily}" fill="${theme.colors.text}">${labelText}</text>` : ''}
    </g>
  `;
  }

  const selectionStroke = isInvalid ? theme.colors.error : (isSelected ? theme.colors.highlight : 'transparent');
  const selectionWidth = (isSelected || isInvalid) ? theme.strokeWidth * 2 : 0;

  return `
    <g id="${node.nodeId}" transform="translate(${x}, ${y})" class="circuit-node${errorClass}" data-node-id="${node.nodeId}"${elementIdAttr}${kindAttr}>
      <rect class="node-hit" x="-4" y="-4" width="${w + 8}" height="${h + 22}" fill="transparent" />
      <rect class="node-bg" x="-2" y="-2" width="${w + 4}" height="${h + 4}"
        fill="none" stroke="${selectionStroke}" stroke-width="${selectionWidth}"
        rx="6" vector-effect="non-scaling-stroke" />
      <svg width="${w}" height="${h}" viewBox="0 0 ${theme.elementWidth} ${theme.elementHeight}">
        ${innerSvg}
      </svg>
      ${labelText ? `<text class="node-label" x="${w / 2}" y="${labelY}" text-anchor="middle" font-size="${theme.fontSize}" font-family="${theme.fontFamily}" fill="${theme.colors.text}">${labelText}</text>` : ''}
    </g>
  `;
}

function buildConnectionElement(
  conn: Connection,
  graph: EditableGraph,
  theme: RenderTheme,
  connectionStyle: ConnectionStyle,
): string {
  const fromNode = graph.nodes.get(conn.fromNodeId);
  const toNode = graph.nodes.get(conn.toNodeId);
  if (!fromNode || !toNode) return '';

  const fromPort = fromNode.ports.find(p => p.id === conn.fromPortId);
  const toPort = toNode.ports.find(p => p.id === conn.toPortId);
  if (!fromPort || !toPort) return '';

  const path = buildConnectionPath(
    { x: fromPort.x, y: fromPort.y },
    { x: toPort.x, y: toPort.y },
    connectionStyle,
  );
  return `<path d="${path}" stroke="var(--ce-stroke, ${theme.colors.stroke})" stroke-width="${theme.strokeWidth}" fill="none" class="circuit-connection" vector-effect="non-scaling-stroke" data-from="${conn.fromNodeId}" data-to="${conn.toNodeId}" />`;
}

export function buildCircuitLayers(
  graph: EditableGraph,
  options: SvgRenderOptions,
): CircuitLayerContent {
  const theme = options.theme ?? DEFAULT_THEME;
  const preview = options.preview ?? false;
  const connectionStyle = options.connectionStyle ?? 'curved';
  const showLabels = options.showLabels !== false;
  const nodeElements: string[] = [];
  const connectionElements: string[] = [];

  for (const node of graph.nodes.values()) {
    const isSelected = options.selectedNodeIds?.has(node.nodeId) ?? false;
    const elementId = node.circuitNode.type === 'element'
      ? `${node.circuitNode.kind}${node.circuitNode.id}`
      : '';
    const isInvalid = elementId ? (options.invalidElementIds?.has(elementId) ?? false) : false;
    nodeElements.push(buildNodeElement(
      node,
      graph,
      theme,
      isSelected,
      isInvalid,
      options.showParams ?? false,
      preview,
      showLabels,
    ));
  }

  for (const conn of graph.connections) {
    connectionElements.push(buildConnectionElement(conn, graph, theme, connectionStyle));
  }

  return {
    connections: connectionElements.join(''),
    nodes: nodeElements.join(''),
  };
}

export function renderCircuit(
  graph: EditableGraph,
  _viewport: ViewportState,
  options: SvgRenderOptions,
): string {
  const theme = options.theme ?? DEFAULT_THEME;
  const preview = options.preview ?? false;
  const width = options.width ?? '100%';
  const height = options.height ?? '100%';
  const viewBoxAttr = options.viewBox ? ` viewBox="${options.viewBox}"` : '';
  const layers = buildCircuitLayers(graph, options);
  const rootClass = preview ? 'circuit-preview' : 'circuit-editor';

  if (preview) {
    return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"${viewBoxAttr} class="${rootClass}" overflow="visible">
  <g id="content-layer">
    <g id="connections">${layers.connections}</g>
    <g id="nodes">${layers.nodes}</g>
  </g>
</svg>`.trim();
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"${viewBoxAttr} class="${rootClass}" overflow="visible">
  <style>
    .circuit-node { cursor: pointer; }
    .circuit-node:hover .node-bg { stroke: ${theme.colors.highlight}; stroke-width: calc(var(--ce-stroke-width, ${theme.strokeWidth}) * 1.25); }
    .circuit-connection { transition: stroke 0.15s; }
    .circuit-connection:hover { stroke: ${theme.colors.highlight}; stroke-width: calc(var(--ce-stroke-width, ${theme.strokeWidth}) * 1.25); }
    .circuit-junction { pointer-events: none; }
    .node-error .node-bg { stroke: ${theme.colors.error}; stroke-width: calc(var(--ce-stroke-width, ${theme.strokeWidth}) * 1.25); }
  </style>
  <g id="viewport">
    <g id="content-layer">
      <g id="connections">${layers.connections}</g>
      <g id="nodes">${layers.nodes}</g>
    </g>
  </g>
</svg>`.trim();
}

export function collectInvalidElementIds(ast: CircuitNode): Set<string> {
  const invalid = new Set<string>();
  function walk(node: CircuitNode): void {
    if (node.type === 'element') {
      if (node.params) {
        const reason = invalidParameterReason(node.kind as string, node.params);
        if (reason) invalid.add(`${node.kind}${node.id}`);
      }
      return;
    }
    if (node.type === 'series' || node.type === 'parallel') {
      for (const child of node.children) walk(child);
    }
  }
  walk(ast);
  return invalid;
}

export function renderCircuitToElement(container: HTMLElement, svgString: string): void {
  container.innerHTML = svgString;
}

export function renderDslToSvg(dsl: string, options?: SvgRenderOptions): string {
  const ast = parseBoukamp(dsl);
  if ('type' in ast && (ast.type === 'lex' || ast.type === 'parse')) return '';

  const graph = buildLayout(ast as CircuitNode);
  const theme = options?.theme ?? DEFAULT_THEME;
  const preview = options?.preview ?? false;
  const showLabels = options?.showLabels !== false;
  const labelPad = showLabels ? theme.fontSize + 8 : 0;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const node of graph.nodes.values()) {
    minX = Math.min(minX, node.visualX);
    minY = Math.min(minY, node.visualY);
    maxX = Math.max(maxX, node.visualX + node.width);
    const nodeBottom = node.visualY + node.height + (
      showLabels && node.circuitNode.type === 'element' ? labelPad : 0
    );
    maxY = Math.max(maxY, nodeBottom);
  }

  if (minX === Infinity) {
    minX = 0; minY = 0; maxX = 100; maxY = 100;
  }

  const padding = preview ? 16 : 10;
  const viewBox = `${minX - padding} ${minY - padding} ${(maxX - minX) + padding * 2} ${(maxY - minY) + padding * 2}`;

  return renderCircuit(graph, { zoom: 1, panX: 0, panY: 0, width: 0, height: 0 }, {
    ...options,
    preview,
    viewBox,
  });
}

export function extractSvgString(graph: EditableGraph, viewport: ViewportState, options: Partial<SvgRenderOptions> = {}): string {
  return renderCircuit(graph, viewport, { ...options, width: options.width ?? viewport.width, height: options.height ?? viewport.height });
}
