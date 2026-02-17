import { EPlayer } from '../engine/core/EPlayer';
import { SeededRandom } from '../engine/generators/SeededRandom';

const MAX_LVL = 5;
const CROWN_COLOR = '#fbbf24';
const P1_AURA = 'rgba(0, 200, 50, 0.85)';
const P2_AURA = 'rgba(220, 40, 40, 0.85)';
const GLOW_PAD_RATIO = 0.6;

interface CachedPiece {
  canvas: HTMLCanvasElement;
  size: number;
  pad: number;
}

const cache = new Map<string, CachedPiece>();

function getCacheKey(seed: number, lvl: number, owner: EPlayer, size: number, isKing: boolean): string {
  return `${seed}_${lvl}_${owner}_${size}_${isKing ? 1 : 0}`;
}

/** Number of shape pairs per level (matching Unity: lvl < 4 → 2, else 3) */
export function getShapeCountByLvl(lvl: number): number {
  return lvl < 4 ? 2 : 3;
}

/** Number of bezier segments per contour (matching Unity: lvl < 4 → 2, else 3) */
function getPointsByLvl(lvl: number): number {
  return lvl < 4 ? 2 : 3;
}

/**
 * Generate a random color matching Unity's algorithm:
 * - r,g,b each random [0, 200]
 * - saturation scales with level (higher lvl = more saturated & slightly darker)
 */
