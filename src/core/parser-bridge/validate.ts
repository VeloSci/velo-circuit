import type { CircuitNode } from '../domain/circuit.js';
import type { ValidationResult, ValidationIssue } from '../domain/validation.js';
import { ELEMENT_KINDS, nParams, traverseNodes } from '../domain/circuit.js';
import { ElementRegistry } from './element-registry.js';
import { invalidParameterReason } from './physical.js';

export interface ValidateOptions {
  /** Promote warnings to errors. */
  strict?: boolean;
  /**
   * `editor` skips expensive topology scans during typing.
   * `full` (default) runs all checks for simulate/export.
   */
  mode?: 'editor' | 'full';
}

/**
 * Comprehensive circuit validator aligned with velo-spectroz-circuits.
 */
export function validate(ast: CircuitNode, options?: ValidateOptions): ValidationResult {
  const issues: ValidationIssue[] = [];

  let elementCount = 0;
  traverseNodes(ast, (node) => {
    if (node.type === 'element') elementCount++;
  });

  if (elementCount === 0) {
    issues.push({
      type: 'error',
      kind: 'empty-circuit',
      message: 'Circuit has no elements. Add at least one element (R, C, L, Q, W, Ws, Wo, G, Pdw, CC, HN).',
    });
    return buildResult(issues, options);
  }

  if (elementCount === 1 && ast.type === 'element') {
    issues.push({
      type: 'warning',
      kind: 'single-element-circuit',
      message: 'Circuit consists of a single element. Consider adding more elements for a meaningful circuit.',
    });
  }

  validateStructure(ast, issues, 'root');
  validateDuplicateIds(ast, issues);
  validateElementParameters(ast, issues);

  if (options?.mode !== 'editor') {
    validateDcPath(ast, issues);
    validateConflictingReactive(ast, issues);
  }

  return buildResult(issues, options);
}

export function validateParameterValues(
  ast: CircuitNode,
  params: number[],
  options?: ValidateOptions,
): ValidationResult {
  const registry = ElementRegistry.fromCircuit(ast);
  const issues: ValidationIssue[] = [...validate(ast, options).issues];

  if (params.length !== registry.totalParams()) {
    issues.push({
      type: 'error',
      kind: 'parameter-count',
      message: `Parameter count mismatch: expected ${registry.totalParams()}, found ${params.length}.`,
    });
    return buildResult(issues, options);
  }

  for (const entry of registry.entriesList()) {
    const slice = params.slice(entry.paramOffset, entry.paramOffset + entry.nParams);
    const reason = invalidParameterReason(entry.kind as string, slice);
    if (reason) {
      issues.push({
        type: 'error',
        kind: 'invalid-parameters',
        message: `Invalid parameters for ${ELEMENT_KINDS.get(entry.kind)?.label ?? entry.kind} (${entry.kind}${entry.id}): ${reason}.`,
        elementKind: entry.kind,
        elementId: entry.id,
      });
    }
  }

  return buildResult(issues, options);
}

export function applyStrictMode(result: ValidationResult): ValidationResult {
  return buildResult(result.issues, { strict: true });
}

function validateStructure(node: CircuitNode, issues: ValidationIssue[], path: string): void {
  if (node.type === 'series') {
    if (node.children.length === 0) {
      issues.push({
        type: 'error',
        kind: 'empty-series',
        message: `Empty series group at ${path}. Series must contain at least one element.`,
        path,
      });
      return;
    }
    for (let i = 0; i < node.children.length; i++) {
      validateStructure(node.children[i], issues, `${path}.series[${i}]`);
    }
  }

  if (node.type === 'parallel') {
    if (node.children.length === 0) {
      issues.push({
        type: 'error',
        kind: 'empty-parallel',
        message: `Empty parallel group at ${path}. Parallel must contain at least 2 branches.`,
        path,
      });
      return;
    }
    if (node.children.length === 1) {
      issues.push({
        type: 'error',
        kind: 'single-branch-parallel',
        message: `Parallel group at ${path} has only 1 branch. Parallel requires at least 2 branches.`,
        path,
      });
    }
    for (let i = 0; i < node.children.length; i++) {
      validateStructure(node.children[i], issues, `${path}.parallel[${i}]`);
    }
  }
}

