// baju.js

// 1. Konfigurasi Firebase (Dikekalkan)
const firebaseConfig = {
  apiKey: "AIzaSyBo3XUE50eWFE9-Azop41J808GD_ovh81I",
  authDomain: "laka-trail-run-2026.firebaseapp.com",
  databaseURL: "https://laka-trail-run-2026-default-rtdb.firebaseio.com",
  projectId: "laka-trail-run-2026",
  storageBucket: "laka-trail-run-2026.firebasestorage.app",
  messagingSenderId: "691422515370",
  appId: "1:691422515370:web:3f0507585e51e77cacc0d3"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// URL Web App Google Apps Script anda
const gasURL = "https://script.google.com/macros/s/AKfycbxo37ypDszt2C2WbqU2O7wHVyjID9pbW2y0PLnkgjCMyFlkT8PCeluuEhqgKXvCAuV5/exec";

// 2. Pengendali Borang Tempahan
document.getElementById('formBaju').addEventListener('submit', async function(e) {
    e.preventDefault();

    const btnHantar = document.getElementById('btnHantar');
    const teksAsal = btnHantar.innerText;
    btnHantar.innerText = "MEMPROSES & MENGHANTAR...";
    btnHantar.disabled = true;
    btnHantar.classList.add('opacity-50', 'cursor-not-allowed');

    try {
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

        let resitUrl = "";

        if (resitFile) {
            // A. Mampatkan Imej (Maksimum 200KB)
            const options = { maxSizeMB: 0.2, maxWidthOrHeight: 1024, useWebWorker: true };
            const compressedFile = await imageCompression(resitFile, options);
            
            // B. Tukar ke Base64
            const base64String = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(compressedFile);
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });

            // C. Hantar ke GAS
            const payloadGAS = {
                action: 'upload_baju', 
                ic: ic,
                nama: nama,
                telefon: telefon,
                jenis_baju: jenis_baju,
                saiz: saiz,
                kuantiti: kuantiti,
                penghantaran: penghantaran,
                alamat: alamat,
                imageB64: base64String.split(',')[1],
                mimeType: base64String.split(';')[0].split(':')[1]
            };

            const response = await fetch(gasURL, {
                method: 'POST',
                body: JSON.stringify(payloadGAS),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
            
            const resultGAS = await response.json();
            if (resultGAS.status === "success" && resultGAS.fileUrl) {
                resitUrl = resultGAS.fileUrl;
            } else {
                throw new Error("Gagal menyimpan resit ke pelayan Google.");
            }
        }

        // Susun data untuk Firebase
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
            status: "Menunggu Pengesahan", 
            tarikh_tempahan: timestamp
        };

        // Simpan ke Firebase
        await db.ref('tempahan_baju/' + ic).set(tempahanData);

        alert("Tempahan berjaya dihantar! Anda boleh menyemak status menggunakan No IC anda dalam masa 24 jam.");
        
        document.getElementById('formBaju').reset();
        if (typeof toggleAlamat === "function") toggleAlamat(false);

    } catch (error) {
        console.error("Ralat:", error);
        alert("Terdapat ralat: " + error.message);
    } finally {
        btnHantar.innerText = teksAsal;
        btnHantar.disabled = false;
        btnHantar.classList.remove('opacity-50', 'cursor-not-allowed');
    }
});
