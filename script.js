// ===== Settings: edit these =====
const CONFIG = {
  whatsapp: "6281297399978",           // country code + number, no "+" or spaces
  businessName: "Millie's Laundry",
  greeting: "Halo, saya mau laundry.",
  priceYear: 2026                      // the year shown as "Harga per ..." (change this one number each year)
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
const estLabel = document.getElementById("estQtyLabel");
function updateEstimate() {
  const opt = estService.options[estService.selectedIndex];
  const unit = opt.dataset.unit || "kg";
  const min = parseFloat(opt.dataset.min) || 0;
  const qty = parseFloat(estKg.value) || 0;
  const round = function (n) { return Math.round(n / 500) * 500; };       // nearest Rp 500
  const fmt = function (n) { return n.toLocaleString("id-ID"); };
  const lo = round(min * qty);
  estTotal.textContent = "Rp " + fmt(lo);
  if (estWa) {   // opens WhatsApp with the customer's choice already typed in
    const msg = "Halo, saya mau " + opt.value + " sekitar " + qty + " " + unit + " (mulai dari " + estTotal.textContent + "). Bisa dibantu?";
    estWa.href = waBase + "?text=" + encodeURIComponent(msg + " (" + CONFIG.businessName + ")");
  }
}
// when the service changes, switch the label (Berat (kg) / Jumlah (pcs) / ...) and a sensible starting amount
function onServiceChange() {
  const opt = estService.options[estService.selectedIndex];
  const unit = opt.dataset.unit || "kg";
  if (estLabel) estLabel.textContent = (unit === "kg" ? "Berat (kg)" : unit === "m²" ? "Luas (m²)" : "Jumlah (" + unit + ")");
  estKg.step = (unit === "kg" || unit === "m²") ? "0.5" : "1";
  estKg.value = unit === "kg" ? 5 : unit === "m²" ? 4 : 1;
  updateEstimate();
}
estService.addEventListener("change", onServiceChange);
estKg.addEventListener("input", updateEstimate);
onServiceChange();

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

  // Wave 1: bubbles rise from the bottom, staggered so they don't move as one block.
  // Wave 2: a trail of bubbles drifts in from the RIGHT edge (up and to the left).
  // Wave 3: a few more follow from the LEFT edge (up and to the right).
  // The page changes at the midpoint (onMid). About 2 seconds in total.
  function runTransition(onMid) {
    if (reduceMotion) { onMid(); return; }
    busy = true;

    const W = window.innerWidth, H = window.innerHeight;
    const count = Math.round(Math.min(50, Math.max(22, W / 22)));        // main wave
    const rightCount = Math.min(14, Math.max(6, Math.round(count * 0.35)));
    const leftCount = Math.min(6, Math.max(3, Math.round(rightCount * 0.45)));
    const maxSize = Math.min(200, W * 0.38);
    const made = [];

    function add(size) {
      const el = makeBubble(size);
      el.style.left = "0px";                       // position is set with GSAP x / y below
      made.push(el);
      return el;
    }

    const tl = gsap.timeline({
      onComplete: function () {
        made.forEach(function (el) { gsap.killTweensOf(el); el.remove(); });
        if (!busy) gsap.set([wash, page], { clearProps: "opacity" });   // skip if a newer transition has started
      }
    });

    // blue "water" wash and page fade out
    tl.to(wash, { opacity: 1, duration: 0.4, ease: "power1.in" }, 0.1);
    tl.to(page, { opacity: 0.25, duration: 0.35, ease: "power1.in" }, 0.1);

    // wave 1: rise from the bottom, spread over about half a second, each a different speed
    for (let i = 0; i < count; i++) {
      const size = rand(40, maxSize);
      const el = add(size);
      const dur = rand(0.8, 1.3) + (size / maxSize) * 0.2;
      const sway = rand(10, 30);
      const x0 = rand(0, W);
      gsap.set(el, { x: x0 });
      tl.fromTo(el, { y: H + size }, { y: -size * 1.5, duration: dur, ease: "none" }, rand(0, 0.55));
      gsap.fromTo(el, { xPercent: -sway }, { xPercent: sway, duration: rand(0.35, 0.6), yoyo: true, repeat: -1, ease: "sine.inOut" });
    }

    // trailing bubbles: they enter from a side, drift diagonally across, then fade out
    function trail(n, fromRight, startMin, startMax, sizeMin, sizeMax) {
      for (let i = 0; i < n; i++) {
        const size = rand(sizeMin, sizeMax);
        const el = add(size);
        const start = rand(startMin, startMax);
        const dur = rand(0.9, 1.3);
        const x0 = fromRight ? W + size : -size;
        const x1 = fromRight ? rand(-W * 0.05, W * 0.45) : rand(W * 0.55, W * 1.05);
        const y0 = rand(H * 0.45, H * 0.95);
        const y1 = rand(-size, H * 0.3);
        gsap.set(el, { x: x0, y: y0 });
        tl.to(el, { x: x1, y: y1, duration: dur, ease: "power1.inOut" }, start);
        tl.to(el, { opacity: 0, duration: 0.3, ease: "power1.in" }, start + dur - 0.3);
        gsap.fromTo(el, { yPercent: -12 }, { yPercent: 12, duration: rand(0.4, 0.7), yoyo: true, repeat: -1, ease: "sine.inOut" });
      }
    }
    trail(rightCount, true, 0.45, 0.9, 30, Math.min(120, maxSize * 0.7));   // right side, after the main wave
    trail(leftCount, false, 0.85, 1.15, 24, Math.min(90, maxSize * 0.5));   // a few from the left, last

    // screen is covered: swap the page now
    tl.call(onMid, null, 0.55);

    // reveal the new position
    tl.to(page, { opacity: 1, duration: 0.45, ease: "power1.out" }, 0.65);
    tl.to(wash, { opacity: 0, duration: 0.45, ease: "power1.out" }, 0.7);

    // allow the next click again once the main wave is done (the trailing bubbles are harmless)
    tl.call(function () { busy = false; }, null, 1.2);
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
// ===== Click sounds =====
// Put your 3-4 sound files in assets/sounds/ and list them here (mp3, ogg or wav). Missing files are skipped quietly.
// Menu links and in-page buttons (Layanan, Lihat Harga, the logo...) play this ONE fixed sound instead of a random one.
const PAGE_SFX_FILE = "assets/sound/sound - page_button.mp3";
const SFX_FILES = [
  "assets/sound/sound - button_1.wav",
  "assets/sounds/sfx2.mp3",
  "assets/sounds/sfx3.mp3",
  "assets/sounds/sfx4.mp3"
];
(function () {
  const toggle = document.getElementById("soundToggle");
  let on = true;
  try { if (localStorage.getItem("sound") === "off") on = false; } catch (e) {}

  const clips = SFX_FILES.map(function (src) {
    const a = new Audio(src);
    a.preload = "auto";
    a.volume = 0.6;
    return a;
  });
  const pageClip = new Audio(PAGE_SFX_FILE);
  pageClip.preload = "auto";
  pageClip.volume = 0.6;
  function playPage() {
    if (!on) return;
    try { pageClip.currentTime = 0; const p = pageClip.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
  }
  let last = -1;
  function play() {
    if (!on || !clips.length) return;
    let i = Math.floor(Math.random() * clips.length);
    if (clips.length > 1 && i === last) i = (i + 1) % clips.length;   // never the same sound twice in a row
    last = i;
    const a = clips[i];
    try { a.currentTime = 0; const p = a.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
  }
  function paint() {
    if (!toggle) return;
    toggle.textContent = on ? "🔊" : "🔇";
    toggle.setAttribute("aria-pressed", String(on));
    toggle.setAttribute("aria-label", "Suara klik: " + (on ? "nyala" : "mati"));
  }
  paint();
  if (toggle) toggle.addEventListener("click", function () {
    on = !on;
    try { localStorage.setItem("sound", on ? "on" : "off"); } catch (e) {}
    paint();
    if (on) play();
  });
  document.addEventListener("click", function (e) {
    // page buttons (links that jump to a section, with the bubble transition): the fixed page sound
    const link = e.target.closest("a[href^='#']");
    const href = link ? link.getAttribute("href") : "";
    if (link && href.length > 1 && document.getElementById(href.slice(1))) { playPage(); return; }

    // every other button: a random sound from the list
    const el = e.target.closest(".btn, .icon-btn, .float-wa, button");
    if (!el || el === toggle) return;
    play();
  });
})();

// ===== Card bubbles =====
// Hover a card with the mouse for about 3 seconds and a few small bubbles float up from it.
(function () {
  if (!window.matchMedia("(hover: hover)").matches) return;                       // mouse only
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;      // respect "reduce motion"
  const HOLD_MS = 3000;
  const rand = function (min, max) { return Math.random() * (max - min) + min; };

  function release(card) {
    const w = card.offsetWidth, h = card.offsetHeight;
    for (let i = 0; i < 6; i++) {
      const size = rand(10, 26);
      const b = document.createElement("span");
      b.className = "bubble card-bubble";
      b.style.setProperty("--size", size + "px");
      b.style.setProperty("--swirl", rand(6, 12) + "s");
      b.style.left = rand(w * 0.08, w * 0.92) + "px";
      b.style.top = h + "px";
      b.style.opacity = "0";
      card.appendChild(b);
      const rise = rand(70, 140), sway = rand(-18, 18);
      const anim = b.animate([
        { transform: "translate(0,0) scale(.6)", opacity: 0 },
        { transform: "translate(" + sway / 2 + "px," + -rise * 0.3 + "px) scale(1)", opacity: 1, offset: 0.2 },
        { transform: "translate(" + sway + "px," + -rise + "px) scale(1)", opacity: 0 }
      ], { duration: rand(1700, 2500), delay: i * rand(80, 220), easing: "ease-out", fill: "both" });
      anim.onfinish = function () { b.remove(); };
    }
  }

  document.querySelectorAll(".card").forEach(function (card) {
    let timer = null;
    card.addEventListener("pointerenter", function (e) {
      if (e.pointerType !== "mouse") return;
      clearTimeout(timer);
      timer = setTimeout(function () { release(card); }, HOLD_MS);
    });
    card.addEventListener("pointerleave", function () { clearTimeout(timer); });
  });
})();

// ===== Price list tabs =====
(function () {
  const tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  if (!tabs.length) return;
  function select(tab, focus) {
    tabs.forEach(function (t) {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute("aria-controls"));
      if (panel) panel.hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { select(tab, false); });
    tab.addEventListener("keydown", function (e) {      // arrow keys move between tabs
      let j = -1;
      if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
      if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
      if (j > -1) { e.preventDefault(); select(tabs[j], true); }
    });
  });
})();

// ===== "Harga per 2026" =====
// Every <span class="price-year"> shows CONFIG.priceYear. Change the year in ONE place (CONFIG at the top) after you update your prices.
document.querySelectorAll(".price-year").forEach(function (el) { el.textContent = CONFIG.priceYear; });