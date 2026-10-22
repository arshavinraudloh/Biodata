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
    limit
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
                    Lihat Detail
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

    const rows = Object.entries(item)
        .filter(([key]) => key !== "id")
        .map(([key, value]) => {
            let displayValue = "";

            if (value && typeof value.toDate === "function") {
                displayValue = value.toDate().toLocaleString("id-ID");
            } else if (value && typeof value === "object") {
                displayValue = JSON.stringify(value);
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
