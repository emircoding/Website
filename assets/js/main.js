/* ==========================================================================
   Automobilzentrum Nagold – Interaktionen & Motion
   ========================================================================== */
(function () {
  "use strict";
  var C = window.AZN_CONFIG || {};
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var root = document.documentElement;

  /* ---------- Firmendaten aus config.js einsetzen ---------- */
  function applyConfig() {
    var map = {
      name: C.name, owner: C.owner, street: C.street, zipcity: (C.zip || "") + " " + (C.city || ""),
      phoneDisplay: C.phoneDisplay, email: C.email, vatId: C.vatId, register: C.register,
      address: C.street + ", " + C.zip + " " + C.city, year: String(new Date().getFullYear())
    };
    document.querySelectorAll("[data-cfg]").forEach(function (el) {
      var k = el.getAttribute("data-cfg");
      if (map[k] != null && map[k] !== "") el.textContent = map[k];
      else if (k === "register") el.closest("[data-optional]") && (el.closest("[data-optional]").hidden = true);
    });
    var maps = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(C.name + ", " + C.street + ", " + C.zip + " " + C.city);
    var hrefs = { tel: "tel:" + C.phone, mail: "mailto:" + C.email, wa: "https://wa.me/" + C.whatsapp, maps: maps, mobilede: C.mobileDeUrl };
    document.querySelectorAll("[data-href]").forEach(function (el) {
      var h = hrefs[el.getAttribute("data-href")];
      if (h) el.setAttribute("href", h);
    });
    document.querySelectorAll("[data-hours]").forEach(function (el) {
      el.innerHTML = (C.hours || []).map(function (h) { return "<dt>" + h[0] + "</dt><dd>" + h[1] + "</dd>"; }).join("");
    });
    // „Jetzt geöffnet“-Anzeige
    var badge = document.querySelector("[data-open-badge]");
    if (badge && C.schedule) {
      var now = new Date(), day = ["so", "mo", "di", "mi", "do", "fr", "sa"][now.getDay()];
      var slot = C.schedule[day], open = false;
      if (slot) {
        var p = slot.split("-"), mins = now.getHours() * 60 + now.getMinutes();
        var a = p[0].split(":"), b = p[1].split(":");
        open = mins >= +a[0] * 60 + +a[1] && mins < +b[0] * 60 + +b[1];
      }
      badge.classList.toggle("is-open", open);
      badge.querySelector("span").textContent = open ? "Jetzt geöffnet" : "Aktuell geschlossen";
    }
  }

  /* ---------- Preloader (nur beim ersten Besuch pro Sitzung) ---------- */
  function preloader(done) {
    var el = document.querySelector(".preloader");
    var seen = false;
    try { seen = sessionStorage.getItem("azn-intro") === "1"; sessionStorage.setItem("azn-intro", "1"); } catch (e) { /* ok */ }
    if (!el) return done();
    if (seen || reduce) { el.remove(); return done(); }
    var finish = function () {
      el.classList.add("is-done");
      setTimeout(done, 250);
      setTimeout(function () { el.remove(); }, 1100);
    };
    var start = Date.now();
    var go = function () { setTimeout(finish, Math.max(0, 1300 - (Date.now() - start))); };
    if (document.readyState === "complete") go(); else window.addEventListener("load", go);
    setTimeout(finish, 3000); // Sicherheitsnetz
  }

  /* ---------- Header: Zustand beim Scrollen ---------- */
  function header() {
    var h = document.querySelector(".header"), prog = document.querySelector(".progress"), fab = document.querySelector(".fab");
    var lastY = window.scrollY, ticking = false;
    function update() {
      var y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
      if (h) {
        h.classList.toggle("is-scrolled", y > 10);
        var menuOpen = document.body.classList.contains("menu-open");
        h.classList.toggle("is-hidden", !menuOpen && y > 400 && y > lastY + 2);
        if (y < lastY - 2) h.classList.remove("is-hidden");
      }
      if (prog) prog.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
      if (fab) fab.classList.toggle("is-visible", y > 600);
      parallax(y);
      statement();
      lastY = y; ticking = false;
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------- Mobiles Menü ---------- */
  function menu() {
    var btn = document.querySelector(".burger");
    if (!btn) return;
    function set(open) {
      document.body.classList.toggle("menu-open", open);
      document.body.classList.toggle("is-locked", open);
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    }
    btn.addEventListener("click", function () { set(!document.body.classList.contains("menu-open")); });
    document.querySelectorAll(".mobile-menu a").forEach(function (a) { a.addEventListener("click", function () { set(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
  }

  /* ---------- Einblend-Animationen ---------- */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add("is-in");
        if (en.target.hasAttribute("data-count")) count(en.target);
        io.unobserve(en.target);
      }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }) : null;
  function observe(scope) {
    (scope || document).querySelectorAll("[data-reveal]:not(.is-in), .split-line:not(.is-in), .img-reveal:not(.is-in), [data-count], .statement__mark").forEach(function (el) {
      if (io && !reduce) io.observe(el); else { el.classList.add("is-in"); if (el.hasAttribute("data-count")) count(el); }
    });
  }

  /* Überschriften Wort für Wort einblenden */
  function splitHeadings() {
    document.querySelectorAll("[data-split]").forEach(function (el) {
      var html = el.innerHTML.split(/<br\s*\/?>/i);
      var i = 0;
      el.innerHTML = html.map(function (line) {
        var tmp = document.createElement("div"); tmp.innerHTML = line.trim();
        var parts = [];
        tmp.childNodes.forEach(function (n) {
          if (n.nodeType === 3) n.textContent.split(/\s+/).filter(Boolean).forEach(function (w) { parts.push(w); });
          else parts.push(n.outerHTML);
        });
        return parts.map(function (w) {
          return '<span class="split-line" style="display:inline-block;vertical-align:top"><span style="--d:' + (i++ * 0.06).toFixed(2) + 's">' + w + "</span></span>";
        }).join(" ");
      }).join("<br>");
    });
  }

  /* ---------- Zähler ---------- */
  function count(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    if (isNaN(target)) return;
    var suffix = el.getAttribute("data-suffix") || "", dur = 1600, t0 = null;
    if (reduce) { el.textContent = target + suffix; return; }
    function tick(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * e) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- Parallax ---------- */
  var plx = [];
  function parallax(y) {
    if (reduce) return;
    for (var i = 0; i < plx.length; i++) {
      var el = plx[i], r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) continue;
      var speed = parseFloat(el.getAttribute("data-parallax")) || 0.15;
      var off = (r.top + r.height / 2 - innerHeight / 2) * speed;
      el.style.setProperty("--py", off.toFixed(1) + "px");
    }
  }

  /* ---------- Statement: Wörter beim Scrollen aufleuchten ---------- */
  var words = [], stEl = null;
  function prepStatement() {
    stEl = document.querySelector("[data-scrub]");
    if (!stEl) return;
    var txt = stEl.textContent.trim().split(/\s+/);
    stEl.innerHTML = txt.map(function (w) { return '<span class="w">' + w + "</span>"; }).join(" ");
    words = stEl.querySelectorAll(".w");
    if (reduce) words.forEach(function (w) { w.classList.add("on"); });
  }
  function statement() {
    if (!stEl || reduce) return;
    var r = stEl.getBoundingClientRect();
    var p = (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.4);
    p = Math.max(0, Math.min(1, p));
    var n = Math.round(p * words.length);
    for (var i = 0; i < words.length; i++) words[i].classList.toggle("on", i < n);
  }

  /* ---------- Magnetische Buttons & Spotlight ---------- */
  function magnetic() {
    if (!fine || reduce) return;
    document.querySelectorAll(".btn, .vcard__go").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        b.style.transform = "translate(" + x * 0.18 + "px," + y * 0.3 + "px)";
      });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
    });
    document.querySelectorAll(".service").forEach(function (s) {
      s.addEventListener("pointermove", function (e) {
        var r = s.getBoundingClientRect();
        s.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
        s.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
      });
    });
    // Hero: Tiefen-Effekt mit der Maus
    var hero = document.querySelector(".hero");
    if (hero) {
      var w = hero.querySelector(".hero__word:not(.hero__word--outline)"), car = hero.querySelector(".hero__car-wrap");
      hero.addEventListener("pointermove", function (e) {
        var x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
        if (w) w.style.transform = "translate(" + x * -18 + "px," + y * -10 + "px)";
        if (car) car.style.transform = "translate(" + x * 16 + "px," + y * 6 + "px)";
      });
    }
  }

  /* ---------- Speedlines im Hero ---------- */
  function speedlines() {
    var box = document.querySelector(".speedlines");
    if (!box || reduce) return;
    for (var i = 0; i < 14; i++) {
      var s = document.createElement("i");
      s.style.top = (30 + Math.random() * 55) + "%";
      s.style.animationDelay = (0.4 + Math.random() * 1.2).toFixed(2) + "s";
      s.style.width = (20 + Math.random() * 30) + "%";
      box.appendChild(s);
    }
  }

  /* ---------- Kontaktformular → E-Mail oder WhatsApp ---------- */
  function forms() {
    var form = document.querySelector("[data-contact-form]");
    if (!form) return;
    function text() {
      var d = new FormData(form);
      return "Anliegen: " + d.get("topic") + "\nName: " + d.get("name") + "\nTelefon: " + (d.get("phone") || "–") + "\nE-Mail: " + (d.get("email") || "–") +
        (d.get("car") ? "\nFahrzeug: " + d.get("car") : "") + "\n\n" + (d.get("message") || "");
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var d = new FormData(form);
      location.href = "mailto:" + C.email + "?subject=" + encodeURIComponent("Anfrage über Website: " + d.get("topic")) + "&body=" + encodeURIComponent(text());
    });
    var wa = form.querySelector("[data-wa-send]");
    if (wa) wa.addEventListener("click", function () {
      if (!form.reportValidity()) return;
      window.open("https://wa.me/" + C.whatsapp + "?text=" + encodeURIComponent(text()), "_blank", "noopener");
    });
    // Links wie „Fahrzeug bewerten lassen“ wählen das passende Anliegen vor
    document.querySelectorAll("[data-topic]").forEach(function (a) {
      a.addEventListener("click", function () {
        var sel = form.querySelector("[name=topic]");
        if (sel) sel.value = a.getAttribute("data-topic");
      });
    });
  }

  /* ---------- Start ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    applyConfig();
    splitHeadings();
    prepStatement();
    plx = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
    speedlines();
    menu();
    header();
    magnetic();
    forms();
    preloader(function () {
      root.classList.add("is-ready");
      observe(document);
    });
  });

  window.AZN = { observe: observe, count: count };
})();
