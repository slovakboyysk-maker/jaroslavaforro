if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/jaroslavaforro/sw.js?v=3", {
      scope: "/jaroslavaforro/"
    }).catch(function () {
    });
  });
}
