export type GraphMode = 'individuals' | 'bubbles';

export interface ResolveGraphModeArgs {
  graphMode: GraphMode | null;
  graphBubbleThreshold: number;
  nodeCount: number;
}

export function resolveGraphMode(args: ResolveGraphModeArgs): GraphMode {
  if (args.graphMode !== null) return args.graphMode;
  return args.nodeCount >= args.graphBubbleThreshold ? 'bubbles' : 'individuals';
}
