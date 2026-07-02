// Check if admin is logged in
function isAdmin() {
    return localStorage.getItem("admin") === "true";
}

// Logout
function logout() {
    localStorage.removeItem("admin");
    window.location.href = "admin.html";
}

// Load gallery
function loadGallery() {
    const gallery = document.getElementById("gallery");

    if (!gallery) return;

    let photos = JSON.parse(localStorage.getItem("photos")) || [];

    gallery.innerHTML = "";

    photos.forEach((photo, index) => {

        gallery.innerHTML += `

        <div class="card">

            <img src="${photo.image}" alt="${photo.name}">

            <div style="padding:20px">

                <h3>${photo.name}</h3>

                <p>${photo.caption}</p>

            </div>

        </div>

        `;

    });

}

// Add photo
function addPhoto() {

    let name = document.getElementById("photoName").value;
    let caption = document.getElementById("photoCaption").value;
    let image = document.getElementById("photoImage").value;

    if(name==""||caption==""||image==""){

        alert("Please complete every field.");

        return;

    }

    let photos = JSON.parse(localStorage.getItem("photos")) || [];

    photos.push({

        name,

        caption,

        image

    });

    localStorage.setItem("photos",JSON.stringify(photos));

    alert("Photo added!");

    location.reload();

}
