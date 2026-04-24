import type { SimulationNodeDatum } from 'd3-force';

export type LODTier = 'dots' | 'labels' | 'full';

export interface PersonSimNode extends SimulationNodeDatum {
  kind: 'person';
  id: string;
  label: string;
  groups: string[];
  colors: string[];
  isCenter: boolean;
  photo?: string | null;
}

export type SimulationNode = PersonSimNode;

export interface SimulationEdge {
  source: string | SimulationNode;
  target: string | SimulationNode;
  type: string;
  color: string;
  sourceLabel?: string;
  targetLabel?: string;
}

export type PhotoCacheEntry = HTMLImageElement | 'loading' | 'error';
