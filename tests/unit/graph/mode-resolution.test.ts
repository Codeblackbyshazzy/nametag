import { describe, it, expect } from 'vitest';
import { resolveGraphMode } from '../../../components/graph/mode-resolution';

describe('resolveGraphMode', () => {
  it('returns "individuals" when explicitly set', () => {
    expect(resolveGraphMode({ graphMode: 'individuals', graphBubbleThreshold: 50, nodeCount: 500 })).toBe('individuals');
  });

  it('returns "bubbles" when explicitly set', () => {
    expect(resolveGraphMode({ graphMode: 'bubbles', graphBubbleThreshold: 50, nodeCount: 5 })).toBe('bubbles');
  });

  it('auto-resolves to "individuals" below threshold', () => {
    expect(resolveGraphMode({ graphMode: null, graphBubbleThreshold: 50, nodeCount: 49 })).toBe('individuals');
  });

  it('auto-resolves to "bubbles" at threshold', () => {
    expect(resolveGraphMode({ graphMode: null, graphBubbleThreshold: 50, nodeCount: 50 })).toBe('bubbles');
  });

  it('auto-resolves to "bubbles" above threshold', () => {
    expect(resolveGraphMode({ graphMode: null, graphBubbleThreshold: 50, nodeCount: 51 })).toBe('bubbles');
  });
});
