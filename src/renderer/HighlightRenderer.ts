import type { ActionPos } from '../engine/core/ActionPos';
import type { Pos } from '../engine/core/Pos';
import { getActionHex } from '../engine/actions/ActionColors';

const SELECTED_COLOR = 'rgba(255, 255, 0, 0.4)';
// Uniform base so highlights look identical on light and dark squares
const MOVE_BASE = '#d0ae8b';
const MOVE_COLOR_OWN = [0, 200, 0] as const;
const MOVE_COLOR_ENEMY = [220, 30, 30] as const;

/** Convert hex like '#ef4444' to [r,g,b] tuple. */
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export class HighlightRenderer {
  drawSelected(
    ctx: CanvasRenderingContext2D,
    pos: Pos,
    cellSize: number,
    offsetX: number,
    offsetY: number,
  ): void {
    ctx.fillStyle = SELECTED_COLOR;
    ctx.fillRect(offsetX + pos.x * cellSize, offsetY + pos.y * cellSize, cellSize, cellSize);
  }

  drawPossibleMoves(
    ctx: CanvasRenderingContext2D,
    moves: ActionPos[],
    cellSize: number,
    offsetX: number,
    offsetY: number,
    isOwn: boolean,
    alpha: number = 0.25,
  ): void {
    const [r, g, b] = isOwn ? MOVE_COLOR_OWN : MOVE_COLOR_ENEMY;
    const borderAlpha = Math.min(alpha * 2.2, 0.7);
    const borderWidth = Math.max(2, cellSize * 0.08);

    const dotRadius = cellSize * 0.14;

    for (const move of moves) {
      const x = offsetX + move.x * cellSize;
      const y = offsetY + move.y * cellSize;

      // Uniform base — overwrites the board square so light/dark look the same
      ctx.fillStyle = MOVE_BASE;
      ctx.fillRect(x, y, cellSize, cellSize);

      // Colored tint
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.fillRect(x, y, cellSize, cellSize);

      // Border with more saturation
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${borderAlpha})`;
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(
        x + borderWidth / 2,
        y + borderWidth / 2,
        cellSize - borderWidth,
        cellSize - borderWidth,
      );

      // Colored dot per action type
      const hex = getActionHex(move.tag);
      const [dr, dg, db] = hexToRgb(hex);
      const cx = x + cellSize / 2;
      const cy = y + cellSize / 2;
      const dotAlpha = Math.min(alpha + 0.45, 0.9);

      ctx.beginPath();
      ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${dr}, ${dg}, ${db}, ${dotAlpha})`;
      ctx.fill();

      // Thin dark outline for contrast
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}
