// baju.js (Kemas Kini untuk Multiple Order & Saiz Dinamik)

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
const gasURL = "https://script.google.com/macros/s/AKfycbxo37ypDszt2C2WbqU2O7wHVyjID9pbW2y0PLnkgjCMyFlkT8PCeluuEhqgKXvCAuV5/exec";

const container = document.getElementById('containerItemBaju');
const btnTambah = document.getElementById('btnTambahBaju');
const displayTotal = document.getElementById('displayTotal');

// Harga rujukan termasuk Kategori Kids yang harganya sama dengan dewasa
const pricesBase = { 
    "Roundneck Pendek": 32, "Roundneck Pendek (Kids)": 32,
    "Roundneck Panjang": 36, "Roundneck Panjang (Kids)": 36,
    "Berkolar Pendek": 35, "Berkolar Pendek (Kids)": 35,
    "Berkolar Panjang": 39, "Berkolar Panjang (Kids)": 39,
    "Muslimah": 45, "Muslimah (Kids)": 45
};

// Carta Saiz Berdasarkan Gambar (Kids & Dewasa)
const sizeCharts = {
    adult: ["2XS", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL", "7XL"],
    kids: ["22", "24", "26", "28", "30", "32", "34"],
    muslimahAdult: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL", "7XL", "8XL"],
    muslimahKids: ["22", "24", "26", "28", "30", "32", "34"]
};

// Penambahan Harga Berdasarkan Saiz (+RM3 gandaan untuk saiz 4XL ke atas)
const pricesExtraSaiz = { "4XL": 3, "5XL": 6, "6XL": 9, "7XL": 12, "8XL": 15 };

// Fungsi Autogenerate Dropdown Saiz
function updateDropdownSaiz(row) {
    const jenisSelect = row.querySelector('.fieldJenis');
    const saizSelect = row.querySelector('.fieldSaiz');
    const jenisValue = jenisSelect.value;
    const oldSaiz = saizSelect.value;
    
    saizSelect.innerHTML = '<option value="">Pilih Saiz</option>';
    if (!jenisValue) {
        saizSelect.innerHTML = '<option value="">Pilih Baju Dahulu</option>';
        return;
    }

    let targetChart = [];
    if (jenisValue.includes("Muslimah")) {
        targetChart = jenisValue.includes("(Kids)") ? sizeCharts.muslimahKids : sizeCharts.muslimahAdult;
    } else {
        targetChart = jenisValue.includes("(Kids)") ? sizeCharts.kids : sizeCharts.adult;
    }

    targetChart.forEach(saiz => {
        let label = saiz;
        if (pricesExtraSaiz[saiz]) {
            label += ` (+RM${pricesExtraSaiz[saiz]})`;
        }
        const option = document.createElement('option');
        option.value = saiz;
        option.textContent = label;
        saizSelect.appendChild(option);
    });

    if (targetChart.includes(oldSaiz)) saizSelect.value = oldSaiz;
}

// Fungsi Total Update
function updateUI() {
    const rows = container.getElementsByClassName('rowBaju');
    for (let i = 0; i < rows.length; i++) {
        const buangBtn = rows[i].querySelector('.btnBuangItem');
        rows.length === 1 ? buangBtn.classList.add('hidden') : buangBtn.classList.remove('hidden');
    }
    
    let subTotalBaju = 0;
    for (let row of rows) {
        const jenis = row.querySelector('.fieldJenis').value;
        const saiz = row.querySelector('.fieldSaiz').value;
        const kuantiti = parseInt(row.querySelector('.fieldKuantiti').value, 10) || 0;

        if (jenis && saiz && kuantiti > 0) {
            let rowPrice = pricesBase[jenis] || 0;
            let extraPriceSaiz = pricesExtraSaiz[saiz] || 0;
            subTotalBaju += (rowPrice + extraPriceSaiz) * kuantiti;
        }
    }
    
    const penghantaran = document.querySelector('input[name="penghantaran"]:checked').value;
    const chargeShipping = (penghantaran === "Pos") ? 10 : 0;
    
    displayTotal.innerText = `RM ${(subTotalBaju + chargeShipping).toFixed(2)}`;
}

// Listener Dinamik
function addCalculationListeners(row) {
    const fieldJenis = row.querySelector('.fieldJenis');
    const fieldSaiz = row.querySelector('.fieldSaiz');
    const fieldKuantiti = row.querySelector('.fieldKuantiti');

    fieldJenis.addEventListener('change', () => {
        updateDropdownSaiz(row);
        updateUI();
    });
    
    fieldSaiz.addEventListener('change', updateUI);
    fieldKuantiti.addEventListener('input', updateUI);
}

btnTambah.addEventListener('click', () => {
    const originalRow = container.getElementsByClassName('rowBaju')[0];
    const newRow = originalRow.cloneNode(true);
    
    newRow.querySelectorAll('input, select').forEach(input => {
        input.tagName === 'INPUT' ? input.value = '1' : input.value = '';
    });
    
    newRow.querySelector('.fieldSaiz').innerHTML = '<option value="">Pilih Baju Dahulu</option>';
    container.appendChild(newRow);
    addCalculationListeners(newRow);
    updateUI();
});

container.addEventListener('click', (e) => {
    if (e.target.classList.contains('btnBuangItem')) {
        e.target.closest('.rowBaju').remove();
        updateUI();
    }
});

addCalculationListeners(container.getElementsByClassName('rowBaju')[0]);
document.querySelectorAll('input[name="penghantaran"]').forEach(radio => {
    radio.addEventListener('change', updateUI);
});
updateUI();

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

// Borang Tempahan Handlers
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
        const penghantaran = document.querySelector('input[name="penghantaran"]:checked').value;
        const alamat = document.getElementById('alamat').value.trim() || "Tiada (Ambil Sendiri)";
        const resitFile = document.getElementById('resit').files[0];
        const timestamp = new Date().toISOString();

        const orderItemsList = [];
        const rows = container.getElementsByClassName('rowBaju');

        for (let row of rows) {
            const jenis = row.querySelector('.fieldJenis').value;
            const saiz = row.querySelector('.fieldSaiz').value;
            const kuantiti = row.querySelector('.fieldKuantiti').value;

            if (jenis && saiz && kuantiti) {
                orderItemsList.push({ jenis_baju: jenis, saiz: saiz, kuantiti: kuantiti });
            }
        }

        if (orderItemsList.length === 0) throw new Error("Sila pilih sekurang-kurangnya satu jenis baju.");

        let resitUrl = "";
        if (resitFile) {
            const options = { maxSizeMB: 0.2, maxWidthOrHeight: 1024, useWebWorker: true };
            const compressedFile = await imageCompression(resitFile, options);
            
            const base64String = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(compressedFile);
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });

            const payloadGAS = {
                action: 'upload_baju', 
                ic: ic, nama: nama, telefon: telefon, penghantaran: penghantaran, alamat: alamat,
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

        const nodTempahanRef = db.ref('tempahan_baju/' + ic);
        await nodTempahanRef.set({
            nama: nama, ic: ic, telefon: telefon, penghantaran: penghantaran, alamat: alamat,
            resit_url: resitUrl, items: orderItemsList, status: "Menunggu Pengesahan", tarikh_tempahan: timestamp
        });

        alert("Tempahan berjaya dihantar! Anda boleh menyemak status menggunakan No IC anda dalam masa 24 jam.");
        document.getElementById('formBaju').reset();
        
        while(container.children.length > 1) { container.removeChild(container.lastChild); }
        if (typeof toggleAlamat === "function") toggleAlamat(false);
        updateUI();

    } catch (error) {
        alert("Terdapat ralat: " + error.message);
    } finally {
        btnHantar.innerText = teksAsal;
        btnHantar.disabled = false;
        btnHantar.classList.remove('opacity-50', 'cursor-not-allowed');
    }
});
