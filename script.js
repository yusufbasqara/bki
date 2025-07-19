// Path ke PDF
const pdfBaseUrl = "asset/publication.pdf";

// Struktur TOC diambil dari metadata PDF (level 2 = Bab, level 3 = Sub-bab)
const toc = [
  {
    "title": "Bab 1 Syarat dan Ketentuan Umum",
    "page": 10,
    "sub": [
      { "title": "A. Umum", "page": 10 },
      { "title": "B. Klausul Pemesanan", "page": 10 },
      { "title": "C. Ruang Lingkup dan Kinerja", "page": 11 },
      { "title": "D. Kerahasiaan", "page": 11 },
      { "title": "E. Biaya", "page": 12 },
      { "title": "F. Pembayaran Nota Debet", "page": 12 },
      { "title": "G. Kewajiban dan Yurisdiksi", "page": 12 },
      { "title": "H. Ketidaksepakatan", "page": 12 },
      { "title": "I. Anti-Suap dan Kepatuhan", "page": 12 }
    ]
  },
  {
    "title": "Bab 2 Klasifikasi",
    "page": 14,
    "sub": [
      { "title": "A. Umum", "page": 14 },
      { "title": "B. Masa Berlaku Klas", "page": 19 },
      { "title": "C. Klasifikasi Kapal Bangunan Baru", "page": 27 },
      { "title": "D. Klasifikasi Kapal setelah Konstruksi (Kapal dalam Layanan)", "page": 30 }
    ]
  },
  {
    "title": "Bab 3 Survei – Persyaratan Umum",
    "page": 44,
    "sub": [
      { "title": "A. Informasi Umum", "page": 44 },
      { "title": "B. Survei Mempertahankan Klas", "page": 49 },
      { "title": "C. Survei Periodik Instalasi …", "page": 98 },
      { "title": "D. Pengukuran Ketebalan", "page": 102 }
    ]
  },
  {
    "title": "Bab 4 Survei",
    "page": 106,
    "sub": [
      { "title": "I. Persyaratan Tambahan untuk Kapal dengan Notasi ESP", "page": 106 },
      { "title": "II. Persyaratan Tambahan untuk Kapal yang tidak dikenakan Notasi ESP", "page": 167 },
      { "title": "A.1 Petunjuk Masuk Ruang Tertutup", "page": 194 },
      { "title": "A.2 Survei lambung untuk Konstruksi Kapal Baru", "page": 199 },
      { "title": "A.3 Batasan Pengurangan", "page": 226 },
      { "title": "A.4 Persyaratan Klas untuk Penambatan Kapal", "page": 229 },
      { "title": "A.5 Survei Transit Kabel Kedap Air", "page": 234 },
      { "title": "B. Persyaratan Tambahan Notasi…", "page": 240 },
      { "title": "C. Survei Gas dan Bahan Bakar", "page": 250 },
      { "title": "D. Survei …", "page": 260 },
      { "title": "E. …", "page": 270 },
      { "title": "F. …", "page": 280 },
      { "title": "G. …", "page": 286 },
      { "title": "H. …", "page": 290 },
      { "title": "B.8 Persyaratan Survei Tahunan…", "page": 293 },
      { "title": "B.9 Kekuatan Pengamanan Penutup Palka", "page": 294 },
      { "title": "B.10 Kekuatan Memanjang Penumpu Lambung", "page": 294 },
      { "title": "B.11 Kriteria Pembaruan untuk Gading…", "page": 297 }
    ]
  }
];

/** Render TOC ke #toc-list */
function renderTOC() {
  const container = document.getElementById('toc-list');
  let html = '';
  toc.forEach((chap, idx) => {
    const subId = `sub-${idx}`;
    html += `
      <div>
        <button onclick="toggleSubChapters('${subId}', this)"
          class="w-full flex justify-between items-center bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded-lg border border-gray-200 transition focus:outline-none focus:ring-2 focus:ring-blue-500">
          <span class="font-semibold">${chap.title}</span>
          <svg class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div id="${subId}" class="hidden pl-6 mt-2 space-y-1">
          ${chap.sub.map(sub =>
            `<button onclick="showChapter('${sub.title}', ${sub.page})"
              class="block w-full text-left py-2 px-3 rounded hover:bg-blue-50 transition">
              ${sub.title}
            </button>`).join('')}
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

/**
 * Toggle accordion sub-bab
 */
function toggleSubChapters(listId, btn) {
  const sub = document.getElementById(listId);
  const icon = btn.querySelector('svg');
  if (sub.classList.contains('hidden')) {
    sub.classList.remove('hidden');
    icon.classList.add('rotate-180');
  } else {
    sub.classList.add('hidden');
    icon.classList.remove('rotate-180');
  }
}

/**
 * Load PDF & lompat ke halaman, lalu tampilkan viewer
 */
function showChapter(chapterTitle, pageNumber) {
  const viewer = document.getElementById('pdf-viewer');
  const titleEl = document.getElementById('pdf-title');
  viewer.src = `${pdfBaseUrl}#page=${pageNumber}&toolbar=0`;
  titleEl.textContent = chapterTitle;
  document.getElementById('listView').classList.add('hidden');
  document.getElementById('pdfView').classList.remove('hidden');
  window.scrollTo(0,0);
}

/** Kembali ke daftar isi */
function showList() {
  document.getElementById('pdf-viewer').src = '';
  document.getElementById('pdfView').classList.add('hidden');
  document.getElementById('listView').classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', renderTOC);
