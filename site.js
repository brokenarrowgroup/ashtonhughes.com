/* ashtonhughes.com — shared site behavior. Vanilla JS, no libraries, no trackers. */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- mobile nav toggle ---------- */
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  if (header && toggle) {
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- gentle fade-in on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if (reducedMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) { el.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
      revealEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- gallery lightbox (vanilla) ---------- */
  var grid = document.querySelector(".gallery-grid");
  var lightbox = document.querySelector(".lightbox");
  if (grid && lightbox) {
    var links = Array.prototype.slice.call(grid.querySelectorAll("a"));
    var lbImg = lightbox.querySelector("img");
    var lbCount = lightbox.querySelector(".lb-count");
    var btnClose = lightbox.querySelector(".lb-close");
    var btnPrev = lightbox.querySelector(".lb-prev");
    var btnNext = lightbox.querySelector(".lb-next");
    var current = -1;
    var lastFocus = null;

    function show(i) {
      current = (i + links.length) % links.length;
      var link = links[current];
      lbImg.src = link.getAttribute("href");
      var thumb = link.querySelector("img");
      lbImg.alt = thumb ? thumb.alt : "";
      if (lbCount) lbCount.textContent = (current + 1) + " / " + links.length;
      /* pre-load neighbors so prev/next feels instant */
      [current + 1, current - 1].forEach(function (n) {
        var neighbor = links[(n + links.length) % links.length];
        var pre = new Image();
        pre.src = neighbor.getAttribute("href");
      });
    }

    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      lightbox.classList.add("open");
      document.body.style.overflow = "hidden";
      btnClose.focus();
    }

    function close() {
      lightbox.classList.remove("open");
      lbImg.src = "";
      document.body.style.overflow = "";
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    links.forEach(function (link, i) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        open(i);
      });
    });

    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", function () { show(current - 1); });
    btnNext.addEventListener("click", function () { show(current + 1); });

    /* backdrop click closes (but not clicks on the image or buttons) */
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) close();
    });

    /* keyboard: arrows + Escape */
    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(current - 1);
      else if (e.key === "ArrowRight") show(current + 1);
    });

    /* touch swipe */
    var touchX = null, touchY = null;
    lightbox.addEventListener("touchstart", function (e) {
      if (e.touches.length === 1) {
        touchX = e.touches[0].clientX;
        touchY = e.touches[0].clientY;
      }
    }, { passive: true });
    lightbox.addEventListener("touchend", function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      var dy = e.changedTouches[0].clientY - touchY;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) show(current + 1);
        else show(current - 1);
      }
      touchX = touchY = null;
    }, { passive: true });
  }
})();
