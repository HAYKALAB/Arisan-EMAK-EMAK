import { Arisan, Member, Round } from '@/types';
import { loadState, saveState, formatRupiah, escapeHtml, toWhatsAppLink } from '@/utils/helpers';

const state = loadState();

function currentRound(a: Arisan): Round {
  return a.r[a.r.length - 1];
}

function memberName(a: Arisan, id: number): string {
  return a.a.find(m => m.id === id)?.nama ?? '-';
}

export const store = {
  getAll(): Arisan[] {
    return state.g;
  },

  get(id: number): Arisan | undefined {
    return state.g.find(a => a.id === id);
  },

  create(data: { n: string; i: number; s: 'kocok' | 'urut'; a: Member[] }): Arisan {
    const firstWinner = data.s === 'urut' ? data.a[0].id : null;
    const newArisan: Arisan = {
      id: Date.now(),
      n: data.n,
      i: data.i,
      s: data.s,
      a: data.a,
      r: [{ w: firstWinner, b: {} }],
    };
    state.g.push(newArisan);
    saveState(state);
    return newArisan;
  },

  delete(id: number): void {
    state.g = state.g.filter(a => a.id !== id);
    saveState(state);
  },

  togglePaid(arisanId: number, memberId: number, paid: boolean): void {
    const a = this.get(arisanId);
    if (!a) return;
    currentRound(a).b[memberId] = paid;
    saveState(state);
  },

  drawWinner(arisanId: number): void {
    const a = this.get(arisanId);
    if (!a || a.s !== 'kocok') return;
    const r = currentRound(a);
    const drawn = a.r.map(x => x.w);
    const candidates = a.a.filter(m => !drawn.includes(m.id));
    if (candidates.length === 0) return;
    r.w = candidates[Math.floor(Math.random() * candidates.length)].id;
    saveState(state);
  },

  nextRound(arisanId: number): boolean {
    const a = this.get(arisanId);
    if (!a) return false;
    const r = currentRound(a);
    if (!r.w) return false;
    if (a.r.length >= a.a.length) return false;

    const nextWinner = a.s === 'urut' ? a.a[a.r.length].id : null;
    a.r.push({ w: nextWinner, b: {} });
    saveState(state);
    return true;
  },

  generateRemindText(arisanId: number): string {
    const a = this.get(arisanId);
    if (!a) return '';
    const r = currentRound(a);
    const winner = r.w ? memberName(a, r.w) : 'belum dikocok';
    const lines = [
      `*${a.n}* putaran ${a.r.length}`,
      `Iuran ${formatRupiah(a.i)} per orang`,
      `Yang dapat: ${winner}`,
      '',
      'Sudah bayar:',
      ...a.a.filter(m => r.b[m.id]).map(m => `- ${m.nama}`),
      '',
      'Belum bayar:',
      ...a.a.filter(m => !r.b[m.id]).map(m => `- ${m.nama}`),
      '',
      `Terkumpul ${formatRupiah(a.a.filter(m => r.b[m.id]).length * a.i)} dari ${formatRupiah(a.a.length * a.i)}`,
    ];
    return lines.join('\n');
  },

  generateWhatsAppRemind(arisanId: number, memberId: number): string | null {
    const a = this.get(arisanId);
    if (!a) return null;
    const m = a.a.find(x => x.id === memberId);
    if (!m?.hp) return null;
    const r = currentRound(a);
    const text = `Halo ${m.nama}, mau ingetin iuran ${a.n} putaran ${a.r.length} sebesar ${formatRupiah(a.i)} ya. Makasih 🙏`;
    return toWhatsAppLink(m.hp, text);
  },

  backup(): string {
    return JSON.stringify(state);
  },

  restore(json: string): boolean {
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed.g)) return false;
      state.g = parsed.g;
      saveState(state);
      return true;
    } catch {
      return false;
    }
  },
};