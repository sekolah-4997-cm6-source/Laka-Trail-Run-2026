import { db } from './firebase-config.js';
import { ref, runTransaction, set, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";

const pakejSelect = document.getElementById('pakej');
const ruangSaiz = document.getElementById('ruangSaiz');
const saizBaju = document.getElementById('saizBaju');
const slotBakiA = document.getElementById('slotBakiA');
const slotBakiB = document.getElementById('slotBakiB');
const form = document.getElementById('bookingForm');
const btnSubmit = document.getElementById('btnSubmit');
const statusMsg = document.getElementById('statusMsg');

// Papar/Sorok saiz baju mengikut pakej
pakejSelect.addEventListener('change', function() {
    if (this.value === 'A') {
        ruangSaiz.classList.remove('hidden');
        saizBaju.required = true;
    } else {
        ruangSaiz.classList.add('hidden');
        saizBaju.required = false;
        saizBaju.value = "";
    }
});

// Pantau baki slot Pakej A dan Pakej B secara Live
const refKuotaA = ref(db, 'system_stats/kuota_pakej_A');
onValue(refKuotaA, (snapshot) => {
    if (snapshot.exists()) slotBakiA.innerText = snapshot.val();
});

const refKuotaB = ref(db, 'system_stats/kuota_pakej_B');
onValue(refKuotaB, (snapshot) => {
    if (snapshot.exists()) slotBakiB.innerText = snapshot.val();
});

function janaID() {
    return 'LAKA-' + Math.floor(1000 + Math.random() * 9000);
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    btnSubmit.disabled = true;
    btnSubmit.innerText = "Memproses Tempahan...";
    statusMsg.classList.remove('hidden');
    statusMsg.className = "text-center mt-2 font-bold text-blue-600";
    statusMsg.innerText = "Sila tunggu sebentar...";

    const pilihanPakej = document.getElementById('pakej').value;
    const pilihanSaiz = document.getElementById('saizBaju').value || "Tiada";
    
    // Kira Harga Automatik
    let hargaLarian = 0;
    if (pilihanPakej === 'A') {
        hargaLarian = 45;
        if (pilihanSaiz === '4XL(+RM3)') hargaLarian += 3;
        if (pilihanSaiz === '5XL(+RM6)') hargaLarian += 6;
        if (pilihanSaiz === '6XL(+RM9)') hargaLarian += 9;
    } else if (pilihanPakej === 'B') {
        hargaLarian = 25;
    } else if (pilihanPakej === 'Challenger') {
        hargaLarian = 10;
    }

    const dataPendaftar = {
        nama: document.getElementById('nama').value,
        ic: document.getElementById('ic').value,
        jantina: document.getElementById('jantina').value,
        telefon: document.getElementById('telefon').value,
        emel: document.getElementById('emel').value,
        pakej: pilihanPakej,
        saizBaju: pilihanSaiz,
        harga: "RM" + hargaLarian, // Disimpan untuk ditarik oleh fail muat naik resit
        warisNama: document.getElementById('warisNama').value,
        warisTel: document.getElementById('warisTel').value,
        status: "PENDING_PAYMENT",
        timestamp: serverTimestamp()
    };

    const idTempahan = janaID();

    try {
        // Proses Pemotongan Kuota untuk Pakej A atau B Sahaja
        if (pilihanPakej === 'A' || pilihanPakej === 'B') {
            const sasaranRef = pilihanPakej === 'A' ? refKuotaA : refKuotaB;
            
            const transaksi = await runTransaction(sasaranRef, (kuotaSemasa) => {
                if (kuotaSemasa > 0) return kuotaSemasa - 1;
                else return; // Batalkan jika kuota 0
            });

            if (!transaksi.committed) {
                statusMsg.className = "text-center mt-2 font-bold text-red-600";
                statusMsg.innerText = `Maaf, slot Pakej ${pilihanPakej} telah penuh!`;
                btnSubmit.disabled = false;
                btnSubmit.innerText = "HANTAR PENDAFTARAN";
                return;
            }
        }

        // Pakej Challenger akan terus ke fasa ini tanpa memotong kuota
        await set(ref(db, 'peserta/' + idTempahan), dataPendaftar);

        window.location.href = `success.html?id=${idTempahan}`;

    } catch (error) {
        console.error(error);
        statusMsg.className = "text-center mt-2 font-bold text-red-600";
        statusMsg.innerText = "Ralat sistem. Sila cuba lagi.";
        btnSubmit.disabled = false;
        btnSubmit.innerText = "HANTAR PENDAFTARAN";
    }
});
