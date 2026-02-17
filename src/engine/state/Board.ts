import { Pos } from '../core/Pos';
import { Piece } from '../pieces/Piece';
import { Field } from './Field';

export class Board {
  readonly width: number;
  readonly height: number;
  pieces: Piece[] = [];
  private board: Field[][];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.board = [];
    for (let y = 0; y < height; y++) {
      this.board[y] = [];
      for (let x = 0; x < width; x++) {
        this.board[y][x] = new Field();
      }
    }
  }

  pieceAt(p: Pos): Piece | null {
    if (p.x < 0 || p.x >= this.width || p.y < 0 || p.y >= this.height) {
      return null;
    }
    return this.board[p.y][p.x].piece;
  }

  isFree(p: Pos): boolean {
    if (!this.isOnboard(p)) return true;
    return this.board[p.y][p.x].piece === null;
  }

  isOnboard(pos: Pos): boolean {
    return pos.x >= 0 && pos.x < this.width && pos.y >= 0 && pos.y < this.height;
  }

  areEnemies(p1: Piece | null, p2: Piece | null): boolean {
    if (!p1 || !p2) return false;
    return p1.owner !== p2.owner;
  }

  removePiece(pos: Pos): void {
    const p = this.pieceAt(pos);
    if (p) {
      const idx = this.pieces.indexOf(p);
      if (idx >= 0) this.pieces.splice(idx, 1);
      this.board[pos.y][pos.x].piece = null;
    }
  }

  putPiece(piece: Piece, pos: Pos): void {
    piece.position = pos;
    this.pieces.push(piece);
    this.board[pos.y][pos.x].piece = piece;
  }

  getBoardArray(): Field[][] {
    return this.board;
  }

  copy(): Board {
    const copy = new Board(this.width, this.height);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const p = this.board[y][x].piece;
        if (p) {
          const pCopy = p.copy();
          copy.board[y][x].piece = pCopy;
          copy.pieces.push(pCopy);
        }
      }
    }
    return copy;
  }
}
