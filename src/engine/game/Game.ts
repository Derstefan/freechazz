import { EPlayer, getOpponent } from '../core/EPlayer';
import { Pos } from '../core/Pos';
import { Piece } from '../pieces/Piece';
import type { PieceType } from '../pieces/PieceType';
import { GameOperator } from '../state/GameOperator';
import { GameOperatorBuilder } from '../state/GameOperatorBuilder';
import type { Formation } from '../formation/Formation';
import type { DrawEvent } from '../events/DrawEvent';
import type { BotActionMove } from '../botactions/BotActionType';

export class Game {
  private formation1: Formation;
  private formation2: Formation;
  private turns: number = 0;
  readonly state: GameOperator;

  constructor(formation1: Formation, formation2: Formation) {
    this.formation1 = formation1;
    this.formation2 = formation2;

    const builder = new GameOperatorBuilder(
      formation1.size.width,
      formation1.size.height,
    );

    // P1: put king mirrored
    builder.putKing(EPlayer.P1, formation1.getKing()!, formation1.kingPos!);

    // P1: other pieces mirrored
    for (const [key, pieceType] of formation1.getPieceTypes()) {
      const pos = Pos.fromKey(key);
      if (pos.equals(formation1.kingPos!)) continue;
      builder.putPieceMirrored(new Piece(EPlayer.P1, pieceType), pos);
    }

    // P2: put king
    builder.putKing(EPlayer.P2, formation2.getKing()!, formation2.kingPos!);

    // P2: other pieces (not mirrored)
    for (const [key, pieceType] of formation2.getPieceTypes()) {
      const pos = Pos.fromKey(key);
      if (pos.equals(formation2.kingPos!)) continue;
      builder.putPiece(new Piece(EPlayer.P2, pieceType), pos);
    }

    this.state = builder.build()!;
  }

  // --- Play ---

  play(fromPos: Pos, toPos: Pos): boolean {
    if (!this.validateDrawLogic(fromPos, toPos)) return false;
    this.state.performDraw(fromPos, toPos);
    this.endTurn();
    return true;
  }

  playBatch(moves: BotActionMove[]): boolean {
    if (this.state.getWinner()) return false;
    const player = this.getPlayersTurn();
    this.state.history.addState(); // single history state for all moves
    for (const move of moves) {
      const from = new Pos(move.fromX, move.fromY);
      const to = new Pos(move.toX, move.toY);
      const piece = this.state.pieceAt(from);
      if (!piece || piece.owner !== player) continue;
      if (!piece.pieceType.isPossibleMove(this.state, from, to)) continue;
      piece.pieceType.perform(this.state, from, to);
      if (this.state.getWinner()) break;
    }
    this.state.computePossibleMoves();
    this.setPlayersTurn(getOpponent(player));
    this.turns++;
    return true;
  }

  surrender(): void {
    if (this.getPlayersTurn() === EPlayer.P1) {
      this.state.setWinner(EPlayer.P2);
    } else {
      this.state.setWinner(EPlayer.P1);
    }
  }

  computePossibleMoves(): void {
    this.state.computePossibleMoves();
  }

  // --- History ---

  getLastDrawEvent(): DrawEvent | null {
    return this.state.history.getLastDraw();
  }

  getDrawsSince(turn: number): DrawEvent[] {
    const draws: DrawEvent[] = [];
    for (let i = turn; i < this.turns; i++) {
      const d = this.state.history.getDraw(i);
      if (d) draws.push(d);
    }
    return draws;
  }

  // --- Turn management ---

  private endTurn(): void {
    if (this.state.getWinner()) return;
    this.changeTurn();
    if (!this.state.isCopy) {
      this.computePossibleMoves();
    }
  }

  private changeTurn(): void {
    this.setPlayersTurn(getOpponent(this.getPlayersTurn()));
    this.turns++;
  }

  // --- Validation ---

  private validateDrawLogic(fromPos: Pos, toPos: Pos): boolean {
    if (this.state.getWinner()) return false;
    const piece = this.state.pieceAt(fromPos);
    if (!piece) return false;
    if (piece.owner !== this.getPlayersTurn()) return false;
    if (!this.canMoveTo(fromPos, toPos)) return false;
    return true;
  }

  private canMoveTo(fromPos: Pos, toPos: Pos): boolean {
    const piece = this.state.pieceAt(fromPos);
    if (!piece) return false;
    return piece.pieceType.isPossibleMove(this.state, fromPos, toPos);
  }

  // --- Getters ---

  getPlayersTurn(): EPlayer {
    return this.state.playersTurn;
  }

  setPlayersTurn(player: EPlayer): void {
    this.state.playersTurn = player;
  }

  getTurns(): number {
    return this.turns;
  }

  getWinner(): EPlayer | null {
    return this.state.getWinner();
  }

  // --- Copy (for bot) ---

  copy(): Game {
    const clone = Object.create(Game.prototype) as Game;
    (clone as any).formation1 = this.formation1;
    (clone as any).formation2 = this.formation2;
    (clone as any).turns = this.turns;
    (clone as any).state = this.state.copy();
    clone.setPlayersTurn(this.getPlayersTurn());
    return clone;
  }

  // --- Undo ---

  undo(): void {
    this.state.undoDraw();
    this.setPlayersTurn(getOpponent(this.getPlayersTurn()));
    this.turns--;
  }
}
