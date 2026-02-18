import type { GameOperator } from '../state/GameOperator';
import { EPlayer, getOpponent } from '../core/EPlayer';
import { Pos } from '../core/Pos';
import { PieceType } from '../pieces/PieceType';
import type { SeededRandom } from '../generators/SeededRandom';
import type { Piece } from '../pieces/Piece';
import type { ActionPos } from '../core/ActionPos';
import { BotActionType, type BotActionInfo, type BotActionMove } from './BotActionType';
import { buildThreatMap } from './ThreatMap';

/**
 * Computes all 7 bot actions for a given player.
 * Requires that computePossibleMoves() has already been called on the state.
 *
 * Every action is post-filtered: moves that would kill own pieces
 * (e.g. via chain-effect explosions) are removed.
 */
export function computeBotActions(
  state: GameOperator,
  player: EPlayer,
  rand: SeededRandom,
): BotActionInfo[] {
  const enemy = getOpponent(player);
  const enemyThreatMap = buildThreatMap(state, enemy);
  const width = state.width;
  const enemyKing = player === EPlayer.P1 ? state.king2 : state.king1;
  const ownKing = player === EPlayer.P1 ? state.king1 : state.king2;

  // One copy of the state used for all safe-move checks (perform + undo)
  const checkCopy = state.copy();

  const rawActions = [
    computeRush50(state, player, rand, width, enemyKing),
    computeSafeForward(state, player, rand, enemyThreatMap, width, enemyKing),
    computeAttack(state, player, enemy, enemyThreatMap, width),
    computeFormation(state, player, width),
    computeCover(state, player, enemy, enemyThreatMap, width),
    computeEvade(state, player, enemy, enemyThreatMap, width),
    computeDefendKing(state, player, ownKing, enemyThreatMap, width),
  ];

  // Filter out moves that would kill own pieces
  return rawActions.map(action => {
    const safeMoves = filterSafeMoves(action.moves, checkCopy, player);
    return { ...action, moves: safeMoves, pieceCount: safeMoves.length };
  });
}

// ---------------------------------------------------------------
// Safe-move filter: simulate each move on a copy and reject any
// that add own pieces to the graveyard (chain-effect casualties).
// ---------------------------------------------------------------

function filterSafeMoves(
  moves: BotActionMove[],
  checkState: GameOperator,
  player: EPlayer,
): BotActionMove[] {
  return moves.filter(move => {
    const from = new Pos(move.fromX, move.fromY);
    const to = new Pos(move.toX, move.toY);
    const piece = checkState.pieceAt(from);
    if (!piece || piece.owner !== player) return false;

    const graveyardBefore = checkState.graveyard.length;
    checkState.history.addState();
    piece.pieceType.perform(checkState, from, to);

    let killsOwn = false;
    for (let i = graveyardBefore; i < checkState.graveyard.length; i++) {
      if (checkState.graveyard[i].owner === player) {
        killsOwn = true;
        break;
      }
    }

    checkState.undoDraw();
    return !killsOwn;
  });
}

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

/** Does this move bring the piece closer to the enemy king? */
function isTowardEnemyKing(
  piece: Piece,
  toX: number,
  toY: number,
  enemyKing: Piece | null,
): boolean {
  if (!enemyKing) return false;
  const kx = enemyKing.pos.x;
  const ky = enemyKing.pos.y;
  const currentDist = Math.abs(piece.pos.x - kx) + Math.abs(piece.pos.y - ky);
  const newDist = Math.abs(toX - kx) + Math.abs(toY - ky);
  return newDist < currentDist;
}

/** Shuffle array in place using seeded random */
function shuffle<T>(arr: T[], rand: SeededRandom): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rand.nextInt(i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
}

function toMove(piece: Piece, target: ActionPos): BotActionMove {
  return { fromX: piece.pos.x, fromY: piece.pos.y, toX: target.x, toY: target.y };
}

// ---------------------------------------------------------------
// Rush 50% — 50% of pieces rush toward enemy king
// ---------------------------------------------------------------

