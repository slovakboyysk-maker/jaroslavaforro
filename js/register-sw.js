if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/jaroslavaforro/sw.js?v=4", {
      scope: "/jaroslavaforro/"
    }).catch(function () {
    });
  });
}
