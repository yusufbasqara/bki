// URL dasar dari file PDF yang sudah kamu upload.
// Ganti link Google Drive dengan path lokal ini
const pdfBaseUrl = "assets/pdf/publication.pdf";

// Mengambil elemen-elemen dari halaman HTML untuk dimanipulasi
const listView = document.getElementById('listView');
const pdfView = document.getElementById('pdfView');
const pdfViewer = document.getElementById('pdf-viewer');
const pdfTitle = document.getElementById('pdf-title');

/**
 * Fungsi untuk menampilkan pembaca PDF dan menyembunyikan menu daftar isi.
 * @param {string} chapterTitle - Judul bab yang akan ditampilkan.
 * @param {number} pageNumber - Nomor halaman PDF yang akan dituju.
 */
function showChapter(chapterTitle, pageNumber) {
    // Membuat URL lengkap dengan nomor halaman dan parameter untuk menyembunyikan toolbar PDF
    const fullUrl = `${pdfBaseUrl}#page=${pageNumber}&toolbar=0`;
    
    // Mengubah sumber (src) dari iframe untuk melompat ke halaman yang benar
    pdfViewer.src = fullUrl;
    
    // Memperbarui judul di bagian atas halaman pembaca PDF
    pdfTitle.textContent = chapterTitle;

    // Menukar tampilan: sembunyikan daftar isi, tampilkan pembaca PDF
    listView.classList.add('hidden');
    pdfView.classList.remove('hidden');
    window.scrollTo(0, 0); // Otomatis scroll ke bagian atas halaman
}

/**
 * Fungsi untuk menampilkan kembali menu daftar isi dan menyembunyikan pembaca PDF.
 */
function showList() {
    // Menukar tampilan: tampilkan daftar isi, sembunyikan pembaca PDF
    pdfView.classList.add('hidden');
    listView.classList.remove('hidden');
    
    // Mengosongkan sumber iframe agar berhenti memuat PDF dan menghemat memori
    pdfViewer.src = ""; 
}

/**
 * Fungsi untuk membuka/menutup daftar sub-bab (efek accordion).
 * @param {string} listId - ID dari div yang berisi daftar sub-bab.
 * @param {HTMLElement} button - Tombol bab utama yang diklik.
 */
function toggleSubChapters(listId, button) {
    const subList = document.getElementById(listId);
    const icon = button.querySelector('svg'); // Mengambil ikon panah
    
    // Cek apakah daftar sub-bab sedang tersembunyi atau tidak
    if (subList.classList.contains('hidden')) {
        // Jika tersembunyi, tampilkan dan putar ikon panah ke bawah
        subList.classList.remove('hidden');
        icon.classList.add('rotate-180');
    } else {
        // Jika terlihat, sembunyikan dan kembalikan ikon panah ke atas
        subList.classList.add('hidden');
        icon.classList.remove('rotate-180');
    }
}
