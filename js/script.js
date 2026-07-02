const PASSWORD = "Jaroslava2025";

function getPhotos() {
  return JSON.parse(localStorage.getItem("photos")) || [];
}

function savePhotos(photos) {
  localStorage.setItem("photos", JSON.stringify(photos));
}

function getReviews() {
  return JSON.parse(localStorage.getItem("reviews")) || [];
}

function saveReviews(reviews) {
  localStorage.setItem("reviews", JSON.stringify(reviews));
}

function isAdmin() {
  return localStorage.getItem("admin") === "true";
}

function login(event) {
  if (event) event.preventDefault();

  const password = document.getElementById("password").value;

  if (password === PASSWORD) {
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

function addPhoto(event) {
  if (event) event.preventDefault();

  const name = document.getElementById("photoName").value.trim();
  const caption = document.getElementById("photoCaption").value.trim();
  const file = document.getElementById("photoImage").files[0];

  if (!name || !caption || !file) {
    alert("Please complete all photo fields.");
    return;
  }

  const reader = new FileReader();

  reader.onload = function () {
    const photos = getPhotos();

    photos.unshift({
      name,
      caption,
      image: reader.result
    });

    savePhotos(photos);
    document.getElementById("photoForm").reset();
    displayDashboardPhotos();
    alert("Photo uploaded.");
  };

  reader.readAsDataURL(file);
}

function deletePhoto(index) {
  const photos = getPhotos();
  photos.splice(index, 1);
  savePhotos(photos);
  displayDashboardPhotos();
}

function displayDashboardPhotos() {
  const galleryList = document.getElementById("galleryList");
  if (!galleryList) return;

  const photos = getPhotos();

  if (photos.length === 0) {
    galleryList.innerHTML = "<p>No photos uploaded yet.</p>";
    return;
  }

  galleryList.innerHTML = photos.map((photo, index) => `
    <div class="photo-item">
      <div>
        <strong>${photo.name}</strong>
        <br>
        ${photo.caption}
      </div>
      <button class="delete-button" type="button" onclick="deletePhoto(${index})">Delete</button>
    </div>
  `).join("");
}

function displayGallery() {
  const gallery = document.getElementById("galleryGrid") || document.getElementById("gallery");
  if (!gallery) return;

  const photos = getPhotos();

  if (photos.length === 0) {
    gallery.innerHTML = '<div class="empty">No photos have been uploaded yet.</div>';
    return;
  }

  gallery.innerHTML = photos.map((photo, index) => `
    <article class="photo-card">
      <img src="${photo.image}" alt="${photo.name}" onclick="openImage(${index})">
      <div class="photo-info">
        <h3>${photo.name}</h3>
        <p>${photo.caption}</p>
      </div>
    </article>
  `).join("");
}

function openImage(indexOrSrc) {
  const photos = getPhotos();
  const src = typeof indexOrSrc === "number" ? photos[indexOrSrc]?.image : indexOrSrc;
  if (!src) return;

  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  if (!lightbox || !lightboxImage) return;

  lightbox.style.display = "flex";
  lightboxImage.src = src;
}

function closeImage() {
  const lightbox = document.getElementById("lightbox");
  if (lightbox) lightbox.style.display = "none";
}

function displayPublicReviews() {
  const container = document.getElementById("reviewsList") || document.getElementById("reviews");
  if (!container) return;

  const reviews = getReviews();
  const admin = isAdmin();

  if (reviews.length === 0) {
    container.innerHTML = '<div class="empty">No reviews yet. Be the first to share your experience!</div>';
    return;
  }

  container.innerHTML = reviews.map((review, index) => `
    <article class="review">
      <h3>${review.name}</h3>
      <div class="stars">${review.rating}</div>
      <p>${review.message}</p>
      ${admin ? `<div class="review-actions"><button class="delete-button" type="button" onclick="deletePublicReview(${index})">Remove</button></div>` : ""}
    </article>
  `).join("");
}

function submitPublicReview(event) {
  if (event) event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const rating = document.getElementById("rating").value;
  const message = document.getElementById("message").value.trim();

  if (!name || !message) {
    alert("Please fill in all fields.");
    return;
  }

  const reviews = getReviews();
  reviews.unshift({ name, rating, message });
  saveReviews(reviews);
  displayPublicReviews();
  event.target.reset();
  alert("Thank you for your review!");
}

function deletePublicReview(index) {
  if (!isAdmin()) return;

  const reviews = getReviews();
  reviews.splice(index, 1);
  saveReviews(reviews);
  displayPublicReviews();
  displayDashboardReviews();
}

function addReview(event) {
  if (event) event.preventDefault();

  const name = document.getElementById("reviewName").value.trim();
  const rating = document.getElementById("reviewRating").value;
  const message = document.getElementById("reviewMessage").value.trim();

  if (!name || !message) {
    alert("Please complete all review fields.");
    return;
  }

  const reviews = getReviews();

  reviews.unshift({
    name,
    rating,
    message
  });

  saveReviews(reviews);
  document.getElementById("reviewForm").reset();
  displayDashboardReviews();
  alert("Review added.");
}

function deleteReview(index) {
  const reviews = getReviews();
  reviews.splice(index, 1);
  saveReviews(reviews);
  displayDashboardReviews();
}

function displayDashboardReviews() {
  const reviewList = document.getElementById("reviewList");
  if (!reviewList) return;

  const reviews = getReviews();

  if (reviews.length === 0) {
    reviewList.innerHTML = "<p>No reviews yet.</p>";
    return;
  }

  reviewList.innerHTML = reviews.map((review, index) => `
    <div class="review-item">
      <div>
        <strong>${review.name}</strong>
        <br>
        <span class="stars">${review.rating}</span>
        <p>${review.message}</p>
      </div>
      <button class="delete-button" type="button" onclick="deleteReview(${index})">Delete</button>
    </div>
  `).join("");
}

document.addEventListener("DOMContentLoaded", function () {
  displayDashboardPhotos();
  displayDashboardReviews();
});
