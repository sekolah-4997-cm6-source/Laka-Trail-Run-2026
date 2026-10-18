import { db } from './firebase-config.js';
import { ref, query, orderByChild, equalTo, get, update } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";

// !!! PENTING: GANTIKAN DENGAN URL GAS DARI FASA 4 !!!
const gasURL = "https://script.google.com/macros/s/AKfycbxo37ypDszt2C2WbqU2O7wHVyjID9pbW2y0PLnkgjCMyFlkT8PCeluuEhqgKXvCAuV5/exec";

const tableBody = document.getElementById('tableBody');

// 1. Sistem Keselamatan Asas
const kataLaluan = prompt("Sila masukkan kata laluan urusetia:");
if (kataLaluan !== "nanas2026") {
    alert("Akses Ditolak!");
    window.location.href = "index.html";
} else {
    muatDataPending();
}

// 2. Tarik Data dari Firebase
async function muatDataPending() {
    try {
        const q = query(ref(db, 'peserta'), orderByChild('status'), equalTo('PENDING_VERIFICATION'));
        const snapshot = await get(q);
        
        tableBody.innerHTML = ""; 

        if (!snapshot.exists()) {
            tableBody.innerHTML = `<tr><td colspan="3" class="py-8 text-center text-gray-500 font-bold">Tiada resit baharu untuk disahkan. 🎉</td></tr>`;
            return;
        }

        snapshot.forEach((child) => {
            const id = child.key;
            const data = child.val();
            
            const tr = document.createElement('tr');
            tr.className = "border-b border-gray-200 hover:bg-gray-50";
            
            // Semak jika ada URL resit (bergantung kepada sistem muat naik anda)
            const butangResit = data.resitUrl ? `<a href="${data.resitUrl}" target="_blank" class="mt-2 inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-bold hover:bg-blue-200">Lihat Resit</a>` : '';

            tr.innerHTML = `
                <td class="py-4 px-6 text-left whitespace-nowrap">
                    <span class="font-bold text-blue-700 block">${id}</span>
                    <span class="font-bold text-gray-800">${data.nama}</span><br>
                    <span class="text-xs text-gray-500">${data.ic} | No Tel: ${data.telefon || '-'}</span><br>
                    <span class="text-xs font-bold text-green-600">Pakej: ${data.pakej} ${data.saizBaju && data.saizBaju !== 'Tiada' ? `(Saiz: ${data.saizBaju})` : ''}</span>
                </td>
                <td class="py-4 px-6 text-left">
                    Ref: <span class="font-bold">${data.refNo || 'Tiada Rujukan'}</span><br>
                    <span class="text-xs text-gray-600">${data.tarikhBayaran || '-'} @ ${data.masaBayaran || '-'}</span><br>
                    ${butangResit}
                </td>
                <td class="py-4 px-6 text-center">
                    <div class="flex item-center justify-center space-x-2">
                        <button onclick="luluskan('${id}', '${data.nama}', '${data.emel}', '${data.pakej}')" class="bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600 font-bold transition">Lulus</button>
                        <button onclick="tolak('${id}', '${data.nama}', '${data.emel}')" class="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600 font-bold transition">Tolak</button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (error) {
        console.error(error);
        tableBody.innerHTML = `<tr><td colspan="3" class="py-8 text-center text-red-500">Ralat memuatkan data. Sila semak pangkalan data.</td></tr>`;
    }
}

// 3. Fungsi Lulus & Hantar E-Tiket
window.luluskan = async (id, nama, emel, pakej) => {
    const noBib = prompt(`Masukkan Nombor BIB larian untuk ${nama}:\n(Cth: 5KM-001)`);
    if (!noBib) return; 

    const sah = confirm(`Pasti untuk LULUSKAN ${nama}?\nBIB: ${noBib}\nE-Tiket akan dihantar terus ke ${emel}.`);
    if (!sah) return;

    try {
        // Kemas kini Firebase
        await update(ref(db, 'peserta/' + id), {
            status: "CONFIRMED",
            bib: noBib
        });

        // Hantar ke GAS
        const payloadGAS = { 
            action: 'lulus_resit', 
            id: id, 
            nama: nama, 
            emel: emel, 
            bib: noBib,
            pakej: pakej 
        };
        
        fetch(gasURL, { 
            method: 'POST', 
            body: JSON.stringify(payloadGAS), 
            headers: { 'Content-Type': 'text/plain;charset=utf-8' } 
        })
        .then(response => response.json())
        .then(data => {
            console.log("Respon dari Pelayan Google:", data);
        })
        .catch(error => {
            console.error("Ralat GAS:", error);
        });

        alert(`✅ Berjaya diluluskan! E-Tiket rasmi sedang dihantar ke ${emel}.`);
        muatDataPending(); 

    } catch (error) {
        alert("Ralat kemas kini: " + error.message);
    }
};

// 4. Fungsi Tolak
window.tolak = async (id, nama, emel) => {
    const sah = confirm(`Pasti untuk TOLAK resit ${nama}?\nSistem akan dikemas kini dan pendaftaran dibatalkan.`);
    if (!sah) return;

    try {
        await update(ref(db, 'peserta/' + id), {
            status: "REJECTED"
        });

        alert(`❌ Pendaftaran ditolak.`);
        muatDataPending(); 
    } catch (error) {
        alert("Ralat kemas kini: " + error.message);
    }
};
