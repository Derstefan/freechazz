import { GameOperator } from './GameOperator';
import { EPlayer } from '../core/EPlayer';
import { Pos } from '../core/Pos';
import { MatchHistory } from '../events/MatchHistory';
import { Piece } from '../pieces/Piece';
import type { PieceType } from '../pieces/PieceType';

export class GameOperatorBuilder {
  private state: GameOperator;
  private width: number;
  private height: number;
  private king1Set = false;
  private king2Set = false;
  private idCounter = 0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.state = GameOperator.getInstance(width, height);
  }

  putPiece(piece: Piece, pos: Pos): GameOperatorBuilder {
    piece.id = this.idCounter++;
    this.state.putPiece(piece, pos);
    return this;
  }

  putPieceMirrored(piece: Piece, pos: Pos): GameOperatorBuilder {
    this.putPiece(piece, this.mirrorPos(pos));
    return this;
  }

  private mirrorPos(pos: Pos): Pos {
    return new Pos(this.width - 1 - pos.x, this.height - 1 - pos.y);
  }

  putKing(player: EPlayer, kingType: PieceType, pos: Pos): GameOperatorBuilder {
    const king = new Piece(player, kingType);
    if (player === EPlayer.P1) {
      this.putPieceMirrored(king, pos);
      this.state.setKing1(king);
      this.king1Set = true;
    } else {
      this.putPiece(king, pos);
      this.state.setKing2(king);
      this.king2Set = true;
    }
    return this;
  }

  build(): GameOperator | null {
    if (!this.king1Set || !this.king2Set) return null;
    this.state.computePossibleMoves();
    this.state.setHistory(new MatchHistory());
    return this.state;
  }
}
