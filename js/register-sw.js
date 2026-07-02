if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/jaroslavaforro/sw.js", {
      scope: "/jaroslavaforro/"
    }).catch(function () {
    });
  });
}
