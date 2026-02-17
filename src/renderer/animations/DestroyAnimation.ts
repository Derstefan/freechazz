import type { Pos } from '../../engine/core/Pos';
import type { Animation, PieceSnapshot } from '../AnimationSystem';

export class DestroyAnimation implements Animation {
  duration: number = 0.25;
  progressTime: number = 0;

  readonly piece: PieceSnapshot;
  readonly x: number;
  readonly y: number;

  // Current animated values
  scale: number = 1;
  alpha: number = 1;

  constructor(
    piece: PieceSnapshot,
    pos: Pos,
    cellSize: number,
    offsetX: number,
    offsetY: number,
  ) {
    this.piece = piece;
    this.x = offsetX + pos.x * cellSize;
    this.y = offsetY + pos.y * cellSize;
  }

  animate(dt: number): void {
    this.progressTime += dt;
    const progress = Math.min(this.progressTime / this.duration, 1);
    this.scale = 1 - progress;
    this.alpha = 1 - progress;
  }

  isFinished(): boolean {
    return this.progressTime >= this.duration;
  }
}
