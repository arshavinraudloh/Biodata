"use strict";

/* =====================================
   KONFIGURASI APLIKASI
===================================== */

const STORAGE_KEY = "osisAlfalahAlmakkyDataV1";

const form = document.getElementById("osisForm");
const dataTable = document.getElementById("dataTable");
const emptyState = document.getElementById("emptyState");
const dataCount = document.getElementById("dataCount");
const searchData = document.getElementById("searchData");
const formMessage = document.getElementById("formMessage");

const tahunMulai = document.getElementById("tahunMulai");
const tahunSelesai = document.getElementById("tahunSelesai");
const periodPreview = document.getElementById("periodPreview");

const unit = document.getElementById("unit");
const kelas = document.getElementById("kelas");

let pengurus = loadData();

/* =====================================
   PENYIMPANAN LOKAL
===================================== */

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return [];
        }

        const parsed = JSON.parse(saved);

        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Gagal membaca data:", error);
        return [];
    }
}

function saveData() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(pengurus)
        );

        return true;
    } catch (error) {
        console.error("Gagal menyimpan data:", error);

        showMessage(
            "Data tidak dapat disimpan. Periksa ruang penyimpanan browser.",
            "error"
        );

        return false;
    }
}

/* =====================================
   TAHUN AJARAN
===================================== */

function generateSchoolYears() {
    const currentYear = new Date().getFullYear();

    /*
      Menampilkan pilihan dari tahun sebelumnya
      hingga beberapa tahun ke depan.
    */

    const start = currentYear - 3;
    const end = currentYear + 8;

    for (let year = start; year <= end; year++) {
        const value = `${year}/${year + 1}`;

        [tahunMulai, tahunSelesai].forEach((select) => {
            const option = document.createElement("option");

            option.value = value;
            option.textContent = value;

            select.appendChild(option);
        });
    }

    const currentAcademicYear = `${currentYear}/${currentYear + 1}`;

    tahunMulai.value = currentAcademicYear;
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

tahunMulai.addEventListener("change", updatePeriodPreview);
tahunSelesai.addEventListener("change", updatePeriodPreview);

/* =====================================
   PENYESUAIAN KELAS BERDASARKAN UNIT
===================================== */

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

    classes.forEach((className) => {
        const option = document.createElement("option");

        option.value = className;
        option.textContent = className;

        kelas.appendChild(option);
    });

    if (classes.includes(previousValue)) {
        kelas.value = previousValue;
    }
}

unit.addEventListener("change", updateClassOptions);

/* =====================================
   PESAN STATUS
===================================== */

function showMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
}

/* =====================================
   AMBIL DATA FORMULIR
===================================== */

function getFormData() {
    const data = Object.fromEntries(new FormData(form).entries());

    data.id = createId();
    data.createdAt = new Date().toISOString();

    return data;
}

