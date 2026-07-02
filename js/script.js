function isAdmin() {
  return localStorage.getItem("admin") === "true";
}

function login(event) {
  event.preventDefault();

  const password = document.getElementById("password").value;

  if (password === "admin123") {
    localStorage.setItem("admin", "true");
    window.location.href = "dashboard.html";
  } else {
    alert("Wrong password");
  }
}

function logout() {
  localStorage.removeItem("admin");
  window.location.href = "admin.html";
}

function addPhoto() {
  const name = document.getElementById("photoName").value;
  const caption = document.getElementById("photoCaption").value;
  const file = document.getElementById("photoImage").files[0];

  if (!name || !caption || !file) {
    alert("Please complete all fields.");
    return;
  }

  const reader = new FileReader();

  reader.onload = function () {
    const photos =
