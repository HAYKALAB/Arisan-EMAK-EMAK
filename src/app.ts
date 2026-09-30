import { store } from '@/store';
import { View } from '@/types';
import { renderHome, renderForm, renderDetail, renderRemind, renderReport } from '@/ui/render';

const app = document.getElementById('app')!;
let view: View = { p: 'home' };
let system: 'kocok' | 'urut' = 'kocok';

function go(v: View) {
  view = v;
  render();
  window.scrollTo(0, 0);
}

function render() {
  const arisans = store.getAll();

  switch (view.p) {
    case 'home':
      app.innerHTML = renderHome(arisans);
      break;
    case 'baru':
      app.innerHTML = renderForm(system);
      break;
    case 'det': {
      const arisan = store.get(view.id);
      if (!arisan) { go({ p: 'home' }); return; }
      app.innerHTML = renderDetail(arisan);
      break;
    }
    case 'ingat': {
      const arisan = store.get(view.id);
      if (!arisan) { go({ p: 'home' }); return; }
      app.innerHTML = renderRemind(arisan);
      break;
    }
  }
}

function handleClick(e: MouseEvent) {
  const target = (e.target as HTMLElement).closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action!;
  const arisanId = Number(target.dataset.id);

  switch (action) {
    case 'home':
      go({ p: 'home' });
      break;
    case 'new':
      system = 'kocok';
      go({ p: 'baru' });
      break;
    case 'open':
      go({ p: 'det', id: arisanId });
      break;
    case 'system':
      system = target.dataset.value as 'kocok' | 'urut';
      render(); // re-render form with updated button styles
      break;
    case 'save': {
      const name = (document.getElementById('arisan-name') as HTMLInputElement).value.trim();
      const iuran = parseInt((document.getElementById('arisan-iuran') as HTMLInputElement).value.replace(/\D/g, '')) || 0;
      const lines = (document.getElementById('arisan-anggota') as HTMLTextAreaElement).value.split('\n').map(l => l.trim()).filter(Boolean);
      if (!name || !iuran || lines.length < 2) {
        alert('Isi nama arisan, iuran, dan minimal 2 anggota ya.');
        return;
      }
      const members = lines.map((line, idx) => {
        const parts = line.split(',');
        return {
          id: Date.now() + idx,
          nama: parts[0].trim(),
          hp: (parts[1] || '').trim(),
        };
      });
      const created = store.create({ n: name, i: iuran, s: system, a: members });
      go({ p: 'det', id: created.id });
      break;
    }
    case 'toggle-paid': {
      const checked = (target as HTMLInputElement).checked;
      store.togglePaid(arisanId, arisanId, checked); // note: target.dataset.id is member id
      render();
      break;
    }
    case 'draw':
      store.drawWinner(arisanId);
      render();
      break;
    case 'report': {
      const arisan = store.get(arisanId);
      if (!arisan) return;
      const text = renderReport(arisan);
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      break;
    }
    case 'remind':
      go({ p: 'ingat', id: arisanId });
      break;
    case 'next':
      if (!store.nextRound(arisanId)) {
        if (!store.get(arisanId)?.r.at(-1)?.w) {
          alert('Kocok dulu siapa yang dapat bulan ini.');
        } else {
          alert('Semua anggota sudah dapat. Arisan selesai 🎉');
        }
      } else {
        render();
      }
      break;
    case 'delete':
      if (confirm('Yakin hapus arisan ini? Datanya hilang.')) {
        store.delete(arisanId);
        go({ p: 'home' });
      }
      break;
    case 'backup': {
      const json = store.backup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cadangan-arisan.json';
      a.click();
      URL.revokeObjectURL(url);
      break;
    }
    case 'restore':
      (document.getElementById('restore-file') as HTMLInputElement).click();
      break;
    case 'back':
      go({ p: 'det', id: arisanId });
      break;
  }
}

function handleFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  file.text().then(text => {
    if (store.restore(text)) {
      if (confirm('Data sekarang akan diganti dengan cadangan ini. Lanjut?')) {
        go({ p: 'home' });
      }
    } else {
      alert('File cadangan tidak valid.');
    }
  });
}

document.addEventListener('click', handleClick);
document.getElementById('restore-file')?.addEventListener('change', handleFileChange);

render();