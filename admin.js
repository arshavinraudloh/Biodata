import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    doc,
    updateDoc,
    deleteDoc
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
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_UID = "UWGr0ZZapwXufqJ55xfntBVBHgY2";

const loginPanel = document.getElementById("loginPanel");
const loginForm = document.getElementById("loginForm");
const dashboard = document.getElementById("dashboard");
const message = document.getElementById("adminMessage");
const table = document.getElementById("dataTable");
const searchInput = document.getElementById("searchInput");
const dataCount = document.getElementById("dataCount");

let allData = [];

function showMessage(text) {
    message.textContent = text;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function renderData() {
    const keyword = searchInput.value.trim().toLowerCase();

    const filtered = allData.filter(item =>
        String(item.nama ?? "").toLowerCase().includes(keyword)
    );

    dataCount.textContent = `Jumlah data: ${filtered.length}`;

    if (!filtered.length) {
        table.innerHTML = `
            <tr>
                <td colspan="9">Data tidak ditemukan.</td>
            </tr>`;
        return;
    }

    table.innerHTML = filtered.map(item => `
        <tr>
            <td>${escapeHTML(item.nama)}</td>
            <td>${escapeHTML(item.unit)}</td>
            <td>${escapeHTML(item.kelas)}</td>
            <td>${escapeHTML(item.jabatan)}</td>
            <td>${escapeHTML(item.divisi)}</td>
            <td>${escapeHTML(item.telepon)}</td>
            <td>${escapeHTML(item.tahunMulai)}</td>
            <td>${escapeHTML(item.tahunSelesai)}</td>
            <td>
                <button type="button"
                    class="detail-button"
                    data-id="${escapeHTML(item.id)}">
                    Detail
                </button>
                
                <button type="button"
                    class="edit-button"
                    data-id="${escapeHTML(item.id)}">
                    Edit
                </button>

                <button type="button"
                    class="delete-button"
                    data-id="${escapeHTML(item.id)}">
                    Hapus
                </button>
            </td>
        </tr>
    `).join("");
}

table.addEventListener("click", event => {
    const button = event.target.closest(".detail-button");

    if (!button) return;

    const item = allData.find(data => data.id === button.dataset.id);

    if (!item) {
        showMessage("Data biodata tidak ditemukan.");
        return;
    }

    const detailWindow = window.open("", "_blank");

    if (!detailWindow) {
        showMessage("Izinkan pop-up browser untuk melihat detail.");
        return;
    }

const urutanField = [
    "nama",
    "unit",
    "kelas",
    "jabatan",
    "divisi",
    "telepon",
    "tahunMulai",
    "tahunSelesai",
    "tanggalLahir",
    "jenisKelamin",
    "agama",
    "tempatLahir",
    "alamat",
    "instagram",
    "pernyataan",
    "createdAt"
];

const semuaField = [
    ...urutanField.filter(key =>
        Object.prototype.hasOwnProperty.call(item, key)
    ),
    ...Object.keys(item).filter(key =>
        !urutanField.includes(key) && key !== "id"
    )
];

const rows = semuaField
    .filter(key => key !== "id")
    .map(key => {
        const value = item[key];
        let displayValue = "";

        if (value && typeof value.toDate === "function") {
            displayValue = value.toDate().toLocaleString("id-ID");
        } else if (value && typeof value === "object") {
            displayValue = JSON.stringify(value);
        } else if (typeof value === "boolean") {
            displayValue = value ? "Ya" : "Tidak";
        } else {
            displayValue = String(value ?? "-");
        }

        return `
            <tr>
                <th>${escapeHTML(key)}</th>
                <td>${escapeHTML(displayValue)}</td>
            </tr>
        `;
    })
    .join("");
    detailWindow.document.write(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Detail Biodata</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 800px;
                    margin: 30px auto;
                    padding: 20px;
                    background: #f4f7f5;
                    color: #173d32;
                }

                h1 {
                    text-align: center;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                }

                th, td {
                    border: 1px solid #ddd;
                    padding: 12px;
                    text-align: left;
                    overflow-wrap: anywhere;
                }

                th {
                    width: 35%;
                    background: #e5eee9;
                }

                button {
                    margin-top: 20px;
                    padding: 10px 16px;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <h1>Detail Biodata Siswa</h1>
            <table>
                <tbody>${rows}</tbody>
            </table>
            <button onclick="window.print()">Cetak Detail</button>
        </body>
        </html>
    `);

    detailWindow.document.close();
});

// FUNGSI EDIT DAN HAPUS BIODATA
table.addEventListener("click", async event => {
    const button = event.target.closest(".edit-button, .delete-button");

    if (!button) return;

    // Pastikan hanya admin yang bisa melakukan perubahan
    if (auth.currentUser?.uid !== ADMIN_UID) {
        showMessage("Akses ditolak. Silakan login sebagai admin.");
        return;
    }

    const id = button.dataset.id;
    const item = allData.find(data => data.id === id);

    if (!item) {
        showMessage("Data biodata tidak ditemukan.");
        return;
    }

    // =========================
    // TOMBOL EDIT
    // =========================
    if (button.classList.contains("edit-button")) {
        const nama = prompt("Nama siswa:", item.nama ?? "");
        if (nama === null) return;

        const unit = prompt("Unit (SMP/SMA):", item.unit ?? "");
        if (unit === null) return;

        const kelas = prompt("Kelas:", item.kelas ?? "");
        if (kelas === null) return;

        const jabatan = prompt("Jabatan:", item.jabatan ?? "");
        if (jabatan === null) return;

        const divisi = prompt("Divisi:", item.divisi ?? "");
        if (divisi === null) return;

        const telepon = prompt("Nomor telepon:", item.telepon ?? "");
        if (telepon === null) return;

        const tahunMulai = prompt(
            "Tahun mulai:",
            item.tahunMulai ?? ""
        );
        if (tahunMulai === null) return;

        const tahunSelesai = prompt(
            "Tahun selesai:",
            item.tahunSelesai ?? ""
        );
        if (tahunSelesai === null) return;

        if (!nama.trim()) {
            showMessage("Nama siswa tidak boleh kosong.");
            return;
        }

        const yakin = confirm(
            "Simpan perubahan biodata siswa ini?"
        );

        if (!yakin) return;

        button.disabled = true;
        showMessage("Menyimpan perubahan biodata...");

        try {
            await updateDoc(doc(db, "biodata", id), {
                nama: nama.trim(),
                unit: unit.trim(),
                kelas: kelas.trim(),
                jabatan: jabatan.trim(),
                divisi: divisi.trim(),
                telepon: telepon.trim(),
                tahunMulai: tahunMulai.trim(),
                tahunSelesai: tahunSelesai.trim(),
                tanggalLahir: tanggalLahir.trim(),
                alamat: alamat.trim(),
                instagram: instagram.trim()
            }); 

            showMessage("Biodata berhasil diperbarui.");
            await loadData();
        } catch (error) {
            console.error("Gagal mengedit biodata:", error);
            showMessage(
                "Gagal menyimpan perubahan. Periksa Firestore Rules dan koneksi."
            );
        } finally {
            button.disabled = false;
        }

        return;
    }

    // =========================
    // TOMBOL HAPUS
    // =========================
    if (button.classList.contains("delete-button")) {
        const yakin = confirm(
            `Yakin ingin menghapus biodata "${item.nama ?? "siswa ini"}"?\n\n` +
            "Data yang dihapus tidak dapat dipulihkan melalui halaman ini."
        );

        if (!yakin) return;

        button.disabled = true;
        showMessage("Menghapus biodata...");

        try {
            await deleteDoc(doc(db, "biodata", id));

            showMessage("Biodata berhasil dihapus.");
            await loadData();
        } catch (error) {
            console.error("Gagal menghapus biodata:", error);
            showMessage(
                "Gagal menghapus data. Periksa Firestore Rules dan koneksi."
            );
        } finally {
            button.disabled = false;
        }
    }
});

async function loadData() {
    if (auth.currentUser?.uid !== ADMIN_UID) {
        showMessage("Akses ditolak. Akun ini bukan admin.");
        return;
    }

    showMessage("Memuat data dari Firestore...");

    try {
        const biodataQuery = query(
            collection(db, "biodata"),
            orderBy("createdAt", "desc"),
            limit(500)
        );

        const snapshot = await getDocs(biodataQuery);

        allData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        renderData();
        showMessage("Data berhasil dimuat.");
    } catch (error) {
        console.error(error);
        showMessage(
            "Gagal membaca data. Periksa Firestore Rules dan koneksi."
        );
    }
}

loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    showMessage("Memeriksa akun admin...");

    try {
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const credential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        if (credential.user.uid !== ADMIN_UID) {
            await signOut(auth);
            showMessage("Akun ini tidak memiliki akses admin.");
            return;
        }

        showMessage("Login berhasil.");
    } catch (error) {
        console.error(error);
        showMessage("Login gagal. Periksa email dan kata sandi.");
    }
});

onAuthStateChanged(auth, async user => {
    if (user && user.uid === ADMIN_UID) {
        loginPanel.style.display = "none";
        dashboard.style.display = "block";
        await loadData();
    } else {
        loginPanel.style.display = "block";
        dashboard.style.display = "none";
    }
});

searchInput.addEventListener("input", renderData);

document.getElementById("refreshButton").addEventListener("click", loadData);

document.getElementById("logoutButton").addEventListener("click", async () => {
    await signOut(auth);
    allData = [];
    table.replaceChildren();
    showMessage("Kamu sudah keluar dari akun admin.");
});

document.getElementById("exportButton").addEventListener("click", () => {
    const keyword = searchInput.value.trim().toLowerCase();

    const rows = allData.filter(item =>
        String(item.nama ?? "").toLowerCase().includes(keyword)
    );

    if (!rows.length) {
        showMessage("Tidak ada data untuk diekspor.");
        return;
    }

    const columns = [
        ["nama", "Nama"],
        ["unit", "Unit"],
        ["kelas", "Kelas"],
        ["jabatan", "Jabatan"],
        ["divisi", "Divisi"],
        ["telepon", "Telepon"],
        ["tahunMulai", "Tahun Mulai"],
        ["tahunSelesai", "Tahun Selesai"]
    ];

    const csvEscape = value =>
        `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
        columns.map(([, label]) => csvEscape(label)).join(","),
        ...rows.map(row =>
            columns.map(([key]) => csvEscape(row[key])).join(",")
        )
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "data-biodata-osis.csv";
    link.click();

    URL.revokeObjectURL(url);
});
