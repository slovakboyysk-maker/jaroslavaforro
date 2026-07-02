const PASSWORD = "Jaroslava2025";
const MANTLE_NAMESPACE = STORAGE_CONFIG.mantleNamespace;
const MANTLE_KEY = STORAGE_CONFIG.mantleKey;
const MANTLE_BASE = `https://mantledb.sh/v2/${MANTLE_NAMESPACE}`;

let photosCache = [];
let reviewsCache = [];

function isAdmin() {
  return sessionStorage.getItem("admin") === "true";
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function mantleRequest(path, method = "GET", body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Mantle-Key": MANTLE_KEY
    }
  };

  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${MANTLE_BASE}${path}`, options);

  if (response.status === 404) {
    return null;
  }

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || "Could not reach site storage.");
  }

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function loadPhotos() {
  const photos = await mantleRequest("/photos");
  photosCache = Array.isArray(photos) ? photos : [];
  return photosCache;
}

async function loadReviews() {
  const reviews = await mantleRequest("/reviews");
  reviewsCache = Array.isArray(reviews) ? reviews : [];
  return reviewsCache;
}

function getPhotos() {
  return photosCache;
}

function getReviews() {
  return reviewsCache;
}

async function savePhotos(photos) {
  await mantleRequest("/photos", "POST", photos);
  photosCache = photos;
}

async function saveReviews(reviews) {
  await mantleRequest("/reviews", "POST", reviews);
  reviewsCache = reviews;
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function () {
      const image = new Image();

      image.onload = function () {
        const maxSize = 1400;
        let width = image.width;
        let height = image.height;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height / width) * maxSize);
            width = maxSize;
          } else {
            width = Math.round((width / height) * maxSize);
            height = maxSize;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, width, height);

        canvas.toBlob(function (blob) {
          if (!blob) {
            reject(new Error("Could not process image."));
            return;
          }

          resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
        }, "image/jpeg", 0.85);
      };

      image.onerror = reject;
      image.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadImageToCatbox(file) {
  const formData = new FormData();
  formData.append("reqtype", "fileupload");
  formData.append("fileToUpload", file);

  const response = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: formData
  });

  const url = (await response.text()).trim();

  if (!url.startsWith("http")) {
    throw new Error("Image upload failed.");
  }

  return url;
}

function login(event) {
  if (event) event.preventDefault();

  const password = document.getElementById("password").value;

  if (password !== PASSWORD) {
    alert("Wrong password");
    return;
  }

  sessionStorage.setItem("admin", "true");
  window.location.href = "dashboard.html";
}

function logout() {
  sessionStorage.removeItem("admin");
  window.location.href = "admin.html";
}

async function addPhoto(event) {
  if (event) event.preventDefault();

  const name = document.getElementById("photoName").value.trim();
  const caption = document.getElementById("photoCaption").value.trim();
  const file = document.getElementById("photoImage").files[0];
  const submitButton = event.target.querySelector("button[type='submit']");

  if (!name || !caption || !file) {
    alert("Please complete all photo fields.");
    return;
  }

  try {
    submitButton.disabled = true;
    submitButton.textContent = "Uploading...";

    const resizedFile = await resizeImage(file);
    const imageUrl = await uploadImageToCatbox(resizedFile);
    const photos = [...getPhotos()];

    photos.unshift({ name, caption, image: imageUrl });
    await savePhotos(photos);

    document.getElementById("photoForm").reset();
    await displayDashboardPhotos();
    alert("Photo uploaded. Everyone can see it now.");
  } catch (error) {
    alert(error.message || "Could not upload photo.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Upload Photo";
  }
}

async function deletePhoto(index) {
  try {
    const photos = [...getPhotos()];
    photos.splice(index, 1);
    await savePhotos(photos);
    await displayDashboardPhotos();
  } catch (error) {
    alert(error.message || "Could not delete photo.");
  }
}

async function displayDashboardPhotos() {
  const galleryList = document.getElementById("galleryList");
  if (!galleryList) return;

  await loadPhotos();
  const photos = getPhotos();

  if (photos.length === 0) {
    galleryList.innerHTML = "<p>No photos uploaded yet.</p>";
    return;
  }

  galleryList.innerHTML = photos.map((photo, index) => `
    <div class="photo-item">
      <div>
        <strong>${escapeHtml(photo.name)}</strong>
        <br>
        ${escapeHtml(photo.caption)}
      </div>
      <button class="delete-button" type="button" onclick="deletePhoto(${index})">Delete</button>
    </div>
  `).join("");
}

async function displayGallery() {
  const gallery = document.getElementById("galleryGrid") || document.getElementById("gallery");
  if (!gallery) return;

  gallery.innerHTML = '<div class="empty">Loading gallery...</div>';

  await loadPhotos();
  const photos = getPhotos();

  if (photos.length === 0) {
    gallery.innerHTML = '<div class="empty">No photos have been uploaded yet.</div>';
    return;
  }

  gallery.innerHTML = photos.map((photo, index) => `
    <article class="photo-card">
      <img src="${photo.image}" alt="${escapeHtml(photo.name)}" onclick="openImage(${index})">
      <div class="photo-info">
        <h3>${escapeHtml(photo.name)}</h3>
        <p>${escapeHtml(photo.caption)}</p>
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

