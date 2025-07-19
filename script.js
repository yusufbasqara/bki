// ========= setup PDF.js =========
const pdfBaseUrl = 'asset/publication.pdf';
let pdfDoc = null;

// DOM references
const listView = document.getElementById('listView');
const pdfView  = document.getElementById('pdfView');
const pdfTitle = document.getElementById('pdf-title');
const canvas   = document.getElementById('pdf-canvas');
const ctx      = canvas.getContext('2d');

// ====== daftar isi data ======
const toc = [
  {
    title: "Bab 1 Syarat dan Ketentuan Umum",
    page: 10,
    sub: [
      { title: "A. Umum", page: 10 },
      { title: "B. Klausul Pemesanan", page: 10 },
      { title: "C. Ruang Lingkup dan Kinerja", page: 11 },
      { title: "D. Kerahasiaan", page: 11 },
      { title: "E. Biaya", page: 12 },
      { title: "F. Pembayaran Nota Debet", page: 12 },
      { title: "G. Kewajiban dan Yurisdiksi", page: 12 },
      { title: "H. Ketidaksepakatan", page: 12 },
      { title: "I. Anti-Suap dan Kepatuhan", page: 12 }
    ]
  },
  {
    title: "Bab 2 Klasifikasi",
    page: 14,
    sub: [
      { title: "A. Umum", page: 14 },
      { title: "B. Masa Berlaku Klas", page: 19 },
      { title: "C. Klasifikasi Kapal Bangunan Baru", page: 27 },
      { title: "D. Klasifikasi Kapal dalam Layanan", page: 30 }
    ]
  },
  {
    title: "Bab 3 Survei – Persyaratan Umum",
    page: 44,
    sub: [
      { title: "A. Informasi Umum", page: 44 },
      { title: "B. Survei Mempertahankan Klas", page: 49 },
      { title: "C. Survei Periodik Instalasi …", page: 98 },
      { title: "D. Pengukuran Ketebalan", page: 102 }
    ]
  },
  {
    title: "Bab 4 Survei",
    page: 106,
    sub: [
      { title: "I. Persyaratan Tambahan untuk Notasi ESP", page: 106 },
      { title: "II. Tambahan untuk Kapal tanpa Notasi ESP", page: 167 },
      { title: "A.1 Petunjuk Masuk Ruang Tertutup", page: 194 },
      { title: "A.2 Survei Lambung Kapal Baru", page: 199 },
      { title: "A.3 Batasan Pengurangan", page: 226 },
      { title: "A.4 Klas Penambatan Kapal", page: 229 },
      { title: "A.5 Survei Transit Kabel Kedap Air", page: 234 }
    ]
  }
];

/** 1) Bangun TOC + cek hash/query */
function renderTOC() {
  const container = document.getElementById('toc-list');
  container.innerHTML = toc.map((chap, i) => {
    const babId = `bab${i+1}`;  // bab1, bab2, …
    return `
      <div>
        <button
          data-target="${babId}"
          onclick="toggleSubChapters('${babId}', this)"
          class="w-full flex justify-between items-center bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded-lg border border-gray-200
                 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span class="font-semibold text-left">${chap.title}</span>
          <svg class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div id="${babId}" class="hidden pl-6 mt-2 space-y-1">
          ${chap.sub.map(sub => {
            // kode goto: 1A, 2B, dst.
            const gotoCode = `${i+1}${sub.title.split(' ')[0].replace(/\D/g,'')}`;
            return `
            <button
              data-goto="${gotoCode}"
              data-page="${sub.page}"
              onclick="showChapterFromButton(this)"
              class="flex items-center w-full text-left py-2 px-3 rounded hover:bg-blue-50 transition whitespace-nowrap"
            >
              <svg class="w-3 h-3 mr-2 text-blue-600 flex-shrink-0" viewBox="0 0 8 8" fill="currentColor">
                <circle cx="4" cy="4" r="4"/>
              </svg>
              ${sub.title}
            </button>`;
          }).join('')}
        </div>
      </div>`;
  }).join('');

  // 2) after render: handle deep-link vs hash
  const params = new URLSearchParams(window.location.search);
  const goto   = params.get('goto');
  const hash   = window.location.hash.substring(1);
  if (goto) {
    handleDeepLink(goto);
  } else if (hash) {
    handleHash(hash);
  }
}

/** Toggle Bab + update hash + ensure single-open */
function toggleSubChapters(babId, btn) {
  const subDiv = document.getElementById(babId);
  const icon   = btn.querySelector('svg');
  const opening = subDiv.classList.contains('hidden');

  if (opening) {
    // tutup semua lainnya
    document.querySelectorAll('[id^="bab"]').forEach(other => {
      if (other.id !== babId && !other.classList.contains('hidden')) {
        const mainBtn = document.querySelector(`button[data-target="${other.id}"]`);
        other.classList.add('hidden');
        mainBtn.querySelector('svg').classList.remove('rotate-180');
      }
    });
    // buka ini
    subDiv.classList.remove('hidden');
    icon.classList.add('rotate-180');
    history.replaceState(null, '', `#${babId}`);
  } else {
    // tutup ini
    subDiv.classList.add('hidden');
    icon.classList.remove('rotate-180');
    history.replaceState(null, '', window.location.pathname);
  }
}

/** panggil showChapter dari tombol sub-bab */
function showChapterFromButton(btn) {
  const title = btn.textContent.trim();
  const page  = parseInt(btn.dataset.page, 10);
  showChapter(title, page);
}

/** Render halaman PDF */
function showChapter(title, pageNum) {
  pdfTitle.textContent = title;
  listView.classList.add('hidden');
  pdfView.classList.remove('hidden');

  const render = num => {
    pdfDoc.getPage(num).then(page => {
      const container = document.querySelector('.pdf-frame-container');
      const vp0 = page.getViewport({ scale: 1 });
      const scale = container.clientWidth / vp0.width;
      const vp = page.getViewport({ scale });
      canvas.width  = vp.width;
      canvas.height = vp.height;
      page.render({ canvasContext: ctx, viewport: vp });
    });
  };

  if (!pdfDoc) {
    pdfjsLib.getDocument(pdfBaseUrl).promise.then(doc => {
      pdfDoc = doc;
      render(pageNum);
    });
  } else {
    render(pageNum);
  }
}

/** deep-link via ?goto=1A,2B… */
function handleDeepLink(code) {
  const btn = document.querySelector(`button[data-goto="${code}"]`);
  if (!btn) return;  
  // buka Bab parent
  const babDiv = btn.closest('div').querySelector('div[id^="bab"]');
  const mainBtn = document.querySelector(`button[data-target="${babDiv.id}"]`);
  toggleSubChapters(babDiv.id, mainBtn);
  // tampilkan PDF
  showChapter(btn.textContent.trim(), parseInt(btn.dataset.page, 10));
}

/** buka accordion berdasar hash (#bab2, #bab3…) */
function handleHash(babId) {
  const mainBtn = document.querySelector(`button[data-target="${babId}"]`);
  if (!mainBtn) return;
  const subDiv = document.getElementById(babId);
  if (subDiv.classList.contains('hidden')) {
    subDiv.classList.remove('hidden');
    mainBtn.querySelector('svg').classList.add('rotate-180');
  }
}

/** tombol Kembali */
function showList() {
  pdfView.classList.add('hidden');
  listView.classList.remove('hidden');
  window.scrollTo(0,0);
}

// inisiasi
document.addEventListener('DOMContentLoaded', renderTOC);
