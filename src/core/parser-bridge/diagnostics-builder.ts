import type { CircuitNode } from '../domain/circuit.js';
import type { Diagnostic } from '../domain/diagnostics.js';
import type { ValidationIssue, ValidationResult } from '../domain/validation.js';
import { makeDiagnostic } from '../domain/diagnostics.js';
import { resolveCircuitParams, type MissingElementParams } from './resolve-params.js';
import { validate } from './validate.js';

let diagCounter = 0;

function nextDiagId(): string {
  diagCounter += 1;
  return `diag-${diagCounter}`;
}

export function missingToIssues(missing: MissingElementParams[]): ValidationIssue[] {
  return missing.map(m => ({
    type: 'error' as const,
    kind: 'missing-params',
    message: `${m.kind}${m.id}: missing ${m.missingLabels.join(', ')}`,
    elementKind: m.kind,
    elementId: m.id,
  }));
}

export function issuesToDiagnostics(ast: CircuitNode, issues: ValidationIssue[]): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const issue of issues) {
    if (issue.type !== 'error') continue;

    let startOffset = issue.position ?? 0;
    let endOffset = startOffset + 1;
    let nodeId: string | undefined;

    if (issue.elementKind != null && issue.elementId != null) {
      nodeId = `${issue.elementKind}${issue.elementId}`;
      const span = findElementSpan(ast, nodeId);
      if (span) {
        startOffset = span.start;
        endOffset = span.end;
      }
    }

    diagnostics.push(makeDiagnostic(nextDiagId(), issue, startOffset, endOffset, nodeId));
  }

  return diagnostics;
}

function findElementSpan(ast: CircuitNode, id: string): { start: number; end: number } | null {
  let found: { start: number; end: number } | null = null;
  traverseElementSpans(ast, node => {
    if (node.type === 'element' && `${node.kind}${node.id}` === id && node.span) {
      found = node.span;
    }
  });
  return found;
}

function traverseElementSpans(node: CircuitNode, visit: (n: CircuitNode) => void): void {
  visit(node);
  if (node.type === 'series' || node.type === 'parallel') {
    for (const child of node.children) traverseElementSpans(child, visit);
  }
}

export function buildAstDiagnostics(
  ast: CircuitNode,
  external?: number[],
): ValidationResult & { diagnostics: Diagnostic[] } {
  const base = validate(ast);
  const resolved = resolveCircuitParams(ast, { external });
  const missingIssues = resolved.ok ? [] : missingToIssues(resolved.missing);
  const issues = [...base.issues, ...missingIssues];
  const diagnostics = issuesToDiagnostics(ast, issues);
  return {
    issues,
    diagnostics,
    hasErrors: issues.some(i => i.type === 'error'),
    hasWarnings: issues.some(i => i.type === 'warning'),
  };
}
