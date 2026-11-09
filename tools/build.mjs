// Erzeugt alle HTML-Seiten der Website neu (Startseite, Fahrzeuge, Impressum, Datenschutz, 404).
// Aufruf im Projektordner:  node tools/build.mjs
// Danach die geänderten Dateien hochladen (GitHub) – Cloudflare veröffentlicht sie automatisch.
import { writeFileSync, readFileSync, existsSync, unlinkSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
const OUT = fileURLToPath(new URL("..", import.meta.url));
// Versionsnummer je Datei (Inhalts-Hash) → Browser laden nach jeder Änderung sofort die neue Fassung
const ver = (f) => createHash("sha1").update(readFileSync(OUT + f)).digest("hex").slice(0, 8);
const V = { css: ver("assets/css/style.css"), config: ver("assets/js/config.js"), main: ver("assets/js/main.js") };
// ★ EIGENE DOMAIN: hier eintragen, z. B. "https://automobilzentrum-nagold.de" (ohne / am Ende).
// Dann stimmen Google-Adresse (canonical), Link-Vorschau-Bild (WhatsApp/Facebook) und Sitemap.
// Leer = die Seite funktioniert unter jeder Adresse (z. B. pages.dev), nur ohne diese Extras.
const SITE = "";

const I = {
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.5A8.4 8.4 0 1 1 21 11.5z"/><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" stroke-width="2.4" stroke-linecap="round"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 16v-3.5l2-5A2 2 0 0 1 6.9 6h10.2a2 2 0 0 1 1.9 1.5l2 5V16"/><path d="M3 12.5h18M3 16h18v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2M7 16v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2"/><circle cx="7" cy="14" r=".6"/><circle cx="17" cy="14" r=".6"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/></svg>',
  euro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M18 6.5A7 7 0 1 0 18 17.5"/><path d="M4 10h10M4 14h10"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>',
  badge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="9" r="6"/><path d="m9 14.5-1.5 7L12 19l4.5 2.5-1.5-7"/><path d="m9.5 9 2 2 3-3.5"/></svg>',
  swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 8h14l-4-4M20 16H6l4 4"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="m7.5 12 3 3 6-6"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 20s-7-4.4-9.2-9A5 5 0 0 1 12 6a5 5 0 0 1 9.2 5c-2.2 4.6-9.2 9-9.2 9z"/></svg>',
  ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
};

const SWOOSH1 = "M2 3 C 30 1, 40 4, 52 17 L 77 49 C 84 57, 92 58, 122 57 L 122 61 C 88 62, 79 60, 71 52 L 45 21 C 37 11, 28 8, 2 8 Z";
const SWOOSH2 = "M2 11 C 24 11, 33 14, 41 24 L 65 55 C 72 64, 80 66, 114 66 L 114 70 C 76 71, 66 69, 58 60 L 34 30 C 28 22, 22 16, 2 16 Z";
const SW_LINE1 = "M2 5.5 C 30 4, 40 7, 50 19 L 74 51 C 82 59, 92 59.5, 122 59";
const SW_LINE2 = "M2 13.5 C 24 13.5, 32 17, 39 26 L 62 57.5 C 70 67, 80 68, 114 68";

const logo = (extra = "") => `<a class="logo ${extra}" href="/" aria-label="Automobilzentrum Nagold – Startseite">
  <svg class="logo__mark" viewBox="0 0 124 72" aria-hidden="true"><path class="s1" d="${SWOOSH1}"/><path class="s2" d="${SWOOSH2}"/></svg>
  <span class="logo__text"><span class="logo__main">Automobilzentrum</span><span class="logo__sub">Nagold</span></span>
</a>`;

const defs = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
<linearGradient id="gradInk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a3a3e"/><stop offset=".5" stop-color="#0b0b0c"/><stop offset="1" stop-color="#2a2a2e"/></linearGradient>
<linearGradient id="gradChrome" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#d4d4d8"/><stop offset=".55" stop-color="#8f8f95"/><stop offset="1" stop-color="#f4f4f5"/></linearGradient>
</defs></svg>`;

const nav = [
  ["fahrzeuge.html", "Fahrzeuge", "fahrzeuge"],
  ["/#leistungen", "Leistungen", "leistungen"],
  ["/#ankauf", "Ankauf", "ankauf"],
  ["/#kontakt", "Kontakt", "kontakt"],
];

const head = ({ title, desc, path = "/" }) => `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<script>try{history.scrollRestoration="manual"}catch(e){}</script>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="theme-color" content="#0b0b0c">
<meta name="format-detection" content="telephone=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="AZ Nagold">
${SITE ? `<link rel="canonical" href="${SITE}${path}">\n` : ""}<meta property="og:type" content="website">
<meta property="og:locale" content="de_DE">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
${SITE ? `<meta property="og:url" content="${SITE}${path}">\n` : ""}<meta property="og:image" content="${SITE}/assets/img/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/img/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/assets/fonts/outfit.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/style.css?v=${V.css}">
</head>`;

const header = (active) => `
${defs}
<div class="progress" aria-hidden="true"></div>
<a class="sr-only" href="#main">Zum Inhalt springen</a>
<div class="topbar">
  <div class="container">
    <div class="topbar__left">Ankauf · Verkauf · Finanzierung · Inzahlungnahme</div>
    <div class="topbar__links">
      <a data-href="tel" href="#"><span data-cfg="phoneDisplay"></span></a><span class="sep">|</span>
      <a data-href="wa" href="#" target="_blank" rel="noopener">WhatsApp</a><span class="sep">|</span>
      <a data-href="maps" href="#" target="_blank" rel="noopener">Anfahrt</a>
    </div>
  </div>
</div>
<header class="header">
  <div class="container header__inner">
    <nav class="nav" aria-label="Hauptnavigation">
      ${nav.map(([h, t, k]) => `<a href="${h}"${active === k ? ' aria-current="page"' : ""}>${t}</a>`).join("\n      ")}
    </nav>
    ${logo()}
    <div class="header__actions">
      <a href="fahrzeuge.html" class="hide-md">${I.search}<span>Suche</span></a>
      <a data-href="wa" href="#" target="_blank" rel="noopener">${I.chat}<span>WhatsApp</span></a>
      <a data-href="tel" href="#">${I.phone}<span data-cfg="phoneDisplay"></span></a>
    </div>
    <button class="burger" type="button" aria-label="Menü öffnen" aria-expanded="false" aria-controls="mobile-menu"><span></span><span></span><span></span></button>
  </div>
</header>
<div class="mobile-menu" id="mobile-menu">
  <nav aria-label="Mobile Navigation">
    <a href="/">Start</a>
    ${nav.map(([h, t]) => `<a href="${h}">${t}</a>`).join("\n    ")}
  </nav>
  <div class="mobile-menu__foot">
    <a data-href="tel" href="#"><span data-cfg="phoneDisplay"></span></a>
    <a data-href="mail" href="#"><span data-cfg="email"></span></a>
    <span><span data-cfg="street"></span>, <span data-cfg="zipcity"></span></span>
  </div>
</div>`;

const footer = `
<footer class="footer dark">
  <div class="container">
    <div class="footer__grid">
      <div class="footer__brand">
        ${logo("logo--light")}
        <p class="footer__about">Ihr Partner für geprüfte Gebrauchtwagen, faire Ankaufpreise und flexible Finanzierung – persönlich, ehrlich und direkt in Nagold.</p>
      </div>
      <div>
        <h5>Fahrzeuge</h5>
        <ul>
          <li><a href="fahrzeuge.html">Aktueller Bestand</a></li>
          <li><a data-href="mobilede" href="#" target="_blank" rel="noopener">Bestand auf mobile.de</a></li>
          <li><a href="/#kontakt">Suchauftrag</a></li>
        </ul>
      </div>
      <div>
        <h5>Service</h5>
        <ul>
          <li><a href="/#ankauf">Fahrzeugankauf</a></li>
          <li><a href="/#leistungen">Finanzierung</a></li>
          <li><a href="/#leistungen">Inzahlungnahme</a></li>
          <li><a href="/#kontakt">Probefahrt vereinbaren</a></li>
        </ul>
      </div>
      <div>
        <h5>Kontakt</h5>
        <ul>
          <li><span data-cfg="street"></span><br><span data-cfg="zipcity"></span></li>
          <li><a data-href="tel" href="#"><span data-cfg="phoneDisplay"></span></a></li>
          <li><a data-href="mail" href="#"><span data-cfg="email"></span></a></li>
        </ul>
      </div>
    </div>
    <div class="footer__giant" aria-hidden="true" data-parallax="-0.06">NAGOLD</div>
    <div class="footer__bottom">
      <span>© <span data-cfg="year"></span> <span data-cfg="name"></span>. Alle Rechte vorbehalten.</span>
      <span><a href="impressum.html">Impressum</a> &nbsp;·&nbsp; <a href="datenschutz.html">Datenschutz</a> &nbsp;·&nbsp; <button type="button" data-consent-open>Cookie-Einstellungen</button></span>
    </div>
  </div>
</footer>
<a class="fab" data-href="wa" href="#" target="_blank" rel="noopener" aria-label="WhatsApp schreiben">${I.chat}</a>`;

const scripts = (inv) => `
<script src="/assets/js/config.js?v=${V.config}"></script>
<script src="/assets/js/main.js?v=${V.main}"></script>
</body>
</html>
`;

const preloader = `<div class="preloader" aria-hidden="true"><div>
  <svg viewBox="0 0 124 72"><path class="s1" d="${SW_LINE1}"/><path class="s2" d="${SW_LINE2}"/></svg>
  <div class="preloader__word">Automobilzentrum Nagold</div>
</div></div>`;

// Hero car
const letters = (w) => [...w].map((c, i) => `<span style="--i:${i}">${c}</span>`).join("");

/* ============================ INDEX ============================ */
const index = `${head({ title: "Automobilzentrum Nagold – Geprüfte Gebrauchtwagen, Ankauf & Finanzierung", desc: "Automobilzentrum Nagold: geprüfte Gebrauchtwagen, fairer Fahrzeugankauf, Inzahlungnahme und flexible Finanzierung. Jetzt Bestand ansehen und Probefahrt vereinbaren." })}
<body>
${preloader}
${header("")}
<main id="main">
  <div class="hero-pin" data-hero-pin>
  <section class="hero" aria-label="Willkommen">
    <canvas class="hero__fx hero__fx--back" aria-hidden="true"></canvas>
    <canvas class="hero__fx hero__fx--front" aria-hidden="true"></canvas>
    <div class="container hero__grid">
      <p class="hero__claim">Automobile<br>mit Charakter.<br>Aus Nagold.</p>
      <div class="hero__stage">
        <div class="hero__word" aria-hidden="true">${letters("NAGOLD")}</div>
        <p class="hero__tagline" aria-hidden="true"><span>Ankauf · Verkauf</span><span><i>&nbsp;·&nbsp;</i>Finanzierung</span></p>
        <div class="hero__space" aria-hidden="true"></div>
        <p class="hero__hint" aria-hidden="true"><span></span>Scrollen</p>
        <h1 class="sr-only">Automobilzentrum Nagold – Gebrauchtwagen, Ankauf und Finanzierung</h1>
      </div>
      <div class="hero__bottom">
        <div class="hero__ctas">
          <a class="btn" href="fahrzeuge.html">Fahrzeuge entdecken ${I.arrow}</a>
          <a class="link-arrow" href="#ankauf">Auto verkaufen ${I.arrow}</a>
        </div>
        <p class="hero__meta">Ankauf<br>Verkauf<br>Finanzierung</p>
      </div>
    </div>
    <div class="scroll-cue" aria-hidden="true"></div>
  </section>
  </div>

  <div class="marquee" aria-hidden="true">
    <div class="marquee__track">
      ${Array(2).fill(["Geprüfte Gebrauchtwagen", "Fairer Ankauf", "Finanzierung", "Inzahlungnahme", "Garantie", "Probefahrt"].map((t) => `<span>${t}</span>`).join("")).join("")}
    </div>
  </div>

  <section class="section dark" id="leistungen">
    <div class="container">
      <div class="section__head">
        <div>
          <span class="eyebrow" data-reveal>Leistungen</span>
          <h2 class="section__title" data-split>Alles rund ums Auto.<br><em>Aus einer Hand.</em></h2>
        </div>
        <p class="lead" data-reveal>Kaufen, verkaufen, finanzieren – bei uns bekommen Sie alles unter einem Dach. Transparent, schnell und mit einem festen Ansprechpartner.</p>
      </div>
      <div class="services">
        <article class="service" data-reveal style="--d:0s">
          <span class="service__num">01</span>
          <span class="service__icon">${I.car}</span>
          <h3>Fahrzeugverkauf</h3>
          <p>Sorgfältig ausgewählte Gebrauchtwagen – technisch geprüft, aufbereitet und sofort startklar.</p>
          <a class="link-arrow" href="fahrzeuge.html">Zum Bestand ${I.arrow}</a>
        </article>
        <article class="service" data-reveal style="--d:.1s">
          <span class="service__num">02</span>
          <span class="service__icon">${I.key}</span>
          <h3>Ankauf &amp; Inzahlungnahme</h3>
          <p>Faire Bewertung, schnelle Abwicklung und sofortige Auszahlung. Wir kaufen Ihr Auto – alle Marken.</p>
          <a class="link-arrow" href="#ankauf">Auto bewerten ${I.arrow}</a>
        </article>
        <article class="service" data-reveal style="--d:.2s">
          <span class="service__num">03</span>
          <span class="service__icon">${I.euro}</span>
          <h3>Finanzierung</h3>
          <p>Flexible Raten, passend zu Ihrem Budget – wir beraten Sie und vermitteln die Finanzierung über unsere Partnerbank.</p>
          <a class="link-arrow" href="#kontakt" data-topic="Finanzierung">Beratung anfragen ${I.arrow}</a>
        </article>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container stock">
      <div class="stock__text">
        <span class="eyebrow" data-reveal>Bestand</span>
        <h2 class="section__title" data-split>Unser Bestand.<br><em>Von mobile.de.</em></h2>
        <p class="lead" data-reveal style="margin-top:22px">Alle Fahrzeuge mit allen Fotos und Details – direkt von mobile.de und automatisch aktuell. Neue Fahrzeuge erscheinen sofort, verkaufte verschwinden von selbst.</p>
        <div class="hero__ctas" style="margin-top:32px" data-reveal>
          <a class="btn" href="fahrzeuge.html">Bestand ansehen ${I.arrow}</a>
          <a class="link-arrow" data-href="mobilede" href="#" target="_blank" rel="noopener">Auf mobile.de ${I.ext}</a>
        </div>
      </div>
      <a class="stock__visual" href="fahrzeuge.html" data-reveal="scale" aria-label="Zum Fahrzeugbestand">
        <div class="mde-frame__bar">
          <span class="mde-frame__dots" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="mde-frame__live"><i></i>Von mobile.de</span>
          <span class="stock__brand">mobile<b>.de</b></span>
        </div>
        <div class="stock__rows" aria-hidden="true">
          ${[0, 1, 2, 3].map((i) => `<div class="stock__row" style="--i:${i}"><span class="stock__thumb"></span><span class="stock__lines"><i></i><i></i><i></i></span><span class="stock__price"></span></div>`).join("")}
        </div>
      </a>
    </div>
  </section>

  <section class="section--white">
    <div class="container features">
      <div class="feature" data-reveal style="--d:0s">${I.badge}<div><h4>Geprüfte Qualität</h4><p>Jedes Fahrzeug technisch durchgecheckt</p></div></div>
      <div class="feature" data-reveal style="--d:.08s">${I.shield}<div><h4>Garantie</h4><p>Gebrauchtwagengarantie auf Wunsch</p></div></div>
      <div class="feature" data-reveal style="--d:.16s">${I.euro}<div><h4>Finanzierung</h4><p>Individuelle Ratenmodelle</p></div></div>
      <div class="feature" data-reveal style="--d:.24s">${I.swap}<div><h4>Inzahlungnahme</h4><p>Ihr altes Auto zählt beim Kauf</p></div></div>
    </div>
  </section>

  <section class="statement">
    <div class="container">
      <span class="eyebrow" data-reveal>Über uns</span>
      <div class="statement__row" style="margin-top:28px">
        <p class="statement__text" data-scrub>Wir verkaufen nicht einfach Autos. Wir finden Ihres – ehrlich, persönlich und mit Leidenschaft aus Nagold.</p>
        <svg class="statement__mark" viewBox="0 0 124 72" aria-hidden="true"><path class="s1" d="${SW_LINE1}"/><path class="s2" d="${SW_LINE2}"/></svg>
      </div>
      <div class="stats">
        <div class="stat" data-reveal style="--d:0s"><div class="stat__num"><span data-count="24" data-suffix="/7">0</span></div><div class="stat__label">Bestand online – von mobile.de</div></div>
        <div class="stat" data-reveal style="--d:.08s"><div class="stat__num"><span data-count="4">0</span></div><div class="stat__label">Schritte bis zu Ihrem Auto</div></div>
        <div class="stat" data-reveal style="--d:.16s"><div class="stat__num"><span data-count="24" data-suffix=" h">0</span></div><div class="stat__label">Ankaufangebot für Ihr Auto</div></div>
        <div class="stat" data-reveal style="--d:.24s"><div class="stat__num"><span data-count="1">0</span></div><div class="stat__label">Ansprechpartner von A bis Z</div></div>
      </div>
    </div>
  </section>

  <section class="section dark">
    <div class="container">
      <div class="section__head">
        <div>
          <span class="eyebrow" data-reveal>Ablauf</span>
          <h2 class="section__title" data-split>So einfach geht's.</h2>
        </div>
        <p class="lead" data-reveal>Vom ersten Klick bis zur Schlüsselübergabe – in vier entspannten Schritten.</p>
      </div>
      <div class="steps">
        <div class="step" data-reveal style="--d:0s"><h3>Fahrzeug finden</h3><p>Stöbern Sie online in unserem Bestand oder lassen Sie sich vor Ort beraten.</p></div>
        <div class="step" data-reveal style="--d:.08s"><h3>Probefahrt</h3><p>Termin per Telefon oder WhatsApp – wir bereiten alles für Sie vor.</p></div>
        <div class="step" data-reveal style="--d:.16s"><h3>Finanzieren</h3><p>Barkauf, Finanzierung oder Inzahlungnahme – ganz wie es für Sie passt.</p></div>
        <div class="step" data-reveal style="--d:.24s"><h3>Losfahren</h3><p>Auf Wunsch mit Zulassung und frisch aufbereitet. Gute Fahrt!</p></div>
      </div>
    </div>
  </section>

  <section class="section" id="ankauf">
    <div class="container ankauf">
      <div class="ankauf__intro">
        <span class="eyebrow" data-reveal>Fahrzeugankauf</span>
        <h2 class="section__title" data-split>Ihr Auto.<br><em>Unser bestes Angebot.</em></h2>
        <p class="lead" data-reveal style="margin-top:20px">Tragen Sie die Daten Ihres Fahrzeugs ein – wir melden uns schnellstmöglich mit einem Angebot.</p>
        <ul class="checklist">
          <li data-reveal style="--d:0s">${I.check}<span><strong>Kostenlose Bewertung</strong> – vor Ort oder anhand von Fotos</span></li>
          <li data-reveal style="--d:.06s">${I.check}<span><strong>Sofortige Auszahlung</strong> – bar oder per Überweisung</span></li>
          <li data-reveal style="--d:.12s">${I.check}<span><strong>Abmeldung inklusive</strong> – wir kümmern uns um den Papierkram</span></li>
          <li data-reveal style="--d:.18s">${I.check}<span><strong>Alle Marken &amp; Modelle</strong> – auch mit hoher Laufleistung</span></li>
        </ul>
        <a class="link-arrow" data-href="wa" href="#" target="_blank" rel="noopener" data-reveal>Fotos per WhatsApp schicken ${I.arrow}</a>
      </div>
      <form class="form form--ankauf" data-ankauf-form data-reveal novalidate>
        <h3>Fahrzeug bewerten lassen</h3>
        <p class="form__sub">Kostenlos und unverbindlich.</p>
        <p class="form__group">Ihr Fahrzeug</p>
          <div class="field"><label for="a-make">Marke *</label><input id="a-make" name="make" placeholder="z. B. VW" required></div>
          <div class="field"><label for="a-model">Modell *</label><input id="a-model" name="model" placeholder="z. B. Golf" required></div>
          <div class="field"><label for="a-type">Fahrzeugtyp *</label><select id="a-type" name="type" required><option value="">Bitte wählen</option><option>Limousine</option><option>Kombi</option><option>SUV / Geländewagen</option><option>Kleinwagen</option><option>Cabrio / Roadster</option><option>Sportwagen / Coupé</option><option>Van / Kleinbus</option><option>Transporter</option><option>Sonstiges</option></select></div>
          <div class="field"><label for="a-doors">Anzahl der Türen *</label><select id="a-doors" name="doors" required><option value="">Bitte wählen</option><option>2/3</option><option>4/5</option><option>6/7</option></select></div>
          <div class="field"><label for="a-reg">Erstzulassung *</label><input id="a-reg" name="reg" placeholder="MM/JJJJ" required inputmode="numeric" maxlength="7" data-reg></div>
          <div class="field"><label for="a-km">Kilometerstand *</label><input id="a-km" name="km" placeholder="z. B. 85.000" required inputmode="numeric"></div>
          <div class="field"><label for="a-fuel">Kraftstoffart *</label><select id="a-fuel" name="fuel" required><option value="">Bitte wählen</option><option>Benzin</option><option>Diesel</option><option>Hybrid (Benzin/Elektro)</option><option>Plug-in-Hybrid</option><option>Elektro</option><option>Autogas (LPG)</option><option>Erdgas (CNG)</option><option>Sonstige</option></select></div>
          <div class="field"><label for="a-gear">Getriebe *</label><select id="a-gear" name="gear" required><option value="">Bitte wählen</option><option>Schaltgetriebe</option><option>Automatik</option></select></div>
          <div class="field field--full"><label for="a-price">Preis</label><input id="a-price" name="price" placeholder="Ihre Preisvorstellung in €" inputmode="numeric"></div>
        <p class="form__group" data-server-only hidden>Fotos <span class="form__opt">(optional)</span></p>
        <div class="uploader" data-uploader data-server-only hidden>
          <label class="uploader__drop" for="a-photos" data-uploader-drop>
            <input class="sr-only" id="a-photos" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*" multiple data-uploader-input>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.6l1.4-2h7l1.4 2h1.6A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/><circle cx="12" cy="12.5" r="3.6"/><path d="M18 3v4M16 5h4"/></svg>
            <strong>Fotos hinzufügen</strong>
            <span>Bis zu 10 Bilder – z. B. außen, innen, Tacho und Schäden</span>
          </label>
          <ul class="uploader__list" data-uploader-list></ul>
          <p class="uploader__note" data-uploader-note>Die Fotos werden beim Absenden zusammen mit Ihren Angaben als PDF an uns geschickt – nicht auf der Website gespeichert.</p>
        </div>
        <p class="form__hint" data-mail-only>📎 <strong>Fotos?</strong> Die hängen Sie im nächsten Schritt einfach direkt an Ihre E-Mail an – am besten außen, innen, Tacho und eventuelle Schäden.</p>
        <p class="form__group">Ihre Kontaktdaten</p>
          <div class="field"><label for="a-name">Name *</label><input id="a-name" name="name" autocomplete="name" required></div>
          <div class="field"><label for="a-phone">Telefon *</label><input id="a-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required></div>
          <div class="field field--full"><label for="a-email">E-Mail</label><input id="a-email" name="email" type="email" autocomplete="email" inputmode="email"></div>
          <div class="field field--full"><label for="a-note">Anmerkungen (optional)</label><textarea id="a-note" name="message" rows="3" placeholder="z. B. Unfallfrei, Scheckheft, TÜV bis …"></textarea></div>
        <input type="hidden" name="art" value="ankauf">
        <div class="hp" aria-hidden="true"><label>Website <input name="website_url" tabindex="-1" autocomplete="off"></label></div>
        <div class="form__actions">
          <button class="btn" type="submit">Anfrage absenden ${I.arrow}</button>
          <button class="btn btn--ghost" type="button" data-wa-send>${I.chat} Per WhatsApp</button>
        </div>
        <p class="form__note">Beim Absenden wählen Sie Ihre E-Mail-App (oder WhatsApp) – die Nachricht an uns ist dort fertig vorbereitet. Ihre Angaben verwenden wir nur zur Bearbeitung Ihrer Anfrage, mehr in der <a href="datenschutz.html">Datenschutzerklärung</a>.</p>
      </form>
    </div>
  </section>

  <section class="section reviews" id="bewertungen" data-reviews hidden>
    <div class="container">
      <div class="section__head">
        <div>
          <span class="eyebrow" data-reveal>Bewertungen</span>
          <h2 class="section__title" data-split>Das sagen<br><em>unsere Kunden.</em></h2>
        </div>
        <div class="rating" data-reveal>
          <div class="rating__score"><span data-rating-value>0,0</span><div class="stars stars--lg" data-rating-stars aria-hidden="true"></div></div>
          <p class="rating__count"><span data-rating-count>0</span> Bewertungen auf Google</p>
          <div class="rating__links">
            <a class="link-arrow" data-href="gprofile" href="#" target="_blank" rel="noopener">Alle auf Google ${I.ext}</a>
            <a class="link-arrow" data-href="greview" href="#" target="_blank" rel="noopener">Bewertung schreiben ${I.arrow}</a>
          </div>
        </div>
      </div>
      <div class="reviews__track" data-reviews-track></div>
      <p class="reviews__note">Ausgewählte Bewertungen aus unserem Google-Unternehmensprofil. Die Gesamtbewertung und Anzahl umfassen alle Bewertungen auf Google. Wir prüfen nicht selbst, ob die Bewertenden unsere Leistungen in Anspruch genommen haben; Google setzt hierfür eigene Prüfverfahren ein.</p>
    </div>
  </section>

  <section class="section section--white" id="kontakt">
    <div class="container">
      <div class="section__head">
        <div>
          <span class="eyebrow" data-reveal>Kontakt</span>
          <h2 class="section__title" data-split>Wir freuen uns<br><em>auf Sie.</em></h2>
        </div>
      </div>
      <div class="contact">
        <div class="contact__info">
          <div class="contact__block" data-reveal><h4>Adresse</h4><p><span data-cfg="street"></span><br><span data-cfg="zipcity"></span></p><a class="link-arrow" style="font-size:13px;margin-top:12px" data-href="maps" href="#" target="_blank" rel="noopener">Route planen ${I.arrow}</a></div>
          <div class="contact__block" data-reveal><h4>Telefon &amp; WhatsApp</h4><a data-href="tel" href="#"><span data-cfg="phoneDisplay"></span></a><br><a data-href="wa" href="#" target="_blank" rel="noopener">WhatsApp schreiben</a></div>
          <div class="contact__block" data-reveal><h4>E-Mail</h4><a data-href="mail" href="#"><span data-cfg="email"></span></a></div>
          <div class="contact__block" data-reveal><h4>Öffnungszeiten</h4><dl class="hours" data-hours></dl><span class="open-badge" data-open-badge><i></i><span>Öffnungszeiten</span></span></div>
        </div>
        <form class="form" data-contact-form data-reveal novalidate>
          <h3>Anfrage senden</h3>
          <div class="field field--full"><label for="topic">Anliegen</label>
            <select id="topic" name="topic"><option>Fahrzeugkauf</option><option>Probefahrt</option><option>Suchauftrag</option><option>Finanzierung</option><option>Sonstiges</option></select></div>
          <div class="field"><label for="name">Name *</label><input id="name" name="name" autocomplete="name" required></div>
          <div class="field"><label for="phone">Telefon</label><input id="phone" name="phone" type="tel" autocomplete="tel" inputmode="tel"></div>
          <div class="field field--full"><label for="email">E-Mail</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email"></div>
          <div class="field field--full"><label for="car">Fahrzeug (optional)</label><input id="car" name="car" placeholder="z. B. BMW 320d aus Ihrem Bestand oder Ihr Wunschauto"></div>
          <div class="field field--full"><label for="message">Nachricht *</label><textarea id="message" name="message" required placeholder="Ihre Nachricht an uns"></textarea></div>
          <input type="hidden" name="art" value="kontakt">
          <div class="hp" aria-hidden="true"><label>Website <input name="website_url" tabindex="-1" autocomplete="off"></label></div>
          <div class="form__actions">
            <button class="btn" type="submit">Anfrage absenden ${I.arrow}</button>
            <button class="btn btn--ghost" type="button" data-wa-send>${I.chat} Per WhatsApp</button>
          </div>
          <p class="form__note">Beim Absenden wählen Sie Ihre E-Mail-App (oder WhatsApp) – die Nachricht an uns ist dort fertig vorbereitet. Mehr in der <a href="datenschutz.html">Datenschutzerklärung</a>.</p>
        </form>
      </div>
    </div>
  </section>

  <section class="cta-band dark">
    <svg class="cta-band__lines" viewBox="0 0 1440 400" preserveAspectRatio="none" aria-hidden="true"><path d="M0 120 C 400 110, 520 130, 640 220 S 900 330, 1440 320" fill="none" stroke="#fff" stroke-opacity=".12"/><path d="M0 150 C 380 150, 500 170, 610 250 S 880 360, 1440 352" fill="none" stroke="#fff" stroke-opacity=".08"/></svg>
    <div class="container">
      <h2 data-split>Bereit für Ihr<br>nächstes Auto?</h2>
      <p data-reveal>Schauen Sie vorbei, rufen Sie an oder schreiben Sie uns – wir nehmen uns Zeit für Sie.</p>
      <div class="actions" data-reveal>
        <a class="btn btn--light" href="fahrzeuge.html">Bestand ansehen ${I.arrow}</a>
        <a class="btn btn--ghost" data-href="tel" href="#">${I.phone} Jetzt anrufen</a>
      </div>
    </div>
  </section>
</main>
${footer}
${scripts(false)}`;

/* ============================ FAHRZEUGE ============================ */
const fahrzeuge = `${head({ title: "Fahrzeugbestand – Automobilzentrum Nagold", desc: "Der komplette Fahrzeugbestand des Automobilzentrum Nagold – von mobile.de, immer aktuell. Jetzt Wunschauto finden und anfragen.", path: "/fahrzeuge" })}
<body>
${header("fahrzeuge")}
<main id="main">
  <section class="page-hero">
    <div class="container">
      <span class="eyebrow" data-reveal>Bestand</span>
      <div class="page-hero__row">
        <h1 data-split>Unsere<br><em>Fahrzeuge</em></h1>
        <div>
          <p class="lead" data-reveal>Unser kompletter Bestand – von mobile.de und immer aktuell. Fahrzeug gefunden? Rufen Sie uns an oder schreiben Sie uns per WhatsApp.</p>
          <div class="hero__ctas" style="margin-top:22px" data-reveal>
            <a class="btn" data-href="wa" href="#" target="_blank" rel="noopener">${I.chat} WhatsApp</a>
            <a class="link-arrow" data-href="tel" href="#">${I.phone}<span data-cfg="phoneDisplay"></span></a>
          </div>
        </div>
      </div>
    </div>
  </section>
  <section class="container mde-section">
    <div class="mde-frame" data-reveal="scale">
      <div class="mde-frame__bar">
        <span class="mde-frame__dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="mde-frame__live"><i></i>Von mobile.de</span>
        <a class="mde-frame__open" data-href="mobilede" href="#" target="_blank" rel="noopener"><span class="hide-sm">In neuem Tab&nbsp;</span>öffnen ${I.ext}</a>
      </div>
      <div class="mde-frame__body" data-mde-embed>
        <div class="mde-frame__state">
          <span class="mde__logo">mobile<b>.de</b></span>
          <span class="mde__txt" data-mde-status>Bestand wird geladen …</span>
        </div>
      </div>
    </div>
    <p class="mde-frame__note">Bestand wird nicht angezeigt? <a data-href="mobilede" href="#" target="_blank" rel="noopener">Direkt auf mobile.de ansehen</a></p>
  </section>
  <section class="cta-band dark">
    <div class="container">
      <h2 data-split>Nicht das Richtige<br>dabei?</h2>
      <p data-reveal>Sagen Sie uns, was Sie suchen – wir finden Ihr Wunschfahrzeug über unser Händlernetzwerk.</p>
      <div class="actions" data-reveal>
        <a class="btn btn--light" href="index.html?anliegen=Suchauftrag#kontakt">Suchauftrag senden ${I.arrow}</a>
        <a class="btn btn--ghost" data-href="wa" href="#" target="_blank" rel="noopener">${I.chat} WhatsApp</a>
      </div>
    </div>
  </section>
</main>
${footer}
${scripts(false)}`;

/* ============================ LEGAL ============================ */
const legalPage = (title, path, h1, body) => `${head({ title: `${title} – Automobilzentrum Nagold`, desc: `${title} des Automobilzentrum Nagold.`, path })}
<body>
${header("")}
<main id="main">
  <section class="page-hero">
    <div class="container">
      <span class="eyebrow">Rechtliches</span>
      <h1 style="font-size:clamp(48px,9vw,128px)">${h1}</h1>
    </div>
  </section>
  <section class="container" style="padding-bottom:clamp(72px,10vw,140px)">
    <div class="legal">${body}</div>
  </section>
</main>
${footer}
${scripts(false)}`;

const impressum = legalPage("Impressum", "/impressum", "Impressum", `
  <p class="notice" data-placeholder-notice><strong>Hinweis für den Inhaber:</strong> Es sind noch Platzhalter eingetragen. Bitte die echten Firmendaten in <code>assets/js/config.js</code> eintragen – dieser Hinweis verschwindet dann automatisch.</p>
  <h2>Angaben gemäß § 5 DDG</h2>
  <p><strong data-cfg="legalName"></strong><br><span data-cfg="owner"></span><br><span data-cfg="street"></span><br><span data-cfg="zipcity"></span><br>Deutschland</p>
  <h2>Kontakt</h2>
  <p>Telefon: <a data-href="tel" href="#"><span data-cfg="phoneDisplay"></span></a><br>E-Mail: <a data-href="mail" href="#"><span data-cfg="email"></span></a></p>
  <div data-optional="register"><h2>Registereintrag</h2><p><span data-cfg="register"></span></p></div>
  <div data-optional="vatId"><h2>Umsatzsteuer-ID</h2><p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: <span data-cfg="vatId"></span></p></div>
  <h2>Verbraucherstreitbeilegung</h2>
  <p>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
  <h2>Hinweis zu Fahrzeugangeboten</h2>
  <p>Unsere Fahrzeugangebote werden über mobile.de dargestellt. Alle Angebote sind freibleibend und unverbindlich; Irrtümer, Zwischenverkauf und Änderungen bleiben vorbehalten. Verbindlich sind ausschließlich die Angaben im Kaufvertrag.</p>
  <h2>Haftung für Inhalte</h2>
  <p>Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Wir sind jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt.</p>
  <h2>Haftung für Links</h2>
  <p>Unser Angebot enthält Links zu externen Websites Dritter (z. B. mobile.de, WhatsApp, Google Maps), auf deren Inhalte wir keinen Einfluss haben. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber verantwortlich. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.</p>
  <h2>Urheberrecht</h2>
  <p>Die Inhalte und Gestaltung dieser Website unterliegen dem deutschen Urheberrecht. Vervielfältigung, Bearbeitung und Verbreitung außerhalb der Grenzen des Urheberrechts bedürfen unserer schriftlichen Zustimmung. Die verwendeten Schriftarten „Outfit“ und „Inter“ stehen unter der SIL Open Font License 1.1.</p>
`);

const datenschutz = legalPage("Datenschutz", "/datenschutz", "Datenschutz", `
  <p class="notice" data-placeholder-notice><strong>Hinweis für den Inhaber:</strong> Es sind noch Platzhalter eingetragen. Bitte die echten Firmendaten in <code>assets/js/config.js</code> eintragen – dieser Hinweis verschwindet dann automatisch.</p>
  <p>Mit dieser Datenschutzerklärung informieren wir Sie gemäß Art. 13 DSGVO darüber, welche personenbezogenen Daten wir beim Besuch dieser Website verarbeiten, zu welchem Zweck und auf welcher Rechtsgrundlage.</p>

  <h2>1. Verantwortlicher</h2>
  <p><strong data-cfg="legalName"></strong><br><span data-cfg="owner"></span><br><span data-cfg="street"></span>, <span data-cfg="zipcity"></span><br>Telefon: <span data-cfg="phoneDisplay"></span><br>E-Mail: <a data-href="mail" href="#"><span data-cfg="email"></span></a></p>

  <h2>2. Allgemeines</h2>
  <h3>Rechtsgrundlagen</h3>
  <p>Wir verarbeiten personenbezogene Daten auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), zur Erfüllung eines Vertrags oder zur Durchführung vorvertraglicher Maßnahmen (Art. 6 Abs. 1 lit. b DSGVO), zur Erfüllung rechtlicher Pflichten (Art. 6 Abs. 1 lit. c DSGVO) oder aufgrund unseres berechtigten Interesses (Art. 6 Abs. 1 lit. f DSGVO). Soweit Informationen auf Ihrem Endgerät gespeichert oder ausgelesen werden, richtet sich dies nach § 25 TDDDG.</p>
  <h3>Speicherdauer</h3>
  <p>Wir speichern personenbezogene Daten nur so lange, wie es für den jeweiligen Zweck erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen (z. B. 6 Jahre für Geschäftsbriefe nach § 257 HGB, 10 Jahre für Buchungsbelege nach § 147 AO). Danach werden die Daten gelöscht.</p>
  <h3>Pflicht zur Bereitstellung, automatisierte Entscheidungen</h3>
  <p>Sie sind nicht verpflichtet, uns personenbezogene Daten bereitzustellen. Ohne Ihre Kontaktdaten können wir eine Anfrage jedoch nicht beantworten. Eine automatisierte Entscheidungsfindung einschließlich Profiling (Art. 22 DSGVO) findet nicht statt.</p>

  <h2>3. Hosting und Server-Logfiles</h2>
  <p>Diese Website wird bei Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, USA, über den Dienst „Cloudflare Pages“ gehostet. Beim Aufruf der Website werden technisch notwendige Daten verarbeitet, insbesondere IP-Adresse, Datum und Uhrzeit des Abrufs, aufgerufene Seite, Referrer-URL sowie Browser- und Betriebssystemangaben. Dies ist erforderlich, um die Website auszuliefern, ihre Stabilität und Sicherheit zu gewährleisten und Angriffe abzuwehren. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO; unser berechtigtes Interesse liegt im sicheren und zuverlässigen Betrieb der Website.</p>
  <p>Mit Cloudflare besteht ein Vertrag zur Auftragsverarbeitung (Art. 28 DSGVO). Eine Übermittlung in die USA ist möglich; Cloudflare ist unter dem EU-US Data Privacy Framework zertifiziert, auf dessen Grundlage ein Angemessenheitsbeschluss der EU-Kommission besteht (Art. 45 DSGVO). Weitere Informationen: <a href="https://www.cloudflare.com/de-de/privacypolicy/" target="_blank" rel="noopener">Datenschutzerklärung von Cloudflare</a>.</p>

  <h2>4. Cookies, lokaler Speicher und Einwilligung</h2>
  <p>Wir selbst setzen keine Analyse-, Tracking- oder Werbe-Cookies ein. Auf unserer Website werden lediglich folgende Informationen in Ihrem Browser gespeichert:</p>
  <ul>
    <li><strong>Ihre Cookie-Auswahl</strong> (localStorage, Eintrag „azn-consent“): damit das Hinweisfenster nicht bei jedem Besuch erneut erscheint. Gespeichert bis zur Änderung Ihrer Auswahl oder bis Sie Ihre Browserdaten löschen.</li>
    <li><strong>Startanimation</strong> (sessionStorage, Eintrag „azn-intro“): damit die Startanimation nur einmal pro Besuch abgespielt wird. Wird beim Schließen des Browsers gelöscht.</li>
  </ul>
  <p>Diese Speicherungen sind für den von Ihnen gewünschten Dienst unbedingt erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG) und verlassen Ihr Gerät nicht. Inhalte von Drittanbietern (mobile.de) laden wir nur mit Ihrer Einwilligung (§ 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO), die Sie beim ersten Besuch über unser Hinweisfenster erteilen oder ablehnen können.</p>
  <p><strong>Widerruf:</strong> Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen oder ändern – über den Link <button type="button" class="inline-link" data-consent-open>„Cookie-Einstellungen“</button>, der am Ende jeder Seite zu finden ist. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung bleibt unberührt (Art. 7 Abs. 3 DSGVO).</p>

  <h2>5. Fahrzeugbestand von mobile.de</h2>
  <p>Auf der Seite „Fahrzeuge“ binden wir unseren Fahrzeugbestand direkt von mobile.de ein. Anbieter ist die mobile.de GmbH (Anschrift und Kontakt siehe <a href="https://www.mobile.de/service/privacyPolicy" target="_blank" rel="noopener">Datenschutzerklärung von mobile.de</a>).</p>
  <p>Der Bestand wird <strong>nur geladen, wenn Sie eingewilligt haben</strong> – entweder über „Alle akzeptieren“ bzw. die Einstellungen im Hinweisfenster oder über die Schaltfläche „Bestand von mobile.de laden“. Ohne Einwilligung wird keine Verbindung zu mobile.de hergestellt. Nach Ihrer Einwilligung stellt Ihr Browser eine Verbindung zu Servern von mobile.de her; dabei werden insbesondere Ihre IP-Adresse, Browserinformationen sowie die aufgerufene Seite an mobile.de übermittelt, und mobile.de kann Cookies oder ähnliche Technologien einsetzen. Rechtsgrundlage ist Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG). Für die weitere Verarbeitung ist mobile.de verantwortlich.</p>

  <h2>6. Kontaktaufnahme</h2>
  <p>Wenn Sie uns per E-Mail oder Telefon kontaktieren, verarbeiten wir Ihre Angaben (z. B. Name, Kontaktdaten, Inhalt Ihrer Anfrage, Angaben zu einem Fahrzeug) zur Bearbeitung Ihrer Anfrage. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, soweit Ihre Anfrage auf einen Vertrag (z. B. Fahrzeugkauf, Ankauf, Finanzierung) gerichtet ist, im Übrigen Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung von Anfragen).</p>
  <p><strong>Formulare:</strong> Die Formulare auf dieser Website senden <strong>keine Daten an unseren Server</strong>. Beim Absenden wählen Sie, womit Sie uns die Nachricht schicken möchten – Ihre E-Mail-App, Gmail, Outlook oder WhatsApp. Dort öffnet sich eine vorausgefüllte Nachricht, die Sie selbst prüfen, ergänzen (z. B. Fotos anhängen) und absenden. Für die Übermittlung gelten dann die Datenschutzbestimmungen des von Ihnen gewählten Anbieters. Wählen Sie „Text kopieren“, wird der Text nur in die Zwischenablage Ihres Geräts kopiert.</p>
  <p>Ihre Anfrage löschen wir, sobald sie abschließend bearbeitet ist, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.</p>
  <p>Für E-Mails nutzen wir den Dienst Gmail der Google Ireland Limited (Irland). E-Mails an uns werden daher auf Servern von Google verarbeitet; eine Übermittlung in die USA ist möglich (EU-US Data Privacy Framework). Weitere Informationen: <a href="https://policies.google.com/privacy?hl=de" target="_blank" rel="noopener">Datenschutzerklärung von Google</a>.</p>

  <h3>Fotos beim Fahrzeugankauf</h3>
  <p>Fotos Ihres Fahrzeugs können Sie freiwillig an Ihre E-Mail bzw. WhatsApp-Nachricht an uns anhängen. Wir verwenden sie ausschließlich zur Bewertung Ihres Fahrzeugs (Art. 6 Abs. 1 lit. b DSGVO). Bitte senden Sie keine Fotos, auf denen andere Personen zu erkennen sind.</p>

  <h3>Kundenbewertungen</h3>
  <p>Auf unserer Startseite zeigen wir ausgewählte Bewertungen, die Kundinnen und Kunden öffentlich in unserem Google-Unternehmensprofil abgegeben haben, mit abgekürztem Namen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Darstellung von Kundenmeinungen). Wenn Sie nicht möchten, dass Ihre Bewertung hier erscheint, genügt eine kurze Nachricht an uns. Die Bewertungen werden nicht von Google geladen; es entsteht keine Verbindung zu Google, solange Sie nicht auf einen Google-Link klicken.</p>

  <h2>7. WhatsApp</h2>
  <p>Sie können uns über WhatsApp kontaktieren. Die WhatsApp-Schaltflächen auf unserer Website sind einfache Links; erst wenn Sie darauf tippen, wird WhatsApp (WhatsApp Ireland Limited, Irland) geöffnet. Bei der Nutzung verarbeitet WhatsApp Daten in eigener Verantwortung, u. a. Ihre Telefonnummer und Metadaten; eine Übermittlung an die Muttergesellschaft Meta Platforms, Inc. in den USA ist möglich (EU-US Data Privacy Framework). Weitere Informationen: <a href="https://www.whatsapp.com/legal/privacy-policy-eea" target="_blank" rel="noopener">Datenschutzrichtlinie von WhatsApp</a>. Wenn Sie das nicht möchten, erreichen Sie uns gern per Telefon oder E-Mail.</p>

  <h2>8. Links zu Google Maps und weiteren Seiten</h2>
  <p>Die Schaltflächen „Anfahrt“ bzw. „Route planen“ sind einfache Links zu Google Maps (Google Ireland Limited, Irland). Es werden keine Karten eingebettet; eine Verbindung zu Google entsteht erst, wenn Sie den Link anklicken. Dann gilt die <a href="https://policies.google.com/privacy?hl=de" target="_blank" rel="noopener">Datenschutzerklärung von Google</a>. Gleiches gilt für Links zu mobile.de.</p>

  <h2>9. Schriftarten</h2>
  <p>Die auf dieser Website verwendeten Schriftarten werden lokal von unserem eigenen Webspace geladen. Es findet keine Verbindung zu Servern von Google oder anderen Schriftanbietern statt.</p>

  <h2>10. SSL-/TLS-Verschlüsselung</h2>
  <p>Diese Website nutzt aus Sicherheitsgründen eine SSL-/TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie an „https://“ und dem Schloss-Symbol in der Adresszeile Ihres Browsers.</p>

  <h2>11. Ihre Rechte</h2>
  <p>Sie haben jederzeit das Recht auf:</p>
  <ul>
    <li>Auskunft über Ihre gespeicherten Daten (Art. 15 DSGVO)</li>
    <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
    <li>Löschung (Art. 17 DSGVO) und Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
    <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
    <li>Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)</li>
    <li>Beschwerde bei einer Datenschutz-Aufsichtsbehörde (Art. 77 DSGVO), z. B. beim <a href="https://www.baden-wuerttemberg.datenschutz.de/" target="_blank" rel="noopener">Landesbeauftragten für den Datenschutz und die Informationsfreiheit Baden-Württemberg</a></li>
  </ul>
  <p><strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Soweit wir Daten auf Grundlage berechtigter Interessen (Art. 6 Abs. 1 lit. f DSGVO) verarbeiten, haben Sie das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit Widerspruch gegen diese Verarbeitung einzulegen. Wir verarbeiten Ihre Daten dann nicht mehr, es sei denn, wir können zwingende schutzwürdige Gründe nachweisen.</p>
  <p>Zur Ausübung Ihrer Rechte genügt eine formlose Nachricht an die oben genannten Kontaktdaten.</p>

  <h2>12. Änderungen</h2>
  <p>Wir passen diese Datenschutzerklärung an, wenn sich die Website oder die Rechtslage ändert. Es gilt die jeweils hier veröffentlichte Fassung.</p>
  <p><em>Stand: November 2026</em></p>