function computeRush50(
  state: GameOperator,
  player: EPlayer,
  rand: SeededRandom,
  width: number,
  enemyKing: Piece | null,
): BotActionInfo {
  const pieces = state.getAllPiecesFrom(player);
  const candidates: { piece: Piece; rushMoves: ActionPos[] }[] = [];

  for (const piece of pieces) {
    const rush: ActionPos[] = [];
    for (const m of piece.moveSet.getPossibleMoves()) {
      if (isTowardEnemyKing(piece, m.x, m.y, enemyKing)) {
        rush.push(m);
      }
    }
    if (rush.length > 0) {
      candidates.push({ piece, rushMoves: rush });
    }
  }

  shuffle(candidates, rand);
  const count = Math.ceil(candidates.length * 0.5);
  const selected = candidates.slice(0, count);

  const moves: BotActionMove[] = [];
  for (const { piece, rushMoves } of selected) {
    const target = rushMoves[rand.nextInt(rushMoves.length)];
    moves.push(toMove(piece, target));
  }

  return {
    type: BotActionType.RUSH_50,
    label: 'Rush 50%',
    pieceCount: moves.length,
    moves,
  };
}

// ---------------------------------------------------------------
// Safe Forward — 30% of pieces advance toward enemy king,
// only to squares not threatened by any enemy piece.
// ---------------------------------------------------------------

function computeSafeForward(
  state: GameOperator,
  player: EPlayer,
  rand: SeededRandom,
  enemyThreatMap: Set<number>,
  width: number,
  enemyKing: Piece | null,
): BotActionInfo {
  const pieces = state.getAllPiecesFrom(player);
  const candidates: { piece: Piece; safeMoves: ActionPos[] }[] = [];

  for (const piece of pieces) {
    const safe: ActionPos[] = [];
    for (const m of piece.moveSet.getPossibleMoves()) {
      if (isTowardEnemyKing(piece, m.x, m.y, enemyKing) &&
          !enemyThreatMap.has(m.y * width + m.x)) {
        safe.push(m);
      }
    }
    if (safe.length > 0) {
      candidates.push({ piece, safeMoves: safe });
    }
  }

  shuffle(candidates, rand);
  const count = Math.ceil(candidates.length * 0.3);
  const selected = candidates.slice(0, count);

  const moves: BotActionMove[] = [];
  for (const { piece, safeMoves } of selected) {
    const target = safeMoves[rand.nextInt(safeMoves.length)];
    moves.push(toMove(piece, target));
  }

  return {
    type: BotActionType.SAFE_FORWARD,
    label: 'Safe Forward',
    pieceCount: moves.length,
    moves,
  };
}

// ---------------------------------------------------------------
// Attack — safe attacks on enemy pieces (can't be recaptured).
// pieceCount = number of distinct enemy pieces that will be destroyed.
// ---------------------------------------------------------------

function computeAttack(
  state: GameOperator,
  player: EPlayer,
  enemy: EPlayer,
  enemyThreatMap: Set<number>,
  width: number,
): BotActionInfo {
  const pieces = state.getAllPiecesFrom(player);
  const moves: BotActionMove[] = [];

  for (const piece of pieces) {
    let bestTarget: ActionPos | null = null;
    let bestLvl = -1;

    for (const m of piece.moveSet.getPossibleMoves()) {
      const target = state.pieceAt(m);
      if (target && target.owner === enemy && !enemyThreatMap.has(m.y * width + m.x)) {
        if (target.lvl > bestLvl) {
          bestLvl = target.lvl;
          bestTarget = m;
        }
      }
    }

    if (bestTarget) {
      moves.push(toMove(piece, bestTarget));
    }
  }

  // Count unique target positions = actual enemy pieces that will be destroyed
  const uniqueTargets = new Set<number>();
  const enemyCells: { x: number; y: number }[] = [];
  for (const move of moves) {
    const key = move.toY * width + move.toX;
    if (!uniqueTargets.has(key)) {
      uniqueTargets.add(key);
      enemyCells.push({ x: move.toX, y: move.toY });
    }
  }

  return {
    type: BotActionType.ATTACK,
    label: 'Attack',
    pieceCount: uniqueTargets.size,
    moves,
    enemyCells,
  };
}

