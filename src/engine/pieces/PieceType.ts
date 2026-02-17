import { EPlayer } from '../core/EPlayer';
import { Pos } from '../core/Pos';
import { ActionPos } from '../core/ActionPos';
import { ActionMap } from './ActionMap';
import { MoveSet } from './MoveSet';
import { PieceTypeId } from './PieceTypeId';
import type { Action } from '../actions/Action';
import type { GameOperator } from '../state/GameOperator';

export class PieceType {
  static readonly TOPDOWN_PLAYER = EPlayer.P1;

  pieceTypeId: PieceTypeId;
  symbol: string = 'X';
  actionMap: ActionMap = new ActionMap();

  private constructor(lvl: number, seed: number, generatorVersion: string) {
    this.pieceTypeId = new PieceTypeId(seed, lvl, generatorVersion);
  }

  static getInstance(lvl: number, seed: number, generatorVersion: string): PieceType {
    return new PieceType(lvl, seed, generatorVersion);
  }

  perform(state: GameOperator, fromPos: Pos, toPos: Pos): Action | null {
    const piece = state.pieceAt(fromPos);
    if (!piece) return null;
    const topDown = piece.owner === PieceType.TOPDOWN_PLAYER;
    const dPos = toPos.minus(fromPos);
    if (topDown) dPos.y = -dPos.y;
    const action = this.actionMap.get(dPos);
    if (!action) return null;
    action.perform(state, fromPos, toPos);
    return action;
  }

  performWithoutChain(state: GameOperator, fromPos: Pos, toPos: Pos): Action | null {
    const piece = state.pieceAt(fromPos);
    if (!piece) return null;
    const topDown = piece.owner === PieceType.TOPDOWN_PLAYER;
    const dPos = toPos.minus(fromPos);
    if (topDown) dPos.y = -dPos.y;
    const action = this.actionMap.get(dPos);
    if (!action) return null;
    action.performWithoutChain(state, fromPos, toPos);
    return action;
  }

  computePossibleMoves(board: GameOperator, pos: Pos): MoveSet {
    const piece = board.pieceAt(pos);
    if (!piece) return new MoveSet();
    const topDown = piece.owner === PieceType.TOPDOWN_PLAYER;
    const possibleMoves: ActionPos[] = [];

    for (const p of this.actionMap.keySet()) {
      let dx = p.x;
      let dy = p.y;
      if (topDown) dy = -dy;

      const action = this.actionMap.get(p);
      if (!action) continue;
      const toPos = new Pos(pos.x + dx, pos.y + dy);
      if (board.isOnboard(toPos) && action.checkCondition(board, pos, toPos)) {
        possibleMoves.push(ActionPos.fromPos(toPos, action.symbol));
      }
    }
    return new MoveSet(possibleMoves);
  }

  isPossibleMove(state: GameOperator, fromPos: Pos, toPos: Pos): boolean {
    const piece = state.pieceAt(fromPos);
    if (!piece) return false;
    const topDown = piece.owner === PieceType.TOPDOWN_PLAYER;
    const dPos = topDown ? toPos.minus(fromPos).invertY() : toPos.minus(fromPos);
    const action = this.actionMap.get(dPos);
    if (!action) return false;
    return state.isOnboard(toPos) && action.checkCondition(state, fromPos, toPos);
  }
}
