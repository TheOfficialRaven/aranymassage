(function () {
  // Ha megadod, az űrlap megnyitja az email programot ezzel a címmel.
  const CONTACT_EMAIL = "";

  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const drawer = document.querySelector(".nav-drawer");
  const navLinks = document.querySelectorAll(".nav-link, .nav-drawer a, .footer-nav a");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function scrollToId(id) {
    const behavior = reduce ? "auto" : "smooth";
    if (id === "kezdo" || id === "tartalom") {
      window.scrollTo({ top: 0, behavior });
      return;
    }
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - header.offsetHeight + 1;
    window.scrollTo({ top, behavior });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      const id = link.getAttribute("href").slice(1);
      if (!id || !document.getElementById(id) && id !== "kezdo") return;
      event.preventDefault();
      scrollToId(id);
      if (drawer && !drawer.hidden) closeDrawer();
    });
  });

  function closeDrawer() {
    drawer.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Menü megnyitása");
    document.body.classList.remove("nav-open");
  }

  if (toggle && drawer) {
    toggle.addEventListener("click", function () {
      const open = drawer.hidden;
      drawer.hidden = !open;
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Menü bezárása" : "Menü megnyitása");
      document.body.classList.toggle("nav-open", open);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !drawer.hidden) closeDrawer();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 860 && !drawer.hidden) closeDrawer();
    });
  }

  const sections = ["kezdo", "rolam", "galeria", "szolgaltatas", "visszajelzesek", "kapcsolat"]
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  function markActive() {
    const line = window.scrollY + header.offsetHeight + 80;
    let current = "kezdo";
    sections.forEach(function (section) {
      if (section.offsetTop <= line) current = section.id;
    });
    document.querySelectorAll(".nav-link, .nav-drawer a").forEach(function (link) {
      link.classList.toggle("is-active", link.getAttribute("href") === "#" + current);
    });
  }

  function onScroll() {
    header.classList.toggle("is-stuck", window.scrollY > 24);
    markActive();
  }

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  document.querySelectorAll("img").forEach(function (img) {
    img.addEventListener("error", function () {
      img.classList.add("is-missing");
    });
  });

  const viewport = document.querySelector(".reviews-viewport");
  const track = document.querySelector(".reviews-track");
  const cards = track ? Array.prototype.slice.call(track.children) : [];
  const prev = document.querySelector(".rev-prev");
  const next = document.querySelector(".rev-next");
  const dotsWrap = document.querySelector(".rev-dots");
  let index = 0;
  let timer = 0;
  const mobileQuery = window.matchMedia("(max-width: 640px)");

  function cardsPerView() {
    return mobileQuery.matches ? 1 : 2;
  }

  function pageCount() {
    return Math.max(1, Math.ceil(cards.length / cardsPerView()));
  }

  function schedule() {
    window.clearInterval(timer);
    if (reduce || pageCount() < 2) return;
    timer = window.setInterval(function () {
      go(index + 1);
    }, 20000);
  }

  function go(nextIndex) {
    const count = pageCount();
    index = ((nextIndex % count) + count) % count;
    const card = cards[0];
    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap) || 0;
    const width = card.getBoundingClientRect().width;
    const step = cardsPerView();
    track.style.transform = "translate3d(" + (-index * step * (width + gap)) + "px,0,0)";
    dotsWrap.innerHTML = "";
    for (let i = 0; i < count; i += 1) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "dot" + (i === index ? " is-active" : "");
      dot.setAttribute("aria-label", (i + 1) + (step === 1 ? ". vélemény" : ". véleménycsoport"));
      if (i === index) dot.setAttribute("aria-current", "true");
      dot.addEventListener("click", function () { go(i); });
      dotsWrap.appendChild(dot);
    }
    schedule();
  }

  if (track && cards.length && prev && next && dotsWrap) {
    prev.addEventListener("click", function () { go(index - 1); });
    next.addEventListener("click", function () { go(index + 1); });
    window.addEventListener("resize", function () { go(index); });

    let startX = 0;
    let tracking = false;
    viewport.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "mouse") return;
      tracking = true;
      startX = event.clientX;
    });
    viewport.addEventListener("pointerup", function (event) {
      if (!tracking) return;
      tracking = false;
      const delta = event.clientX - startX;
      if (Math.abs(delta) > 40) go(index + (delta < 0 ? 1 : -1));
    });

    go(0);
  }

  const form = document.getElementById("contact-form");
  if (form) {
    const status = form.querySelector(".form-status");

    function setError(input, message) {
      const field = input.closest(".field");
      const error = field.querySelector(".error");
      field.classList.toggle("has-error", Boolean(message));
      input.setAttribute("aria-invalid", message ? "true" : "false");
      error.hidden = !message;
      error.textContent = message || "";
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const name = form.nev.value.trim();
      const email = form.email.value.trim();
      const message = form.uzenet.value.trim();
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      setError(form.nev, name ? "" : "Kérlek, add meg a neved.");
      setError(form.email, emailOk ? "" : "Kérlek, adj meg egy érvényes email címet.");
      setError(form.uzenet, message ? "" : "Kérlek, írd meg az üzeneted.");

      if (!name || !emailOk || !message) {
        status.textContent = "";
        const firstInvalid = form.querySelector("[aria-invalid='true']");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      if (CONTACT_EMAIL) {
        const body = "Név: " + name + "\nEmail: " + email + "\n\n" + message;
        window.location.href = "mailto:" + CONTACT_EMAIL
          + "?subject=" + encodeURIComponent("Üzenet a weboldalról")
          + "&body=" + encodeURIComponent(body);
      }

      status.textContent = "Köszönöm az üzeneted. Hamarosan jelentkezem.";
      form.reset();
    });
  }

  const lightbox = document.getElementById("gallery-lightbox");
  const lightboxImg = lightbox ? lightbox.querySelector("img") : null;
  const galleryButtons = Array.prototype.slice.call(document.querySelectorAll(".gallery-open"));
  let galleryIndex = 0;

  function fitLightbox() {
    const maxW = Math.min(window.innerWidth - 48, 1040);
    const maxH = window.innerHeight - 48;
    const nw = lightboxImg.naturalWidth || maxW;
    const nh = lightboxImg.naturalHeight || maxH;
    const scale = Math.min(maxW / nw, maxH / nh);
    lightboxImg.style.width = Math.round(nw * scale) + "px";
    lightboxImg.style.height = Math.round(nh * scale) + "px";
  }

  function showGallery(index) {
    if (!lightbox || !galleryButtons.length) return;
    galleryIndex = (index + galleryButtons.length) % galleryButtons.length;
    const source = galleryButtons[galleryIndex].querySelector("img");
    lightboxImg.src = source.currentSrc || source.src;
    lightboxImg.alt = source.alt;
    const apply = function () {
      fitLightbox();
    };
    if (lightboxImg.complete && lightboxImg.naturalWidth) apply();
    else lightboxImg.addEventListener("load", apply, { once: true });
    if (!lightbox.open) lightbox.showModal();
  }

  galleryButtons.forEach(function (button, index) {
    button.addEventListener("click", function () {
      showGallery(index);
    });
  });

  if (lightbox) {
    lightbox.querySelector(".lightbox-close").addEventListener("click", function () {
      lightbox.close();
    });
    lightbox.querySelector(".lightbox-prev").addEventListener("click", function () {
      showGallery(galleryIndex - 1);
    });
    lightbox.querySelector(".lightbox-next").addEventListener("click", function () {
      showGallery(galleryIndex + 1);
    });
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) lightbox.close();
    });
    lightbox.addEventListener("cancel", function () {
      lightboxImg.removeAttribute("src");
    });
    lightbox.addEventListener("close", function () {
      lightboxImg.removeAttribute("src");
      lightboxImg.style.width = "";
      lightboxImg.style.height = "";
    });
    window.addEventListener("resize", function () {
      if (lightbox.open) fitLightbox();
    });
  }
})();
