const MANTLE_BASE = "https://mantledb.sh/v2/jf1783020430379";
const MANTLE_KEY = "9ebc3ddf8fa0359e52f0bb5dfb79d25167febcc84993fef63a1405d3cd8ae53f";
const API_PREFIX = "/jaroslavaforro/site-api";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (!url.pathname.startsWith(API_PREFIX)) {
    return;
  }

  const mantlePath = url.pathname.slice(API_PREFIX.length) || "/";

  event.respondWith(proxyToMantle(event.request, mantlePath));
});

async function proxyToMantle(request, mantlePath) {
  const headers = {
    "Content-Type": "application/json",
    "X-Mantle-Key": MANTLE_KEY
  };

  const options = {
    method: request.method,
    headers
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    options.body = await request.text();
  }

  const response = await fetch(`${MANTLE_BASE}${mantlePath}`, options);
  const body = await response.text();

  return new Response(body, {
    status: response.status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
