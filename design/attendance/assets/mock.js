// Theme switch for the review sheets: ?theme=dark|light|system, remembered in
// localStorage, system preference otherwise. Frames inherit from <html>.
(function () {
  var KEY = "flexi-design-theme";
  var params = new URLSearchParams(location.search);
  var media = window.matchMedia("(prefers-color-scheme: dark)");

  function stored() {
    return params.get("theme") || localStorage.getItem(KEY) || "system";
  }
  function apply(pref) {
    var dark = pref === "dark" || (pref === "system" && media.matches);
    document.documentElement.classList.toggle("dark", dark);
    document.querySelectorAll("[data-theme-pick]").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-theme-pick") === pref);
    });
  }
  function set(pref) {
    localStorage.setItem(KEY, pref);
    apply(pref);
  }

  apply(stored());
  media.addEventListener("change", function () {
    apply(stored());
  });

  document.addEventListener("DOMContentLoaded", function () {
    apply(stored());
    document.querySelectorAll("[data-theme-pick]").forEach(function (b) {
      b.addEventListener("click", function () {
        set(b.getAttribute("data-theme-pick"));
      });
    });
  });

  // Shared helpers for the sheets that render rows from data.
  window.fmt = {
    // 491 -> "8:11"; negative -> "-0:25"; signed -> "+0:11"
    hm: function (min, signed) {
      var sign = min < 0 ? "-" : signed && min > 0 ? "+" : "";
      var a = Math.abs(min);
      var h = Math.floor(a / 60);
      var m = a % 60;
      return sign + h + ":" + (m < 10 ? "0" : "") + m;
    },
    initials: function (name) {
      return name
        .split(" ")
        .map(function (p) {
          return p[0];
        })
        .slice(0, 2)
        .join("")
        .toUpperCase();
    },
  };
})();
