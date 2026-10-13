import { db } from './firebase-config.js';
import { ref, runTransaction, set, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";

const pakejSelect = document.getElementById('pakej');
const ruangSaiz = document.getElementById('ruangSaiz');
const saizBaju = document.getElementById('saizBaju');
const slotBakiDisplay = document.getElementById('slotBaki');
const form = document.getElementById('bookingForm');
const btnSubmit = document.getElementById('btnSubmit');
const statusMsg = document.getElementById('statusMsg');

// Papar/Sorok saiz baju
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

// Pantau baki slot Pakej A secara Live
const slotRef = ref(db, 'system_stats/kuota_pakej_A');
onValue(slotRef, (snapshot) => {
    const baki = snapshot.val();
    if(baki !== null) {
        slotBakiDisplay.innerText = baki;
    }
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

    const dataPendaftar = {
        nama: document.getElementById('nama').value,
        ic: document.getElementById('ic').value,
        jantina: document.getElementById('jantina').value,
        telefon: document.getElementById('telefon').value,
        emel: document.getElementById('emel').value,
        pakej: document.getElementById('pakej').value,
        saizBaju: document.getElementById('saizBaju').value || "Tiada",
        warisNama: document.getElementById('warisNama').value,
        warisTel: document.getElementById('warisTel').value,
        status: "PENDING_PAYMENT",
        timestamp: serverTimestamp()
    };

    const idTempahan = janaID();

    try {
        if (dataPendaftar.pakej === 'A') {
            // Proses Transaksi untuk tolak kuota
            const transaksi = await runTransaction(slotRef, (kuotaSemasa) => {
                if (kuotaSemasa > 0) {
                    return kuotaSemasa - 1;
                } else {
                    return; // Batalkan jika kuota 0
                }
            });

            if (!transaksi.committed) {
                statusMsg.className = "text-center mt-2 font-bold text-red-600";
                statusMsg.innerText = "Maaf, slot Pakej A telah penuh!";
                btnSubmit.disabled = false;
                btnSubmit.innerText = "Tempah Slot Sekarang";
                return;
            }
        }

        // Simpan data pendaftar jika Pakej B, atau Pakej A berjaya dikunci
        await set(ref(db, 'peserta/' + idTempahan), dataPendaftar);

        // Hantar request ke GAS untuk Emel 1 (Akan diaktifkan pada Fasa 4)
        // fetch('URL_GAS_ANDA', { method: 'POST', body: JSON.stringify({action: 'emel_booking', id: idTempahan, data: dataPendaftar}) });

        window.location.href = `success.html?id=${idTempahan}`;

    } catch (error) {
        console.error(error);
        statusMsg.className = "text-center mt-2 font-bold text-red-600";
        statusMsg.innerText = "Ralat sistem. Sila cuba lagi.";
        btnSubmit.disabled = false;
        btnSubmit.innerText = "Tempah Slot Sekarang";
    }
});
