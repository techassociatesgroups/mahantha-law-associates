/* Mahantha Law Associates — site behaviour */
(function () {
  "use strict";

  // Update these when the firm's numbers are confirmed (digits only, with country code).
  var WHATSAPP_NUMBER = "919994524102";
  var DEFAULT_MESSAGE = "Hello, I would like to book a consultation with Adv. Manthagini J.";
  var CTA_KEY = "mla-cta-dismissed";

  function waLink(text) {
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text);
  }

  // Lead tracking hook: works with Google Tag Manager / GA4 if added later.
  function track(type, label) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "lead_click", lead_type: type, lead_label: label || "" });
  }

  // WhatsApp links: build the prefilled message per practice area.
  document.querySelectorAll("[data-wa]").forEach(function (a) {
    var area = a.getAttribute("data-area");
    var text = area
      ? "Hello, I would like to consult Adv. Manthagini J regarding a " + area + " matter."
      : DEFAULT_MESSAGE;
    a.href = waLink(text);
  });

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-track]");
    if (el) track(el.getAttribute("data-track"), el.getAttribute("data-area") || el.textContent.trim());
  });

  // Header shadow on scroll
  var header = document.querySelector("[data-header]");
  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile navigation
  var toggle = document.querySelector("[data-nav-toggle]");
  var nav = document.getElementById("site-nav");
  function setNav(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector(".sr-only").textContent = open ? "Close menu" : "Open menu";
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () { setNav(!nav.classList.contains("is-open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setNav(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { setNav(false); toggle.focus(); }
    });
    window.matchMedia("(min-width: 961px)").addEventListener("change", function (mq) { if (mq.matches) setNav(false); });
  }

  // Highlight the section in view
  var links = Array.prototype.slice.call(document.querySelectorAll('.site-nav ul a[href^="#"]'));
  if ("IntersectionObserver" in window && links.length) {
    var byId = {};
    links.forEach(function (l) { byId[l.getAttribute("href").slice(1)] = l; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (l) { l.removeAttribute("aria-current"); });
        if (byId[en.target.id]) byId[en.target.id].setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  // Lead form -> WhatsApp
  var form = document.getElementById("lead-form");
  if (form) {
    var fields = {
      name: { el: form.elements.name, err: document.getElementById("f-name-err"), ok: function (v) { return v.trim().length >= 2; } },
      phone: { el: form.elements.phone, err: document.getElementById("f-phone-err"), ok: function (v) { return v.replace(/\D/g, "").length >= 10 && /^[0-9+\s\-]+$/.test(v.trim()); } }
    };
    function check(f) {
      var valid = f.ok(f.el.value);
      f.el.setAttribute("aria-invalid", String(!valid));
      f.err.hidden = valid;
      if (!valid) f.el.setAttribute("aria-describedby", f.err.id); else f.el.removeAttribute("aria-describedby");
      return valid;
    }
    Object.keys(fields).forEach(function (k) {
      fields[k].el.addEventListener("blur", function () { if (fields[k].el.value) check(fields[k]); });
      fields[k].el.addEventListener("input", function () { if (fields[k].el.getAttribute("aria-invalid") === "true") check(fields[k]); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(fields).forEach(function (k) { if (!check(fields[k]) && !firstBad) firstBad = fields[k].el; });
      if (firstBad) { firstBad.focus(); return; }

      var area = form.elements.area.value;
      var msg = form.elements.message.value.trim();
      var lines = [
        "Hello, I would like to book a consultation with Adv. Manthagini J.",
        "",
        "Name: " + form.elements.name.value.trim(),
        "Phone: " + form.elements.phone.value.trim(),
        "Matter: " + (area || "Not sure / other")
      ];
      if (msg) lines.push("Details: " + msg);
      track("whatsapp_form", area || "other");
      window.open(waLink(lines.join("\n")), "_blank", "noopener");
    });
  }

  // Office status: computed in India time so every visitor sees the real state
  // (Mon – Sat, 10:00 – 19:00 IST).
  function officeOpen() {
    var parts = {};
    try {
      new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" })
        .formatToParts(new Date()).forEach(function (pt) { parts[pt.type] = pt.value; });
    } catch (err) { return null; }
    var mins = parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10);
    return parts.weekday !== "Sun" && mins >= 600 && mins < 1140;
  }
  var isOpen = officeOpen();
  if (isOpen !== null) {
    document.querySelectorAll("[data-office-status]").forEach(function (el) {
      el.classList.add(isOpen ? "is-open" : "is-closed");
      el.querySelector("[data-status-text]").textContent = isOpen
        ? "Office open now. Call or WhatsApp to speak to the advocate today."
        : "Office closed now. Send a WhatsApp message and we will reply when we open.";
    });
  }

  // Consultation prompt: slides in after 12 seconds or once the visitor scrolls past the hero.
  // It never blocks the page and stays dismissed for the rest of the visit.
  var cta = document.getElementById("cta-card");
  var ctaDismissed = false;
  try { ctaDismissed = sessionStorage.getItem(CTA_KEY) === "1"; } catch (err) { /* storage blocked */ }
  if (cta && !ctaDismissed) {
    var shown = false;
    var hero = document.querySelector(".hero");
    var showCta = function () {
      if (shown) return;
      shown = true;
      cta.hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () { cta.classList.add("is-visible"); }); });
      window.removeEventListener("scroll", onCtaScroll);
    };
    var onCtaScroll = function () {
      if (hero && hero.getBoundingClientRect().bottom < window.innerHeight * 0.4) showCta();
    };
    var hideCta = function () {
      cta.classList.remove("is-visible");
      try { sessionStorage.setItem(CTA_KEY, "1"); } catch (err) { /* ignore */ }
      setTimeout(function () { cta.hidden = true; }, 400);
    };
    setTimeout(showCta, 12000);
    window.addEventListener("scroll", onCtaScroll, { passive: true });
    cta.querySelector("[data-cta-close]").addEventListener("click", hideCta);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && cta.classList.contains("is-visible")) hideCta();
    });
    // Hide it while the visitor is using the contact form, where it would only repeat itself.
    var contact = document.getElementById("contact");
    if (contact && "IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        cta.classList.toggle("is-tucked", entries[0].isIntersecting);
      }, { threshold: 0.2 }).observe(contact);
    }
  }

  // ---------- Motion: reveals, parallax, stacking cards ----------
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll("[data-reveal]");
  document.querySelectorAll("[data-delay]").forEach(function (el) {
    el.style.setProperty("--d", el.getAttribute("data-delay") + "s");
  });

  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var start = null;
    function step(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / 900, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        var counter = en.target.querySelector("[data-count]");
        if (counter) countUp(counter);
        rio.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    revealEls.forEach(function (el) { rio.observe(el); });
  }

  if (!reduceMotion) {
    var parallaxEls = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
    var driftEls = Array.prototype.slice.call(document.querySelectorAll("[data-drift]"));
    var cards = Array.prototype.slice.call(document.querySelectorAll(".practice-item"));
    cards.forEach(function (card, i) { card.style.setProperty("--i", i); });

    // Split the statement into words so they can light up with scroll progress
    var statement = document.querySelector("[data-words]");
    var words = [];
    if (statement) {
      (function split(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
          if (child.nodeType === 3) {
            var frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
              var span = document.createElement("span");
              span.className = "w";
              span.textContent = part;
              words.push(span);
              frag.appendChild(span);
            });
            node.replaceChild(frag, child);
          } else if (child.nodeType === 1) {
            split(child);
          }
        });
      })(statement);
      statement.classList.add("is-split");
    }

    var ticking = false;
    function frame() {
      ticking = false;
      var vh = window.innerHeight;

      // Backup for the observer: never leave on-screen content hidden
      for (var k = 0; k < revealEls.length; k++) {
        var re = revealEls[k];
        if (!re.classList.contains("is-in") && re.getBoundingClientRect().top < vh * 0.95) re.classList.add("is-in");
      }

      parallaxEls.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var offset = r.top + r.height / 2 - vh / 2;
        el.style.setProperty("--py", (offset * -parseFloat(el.getAttribute("data-parallax"))).toFixed(1) + "px");
      });

      driftEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var offset = r.top + r.height / 2 - vh / 2;
        el.style.setProperty("--px", (offset * parseFloat(el.getAttribute("data-drift"))).toFixed(1) + "px");
      });

      // Each card recedes as the next one slides over it
      for (var i = 0; i < cards.length - 1; i++) {
        var a = cards[i].getBoundingClientRect();
        var b = cards[i + 1].getBoundingClientRect();
        var p = 1 - Math.min(Math.max((b.top - a.top) / a.height, 0), 1);
        cards[i].style.setProperty("--stack", p.toFixed(3));
      }

      if (words.length) {
        var sr = statement.getBoundingClientRect();
        var prog = Math.min(Math.max((vh * 0.85 - sr.top) / (sr.height + vh * 0.3), 0), 1);
        var lit = Math.round(prog * words.length);
        for (var w = 0; w < words.length; w++) words[w].classList.toggle("lit", w < lit);
      }
    }
    function requestFrame() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
    window.addEventListener("scroll", requestFrame, { passive: true });
    window.addEventListener("resize", requestFrame);
    frame();
  }

  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
