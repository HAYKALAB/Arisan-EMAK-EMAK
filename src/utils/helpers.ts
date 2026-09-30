export const STORAGE_KEY = 'arisan-v1';

export function loadState(): { g: Arisan[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { g: [] };
  } catch {
    return { g: [] };
  }
}

export function saveState(state: { g: Arisan[] }): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota exceeded, ignore
  }
}

export function formatRupiah(n: number): string {
  return 'Rp' + (n || 0).toLocaleString('id-ID');
}

export function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&', '<': '<', '>': '>', '"': '"', "'": ''' }[c]!));
}

export function toWhatsAppLink(hp: string, text: string): string {
  const clean = hp.replace(/\D/g, '').replace(/^0/, '62');
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}