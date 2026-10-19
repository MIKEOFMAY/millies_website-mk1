// ===== Settings: edit these =====
const CONFIG = {
  whatsapp: "62XXXXXXXXXX",           // country code + number, no "+" or spaces
  businessName: "[NAMA LAUNDRY]",
  greeting: "Halo, saya mau laundry."
};

// ===== WhatsApp links =====
const waBase = "https://wa.me/" + CONFIG.whatsapp;
document.querySelectorAll("[data-wa]").forEach(function (a) {
  a.href = waBase + "?text=" + encodeURIComponent(CONFIG.greeting + " (" + CONFIG.businessName + ")");
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
function updateEstimate() {
  const price = parseFloat(estService.value) || 0;
  const kg = parseFloat(estKg.value) || 0;
  estTotal.textContent = "Rp " + Math.round(price * kg).toLocaleString("id-ID");
}
estService.addEventListener("change", updateEstimate);
estKg.addEventListener("input", updateEstimate);
updateEstimate();

// ===== Testimonial carousel =====
const carousel = document.getElementById("carousel");
function slide(dir) {
  const card = carousel.querySelector(".quote");
  const step = card ? card.getBoundingClientRect().width + 18 : 320;
  carousel.scrollBy({ left: dir * step, behavior: "smooth" });
}
document.getElementById("tPrev").addEventListener("click", function () { slide(-1); });
document.getElementById("tNext").addEventListener("click", function () { slide(1); });

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