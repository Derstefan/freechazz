import type { GameOperator } from '../state/GameOperator';
import { EPlayer } from '../core/EPlayer';

/**
 * Builds a set of all board positions that `player` can reach/attack.
 * Key encoding: y * width + x (numeric for O(1) lookup).
 */
export function buildThreatMap(state: GameOperator, player: EPlayer): Set<number> {
  const threatened = new Set<number>();
  const width = state.width;
  const pieces = state.getAllPiecesFrom(player);

  for (const piece of pieces) {
    for (const move of piece.moveSet.getPossibleMoves()) {
      threatened.add(move.y * width + move.x);
    }
  }

  return threatened;
}
