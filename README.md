# Automobilzentrum Nagold – Website

Moderne, animierte Händler-Website (Startseite, Fahrzeugbestand mit Filter & Detailansicht, Impressum, Datenschutz).
Reines HTML/CSS/JavaScript – **kein Build-Schritt, keine Installation nötig.** Optimiert für iPhone/iOS (Safari) und Windows (Chrome/Edge/Firefox).

## Ordnerstruktur

```
index.html            Startseite
fahrzeuge.html        Fahrzeugbestand (live von mobile.de eingebettet)
impressum.html        Impressum
datenschutz.html      Datenschutzerklärung
404.html              Fehlerseite
assets/js/config.js   ★ FIRMENDATEN (Adresse, Telefon, WhatsApp, Öffnungszeiten …)
assets/css/style.css  Design & Animationen
assets/img/           Logo, Icons, Vorschaubild
assets/fonts/         Schriften (lokal → DSGVO-konform, kein Google Fonts)
_headers              Sicherheits- & Cache-Einstellungen für Cloudflare
functions/            Foto-Upload beim Ankauf – Variante Cloudflare (Pages Functions + KV)
api/                  Foto-Upload beim Ankauf – Variante normaler Webhoster (PHP)
.htaccess             Einstellungen für normale Webhoster (Apache)
```

## 1. Auf den Windows-Laptop holen

**Variante A – ZIP (am einfachsten):**
GitHub öffnen → Repository `emircoding/Website` → grüner Button **Code** → **Download ZIP** → ZIP in den gewünschten Windows-Ordner entpacken.
Doppelklick auf `index.html` öffnet die Seite direkt im Browser.

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
   - **Project name:** frei wählbar – daraus wird die Adresse `https://PROJEKTNAME.pages.dev`
   - **Production branch:** `main`
   - **Framework preset:** `None`
   - **Build command:** *(leer lassen)*
   - **Build output directory:** `/`
5. **Save and Deploy** – fertig. Die Seite ist dauerhaft online.

Ab dann gilt: **Jede Änderung, die auf GitHub in `main` landet, ist nach ca. 30 Sekunden automatisch live.**

Die Website funktioniert unter **jedem** Projektnamen – es ist nirgends eine feste Adresse eingetragen.

**Anderen pages.dev-Namen gewünscht?** Cloudflare kann Projekte nicht umbenennen. Stattdessen: neues Pages-Projekt mit dem Wunschnamen (z. B. `automobilzentrum-nagold`) aus demselben Repository anlegen (Schritte oben) und das alte Projekt unter *Settings → Delete project* löschen.

**Eigene Domain** (z. B. `automobilzentrum-nagold.de`): im Projekt unter **Custom domains** hinzufügen. Danach die Domain in der Datei-Vorlage als feste Adresse hinterlegen lassen (für Google & Link-Vorschauen).

## 3. Firmendaten eintragen

Alle Kontaktdaten stehen zentral in **`assets/js/config.js`** (Adresse, Telefon, WhatsApp, E-Mail, USt-IdNr., Öffnungszeiten, mobile.de-Link).
Einmal dort ändern → alle Seiten, Footer, Impressum, Buttons übernehmen es automatisch.

⚠️ **Vor dem offiziellen Start:** echte Daten eintragen – vor allem `legalName` (Firmenname mit Rechtsform), `owner`, Adresse, Telefon, `vatId` und ggf. `register` (Handelsregister). Solange Platzhalter drin sind, zeigen Impressum und Datenschutz einen gelben Hinweis; er verschwindet automatisch, sobald echte Daten eingetragen sind. Leere Felder (z. B. USt-IdNr.) werden im Impressum automatisch ausgeblendet.

**Rechtliches – bereits umgesetzt:** Impressum nach § 5 DDG (ohne den seit 20.07.2025 abgeschafften OS-Plattform-Link), ausführliche Datenschutzerklärung nach Art. 13 DSGVO, Cookie-Banner mit gleichwertiger Ablehnen-Option und Widerruf über „Cookie-Einstellungen“ im Footer, mobile.de wird erst nach Einwilligung geladen, Schriften lokal (Lizenzen in `assets/fonts/`), kein Tracking.
In Cloudflare **keine „Web Analytics“ aktivieren**, ohne die Datenschutzerklärung und den Cookie-Banner anzupassen.

## 4. mobile.de verbinden (Bestand)

Die Seite **Fahrzeuge** zeigt oben das eigene Design und darunter den **kompletten Bestand direkt von mobile.de** (eingebettet).
Alles synchronisiert sich automatisch: Neue Inserate erscheinen sofort, Änderungen und Fotos werden übernommen, verkaufte Fahrzeuge verschwinden – auf der Website muss nie etwas gepflegt werden.

