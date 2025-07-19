// === Setup PDF.js ===
const pdfBaseUrl = 'lib/publication.pdf';
let pdfDoc = null;

const listView = document.getElementById('listView');
const pdfView  = document.getElementById('pdfView');
const pdfTitle = document.getElementById('pdf-title');
const canvas   = document.getElementById('pdf-canvas');
const ctx      = canvas.getContext('2d');

// === Struktur TOC (Bab level 2 & Sub-bab level 3) ===
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
      // dst...
    ]
  }
];

/** Bangun daftar isi HTML */
function renderTOC() {
  const container = document.getElementById('toc-list');
  container.innerHTML = toc.map((chap, idx) => {
    const subId = `sub-${idx}`;
    return `
      <div>
        <button onclick="toggleSubChapters('${subId}', this)"
          class="w-full flex justify-between items-center bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded-lg border border-gray-200 transition focus:outline-none focus:ring-2 focus:ring-blue-500">
          <span class="font-semibold text-left">${chap.title}</span>
          <svg class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div id="${subId}" class="hidden pl-6 mt-2 space-y-1">
          ${chap.sub.map(sub => `
            <button onclick="showChapter('${sub.title}', ${sub.page})"
              class="flex items-center w-full text-left py-2 px-3 rounded hover:bg-blue-50 transition">
              <svg class="w-3 h-3 mr-2 text-blue-600 flex-shrink-0" viewBox="0 0 8 8" fill="currentColor">
                <circle cx="4" cy="4" r="4"/>
              </svg>
              ${sub.title}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

/** Accordion toggle */
function toggleSubChapters(id, btn) {
  const sub = document.getElementById(id);
  const icon = btn.querySelector('svg');
  sub.classList.toggle('hidden');
  icon.classList.toggle('rotate-180');
}

/** Tampilkan halaman tertentu via PDF.js */
function showChapter(title, pageNum) {
  pdfTitle.textContent = title;
  listView.classList.add('hidden');
  pdfView.classList.remove('hidden');

  // load doc sekali saja
  if (!pdfDoc) {
    pdfjsLib.getDocument(pdfBaseUrl).promise.then(doc => {
      pdfDoc = doc;
      renderPage(pageNum);
    });
  } else {
    renderPage(pageNum);
  }
}

/** Render halaman ke canvas */
function renderPage(num) {
  pdfDoc.getPage(num).then(page => {
    const container = document.querySelector('.pdf-frame-container');
    const viewport0 = page.getViewport({ scale: 1 });
    const scale = container.clientWidth / viewport0.width;
    const viewport = page.getViewport({ scale });
    canvas.width  = viewport.width;
    canvas.height = viewport.height;
    page.render({ canvasContext: ctx, viewport });
  });
}

/** Kembali ke daftar isi */
function showList() {
  listView.classList.remove('hidden');
  pdfView.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', renderTOC);
