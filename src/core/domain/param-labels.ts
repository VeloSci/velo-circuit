import type { ElementKind } from './circuit.js';
import { ELEMENT_KINDS } from './circuit.js';

export type { ParamDef } from './circuit.js';

export function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

export function getParamDef(kind: ElementKind, index: number) {
  return ELEMENT_KINDS.get(kind)?.params[index];
}

export function paramShortLabel(kind: ElementKind, index: number): string {
  return getParamDef(kind, index)?.short ?? `p${index}`;
}

export function paramTitle(kind: ElementKind, index: number): string {
  return getParamDef(kind, index)?.title ?? `Parameter ${index + 1}`;
}
