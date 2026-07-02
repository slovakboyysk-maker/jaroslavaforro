const BLOCKED_EXTENSIONS = [".exe", ".bat", ".cmd", ".com", ".msi", ".scr", ".js", ".vbs", ".ps1", ".php", ".html", ".htm", ".zip", ".rar", ".7z"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".bmp", ".heic", ".heif"];
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const DANGEROUS_SIGNATURES = [
  { name: "Windows executable", bytes: [0x4d, 0x5a] },
  { name: "ELF executable", bytes: [0x7f, 0x45, 0x4c, 0x46] }
];

function bytesMatch(buffer, signature, offset = 0) {
  return signature.every((byte, index) => buffer[offset + index] === byte);
}

function getFileExtension(filename) {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

function fileLooksLikeImage(file) {
  const extension = getFileExtension(file.name);

  if (ALLOWED_EXTENSIONS.includes(extension)) {
    return true;
  }

  return Boolean(file.type && file.type.startsWith("image/"));
}

function findDangerousContent(buffer) {
  const view = new Uint8Array(buffer);

  for (const signature of DANGEROUS_SIGNATURES) {
    if (bytesMatch(view, signature.bytes, 0)) {
      return signature.name;
    }
  }

  return null;
}

async function readFileHeader(file, length = 64) {
  return file.slice(0, length).arrayBuffer();
}

function verifyImageLoads(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function () {
      const image = new Image();

      image.onload = function () {
        resolve(true);
      };

      image.onerror = function () {
        reject(new Error("Could not read image file. Try JPG or PNG instead."));
      };

      image.src = reader.result;
    };

    reader.onerror = function () {
      reject(new Error("Could not read image file."));
    };

    reader.readAsDataURL(file);
  });
}

async function validateUploadFile(file) {
  if (!file) {
    throw new Error("No file selected.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File is too large. Maximum size is 10 MB.");
  }

  const extension = getFileExtension(file.name);

  if (BLOCKED_EXTENSIONS.includes(extension)) {
    throw new Error("This file type is not allowed. Please upload an image only.");
  }

  if (!fileLooksLikeImage(file)) {
    throw new Error("Only image files are allowed.");
  }

  const header = await readFileHeader(file);
  const dangerous = findDangerousContent(header);

  if (dangerous) {
    throw new Error(`Upload blocked: possible ${dangerous} detected.`);
  }

  await verifyImageLoads(file);
  return true;
}

function verifyDataUrlImage(dataUrl) {
  if (!dataUrl.startsWith("data:image/")) {
    throw new Error("Download blocked: file is not a valid image.");
  }
}

async function dataUrlToBlob(dataUrl) {
  verifyDataUrlImage(dataUrl);

  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/data:([^;]+)/)?.[1] || "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mime });
}

async function downloadPhoto(index) {
  const photo = getPhotos()[index];

  if (!photo?.image) {
    alert("Photo not found.");
    return;
  }

  try {
    const blob = await dataUrlToBlob(photo.image);
    const safeName = (photo.name || "photo").replace(/[^\w\- ]+/g, "").trim() || "photo";
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${safeName}.jpg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    alert(error.message || "Download blocked for your safety.");
  }
}
