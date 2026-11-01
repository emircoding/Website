# Automobilzentrum Nagold – Website

Moderne, animierte Händler-Website (Startseite, Fahrzeugbestand mit Filter & Detailansicht, Impressum, Datenschutz).
Reines HTML/CSS/JavaScript – **kein Build-Schritt, keine Installation nötig.** Optimiert für iPhone/iOS (Safari) und Windows (Chrome/Edge/Firefox).

## Ordnerstruktur

```
index.html            Startseite
fahrzeuge.html        Fahrzeugbestand (Filter, Suche, Merkliste, Detailansicht)
impressum.html        Impressum
datenschutz.html      Datenschutzerklärung
404.html              Fehlerseite
assets/js/config.js   ★ FIRMENDATEN (Adresse, Telefon, WhatsApp, Öffnungszeiten …)
assets/js/demo-fahrzeuge.js  Demo-Bestand (bis mobile.de verbunden ist)
assets/css/style.css  Design & Animationen
assets/img/           Logo, Icons, Vorschaubild
assets/fonts/         Schriften (lokal → DSGVO-konform, kein Google Fonts)
functions/api/fahrzeuge.js   Live-Schnittstelle zu mobile.de (Cloudflare)
_headers              Sicherheits- & Cache-Einstellungen für Cloudflare
```

## 1. Auf den Windows-Laptop holen

**Variante A – ZIP (am einfachsten):**
GitHub öffnen → Repository `emircoding/Website` → grüner Button **Code** → **Download ZIP** → ZIP in den gewünschten Windows-Ordner entpacken.
Doppelklick auf `index.html` öffnet die Seite direkt im Browser (dann mit Demo-Fahrzeugen).

**Variante B – mit Git (für spätere Updates):**
```powershell
cd C:\Users\DEINNAME\Documents
git clone https://github.com/emircoding/Website.git
```

## 2. Dauerhaft & kostenlos online mit Cloudflare Pages (pages.dev)

Einmalig einrichten (geht auch vom Handy aus, ca. 3 Minuten):

1. Auf <https://dash.cloudflare.com> anmelden (kostenloses Konto).
2. **Workers & Pages** → **Create** → Reiter **Pages** → **Connect to Git**.
3. GitHub verbinden und das Repository **emircoding/Website** auswählen.
4. Einstellungen:
   - **Project name:** `automobilzentrum-nagold` → Adresse wird `https://automobilzentrum-nagold.pages.dev`
   - **Production branch:** `main`
   - **Framework preset:** `None`
   - **Build command:** *(leer lassen)*
   - **Build output directory:** `/`
5. **Save and Deploy** – fertig. Die Seite ist dauerhaft online.

Ab dann gilt: **Jede Änderung, die auf GitHub in `main` landet, ist nach ca. 30 Sekunden automatisch live.**
Eigene Domain (z. B. `automobilzentrum-nagold.de`) später unter Projekt → **Custom domains** hinzufügen.

> Wenn ein anderer Projektname gewählt wird, die Adresse in `robots.txt`, `sitemap.xml` und oben im Skript der HTML-Seiten (`canonical`/`og:url`) anpassen.

## 3. Firmendaten eintragen

Alle Kontaktdaten stehen zentral in **`assets/js/config.js`** (Adresse, Telefon, WhatsApp, E-Mail, USt-IdNr., Öffnungszeiten, mobile.de-Link).
Einmal dort ändern → alle Seiten, Footer, Impressum, Buttons übernehmen es automatisch.

⚠️ **Vor dem offiziellen Start:** echte Daten eintragen, im Impressum den gelben Hinweis entfernen und die Datenschutzerklärung prüfen lassen.

## 4. mobile.de verbinden (Live-Bestand)

Die Website ist fertig vorbereitet: Die Datei `functions/api/fahrzeuge.js` holt den Bestand über die **mobile.de Search-API**, wandelt ihn um und speichert ihn 10 Minuten zwischen. Neue Inserate auf mobile.de erscheinen dadurch automatisch auf der Website – mit Fotos, Preis, Ausstattung und Link zum Inserat.

1. Bei mobile.de (Händlerbereich bzw. Händler-Support) **API-Zugang für die Search-API** anfordern. Man erhält Benutzername + Passwort; die **Kundennummer** steht im Händlerbereich.
2. Cloudflare → Projekt → **Settings** → **Variables and Secrets** → für *Production* hinzufügen:
   | Name | Wert |
   |---|---|
   | `MOBILE_DE_USER` | API-Benutzername |
   | `MOBILE_DE_PASSWORD` | API-Passwort (Typ **Secret**) |
   | `MOBILE_DE_CUSTOMER_NUMBER` | Kundennummer |
3. Unter **Deployments** beim letzten Deployment **Retry deployment** klicken.
4. Prüfen: `https://automobilzentrum-nagold.pages.dev/api/fahrzeuge` zeigt die Fahrzeuge als JSON. Auf der Fahrzeugseite steht dann grün **„Live-Bestand von mobile.de“**.

Solange keine Zugangsdaten hinterlegt sind (oder mobile.de nicht erreichbar ist), zeigt die Seite automatisch den Demo-Bestand – nichts geht kaputt.

> Hinweis: Die Feldzuordnung in `fahrzeuge.js` folgt der öffentlichen Dokumentation der mobile.de Search-API. Sobald echte Zugangsdaten da sind, einmal mit echten Daten prüfen (v. a. Bild-URLs) und ggf. feinjustieren.

## Technik & Features

- Intro-Animation (Logo-Swoosh zeichnet sich), Auto fährt in den Hero ein (Räder drehen, Scheinwerfer blinken auf, Lack-Reflex)
- Wort-für-Wort-Einblendungen, Scroll-Text-Effekt, Zähler, Parallax, Laufband, magnetische Buttons, 3D-Kipp-Effekt der Fahrzeugkarten
- Logo mit animiertem Chrom-Glanz
- Fahrzeugsuche mit Filtern (Marke, Preis, Kraftstoff, Getriebe), Sortierung, Merkliste, Detail-Ansicht mit Bildergalerie (Wischen auf dem iPhone)
- Anfragen direkt per WhatsApp, Telefon oder E-Mail (vorausgefüllt mit Fahrzeugdaten)
- „Jetzt geöffnet“-Anzeige anhand der Öffnungszeiten
- iPhone: Safe-Area (Notch/Dynamic Island), kein Auto-Zoom bei Formularen, Homescreen-Icon, flüssiges Scrollen
- Barrierearm: Tastaturbedienung, `prefers-reduced-motion` wird respektiert
- DSGVO: keine Cookies, kein Tracking, Schriften lokal
