import { db } from './firebase-config.js';
import { ref, query, orderByChild, equalTo, get } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";

const form = document.getElementById('semakForm');
const btnSemak = document.getElementById('btnSemak');
const ruangKeputusan = document.getElementById('ruangKeputusan');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const icInput = document.getElementById('icSemak').value.trim();
    
    btnSemak.disabled = true;
    btnSemak.innerText = "Sedang Mencari...";
    ruangKeputusan.classList.add('hidden');
    ruangKeputusan.innerHTML = ""; // Kosongkan paparan lama

    try {
        let adaRekod = false;

        // Carian 1: Pangkalan Data Peserta Larian
        const qPeserta = query(ref(db, 'peserta'), orderByChild('ic'), equalTo(icInput));
        const snapshotPeserta = await get(qPeserta);

        if (snapshotPeserta.exists()) {
            adaRekod = true;
            snapshotPeserta.forEach((child) => {
                binaKadKeputusan(child.key, child.val(), 'peserta');
            });
        }

        // Carian 2: Pangkalan Data Tempahan Baju (Guna kaedah carian kunci 'key' terus)
        const refBaju = ref(db, 'tempahan_baju/' + icInput);
        const snapshotBaju = await get(refBaju);
        
        if (snapshotBaju.exists()) {
            adaRekod = true;
            // Kerana kita simpan guna IC sebagai ID, child.key = IC, child.val() = data baju
            binaKadKeputusan(snapshotBaju.key, snapshotBaju.val(), 'baju');
        }

        if (!adaRekod) {
            alert("Maaf, tiada rekod pendaftaran larian atau tempahan baju dijumpai untuk No. Kad Pengenalan ini.");
        } else {
            ruangKeputusan.classList.remove('hidden');
        }

    } catch (error) {
        console.error(error);
        alert("Ralat sistem ketika menyemak pangkalan data.");
    } finally {
        btnSemak.disabled = false;
        btnSemak.innerText = "SEMAK STATUS";
    }
});

