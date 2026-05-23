import type { ElementKind } from '../domain/circuit.js';

/** Mirror of velo-spectroz physical bounds / invalid_parameter_reason. */
export function invalidParameterReason(kind: string, params: number[]): string | null {
  if (params.some(value => !Number.isFinite(value))) return 'all parameters must be finite';

  switch (kind) {
    case 'R':
      return params[0] > 0 ? null : 'R must be > 0';
    case 'C':
      return params[0] > 0 ? null : 'C must be > 0';
    case 'L':
      return params[0] > 0 ? null : 'L must be > 0';
    case 'W':
      return params[0] > 0 ? null : 'sigma must be > 0';
    case 'Q':
      return params[0] > 0 && params[1] > 0 && params[1] <= 1
        ? null
        : 'Q0 must be > 0 and 0 < n <= 1';
    case 'Ws':
    case 'Wo':
    case 'G':
      return params.every(value => value > 0) ? null : 'all element parameters must be > 0';
    case 'Pdw':
      return params[0] > 0 && params[1] > 0 && params[3] > 0 && params[2] > 0 && params[2] < 1
        ? null
        : 'D1,D2,Lambda must be > 0 and 0 < theta < 1';
    case 'CC':
      return params[0] > 0 && params[1] > 0 && params[2] >= 0.3 && params[2] <= 1.0
        ? null
        : 'R,tau must be > 0 and 0.3 <= alpha <= 1.0';
    case 'HN':
      return params[0] > 0 && params[1] > 0 && params[2] >= 0.3 && params[2] <= 1.0
        && params[3] >= 0 && params[3] <= 1.0
        ? null
        : 'R,tau must be > 0, 0.3 <= alpha <= 1.0, 0 <= beta <= 1.0';
    default:
      return null;
  }
}

export function elementKindPhysicalBounds(kind: ElementKind): Array<[number, number]> {
  const pos: [number, number] = [1e-15, 1e15];
  const cpeN: [number, number] = [1e-12, 1 - 1e-9];
  const ccAlpha: [number, number] = [0.3, 1.0];
  const hnBeta: [number, number] = [0, 1.0];
  const pdwTheta: [number, number] = [1e-6, 1 - 1e-6];

  switch (kind) {
    case 'R':
    case 'C':
    case 'L':
    case 'W':
      return [pos];
    case 'Q':
      return [pos, cpeN];
    case 'Ws':
    case 'Wo':
    case 'G':
      return [pos, pos];
    case 'CC':
      return [pos, pos, ccAlpha];
    case 'HN':
      return [pos, pos, ccAlpha, hnBeta];
    case 'Pdw':
      return [[1e-15, 1e-5], [1e-15, 1e-5], pdwTheta, pos];
    default:
      return [];
  }
}
