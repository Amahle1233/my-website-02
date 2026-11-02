"use strict";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
 
/* ---- Mobile nav toggle ---- */
const toggle = $(".nav-toggle"), nav = $("#nav");
if (toggle) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });
  $$("#nav a").forEach(a => a.addEventListener("click", () => {
    nav.classList.remove("open"); toggle.setAttribute("aria-expanded", false);
  }));
}
/* ---- Dynamic footer year + highlight current page ---- */
const yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();
$$("#nav a").forEach(a => { if (a.href === location.href) a.setAttribute("aria-current", "page"); });
 
/* ---- Shared validation helpers ---- */
function setError(form, id, msg) {
  const f = form.querySelector("#" + id), e = form.querySelector("#" + id + "Error");
  if (e) e.textContent = msg;
  if (f) { f.classList.toggle("invalid", !!msg); f.setAttribute("aria-invalid", !!msg); }
  return !msg;
}
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^(\+27|0)[0-9\s-]{8,12}$/;   // South African numbers
function checkCommon(form, phoneRequired) {
  const v = n => form.elements[n].value.trim();
  let ok = true;
  ok = setError(form, "name", v("name").length < 2 ? "Enter your full name (at least 2 characters)." : "") && ok;
  ok = setError(form, "email", !EMAIL.test(v("email")) ? "Enter a valid email, e.g. name@example.com." : "") && ok;
  const p = v("phone");
  ok = setError(form, "phone", (phoneRequired || p) && !PHONE.test(p) ? "Enter a SA number, e.g. 031 003 1900 or +27 31 003 1900." : "") && ok;
  return ok;
}
 
/* ---- Contact form: validate, then compile an email ---- */
const cf = $("#contactForm");
if (cf) {
  cf.addEventListener("submit", e => {
    e.preventDefault();
    const v = n => cf.elements[n].value.trim();
    let ok = checkCommon(cf, false);
    ok = setError(cf, "subject", !v("subject") ? "Choose what your message is about." : "") && ok;
    ok = setError(cf, "message", v("message").length < 10 || v("message").length > 1000 ? "Message must be 10 to 1000 characters." : "") && ok;
    if (!ok) { cf.querySelector(".invalid").focus(); return; }
    const body = `Name: ${v("name")}\nEmail: ${v("email")}\nPhone: ${v("phone") || "n/a"}\n\n${v("message")}`;
    const mail = `mailto:info@teamcg.co.za?subject=${encodeURIComponent(v("subject") + " - " + v("name"))}&body=${encodeURIComponent(body)}`;
    $("#contactResult").hidden = false;
    $("#contactResult").textContent = `Thanks ${v("name")}! Your email app should open with your message ready to send to info@teamcg.co.za.`;
    window.location.href = mail;
    cf.reset();
  });
}
 
/* ---- Enquiry form: validate, AJAX submit, show a cost estimate ---- */
const PRICES = { "Corporate polo shirt": 150, "Branded hoodie": 320, "Custom cap": 90, "Branded mug": 70, "Gift hamper": 250 };
const ef = $("#enquiryForm");
if (ef) {
  const d = new Date(); d.setDate(d.getDate() + 7);
  ef.elements.date.min = d.toISOString().split("T")[0];
  ef.addEventListener("submit", async e => {
    e.preventDefault();
    const v = n => ef.elements[n].value.trim();
    let ok = checkCommon(ef, true);
    ok = setError(ef, "product", !v("product") ? "Select a product." : "") && ok;
    const qty = Number(v("qty"));
    ok = setError(ef, "qty", !Number.isInteger(qty) || qty < 10 || qty > 5000 ? "Enter a whole number from 10 to 5000." : "") && ok;
    ok = setError(ef, "date", !v("date") || v("date") < ef.elements.date.min ? "Choose a date at least 7 days from today." : "") && ok;
    ok = setError(ef, "consent", !ef.elements.consent.checked ? "Please agree to be contacted." : "") && ok;
    if (!ok) { ef.querySelector(".invalid").focus(); return; }
 
    const delivery = ef.elements.delivery.value;
    const discount = qty >= 500 ? 0.15 : qty >= 100 ? 0.10 : 0;
    const total = PRICES[v("product")] * qty * (1 - discount) + (delivery === "same-day" ? 250 : 0);
    const out = $("#enquiryResult");
    out.hidden = false;
    out.innerHTML = `<strong>Thanks ${v("name")}, your enquiry was received.</strong><br>
      ${qty} x ${v("product")} (${delivery} delivery): estimated <strong>R${total.toLocaleString("en-ZA")}</strong>
      ${discount ? `incl. ${discount * 100}% bulk discount` : ""}. Stock is available; production takes about ${qty > 500 ? 14 : 7} working days.
      We will confirm a final quote at ${v("email")}.`;
    try {   // AJAX: send without reloading the page
      await fetch(ef.action, { method: "POST", body: new FormData(ef) });
    } catch (err) { console.warn("Submission service unreachable:", err); }
    ef.reset();
  });
}
 
