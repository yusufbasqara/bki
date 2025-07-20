// ==== Setup PDF.js & DOM refs ====
const pdfPath     = 'lib/publication.pdf';
let   pdfDoc      = null;

// DOM elements
const listView    = document.getElementById('listView');
const pdfView     = document.getElementById('pdfView');
const pdfTitle    = document.getElementById('pdf-title');
const pdfContainer= document.getElementById('pdfContainer');

// Daftar isi lengkap dengan sub-bab
const toc = [
  {
    title: "Bab 1: Syarat dan Ketentuan Umum",
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
    title: "Bab 2: Klasifikasi",
    page: 14,
    sub: [
      { title: "A. Umum", page: 14 },
      { title: "B. Masa Berlaku Klas", page: 19 },
      { title: "C. Klasifikasi Kapal Bangunan Baru", page: 27 },
      { title: "D. Klasifikasi Kapal dalam Layanan", page: 30 }
    ]
  },
  {
    title: "Bab 3: Survei – Persyaratan Umum",
    page: 44,
    sub: [
      { title: "A. Informasi Umum", page: 44 },
      { title: "B. Survei Mempertahankan Klas", page: 49 },
      { title: "C. Survei Periodik Instalasi Bahan Bakar…", page: 98 },
      { title: "D. Pengukuran Ketebalan", page: 102 }
    ]
  },
  {
    title: "Bab 4: Survei",
    page: 106,
    sub: [
      { title: "I. Persyaratan Tambahan untuk Notasi ESP", page: 106 },
      { title: "II. Persyaratan Tambahan untuk Kapal tanpa Notasi ESP", page: 167 },
      { title: "A.1 Petunjuk Masuk Ruang Tertutup", page: 194 },
      { title: "A.2 Survei Lambung Kapal Baru", page: 199 },
      { title: "A.3 Batasan Pengurangan", page: 226 },
      { title: "A.4 Persyaratan Klas untuk Penambatan Kapal", page: 229 },
      { title: "A.5 Survei Transit Kabel Kedap Air", page: 234 },
      { title: "B. Persyaratan Tambahan Notasi…", page: 240 },
      { title: "C. Survei Gas dan Bahan Bakar", page: 250 },
      { title: "D. Survei…", page: 260 },
      { title: "E.…", page: 270 },
      { title: "F.…", page: 280 },
      { title: "G.…", page: 286 },
      { title: "H.…", page: 290 },
      { title: "B.8 Persyaratan Survei Tahunan…", page: 293 },
      { title: "B.9 Kekuatan Pengamanan Penutup Palka", page: 294 },
      { title: "B.10 Kekuatan Memanjang Penumpu Lambung", page: 294 },
      { title: "B.11 Kriteria Pembaruan untuk Gading…", page: 297 }
    ]
  }
];

/** Bangun daftar isi & handle deep-link/hash */
function renderTOC() {
  const container = document.getElementById('toc-list');
  container.innerHTML = toc.map((chap, i) => {
    const babId = `bab${i+1}`;
    return `
      <div>
        <button data-target="${babId}" onclick="toggleSubChapters('${babId}', this)"
          class="w-full flex justify-between items-center bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded-lg border transition focus:ring-2 focus:ring-blue-500">
          <span class="font-semibold text-left">${chap.title}</span>
          <svg class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div id="${babId}" class="hidden pl-6 mt-2 space-y-1">
          ${chap.sub.map(sub => `
            <button data-goto="${i+1}${sub.title.split(' ')[0].replace(/\D/g,'')}" data-page="${sub.page}"
              onclick="openPDF(this)"
              class="flex items-center w-full text-left py-2 px-3 rounded hover:bg-blue-50 transition whitespace-nowrap">
              <svg class="w-3 h-3 mr-2 text-blue-600" viewBox="0 0 8 8" fill="currentColor">
                <circle cx="4" cy="4" r="4"/>
              </svg>
              ${sub.title}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  const params = new URLSearchParams(window.location.search);
  if (params.has('goto')) handleDeepLink(params.get('goto'));
  else if (window.location.hash) handleHash(window.location.hash.slice(1));
}

/** Accordion toggle */
function toggleSubChapters(babId, btn) {
  const sub = document.getElementById(babId);
  const icon = btn.querySelector('svg');
  const opening = sub.classList.contains('hidden');
  document.querySelectorAll('[id^="bab"]').forEach(el => {
    if (el.id !== babId) {
      el.classList.add('hidden');
      document.querySelector(`button[data-target="${el.id}"] svg`).classList.remove('rotate-180');
    }
  });
  if (opening) {
    sub.classList.remove('hidden'); icon.classList.add('rotate-180'); history.replaceState(null, '', `#${babId}`);
  } else {
    sub.classList.add('hidden'); icon.classList.remove('rotate-180'); history.replaceState(null, '', window.location.pathname);
  }
}

/** Buka PDF.js full-viewer */
function openPDF(btn) {
  const title = btn.textContent.trim();
  const page  = +btn.dataset.page;
  pdfTitle.textContent = title;
  listView.classList.add('hidden');
  pdfView.classList.remove('hidden');

  if (!pdfDoc) {
    pdfjsLib.getDocument(pdfPath).promise.then(doc => {
      pdfDoc = doc;
      renderAllPages(page);
    });
  } else {
    scrollToPage(page);
  }
}

/** Render all pages lazily + scroll to target */
function renderAllPages(targetPage) {
  pdfContainer.innerHTML = '';
  const total = pdfDoc.numPages;
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const div = entry.target;
      const num = +div.dataset.page;
      if (!div.dataset.rendered) {
        const canvas = div.querySelector('canvas');
        pdfDoc.getPage(num).then(page => {
          const vp0 = page.getViewport({ scale: 1 });
          const scale = pdfContainer.clientWidth / vp0.width;
          const vp = page.getViewport({ scale });
          canvas.width = vp.width;
          canvas.height = vp.height;
          page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise.then(() => {
