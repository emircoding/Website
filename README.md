# Atria Automations – Meetings ohne Ping-Pong

Eine sachliche, responsive Website für eine KI-Automationsplattform, die Meetings verschickt, E-Mails sendet und Preise prüft – mit echtem Backend und klarer Oberfläche.

## Features
- Ruhiger Hero mit klarer Kernbotschaft und Call-to-Action „Neues Meeting erstellen“.
- Drei Nutzenkarten, ein kompakter 3-Schritte-Ablauf sowie Trust- und Sicherheitsabschnitt für Geschäfts-Nutzer.
- Kontakt-/Automation-Formular, das echte Requests an `/api/task` sendet, plus Live-Statusliste aus `/api/tasks`.
- Einheitliches Design-System mit wenigen Akzentfarben (Dunkelblau/Violett), begrenzter Zeilenlänge und viel Weißraum.

## Struktur
- `index.html` – Markup für Navigation, Hero, Nutzen, Ablauf, Funktionen, Trust, Formular, Status und Preis-CTA.
- `assets/styles.css` – Reduziertes Design mit klarer Typografie, einheitlichen Karten und Buttons.
- `assets/main.js` – Mobile Navigation, Formular-Submit via `/api/task`, Ergebnisanzeige und periodisches `/api/tasks`-Polling.
- `server.js` – Node.js-Server mit REST-Endpunkten, Persistenz, Validierung und Integrationen.
- `data/tasks.json` – Persistenter Task-Speicher (automatisch erstellt).

## Backend & Endpunkte
- `POST /api/task` – nimmt `description`, optional `type` (`calendarCreate`, `emailSend`, `priceCheck`, `routine`) und `payload` entgegen, validiert Eingaben und liefert Status/Ergebnis zurück.
- `GET /api/tasks` – liefert alle gespeicherten Tasks (neueste zuerst) für Verlauf und UI-Status.
- Statische Auslieferung von `index.html` und `assets/*` über denselben Server.

### Integrationen
- **Kalender**: Google Calendar via Service-Account. Env: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` (mit `\n`), `GOOGLE_CALENDAR_ID`.
- **E-Mail**: SMTP-Server. Env: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, optional `SMTP_FROM`, `DEFAULT_MAIL_TO`, `SMTP_SECURE=true` (für Port 465).
- **Preis-Check**: Standard `https://dummyjson.com/products/search?q=<query>`. Alternativ `PRICE_FEED_URL` setzen.

## Nutzung
1. Node 18+ verwenden (wegen nativem `fetch`).
2. Environment für Kalender, Mail und Preisfeed setzen.
3. Server starten: `node server.js` (Standard-Port 3000).
4. Browser öffnen: `http://localhost:3000`. Das Formular unter „Meeting erstellen“ sendet echte Requests an `/api/task`; der Statusbereich liest `/api/tasks` und zeigt Resultate/Fehler an.
5. Tasks werden in `data/tasks.json` persistiert. Ungültiges JSON im Request wird abgewiesen, defekte Task-Dateien werden geleert und neu angelegt.