function generateRandomColor(rng: SeededRandom, lvl: number): string {
  const saturationMultiplier = lvl / MAX_LVL;

  let r = rng.next() * 200;
  let g = rng.next() * 200;
  let b = rng.next() * 200;

  const average = (r + g + b) / 3;

  // Lerp toward average based on inverse saturation, then darken slightly
  r = lerp(r, average, 1 - saturationMultiplier) * (1 - saturationMultiplier * 0.3);
  g = lerp(g, average, 1 - saturationMultiplier) * (1 - saturationMultiplier * 0.3);
  b = lerp(b, average, 1 - saturationMultiplier) * (1 - saturationMultiplier * 0.3);

  return `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;
}

/**
 * Same algorithm as generateRandomColor but returns numeric {r,g,b} values.
 * Used by ParticleSystem for color extraction without string parsing.
 */
export function generateRandomColorRGB(rng: SeededRandom, lvl: number): { r: number; g: number; b: number } {
  const saturationMultiplier = lvl / MAX_LVL;

  let r = rng.next() * 200;
  let g = rng.next() * 200;
  let b = rng.next() * 200;

  const average = (r + g + b) / 3;

  r = lerp(r, average, 1 - saturationMultiplier) * (1 - saturationMultiplier * 0.3);
  g = lerp(g, average, 1 - saturationMultiplier) * (1 - saturationMultiplier * 0.3);
  b = lerp(b, average, 1 - saturationMultiplier) * (1 - saturationMultiplier * 0.3);

  return { r: Math.floor(r), g: Math.floor(g), b: Math.floor(b) };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Draw a single bezier contour (closed path) on ctx.
 * segments: array of {p0x, p0y, p1x, p1y, p2x, p2y}
 */
function drawBezierContour(
  ctx: CanvasRenderingContext2D,
  segments: { p0x: number; p0y: number; p1x: number; p1y: number; p2x: number; p2y: number }[],
  color: string,
): void {
  if (segments.length === 0) return;

  ctx.beginPath();
  ctx.moveTo(segments[0].p0x, segments[0].p0y);

  for (const seg of segments) {
    ctx.quadraticCurveTo(seg.p1x, seg.p1y, seg.p2x, seg.p2y);
  }

  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

export class PieceRenderer {
  clearCache(): void {
    cache.clear();
  }

  /**
   * Draw a piece. Glow, shapes, and king crown are all pre-baked into a single
   * cached canvas — draw() is one drawImage call with no shadow blur at runtime.
   */
  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    cellSize: number,
    seed: number,
    lvl: number,
    owner: EPlayer,
    isKing: boolean,
    symbol: string,
    alpha: number = 1,
    scale: number = 1,
  ): void {
    const size = Math.floor(cellSize);
    if (size < 2) return;

    const key = getCacheKey(seed, lvl, owner, size, isKing);
    let cached = cache.get(key);
    if (!cached || cached.size !== size) {
      cached = this.renderFull(size, seed, lvl, owner, isKing);
      cache.set(key, cached);
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    if (scale !== 1) {
      const cx = x + cellSize / 2;
      const cy = y + cellSize / 2;
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);
    }

    const { pad } = cached;
    const drawSize = cellSize + pad * 2;
    ctx.drawImage(cached.canvas, x - pad, y - pad, drawSize, drawSize);

    ctx.restore();
  }

  /**
   * Render piece shapes + glow + king crown into a single padded offscreen canvas.
   * Shadow blur only runs here (once), never per-frame.
   */
  private renderFull(size: number, seed: number, lvl: number, owner: EPlayer, isKing: boolean): CachedPiece {
    const shapes = this.renderShapes(size, seed, lvl);

    const pad = Math.ceil(size * GLOW_PAD_RATIO);
    const fullSize = size + pad * 2;

    const canvas = document.createElement('canvas');
    canvas.width = fullSize;
    canvas.height = fullSize;
    const ctx = canvas.getContext('2d')!;

    // Glow passes — shadow blur is expensive but only runs at cache time
    // Kings use player aura (green/red) with stronger blur so they're distinguishable
    const auraColor = owner === EPlayer.P1 ? P1_AURA : P2_AURA;
    ctx.shadowColor = auraColor;
    ctx.shadowBlur = isKing ? size * 0.7 : size * 0.5;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Double shadow pass for intensified glow
    ctx.drawImage(shapes, pad, pad, size, size);
    ctx.drawImage(shapes, pad, pad, size, size);

    // Crisp piece on top without shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.drawImage(shapes, pad, pad, size, size);

    // King crown indicator — yellow, top-left
    if (isKing) {
      ctx.fillStyle = CROWN_COLOR;
      ctx.font = `bold ${Math.floor(size * 0.24)}px serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('\u265A', pad + size * 0.02, pad + size * 0.02);
    }

    return { canvas, size, pad };
  }

  /** Render just the bezier shapes (no glow, no crown) to a size×size canvas. */
  private renderShapes(size: number, seed: number, lvl: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const rng = new SeededRandom(seed);
    const numShapes = getShapeCountByLvl(lvl);
    const numPoints = getPointsByLvl(lvl);

    const padding = size * 0.05;
    const drawSize = size - padding * 2;

    // Draw shadow first (slightly offset, darker, larger)
    ctx.save();
    ctx.translate(padding, padding);

    // Generate all shape data first, then draw shadow + shapes
    const shapesData: { segments: { p0x: number; p0y: number; p1x: number; p1y: number; p2x: number; p2y: number }[]; mirroredSegments: { p0x: number; p0y: number; p1x: number; p1y: number; p2x: number; p2y: number }[]; color: string }[] = [];

    for (let i = 0; i < numShapes; i++) {
      const color = generateRandomColor(rng, lvl);
      const segments: { p0x: number; p0y: number; p1x: number; p1y: number; p2x: number; p2y: number }[] = [];
      const mirroredSegments: { p0x: number; p0y: number; p1x: number; p1y: number; p2x: number; p2y: number }[] = [];

      for (let j = 0; j < numPoints; j++) {
        const p0x = rng.next() * drawSize;
        const p0y = rng.next() * drawSize;
        const p1x = rng.next() * drawSize;
        const p1y = rng.next() * drawSize;
        const p2x = rng.next() * drawSize;
        const p2y = rng.next() * drawSize;

        segments.push({ p0x, p0y, p1x, p1y, p2x, p2y });

        // Mirror horizontally (x → drawSize - x)
        mirroredSegments.push({
          p0x: drawSize - p0x, p0y,
          p1x: drawSize - p1x, p1y,
          p2x: drawSize - p2x, p2y,
        });
      }

      shapesData.push({ segments, mirroredSegments, color });
    }

    // Draw shadow (slightly scaled up, gray translucent)
    ctx.save();
    ctx.translate(drawSize / 2, drawSize / 2);
    ctx.scale(1.04, 1.05);
    ctx.translate(-drawSize / 2, -drawSize / 2);
    for (const shape of shapesData) {
      drawBezierContour(ctx, shape.segments, 'rgba(100,100,100,0.5)');
      drawBezierContour(ctx, shape.mirroredSegments, 'rgba(100,100,100,0.5)');
    }
    ctx.restore();

    // Draw actual colored shapes
    for (const shape of shapesData) {
      drawBezierContour(ctx, shape.segments, shape.color);
      drawBezierContour(ctx, shape.mirroredSegments, shape.color);
    }

    ctx.restore();

    return canvas;
  }
}
