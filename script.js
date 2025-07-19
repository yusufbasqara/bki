// === Setup PDF.js ===
const pdfBaseUrl = 'lib/publication.pdf';
let pdfDoc = null;

// DOM elements
const listView = document.getElementById('listView');
const pdfView  = document.getElementById('pdfView');
const pdfTitle = document.getElementById('pdf-title');
const canvas   = document.getElementById('pdf-canvas');
const ctx      = canvas.getContext('2d');

// === Full TOC ===
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
      { title: "A.5 Survei Transit Kabel Kedap Air", page: 234 },
      { title: "B. Persyaratan Tambahan Notasi…", page: 240 },
      { title: "C. Survei Gas dan Bahan Bakar", page: 250 },
      { title: "D. Survei …", page: 260 },
      { title: "E. …", page: 270 },
      { title: "F. …", page: 280 },
      { title: "G. …", page: 286 },
      { title: "H. …", page: 290 },
      { title: "B.8 Persyaratan Survei Tahunan…", page: 293 },
      { title: "B.9 Kekuatan Pengamanan Penutup Palka", page: 294 },
      { title: "B.10 Kekuatan Memanjang Penumpu Lambung", page: 294 },
      { title: "B.11 Kriteria Pembaruan untuk Gading…", page: 297 }
    ]
  }
];

/** Bangun daftar isi dan jalankan deep-link handler */
function renderTOC() {
  const container = document.getElementById('toc-list');
  container.innerHTML = toc.map((chap, i) => {
    const subId = `sub-${i}`;
    return `
      <div>
        <button
          data-target="${subId}"
          onclick="toggleSubChapters('${subId}', this)"
          class="w-full flex justify-between items-center bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded-lg border border-gray-200 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span class="font-semibold text-left">${chap.title}</span>
          <svg class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div id="${subId}" class="hidden pl-6 mt-2 space-y-1">
          ${chap.sub.map(sub => {
            // kode seperti "1A", "2B", dst
            const code = `${i+1}${sub.title.split(' ')[0].replace(/\D/g,'')}`;
            return `
            <button
              data-goto="${code}"
              data-page="${sub.page}"
              onclick="showChapter('${sub.title}', ${sub.page})"
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

  // Jika ada param goto, jalankan deep-link
  const params = new URLSearchParams(window.location.search);
  const goto  = params.get('goto');
  if (goto) handleDeepLink(goto);
}

/** Toggle accordion */
function toggleSubChapters(id, btn) {
  const sub = document.getElementById(id);
  const icon = btn.querySelector('svg');
  sub.classList.toggle('hidden');
  icon.classList.toggle('rotate-180');
}

/** Tampilkan halaman via PDF.js */
function showChapter(title, pageNum) {
  pdfTitle.textContent = title;
  listView.classList.add('hidden');
  pdfView.classList.remove('hidden');

  const renderPage = num => {
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
      renderPage(pageNum);
    });
  } else {
    renderPage(pageNum);
  }
}

/** Kembali ke daftar isi */
function showList() {
  pdfView.classList.add('hidden');
  listView.classList.remove('hidden');
  // scroll ke atas utk UX
  window.scrollTo(0,0);
}

/** Deep-link: buka accordion & panggil showChapter */
function handleDeepLink(code) {
  const subBtn = document.querySelector(`button[data-goto="${code}"]`);
  if (!subBtn) return;       // invalid code → tetap listView

  // buka accordion parent
  const subContainer = subBtn.parentElement;
  if (subContainer.classList.contains('hidden')) {
    const mainBtn = document.querySelector(`button[data-target="${subContainer.id}"]`);
    toggleSubChapters(subContainer.id, mainBtn);
  }

  // parse page + tampilkan
  const page = parseInt(subBtn.dataset.page, 10);
  showChapter(subBtn.textContent.trim(), page);
}

// Jalankan saat load
document.addEventListener('DOMContentLoaded', renderTOC);