function createId() {
    if (globalThis.crypto?.randomUUID) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/* =====================================
   VALIDASI TAMBAHAN
===================================== */

function validateFormData(data) {
    if (!data.nama.trim()) {
        return "Nama lengkap wajib diisi.";
    }


    if (!/^[0-9+\-\s()]{8,20}$/.test(data.telepon)) {
        return "Format nomor HP tidak valid.";
    }

    if (data.tanggalLahir) {
        const birthDate = new Date(
            `${data.tanggalLahir}T00:00:00`
        );

        if (
            Number.isNaN(birthDate.getTime()) ||
            birthDate > new Date()
        ) {
            return "Tanggal lahir tidak valid.";
        }
    }

    const startYear = Number(
        data.tahunMulai.split("/")[0]
    );

    const endYear = Number(
        data.tahunSelesai.split("/")[0]
    );

    if (endYear < startYear) {
        return "Tahun ajaran selesai harus sama atau setelah tahun ajaran mulai.";
    }

    if (
        data.unit === "SMP" &&
        !["VII", "VIII", "IX"].includes(data.kelas)
    ) {
        return "Kelas yang dipilih tidak sesuai dengan unit SMP.";
    }

    if (
        data.unit === "SMA" &&
        !["X", "XI", "XII"].includes(data.kelas)
    ) {
        return "Kelas yang dipilih tidak sesuai dengan unit SMA.";
    }

    const duplicateNis = pengurus.some(
        (item) =>
            item.nis.trim().toLowerCase() ===
                data.nis.trim().toLowerCase() &&
            item.unit === data.unit
    );

    if (duplicateNis) {
        return "NIS tersebut sudah terdaftar pada unit OSIS ini.";
    }

    return "";
}

/* =====================================
   SIMPAN DATA
===================================== */

form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
        return;
    }

    const data = getFormData();
    const error = validateFormData(data);

    if (error) {
        showMessage(error, "error");
        return;
    }

    pengurus.unshift(data);

    if (!saveData()) {
        pengurus.shift();
        return;
    }

    renderTable(searchData.value);

    form.reset();

    updateClassOptions();

    tahunMulai.value = "";
    tahunSelesai.value = "";

    updatePeriodPreview();

    showMessage(
        "Biodata berhasil disimpan pada browser ini.",
        "success"
    );

    document.getElementById("unit").focus();
});

/* =====================================
   TAMPILKAN DATA DENGAN AMAN
===================================== */

function createCell(value) {
    const cell = document.createElement("td");

    /*
      Menggunakan textContent untuk mencegah
      input pengguna diperlakukan sebagai HTML.
    */

    cell.textContent = value || "-";

    return cell;
}

function renderTable(query = "") {
    dataTable.replaceChildren();

    const normalizedQuery = query.trim().toLowerCase();

    const filtered = pengurus.filter((item) => {
        const searchable = [
            item.nama,
            item.nis,
            item.nisn,
            item.unit,
            item.jabatan,
            item.divisi,
            item.kelas,
            item.tahunMulai,
            item.tahunSelesai
        ].join(" ").toLowerCase();

        return searchable.includes(normalizedQuery);
    });

    filtered.forEach((item, index) => {
        const row = document.createElement("tr");

        row.appendChild(createCell(index + 1));
        row.appendChild(createCell(item.nama));
        row.appendChild(createCell(`OSIS ${item.unit}`));
        row.appendChild(createCell(item.jabatan));
        row.appendChild(createCell(item.kelas));

        row.appendChild(
            createCell(
                `${item.tahunMulai} – ${item.tahunSelesai}`
            )
        );

        const actionCell = document.createElement("td");
        actionCell.className = "action-cell";

        const detailButton = document.createElement("button");

        detailButton.type = "button";
        detailButton.className = "btn-small";
        detailButton.textContent = "Detail";

        detailButton.addEventListener("click", () => {
            showDetails(item);
        });

        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className = "btn-small btn-delete";
        deleteButton.textContent = "Hapus";

        deleteButton.addEventListener("click", () => {
            deleteData(item.id);
        });

        actionCell.append(detailButton, deleteButton);
        row.appendChild(actionCell);

        dataTable.appendChild(row);
    });

    dataCount.textContent = `${pengurus.length} Data`;

    emptyState.style.display =
        filtered.length === 0 ? "block" : "none";

    if (filtered.length === 0) {
        emptyState.querySelector("h3").textContent =
            pengurus.length === 0
                ? "Belum Ada Data"
                : "Data Tidak Ditemukan";

        emptyState.querySelector("p").textContent =
            pengurus.length === 0
                ? "Isi formulir di atas untuk menambahkan data pengurus."
                : "Coba gunakan kata kunci pencarian yang berbeda.";
    }
}

/* =====================================
   DETAIL BIODATA
===================================== */

