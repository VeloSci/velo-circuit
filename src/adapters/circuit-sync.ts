import type { CircuitNode } from '../core/domain/circuit.js';
import { parseBoukamp } from '../core/parser-bridge/parser.js';
import type { ThemeMode } from '../core/render-svg/themes.js';

/**
 * Bidirectional DSL sync without feedback loops (editor ↔ CodeMirror ↔ controlled value).
 */
export class CircuitSyncLock {
  private depth = 0;

  run<T>(fn: () => T): T {
    this.depth++;
    try {
      return fn();
    } finally {
      this.depth--;
    }
  }

  get active(): boolean {
    return this.depth > 0;
  }
}

export function parseAstForDsl(dsl: string): CircuitNode | null {
  const result = parseBoukamp(dsl);
  if (result && typeof result === 'object' && 'type' in result) {
    const t = (result as { type: string }).type;
    if (t === 'lex' || t === 'parse') return null;
  }
  return result as CircuitNode;
}

export type { ThemeMode };
