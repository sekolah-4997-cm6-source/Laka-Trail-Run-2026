import { db } from './firebase-config.js';
import { ref, update, get } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";

const urlParams = new URLSearchParams(window.location.search);
const idTempahan = urlParams.get('id');
const displayId = document.getElementById('displayId');
const form = document.getElementById('uploadForm');
const fileInput = document.getElementById('gambarResit');
const imagePreview = document.getElementById('imagePreview');
const previewContainer = document.getElementById('previewContainer');
const btnSubmit = document.getElementById('btnSubmit');
const statusMsg = document.getElementById('statusMsg');

let base64String = "";

// Semak ID & Paparkan
if (!idTempahan) {
    alert("Tiada ID Tempahan dijumpai!");
    window.location.href = "index.html";
} else {
    displayId.innerText = idTempahan;
}

// Logik Auto-Compress & Preview
fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    btnSubmit.disabled = true;
    btnSubmit.innerText = "Memampatkan Imej...";

    const options = {
        maxSizeMB: 0.2, // Maksimum 200KB
        maxWidthOrHeight: 1024,
        useWebWorker: true
    };

    try {
        const compressedFile = await imageCompression(file, options);
        
        // Buat URL untuk pratonton visual
        const previewUrl = URL.createObjectURL(compressedFile);
        imagePreview.src = previewUrl;
        previewContainer.classList.remove('hidden');

        // Tukar fail dimampatkan ke Base64
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onloadend = function () {
            base64String = reader.result;
            btnSubmit.disabled = false;
            btnSubmit.innerText = "Sahkan & Hantar";
        };
    } catch (error) {
        console.error(error);
        alert("Ralat memampatkan imej. Sila cuba lagi.");
        btnSubmit.disabled = false;
    }
});

// Hantar Data
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!base64String) {
        alert("Sila tunggu imej siap diproses.");
        return;
    }

    btnSubmit.disabled = true;
    btnSubmit.innerText = "Menghantar Data...";
    statusMsg.classList.remove('hidden');
    statusMsg.className = "text-center mt-2 font-bold text-blue-600";
    statusMsg.innerText = "Menyimpan rekod, sila tunggu...";

    const refNo = document.getElementById('refNo').value;
    const tarikh = document.getElementById('tarikh').value;
    const masa = document.getElementById('masa').value;

    const pesertaRef = ref(db, 'peserta/' + idTempahan);

    try {
        // 1. Semak jika rekod wujud dan status masih PENDING
        const snapshot = await get(pesertaRef);
        if (!snapshot.exists()) {
            throw new Error("Rekod tidak wujud.");
        }
        
        const dataSemasa = snapshot.val();
        if (dataSemasa.status !== "PENDING_PAYMENT") {
            throw new Error("Resit telah dimuat naik atau tempahan tamat tempoh.");
        }

        // 2. Kemas kini Firebase
        await update(pesertaRef, {
            status: "PENDING_VERIFICATION",
            refNo: refNo,
            tarikhBayaran: tarikh,
            masaBayaran: masa
        });

        // 3. Hantar Base64 ke GAS (Akan diaktifkan sepenuhnya pada Fasa 4)
        const payloadGAS = {
            action: 'upload_receipt',
            id: idTempahan,
            refNo: refNo,
            imageB64: base64String.split(',')[1], // Buang header data:image/jpeg;base64,
            mimeType: base64String.split(';')[0].split(':')[1]
        };
        
        // TODO: fetch('URL_GAS_ANDA', { method: 'POST', body: JSON.stringify(payloadGAS) });

        statusMsg.className = "text-center mt-2 font-bold text-green-600";
        statusMsg.innerText = "Berjaya! Resit anda sedang disemak.";
        
        setTimeout(() => {
            alert("Resit berjaya dihantar. Sila semak emel anda untuk status pengesahan.");
            window.location.href = "index.html"; // Balik ke laman utama atau laman semak
        }, 3000);

    } catch (error) {
        console.error(error);
        statusMsg.className = "text-center mt-2 font-bold text-red-600";
        statusMsg.innerText = error.message;
        btnSubmit.disabled = false;
        btnSubmit.innerText = "Sahkan & Hantar";
    }
});
