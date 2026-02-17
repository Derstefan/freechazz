import Matter from 'matter-js';
import { SeededRandom } from '../engine/generators/SeededRandom';
import { getShapeCountByLvl, generateRandomColorRGB } from './PieceRenderer';

function getPointsByLvl(lvl: number): number {
  return lvl < 4 ? 2 : 3;
}

const FADE_DURATION = 1.5;
const PHYSICS_STEP = 16.667; // ms — fixed ~60 Hz timestep

interface Seg {
  p0x: number; p0y: number;
  p1x: number; p1y: number;
  p2x: number; p2y: number;
}

interface Fragment {
  body: Matter.Body;
  canvas: HTMLCanvasElement;
  hw: number; // half-width for centering
  hh: number; // half-height for centering
  lifetime: number;
}

/**
 * Physics-based destruction that shatters a piece into its actual bezier shapes.
 * Each contour becomes a separate Matter.js rigid body with its own pre-rendered canvas.
 * Only active while fragments exist — zero cost when idle.
 */
export class ParticleSystem {
  private engine: Matter.Engine;
  private fragments: Fragment[] = [];
  private accumulator: number = 0;

  constructor() {
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0.3, scale: 0.001 },
    });
  }

  /**
   * Shatter a piece at (cx, cy) into its constituent bezier shapes.
   * Replays the exact RNG sequence from PieceRenderer to extract shape contours,
   * renders each to a tiny offscreen canvas, and launches them as rigid bodies.
   */
  spawn(cx: number, cy: number, seed: number, lvl: number, cellSize: number): void {
    const s = cellSize / 50; // velocity scale factor
    const padding = cellSize * 0.05;
    const drawSize = cellSize - padding * 2;

    const rng = new SeededRandom(seed);
    const numShapes = getShapeCountByLvl(lvl);
    const numPoints = getPointsByLvl(lvl);

    // Cell top-left in world coords
    const cellX = cx - cellSize / 2;
    const cellY = cy - cellSize / 2;

    for (let i = 0; i < numShapes; i++) {
      // generateRandomColorRGB consumes 3 rng.next() — matching PieceRenderer
      const col = generateRandomColorRGB(rng, lvl);
      const color = `rgb(${col.r},${col.g},${col.b})`;

      const segs: Seg[] = [];
      const mirSegs: Seg[] = [];

      for (let j = 0; j < numPoints; j++) {
        const p0x = rng.next() * drawSize;
        const p0y = rng.next() * drawSize;
        const p1x = rng.next() * drawSize;
        const p1y = rng.next() * drawSize;
        const p2x = rng.next() * drawSize;
        const p2y = rng.next() * drawSize;

        segs.push({ p0x, p0y, p1x, p1y, p2x, p2y });
        mirSegs.push({
          p0x: drawSize - p0x, p0y,
          p1x: drawSize - p1x, p1y,
          p2x: drawSize - p2x, p2y,
        });
      }

      this.addShapeFragment(segs, color, padding, cellX, cellY, cx, cy, s);
      this.addShapeFragment(mirSegs, color, padding, cellX, cellY, cx, cy, s);
    }
  }

  private addShapeFragment(
    segments: Seg[],
    color: string,
    padding: number,
    cellX: number,
    cellY: number,
    centerX: number,
    centerY: number,
    scaleFactor: number,
  ): void {
    if (segments.length === 0) return;

    // Bounding box of all control points (+ 1px AA margin)
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const seg of segments) {
      minX = Math.min(minX, seg.p0x, seg.p1x, seg.p2x);
      minY = Math.min(minY, seg.p0y, seg.p1y, seg.p2y);
      maxX = Math.max(maxX, seg.p0x, seg.p1x, seg.p2x);
      maxY = Math.max(maxY, seg.p0y, seg.p1y, seg.p2y);
    }
    minX -= 1; minY -= 1;
    maxX += 1; maxY += 1;

    const cw = Math.ceil(maxX - minX);
    const ch = Math.ceil(maxY - minY);
    if (cw < 1 || ch < 1) return;

    // Render contour to a tiny canvas
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d')!;

    ctx.translate(-minX, -minY);
    ctx.beginPath();
    ctx.moveTo(segments[0].p0x, segments[0].p0y);
    for (const seg of segments) {
      ctx.quadraticCurveTo(seg.p1x, seg.p1y, seg.p2x, seg.p2y);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // World position of shape center
    const shapeCx = cellX + padding + (minX + maxX) / 2;
    const shapeCy = cellY + padding + (minY + maxY) / 2;
    const hw = cw / 2;
    const hh = ch / 2;

    // 2 duplicates per shape — same canvas, different trajectories
    for (let d = 0; d < 2; d++) {
      const scatter = 3 * scaleFactor;
      const bx = shapeCx + (Math.random() - 0.5) * scatter;
      const by = shapeCy + (Math.random() - 0.5) * scatter;

      const body = Matter.Bodies.rectangle(bx, by, cw, ch, {
        frictionAir: 0.008,
        restitution: 0.3,
        collisionFilter: { group: -1 },
      });

      // Radial burst outward from piece center
      const dx = bx - centerX;
      const dy = by - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const speed = (3 + Math.random() * 6) * scaleFactor;

      Matter.Body.setVelocity(body, {
        x: (dx / dist) * speed + (Math.random() - 0.5) * 3 * scaleFactor,
        y: (dy / dist) * speed - 2 * scaleFactor,
      });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.4);

      Matter.Composite.add(this.engine.world, body);

      this.fragments.push({
        body,
        canvas,
        hw, hh,
        lifetime: 2.5 + Math.random() * 2.5,
      });
    }
  }

  /** Step physics (fixed timestep) and remove expired fragments. */
  update(dt: number): void {
    if (this.fragments.length === 0) return;

    this.accumulator += dt * 1000;
    if (this.accumulator > 100) this.accumulator = 100;

    while (this.accumulator >= PHYSICS_STEP) {
      Matter.Engine.update(this.engine, PHYSICS_STEP);
      this.accumulator -= PHYSICS_STEP;
    }

    for (let i = this.fragments.length - 1; i >= 0; i--) {
      this.fragments[i].lifetime -= dt;
      if (this.fragments[i].lifetime <= 0) {
        Matter.Composite.remove(this.engine.world, this.fragments[i].body);
        this.fragments.splice(i, 1);
      }
    }
  }

  /** Draw all active fragments. Uses setTransform batching for minimal overhead. */
  draw(ctx: CanvasRenderingContext2D): void {
    if (this.fragments.length === 0) return;

    ctx.save();
    const dpr = window.devicePixelRatio || 1;

    for (const frag of this.fragments) {
      const { body, canvas, hw, hh, lifetime } = frag;
      const alpha = lifetime < FADE_DURATION ? lifetime / FADE_DURATION : 1;
      if (alpha < 0.01) continue;

      ctx.globalAlpha = alpha;

      const cos = Math.cos(body.angle);
      const sin = Math.sin(body.angle);
      ctx.setTransform(
        cos * dpr, sin * dpr,
        -sin * dpr, cos * dpr,
        body.position.x * dpr, body.position.y * dpr,
      );
      ctx.drawImage(canvas, -hw, -hh);
    }
    ctx.restore();
  }

  hasActiveParticles(): boolean {
    return this.fragments.length > 0;
  }
}
