"use strict";

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
getFirestore,
collection,
addDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const firebaseConfig = {
apiKey: "AIzaSyDDCaXWnfEop0BaX85D0a5gJn5bY5ZI-K0",
authDomain: "osis-alfalahalmakky.firebaseapp.com",
projectId: "osis-alfalahalmakky",
storageBucket: "osis-alfalahalmakky.firebasestorage.app",
messagingSenderId: "163088093743",
appId: "1:163088093743:web:0b18451d70e55851f42cda",
measurementId: "G-1ZNZ4FCRME"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById("osisForm");
const formMessage = document.getElementById("formMessage");

const tahunMulai = document.getElementById("tahunMulai");
const tahunSelesai = document.getElementById("tahunSelesai");
const periodPreview = document.getElementById("periodPreview");

const unit = document.getElementById("unit");
const kelas = document.getElementById("kelas");
const submitButton = form.querySelector('button[type="submit"]');

function showMessage(message, type = "") {
formMessage.textContent = message;
formMessage.className = `form-message ${type}`;
}

function generateSchoolYears() {
const currentYear = new Date().getFullYear();

for (let year = currentYear - 3; year <= currentYear + 8; year++) {
    const value = `${year}/${year + 1}`;

    for (const select of [tahunMulai, tahunSelesai]) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    }
}

tahunMulai.value = `${currentYear}/${currentYear + 1}`;
tahunSelesai.value = `${currentYear + 1}/${currentYear + 2}`;

updatePeriodPreview();

}

function updatePeriodPreview() {
const start = tahunMulai.value;
const end = tahunSelesai.value;

if (!start || !end) {
    periodPreview.textContent =
        "Periode kepengurusan akan ditampilkan di sini.";
    return;
}

const startYear = Number(start.split("/")[0]);
const endYear = Number(end.split("/")[0]);

if (endYear < startYear) {
    periodPreview.textContent =
        "Tahun ajaran selesai tidak boleh lebih awal dari tahun ajaran mulai.";
    return;
}

periodPreview.textContent =
    `Periode Kepengurusan: Tahun Ajaran ${start} sampai ${end}.`;

}

function updateClassOptions() {
const previousValue = kelas.value;

kelas.replaceChildren();

const placeholder = document.createElement("option");
placeholder.value = "";
placeholder.textContent = "Pilih kelas";
kelas.appendChild(placeholder);

const classes = unit.value === "SMP"
    ? ["VII", "VIII", "IX"]
    : unit.value === "SMA"
        ? ["X", "XI", "XII"]
        : ["VII", "VIII", "IX", "X", "XI", "XII"];

for (const className of classes) {
    const option = document.createElement("option");
    option.value = className;
    option.textContent = className;
    kelas.appendChild(option);
}

if (classes.includes(previousValue)) {
    kelas.value = previousValue;
}

}

function getFormData() {
const data = Object.fromEntries(new FormData(form).entries());

// Jangan simpan status checkbox sebagai teks sembarangan.
data.pernyataan = document.getElementById("pernyataan").checked;

return data;

}

function validateFormData(data) {
if (!data.nama?.trim()) {
return "Nama lengkap wajib diisi.";
}

if (!/^[0-9+\-\s()]{8,20}$/.test(data.telepon || "")) {
    return "Format nomor HP tidak valid.";
}

if (!data.pernyataan) {
    return "Centang pernyataan terlebih dahulu.";
}

if (data.tanggalLahir) {
    const birthDate = new Date(`${data.tanggalLahir}T00:00:00`);

    if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) {
        return "Tanggal lahir tidak valid.";
    }
}

const startYear = Number((data.tahunMulai || "").split("/")[0]);
const endYear = Number((data.tahunSelesai || "").split("/")[0]);

if (!startYear || !endYear || endYear < startYear) {
    return "Periksa kembali tahun ajaran mulai dan selesai.";
}

if (
    data.unit === "SMP" &&
    !["VII", "VIII", "IX"].includes(data.kelas)
) {
    return "Kelas tidak sesuai dengan unit SMP.";
}

if (
    data.unit === "SMA" &&
    !["X", "XI", "XII"].includes(data.kelas)
) {
    return "Kelas tidak sesuai dengan unit SMA.";
}

return "";

}

tahunMulai.addEventListener("change", updatePeriodPreview);
tahunSelesai.addEventListener("change", updatePeriodPreview);
unit.addEventListener("change", updateClassOptions);

form.addEventListener("submit", async (event) => {
event.preventDefault();

if (!form.reportValidity()) {
    return;
}

const data = getFormData();
const validationError = validateFormData(data);

if (validationError) {
    showMessage(validationError, "error");
    return;
}

submitButton.disabled = true;
showMessage("Menyimpan biodata ke server...", "");

try {
    await addDoc(collection(db, "biodata"), {
        ...data,
        createdAt: serverTimestamp()
    });

    form.reset();
    updateClassOptions();
    updatePeriodPreview();
showMessage(
    "Biodata yang kamu kirim telah tersimpan. Terima kasih telah mengisi formulir pendataan OSIS!",
    "success"
);

const successMessage = document.getElementById("successMessage");

if (successMessage) {
    successMessage.hidden = false;
    successMessage.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

} catch (error) {
    console.error("Gagal menyimpan biodata:", error);

    showMessage(
        "Biodata belum berhasil disimpan. Periksa koneksi dan Firestore Rules, lalu coba lagi.",
        "error"
    );
} finally {
    submitButton.disabled = false;
}

});

form.addEventListener("reset", () => {
setTimeout(() => {
showMessage("");
updateClassOptions();
updatePeriodPreview();
}, 0);
});

const currentYear = document.getElementById("currentYear");

if (currentYear) {
currentYear.textContent = new Date().getFullYear();
}

generateSchoolYears();
updateClassOptions();
