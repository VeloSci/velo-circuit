import type { CircuitExample } from './index';

export const parameterizedRandles: CircuitExample = {
  id: 'param-randles',
  title: 'Params (Randles)',
  description: 'Randles cell with embedded parameter values in brace notation',
  dsl: 'R0{10}-p(R1{100},C1{1e-5})-Wo2{0.05,0.1}',
  elements: ['R', 'C', 'Wo'],
};

export const cpeParameterized: CircuitExample = {
  id: 'param-cpe',
  title: 'Params (CPE)',
  description: 'CPE branch with Q0 and n embedded in DSL',
  dsl: 'R0{50}-p(R1{200},Q1{5e-5,0.82})',
  elements: ['R', 'Q'],
};

export const coleColeCircuit: CircuitExample = {
  id: 'cole-cole',
  title: 'Cole-Cole (CC)',
  description: 'Dual dispersion with Cole-Cole element — velo-spectroz parity',
  dsl: 'R0{50}-CC1{50,1e-3,0.8}',
  elements: ['R', 'CC'],
};

export const hnCircuit: CircuitExample = {
  id: 'hn',
  title: 'Havriliak-Negami (HN)',
  description: 'HN relaxation element with four parameters',
  dsl: 'R0{10}-HN1{50,1e-3,0.8,0.9}',
  elements: ['R', 'HN'],
};

export interface GridCatalogRow {
  id: string;
  dsl: string;
  label: string;
}

export const gridCatalogRows: GridCatalogRow[] = [
  { id: 'g1', label: 'Basic RC', dsl: 'R0{100}-C1{1e-5}' },
  { id: 'g2', label: 'Randles', dsl: 'R0{10}-p(R1{100},C1{1e-5})-Wo2{0.05,0.1}' },
  { id: 'g3', label: 'CPE branch', dsl: 'R0{50}-p(R1{200},Q1{5e-5,0.82})' },
  { id: 'g4', label: 'Nested', dsl: 'R0-p(R1,p(R2{50},C1{1e-6}))' },
  { id: 'g5', label: 'Cole-Cole', dsl: 'R0{50}-CC1{50,1e-3,0.8}' },
  { id: 'g6', label: 'HN', dsl: 'R0{10}-HN1{50,1e-3,0.8,0.9}' },
  { id: 'g7', label: 'Gerischer', dsl: 'R0{20}-G1{0.01,0.5}' },
  { id: 'g8', label: 'PDW', dsl: 'R0{10}-Pdw1{1e-10,1e-11,0.6,4.2e-4}' },
  { id: 'g9', label: 'Invalid (strict)', dsl: 'R0{-5}-C1{1e-5}' },
];
