/**
 * Mulberry32 PRNG - deterministic, fast, 32-bit
 * Not compatible with java.util.Random, but internally consistent.
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0;
  }

  /** Returns a number in [0, 1) */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns a number in [0, bound) */
  nextInt(bound: number): number {
    return Math.floor(this.next() * bound);
  }

  /** Returns a long-like number for seeding child PRNGs */
  nextLong(): number {
    const hi = (this.next() * 0x100000000) | 0;
    const lo = (this.next() * 0x100000000) | 0;
    return hi * 0x100000000 + (lo >>> 0);
  }

  nextDouble(): number {
    return this.next();
  }
}
