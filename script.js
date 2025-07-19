// ==== Setup PDF.js & DOM refs ====
const pdfPath     = 'lib/publication.pdf';
let   pdfDoc      = null;

const listView    = document.getElementById('listView');
const pdfView     = document.getElementById('pdfView');
const pdfTitle    = document.getElementById('pdf-title');
const pdfContainer= document.getElementById('pdfContainer');

// Daftar isi data (unchanged)
const toc = [
  { title:"Bab 1 Syarat dan Ketentuan Umum", page:10, sub:[ /* … */ ] },
  { title:"Bab 2 Klasifikasi",                 page:14, sub:[ /* … */ ] },
  { title:"Bab 3 Survei – Persyaratan Umum",     page:44, sub:[ /* … */ ] },
  { title:"Bab 4 Survei",                       page:106,sub:[ /* … */ ] }
];

/** Bangun daftar isi & jalankan deep-link atau hash */
function renderTOC() {
  const container = document.getElementById('toc-list');
  container.innerHTML = toc.map((chap,i) => {
    const babId = `bab${i+1}`;
    return `
      <div>
        <button
          data-target="${babId}"
          onclick="toggleSubChapters('${babId}', this)"
          class="w-full flex justify-between items-center bg-gray-100 hover:bg-gray-200
                 px-4 py-3 rounded-lg border border-gray-200 transition focus:ring-2 focus:ring-blue-500"
        >
          <span class="font-semibold text-left">${chap.title}</span>
          <svg class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div id="${babId}" class="hidden pl-6 mt-2 space-y-1">
          ${chap.sub.map(sub => {
            const code = `${i+1}${sub.title.split(' ')[0].replace(/\D/g,'')}`;
            return `
            <button
              data-goto="${code}"
              data-page="${sub.page}"
              onclick="openPDF(this)"
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

  // deteksi ?goto= atau #babX
  const params = new URLSearchParams(window.location.search);
  if (params.has('goto')) {
    handleDeepLink(params.get('goto'));
  } else if (window.location.hash) {
    handleHash(window.location.hash.slice(1));
  }
}

/** Toggle satu-saja accordion & update hash */
function toggleSubChapters(babId, btn) {
  const subDiv = document.getElementById(babId);
  const icon   = btn.querySelector('svg');
  const opening = subDiv.classList.contains('hidden');

  // tutup semua Bab lain
  document.querySelectorAll('[id^="bab"]').forEach(el => {
    if (el.id !== babId) {
      el.classList.add('hidden');
      document.querySelector(`button[data-target="${el.id}"] svg`).classList.remove('rotate-180');
    }
  });

  if (opening) {
    subDiv.classList.remove('hidden');
    icon.classList.add('rotate-180');
    history.replaceState(null,'', `#${babId}`);
  } else {
    subDiv.classList.add('hidden');
    icon.classList.remove('rotate-180');
    history.replaceState(null,'', window.location.pathname);
  }
}

/** Klik sub-bab → buka PDF.js viewer */
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

/**
 * Render semua halaman dengan lazy‐loading via IntersectionObserver,
 * lalu scroll ke halaman target.
 */
function renderAllPages(targetPage) {
  pdfContainer.innerHTML = '';
  const total = pdfDoc.numPages;

  // siapkan observer untuk lazy‐load
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const wrapper = entry.target;
      const num = parseInt(wrapper.dataset.page, 10);
      if (!wrapper.dataset.rendered) {
        const canvas = wrapper.querySelector('canvas');
        pdfDoc.getPage(num).then(page => {
          const vp0   = page.getViewport({ scale: 1 });
          const scale = pdfContainer.clientWidth / vp0.width;
          const vp    = page.getViewport({ scale });
          canvas.width  = vp.width;
          canvas.height = vp.height;
          page.render({ canvasContext: canvas.getContext('2d'), viewport: vp })
              .promise.then(() => wrapper.dataset.rendered = 'true');
        });
      }
      obs.unobserve(wrapper);
    });
  }, {
    root: pdfContainer,
    rootMargin: '200px 0px',
    threshold: 0.1
  });

  // buat placeholder setiap halaman
  for (let i = 1; i <= total; i++) {
    const wrapper = document.createElement('div');
    wrapper.className = 'pageDiv';
    wrapper.dataset.page = i;
    wrapper.innerHTML = '<canvas></canvas>';
    pdfContainer.appendChild(wrapper);
    observer.observe(wrapper);
  }

  // scroll ke halaman target setelah setup
  scrollToPage(targetPage);
}

/** Scroll ke halaman tertentu */
function scrollToPage(pageNum) {
  const el = document.querySelector(`.pageDiv[data-page="${pageNum}"]`);
  if (el) pdfContainer.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
}

/** Deep-link via ?goto= */
function handleDeepLink(code) {
  const btn = document.querySelector(`button[data-goto="${code}"]`);
  if (!btn) return;
  const parentId = btn.closest('div[id^="bab"]').id;
  toggleSubChapters(parentId, document.querySelector(`button[data-target="${parentId}"]`));
  openPDF(btn);
}

/** Hash routing #babX (tanpa PDF) */
function handleHash(babId) {
  const btn = document.querySelector(`button[data-target="${babId}"]`);
  if (!btn) return;
  const subDiv = document.getElementById(babId);
  subDiv.classList.remove('hidden');
  btn.querySelector('svg').classList.add('rotate-180');
}

/** Kembali ke daftar isi */
function showList() {
  pdfView.classList.add('hidden');
  listView.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// **FALLBACK**: panggil renderTOC baik sebelum maupun setelah DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderTOC);
} else {
  renderTOC();
}