/* ---- Services: dynamic products, search, filter, sort ---- */
const PRODUCTS = [
  { name: "Corporate polo shirt", cat: "Clothing", price: 150, img: "image_hlw-wc2026-za-green-playeraway-1.jpg", alt: "Green team polo shirt" },
  { name: "Branded hoodie", cat: "Clothing", price: 320, img: "Untitled-2-25-768x768.png", alt: "Branded team hoodie" },
  { name: "Custom cap", cat: "Clothing", price: 90, img: "Untitled-2-25-768x768.png", alt: "Custom embroidered cap" },
  { name: "Branded mug", cat: "Gifts", price: 70, img: "image_hlw-wc2026-za-green-playeraway-1.jpg", alt: "Mug with company logo" },
  { name: "Gift hamper", cat: "Gifts", price: 250, img: "Untitled-2-25-768x768.png", alt: "Corporate gift hamper" },
];
const grid = $("#productGrid");
if (grid) {
  const q = $("#search"), cat = $("#category"), sort = $("#sort");
  const render = () => {
    const term = q.value.trim().toLowerCase();
    let list = PRODUCTS.filter(p => (!term || p.name.toLowerCase().includes(term)) && (cat.value === "all" || p.cat === cat.value));
    list.sort((a, b) => sort.value === "az" ? a.name.localeCompare(b.name) : sort.value === "low" ? a.price - b.price : b.price - a.price);
    grid.innerHTML = list.length ? list.map(p => `<article class="product-card">
        <img src="../Assets/${p.img}" alt="${p.alt}" width="300" height="200" loading="lazy" tabindex="0" data-full="${p.img}" data-cap="${p.name}">
        <h3>${p.name}</h3><p>${p.cat}</p><p class="price">From R${p.price}</p>
        <a class="btn" href="./enquiry.html">Enquire</a></article>`).join("")
      : `<p class="empty">No products match your search. Clear it or change the category.</p>`;
  };
  [q, cat, sort].forEach(el => el.addEventListener("input", render));
  render();
 
  /* Lightbox */
  const lb = $("#lightbox"), lbImg = $("img", lb), lbCap = $("figcaption", lb);
  const open = el => { lbImg.src = "../Assets/" + el.dataset.full; lbImg.alt = el.alt; lbCap.textContent = el.dataset.cap; lb.hidden = false; $("button", lb).focus(); };
  grid.addEventListener("click", e => e.target.matches("img") && open(e.target));
  grid.addEventListener("keydown", e => e.key === "Enter" && e.target.matches("img") && open(e.target));
  lb.addEventListener("click", e => { if (e.target === lb || e.target.matches("button")) lb.hidden = true; });
  document.addEventListener("keydown", e => e.key === "Escape" && (lb.hidden = true));
}
 
/* ---- Accordion (FAQ) ---- */
$$(".acc-btn").forEach(btn => btn.addEventListener("click", () => {
  const panel = btn.nextElementSibling, open = btn.getAttribute("aria-expanded") === "true";
  btn.setAttribute("aria-expanded", !open);
  panel.style.maxHeight = open ? 0 : panel.scrollHeight + "px";
}));
 
/* ---- Leaflet map (contact page) ---- */
if ($("#map") && window.L) {
  const pos = [-29.8587, 31.0218];
  const map = L.map("map").setView(pos, 14);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
  L.marker(pos).addTo(map).bindPopup("<b>Team Clothing and Gifts</b><br>2nd Floor, 1st Avenue, Durban").openPopup();
}
 