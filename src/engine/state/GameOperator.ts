import { Board } from './Board';
import { Pos } from '../core/Pos';
import { EPlayer } from '../core/EPlayer';
import { MatchHistory } from '../events/MatchHistory';
import type { Event } from '../events/Event';
import type { DrawEvent } from '../events/DrawEvent';
import type { Piece } from '../pieces/Piece';

export class GameOperator {
  readonly width: number;
  readonly height: number;
  king1: Piece | null = null;
  king2: Piece | null = null;
  private _winner: EPlayer | null = null;
  history: MatchHistory;
  playersTurn: EPlayer = EPlayer.P1;
  private board: Board;
  graveyard: Piece[] = [];
  isCopy: boolean = false;

  private constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.board = new Board(width, height);
    this.history = new MatchHistory();
  }

  static getInstance(width: number, height: number): GameOperator {
    return new GameOperator(width, height);
  }

  // --- Draw operations ---

  performDraw(fromPos: Pos, toPos: Pos): void {
    const piece = this.pieceAt(fromPos);
    if (!piece) return;
    this.history.addState();
    piece.pieceType.perform(this, fromPos, toPos);
    this.computePossibleMoves();
  }

  performEvent(event: Event): void {
    this.history.addEvent(event);
    event.perform(this);
  }

  // --- Undo operations ---

  undoDraw(): void {
    const draw = this.history.getLastDraw();
    if (!draw) return;

    const count = draw.getEventCount();
    for (let i = 0; i < count; i++) {
      this.undoEvent(draw.getLastEvent()!);
    }
    this.history.removeLastState();
  }

  undoEvent(event: Event): void {
    event.undo(this);
    this.history.getLastDraw()?.removeLastEvent();
  }

  // --- Board queries ---

  pieceAt(p: Pos): Piece | null {
    return this.board.pieceAt(p);
  }

  isFree(p: Pos): boolean {
    return this.board.isFree(p);
  }

  isOnboard(pos: Pos): boolean {
    return this.board.isOnboard(pos);
  }

  areEnemies(p1: Piece | null, p2: Piece | null): boolean {
    return this.board.areEnemies(p1, p2);
  }

  // --- Board operations ---

  removePiece(pos: Pos): void {
    this.board.removePiece(pos);
  }

  putPiece(piece: Piece, pos: Pos): void {
    this.board.putPiece(piece, pos);
  }

  // --- Possible moves ---

  computePossibleMoves(): void {
    for (const piece of this.board.pieces) {
      this.computePossibleMovesForPiece(piece);
    }
  }

  computePossibleMovesForPiece(piece: Piece): void {
    const pos = piece.pos;
    piece.moveSet = piece.pieceType.computePossibleMoves(this, pos);
  }

  // --- Distance ---

  distanceToEnemy(enemy: EPlayer, pos: Pos): number {
    let distance = 9000;
    for (const p of this.getAllPiecesFrom(enemy)) {
      const d = Math.abs(pos.x - p.pos.x) + Math.abs(pos.y - p.pos.y);
      if (d < distance) distance = d;
    }
    return distance;
  }

  // --- Piece queries ---

  getAllPieces(): Piece[] {
    return this.board.pieces;
  }

  getAllPiecesFrom(player: EPlayer): Piece[] {
    return this.board.pieces.filter(p => p.owner === player);
  }

  getBoardArray() {
    return this.board.getBoardArray();
  }

  // --- Winner ---

  getWinner(): EPlayer | null {
    return this._winner;
  }

  setWinner(winner: EPlayer): void {
    this._winner = winner;
  }

  setKing1(king: Piece): void {
    king.king = true;
    this.king1 = king;
  }

  setKing2(king: Piece): void {
    king.king = true;
    this.king2 = king;
  }

  setHistory(history: MatchHistory): void {
    this.history = history;
  }

  // --- Copy ---

  copy(): GameOperator {
    const copy = new GameOperator(this.width, this.height);
    copy.board = this.board.copy();
    copy._winner = this._winner;
    copy.graveyard = this.graveyard.map(p => p.copy());
    copy.history = this.history.copy();
    copy.isCopy = true;

    // re-link kings from copied board
    if (this.king1) {
      const k1 = copy.board.pieces.find(p => p.id === this.king1!.id);
      if (k1) { k1.king = true; copy.king1 = k1; }
    }
    if (this.king2) {
      const k2 = copy.board.pieces.find(p => p.id === this.king2!.id);
      if (k2) { k2.king = true; copy.king2 = k2; }
    }

    return copy;
  }
}
