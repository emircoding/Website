/* ==========================================================================
   Automobilzentrum Nagold – Interaktionen & Motion
   ========================================================================== */
(function () {
  "use strict";
  var C = window.AZN_CONFIG || {};
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var root = document.documentElement;

  /* ---------- Beim Neuladen immer ganz oben starten (auch iPhone/Safari) ---------- */
  try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) { /* ok */ }
  var nav = window.performance && performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
  var isReload = nav ? nav.type === "reload" : (window.performance && performance.navigation && performance.navigation.type === 1);
  function toTop() {
    var de = document.documentElement, prev = de.style.scrollBehavior;
    de.style.scrollBehavior = "auto"; // kein weiches Scrollen, sofort nach oben
    window.scrollTo(0, 0);
    de.scrollTop = 0; if (document.body) document.body.scrollTop = 0;
    de.style.scrollBehavior = prev;
  }
  // Safari (iOS) merkt sich die Position beim Verlassen/Neuladen – vorher nach oben setzen,
  // damit beim nächsten Laden die gespeicherte Position „oben“ ist.
  window.addEventListener("pagehide", toTop);
  if (isReload) {
    // Sprungmarke (z. B. #kontakt) beim Neuladen entfernen, damit es oben losgeht
    if (location.hash) { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* ok */ } }
    var userScrolled = false;
    var stop = function () { userScrolled = true; };
    ["touchstart", "wheel", "keydown", "mousedown"].forEach(function (ev) { window.addEventListener(ev, stop, { once: true, passive: true }); });
    var again = function () { if (!userScrolled) toTop(); };
    toTop();
    document.addEventListener("DOMContentLoaded", again);
    window.addEventListener("load", function () {
      // Safari stellt die alte Position teils verzögert wieder her → mehrfach nachziehen
      [0, 50, 120, 250, 500, 900].forEach(function (t) { setTimeout(again, t); });
      requestAnimationFrame(function () { requestAnimationFrame(again); });
    });
    window.addEventListener("pageshow", again);
  }

  /* ---------- Firmendaten aus config.js einsetzen ---------- */
  function applyConfig() {
    var map = {
      name: C.name, legalName: C.legalName || C.name, owner: C.owner, street: C.street, zipcity: (C.zip || "") + " " + (C.city || ""),
      phoneDisplay: C.phoneDisplay, email: C.email, vatId: C.vatId, register: C.register,
      address: C.street + ", " + C.zip + " " + C.city, year: String(new Date().getFullYear())
    };
    document.querySelectorAll("[data-cfg]").forEach(function (el) {
      var k = el.getAttribute("data-cfg");
      if (map[k] != null && map[k] !== "") el.textContent = map[k];
    });
    // Optionale Impressums-Abschnitte ausblenden, wenn leer
    document.querySelectorAll("[data-optional]").forEach(function (el) {
      var v = C[el.getAttribute("data-optional")];
      el.hidden = !(v && String(v).trim());
    });
    // Hinweis „Platzhalter“ nur zeigen, solange noch Beispieldaten eingetragen sind
    var placeholders = /Muster|000 000|0000000/.test([C.owner, C.street, C.phone, C.phoneDisplay, C.whatsapp].join(" "));
    document.querySelectorAll("[data-placeholder-notice]").forEach(function (el) { el.hidden = !placeholders; });
    var maps = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(C.name + ", " + C.street + ", " + C.zip + " " + C.city);
    var G = C.google || {};
    var gprofile = G.profileUrl || maps;
    var hrefs = { tel: "tel:" + C.phone, mail: "mailto:" + C.email, wa: "https://wa.me/" + C.whatsapp, maps: maps, mobilede: C.mobileDeUrl || mobileDeEmbedUrl() || "https://www.mobile.de/", gprofile: gprofile, greview: G.reviewUrl || gprofile };
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
    var st = box.querySelector(".mde-frame__state"), status = box.querySelector("[data-mde-status]"), url = mobileDeEmbedUrl();
    if (!url) {
      st.insertAdjacentHTML("beforeend", "<p>Hier erscheint der komplette Fahrzeugbestand von mobile.de. Dafür einmal die mobile.de-Kunden-ID in <code>assets/js/config.js</code> eintragen.</p>");
      if (status) status.textContent = "Noch nicht verbunden";
      return;
    }
    function load() {
      if (box.querySelector("iframe")) return;
      var gate = st.querySelector(".mde-gate");
      if (gate) gate.remove();
      if (status) status.textContent = "Bestand wird geladen …";
      var f = document.createElement("iframe");
      f.src = url;
      f.title = "Fahrzeugbestand auf mobile.de";
      f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      f.setAttribute("allow", "fullscreen; clipboard-write");
      f.addEventListener("load", function () { box.classList.add("is-loaded"); });
      box.appendChild(f);
      setTimeout(function () { if (!box.classList.contains("is-loaded") && status) status.textContent = "Lädt länger als üblich …"; }, 8000);
    }
    if (consent.get().external) return load();
    // Ohne Zustimmung: erst auf Klick laden (Datenschutz)
    if (status) status.textContent = "Ihre Zustimmung wird benötigt";
    st.insertAdjacentHTML("beforeend",
      '<div class="mde-gate"><p>Zum Schutz Ihrer Daten wird der Bestand von mobile.de erst nach Ihrer Zustimmung geladen. Dabei werden Daten (z. B. Ihre IP-Adresse) an mobile.de übertragen.</p>' +
      '<button class="btn" type="button" data-gate-load>Bestand von mobile.de laden</button>' +
      '<a class="mde-gate__more" href="datenschutz.html">Mehr in der Datenschutzerklärung</a></div>');
    st.querySelector("[data-gate-load]").addEventListener("click", function () {
      consent.set({ external: true });
      load();
    });
    document.addEventListener("azn:consent", function () { if (consent.get().external) load(); });
  }

  /* ---------- Cookie-/Einwilligungs-Banner ---------- */
  var consent = (function () {
    var KEY = "azn-consent", VERSION = 1, mem = null;
    function get() {
      if (mem) return mem;
      try { var v = JSON.parse(localStorage.getItem(KEY) || "null"); if (v && v.v === VERSION) return (mem = v); } catch (e) { /* ok */ }
      return { v: VERSION, external: false, decided: false };
    }
    function set(o) {
      mem = { v: VERSION, external: !!o.external, decided: true, ts: new Date().toISOString() };
      try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* privat-modus: gilt für diese Seite */ }
      document.dispatchEvent(new CustomEvent("azn:consent"));
    }
    var el;
    function build() {
      el = document.createElement("div");
      el.className = "consent";
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-live", "polite");
      el.setAttribute("aria-label", "Cookie-Einstellungen");
      el.innerHTML =
        '<div class="consent__head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M21 12.5A9 9 0 1 1 11.5 3a3 3 0 0 0 3.5 3.5 3 3 0 0 0 3.5 3.5 3 3 0 0 0 2.5 2.5z"/><circle cx="8.5" cy="10" r="1" fill="currentColor"/><circle cx="12" cy="15.5" r="1" fill="currentColor"/><circle cx="16" cy="13" r=".8" fill="currentColor"/><circle cx="8" cy="15" r=".6" fill="currentColor"/></svg><strong>Cookies &amp; Datenschutz</strong></div>' +
        '<p class="consent__text">Wir verwenden nur technisch notwendige Speicherungen. Für die Anzeige unseres Fahrzeugbestands binden wir Inhalte von <b>mobile.de</b> ein – dabei kann mobile.de Cookies setzen und Daten wie Ihre IP-Adresse erhalten. Mehr dazu in der <a href="datenschutz.html">Datenschutzerklärung</a> und im <a href="impressum.html">Impressum</a>.</p>' +
        '<div class="consent__details" hidden>' +
        '<label class="consent__opt"><span><b>Notwendig</b><small>Speichert Ihre Auswahl und sorgt für die Grundfunktionen der Seite.</small></span><input type="checkbox" checked disabled><i class="switch"></i></label>' +
        '<label class="consent__opt"><span><b>Externe Inhalte – mobile.de</b><small>Zeigt unseren kompletten Fahrzeugbestand direkt von mobile.de an.</small></span><input type="checkbox" data-opt="external"><i class="switch"></i></label>' +
        "</div>" +
        '<div class="consent__actions"><button class="btn btn--light" type="button" data-c="all">Alle akzeptieren</button><button class="btn btn--ghost" type="button" data-c="necessary">Nur notwendige</button></div>' +
        '<button class="consent__more" type="button" data-c="toggle">Einstellungen</button>';
      document.body.appendChild(el);
      var details = el.querySelector(".consent__details"), more = el.querySelector("[data-c=toggle]"), opt = el.querySelector("[data-opt=external]");
      el.addEventListener("click", function (e) {
        var b = e.target.closest("[data-c]"); if (!b) return;
        var c = b.getAttribute("data-c");
        if (c === "all") { set({ external: true }); close(); }
        else if (c === "necessary") { set({ external: false }); close(); }
        else if (c === "save") { set({ external: opt.checked }); close(); }
        else if (c === "toggle") {
          details.hidden = false;
          opt.checked = get().external;
          more.textContent = "Auswahl speichern";
          more.setAttribute("data-c", "save");
          more.classList.add("is-save");
        }
      });
    }
    function open(expanded) {
      if (!el) build();
      if (expanded) el.querySelector("[data-c=toggle]") && el.querySelector("[data-c=toggle]").click();
      document.body.classList.add("consent-open");
      requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add("is-open"); }); });
    }
    function close() {
      if (!el) return;
      el.classList.remove("is-open");
      document.body.classList.remove("consent-open");
    }
    function init() {
      document.querySelectorAll("[data-consent-open]").forEach(function (a) {
        a.addEventListener("click", function (e) { e.preventDefault(); open(true); });
      });
      if (!get().decided) setTimeout(function () { open(false); }, document.querySelector(".preloader") ? 1900 : 600);
    }
    return { get: get, set: set, init: init, open: open };
  })();

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

  /* ---------- Google-Bewertungen ---------- */
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function starsHTML(v) {
    var out = "";
    for (var i = 1; i <= 5; i++) {
      var f = Math.max(0, Math.min(1, v - (i - 1)));
      out += '<span class="star" style="--f:' + Math.round(f * 100) + '%"></span>';
    }
    return out;
  }
  function reviews() {
    var sec = document.querySelector("[data-reviews]");
    var G = C.google || {};
    if (!sec || !(G.rating > 0)) return;
    sec.hidden = false;
    var nf = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    sec.querySelector("[data-rating-value]").textContent = nf.format(G.rating);
    sec.querySelector("[data-rating-stars]").innerHTML = starsHTML(G.rating);
    sec.querySelector("[data-rating-count]").textContent = new Intl.NumberFormat("de-DE").format(G.count || 0);
    var list = (G.reviews || []).filter(function (r) { return r && r.text; });
    var track = sec.querySelector("[data-reviews-track]");
    if (!list.length) { track.remove(); return; }
    track.innerHTML = list.map(function (r, i) {
      return '<figure class="review" data-reveal style="--d:' + (i % 3) * 0.08 + 's">' +
        '<div class="stars" role="img" aria-label="' + (r.stars || 5) + ' von 5 Sternen">' + starsHTML(r.stars || 5) + "</div>" +
        "<blockquote>" + esc(r.text) + "</blockquote>" +
        '<figcaption><span class="review__avatar" aria-hidden="true">' + esc((r.name || "?").charAt(0)) + "</span><span><b>" + esc(r.name || "Google-Nutzer") + "</b><small>" + esc(r.date || "") + (r.date ? " · " : "") + "Google</small></span></figcaption></figure>";
    }).join("");
  }

  /* ---------- Formulare → E-Mail oder WhatsApp (es wird nichts an einen Server gesendet) ---------- */
  function sendForm(form, subject, text, before) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity() || (before && !before())) return;
      location.href = "mailto:" + C.email + "?subject=" + encodeURIComponent(subject()) + "&body=" + encodeURIComponent(text());
    });
    var wa = form.querySelector("[data-wa-send]");
    if (wa) wa.addEventListener("click", function () {
      if (!form.reportValidity() || (before && !before())) return;
      window.open("https://wa.me/" + C.whatsapp + "?text=" + encodeURIComponent(text()), "_blank", "noopener");
    });
  }
  /* ---------- Foto-Upload beim Ankauf ---------- */
  function uploader(form) {
    var box = form.querySelector("[data-uploader]");
    if (!box) return null;
    var input = box.querySelector("[data-uploader-input]"), list = box.querySelector("[data-uploader-list]");
    var note = box.querySelector("[data-uploader-note]"), drop = box.querySelector("[data-uploader-drop]");
    var MAX = 10, items = [], enabled = false, albumId = null, seq = 0;
    var api = { pending: function () { return items.some(function (i) { return i.status === "up"; }); },
      ready: function () { return items.filter(function (i) { return i.status === "ok"; }); } };

    function rid() {
      var a = new Uint8Array(18); (window.crypto || window.msCrypto).getRandomValues(a);
      return btoa(String.fromCharCode.apply(null, a)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }
    function disable(msg) {
      enabled = false;
      box.classList.add("is-off");
      input.disabled = true;
      note.textContent = msg;
    }
    // Ist der Upload eingerichtet? (lokal per Doppelklick bzw. ohne Cloudflare-Speicher: Hinweis statt Upload)
    if (!/^https?:$/.test(location.protocol)) disable("Fotos können Sie nach dem Absenden direkt in WhatsApp anhängen.");
    else fetch("/api/fotos", { headers: { Accept: "application/json" } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (j && j.enabled) enabled = true; else disable("Fotos können Sie nach dem Absenden direkt in WhatsApp anhängen."); })
      .catch(function () { disable("Fotos können Sie nach dem Absenden direkt in WhatsApp anhängen."); });

    // Bild verkleinern (max. 1600 px, JPEG) – spart Datenvolumen und entfernt Zusatzdaten wie GPS
    function shrink(file) {
      return new Promise(function (res) {
        var url = URL.createObjectURL(file), img = new Image();
        img.onload = function () {
          var s = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
          var c = document.createElement("canvas");
          c.width = Math.max(1, Math.round(img.naturalWidth * s)); c.height = Math.max(1, Math.round(img.naturalHeight * s));
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          c.toBlob(function (b) { URL.revokeObjectURL(url); res(b || file); }, "image/jpeg", 0.82);
        };
        img.onerror = function () { URL.revokeObjectURL(url); res(file); };
        img.src = url;
      });
    }
    function render() {
      list.innerHTML = items.map(function (it) {
        return '<li class="up up--' + it.status + '" data-k="' + it.k + '"><img src="' + it.thumb + '" alt="">' +
          (it.status === "up" ? '<span class="up__spin" aria-label="Wird hochgeladen"></span>' : "") +
          (it.status === "err" ? '<span class="up__err">' + esc(it.err) + "</span>" : "") +
          '<button type="button" class="up__x" aria-label="Foto entfernen" data-rm="' + it.k + '">×</button></li>';
      }).join("");
      drop.classList.toggle("is-full", items.length >= MAX);
      var n = api.ready().length;
      drop.querySelector("strong").textContent = items.length ? (items.length >= MAX ? "Maximal 10 Fotos" : "Weitere Fotos hinzufügen") : "Fotos hinzufügen";
      form.dispatchEvent(new CustomEvent("azn:uploads", { detail: { ready: n, pending: api.pending() } }));
    }
    function add(files) {
      if (!enabled) return;
      Array.prototype.slice.call(files, 0, MAX - items.length).forEach(function (file) {
        if (!/^image\//.test(file.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) return;
        var it = { k: ++seq, status: "up", thumb: URL.createObjectURL(file) };
        items.push(it);
        shrink(file).then(function (blob) {
          return fetch("/api/fotos", { method: "POST", body: blob, headers: { "Content-Type": blob.type || "application/octet-stream" } });
        }).then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.id) throw new Error(j.error || "upload"); return j.id; });
        }).then(function (id) {
          it.id = id; it.status = "ok"; render();
        }).catch(function (e) {
          it.status = "err";
          it.err = /unsupported/.test(e.message) ? "Format nicht unterstützt" : /too_large/.test(e.message) ? "Zu groß" : "Fehler";
          render();
        });
      });
      render();
    }
    input.addEventListener("change", function () { add(input.files); input.value = ""; });
    list.addEventListener("click", function (e) {
      var b = e.target.closest("[data-rm]"); if (!b) return;
      items = items.filter(function (i) { if (String(i.k) === b.getAttribute("data-rm")) { URL.revokeObjectURL(i.thumb); return false; } return true; });
      render();
    });
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("is-drag"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("is-drag"); }); });
    drop.addEventListener("drop", function (e) { if (e.dataTransfer && e.dataTransfer.files) add(e.dataTransfer.files); });

    // Beim Absenden: Fotomappe speichern und Link liefern
    api.link = function (title) {
      var ok = api.ready();
      if (!ok.length) return "";
      if (!albumId) albumId = rid();
      var body = JSON.stringify({ id: albumId, photos: ok.map(function (i) { return i.id; }), title: title });
      try { fetch("/api/album", { method: "POST", body: body, headers: { "Content-Type": "application/json" }, keepalive: true }); } catch (e) { /* ok */ }
      return location.origin + "/fotos/" + albumId;
    };
    return api;
  }

  function forms() {
    // Allgemeines Kontaktformular
    var form = document.querySelector("[data-contact-form]");
    if (form) {
      var topic = form.querySelector("[name=topic]");
      sendForm(form, function () { return "Anfrage über Website: " + topic.value; }, function () {
        var d = new FormData(form);
        var lines = ["Anliegen: " + d.get("topic"), "Name: " + d.get("name"), "Telefon: " + (d.get("phone") || "–"), "E-Mail: " + (d.get("email") || "–")];
        if (d.get("car")) lines.push("Fahrzeug: " + d.get("car"));
        lines.push("", d.get("message") || "");
        return lines.join("\n");
      });
      var choose = function (v) {
        for (var i = 0; i < topic.options.length; i++) if (topic.options[i].value === v) { topic.value = v; return; }
      };
      document.querySelectorAll("[data-topic]").forEach(function (a) {
        a.addEventListener("click", function () { choose(a.getAttribute("data-topic")); });
      });
      var q = new URLSearchParams(location.search).get("anliegen");
      if (q) choose(q);
    }

    // Ankauf-Formular: Fahrzeugdaten für die Bewertung
    var ank = document.querySelector("[data-ankauf-form]");
    if (ank) {
      var reg = ank.querySelector("[data-reg]");
      if (reg) reg.addEventListener("input", function () {
        var d = reg.value.replace(/\D/g, "").slice(0, 6);
        reg.value = d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
      });
      var up = uploader(ank), photoLink = "";
      var status = document.createElement("p");
      status.className = "form__status"; status.setAttribute("role", "status");
      ank.querySelector(".form__actions").after(status);
      ank.addEventListener("azn:uploads", function (e) {
        status.textContent = e.detail.pending ? "Fotos werden hochgeladen …" : (e.detail.ready ? e.detail.ready + (e.detail.ready === 1 ? " Foto" : " Fotos") + " bereit – der Link kommt automatisch in Ihre Nachricht." : "");
      });
      sendForm(ank, function () {
        var d = new FormData(ank);
        return "Fahrzeugankauf: " + d.get("make") + " " + d.get("model");
      }, function () {
        var d = new FormData(ank);
        var lines = ["Fahrzeugankauf – Bitte um Bewertung", ""];
        [["make", "Marke"], ["model", "Modell"], ["type", "Fahrzeugtyp"], ["doors", "Anzahl der Türen"], ["reg", "Erstzulassung"], ["km", "Kilometerstand"], ["fuel", "Kraftstoffart"], ["gear", "Getriebe"], ["price", "Preis (Vorstellung)"]].forEach(function (f) {
          lines.push(f[1] + ": " + (d.get(f[0]) || "–"));
        });
        lines.push("", "Name: " + d.get("name"), "Telefon: " + d.get("phone"), "E-Mail: " + (d.get("email") || "–"));
        if (d.get("message")) lines.push("", "Anmerkungen: " + d.get("message"));
        if (photoLink) lines.push("", "Fotos (" + up.ready().length + "): " + photoLink);
        return lines.join("\n");
      }, function () {
        // Vor dem Senden: warten, bis alle Fotos hochgeladen sind, dann Fotomappe anlegen
        if (up && up.pending()) { status.textContent = "Bitte kurz warten – die Fotos werden noch hochgeladen …"; return false; }
        var d = new FormData(ank);
        photoLink = up ? up.link("Ankauf: " + d.get("make") + " " + d.get("model") + " – " + d.get("name")) : "";
        return true;
      });
    }
  }

  /* ---------- Start ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    applyConfig();
    reviews();
    consent.init();
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
