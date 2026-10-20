// baju.js (Kemas Kini untuk Multiple Order & Kira Total)

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

// URL Web App Google Apps Script anda (Pastikan URL ini tepat)
const gasURL = "https://script.google.com/macros/s/AKfycbxo37ypDszt2C2WbqU2O7wHVyjID9pbW2y0PLnkgjCMyFlkT8PCeluuEhqgKXvCAuV5/exec";

// ==========================================
// A. LOGIK UI DINAMIK (TAMBAH/BUANG BAJU)
// ==========================================
const container = document.getElementById('containerItemBaju');
const btnTambah = document.getElementById('btnTambahBaju');
const displayTotal = document.getElementById('displayTotal');

// Harga rujukan
const pricesBase = { "Roundneck Pendek": 32, "Roundneck Panjang": 36, "Berkolar Pendek": 35, "Berkolar Panjang": 39, "Muslimah": 45 };
const pricesExtraSaiz = { "4XL": 3, "5XL": 6 };

// Fungsi untuk kemas kini paparan butang 'Buang' dan Kira Total
function updateUI() {
    // 1. Urus Butang Buang
    const rows = container.getElementsByClassName('rowBaju');
    for (let i = 0; i < rows.length; i++) {
        const buangBtn = rows[i].querySelector('.btnBuangItem');
        if (rows.length === 1) {
            buangBtn.classList.add('hidden');
        } else {
            buangBtn.classList.remove('hidden');
        }
    }
    
    // 2. Kira Total Perlu Dibayar
    let subTotalBaju = 0;
    
    for (let row of rows) {
        const jenis = row.querySelector('.fieldJenis').value;
        const saiz = row.querySelector('.fieldSaiz').value;
        const kuantitiText = row.querySelector('.fieldKuantiti').value;
        const kuantiti = parseInt(kuantitiText, 10) || 0;

        if (jenis && saiz && kuantiti > 0) {
            let rowPrice = pricesBase[jenis] || 0;
            let extraPriceSaiz = 0;
            if (saiz.includes("4XL")) extraPriceSaiz = pricesExtraSaiz["4XL"];
            else if (saiz.includes("5XL")) extraPriceSaiz = pricesExtraSaiz["5XL"];

            subTotalBaju += (rowPrice + extraPriceSaiz) * kuantiti;
        }
    }
    
    // Kira caj pos
    const penghantaran = document.querySelector('input[name="penghantaran"]:checked').value;
    const chargeShipping = (penghantaran === "Pos") ? 10 : 0;
    
    const grandTotal = subTotalBaju + chargeShipping;
    
    // Kemas kini DOM Total
    displayTotal.innerText = `RM ${grandTotal.toFixed(2)}`;
}

// Event untuk tambah row baju baharu
btnTambah.addEventListener('click', () => {
    const originalRow = container.getElementsByClassName('rowBaju')[0];
    const newRow = originalRow.cloneNode(true);
    
    const inputs = newRow.querySelectorAll('input, select');
    inputs.forEach(input => {
        if (input.tagName === 'INPUT') input.value = '1'; 
        else if (input.tagName === 'SELECT') input.value = ''; 
    });

    // Tambah row baharu ke container
    container.appendChild(newRow);
    
    // Tambah event listeners kepada row baharu untuk pengiraan total live
    addCalculationListeners(newRow);
    
    updateUI();
});

// Event untuk buang row
container.addEventListener('click', (e) => {
    if (e.target.classList.contains('btnBuangItem')) {
        const row = e.target.closest('.rowBaju');
        row.remove();
        updateUI();
    }
});

// Fungsi untuk tambah listeners pada row untuk kira total live
function addCalculationListeners(row) {
    const inputs = row.querySelectorAll('.fieldJenis, .fieldSaiz, .fieldKuantiti');
    inputs.forEach(input => {
        input.addEventListener('change', updateUI);
    });
}

// Tambah listeners kepada row pertama
addCalculationListeners(container.getElementsByClassName('rowBaju')[0]);

// Tambah listeners kepada radio button pos untuk kira total live
document.querySelectorAll('input[name="penghantaran"]').forEach(radio => {
    radio.addEventListener('change', updateUI);
});

