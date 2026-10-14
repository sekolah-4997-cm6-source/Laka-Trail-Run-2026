import { db } from './firebase-config.js';
import { ref, query, orderByChild, equalTo, get } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";

const form = document.getElementById('semakForm');
const btnSemak = document.getElementById('btnSemak');
const ruangKeputusan = document.getElementById('ruangKeputusan');
const btnTindakan = document.getElementById('btnTindakan');

const resNama = document.getElementById('resNama');
const resID = document.getElementById('resID');
const resPakej = document.getElementById('resPakej');
const senaraiPakej = document.getElementById('senaraiPakej'); // Elemen senarai baru
const resStatusBox = document.getElementById('resStatusBox');
const resStatusText = document.getElementById('resStatusText');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const icInput = document.getElementById('icSemak').value.trim();
    
    btnSemak.disabled = true;
    btnSemak.innerText = "Sedang Mencari...";
    ruangKeputusan.classList.add('hidden');
    btnTindakan.classList.add('hidden');

    try {
        const q = query(ref(db, 'peserta'), orderByChild('ic'), equalTo(icInput));
        const snapshot_hasil = await get(q);

        if (snapshot_hasil.exists()) {
            let dataPeserta;
            let idTempahanKey;
            
            snapshot_hasil.forEach((child) => {
                idTempahanKey = child.key;
                dataPeserta = child.val();
            });

            // Papar Data Asas
            resNama.innerText = dataPeserta.nama;
            resID.innerText = idTempahanKey;
            resPakej.innerText = `Pakej ${dataPeserta.pakej} ` + (dataPeserta.saizBaju !== 'Tiada' ? `(Saiz: ${dataPeserta.saizBaju})` : "");

            // LOGIK SENARAI BARANGAN MENGIKUT PAKEJ
            let htmlSenarai = "";
            if (dataPeserta.pakej === 'A') {
                htmlSenarai += "<li><strong>Jersi Sublimation</strong></li>";
            }
            // Barangan wajib untuk Pakej A & B
            htmlSenarai += "<li>Nombor Bib</li>";
            htmlSenarai += "<li>Kupon RM10 <span class='text-xs text-gray-500 italic'>(untuk digunakan dalam program Laka Havoc Fest 2026)</span></li></li>";
            htmlSenarai += "<li>Medal Finisher <span class='text-xs text-gray-500 italic'>(diberikan selepas menamatkan larian)</span></li>";
            htmlSenarai += "<li>Sijil <span class='text-xs text-gray-500 italic'>(diberikan seminggu selepas pertandingan)</span></li>";
            
            // Masukkan HTML ke dalam ul
            senaraiPakej.innerHTML = htmlSenarai;

            // Menguruskan Warna dan Mesej Status
            urusStatus(dataPeserta.status, idTempahanKey);

            ruangKeputusan.classList.remove('hidden');
        } else {
            alert("Maaf, tiada rekod pendaftaran dijumpai untuk No. Kad Pengenalan ini.");
        }

    } catch (error) {
        console.error(error);
        alert("Ralat sistem ketika menyemak pangkalan data.");
    } finally {
        btnSemak.disabled = false;
        btnSemak.innerText = "Semak Status";
    }
});

function urusStatus(statusSistem, idTempahan) {
    // Reset Kelas
    resStatusBox.className = "mt-4 p-4 rounded text-center border font-bold shadow-sm";
    btnTindakan.classList.add('hidden');
    
    // Buang pautan lama jika ada
    btnTindakan.onclick = null;

    switch (statusSistem) {
        case "PENDING_PAYMENT":
            resStatusBox.classList.add("bg-yellow-100", "text-yellow-800", "border-yellow-300");
            resStatusText.innerText = "MENUNGGU PEMBAYARAN";
            
            btnTindakan.innerText = "Muat Naik Resit Sekarang";
            btnTindakan.className = "w-full bg-yellow-500 text-white font-bold py-3 rounded mt-4 hover:bg-yellow-600 transition shadow-md block";
            btnTindakan.onclick = () => window.location.href = `upload.html?id=${idTempahan}`;
            btnTindakan.classList.remove('hidden');
            break;

        case "PENDING_VERIFICATION":
            resStatusBox.classList.add("bg-blue-100", "text-blue-800", "border-blue-300");
            resStatusText.innerText = "SEDANG DISAHKAN OLEH URUSETIA";
            break;

        case "CONFIRMED":
            resStatusBox.classList.add("bg-green-100", "text-green-800", "border-green-300");
            resStatusText.innerText = "PENDAFTARAN BERJAYA & SAH";
            break;
            
        case "COLLECTED":
            resStatusBox.classList.add("bg-gray-100", "text-gray-800", "border-gray-300");
            resStatusText.innerText = "RACE KIT TELAH DITUNTUT";
            break;

        case "REJECTED":
            resStatusBox.classList.add("bg-red-100", "text-red-800", "border-red-300");
            resStatusText.innerText = "PENDAFTARAN DITOLAK";
            break;

        default:
            resStatusBox.classList.add("bg-gray-100", "text-gray-800");
            resStatusText.innerText = "STATUS TIDAK DIKETAHUI";
    }
}