// ---------------------------------------------------------------
// Formation (was Seek Cover)
//
// A piece is only moved when, from its NEW position, it can
// cover at least one currently-uncovered friendly piece.
//
// "Cover" = the piece's actionMap can reach the uncovered piece's
// position from the new location (approximation — ignores path
// conditions, but uses the correct topDown Y-inversion).
// ---------------------------------------------------------------

function computeFormation(
  state: GameOperator,
  player: EPlayer,
  width: number,
): BotActionInfo {
  const pieces = state.getAllPiecesFrom(player);

  // coverageCount[field] = how many friendly pieces can move there
  const coverageCount = new Map<number, number>();
  for (const piece of pieces) {
    for (const m of piece.moveSet.getPossibleMoves()) {
      const key = m.y * width + m.x;
      coverageCount.set(key, (coverageCount.get(key) ?? 0) + 1);
    }
  }

  // Collect positions of currently-uncovered pieces
  const uncoveredPositions = new Set<number>();
  for (const piece of pieces) {
    const posKey = piece.pos.y * width + piece.pos.x;
    if ((coverageCount.get(posKey) ?? 0) === 0) {
      uncoveredPositions.add(posKey);
    }
  }

  if (uncoveredPositions.size === 0) {
    return { type: BotActionType.FORMATION, label: 'Formation', pieceCount: 0, moves: [] };
  }

  const topDown = player === PieceType.TOPDOWN_PLAYER;
  const moves: BotActionMove[] = [];

  for (const piece of pieces) {
    if (uncoveredPositions.size === 0) break;

    const actionKeys = piece.pieceType.actionMap.keySet();

    for (const m of piece.moveSet.getPossibleMoves()) {
      const coveredKeys: number[] = [];
      for (const ak of actionKeys) {
        let dx = ak.x;
        let dy = ak.y;
        if (topDown) dy = -dy;
        const reachKey = (m.y + dy) * width + (m.x + dx);
        if (uncoveredPositions.has(reachKey)) {
          coveredKeys.push(reachKey);
        }
      }
      if (coveredKeys.length > 0) {
        moves.push(toMove(piece, m));
        for (const k of coveredKeys) {
          uncoveredPositions.delete(k);
        }
        break; // one move per piece
      }
    }
  }

  return {
    type: BotActionType.FORMATION,
    label: 'Formation',
    pieceCount: moves.length,
    moves,
  };
}

// ---------------------------------------------------------------
// Cover — protect threatened frontline pieces with backup pieces
//
// 1. Sort own pieces by distance to nearest enemy (ascending).
//    Top ~40% = frontline.
// 2. Filter frontline: only those threatened by enemy (enemyThreatMap).
// 3. Skip already-covered frontline pieces (another friend can move there).
// 4. For each unprotected frontline piece A, find a backup piece B
//    that has a possible move from which B's actionMap reaches A's pos.
// 5. Move B there.
// ---------------------------------------------------------------