function validateElementParameters(ast: CircuitNode, issues: ValidationIssue[]): void {
  traverseNodes(ast, (node) => {
    if (node.type !== 'element' || !node.params) return;

    const expected = nParams(node.kind);
    if (node.params.length !== expected) {
      issues.push({
        type: 'error',
        kind: 'parameter-count',
        message: `Element ${node.kind}${node.id} expects ${expected} parameter(s), found ${node.params.length}.`,
        elementKind: node.kind,
        elementId: node.id,
      });
      return;
    }

    const reason = invalidParameterReason(node.kind as string, node.params);
    if (reason) {
      issues.push({
        type: 'error',
        kind: 'invalid-parameters',
        message: `Invalid parameters for ${ELEMENT_KINDS.get(node.kind)?.label ?? node.kind}: ${reason}.`,
        elementKind: node.kind,
        elementId: node.id,
      });
    }
  });
}

function validateDuplicateIds(ast: CircuitNode, issues: ValidationIssue[]): void {
  const seen = new Map<string, { count: number }>();

  traverseNodes(ast, (node) => {
    if (node.type !== 'element') return;

    const key = `${node.kind}-${node.id}`;
    const existing = seen.get(key);

    if (existing) {
      existing.count++;
      if (existing.count === 2) {
        issues.push({
          type: 'error',
          kind: 'duplicate-id',
          message: `Element ${node.kind}${node.id} appears more than once. Each element must have a unique identifier.`,
          elementKind: node.kind,
          elementId: node.id,
        });
      }
    } else {
      seen.set(key, { count: 1 });
    }
  });
}

function validateDcPath(ast: CircuitNode, issues: ValidationIssue[]): void {
  let hasResistive = false;
  let hasReactive = false;

  traverseNodes(ast, (node) => {
    if (node.type !== 'element') return;

    const kind = node.kind as string;
    if (kind === 'R' || kind === 'W' || kind === 'Ws' || kind === 'Wo' || kind === 'CC' || kind === 'HN') {
      hasResistive = true;
    } else {
      hasReactive = true;
    }
  });

  if (!hasResistive && hasReactive) {
    issues.push({
      type: 'warning',
      kind: 'no-dc-path',
      message: 'Circuit has no DC path (R, W, Ws, Wo, CC, or HN). This circuit may be unphysical at DC (ω→0).',
    });
    issues.push({
      type: 'warning',
      kind: 'purely-reactive',
      message: 'Circuit contains only reactive or diffusion elements. Consider adding a resistor for physical validity.',
    });
  }
}

function validateConflictingReactive(ast: CircuitNode, issues: ValidationIssue[]): void {
  traverseNodes(ast, (node) => {
    if (node.type !== 'parallel') return;

    const kinds = new Set<string>();
    for (const child of node.children) {
      if (child.type === 'element') kinds.add(child.kind as string);
    }

    const hasWarburg = kinds.has('W') || kinds.has('Ws') || kinds.has('Wo') || kinds.has('Pdw');
    const hasInductor = kinds.has('L');

    if (hasWarburg && hasInductor) {
      issues.push({
        type: 'warning',
        kind: 'warburg-inductor-parallel',
        message: 'Warburg element in parallel with inductor may produce non-physical impedance behavior.',
      });
    }
  });
}

function buildResult(issues: ValidationIssue[], options?: ValidateOptions): ValidationResult {
  const finalIssues: ValidationIssue[] = options?.strict
    ? issues.map(i =>
      i.type === 'warning'
        ? { type: 'error' as const, kind: 'invalid-parameters' as const, message: i.message, path: i.path, position: i.position }
        : i,
    )
    : issues;

  return {
    issues: finalIssues,
    hasErrors: finalIssues.some(i => i.type === 'error'),
    hasWarnings: finalIssues.some(i => i.type === 'warning'),
  };
}

export { invalidParameterReason } from './physical.js';
