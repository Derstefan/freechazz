export interface BoardSize {
  width: number;
  height: number;
  name: string;
}

export const ESize = {
  tiny: { width: 10, height: 10, name: 'tiny' } as BoardSize,
  small: { width: 15, height: 15, name: 'small' } as BoardSize,
  medium: { width: 20, height: 20, name: 'medium' } as BoardSize,
  big: { width: 30, height: 30, name: 'big' } as BoardSize,
  huge: { width: 50, height: 33, name: 'huge' } as BoardSize,
  massive: { width: 100, height: 50, name: 'massive' } as BoardSize,
  gigantic: { width: 500, height: 200, name: 'gigantic' } as BoardSize,
} as const;

export type ESizeName = keyof typeof ESize;
