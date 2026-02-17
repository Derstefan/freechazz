import type { Pos } from '../../engine/core/Pos';
import type { Animation, PieceSnapshot } from '../AnimationSystem';

function smoothStep(t: number): number {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}

export class SwapAnimation implements Animation {
  duration: number;
  progressTime: number = 0;

  readonly piece1: PieceSnapshot; // was at fromPos, moving to toPos
  readonly piece2: PieceSnapshot; // was at toPos, moving to fromPos

  readonly from1X: number;
  readonly from1Y: number;
  readonly to1X: number;
  readonly to1Y: number;

  readonly from2X: number;
  readonly from2Y: number;
  readonly to2X: number;
  readonly to2Y: number;

  // Current interpolated positions
  current1X: number;
  current1Y: number;
  current2X: number;
  current2Y: number;

  constructor(
    piece1: PieceSnapshot,
    piece2: PieceSnapshot,
    fromPos: Pos,
    toPos: Pos,
    cellSize: number,
    offsetX: number,
    offsetY: number,
  ) {
    this.piece1 = piece1;
    this.piece2 = piece2;

    this.from1X = offsetX + fromPos.x * cellSize;
    this.from1Y = offsetY + fromPos.y * cellSize;
    this.to1X = offsetX + toPos.x * cellSize;
    this.to1Y = offsetY + toPos.y * cellSize;

    this.from2X = this.to1X;
    this.from2Y = this.to1Y;
    this.to2X = this.from1X;
    this.to2Y = this.from1Y;

    this.current1X = this.from1X;
    this.current1Y = this.from1Y;
    this.current2X = this.from2X;
    this.current2Y = this.from2Y;

    const dx = this.to1X - this.from1X;
    const dy = this.to1Y - this.from1Y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.duration = 0.3 + dist * 0.002;
  }

  animate(dt: number): void {
    this.progressTime += dt;
    const progress = Math.min(this.progressTime / this.duration, 1);
    const t = smoothStep(progress);

    this.current1X = this.from1X + (this.to1X - this.from1X) * t;
    this.current1Y = this.from1Y + (this.to1Y - this.from1Y) * t;
    this.current2X = this.from2X + (this.to2X - this.from2X) * t;
    this.current2Y = this.from2Y + (this.to2Y - this.from2Y) * t;
  }

  isFinished(): boolean {
    return this.progressTime >= this.duration;
  }
}
