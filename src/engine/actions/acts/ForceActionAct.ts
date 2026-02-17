import { PosAct } from './PosAct';
import type { PieceAct } from './PieceAct';
import { Connector } from '../connector/Connector';
import type { GameOperator } from '../../state/GameOperator';
import type { Pos } from '../../core/Pos';
import { EPlayer } from '../../core/EPlayer';

export enum ForceType {
  OWN_PIECE = 'OWN_PIECE',
  ENEMY_PIECE = 'ENEMY_PIECE',
  ANY_PIECE = 'ANY_PIECE',
}

export abstract class ForceActionAct extends PosAct {
  chainConnector: Connector | null = null;
  forceType: ForceType;

  constructor(forceType: ForceType = ForceType.ANY_PIECE) {
    super();
    this.forceType = forceType;
  }

  performChainAct(board: GameOperator, pieceAct: PieceAct, fromPos: Pos, toPos: Pos): void {
    const piece = board.pieceAt(fromPos);
    if (!piece) return;

    if (this.forceType === ForceType.ENEMY_PIECE && piece.owner === board.playersTurn) {
      return;
    }
    if (this.forceType === ForceType.OWN_PIECE && piece.owner !== board.playersTurn) {
      return;
    }

    const actCopy = pieceAct.copy();
    actCopy.setConnector(this.chainConnector);
    actCopy.performWithoutChain(board, fromPos, toPos);
  }

  setChainConnector(connector: Connector): void {
    this.chainConnector = connector;
  }
}
