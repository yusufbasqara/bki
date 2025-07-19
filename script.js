// === Setup PDF.js ===
const pdfBaseUrl = 'lib/publication.pdf';
let pdfDoc = null;

const listView = document.getElementById('listView');
const pdfView  = document.getElementById('pdfView');
const pdfTitle = document.getElementById('pdf-title');
const canvas   = document.getElementById('pdf-canvas');
const ctx      = canvas.getContext('2d');

// === Struktur TOC ===
const toc = [
  {
    title: "Bab 1 Syarat dan Ketentuan Umum",
    page: 10,
    sub: [
      { title: "A. Umum",       pages: 10 },
      { title: "B. Klausul Pemesanan", page: 10 },
      { title: "C. Ruang Lingkup dan Kinerja", page: 11 },
      /* dst… */
    ]
  },
  {
    title: "Bab 2 Klasifikasi",
    page: 14,
    sub: [
      { title: "A. Umum",            page: 14 },
      { title: "B. Masa Berlaku Klas", page: 19 },
      /* dst… */
    ]
  },
  /* dst Bab 3, Bab 4… */
];

/** Bangun TOC dengan data-attributes */
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
            // generate kode goto: e.g. "2B", "1A", "4A1"
            const code = `${i+1}${sub.title.split(' ')[0].replace(/\./g,'')}`;
            return `
            <button
              data-goto="${code}"
              data-page="${sub.page}"
              onclick="showChapter('${sub.title}', ${sub.page})"
              class="flex items-center w-full text-left py-2 px-3 rounded hover:bg-blue-50 transition"
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

  // setelah TOC ter-render, cek deep-link
  handleDeepLink();
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

  const renderPage = (num) => {
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
}

/** Deep-link handler */
function handleDeepLink() {
  const params = new URLSearchParams(window.location.search);
  const goto   = params.get('goto');
  if (!goto) return;

  // cari tombol sub-bab yg cocok
  const subBtn = document.querySelector(`button[data-goto="${goto}"]`);
  if (!subBtn) return;

  // buka accordion parent jika tertutup
  const subContainer = subBtn.parentElement;
  if (subContainer.classList.contains('hidden')) {
    const mainBtn = document.querySelector(`button[data-target="${subContainer.id}"]`);
    toggleSubChapters(subContainer.id, mainBtn);
  }

  // simulasikan klik: tampilkan PDF
  const page = parseInt(subBtn.dataset.page, 10);
  showChapter(subBtn.textContent.trim(), page);
}

// render TOC saat DOM siap
document.addEventListener('DOMContentLoaded', renderTOC);