function showDetails(item) {
    const details = [
        ["Nama", item.nama],
        ["Unit", `OSIS ${item.unit}`],
        ["Jabatan", item.jabatan],
        ["Divisi", item.divisi || "-"],
        ["Kelas", item.kelas],
        ["Tahun ajaran", `${item.tahunMulai} sampai ${item.tahunSelesai}`],
        ["Tempat lahir", item.tempatLahir],
        ["Tanggal lahir", item.tanggalLahir],
        ["Jenis kelamin", item.jenisKelamin],
        ["Agama", item.agama],
        ["Nomor HP", item.telepon],
        ["Instagram", item.instagram || "-"],
        ["Alamat", item.alamat]
    ];

    alert(
        "DETAIL BIODATA PENGURUS OSIS\n\n" +
        details
            .map(([label, value]) => `${label}: ${value || "-"}`)
            .join("\n")
    );
}

/* =====================================
   HAPUS DATA
===================================== */

function deleteData(id) {
    const item = pengurus.find(
        (entry) => entry.id === id
    );

    if (!item) {
        return;
    }

    const confirmed = confirm(
        `Hapus biodata ${item.nama} dari penyimpanan browser ini?`
    );

    if (!confirmed) {
        return;
    }

    const previousData = pengurus;

    pengurus = pengurus.filter(
        (entry) => entry.id !== id
    );

    if (!saveData()) {
        pengurus = previousData;
        return;
    }

    renderTable(searchData.value);

    showMessage(
        "Data berhasil dihapus.",
        "success"
    );
}

/* =====================================
   PENCARIAN
===================================== */

searchData.addEventListener("input", () => {
    renderTable(searchData.value);
});

/* =====================================
   EKSPOR CSV
===================================== */

function csvEscape(value) {
    let text = String(value ?? "");

    /*
      Mencegah formula spreadsheet dieksekusi
      ketika CSV dibuka pada aplikasi spreadsheet.
    */

    if (/^[\s]*[=+\-@]/.test(text)) {
        text = "'" + text;
    }

    return `"${text.replace(/"/g, '""')}"`;
}

function exportCSV() {
    if (pengurus.length === 0) {
        showMessage(
            "Belum ada data untuk diekspor.",
            "error"
        );

        return;
    }

    const headers = [
        "Nama Lengkap",
        "Unit OSIS",
        "Jabatan",
        "Divisi",
        "Kelas",
        "Tahun Ajaran Mulai",
        "Tahun Ajaran Selesai",
        "Tempat Lahir",
        "Tanggal Lahir",
        "Jenis Kelamin",
        "Agama",
        "Nomor HP",
        "Instagram",
        "Alamat"
    ];

    const rows = pengurus.map((item) => [
        item.nama,
        item.unit,
        item.jabatan,
        item.divisi,
        item.kelas,
        item.tahunMulai,
        item.tahunSelesai,
        item.tempatLahir,
        item.tanggalLahir,
        item.jenisKelamin,
        item.agama,
        item.telepon,
        item.instagram,
        item.alamat
    ]);

    /*
      BOM membantu aplikasi spreadsheet
      membaca UTF-8 dengan benar.
    */

    const csv = "\uFEFF" + [
        headers,
        ...rows
    ]
        .map((row) => row.map(csvEscape).join(";"))
        .join("\r\n");

    const blob = new Blob(
        [csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "data-pengurus-osis.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    showMessage(
        "File CSV berhasil dibuat.",
        "success"
    );
}

document
    .getElementById("exportBtn")
    .addEventListener("click", exportCSV);

/* =====================================
   CETAK
===================================== */

document
    .getElementById("printBtn")
    .addEventListener("click", () => {
        if (pengurus.length === 0) {
            showMessage(
                "Belum ada data untuk dicetak.",
                "error"
            );

            return;
        }

        window.print();
    });

/* =====================================
   RESET FORMULIR
===================================== */

form.addEventListener("reset", () => {
    setTimeout(() => {
        showMessage("", "");
        updateClassOptions();
        updatePeriodPreview();
    }, 0);
});

/* =====================================
   INISIALISASI
===================================== */

document.getElementById("currentYear").textContent =
    new Date().getFullYear();

generateSchoolYears();
updateClassOptions();
renderTable();
