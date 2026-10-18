import { db } from './firebase-config.js';
import { ref, query, orderByChild, equalTo, get, update } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";

const gasURL = "https://script.google.com/macros/s/AKfycbxo37ypDszt2C2WbqU2O7wHVyjID9pbW2y0PLnkgjCMyFlkT8PCeluuEhqgKXvCAuV5/exec";
const tableBody = document.getElementById('tableBody');

const kataLaluan = prompt("Sila masukkan kata laluan urusetia:");
if (kataLaluan !== "nanas2026") {
    alert("Akses Ditolak!");
    window.location.href = "index.html";
} else {
    muatDataPending();
}

async function muatDataPending() {
    try {
        // 1. Cari Peserta Larian
        const qPeserta = query(ref(db, 'peserta'), orderByChild('status'), equalTo('PENDING_VERIFICATION'));
        const snapPeserta = await get(qPeserta);
        
        // 2. Cari Tempahan Baju
        const qBaju = query(ref(db, 'tempahan_baju'), orderByChild('status'), equalTo('Menunggu Pengesahan'));
        const snapBaju = await get(qBaju);
        
        tableBody.innerHTML = ""; 
        let adaData = false;

        if (snapPeserta.exists()) {
            adaData = true;
            snapPeserta.forEach((child) => paparBaris(child.key, child.val(), 'peserta'));
        }

        if (snapBaju.exists()) {
            adaData = true;
            snapBaju.forEach((child) => paparBaris(child.key, child.val(), 'baju'));
        }

        if (!adaData) {
            tableBody.innerHTML = `<tr><td colspan="3" class="py-8 text-center text-gray-500 font-bold">Tiada resit baharu untuk disahkan. 🎉</td></tr>`;
        }
    } catch (error) {
        console.error(error);
        tableBody.innerHTML = `<tr><td colspan="3" class="py-8 text-center text-red-500">Ralat memuatkan data pangkalan data.</td></tr>`;
    }
}

function paparBaris(id, data, jenis) {
    const tr = document.createElement('tr');
    tr.className = "border-b border-gray-200 hover:bg-gray-50";
    
    if (jenis === 'peserta') {
        const butangResit = data.resitUrl ? `<a href="${data.resitUrl}" target="_blank" class="mt-2 inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-bold hover:bg-blue-200">Lihat Resit</a>` : '';
        tr.innerHTML = `
            <td class="py-4 px-6 text-left whitespace-nowrap">
                <span class="inline-block px-2 py-1 bg-blue-600 text-white text-xs rounded font-bold mb-1 shadow-sm">🏅 PENDAFTARAN LARIAN</span><br>
                <span class="font-bold text-blue-700 block">${id}</span>
                <span class="font-bold text-gray-800">${data.nama}</span><br>
                <span class="text-xs text-gray-500">${data.ic} | Tel: ${data.telefon || '-'}</span><br>
                <span class="text-xs font-bold text-green-600">Pakej: ${data.pakej} ${data.saizBaju && data.saizBaju !== 'Tiada' ? `(Saiz: ${data.saizBaju})` : ''}</span>
            </td>
            <td class="py-4 px-6 text-left">
                Ref: <span class="font-bold">${data.refNo || '-'}</span><br>
                ${butangResit}
            </td>
            <td class="py-4 px-6 text-center">
                <button onclick="luluskanPeserta('${id}', '${data.nama}', '${data.emel}', '${data.pakej}')" class="bg-green-500 text-white px-3 py-1 rounded shadow hover:bg-green-600 font-bold mr-1">Lulus</button>
                <button onclick="tolakRekod('${id}', 'peserta')" class="bg-red-500 text-white px-3 py-1 rounded shadow hover:bg-red-600 font-bold">Tolak</button>
            </td>
        `;
    } else if (jenis === 'baju') {
        const butangResit = data.resit_url ? `<a href="${data.resit_url}" target="_blank" class="mt-2 inline-block bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold hover:bg-green-200">Lihat Resit</a>` : '';
        tr.innerHTML = `
            <td class="py-4 px-6 text-left whitespace-nowrap">
                <span class="inline-block px-2 py-1 bg-green-600 text-white text-xs rounded font-bold mb-1 shadow-sm">👕 TEMPAHAN BAJU</span><br>
                <span class="font-bold text-gray-800">${data.nama}</span><br>
                <span class="text-xs text-gray-500">${data.ic} | Tel: ${data.telefon}</span><br>
                <span class="text-xs font-bold text-green-600">${data.jenis_baju} (Saiz: ${data.saiz} | Qty: ${data.kuantiti})</span>
            </td>
            <td class="py-4 px-6 text-left">
                Penghantaran: <span class="font-bold text-gray-700">${data.penghantaran}</span><br>
                ${butangResit}
            </td>
            <td class="py-4 px-6 text-center">
                <button onclick="luluskanBaju('${id}')" class="bg-green-500 text-white px-3 py-1 rounded shadow hover:bg-green-600 font-bold mr-1">Lulus</button>
                <button onclick="tolakRekod('${id}', 'baju')" class="bg-red-500 text-white px-3 py-1 rounded shadow hover:bg-red-600 font-bold">Tolak</button>
            </td>
        `;
    }
    tableBody.appendChild(tr);
}

window.luluskanPeserta = async (id, nama, emel, pakej) => {
    const noBib = prompt(`Masukkan Nombor BIB larian untuk ${nama}:`);
    if (!noBib) return; 
    if (!confirm(`Pasti untuk LULUSKAN ${nama}?`)) return;

    try {
        await update(ref(db, 'peserta/' + id), { status: "CONFIRMED", bib: noBib });
        fetch(gasURL, { method: 'POST', body: JSON.stringify({ action: 'lulus_resit', id: id, nama: nama, emel: emel, bib: noBib, pakej: pakej }), headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
        alert(`✅ Pendaftaran larian diluluskan!`);
        muatDataPending(); 
    } catch (error) { alert("Ralat: " + error.message); }
};

window.luluskanBaju = async (id) => {
    if (!confirm(`Pasti untuk LULUSKAN tempahan baju ini?`)) return;
    try {
        await update(ref(db, 'tempahan_baju/' + id), { status: "Disahkan" });
        alert(`✅ Tempahan baju diluluskan!`);
        muatDataPending(); 
    } catch (error) { alert("Ralat: " + error.message); }
};

window.tolakRekod = async (id, jenis) => {
    if (!confirm(`Pasti untuk TOLAK rekod ini?`)) return;
    try {
        const laluan = jenis === 'peserta' ? 'peserta/' + id : 'tempahan_baju/' + id;
        const statusTolak = jenis === 'peserta' ? 'REJECTED' : 'Ditolak';
        await update(ref(db, laluan), { status: statusTolak });
        alert(`❌ Rekod ditolak.`);
        muatDataPending(); 
    } catch (error) { alert("Ralat: " + error.message); }
};
