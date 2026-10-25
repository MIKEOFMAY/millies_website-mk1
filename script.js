// ===== Settings: edit these =====
const CONFIG = {
  whatsapp: "06281297399978",           // country code + number, no "+" or spaces
  businessName: "Millie's Laundry",
  greeting: "Halo, saya mau laundry."
};

// ===== WhatsApp links =====
const waBase = "https://wa.me/" + CONFIG.whatsapp;
document.querySelectorAll("[data-wa]").forEach(function (a) {
  // a button can carry its own message: <a data-wa data-wa-msg="Halo, saya mau tanya dry clean.">
  const msg = a.getAttribute("data-wa-msg") || CONFIG.greeting;
  a.href = waBase + "?text=" + encodeURIComponent(msg + " (" + CONFIG.businessName + ")");
});

// ===== Mobile menu =====
const nav = document.getElementById("nav");
const menuBtn = document.getElementById("menuToggle");
menuBtn.addEventListener("click", function () {
  const open = nav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(open));
});
nav.querySelectorAll("a").forEach(function (a) {
  a.addEventListener("click", function () {
    nav.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  });
});

// ===== Dark / light theme =====
const root = document.documentElement;
try {
  const saved = localStorage.getItem("theme");
  if (saved) root.setAttribute("data-theme", saved);
} catch (e) {}
document.getElementById("themeToggle").addEventListener("click", function () {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  try { localStorage.setItem("theme", next); } catch (e) {}
});

// ===== Price estimator =====
const estService = document.getElementById("estService");
const estKg = document.getElementById("estKg");
const estTotal = document.getElementById("estTotal");
const estWa = document.getElementById("estWa");
function updateEstimate() {
  const opt = estService.options[estService.selectedIndex];
  const min = parseFloat(opt.dataset.min) || 0;
  const max = parseFloat(opt.dataset.max) || min;
  const kg = parseFloat(estKg.value) || 0;
  const round = function (n) { return Math.round(n / 500) * 500; };       // nearest Rp 500
  const fmt = function (n) { return n.toLocaleString("id-ID"); };
  const lo = round(min * kg), hi = round(max * kg);
  estTotal.textContent = lo === hi ? "Rp " + fmt(lo) : "Rp " + fmt(lo) + " – " + fmt(hi);
  if (estWa) {   // the button opens WhatsApp with the customer's choice already typed in
    const msg = "Halo, saya mau laundry " + opt.value + " sekitar " + kg + " kg (perkiraan " + estTotal.textContent + "). Bisa dibantu?";
    estWa.href = waBase + "?text=" + encodeURIComponent(msg + " (" + CONFIG.businessName + ")");
  }
}
estService.addEventListener("change", updateEstimate);
estKg.addEventListener("input", updateEstimate);
updateEstimate();

// ===== Testimonial carousel =====
const carousel = document.getElementById("carousel");
function slide(dir) {
  if (!carousel) return;
  const card = carousel.querySelector(".quote");
  const step = card ? card.getBoundingClientRect().width + 18 : 320;
  carousel.scrollBy({ left: dir * step, behavior: "smooth" });
}
// these buttons can be deleted from the HTML (e.g. when a Google Reviews widget replaces the carousel)
const tPrev = document.getElementById("tPrev");
const tNext = document.getElementById("tNext");
if (tPrev) tPrev.addEventListener("click", function () { slide(-1); });
if (tNext) tNext.addEventListener("click", function () { slide(1); });

// ===== Order tracking via WhatsApp =====
document.getElementById("trackForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const no = document.getElementById("trackInput").value.trim();
  if (!no) return;
  const msg = "Halo, saya mau cek status pesanan nomor " + no + ".";
  window.open(waBase + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
});

// ===== Scroll reveal =====
const items = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  items.forEach(function (el) { io.observe(el); });
} else {
  items.forEach(function (el) { el.classList.add("in"); });
}

// ===== Bubble page transition (GSAP) =====
// Needs the GSAP <script> tag in index.html. If GSAP fails to load, links still work normally.

// External links (WhatsApp, Instagram, Google) open in a new tab so visitors stay on your site
document.querySelectorAll("a[href^='http']").forEach(function (a) {
  if (a.host !== location.host) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
});

