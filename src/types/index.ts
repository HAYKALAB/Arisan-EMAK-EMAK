export interface Member {
  id: number;
  nama: string;
  hp: string;
}

export interface Round {
  w: number | null;           // winner member id
  b: Record<number, boolean>; // paid status by member id
}

export interface Arisan {
  id: number;
  n: string;                  // nama arisan
  i: number;                  // iuran per orang
  s: 'kocok' | 'urut';        // sistem
  a: Member[];                // anggota
  r: Round[];                 // riwayat putaran
}

export type View =
  | { p: 'home' }
  | { p: 'baru' }
  | { p: 'det'; id: number }
  | { p: 'ingat'; id: number };

export const STORAGE_KEY = 'arisan-v1';