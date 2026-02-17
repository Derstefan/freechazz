/** Shared color definitions for all 12 action symbols.
 *  Used by Canvas renderer (HighlightRenderer) and React components (PieceInfoPanel). */

export interface ActionColorEntry {
  /** CSS hex color */
  hex: string;
  /** Short label (1-2 words) */
  label: string;
  /** Tooltip / longer description */
  description: string;
}

const ACTION_COLORS: Record<string, ActionColorEntry> = {
  F: { hex: '#22c55e', label: 'Move',          description: 'Move to free position' },
  E: { hex: '#ef4444', label: 'Capture',       description: 'Capture enemy piece' },
  X: { hex: '#f97316', label: 'Jump',          description: 'Jump to position (move or capture)' },
  M: { hex: '#3b82f6', label: 'Move',          description: 'Move along clear path (move or capture)' },
  S: { hex: '#a855f7', label: 'Swap',          description: 'Swap with friendly piece' },
  R: { hex: '#06b6d4', label: 'Rush',          description: 'Rush in direction' },
  C: { hex: '#ec4899', label: 'Cross',         description: 'Cross attack on free position' },
  Y: { hex: '#f59e0b', label: 'Explode',       description: 'Explosion attack on free position' },
  Z: { hex: '#84cc16', label: 'Zombie',        description: 'Zombie attack on enemy' },
  A: { hex: '#8b5cf6', label: 'Range',         description: 'Ranged attack (clear path)' },
  Q: { hex: '#14b8a6', label: 'Convert',       description: 'Convert enemy piece' },
  L: { hex: '#e11d48', label: 'Legion',        description: 'Legion attack' },
};

/** Get color entry for an action symbol. Returns a neutral gray fallback for unknown symbols. */
export function getActionColor(symbol: string): ActionColorEntry {
  return ACTION_COLORS[symbol] ?? { hex: '#6b7280', label: symbol, description: symbol };
}

/** Get just the hex color string for an action symbol. */
export function getActionHex(symbol: string): string {
  return getActionColor(symbol).hex;
}

export { ACTION_COLORS };