async function displayPublicReviews() {
  const container = document.getElementById("reviewsList") || document.getElementById("reviews");
  if (!container) return;

  await loadReviews();
  const reviews = getReviews();
  const admin = isAdmin();

  if (reviews.length === 0) {
    container.innerHTML = '<div class="empty">No reviews yet. Be the first to share your experience!</div>';
    return;
  }

  container.innerHTML = reviews.map((review, index) => `
    <article class="review">
      <h3>${escapeHtml(review.name)}</h3>
      <div class="stars">${escapeHtml(review.rating)}</div>
      <p>${escapeHtml(review.message)}</p>
      ${admin ? `<div class="review-actions"><button class="delete-button" type="button" onclick="deletePublicReview(${index})">Remove</button></div>` : ""}
    </article>
  `).join("");
}

async function submitPublicReview(event) {
  if (event) event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const rating = document.getElementById("rating").value;
  const message = document.getElementById("message").value.trim();
  const submitButton = event.target.querySelector("button[type='submit']");

  if (!name || !message) {
    alert("Please fill in all fields.");
    return;
  }

  try {
    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    const reviews = [...getReviews()];
    reviews.unshift({ name, rating, message });
    await saveReviews(reviews);

    await displayPublicReviews();
    event.target.reset();
    alert("Thank you for your review!");
  } catch (error) {
    alert(error.message || "Could not submit review.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit Review";
  }
}

async function deletePublicReview(index) {
  if (!isAdmin()) return;

  try {
    const reviews = [...getReviews()];
    reviews.splice(index, 1);
    await saveReviews(reviews);
    await displayPublicReviews();
    await displayDashboardReviews();
  } catch (error) {
    alert(error.message || "Could not remove review.");
  }
}

async function addReview(event) {
  if (event) event.preventDefault();

  const name = document.getElementById("reviewName").value.trim();
  const rating = document.getElementById("reviewRating").value;
  const message = document.getElementById("reviewMessage").value.trim();

  if (!name || !message) {
    alert("Please complete all review fields.");
    return;
  }

  try {
    const reviews = [...getReviews()];
    reviews.unshift({ name, rating, message });
    await saveReviews(reviews);

    document.getElementById("reviewForm").reset();
    await displayDashboardReviews();
    alert("Review added.");
  } catch (error) {
    alert(error.message || "Could not add review.");
  }
}

async function deleteReview(index) {
  try {
    const reviews = [...getReviews()];
    reviews.splice(index, 1);
    await saveReviews(reviews);
    await displayDashboardReviews();
  } catch (error) {
    alert(error.message || "Could not delete review.");
  }
}

async function displayDashboardReviews() {
  const reviewList = document.getElementById("reviewList");
  if (!reviewList) return;

  await loadReviews();
  const reviews = getReviews();

  if (reviews.length === 0) {
    reviewList.innerHTML = "<p>No reviews yet.</p>";
    return;
  }

  reviewList.innerHTML = reviews.map((review, index) => `
    <div class="review-item">
      <div>
        <strong>${escapeHtml(review.name)}</strong>
        <br>
        <span class="stars">${escapeHtml(review.rating)}</span>
        <p>${escapeHtml(review.message)}</p>
      </div>
      <button class="delete-button" type="button" onclick="deleteReview(${index})">Delete</button>
    </div>
  `).join("");
}

document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("galleryList")) {
    displayDashboardPhotos();
  }

  if (document.getElementById("reviewList")) {
    displayDashboardReviews();
  }
});
