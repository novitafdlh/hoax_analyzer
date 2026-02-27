/**
 * Sulteng Hoax Analyzer - Admin Logic
 * Gabungan logika API dan Fitur Kategori Baru
 */

// 1. FUNGSI DASHBOARD & STATISTIK
async function loadStats() {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/dashboard/stats", {
        headers: { "Authorization": "Bearer " + token }
    });
    const data = await response.json();
    renderChart(data);
}

function renderChart(data) {
    // Update angka pada widget card
    document.getElementById("totalCount").innerText = data.total;
    document.getElementById("menungguCount").innerText = data.menunggu;
    document.getElementById("validCount").innerText = data.valid;
    document.getElementById("ditolakCount").innerText = data.ditolak;

    const ctx = document.getElementById("statsChart").getContext("2d");
    
    // Hapus chart lama jika ada untuk menghindari tumpang tindih visual
    if (window.myChart) { window.myChart.destroy(); }

    window.myChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Menunggu", "Terverifikasi", "Ditolak"],
            datasets: [{
                label: "Jumlah Submission",
                data: [data.menunggu, data.valid, data.ditolak],
                backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
                borderRadius: 8
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });
}

// 2. FUNGSI UPLOAD DOKUMEN (Dengan Kategori)
async function uploadOfficial() {
    const title = document.getElementById("officialTitle").value;
    const category = document.getElementById("officialCategory").value; // Fitur Baru
    const file = document.getElementById("officialImage").files[0];
    const resultElement = document.getElementById("uploadResult");

    if (!title || !category || !file) {
        resultElement.style.color = "#ef4444";
        resultElement.innerText = "Error: Semua field (Judul, Kategori, File) wajib diisi.";
        return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", category); // Mengirim kategori ke backend
    formData.append("image", file);

    const token = localStorage.getItem("token");
    resultElement.style.color = "#3b82f6";
    resultElement.innerText = "Sedang mengunggah dan menghitung Hash...";

    try {
        const response = await fetch("/api/upload-official", {
            method: "POST",
            headers: { "Authorization": "Bearer " + token },
            body: formData
        });

        const data = await response.json();
        resultElement.style.color = "#10b981";
        resultElement.innerText = data.message || "Upload berhasil disimpan ke database.";
    } catch (error) {
        resultElement.style.color = "#ef4444";
        resultElement.innerText = "Gagal menghubungi server.";
    }
}

// 3. FUNGSI MANAJEMEN SUBMISSION (VALIDASI)
async function loadSubmissions(status) {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/submissions/status/${status}`, {
        headers: { "Authorization": "Bearer " + token }
    });
    const data = await response.json();

    let html = "";
    data.forEach((item) => {
        let labelClass = "status-low";
        if (item.similarity_label === "tinggi") labelClass = "status-high";
        if (item.similarity_label === "sedang") labelClass = "status-medium";

        html += `
            <div class="submission-card" style="background: #f8fafc; padding: 15px; border-radius: 10px; margin-bottom: 15px; border: 1px solid #e2e8f0;">
                <p><strong>ID:</strong> ${item.id} | <strong>Similarity:</strong> ${item.similarity_score.toFixed(2)}</p>
                <p><strong>Label:</strong> <span class="${labelClass}">${item.similarity_label}</span></p>
                <div style="margin-top: 10px;">
                    <button class="valid-btn" onclick="validate(${item.id}, 'terverifikasi')" style="background:#10b981; color:white; border:none; padding:5px 15px; border-radius:5px; cursor:pointer;">Valid</button>
                    <button class="reject-btn" onclick="validate(${item.id}, 'ditolak')" style="background:#ef4444; color:white; border:none; padding:5px 15px; border-radius:5px; cursor:pointer;">Tolak</button>
                </div>
            </div>
        `;
    });
    document.getElementById("list").innerHTML = html || "<p>Tidak ada data.</p>";
}

async function validate(id, status) {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/submission/validate/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ final_status: status })
    });

    if (response.ok) {
        alert("Status diperbarui menjadi " + status);
        loadStats(); // Refresh dashboard
    }
}

// 4. NAVIGASI & UTILITY
function showSection(section) {
    const sections = ["dashboardSection", "uploadSection", "statusSection", "gallerySection"];
    sections.forEach(s => document.getElementById(s).style.display = "none");

    const activeSection = section + "Section";
    document.getElementById(activeSection).style.display = "block";

    if (section === "gallery") loadGallery();
}

async function loadGallery() {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/official", {
        headers: { "Authorization": "Bearer " + token }
    });
    const data = await response.json();

    let html = "";
    data.forEach((item) => {
        const safePath = String(item.image_path || "").replace(/\\/g, "/");
        html += `
            <div class="gallery-card" style="display:inline-block; width:200px; margin:10px; vertical-align:top;">
                <img src="/${safePath}" style="width:100%; border-radius:8px;">
                <h4 style="font-size:14px; margin:5px 0;">${item.title}</h4>
                <small style="color:#64748b;">${item.image_hash.substring(0, 15)}...</small>
            </div>
        `;
    });
    document.getElementById("galleryList").innerHTML = html;
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}

window.onload = function () {
    loadStats();
};