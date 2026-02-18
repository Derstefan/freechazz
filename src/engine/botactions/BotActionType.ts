export enum BotActionType {
  RUSH_50 = 'RUSH_50',
  SAFE_FORWARD = 'SAFE_FORWARD',
  ATTACK = 'ATTACK',
  FORMATION = 'FORMATION',
  COVER = 'COVER',
  EVADE = 'EVADE',
  DEFEND_KING = 'DEFEND_KING',
}

export interface BotActionMove {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface BotActionInfo {
  type: BotActionType;
  label: string;
  pieceCount: number;
  moves: BotActionMove[];
  /** Extra cells to highlight (e.g. threatening enemies for Evade) */
  enemyCells?: { x: number; y: number }[];
  /** Protected friendly cells (green highlight, e.g. for Cover) */
  protectedCells?: { x: number; y: number }[];
}
