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
    var hrefs = { tel: "tel:" + C.phone, mail: "mailto:" + C.email, wa: "https://wa.me/" + C.whatsapp, maps: maps, mobilede: C.mobileDeUrl || mobileDeEmbedUrl() || "https://www.mobile.de/" };
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

  /* ---------- mobile.de: kompletter Bestand eingebettet ---------- */
  function mobileDeEmbedUrl() {
    if (C.mobileDeEmbed) return C.mobileDeEmbed;
    var id = String(C.mobileDeCustomerId || "").trim();
    return id ? "https://home.mobile.de/home/index.html?partnerHead=false&colorTheme=default&customerId=" + encodeURIComponent(id) : "";
  }
  function mobileDeEmbed() {
    var box = document.querySelector("[data-mde-embed]");
    if (!box) return;
    var status = box.querySelector("[data-mde-status]"), url = mobileDeEmbedUrl();
    if (!url) {
      var st = box.querySelector(".mde-frame__state");
      st.insertAdjacentHTML("beforeend", "<p>Hier erscheint der komplette Fahrzeugbestand von mobile.de. Dafür einmal die mobile.de-Kunden-ID in <code>assets/js/config.js</code> eintragen.</p>");
      if (status) status.textContent = "Noch nicht verbunden";
      return;
    }
    var f = document.createElement("iframe");
    f.src = url;
    f.title = "Fahrzeugbestand auf mobile.de";
    f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    f.setAttribute("allow", "fullscreen; clipboard-write");
    f.addEventListener("load", function () { box.classList.add("is-loaded"); });
    box.appendChild(f);
    setTimeout(function () { if (!box.classList.contains("is-loaded") && status) status.textContent = "Lädt länger als üblich …"; }, 8000);
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

  /* ---------- Hero: Auto startet beim Scrollen, Burnout mit Reifenqualm, fährt weg ---------- */
  function heroDrive() {
    var pin = document.querySelector("[data-hero-pin]");
    if (!pin || reduce) return;
    var hero = pin.querySelector(".hero"), svg = hero.querySelector(".hero__car"), drive = hero.querySelector(".hero__car-drive");
    var canvas = hero.querySelector(".hero__smoke");
    if (!svg || !drive || !canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d"), wheels = svg.querySelectorAll(".wheel");
    var W = 0, H = 0, dpr = 1, carW = 1;
    function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    function size() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = hero.clientWidth; H = hero.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener("resize", size);

    // weiche Rauch-Sprites (einmal vorberechnet → schnell auf dem iPhone)
    function sprite(rgb) {
      var c = document.createElement("canvas"); c.width = c.height = 96;
      var g = c.getContext("2d"), gr = g.createRadialGradient(48, 48, 0, 48, 48, 48);
      gr.addColorStop(0, "rgba(" + rgb + ",1)"); gr.addColorStop(.45, "rgba(" + rgb + ",.5)"); gr.addColorStop(1, "rgba(" + rgb + ",0)");
      g.fillStyle = gr; g.fillRect(0, 0, 96, 96); return c;
    }
    var SP = { exhaust: sprite("72,72,78"), tire: sprite("150,150,156"), tire2: sprite("205,205,208") };

    var parts = [], live = false, target = 0, cur = 0, lights = 0, lightsOn = false, flick = 0;
    var rearA = 0, frontA = 0, lastX = 0, lastT = 0, accEx = 0, accTire = 0, accLine = 0, visible = true;
    function goLive() { if (live) return; live = true; hero.classList.add("is-live"); }
    svg.addEventListener("animationend", function (e) { if (e.animationName === "driveIn") goLive(); });
    setTimeout(goLive, 3200);

    function read() {
      var r = pin.getBoundingClientRect(), total = pin.offsetHeight - innerHeight;
      target = total > 0 ? clamp(-r.top / total) : 0;
      visible = r.bottom > 0 && r.top < innerHeight;
    }
    function emit(kind, x, y, k) {
      var p;
      if (kind === "exhaust") p = { sp: SP.exhaust, x: x, y: y, vx: -(30 + Math.random() * 60) * k, vy: -(6 + Math.random() * 18) * k, r: 3 * k, g: (18 + Math.random() * 14) * k, max: 1.3 + Math.random() * .9, a: .32 };
      else if (kind === "tire") p = { sp: Math.random() < .55 ? SP.tire : SP.tire2, x: x + (Math.random() - .5) * 30 * k, y: y - Math.random() * 10 * k, vx: -(40 + Math.random() * 260) * k, vy: -(14 + Math.random() * 70) * k, r: (10 + Math.random() * 12) * k, g: (45 + Math.random() * 60) * k, max: 1.8 + Math.random() * 1.6, a: .55 };
      else p = { line: true, x: x, y: y, len: (80 + Math.random() * 260) * k, max: .35 + Math.random() * .25, a: .5 };
      p.life = 0; parts.push(p);
      if (parts.length > 420) parts.shift();
    }
    function frame(t) {
      requestAnimationFrame(frame);
      var dt = lastT ? Math.min(.05, (t - lastT) / 1000) : .016; lastT = t;
      read();
      if (!visible && !parts.length) return;
      cur += (target - cur) * Math.min(1, dt * 7);
      var s = cur;

      // Phasen: Zündung → Licht an → Burnout → Abfahrt
      var on = live && s > .015;
      if (on !== lightsOn) { lightsOn = on; flick = 0; }
      flick += dt;
      var lt = lightsOn ? (flick < .07 ? 1 : flick < .14 ? .15 : flick < .24 ? 1 : flick < .3 ? .4 : 1) : 0;
      lights += (lt - lights) * Math.min(1, dt * 28);
      var burn = live ? clamp((s - .08) / .12) * (1 - clamp((s - .6) / .14)) : 0;
      var g = live ? clamp((s - .46) / .44) : 0, go = g * g * g;
      var x = go * (W * 1.25 + 260);
      var jit = burn > .05 ? (Math.random() - .5) * 1.6 * burn : 0;
      var tilt = -(burn * 1.1 + Math.min(1, g * 5) * .7 * (1 - g));
      drive.style.transform = "translate3d(" + x.toFixed(1) + "px," + jit.toFixed(2) + "px,0) rotate(" + tilt.toFixed(3) + "deg)";

      var rect = svg.getBoundingClientRect(), hr = hero.getBoundingClientRect();
      carW = rect.width || carW;
      var k = carW / 900; // Maßstab: SVG-Einheit → Pixel
      var wheelR = 50 * k, dx = x - lastX, vx = dx / Math.max(dt, .001); lastX = x;
      var roll = dx / wheelR * 57.2958;
      if (live) {
        rearA += roll + burn * 1700 * dt;
        frontA += roll;
        if (wheels[0]) wheels[0].style.transform = "rotate(" + rearA.toFixed(1) + "deg)";
        if (wheels[1]) wheels[1].style.transform = "rotate(" + frontA.toFixed(1) + "deg)";
      }
      svg.style.setProperty("--lights", lights.toFixed(3));
      svg.style.setProperty("--tail", Math.min(1, lights * .55 + burn * .45 + Math.min(1, g * 4) * .2).toFixed(3));
      hero.style.setProperty("--hint", (1 - clamp(s / .04)).toFixed(3));

      // Partikel erzeugen (Koordinaten relativ zum Hero)
      var ox = rect.left - hr.left, oy = rect.top - hr.top, sy = rect.height / 290;
      if (lightsOn && visible) {
        accEx += (5 + burn * 26 + Math.min(1, g * 3) * 14 * (1 - g)) * dt;
        while (accEx >= 1) { accEx--; emit("exhaust", ox + 60 * k, oy + 203 * sy, k); }
        accTire += (burn * 75 + (g > 0 && g < .55 ? 55 * (1 - g / .55) : 0)) * dt;
        while (accTire >= 1) { accTire--; emit("tire", ox + 190 * k, oy + 258 * sy, k); }
        if (vx > 900) {
          accLine += Math.min(40, vx / 60) * dt;
          while (accLine >= 1) { accLine--; emit("line", ox - Math.random() * 120 * k, oy + (60 + Math.random() * 190) * sy, k); }
        }
      }

      // Partikel bewegen & zeichnen
      ctx.clearRect(0, 0, W, H);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.life += dt;
        var lf = p.life / p.max;
        if (lf >= 1) { parts.splice(i, 1); continue; }
        if (p.line) {
          ctx.globalAlpha = p.a * (1 - lf);
          ctx.fillStyle = "#0b0b0c";
          ctx.fillRect(p.x - p.len * (1 - lf * .5), p.y, p.len * (1 - lf * .5), 1);
          continue;
        }
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= 1 - 1.4 * dt; p.vy -= 10 * k * dt;
        p.r += p.g * dt;
        var a = p.a * Math.min(1, p.life / .12) * Math.pow(1 - lf, 1.6);
        if (a < .004) continue;
        ctx.globalAlpha = a;
        ctx.drawImage(p.sp, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(frame);
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
    mobileDeEmbed();
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
      heroDrive();
    });
  });

  window.AZN = { observe: observe, count: count };
})();
