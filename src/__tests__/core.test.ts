import { describe, it, expect } from 'vitest';
import { Pos } from '../engine/core/Pos';
import { ActionPos } from '../engine/core/ActionPos';
import { EPlayer, getOpponent } from '../engine/core/EPlayer';
import { ESize } from '../engine/core/ESize';

describe('Pos', () => {
  it('constructs with x and y', () => {
    const p = new Pos(3, 7);
    expect(p.x).toBe(3);
    expect(p.y).toBe(7);
  });

  it('equals compares correctly', () => {
    const a = new Pos(1, 2);
    const b = new Pos(1, 2);
    const c = new Pos(3, 4);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });

  it('minus computes difference', () => {
    const a = new Pos(5, 10);
    const b = new Pos(2, 3);
    const result = a.minus(b);
    expect(result.x).toBe(3);
    expect(result.y).toBe(7);
  });

  it('plus computes sum', () => {
    const a = new Pos(1, 2);
    const b = new Pos(3, 4);
    const result = a.plus(b);
    expect(result.x).toBe(4);
    expect(result.y).toBe(6);
  });

  it('invertY negates y', () => {
    const p = new Pos(3, 5);
    const inv = p.invertY();
    expect(inv.x).toBe(3);
    expect(inv.y).toBe(-5);
  });

  it('key and fromKey roundtrip', () => {
    const p = new Pos(7, 13);
    const key = p.key;
    const restored = Pos.fromKey(key);
    expect(restored.x).toBe(7);
    expect(restored.y).toBe(13);
  });

  it('copy creates independent instance', () => {
    const p = new Pos(2, 3);
    const c = p.copy();
    expect(c.equals(p)).toBe(true);
    expect(c).not.toBe(p);
  });

  it('getPosAround returns 8 neighbors', () => {
    const p = new Pos(5, 5);
    const around = p.getPosAround();
    expect(around.length).toBe(8);
  });
});

describe('ActionPos', () => {
  it('extends Pos with tag', () => {
    const ap = new ActionPos(1, 2, 'M');
    expect(ap.x).toBe(1);
    expect(ap.y).toBe(2);
    expect(ap.tag).toBe('M');
  });

  it('copy preserves tag', () => {
    const ap = new ActionPos(3, 4, 'A');
    const c = ap.copy();
    expect(c.tag).toBe('A');
    expect(c.x).toBe(3);
    expect(c.y).toBe(4);
  });
});

describe('EPlayer', () => {
  it('getOpponent returns opposite', () => {
    expect(getOpponent(EPlayer.P1)).toBe(EPlayer.P2);
    expect(getOpponent(EPlayer.P2)).toBe(EPlayer.P1);
  });
});

describe('ESize', () => {
  it('has correct dimensions', () => {
    expect(ESize.tiny.width).toBe(10);
    expect(ESize.tiny.height).toBe(10);
    expect(ESize.small.width).toBe(15);
    expect(ESize.medium.width).toBe(20);
    expect(ESize.big.width).toBe(30);
  });
});