function computeCover(
  state: GameOperator,
  player: EPlayer,
  enemy: EPlayer,
  enemyThreatMap: Set<number>,
  width: number,
): BotActionInfo {
  const pieces = state.getAllPiecesFrom(player);
  const enemyPieces = state.getAllPiecesFrom(enemy);
  const height = state.height;
  const topDown = player === PieceType.TOPDOWN_PLAYER;

  // Distance to nearest enemy for each own piece
  type PieceDist = { piece: Piece; dist: number };
  const pieceDists: PieceDist[] = [];
  for (const piece of pieces) {
    let minDist = Infinity;
    for (const ep of enemyPieces) {
      const d = Math.abs(piece.pos.x - ep.pos.x) + Math.abs(piece.pos.y - ep.pos.y);
      if (d < minDist) minDist = d;
    }
    pieceDists.push({ piece, dist: minDist });
  }

  // Sort ascending by distance (closest to enemy first)
  pieceDists.sort((a, b) => a.dist - b.dist);

  // Top ~40% = frontline
  const frontlineCount = Math.max(1, Math.ceil(pieceDists.length * 0.4));
  const frontline = pieceDists.slice(0, frontlineCount);

  // Filter: only frontline pieces that are threatened
  const threatenedFrontline: Piece[] = [];
  for (const { piece } of frontline) {
    const key = piece.pos.y * width + piece.pos.x;
    if (enemyThreatMap.has(key)) {
      threatenedFrontline.push(piece);
    }
  }

  if (threatenedFrontline.length === 0) {
    return { type: BotActionType.COVER, label: 'Cover', pieceCount: 0, moves: [] };
  }

  // Which friendly pieces can already move to which positions?
  // coveredByFriend[posKey] = true if any friend can move there
  const coveredByFriend = new Set<number>();
  for (const piece of pieces) {
    for (const m of piece.moveSet.getPossibleMoves()) {
      coveredByFriend.add(m.y * width + m.x);
    }
  }

  // Filter out already-covered frontline pieces
  const unprotected: Piece[] = [];
  for (const piece of threatenedFrontline) {
    const key = piece.pos.y * width + piece.pos.x;
    if (!coveredByFriend.has(key)) {
      unprotected.push(piece);
    }
  }

  if (unprotected.length === 0) {
    // All threatened frontline pieces are already covered — still report them
    const protectedCells = threatenedFrontline.map(p => ({ x: p.pos.x, y: p.pos.y }));
    // Find enemies that threaten these positions
    const enemyCells = findThreateningEnemies(state, enemy, threatenedFrontline, width);
    return {
      type: BotActionType.COVER,
      label: 'Cover',
      pieceCount: 0,
      moves: [],
      protectedCells,
      enemyCells,
    };
  }

  // Backup = pieces NOT in frontline
  const frontlineIds = new Set(frontline.map(pd => pd.piece.id));
  const backups = pieces.filter(p => !frontlineIds.has(p.id));

  const moves: BotActionMove[] = [];
  const protectedPieces: Piece[] = [];
  const usedBackups = new Set<number>();
  const unprotectedSet = new Set(unprotected.map(p => p.pos.y * width + p.pos.x));

  for (const target of unprotected) {
    const targetKey = target.pos.y * width + target.pos.x;
    if (!unprotectedSet.has(targetKey)) continue; // already covered by a previous iteration

    let found = false;
    for (const backup of backups) {
      if (usedBackups.has(backup.id)) continue;

      const actionKeys = backup.pieceType.actionMap.keySet();

      for (const m of backup.moveSet.getPossibleMoves()) {
        // From position m, can backup's actionMap reach target's position?
        let canReach = false;
        for (const ak of actionKeys) {
          let dx = ak.x;
          let dy = ak.y;
          if (topDown) dy = -dy;
          const rx = m.x + dx;
          const ry = m.y + dy;
          if (rx === target.pos.x && ry === target.pos.y) {
            canReach = true;
            break;
          }
        }
        if (canReach) {
          moves.push(toMove(backup, m));
          usedBackups.add(backup.id);
          protectedPieces.push(target);
          unprotectedSet.delete(targetKey);
          found = true;
          break;
        }
      }
      if (found) break;
    }
  }

  // Also include already-covered threatened frontline pieces in protectedCells
  const allProtected = [
    ...threatenedFrontline.filter(p => !unprotectedSet.has(p.pos.y * width + p.pos.x)),
  ];
  const protectedCells = allProtected.map(p => ({ x: p.pos.x, y: p.pos.y }));

  // Find enemies threatening our frontline
  const enemyCells = findThreateningEnemies(state, enemy, allProtected, width);

  return {
    type: BotActionType.COVER,
    label: 'Cover',
    pieceCount: moves.length,
    moves,
    protectedCells,
    enemyCells,
  };
}

/** Find enemy pieces that threaten the given friendly pieces */
function findThreateningEnemies(
  state: GameOperator,
  enemy: EPlayer,
  friendlyPieces: Piece[],
  width: number,
): { x: number; y: number }[] {
  const targetPositions = new Set<number>();
  for (const p of friendlyPieces) {
    targetPositions.add(p.pos.y * width + p.pos.x);
  }

  const enemyCells: { x: number; y: number }[] = [];
  const seenEnemies = new Set<number>();
  for (const ep of state.getAllPiecesFrom(enemy)) {
    for (const em of ep.moveSet.getPossibleMoves()) {
      if (targetPositions.has(em.y * width + em.x)) {
        const eKey = ep.pos.y * width + ep.pos.x;
        if (!seenEnemies.has(eKey)) {
          seenEnemies.add(eKey);
          enemyCells.push({ x: ep.pos.x, y: ep.pos.y });
        }
        break;
      }
    }
  }
  return enemyCells;
}

