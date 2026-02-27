let currentGuestQuota = null;

function getToken() {
  return localStorage.getItem("token");
}

function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (error) {
    return null;
  }
}

function isLoggedIn() {
  const token = getToken();

  if (!token) {
    return false;
  }

  const payload = decodeToken(token);

  if (!payload || !payload.exp) {
    return false;
  }

  return Date.now() < payload.exp * 1000;
}

function statusBadgeClass(label) {
  if (label === "tinggi") return "b-ok";
  if (label === "sedang") return "b-warn";
  return "b-low";
}

function setLoadingState(isLoading) {
  const submitBtn = document.getElementById("submitBtn");
  const overlay = document.getElementById("loadingOverlay");

  submitBtn.disabled = isLoading;
  submitBtn.innerText = isLoading ? "Memproses..." : "Analisis Sekarang";

  if (isLoading) {
    overlay.classList.add("active");
  } else {
    overlay.classList.remove("active");
  }
}

function renderQuotaInfo() {
  const quota = document.getElementById("quotaInfo");

  if (isLoggedIn()) {
    quota.className = "quota";
    quota.innerText = "Login aktif: verifikasi tanpa batas dan riwayat tersimpan.";
    return;
  }

  if (!currentGuestQuota) {
    quota.className = "quota warn";
    quota.innerText = "Status kuota belum tersedia.";
    return;
  }

  quota.innerText = `Guest tersisa: ${currentGuestQuota.remaining} dari ${currentGuestQuota.daily_limit} verifikasi hari ini.`;

  if (currentGuestQuota.remaining === 0) {
    quota.className = "quota danger";
  } else if (currentGuestQuota.remaining === 1) {
    quota.className = "quota warn";
  } else {
    quota.className = "quota";
  }
}

async function fetchGuestQuota() {
  const headers = {};
  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch("/api/guest-quota", { headers });

    if (!response.ok) {
      throw new Error("Gagal memuat kuota");
    }

    const data = await response.json();
    currentGuestQuota = data.guest_limit || null;
  } catch (error) {
    currentGuestQuota = null;
  }

  renderQuotaInfo();
}

function setupAuthUI() {
  const token = getToken();
  const payload = token ? decodeToken(token) : null;
  const loggedIn = isLoggedIn();

  const authText = document.getElementById("authText");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (loggedIn) {
    authText.innerText = `Login sebagai ${payload.username}`;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    loadHistory();
  } else {
    authText.innerText = "Mode Guest";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    document.getElementById("history").style.display = "none";
  }
}

function goToLogin() {
  window.location.href = "login.html";
}

function logout() {
  localStorage.removeItem("token");
  currentGuestQuota = null;
  setupAuthUI();
  fetchGuestQuota();
}

async function loadHistory() {
  if (!isLoggedIn()) {
    return;
  }

  const token = getToken();
  const historyEl = document.getElementById("history");

  try {
    const response = await fetch("/api/my-submissions", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Gagal memuat riwayat");
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      historyEl.style.display = "block";
      historyEl.innerHTML = "<p class=\"result-title\">Riwayat Anda</p><p class=\"result-row\">Belum ada riwayat verifikasi.</p>";
      return;
    }

    historyEl.style.display = "block";
    historyEl.innerHTML = `
      <p class="result-title">Riwayat Verifikasi Anda</p>
      ${data
        .slice(0, 5)
        .map(
          (item) => `
            <div class="history-item">
              <strong>${item.system_status}</strong> | skor: ${Number(item.similarity_score).toFixed(2)} |
              label: ${item.similarity_label} | final: ${item.final_status}
            </div>
          `
        )
        .join("")}
    `;
  } catch (error) {
    historyEl.style.display = "block";
    historyEl.innerHTML = "<p class=\"result-title\">Riwayat Anda</p><p class=\"result-row\">Riwayat belum dapat dimuat saat ini.</p>";
  }
}

async function submitImage() {
  const fileInput = document.getElementById("image");
  const resultEl = document.getElementById("result");

  if (!fileInput.files[0]) {
    resultEl.style.display = "block";
    resultEl.innerHTML = "<p class=\"result-row\">Pilih gambar terlebih dahulu.</p>";
    return;
  }

  if (!isLoggedIn() && currentGuestQuota && currentGuestQuota.remaining <= 0) {
    renderQuotaInfo();
    resultEl.style.display = "block";
    resultEl.innerHTML = `
      <p class="result-title">Batas Guest Tercapai</p>
      <p class="result-row">Verifikasi guest sudah 3 kali hari ini. Login untuk lanjut tanpa batas.</p>
    `;
    return;
  }

  const formData = new FormData();
  formData.append("image", fileInput.files[0]);

  const headers = {};
  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  setLoadingState(true);

  try {
    const response = await fetch("/api/submit", {
      method: "POST",
      headers,
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      resultEl.style.display = "block";
      resultEl.innerHTML = `
        <p class="result-title">Proses Gagal</p>
        <p class="result-row">${data.message || "Terjadi kesalahan pada server."}</p>
      `;

      if (data.guest_limit) {
        currentGuestQuota = data.guest_limit;
        renderQuotaInfo();
      }

      return;
    }

    if (data.guest_limit) {
      currentGuestQuota = data.guest_limit;
      renderQuotaInfo();
    } else {
      await fetchGuestQuota();
    }

    const labelClass = statusBadgeClass(data.similarity_label);

    resultEl.style.display = "block";
    resultEl.innerHTML = `
      <p class="result-title">Hasil Analisis Otomatis</p>
      <p class="result-row">Status Sistem: <strong>${data.system_status}</strong></p>
      <p class="result-row">Skor Kemiripan: <strong>${Number(data.similarity_score).toFixed(2)}</strong></p>
      <p class="result-row">Label Kecocokan: <span class="badge ${labelClass}">${data.similarity_label}</span></p>
      <p class="result-row">Status Final: <strong>${data.final_status}</strong> (menunggu validasi admin)</p>
    `;

    if (isLoggedIn()) {
      loadHistory();
    }
  } catch (error) {
    resultEl.style.display = "block";
    resultEl.innerHTML = `
      <p class="result-title">Proses Gagal</p>
      <p class="result-row">Tidak dapat terhubung ke server.</p>
    `;
  } finally {
    setLoadingState(false);
  }
}

window.onload = async () => {
  setupAuthUI();
  await fetchGuestQuota();
};
