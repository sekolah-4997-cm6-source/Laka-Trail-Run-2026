// baju.js

// 1. Konfigurasi Firebase (Ganti dengan maklumat projek Firebase anda)
const firebaseConfig = {
  apiKey: "AIzaSyBo3XUE50eWFE9-Azop41J808GD_ovh81I",
  authDomain: "laka-trail-run-2026.firebaseapp.com",
  databaseURL: "https://laka-trail-run-2026-default-rtdb.firebaseio.com",
  projectId: "laka-trail-run-2026",
  storageBucket: "laka-trail-run-2026.firebasestorage.app",
  messagingSenderId: "691422515370",
  appId: "1:691422515370:web:3f0507585e51e77cacc0d3"
};

// Inisialisasi Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// 2. Konfigurasi API ImgBB (Daftar percuma di api.imgbb.com untuk dapatkan kunci)
// Ini adalah cara paling pantas dan selamat untuk terima gambar dari pengguna awam
const IMGBB_API_KEY = "LETAK_API_KEY_IMGBB_ANDA_DI_SINI";

// 3. Pengendali Borang Tempahan
document.getElementById('formBaju').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Kawalan UI: Tukar butang semasa proses menghantar
    const btnHantar = document.getElementById('btnHantar');
    const teksAsal = btnHantar.innerText;
    btnHantar.innerText = "SEDANG MENGHANTAR...";
    btnHantar.disabled = true;
    btnHantar.classList.add('opacity-50', 'cursor-not-allowed');

    try {
        // Ambil data dari input HTML
        const nama = document.getElementById('nama').value.trim();
        const ic = document.getElementById('ic').value.trim();
        const telefon = document.getElementById('telefon').value.trim();
        const jenis_baju = document.getElementById('jenis_baju').value;
        const saiz = document.getElementById('saiz').value;
        const kuantiti = document.getElementById('kuantiti').value;
        const penghantaran = document.querySelector('input[name="penghantaran"]:checked').value;
        const alamat = document.getElementById('alamat').value.trim() || "Tiada (Ambil Sendiri)";
        const resitFile = document.getElementById('resit').files[0];
        const timestamp = new Date().toISOString();

        // Muat Naik Resit ke ImgBB
        let resitUrl = "";
        if (resitFile) {
            const formData = new FormData();
            formData.append('image', resitFile);
            
            const uploadResponse = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: 'POST',
                body: formData
            });
            const uploadResult = await uploadResponse.json();
            
            if (uploadResult.success) {
                resitUrl = uploadResult.data.url;
            } else {
                throw new Error("Gagal memuat naik resit. Sila cuba lagi.");
            }
        }

        // Susun objek data untuk Firebase
        const tempahanData = {
            nama: nama,
            ic: ic,
            telefon: telefon,
            jenis_baju: jenis_baju,
            saiz: saiz,
            kuantiti: kuantiti,
            penghantaran: penghantaran,
            alamat: alamat,
            resit_url: resitUrl,
            status: "Menunggu Pengesahan", // Status awal untuk admin semak nanti
            tarikh_tempahan: timestamp
        };

        // Simpan ke Firebase menggunakan No Kad Pengenalan sebagai ID Unik (Key)
        // Ini akan sangat memudahkan Fasa 3 nanti untuk carian status
        await db.ref('tempahan_baju/' + ic).set(tempahanData);

        // Maklum balas kejayaan
        alert("Tempahan berjaya dihantar! Anda boleh menyemak status dalam masa 24 jam.");
        
        // Reset borang
        document.getElementById('formBaju').reset();
        if (typeof toggleAlamat === "function") {
            toggleAlamat(false);
        }

    } catch (error) {
        console.error("Ralat Penghantaran:", error);
        alert("Terdapat ralat: " + error.message);
    } finally {
        // Kembalikan keadaan butang seperti asal jika gagal atau berjaya
        btnHantar.innerText = teksAsal;
        btnHantar.disabled = false;
        btnHantar.classList.remove('opacity-50', 'cursor-not-allowed');
    }
});