// Fungsi untuk menjana HTML Kad Keputusan secara automatik
function binaKadKeputusan(idTempahan, data, jenis) {
    const kad = document.createElement('div');
    kad.className = "bg-white p-6 rounded-xl border-2 border-gray-100 shadow-lg relative";

    // Header Kad
    let htmlKad = `
        <div class="text-center mb-6">
            <div class="inline-block mb-3 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white ${jenis === 'peserta' ? 'bg-blue-600' : 'bg-green-600'} shadow-sm">
                ${jenis === 'peserta' ? '🏅 Pendaftaran Larian' : '👕 Tempahan Baju'}
            </div>
            <h3 class="text-2xl font-sports font-black italic text-gray-900 uppercase">${data.nama}</h3>
            <div class="inline-block mt-2 bg-gray-50 text-gray-600 px-4 py-1 rounded-full border border-gray-200">
                <p class="font-bold text-sm tracking-wider">ID: <span>${jenis === 'peserta' ? idTempahan : 'BAJU-' + idTempahan.substring(0,6)}</span></p>
            </div>
        </div>
    `;

    // Kandungan Dinamik
    if (jenis === 'peserta') {
        let htmlSenarai = "";
        if (data.pakej === 'A') {
            htmlSenarai += "<li><strong>Jersi Sublimation</strong></li>";
        }
        htmlSenarai += "<li>Nombor Bib</li>";
        htmlSenarai += "<li>Kupon RM10 <span class='text-xs text-gray-500 italic'>(untuk Laka Havoc Fest)</span></li>";
        htmlSenarai += "<li>Medal Finisher <span class='text-xs text-gray-500 italic'>(selepas tamat)</span></li>";
        htmlSenarai += "<li>Sijil</li>";

        htmlKad += `
            <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-inner text-center mb-6">
                <p class="text-xs text-blue-500 font-bold uppercase tracking-widest mb-1">Pakej Pilihan</p>
                <p class="font-sports font-black text-xl text-blue-800">Pakej ${data.pakej} ${data.saizBaju && data.saizBaju !== 'Tiada' ? `(Saiz: ${data.saizBaju})` : ""}</p>
            </div>
            <div class="bg-gray-50 p-5 rounded-xl border border-gray-200 text-sm text-gray-700 shadow-sm">
                <p class="font-bold mb-3 text-gray-800 uppercase tracking-wide text-xs">Senarai Barangan Pakej:</p>
                <ul class="space-y-2 ml-2 font-medium list-disc list-inside">
                    ${htmlSenarai}
                </ul>
            </div>
        `;
    } else if (jenis === 'baju') {
        htmlKad += `
            <div class="bg-green-50 p-4 rounded-xl border border-green-100 shadow-inner text-center mb-6">
                <p class="text-xs text-green-600 font-bold uppercase tracking-widest mb-1">Butiran Baju</p>
                <p class="font-sports font-black text-xl text-green-800">${data.jenis_baju} (Saiz: ${data.saiz})</p>
                <p class="text-sm font-bold text-green-700 mt-1">Kuantiti: ${data.kuantiti} helai</p>
            </div>
            <div class="bg-gray-50 p-5 rounded-xl border border-gray-200 text-sm text-gray-700 shadow-sm">
                <p class="font-bold mb-2 text-gray-800 uppercase tracking-wide text-xs">Kaedah Penghantaran:</p>
                <p class="font-medium text-lg text-gray-900">${data.penghantaran}</p>
                ${data.alamat && data.alamat !== 'Tiada (Ambil Sendiri)' ? `<p class="mt-3 text-gray-600 text-xs bg-gray-200 p-3 rounded-lg border border-gray-300 font-medium">${data.alamat}</p>` : ''}
            </div>
        `;
    }

    // Kotak Status & Butang Resit
    let statusSistem = data.status || "PENDING_VERIFICATION";
    let statusStyle = "";
    let statusText = "";
    let btnUpload = "";

    switch (statusSistem) {
        case "PENDING_PAYMENT":
        case "Menunggu Pembayaran":
            statusStyle = "bg-yellow-100 text-yellow-800 border-yellow-300";
            statusText = "MENUNGGU PEMBAYARAN";
            // Arahkan ke upload.html dan hantar parameter
            btnUpload = `<button onclick="window.location.href='upload.html?id=${idTempahan}&jenis=${jenis}'" class="w-full bg-yellow-500 text-white font-bold py-3 rounded-lg mt-4 hover:bg-yellow-600 transition shadow-md block">Muat Naik Resit Sekarang</button>`;
            break;
        case "PENDING_VERIFICATION":
        case "Menunggu Pengesahan":
            statusStyle = "bg-blue-100 text-blue-800 border-blue-300";
            statusText = "SEDANG DISAHKAN OLEH URUSETIA";
            break;
        case "CONFIRMED":
        case "Disahkan":
            statusStyle = "bg-green-100 text-green-800 border-green-300";
            statusText = "TEMPAHAN BERJAYA & SAH";
            break;
        case "COLLECTED":
            statusStyle = "bg-gray-100 text-gray-800 border-gray-300";
            statusText = "BARANG TELAH DITUNTUT";
            break;
        case "REJECTED":
        case "Ditolak":
            statusStyle = "bg-red-100 text-red-800 border-red-300";
            statusText = "TEMPAHAN DITOLAK";
            break;
        default:
            statusStyle = "bg-gray-100 text-gray-800 border-gray-300";
            statusText = "STATUS: " + statusSistem.toUpperCase();
    }

    htmlKad += `
        <div class="mt-6 p-4 rounded-lg text-center font-sports font-black uppercase italic tracking-wider border-2 shadow-sm ${statusStyle}">
            ${statusText}
        </div>
        ${btnUpload}
    `;

    kad.innerHTML = htmlKad;
    ruangKeputusan.appendChild(kad);
}
