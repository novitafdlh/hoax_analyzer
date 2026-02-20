async function loadSubmissions(status) {
  const token = localStorage.getItem("token");

  const response = await fetch(`/api/submissions/status/${status}`, {
    headers: {
      Authorization: "Bearer " + token
    }
  });

  const data = await response.json();

  let html = "";

  data.forEach(item => {

    let labelClass = "status-low";
    if (item.similarity_label === "tinggi") labelClass = "status-high";
    if (item.similarity_label === "sedang") labelClass = "status-medium";

    html += `
      <div class="submission-card">
        <p><strong>ID:</strong> ${item.id}</p>
        <p><strong>Similarity:</strong> ${item.similarity_score.toFixed(2)}</p>
        <p><strong>Label:</strong> 
          <span class="${labelClass}">
            ${item.similarity_label}
          </span>
        </p>
        <button class="action-btn valid-btn" onclick="validate(${item.id}, 'terverifikasi')">Valid</button>
        <button class="action-btn reject-btn" onclick="validate(${item.id}, 'ditolak')">Tolak</button>
      </div>
    `;
  });

  document.getElementById("list").innerHTML = html;
}

async function validate(id, status) {
  const token = localStorage.getItem("token");

  await fetch(`/api/submission/validate/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({ final_status: status })
  });

async function loadStats() {
  const token = localStorage.getItem("token");

  const response = await fetch("/api/dashboard/stats", {
    headers: {
      Authorization: "Bearer " + token
    }
  });

  const data = await response.json();

  renderChart(data);
}

  alert("Status diperbarui");
}

function renderChart(data) {

  document.getElementById("totalCount").innerText = data.total;
  document.getElementById("menungguCount").innerText = data.menunggu;
  document.getElementById("validCount").innerText = data.valid;
  document.getElementById("ditolakCount").innerText = data.ditolak;

  const ctx = document.getElementById("statsChart").getContext("2d");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Menunggu", "Terverifikasi", "Ditolak"],
      datasets: [{
        label: "Jumlah Submission",
        data: [
          data.menunggu,
          data.valid,
          data.ditolak
        ]
      }]
    }
  });
}

async function uploadOfficial() {
  const title = document.getElementById("officialTitle").value;
  const file = document.getElementById("officialImage").files[0];

  const formData = new FormData();
  formData.append("title", title);
  formData.append("image", file);

  const token = localStorage.getItem("token");

  const response = await fetch("/api/upload-official", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token
    },
    body: formData
  });

  const data = await response.json();

  document.getElementById("uploadResult").innerText = data.message || "Upload selesai";
}

function showSection(section) {
  document.getElementById("dashboardSection").style.display = "none";
  document.getElementById("uploadSection").style.display = "none";
  document.getElementById("statusSection").style.display = "none";

  if (section === "dashboard") {
    document.getElementById("dashboardSection").style.display = "block";
  }
  if (section === "upload") {
    document.getElementById("uploadSection").style.display = "block";
  }
  if (section === "status") {
    document.getElementById("statusSection").style.display = "block";
  }
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

window.onload = function() {
  loadStats();
};
