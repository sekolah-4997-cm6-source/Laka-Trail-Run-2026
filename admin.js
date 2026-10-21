// admin.js (Standalone Firebase V8)

// 1. Konfigurasi Firebase (Standalone)
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
const tableBody = document.getElementById('tableBody');

// 2. Akses Keselamatan
const kataLaluan = prompt("Sila masukkan kata laluan urusetia:");
if (kataLaluan !== "nanas2026") {
    alert("Akses Ditolak!");
    window.location.href = "index.html";
} else {
    muatDataPending();
}

// 3. Muat Turun Data dari Pangkalan Data
async function muatDataPending() {
    try {
        tableBody.innerHTML = `<tr><td colspan="3" class="py-16 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">Mencari rekod baharu...</td></tr>`;
        
        // Cari Peserta Larian
        const snapPeserta = await db.ref('peserta').orderByChild('status').equalTo('PENDING_VERIFICATION').once('value');
        
        // Cari Tempahan Baju
        const snapBaju = await db.ref('tempahan_baju').orderByChild('status').equalTo('Menunggu Pengesahan').once('value');
        
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
            tableBody.innerHTML = `<tr><td colspan="3" class="py-8 text-center text-gray-500 font-bold">Tiada resit baharu untuk disahkan setakat ini. 🎉</td></tr>`;
        }
    } catch (error) {
        console.error(error);
        tableBody.innerHTML = `<tr><td colspan="3" class="py-8 text-center text-red-500">Ralat memuatkan pangkalan data: ${error.message}</td></tr>`;
    }
}

// 4. Jana Baris Jadual
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
            <td class="py-4 px-6 text-center space-x-1">
                <button onclick="luluskanPeserta('${id}', '${data.nama}', '${data.emel}', '${data.pakej}')" class="bg-green-500 text-white px-3 py-1 rounded shadow hover:bg-green-600 font-bold">Lulus</button>
                <button onclick="tolakRekod('${id}', 'peserta')" class="bg-red-500 text-white px-3 py-1 rounded shadow hover:bg-red-600 font-bold">Tolak</button>
            </td>
        `;
    } else if (jenis === 'baju') {
        const butangResit = data.resit_url ? `<a href="${data.resit_url}" target="_blank" class="mt-2 inline-block bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold hover:bg-green-200">Lihat Resit</a>` : '';
        
        let senaraiBajuAdmin = "";
        if (data.items && data.items.length > 0) {
            data.items.forEach(item => {
                senaraiBajuAdmin += `<span class="text-xs font-bold text-green-700 block mt-1">&bull; ${item.jenis_baju} (Saiz: ${item.saiz} | Qty: ${item.kuantiti})</span>`;
            });
        } else {
            // Sokongan data lama
            senaraiBajuAdmin = `<span class="text-xs font-bold text-green-700 block mt-1">&bull; ${data.jenis_baju} (Saiz: ${data.saiz} | Qty: ${data.kuantiti})</span>`;
        }

        tr.innerHTML = `
            <td class="py-4 px-6 text-left whitespace-nowrap">
                <span class="inline-block px-2 py-1 bg-green-600 text-white text-xs rounded font-bold mb-1 shadow-sm">👕 TEMPAHAN BAJU</span><br>
                <span class="font-bold text-gray-800">${data.nama}</span><br>
                <span class="text-xs text-gray-500">${data.ic} | Tel: ${data.telefon}</span><br>
                <div class="mt-2 bg-green-50 p-2 rounded border border-green-100">
                    ${senaraiBajuAdmin}
                </div>
            </td>
            <td class="py-4 px-6 text-left">
                Hantar: <span class="font-bold text-gray-700">${data.penghantaran}</span><br>
                ${butangResit}
            </td>
            <td class="py-4 px-6 text-center space-x-1">
                <button onclick="luluskanBaju('${id}')" class="bg-green-500 text-white px-3 py-1 rounded shadow hover:bg-green-600 font-bold">Lulus</button>
                <button onclick="tolakRekod('${id}', 'baju')" class="bg-red-500 text-white px-3 py-1 rounded shadow hover:bg-red-600 font-bold">Tolak</button>
            </td>
        `;
    }
    tableBody.appendChild(tr);
}

// 5. Fungsi Kelulusan
window.luluskanPeserta = async (id, nama, emel, pakej) => {
    const noBib = prompt(`Masukkan Nombor BIB larian untuk ${nama}:`);
    if (!noBib) return; 
    if (!confirm(`Pasti untuk LULUSKAN pendaftaran ${nama}?`)) return;

    try {
        await db.ref('peserta/' + id).update({ status: "CONFIRMED", bib: noBib });
        fetch(gasURL, { method: 'POST', body: JSON.stringify({ action: 'lulus_resit', id: id, nama: nama, emel: emel, bib: noBib, pakej: pakej }), headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
        alert(`✅ Pendaftaran larian diluluskan!`);
        muatDataPending(); 
    } catch (error) { alert("Ralat: " + error.message); }
};

window.luluskanBaju = async (id) => {
    if (!confirm(`Pasti untuk LULUSKAN tempahan baju ini?`)) return;
    try {
        // 1. Kemas kini Firebase
        await db.ref('tempahan_baju/' + id).update({ status: "Disahkan" });
        
        // 2. KOD BARU: Panggil Google Apps Script untuk kemas kini Sheets
        fetch(gasURL, { 
            method: 'POST', 
            body: JSON.stringify({ 
                action: 'lulus_baju', 
                id: id // Hantar ID tempahan baju
            }), 
            headers: { 'Content-Type': 'text/plain;charset=utf-8' } 
        });
        
        alert(`✅ Tempahan baju diluluskan!`);
        muatDataPending(); 
    } catch (error) { alert("Ralat: " + error.message); }
};

window.tolakRekod = async (id, jenis) => {
    if (!confirm(`Pasti untuk TOLAK rekod ini?`)) return;
    try {
        const laluan = jenis === 'peserta' ? 'peserta/' + id : 'tempahan_baju/' + id;
        const statusTolak = jenis === 'peserta' ? 'REJECTED' : 'Ditolak';
        await db.ref(laluan).update({ status: statusTolak });
        alert(`❌ Rekod ditolak.`);
        muatDataPending(); 
    } catch (error) { alert("Ralat: " + error.message); }
};
