import { db } from './firebase-config.js';
import { ref, query, orderByChild, equalTo, get, update } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";

// Keselamatan Asas
const kataLaluan = prompt("Sila masukkan kata laluan kaunter:");
if (kataLaluan !== "kaunternanas26") { // Anda boleh ubah kata laluan ini
    alert("Akses Ditolak!");
    window.location.href = "index.html";
}

const form = document.getElementById('kaunterForm');
const btnCari = document.getElementById('btnCari');
const ruangKeputusan = document.getElementById('ruangKeputusan');
const btnTuntut = document.getElementById('btnTuntut');

const resNama = document.getElementById('resNama');
const resBib = document.getElementById('resBib');
const resPakej = document.getElementById('resPakej');
const resSaiz = document.getElementById('resSaiz');
const statusBox = document.getElementById('statusBox');
const statusText = document.getElementById('statusText');

let idSemasa = "";

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ic = document.getElementById('icCarian').value.trim();
    
    btnCari.disabled = true;
    btnCari.innerText = "Mencari...";
    ruangKeputusan.classList.add('hidden');
    btnTuntut.classList.add('hidden');

    try {
        const q = query(ref(db, 'peserta'), orderByChild('ic'), equalTo(ic));
        const snapshot = await get(q);

        if (snapshot.exists()) {
            let data;
            snapshot.forEach((child) => {
                idSemasa = child.key;
                data = child.val();
            });

            resNama.innerText = data.nama;
            resBib.innerText = data.bib ? `BIB: ${data.bib}` : "BIB: BELUM DITETAPKAN";
            resPakej.innerText = `Pakej ${data.pakej}`;
            resSaiz.innerText = data.saizBaju;

            urusStatusKaunter(data.status);
            ruangKeputusan.classList.remove('hidden');
        } else {
            alert("Rekod tidak dijumpai. Sila semak semula No. IC.");
        }
    } catch (error) {
        console.error(error);
        alert("Ralat pencarian pangkalan data.");
    } finally {
        btnCari.disabled = false;
        btnCari.innerText = "Cari Peserta";
    }
});

function urusStatusKaunter(status) {
    statusBox.className = "p-4 rounded text-center font-bold mb-4 border";
    btnTuntut.classList.add('hidden');

    if (status === "CONFIRMED") {
        statusBox.classList.add("bg-blue-100", "text-blue-800", "border-blue-300");
        statusText.innerText = "SAH - BOLEH TUNTUT";
        btnTuntut.classList.remove('hidden');
    } else if (status === "COLLECTED") {
        statusBox.classList.add("bg-gray-100", "text-gray-800", "border-gray-300");
        statusText.innerText = "TELAH DITUNTUT";
    } else {
        statusBox.classList.add("bg-red-100", "text-red-800", "border-red-300");
        statusText.innerText = `TIDAK LAYAK (Status: ${status})`;
    }
}

btnTuntut.addEventListener('click', async () => {
    const sah = confirm(`Sahkan serahan Race Kit kepada ${resNama.innerText}?`);
    if (!sah) return;

    btnTuntut.disabled = true;
    btnTuntut.innerText = "Menyimpan...";

    try {
        await update(ref(db, 'peserta/' + idSemasa), {
            status: "COLLECTED"
        });
        alert("Berjaya! Rekod telah dikemas kini.");
        
        // Kemas kini paparan UI serta merta
        urusStatusKaunter("COLLECTED");
    } catch (error) {
        alert("Ralat sistem: " + error.message);
    } finally {
        btnTuntut.disabled = false;
        btnTuntut.innerText = "Sahkan Tuntutan Race Kit";
    }
});
