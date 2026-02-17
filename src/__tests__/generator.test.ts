import { describe, it, expect } from 'vitest';
import { SeededRandom } from '../engine/generators/SeededRandom';
import { FormationGenerator } from '../engine/generators/FormationGenerator';
import { PiecePoolGenerator } from '../engine/generators/PiecePoolGenerator';
import { ESize } from '../engine/core/ESize';

describe('SeededRandom', () => {
  it('produces deterministic sequence', () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(42);
    for (let i = 0; i < 100; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it('produces values in [0, 1)', () => {
    const rng = new SeededRandom(123);
    for (let i = 0; i < 1000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('nextInt produces values in range', () => {
    const rng = new SeededRandom(999);
    for (let i = 0; i < 500; i++) {
      const v = rng.nextInt(10);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10);
    }
  });

  it('different seeds produce different sequences', () => {
    const a = new SeededRandom(1);
    const b = new SeededRandom(2);
    let same = true;
    for (let i = 0; i < 10; i++) {
      if (a.next() !== b.next()) same = false;
    }
    expect(same).toBe(false);
  });
});

describe('PiecePoolGenerator', () => {
  it('generates deterministically from same seed', () => {
    const pool1 = new PiecePoolGenerator(42).generate();
    const pool2 = new PiecePoolGenerator(42).generate();

    for (let lvl = 1; lvl <= 5; lvl++) {
      const types1 = pool1.get(lvl);
      const types2 = pool2.get(lvl);
      expect(types1.length).toBe(types2.length);
      for (let i = 0; i < types1.length; i++) {
        expect(types1[i].symbol).toBe(types2[i].symbol);
        expect(types1[i].pieceTypeId.lvl).toBe(types2[i].pieceTypeId.lvl);
      }
    }
  });

  it('generates 5 types per level', () => {
    const pool = new PiecePoolGenerator(77).generate();
    for (let lvl = 1; lvl <= 5; lvl++) {
      expect(pool.get(lvl).length).toBe(5);
    }
  });
});

describe('FormationGenerator', () => {
  it('generates deterministically from same seed and size', () => {
    const f1 = new FormationGenerator(100, ESize.tiny).generate();
    const f2 = new FormationGenerator(100, ESize.tiny).generate();

    expect(f1.kingPos!.equals(f2.kingPos!)).toBe(true);

    const entries1 = Array.from(f1.getPieceTypes());
    const entries2 = Array.from(f2.getPieceTypes());
    expect(entries1.length).toBe(entries2.length);
  });

  it('generates a king', () => {
    const f = new FormationGenerator(200, ESize.small).generate();
    expect(f.kingPos).not.toBeNull();
    expect(f.getKing()).not.toBeNull();
  });

  it('generates different formations for different seeds', () => {
    const f1 = new FormationGenerator(1, ESize.tiny).generate();
    const f2 = new FormationGenerator(2, ESize.tiny).generate();

    const entries1 = Array.from(f1.getPieceTypes());
    const entries2 = Array.from(f2.getPieceTypes());

    // At least some pieces should differ
    let allSame = true;
    const minLen = Math.min(entries1.length, entries2.length);
    for (let i = 0; i < minLen; i++) {
      if (entries1[i][0] !== entries2[i][0]) allSame = false;
    }
    if (entries1.length !== entries2.length) allSame = false;
    expect(allSame).toBe(false);
  });
});