(function () {
  if (!window.gsap) return;

  const layer = document.getElementById("bubble-overlay");
  if (!layer) return;
  let wash = layer.querySelector(".bubble-wash");
  if (!wash) {                                   // blue water tint: created here, so the HTML only needs the one div
    wash = document.createElement("div");
    wash.className = "bubble-wash";
    layer.prepend(wash);
  }
  const page = document.querySelector("main");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rand = function (min, max) { return Math.random() * (max - min) + min; };
  let busy = false;

  function makeBubble(size) {
    const el = document.createElement("span");
    el.className = "bubble";
    el.style.setProperty("--size", size + "px");
    el.style.setProperty("--swirl", rand(6, 12) + "s");
    layer.appendChild(el);
    return el;
  }

  // Full-screen bubbles rise, the page changes at the midpoint (onMid), then everything clears. ~1.5s total.
  function runTransition(onMid) {
    if (reduceMotion) { onMid(); return; }
    busy = true;

    const W = window.innerWidth, H = window.innerHeight;
    const count = Math.round(Math.min(70, Math.max(26, W / 18)));
    const maxSize = Math.min(200, W * 0.38);
    const made = [];

    for (let i = 0; i < count; i++) {
      const size = rand(40, maxSize);
      const el = makeBubble(size);
      el.style.left = rand(0, W) + "px";
      made.push({ el: el, size: size });
    }

    const tl = gsap.timeline({
      onComplete: function () {
        made.forEach(function (b) { gsap.killTweensOf(b.el); b.el.remove(); });
        gsap.set([wash, page], { clearProps: "opacity" });
        busy = false;
      }
    });

    // blue "water" wash and page fade out
    tl.to(wash, { opacity: 1, duration: 0.4, ease: "power1.in" }, 0.1);
    tl.to(page, { opacity: 0.25, duration: 0.35, ease: "power1.in" }, 0.1);

    // each bubble rises from below the screen to above it, with a side-to-side wobble
    made.forEach(function (b) {
      const dur = 0.8 + (b.size / maxSize) * 0.3;      // bigger bubbles rise a bit slower
      const sway = rand(10, 30);
      tl.fromTo(b.el, { y: H + b.size }, { y: -b.size * 1.5, duration: dur, ease: "none" }, rand(0, 0.3));
      gsap.fromTo(b.el, { x: -sway }, { x: sway, duration: rand(0.35, 0.6), yoyo: true, repeat: -1, ease: "sine.inOut" });
    });

    // screen is covered: swap the page now
    tl.call(onMid, null, 0.55);

    // reveal the new position
    tl.to(page, { opacity: 1, duration: 0.45, ease: "power1.out" }, 0.65);
    tl.to(wash, { opacity: 0, duration: 0.45, ease: "power1.out" }, 0.7);
  }

  // Small burst of bubbles where the visitor clicked (used for links that open in a new tab)
  function burst(x, y) {
    if (reduceMotion) return;
    for (let i = 0; i < 10; i++) {
      const el = makeBubble(rand(14, 40));
      el.style.left = x + "px";
      el.style.top = y + "px";
      gsap.fromTo(el,
        { x: rand(-24, 24), y: 0, scale: 0.3, opacity: 1 },
        { x: rand(-60, 60), y: -rand(90, 220), scale: 1, opacity: 0, duration: rand(0.7, 1.2), ease: "power1.out",
          onComplete: function () { el.remove(); } });
    }
  }

  // Jump instantly (the page has smooth scrolling in CSS, which would fight the transition)
  function jumpTo(target) {
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    target.scrollIntoView();
    html.style.scrollBehavior = prev;
  }

  document.addEventListener("click", function (e) {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const href = a.getAttribute("href");

    // in-page links (menu, "Lihat Harga", logo): full bubble transition
    if (href.length > 1 && href.charAt(0) === "#") {
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      e.preventDefault();
      if (busy) return;
      runTransition(function () {
        jumpTo(target);
        history.pushState(null, "", href);
      });
      return;
    }

    // external links: bubble burst at the click point, link opens in a new tab
    if (/^https?:/.test(a.href) && a.host !== location.host) {
      burst(e.clientX, e.clientY);
    }
  });
})();

// ===== Shrink the big logo once the visitor scrolls (so it stops covering the content) =====
(function () {
  const header = document.querySelector(".site-header");
  if (!header) return;
  function update() { header.classList.toggle("scrolled", window.scrollY > 40); }
  window.addEventListener("scroll", update, { passive: true });
  update();
})();

// ===== Footer year (updates itself every January) =====
// In the HTML write:  © <span id="year">2026</span> Millie's Laundry
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();