`);

const notFound = `${head({ title: "Seite nicht gefunden – Automobilzentrum Nagold", desc: "Diese Seite existiert nicht.", path: "/404" })}
<body>
${header("")}
<main id="main">
  <section class="page-hero" style="min-height:60vh">
    <div class="container">
      <span class="eyebrow">Fehler 404</span>
      <h1 data-split>Falsch<br><em>abgebogen.</em></h1>
      <p class="lead" data-reveal>Diese Seite gibt es leider nicht. Aber keine Sorge – zurück zur Strecke geht's hier:</p>
      <div class="hero__ctas" style="margin-top:32px" data-reveal>
        <a class="btn" href="/">Zur Startseite ${I.arrow}</a>
        <a class="link-arrow" href="fahrzeuge.html">Fahrzeuge ansehen ${I.arrow}</a>
      </div>
    </div>
  </section>
</main>
${footer}
${scripts(false)}`;

// Relative Pfade, damit die Seite auch lokal per Doppelklick (Windows/Mac) funktioniert.
// Nur die 404-Seite behält absolute Pfade (sie wird unter beliebigen URLs ausgeliefert).
const rel = (c, isIndex) => c
  .replaceAll('"/assets/', '"assets/')
  .replaceAll('href="/site.webmanifest"', 'href="site.webmanifest"')
  .replaceAll('href="/#', isIndex ? 'href="#' : 'href="index.html#')
  .replaceAll('href="/"', 'href="index.html"');
for (const [f, c] of Object.entries({ "index.html": index, "fahrzeuge.html": fahrzeuge, "impressum.html": impressum, "datenschutz.html": datenschutz })) {
  writeFileSync(OUT + f, rel(c, f === "index.html"));
}
writeFileSync(OUT + "404.html", notFound.replaceAll('href="fahrzeuge.html', 'href="/fahrzeuge.html').replaceAll('href="impressum.html', 'href="/impressum.html').replaceAll('href="datenschutz.html', 'href="/datenschutz.html'));

// Favicon & manifest assets (SVG)
writeFileSync(OUT + "assets/img/favicon.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#cfcfd3"/><stop offset="1" stop-color="#fff"/></linearGradient></defs><rect width="64" height="64" rx="14" fill="#0b0b0c"/><g transform="translate(6 14) scale(.42)"><path fill="url(#c)" d="${SWOOSH1}"/><path fill="#8b8b91" d="${SWOOSH2}"/></g></svg>`);
writeFileSync(OUT + "assets/img/logo.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 90"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a3a3e"/><stop offset=".5" stop-color="#0b0b0c"/><stop offset="1" stop-color="#2a2a2e"/></linearGradient></defs><g transform="translate(0 6)"><path fill="url(#g)" d="${SWOOSH1}"/><path fill="#77777c" d="${SWOOSH2}"/></g><text x="512" y="52" text-anchor="end" font-family="Outfit, 'Segoe UI', Arial, sans-serif" font-weight="700" font-size="50" letter-spacing="-1.2" fill="#0b0b0c">Automobilzentrum</text><text x="512" y="84" text-anchor="end" font-family="Outfit, 'Segoe UI', Arial, sans-serif" font-weight="600" font-size="22" letter-spacing="11" fill="#77777c">NAGOLD</text></svg>`);
// Sitemap & robots.txt (Sitemap nur mit fester Domain)
const pages = [["/", "1.0"], ["/fahrzeuge", "0.9"], ["/impressum", "0.2"], ["/datenschutz", "0.2"]];
if (SITE) {
  writeFileSync(OUT + "sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(([p, pr]) => `  <url><loc>${SITE}${p}</loc><priority>${pr}</priority></url>`).join("\n")}\n</urlset>\n`);
} else if (existsSync(OUT + "sitemap.xml")) unlinkSync(OUT + "sitemap.xml");
writeFileSync(OUT + "robots.txt", `User-agent: *\nAllow: /\n${SITE ? `\nSitemap: ${SITE}/sitemap.xml\n` : ""}`);
console.log("ok" + (SITE ? " – Domain: " + SITE : " – ohne feste Domain"));
