import type { CircuitNode } from '../domain/circuit.js';
import type { ParseResult } from './parser.js';
import type { ValidationResult } from '../domain/validation.js';
import { parseBoukamp } from './parser.js';
import { serialize } from './serializer.js';
import { validate, validateParameterValues } from './validate.js';
import { ElementRegistry, parameterCount } from './element-registry.js';

export interface StrictOptions {
  strict?: boolean;
  blockInvalidSetValue?: boolean;
  validateParamsOnEdit?: boolean;
}

export interface ParseOutput {
  ast: CircuitNode;
  dsl: string;
  diagnostics: ValidationResult;
}

export interface CircuitParserAdapter {
  parse(dsl: string): ParseOutput | { error: ParseResult; diagnostics: ValidationResult };
  serialize(ast: CircuitNode, options?: { showParams?: boolean }): string;
  validate(ast: CircuitNode): ValidationResult;
  getOptions(): StrictOptions;
  setOptions(options: Partial<StrictOptions>): void;
}

export function createAdapter(initialOptions?: StrictOptions): CircuitParserAdapter {
  let options: StrictOptions = {
    strict: false,
    blockInvalidSetValue: false,
    validateParamsOnEdit: true,
    ...initialOptions,
  };

  return {
    getOptions() {
      return { ...options };
    },
    setOptions(partial: Partial<StrictOptions>) {
      options = { ...options, ...partial };
    },
    parse(dsl: string): ParseOutput | { error: ParseResult; diagnostics: ValidationResult } {
      const result = parseBoukamp(dsl);

      if ('type' in result && (result.type === 'lex' || result.type === 'parse')) {
        return {
          error: result,
          diagnostics: {
            issues: [{
              type: 'error',
              kind: 'syntax' as never,
              message: (result as { message: string }).message,
              position: (result as { position: number }).position,
            }],
            hasErrors: true,
            hasWarnings: false,
          },
        };
      }

      const ast = result as CircuitNode;
      const registry = ElementRegistry.fromCircuit(ast);
      const flatParams = registry.flatParamVector(ast);
      const diagnostics = flatParams.length > 0
        ? validateParameterValues(ast, flatParams, { strict: options.strict })
        : validate(ast, { strict: options.strict });

      if (options.blockInvalidSetValue && diagnostics.hasErrors) {
        return {
          error: {
            type: 'parse',
            position: 0,
            expected: 'valid circuit',
            found: dsl,
            message: diagnostics.issues.find(i => i.type === 'error')?.message ?? 'Validation failed',
          },
          diagnostics,
        };
      }

      return { ast, dsl, diagnostics };
    },
    serialize(ast: CircuitNode, serializeOpts?: { showParams?: boolean }): string {
      return serialize(ast, { showParams: serializeOpts?.showParams, paramFormat: 'brace' });
    },
    validate(ast: CircuitNode): ValidationResult {
      const registry = ElementRegistry.fromCircuit(ast);
      const flatParams = registry.flatParamVector(ast);
      if (flatParams.length > 0) {
        return validateParameterValues(ast, flatParams, { strict: options.strict });
      }
      return validate(ast, { strict: options.strict });
    },
  };
}

export { parseBoukamp } from './parser.js';
export { serialize } from './serializer.js';
export { validate, validateParameterValues, applyStrictMode, invalidParameterReason } from './validate.js';
export { tokenize } from './lexer.js';
export { ElementRegistry, assignParamOffsets, parameterCount } from './element-registry.js';
export type { Token, LexError } from './lexer.js';
export type { ParseError } from './parser.js';
export type { ValidateOptions } from './validate.js';