// Jalankan fungsi updateUI semasa memuatkan laman
updateUI();

// Fungsi Kawalan Alamat
function toggleAlamat(show) {
    const ruang = document.getElementById('ruangAlamat');
    const inputAlamat = document.getElementById('alamat');
    if (show) {
        ruang.classList.remove('hidden');
        inputAlamat.setAttribute('required', 'true');
    } else {
        ruang.classList.add('hidden');
        inputAlamat.removeAttribute('required');
        inputAlamat.value = '';
    }
}


// ==========================================
// B. PENGENDALI BORANG TEMPAHAN
// ==========================================
document.getElementById('formBaju').addEventListener('submit', async function(e) {
    e.preventDefault();

    const btnHantar = document.getElementById('btnHantar');
    const teksAsal = btnHantar.innerText;
    btnHantar.innerText = "MEMPROSES & MENGHANTAR...";
    btnHantar.disabled = true;
    btnHantar.classList.add('opacity-50', 'cursor-not-allowed');

    try {
        // 1. Ambil Maklumat Pembeli
        const nama = document.getElementById('nama').value.trim();
        const ic = document.getElementById('ic').value.trim();
        const telefon = document.getElementById('telefon').value.trim();
        const penghantaran = document.querySelector('input[name="penghantaran"]:checked').value;
        const alamat = document.getElementById('alamat').value.trim() || "Tiada (Ambil Sendiri)";
        const resitFile = document.getElementById('resit').files[0];
        const timestamp = new Date().toISOString();

        // 2. Ambil Maklumat Baju (Multiple Rekod) untuk dihantar ke GAS (Drive)
        const orderItemsList = [];
        const rows = container.getElementsByClassName('rowBaju');

        for (let row of rows) {
            const jenis = row.querySelector('.fieldJenis').value;
            const saiz = row.querySelector('.fieldSaiz').value;
            const kuantiti = row.querySelector('.fieldKuantiti').value;

            if (jenis && saiz && kuantiti) {
                orderItemsList.push({
                    jenis_baju: jenis,
                    saiz: saiz,
                    kuantiti: kuantiti
                });
            }
        }

        if (orderItemsList.length === 0) {
            throw new Error("Sila pilih sekurang-kurangnya satu jenis baju.");
        }

        // 3. Proses Resit (Mampat & Tukar Base64)
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

            // C. Hantar ke Google Apps Script (GAS)
            // KOD DIUBAH: Hantar maklumat pembeli lengkap ke GAS
            const payloadGAS = {
                action: 'upload_baju', 
                ic: ic,
                nama: nama,
                telefon: telefon,
                penghantaran: penghantaran,
                alamat: alamat,
                // Tambah senarai item untuk autowrite drive kelak
                items: orderItemsList, 
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

        // 4. Susun & Simpan ke Firebase (Satu nod tempahan mengandungi Array Item)
        // KOD DIUBAH: Struktur data untuk sokong multiple item dalam satu rekod Firebase
        const nodTempahanRef = db.ref('tempahan_baju/' + ic);
        
        const tempahanData = {
            nama: nama,
            ic: ic,
            telefon: telefon,
            penghantaran: penghantaran,
            alamat: alamat,
            resit_url: resitUrl,
            items: orderItemsList, // <--- Data Baju (Array of Objects)
            status: "Menunggu Pengesahan", 
            tarikh_tempahan: timestamp
        };

        // Simpan nod tempahan baharu (No. IC sebagai ID utama)
        await nodTempahanRef.set(tempahanData);

        // 5. Maklum balas kejayaan
        alert("Tempahan berjaya dihantar! Anda boleh menyemak status menggunakan No IC anda dalam masa 24 jam.");
        
        // Reset borang
        document.getElementById('formBaju').reset();
        
        // Kembalikan UI baju kepada 1 row baharu
        while(container.children.length > 1){
            container.removeChild(container.lastChild);
        }
        
        if (typeof toggleAlamat === "function") toggleAlamat(false);
        updateUI(); // Set total balik kepada RM0.00

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
