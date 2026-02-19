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
    html += `
      <div style="border:1px solid #ccc; margin:10px; padding:10px;">
        <p>ID: ${item.id}</p>
        <p>Similarity: ${item.similarity_score}</p>
        <p>Label: ${item.similarity_label}</p>
        <button onclick="validate(${item.id}, 'terverifikasi')">Valid</button>
        <button onclick="validate(${item.id}, 'ditolak')">Tolak</button>
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

window.onload = function() {
  loadStats();
};
