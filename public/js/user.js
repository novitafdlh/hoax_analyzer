async function submitImage() {
  const fileInput = document.getElementById("image");
  const formData = new FormData();
  formData.append("image", fileInput.files[0]);

  const token = localStorage.getItem("token");

  const response = await fetch("/api/submit", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token
    },
    body: formData
  });

  const data = await response.json();

  document.getElementById("result").innerHTML = `
    <p>Status Sistem: ${data.system_status}</p>
    <p>Similarity Score: ${data.similarity_score}</p>
    <p>Label: ${data.similarity_label}</p>
  `;
}
