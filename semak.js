import { db } from './firebase-config.js';
import { ref, query, orderByChild, equalTo, get } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";

const form = document.getElementById('semakForm');
const btnSemak = document.getElementById('btnSemak');
const ruangKeputusan = document.getElementById('ruangKeputusan');
const btnTindakan = document.getElementById('btnTindakan');

const resNama = document.getElementById('resNama');
const resID = document.getElementById('resID');
const badgeJenis = document.getElementById('badgeJenis');
const kandunganDinamik = document.getElementById('kandunganDinamik');
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
        // Semakan 1: Cari di pangkalan data Peserta Larian
        const qPeserta = query(ref(db, 'peserta'), orderByChild('ic'), equalTo(icInput));
        const snapshotPeserta = await get(qPeserta);

        if (snapshotPeserta.exists()) {
            paparKeputusan(snapshotPeserta, 'peserta');
        } else {
            // Semakan 2: Jika bukan peserta, cari di pangkalan data Baju Sahaja
            const qBaju = query(ref(db, 'tempahan_baju'), orderByChild('ic'), equalTo(icInput));
            const snapshotBaju = await get(qBaju);
            
            if (snapshotBaju.exists()) {
                paparKeputusan(snapshotBaju, 'baju');
            } else {
                alert("Maaf, tiada rekod pendaftaran atau tempahan baju dijumpai untuk No. Kad Pengenalan ini.");
                btnSemak.disabled = false;
                btnSemak.innerText = "SEMAK STATUS";
            }
        }
    } catch (error) {
        console.error(error);
        alert("Ralat sistem ketika menyemak pangkalan data.");
        btnSemak.disabled = false;
        btnSemak.innerText = "SEMAK STATUS";
    }
});

function paparKeputusan(snapshot, jenis) {
    let data;
    let idTempahanKey;
    
    snapshot.forEach((child) => {
        idTempahanKey = child.key;
        data = child.val();
    });

    resNama.innerText = data.nama;
    resID.innerText = idTempahanKey;

    if (jenis === 'peserta') {
        badgeJenis.innerText = "Peserta Larian";
        badgeJenis.className = "inline-block mb-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-blue-600";
        
        let htmlSenarai = "";
        if (data.pakej === 'A') {
            htmlSenarai += "<li><strong>Jersi Sublimation</strong></li>";
        }
        htmlSenarai += "<li>Nombor Bib</li>";
        htmlSenarai += "<li>Kupon RM10 <span class='text-xs text-gray-500 italic'>(untuk Laka Havoc Fest)</span></li>";
        htmlSenarai += "<li>Medal Finisher <span class='text-xs text-gray-500 italic'>(selepas tamat larian)</span></li>";
        htmlSenarai += "<li>Sijil <span class='text-xs text-gray-500 italic'>(seminggu selepas pertandingan)</span></li>";

        kandunganDinamik.innerHTML = `
            <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm text-center mb-6">
                <p class="text-xs text-blue-500 font-bold uppercase tracking-widest mb-1">Pakej Pilihan</p>
                <p class="font-sports font-black text-xl text-blue-800">Pakej ${data.pakej} ${data.saizBaju && data.saizBaju !== 'Tiada' ? `(Saiz: ${data.saizBaju})` : ""}</p>
            </div>
            <div class="bg-gray-50 p-5 rounded-xl border border-gray-200 text-sm text-gray-700 shadow-inner">
                <p class="font-bold mb-3 text-gray-800 uppercase tracking-wide text-xs">Senarai Barangan Pakej Anda:</p>
                <ul class="space-y-2 ml-2 font-medium list-disc list-inside">
                    ${htmlSenarai}
                </ul>
            </div>
        `;
    } else if (jenis === 'baju') {
        badgeJenis.innerText = "Tempahan Baju";
        badgeJenis.className = "inline-block mb-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-green-600";
        
        kandunganDinamik.innerHTML = `
            <div class="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm text-center mb-6">
                <p class="text-xs text-green-600 font-bold uppercase tracking-widest mb-1">Butiran Baju</p>
                <p class="font-sports font-black text-xl text-green-800">${data.jenis_baju} (Saiz: ${data.saiz})</p>
                <p class="text-sm font-bold text-green-700 mt-1">Kuantiti: ${data.kuantiti} helai</p>
            </div>
            <div class="bg-gray-50 p-5 rounded-xl border border-gray-200 text-sm text-gray-700 shadow-inner">
                <p class="font-bold mb-2 text-gray-800 uppercase tracking-wide text-xs">Kaedah Penghantaran:</p>
                <p class="font-medium text-lg">${data.penghantaran}</p>
                ${data.alamat ? `<p class="mt-2 text-gray-500 text-xs bg-gray-100 p-2 rounded border">${data.alamat}</p>` : ''}
            </div>
        `;
    }

    urusStatus(data.status || "PENDING_VERIFICATION", idTempahanKey, jenis);
    ruangKeputusan.classList.remove('hidden');
    
    btnSemak.disabled = false;
    btnSemak.innerText = "SEMAK STATUS";
}

function urusStatus(statusSistem, idTempahan, jenis) {
    resStatusBox.className = "mt-4 p-4 rounded text-center border font-bold shadow-sm";
    btnTindakan.classList.add('hidden');
    btnTindakan.onclick = null;

    switch (statusSistem) {
        case "PENDING_PAYMENT":
            resStatusBox.classList.add("bg-yellow-100", "text-yellow-800", "border-yellow-300");
            resStatusText.innerText = "MENUNGGU PEMBAYARAN";
            
            btnTindakan.innerText = "Muat Naik Resit Sekarang";
            btnTindakan.className = "w-full bg-yellow-500 text-white font-bold py-3 rounded mt-4 hover:bg-yellow-600 transition shadow-md block";
            // Arahkan ke laman upload berbeza berdasarkan jenis (jika perlu)
            btnTindakan.onclick = () => window.location.href = `upload.html?id=${idTempahan}&jenis=${jenis}`;
            btnTindakan.classList.remove('hidden');
            break;

        case "PENDING_VERIFICATION":
            resStatusBox.classList.add("bg-blue-100", "text-blue-800", "border-blue-300");
            resStatusText.innerText = "SEDANG DISAHKAN OLEH URUSETIA";
            break;

        case "CONFIRMED":
        case "Disahkan": // Menyokong format teks dari sistem berbeza
            resStatusBox.classList.add("bg-green-100", "text-green-800", "border-green-300");
            resStatusText.innerText = "TEMPAHAN BERJAYA & SAH";
            break;
            
        case "COLLECTED":
            resStatusBox.classList.add("bg-gray-100", "text-gray-800", "border-gray-300");
            resStatusText.innerText = "BARANG TELAH DITUNTUT";
            break;

        case "REJECTED":
            resStatusBox.classList.add("bg-red-100", "text-red-800", "border-red-300");
            resStatusText.innerText = "TEMPAHAN DITOLAK";
            break;

        default:
            resStatusBox.classList.add("bg-gray-100", "text-gray-800");
            resStatusText.innerText = "STATUS: " + statusSistem;
    }
}