**Einrichtung (einmalig):**
1. Im mobile.de-Händlerbereich die **Kunden-ID** heraussuchen (Verwaltung / Stammdaten).
2. In `assets/js/config.js` eintragen: `mobileDeCustomerId: "12345678",`
3. Optional bei `mobileDeUrl` die Adresse der eigenen Händlerseite eintragen (für „In neuem Tab öffnen“).
4. Speichern und hochladen – fertig.

Eingebunden wird die offizielle Händler-Einbindung von mobile.de:
`https://home.mobile.de/home/index.html?partnerHead=false&colorTheme=default&customerId=KUNDEN-ID`
Falls mobile.de Ihnen im Händlerbereich einen anderen Einbindungs-Link nennt, diesen bei `mobileDeEmbed` in `config.js` eintragen.

Auf der Startseite gibt es dazu einen animierten Teaser „Unser Bestand – live von mobile.de“, der auf die Fahrzeugseite führt.

## 5. Foto-Upload beim Fahrzeugankauf

Im Ankauf-Formular können Kunden bis zu 10 Fotos hochladen. Die Fotos werden verkleinert, gespeichert und als **ein Link („Fotomappe“)** in die WhatsApp-/E-Mail-Nachricht eingefügt. Nach **60 Tagen** werden sie automatisch gelöscht.
Die Seite erkennt selbst, wo sie läuft – es gibt zwei gleichwertige Varianten:

**A) Bei Cloudflare Pages** (einmalig einrichten, ca. 2 Minuten, kostenlos)
1. Cloudflare → **Storage & databases** → **KV** → **Create** → Name: `fotos` → anlegen.
2. **Workers & Pages** → euer Projekt → **Settings** → **Bindings** → **Add** → **KV namespace** → Variable name `FOTOS`, Namespace `fotos` → **Save**.
3. **Deployments** → oberster Eintrag **⋯ → Retry deployment**.

**B) Bei einem normalen Webhoster mit PHP** (IONOS, Strato, All-Inkl, Hetzner …)
Nichts einrichten – einfach **alle Dateien per FTP hochladen** (inkl. Ordner `api/` und der Datei `.htaccess`). Der Upload läuft dann über `api/fotos.php`; die Fotos liegen geschützt in `api/_daten/`. Voraussetzung: PHP 7 oder neuer (bei allen gängigen Hostern Standard).

Läuft keins von beiden (z. B. lokal per Doppelklick), zeigt das Formular den Hinweis, Fotos nach dem Absenden per WhatsApp zu schicken.

## 6. Eigene Domain (z. B. automobilzentrum-nagold.de)

Zwei Möglichkeiten – die Website funktioniert bei beiden vollständig:

- **Bei Cloudflare bleiben (empfohlen, kostenlos):** Domain bei einem beliebigen Anbieter kaufen, dann in Cloudflare → Projekt → **Custom domains** → **Set up a domain**. Alles läuft weiter wie bisher.
- **Zu einem normalen Webhoster umziehen:** Alle Dateien per FTP in das Hauptverzeichnis der Domain hochladen (siehe 5B). `.htaccess` sorgt für Fehlerseite, Sicherheits-Header und kurze Adressen. HTTPS beim Hoster aktivieren.
  Danach in der **Datenschutzerklärung Abschnitt 3 (Hosting)** den neuen Anbieter statt Cloudflare eintragen (Vorlage: `datenschutz.html` bzw. Bescheid geben).

## Technik & Features

- Intro-Animation (Logo-Swoosh zeichnet sich), Auto fährt in den Hero ein (Räder drehen, Lack-Reflex)
- **Scroll-Fahrt:** Beim Scrollen startet der Motor – Licht flackert an, Auspuff raucht, Hinterräder drehen durch mit Reifenqualm (Burnout), dann zieht das Auto aus dem Bild. Zurückscrollen spult alles rückwärts. Rauch als Partikel-Animation (flüssig auch auf dem iPhone)
- Wort-für-Wort-Einblendungen, Scroll-Text-Effekt, Zähler, Parallax, Laufband, magnetische Buttons, 3D-Kipp-Effekt der Fahrzeugkarten
- Logo mit animiertem Chrom-Glanz
- Fahrzeugbestand komplett live von mobile.de eingebettet (automatische Synchronisierung)
- Anfragen direkt per WhatsApp, Telefon oder E-Mail
- „Jetzt geöffnet“-Anzeige anhand der Öffnungszeiten
- iPhone: Safe-Area (Notch/Dynamic Island), kein Auto-Zoom bei Formularen, Homescreen-Icon, flüssiges Scrollen
- Barrierearm: Tastaturbedienung, `prefers-reduced-motion` wird respektiert
- DSGVO: eigene Seite ohne Cookies und Tracking, Schriften lokal (die eingebettete mobile.de-Seite ist in der Datenschutzerklärung erwähnt)
