import type { Game } from '../game/Game';
import { EPlayer, getOpponent } from '../core/EPlayer';
import { SeededRandom } from '../generators/SeededRandom';
import type { BotActionInfo } from './BotActionType';
import { computeBotActions } from './BotActionComputer';

const PIECE_LVL_WEIGHT = 10;
const KING_WEIGHT = 2000;
const DISTANCE_WEIGHT = 1;

/**
 * Evaluates all 5 bot actions by simulating each on a copy,
 * then returns the one with the best board evaluation.
 */
export function chooseBestAction(
  game: Game,
  player: EPlayer,
  rand: SeededRandom,
): BotActionInfo {
  const actions = computeBotActions(game.state, player, rand);

  let bestAction = actions[0];
  let bestScore = -Infinity;

  for (const action of actions) {
    if (action.moves.length === 0) continue;

    const copy = game.copy();
    copy.playBatch(action.moves);
    const score = evaluateBoard(copy, player);

    if (score > bestScore) {
      bestScore = score;
      bestAction = action;
    }
  }

  return bestAction;
}

function evaluateBoard(game: Game, player: EPlayer): number {
  const state = game.state;
  const enemy = getOpponent(player);
  let score = 0;

  const ownPieces = state.getAllPiecesFrom(player);
  const enemyPieces = state.getAllPiecesFrom(enemy);

  // Material advantage
  for (const p of ownPieces) {
    score += (p.king ? KING_WEIGHT : p.lvl * PIECE_LVL_WEIGHT);
  }
  for (const p of enemyPieces) {
    score -= (p.king ? KING_WEIGHT : p.lvl * PIECE_LVL_WEIGHT);
  }

  // King safety: penalize own king being far from center, reward distance from enemy
  const ownKing = player === EPlayer.P1 ? state.king1 : state.king2;
  const enemyKing = player === EPlayer.P1 ? state.king2 : state.king1;

  if (ownKing) {
    score += state.distanceToEnemy(enemy, ownKing.pos) * DISTANCE_WEIGHT;
  }

  // Distance advantage: own pieces closer to enemy
  for (const p of ownPieces) {
    if (!p.king) {
      score -= state.distanceToEnemy(enemy, p.pos) * DISTANCE_WEIGHT * 0.1;
    }
  }

  // Winner check
  const winner = game.getWinner();
  if (winner === player) score += 100000;
  else if (winner === enemy) score -= 100000;

  return score;
}