// ---------------------------------------------------------------
// Evade Threats — threatened pieces flee to safe squares
// ---------------------------------------------------------------

function computeEvade(
  state: GameOperator,
  player: EPlayer,
  enemy: EPlayer,
  enemyThreatMap: Set<number>,
  width: number,
): BotActionInfo {
  const pieces = state.getAllPiecesFrom(player);
  const moves: BotActionMove[] = [];

  // Collect positions of threatened own pieces
  const threatenedPositions = new Set<number>();

  for (const piece of pieces) {
    const key = piece.pos.y * width + piece.pos.x;
    // Only pieces currently on a threatened square
    if (!enemyThreatMap.has(key)) continue;

    threatenedPositions.add(key);

    // Find a move to a non-threatened square
    for (const m of piece.moveSet.getPossibleMoves()) {
      if (!enemyThreatMap.has(m.y * width + m.x)) {
        moves.push(toMove(piece, m));
        break;
      }
    }
  }

  // Find enemy pieces that threaten the evading pieces
  const enemyCells: { x: number; y: number }[] = [];
  const seenEnemies = new Set<number>();
  for (const ep of state.getAllPiecesFrom(enemy)) {
    for (const em of ep.moveSet.getPossibleMoves()) {
      if (threatenedPositions.has(em.y * width + em.x)) {
        const eKey = ep.pos.y * width + ep.pos.x;
        if (!seenEnemies.has(eKey)) {
          seenEnemies.add(eKey);
          enemyCells.push({ x: ep.pos.x, y: ep.pos.y });
        }
        break;
      }
    }
  }

  return {
    type: BotActionType.EVADE,
    label: 'Evade Threats',
    pieceCount: moves.length,
    moves,
    enemyCells,
  };
}

// ---------------------------------------------------------------
// Defend the King — two-phase defence:
//
// Phase A  "Intercept": move pieces INTO threatened king-zone
//          squares so they can block or trade with attackers.
// Phase B  "Reinforce": move additional pieces closer to the king
//          (reducing Manhattan distance), preferring safe squares.
//
// King zone = Manhattan dist ≤ 3.
// Limit: max(8, 20% of pieces).
// ---------------------------------------------------------------

