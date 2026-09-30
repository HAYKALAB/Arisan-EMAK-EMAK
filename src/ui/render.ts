import { Arisan } from '@/types';
import { formatRupiah, escapeHtml } from '@/utils/helpers';

function btn(label: string, action: string, extra = ''): string {
  return `<button data-action="${action}" ${extra}>${label}</button>`;
}

function btnOutline(label: string, action: string, extra = ''): string {
  return `<button class="outline" data-action="${action}" ${extra}>${label}</button>`;
}

function btnYellow(label: string, action: string, extra = ''): string {
  return `<button class="yellow" data-action="${action}" ${extra}>${label}</button>`;
}

function inputField(id: string, placeholder: string, type = 'text', value = ''): string {
  return `<input id="${id}" type="${type}" placeholder="${placeholder}" value="${escapeHtml(value)}">`;
}

function textareaField(id: string, placeholder: string, value = '', rows = 7): string {
  return `<textarea id="${id}" rows="${rows}" placeholder="${placeholder}">${escapeHtml(value)}</textarea>`;
}

export function renderHome(arisans: Arisan[]): string {
  const list = arisans.length
    ? arisans.map(a => `
        <button class="outline" data-action="open" data-id="${a.id}">
          ${escapeHtml(a.n)}<br>
          <small>Putaran ${a.r.length} dari ${a.a.length}</small>
        </button>`).join('')
    : '<p>Belum ada arisan. Tekan tombol di bawah untuk mulai.</p>';

  return `
    <h1>Arisan Mamah</h1>
    ${list}
    ${btn('+ Buat arisan baru', 'new')}
    ${btnOutline('Simpan cadangan', 'backup')}
    ${btnOutline('Pulihkan cadangan', 'restore')}
    <input type="file" id="restore-file" accept=".json" hidden>
  `;
}

export function renderForm(system: 'kocok' | 'urut'): string {
  return `
    <h1>Arisan baru</p>
    <p>Nama arisan</p>
    ${inputField('arisan-name', 'Contoh: Arisan RT 05')}
    <p>Iuran per orang (Rp)</p>
    ${inputField('arisan-iuran', '100000', 'number')}
    <p>Sistemnya gimana?</p>
    <button id="sys-kocok" class="${system === 'kocok' ? '' : 'outline'}" data-action="system" data-value="kocok">Kocokan (diundi tiap bulan)</button>
    <button id="sys-urut" class="${system === 'urut' ? '' : 'outline'}" data-action="system" data-value="urut">Urut giliran (sesuai daftar)</button>
    <p>Nama anggota, satu baris satu orang. Nomor WA boleh ditulis setelah koma.</p>
    ${textareaField('arisan-anggota', 'Bu Sari, 08123456789\nBu Ani')}
    ${btn('Simpan arisan', 'save')}
    ${btnOutline('Batal', 'home')}
  `;
}

function renderPaidRow(arisan: Arisan, memberId: number, paid: boolean): string {
  const member = arisan.a.find(m => m.id === memberId);
  const name = member ? escapeHtml(member.nama) : '-';
  return `<label class="row"><input type="checkbox" data-action="toggle-paid" data-id="${memberId}" ${paid ? 'checked' : ''}><span>${name}</span></label>`;
}

export function renderDetail(arisan: Arisan): string {
  const r = arisan.r[arisan.r.length - 1];
  const totalMembers = arisan.a.length;
  const paidCount = arisan.a.filter(m => r.b[m.id]).length;
  const winnerName = r.w ? escapeHtml(arisan.a.find(m => m.id === r.w)?.nama ?? '-') : 'Belum dikocok';

  return `
    ${btnOutline('← Kembali', 'home')}
    <h1>${escapeHtml(arisan.n)}</h1>
    <p>Putaran ${arisan.r.length} dari ${totalMembers}, sistem ${arisan.s === 'kocok' ? 'kocokan' : 'urut giliran'}</p>

    <div class="card">
      <small>Yang dapat bulan ini</small>
      <h2>${winnerName}</h2>
      ${arisan.s === 'kocok' && !r.w ? btnYellow('Kocok sekarang', 'draw') : ''}
    </div>

    <h2>Sudah bayar</h2>
    ${arisan.a.map(m => renderPaidRow(arisan, m.id, !!r.b[m.id])).join('')}

    <p><b>Terkumpul ${formatRupiah(paidCount * arisan.i)}</b> dari ${formatRupiah(totalMembers * arisan.i)}<br>
    ${paidCount} dari ${totalMembers} orang sudah bayar</p>

    ${btn('Kirim rekap ke WA', 'report')}
    ${btnYellow('Ingetin yang belum bayar', 'remind')}
    ${btnOutline('Lanjut ke putaran berikutnya', 'next')}
    ${btnOutline('Hapus arisan ini', 'delete')}
  `;
}

export function renderRemind(arisan: Arisan): string {
  const r = arisan.r[arisan.r.length - 1];
  const unpaid = arisan.a.filter(m => !r.b[m.id]);

  if (unpaid.length === 0) {
    return `
      ${btnOutline('← Kembali', 'back', `data-id="${arisan.id}"`)}
      <h1>Belum bayar</h1>
      <p>Semua sudah bayar 🎉</p>
    `;
  }

  return `
    ${btnOutline('← Kembali', 'back', `data-id="${arisan.id}"`)}
    <h1>Belum bayar</h1>
    ${unpaid.map(m => m.hp
      ? `<a class="btn" target="_blank" rel="noopener" href="https://wa.me/${m.hp.replace(/\D/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(`Halo ${m.nama}, mau ingetin iuran ${arisan.n} putaran ${arisan.r.length} sebesar ${formatRupiah(arisan.i)} ya. Makasih 🙏`)}">Ingetin ${escapeHtml(m.nama)}</a>`
      : `<p class="row">${escapeHtml(m.nama)} (belum ada nomor WA)</p>`
    ).join('')}
  `;
}

export function renderReport(arisan: Arisan): string {
  const r = arisan.r[arisan.r.length - 1];
  const paid = arisan.a.filter(m => r.b[m.id]);
  const unpaid = arisan.a.filter(m => !r.b[m.id]);
  const winner = r.w ? arisan.a.find(m => m.id === r.w)?.nama ?? '-' : 'belum dikocok';

  const lines = [
    `*${arisan.n}* putaran ${arisan.r.length}`,
    `Iuran ${formatRupiah(arisan.i)} per orang`,
    `Yang dapat: ${winner}`,
    '',
    'Sudah bayar:',
    ...(paid.length ? paid.map(m => `- ${m.nama}`) : ['-']),
    '',
    'Belum bayar:',
    ...(unpaid.length ? unpaid.map(m => `- ${m.nama}`) : ['-']),
    '',
    `Terkumpul ${formatRupiah(paid.length * arisan.i)} dari ${formatRupiah(arisan.a.length * arisan.i)}`,
  ];

  return lines.join('\n');
}