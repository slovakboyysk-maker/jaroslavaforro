// Check if admin is logged in
function isAdmin() {
    return localStorage.getItem("admin") === "true";
}

// Logout
function logout() {
    localStorage.removeItem("admin");
    window.location.href = "admin.html";
}

// Add photo
function addPhoto() {

    const name = document.getElementById("photoName").value;
    const caption = document.getElementById("photoCaption").value;
    const file = document.getElementById("photoImage").files[0];

    if (!name || !caption || !file) {
        alert("Please complete all fields.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e){

        let photos = JSON.parse(localStorage.getItem("photos")) || [];

        photos.unshift({
            name: name,
            caption: caption,
            image: e.target.result
        });

        localStorage.setItem("photos", JSON.stringify(photos));

        alert("Photo uploaded!");

        location.reload();

    }

    reader.readAsDataURL(file);

}