function computeDefendKing(
  state: GameOperator,
  player: EPlayer,
  ownKing: Piece | null,
  enemyThreatMap: Set<number>,
  width: number,
): BotActionInfo {
  if (!ownKing) {
    return { type: BotActionType.DEFEND_KING, label: 'Defend King', pieceCount: 0, moves: [] };
  }

  const kx = ownKing.pos.x;
  const ky = ownKing.pos.y;
  const height = state.height;
  const topDown = player === PieceType.TOPDOWN_PLAYER;
  const pieces = state.getAllPiecesFrom(player);
  const limit = Math.max(8, Math.ceil(pieces.length * 0.2));

  // King zone: all in-bounds squares within Manhattan distance 3
  const kingZone = new Set<number>();
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      if (Math.abs(dx) + Math.abs(dy) > 3) continue;
      if (dx === 0 && dy === 0) continue;
      const nx = kx + dx;
      const ny = ky + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        kingZone.add(ny * width + nx);
      }
    }
  }

  // Threatened zone squares (enemy can reach them)
  const threatenedZone = new Set<number>();
  for (const k of kingZone) {
    if (enemyThreatMap.has(k)) threatenedZone.add(k);
  }

  // Which zone squares are already occupied by a friendly piece?
  const friendlyOccupied = new Set<number>();
  for (const piece of pieces) {
    friendlyOccupied.add(piece.pos.y * width + piece.pos.x);
  }

  const moves: BotActionMove[] = [];
  const usedPieces = new Set<number>(); // piece IDs already assigned

  // --- Phase A: Intercept — move pieces that can cover threatened zone squares ---
  // "Cover" = from the new position, the piece's actionMap can reach
  // a threatened zone square (so it can counter-attack).
  const uncoveredThreats = new Set(threatenedZone);

  // Which threatened squares are already covered by friendly pieces' actionMaps?
  for (const piece of pieces) {
    const actionKeys = piece.pieceType.actionMap.keySet();
    for (const ak of actionKeys) {
      let adx = ak.x;
      let ady = ak.y;
      if (topDown) ady = -ady;
      const reachKey = (piece.pos.y + ady) * width + (piece.pos.x + adx);
      uncoveredThreats.delete(reachKey);
    }
  }

  if (uncoveredThreats.size > 0) {
    type InterceptCandidate = { piece: Piece; move: ActionPos; coveredKeys: number[]; dist: number };
    const interceptCandidates: InterceptCandidate[] = [];

    for (const piece of pieces) {
      if (piece === ownKing) continue;
      const dist = Math.abs(piece.pos.x - kx) + Math.abs(piece.pos.y - ky);
      const actionKeys = piece.pieceType.actionMap.keySet();

      let bestMove: ActionPos | null = null;
      let bestKeys: number[] = [];

      for (const m of piece.moveSet.getPossibleMoves()) {
        const covered: number[] = [];
        for (const ak of actionKeys) {
          let adx = ak.x;
          let ady = ak.y;
          if (topDown) ady = -ady;
          const reachKey = (m.y + ady) * width + (m.x + adx);
          if (uncoveredThreats.has(reachKey)) {
            covered.push(reachKey);
          }
        }
        if (covered.length > bestKeys.length) {
          bestMove = m;
          bestKeys = covered;
        }
      }

      if (bestMove && bestKeys.length > 0) {
        interceptCandidates.push({ piece, move: bestMove, coveredKeys: bestKeys, dist });
      }
    }

    // Sort: most covered first, then closest to king
    interceptCandidates.sort((a, b) =>
      b.coveredKeys.length - a.coveredKeys.length || a.dist - b.dist,
    );

    for (const cand of interceptCandidates) {
      if (moves.length >= limit) break;
      if (uncoveredThreats.size === 0) break;

      const newKeys = cand.coveredKeys.filter(k => uncoveredThreats.has(k));
      if (newKeys.length === 0) continue;

      moves.push(toMove(cand.piece, cand.move));
      usedPieces.add(cand.piece.id);
      for (const k of newKeys) {
        uncoveredThreats.delete(k);
      }
    }
  }

  // --- Phase B: Reinforce — move additional pieces closer to the king ---
  // Pick moves that reduce Manhattan distance, preferring safe squares.
  type ReinforceCandidate = { piece: Piece; move: ActionPos; newDist: number; safe: boolean };
  const reinforceCandidates: ReinforceCandidate[] = [];

  for (const piece of pieces) {
    if (piece === ownKing) continue;
    if (usedPieces.has(piece.id)) continue;
    const currentDist = Math.abs(piece.pos.x - kx) + Math.abs(piece.pos.y - ky);
    // Only reinforce pieces not already adjacent to king
    if (currentDist <= 1) continue;

    let bestMove: ActionPos | null = null;
    let bestNewDist = currentDist;
    let bestSafe = false;

    for (const m of piece.moveSet.getPossibleMoves()) {
      const nd = Math.abs(m.x - kx) + Math.abs(m.y - ky);
      if (nd >= currentDist) continue; // must get closer
      const safe = !enemyThreatMap.has(m.y * width + m.x);
      // Prefer safe squares, then closest to king
      if (!bestMove
        || (safe && !bestSafe)
        || (safe === bestSafe && nd < bestNewDist)) {
        bestMove = m;
        bestNewDist = nd;
        bestSafe = safe;
      }
    }

    if (bestMove) {
      reinforceCandidates.push({ piece, move: bestMove, newDist: bestNewDist, safe: bestSafe });
    }
  }

  // Sort: safe first, then by new distance (closest to king first)
  reinforceCandidates.sort((a, b) => {
    if (a.safe !== b.safe) return a.safe ? -1 : 1;
    return a.newDist - b.newDist;
  });

  for (const cand of reinforceCandidates) {
    if (moves.length >= limit) break;
    moves.push(toMove(cand.piece, cand.move));
    usedPieces.add(cand.piece.id);
  }

  return {
    type: BotActionType.DEFEND_KING,
    label: 'Defend King',
    pieceCount: moves.length,
    moves,
  };
}
