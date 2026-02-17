import { DrawEvent } from '../engine/events/DrawEvent';
import { EventType } from '../engine/events/Event';
import type { MoveEvent } from '../engine/events/events/MoveEvent';
import type { DestroyEvent as DestroyEvt } from '../engine/events/events/DestroyEvent';
import type { SwapEvent as SwapEvt } from '../engine/events/events/SwapEvent';
import type { MoveAndDestroyEvent } from '../engine/events/events/MoveAndDestroyEvent';
import type { GameOperator } from '../engine/state/GameOperator';
import type { Piece } from '../engine/pieces/Piece';
import type { EPlayer } from '../engine/core/EPlayer';
import { MoveAnimation } from './animations/MoveAnimation';
import { DestroyAnimation } from './animations/DestroyAnimation';
import { SwapAnimation } from './animations/SwapAnimation';
import { MoveAndDestroyAnimation } from './animations/MoveAndDestroyAnimation';

export interface PieceSnapshot {
  id: number;
  seed: number;
  lvl: number;
  owner: EPlayer;
  king: boolean;
  symbol: string;
}

export function makeSnapshot(piece: Piece): PieceSnapshot {
  return {
    id: piece.id,
    seed: piece.pieceType.pieceTypeId.seed,
    lvl: piece.lvl,
    owner: piece.owner,
    king: piece.king,
    symbol: piece.symbol,
  };
}

export interface Animation {
  duration: number;
  progressTime: number;
  animate(dt: number): void;
  isFinished(): boolean;
}

export class AnimationSystem {
  private queue: Animation[] = [];
  private currentIndex: number = 0;
  private _isAnimating: boolean = false;
  private onComplete: (() => void) | null = null;
  private parallel: boolean = false;

  get isAnimating(): boolean {
    return this._isAnimating;
  }

  startFromDrawEvent(
    drawEvent: DrawEvent,
    state: GameOperator,
    cellSize: number,
    offsetX: number,
    offsetY: number,
    onComplete: () => void,
    parallel: boolean = false,
  ): void {
    this.queue = [];
    this.currentIndex = 0;
    this.onComplete = onComplete;
    this.parallel = parallel;

    for (const event of drawEvent.getEvents()) {
      switch (event.type) {
        case EventType.MOVE: {
          const e = event as MoveEvent;
          const snap = makeSnapshot(e.piece);
          this.queue.push(new MoveAnimation(
            snap,
            e.fromPos,
            e.toPos,
            cellSize,
            offsetX,
            offsetY,
          ));
          break;
        }
        case EventType.DESTROY: {
          const e = event as DestroyEvt;
          const snap = makeSnapshot(e.piece);
          this.queue.push(new DestroyAnimation(
            snap,
            e.pos,
            cellSize,
            offsetX,
            offsetY,
          ));
          break;
        }
        case EventType.SWAP: {
          const e = event as SwapEvt;
          // After swap: piece from fromPos is now at toPos, and vice versa
          const pieceAtToPos = state.pieceAt(e.toPos);
          const pieceAtFromPos = state.pieceAt(e.fromPos);
          if (pieceAtToPos && pieceAtFromPos) {
            this.queue.push(new SwapAnimation(
              makeSnapshot(pieceAtToPos),   // was at fromPos, now at toPos
              makeSnapshot(pieceAtFromPos),  // was at toPos, now at fromPos
              e.fromPos,
              e.toPos,
              cellSize,
              offsetX,
              offsetY,
            ));
          }
          break;
        }
        case EventType.MOVE_AND_DESTROY: {
          const e = event as MoveAndDestroyEvent;
          this.queue.push(new MoveAndDestroyAnimation(
            makeSnapshot(e.piece),
            e.fromPos,
            e.toPos,
            makeSnapshot(e.targetPiece),
            cellSize,
            offsetX,
            offsetY,
          ));
          break;
        }
        default:
          break;
      }
    }

    this._isAnimating = this.queue.length > 0;
  }

  update(dt: number): void {
    if (!this._isAnimating) return;

    if (this.parallel) {
      // Animate all at once
      let allDone = true;
      for (const anim of this.queue) {
        if (!anim.isFinished()) {
          anim.animate(dt);
          if (!anim.isFinished()) allDone = false;
        }
      }
      if (allDone) {
        this._isAnimating = false;
        this.onComplete?.();
      }
    } else {
      // Sequential (original behavior)
      if (this.currentIndex >= this.queue.length) {
        this._isAnimating = false;
        this.onComplete?.();
        return;
      }

      const anim = this.queue[this.currentIndex];
      anim.animate(dt);

      if (anim.isFinished()) {
        this.currentIndex++;
        if (this.currentIndex >= this.queue.length) {
          this._isAnimating = false;
          this.onComplete?.();
        }
      }
    }
  }

  getActiveAnimations(): Animation[] {
    if (!this._isAnimating) return [];
    if (this.parallel) {
      return this.queue.filter(a => !a.isFinished());
    }
    if (this.currentIndex >= this.queue.length) return [];
    return [this.queue[this.currentIndex]];
  }

  cancel(): void {
    this._isAnimating = false;
    this.queue = [];
    this.currentIndex = 0;
    this.onComplete = null;
  }
}
