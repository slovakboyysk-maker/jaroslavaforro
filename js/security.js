const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const BLOCKED_EXTENSIONS = [".exe", ".bat", ".cmd", ".com", ".msi", ".scr", ".js", ".vbs", ".ps1", ".php", ".html", ".htm", ".svg", ".zip", ".rar", ".7z"];
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const IMAGE_SIGNATURES = [
  { type: "jpeg", bytes: [0xff, 0xd8, 0xff] },
  { type: "png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { type: "gif", bytes: [0x47, 0x49, 0x46] },
  { type: "webp", bytes: [0x52, 0x49, 0x46, 0x46] }
];

const DANGEROUS_SIGNATURES = [
  { name: "Windows executable", bytes: [0x4d, 0x5a] },
  { name: "ELF executable", bytes: [0x7f, 0x45, 0x4c, 0x46] },
  { name: "ZIP archive", bytes: [0x50, 0x4b, 0x03, 0x04] }
];

function bytesMatch(buffer, signature, offset = 0) {
  return signature.every((byte, index) => buffer[offset + index] === byte);
}

function getFileExtension(filename) {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

function detectImageType(buffer) {
  return IMAGE_SIGNATURES.find((signature) => bytesMatch(buffer, signature.bytes))?.type || null;
}

function findDangerousContent(buffer) {
  const view = new Uint8Array(buffer);

  for (const signature of DANGEROUS_SIGNATURES) {
    if (bytesMatch(view, signature.bytes, 0)) {
      return signature.name;
    }
  }

  const text = new TextDecoder().decode(view.slice(0, 256)).toLowerCase();

  if (text.includes("<script") || text.includes("<?php") || text.includes("javascript:")) {
    return "embedded script content";
  }

  return null;
}

async function readFileHeader(file, length = 512) {
  const slice = file.slice(0, length);
  return slice.arrayBuffer();
}

function verifyDataUrlImage(dataUrl) {
  if (!dataUrl.startsWith("data:image/")) {
    throw new Error("Download blocked: file is not a valid image.");
  }

  const base64 = dataUrl.split(",")[1];

  if (!base64) {
    throw new Error("Download blocked: corrupted image data.");
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const header = bytes.buffer.slice(0, Math.min(bytes.length, 512));
  return runSecurityScan(header, "download");
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

  if (!ALLOWED_IMAGE_TYPES.includes(file.type) && !file.type.startsWith("image/")) {
    throw new Error("Only JPG, PNG, WEBP, and GIF images are allowed.");
  }

  const header = await readFileHeader(file);
  const dangerous = findDangerousContent(header);

  if (dangerous) {
    throw new Error(`Upload blocked: possible ${dangerous} detected.`);
  }

  const imageType = detectImageType(header);

  if (!imageType) {
    throw new Error("Upload blocked: file does not look like a real image.");
  }

  return true;
}

function runSecurityScan(buffer, context = "download") {
  const dangerous = findDangerousContent(buffer);

  if (dangerous) {
    throw new Error(`${context === "upload" ? "Upload" : "Download"} blocked: possible ${dangerous} detected.`);
  }

  const imageType = detectImageType(buffer);

  if (!imageType) {
    throw new Error(`${context === "upload" ? "Upload" : "Download"} blocked: file failed safety checks.`);
  }

  return {
    safe: true,
    imageType
  };
}

async function scanBlobBeforeDownload(blob) {
  const header = await blob.slice(0, 512).arrayBuffer();
  return runSecurityScan(header, "download");
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

  const blob = new Blob([bytes], { type: mime });
  await scanBlobBeforeDownload(blob);

  return blob;
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
