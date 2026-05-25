import {
  parameterizedRandles,
  cpeParameterized,
  coleColeCircuit,
  hnCircuit,
  gridCatalogRows,
} from './grid-catalog.js';

export { parameterizedRandles, cpeParameterized, coleColeCircuit, hnCircuit, gridCatalogRows } from './grid-catalog.js';
export type { GridCatalogRow } from './grid-catalog.js';

export interface CircuitExample {
  id: string;
  title: string;
  description: string;
  dsl: string;
  elements: string[];
}

export const basicCircuit: CircuitExample = {
  id: 'basic',
  title: 'Basic RC',
  description: 'Series resistor and capacitor',
  dsl: 'R0{100}-C1{1e-5}',
  elements: ['R', 'C'],
};

export const randlesCircuit: CircuitExample = {
  id: 'randles',
  title: 'Randles Circuit',
  description: 'Solution resistance + charge transfer + double-layer capacitance + Warburg',
  dsl: 'R0{10}-p(R1{100},C1{1e-5})-Wo2{0.05,0.1}',
  elements: ['R', 'C', 'Wo'],
};

export const warburgCircuit: CircuitExample = {
  id: 'warburg',
  title: 'Warburg Short',
  description: 'Randles with finite-length Warburg (Ws)',
  dsl: 'R0{10}-p(R1{100},C1{1e-5})-Ws2{0.01,0.5}',
  elements: ['R', 'C', 'Ws'],
};

export const nestedCircuit: CircuitExample = {
  id: 'nested',
  title: 'Nested Parallel',
  description: 'Nested parallel groups demonstrating complex topology',
  dsl: 'R0{10}-p(R1{50},p(R2{100},C1{1e-6}))',
  elements: ['R', 'C'],
};

export const cpeCircuit: CircuitExample = {
  id: 'cpe',
  title: 'CPE Circuit',
  description: 'Constant Phase Element in parallel with charge-transfer resistance',
  dsl: 'R0{50}-p(R1{200},Q1{5e-5,0.82})',
  elements: ['R', 'Q'],
};

export const fullRandlesCircuit: CircuitExample = {
  id: 'full-randles',
  title: 'Full Randles + CPE',
  description: 'Dual RC/CPE branches plus series inductor',
  dsl: 'R0{5}-p(R1{30},C1{1e-5})-p(R2{20},Q2{5e-4,0.82})-L3{1e-3}',
  elements: ['R', 'C', 'Q', 'L'],
};

export const multiWarburgCircuit: CircuitExample = {
  id: 'multi-warburg',
  title: 'Multi-Warburg',
  description: 'Parallel RC with semi-infinite Warburg (W)',
  dsl: 'R0{10}-p(R1{100},C1{1e-5})-W1{0.05}',
  elements: ['R', 'C', 'W'],
};

export const sampleCircuits: CircuitExample[] = [
  basicCircuit,
  randlesCircuit,
  warburgCircuit,
  nestedCircuit,
  cpeCircuit,
  fullRandlesCircuit,
  multiWarburgCircuit,
];

export const parameterizedCircuits: CircuitExample[] = [
  parameterizedRandles,
  cpeParameterized,
  coleColeCircuit,
  hnCircuit,
];

export const allPlaygroundCircuits: CircuitExample[] = [
  ...sampleCircuits,
  ...parameterizedCircuits,
];

export interface PlaygroundConfig {
  initialCircuit: CircuitExample;
  showToolbar: boolean;
  showSidebar: boolean;
  theme: 'light' | 'dark';
}

export const defaultPlaygroundConfig: PlaygroundConfig = {
  initialCircuit: randlesCircuit,
  showToolbar: true,
  showSidebar: true,
  theme: 'light',
};
