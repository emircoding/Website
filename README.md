# Atria Automations – Alltagshelfer

Eine moderne, responsive Website für eine KI-Automationsplattform, die wie ein Full-Stack-Entwickler im Hintergrund arbeitet und deinen Alltag ohne Kosten erleichtert. Die Seite präsentiert eine Next.js/Tailwind-inspirierte Oberfläche mit viel Weißraum, Glass-Effekten und klaren Komponenten.

## Features
- Hero, Fähigkeiten, Pipeline, Task-Modell, Login & Sicherheit, Erlebnis, Workflows, Alltagsroutinen (statt Pricing), FAQ und Kontakt – alles einsatzbereit ohne Verkaufsfokus.
- Neue Sektionen für Personalisierung und Live-Logging, damit Tagesmodi (Ruhiger Start, Fokusphase, Unterwegs, Abendruhe) UI- und Integrationszustände aktiv umschalten.
- Echtzeit-Integrationsübersicht für Kalender, Mail, WhatsApp, Slack, Notion, Telefonie mit Statuschips im iOS-inspirierten Glasdesign.
- Mobile Navigation mit Toggle, Sticky Header, FAQ-Akkordeon, Formular-Feedback plus dynamischem Aktivitätsfeed, der Audit-Events im Frontend simuliert.
- Design-Tokens (Farben, Radien, Schatten) und responsive Grids für konsistentes Layout auf iOS, Windows und im Web.
- Copy fokussiert auf Natural-Language-Input, Task-Modell, Entscheidungs-Engine, Integrationsadapter, OAuth Login und praktische Routinen für Ruhe im Alltag.

## Struktur
- `index.html` – Markup für alle Sektionen und Navigation inklusive Task-Formular und Statusliste.
- `assets/styles.css` – Helles, glasiges Design-System mit neuen Statuschips, Tasklisten und Preis-Layouts.
- `assets/main.js` – Mobile Navigation, Akkordeon, Task-Submit mit `/api/task`, Live-Task-Feed via `/api/tasks`.
- `server.js` – Node.js-Server mit REST-Endpunkten, Persistenz und Integrationen.
- `data/tasks.json` – Lokale Datenspeicherung aller Tasks (wird automatisch erstellt).

## Backend & Endpunkte
- `POST /api/task` – nimmt `description`, optional `type` (`calendarCreate`, `emailSend`, `priceCheck`, `routine`) und `payload` entgegen. Bestimmt Intent, legt Task an, verarbeitet ihn und liefert Status/Ergebnis zurück.
- `GET /api/tasks` – liefert alle gespeicherten Tasks (neueste zuerst) für Verlauf, UI-Status und Live-Logging.
- Statische Auslieferung von `index.html` und `assets/*` über denselben Server.

### Integrationen
- **Kalender**: Service-Account für Google Calendar. Environment-Variablen: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` (mit `\n` Zeilenumbrüchen), `GOOGLE_CALENDAR_ID`.
- **E-Mail**: SMTP-Server mit Login. Variablen: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, optional `SMTP_FROM`, `DEFAULT_MAIL_TO`, `SMTP_SECURE=true` (für Port 465).
- **Preis-Check**: Standardmäßig `https://dummyjson.com/products/search?q=<query>`. Alternativ `PRICE_FEED_URL` setzen.

## Nutzung
1. Abhängigkeiten sind rein native Node.js-Module – kein zusätzliches `npm install` nötig.
2. Environment setzen (z. B. in einer `.env` oder direkt im Shell-Export) für Kalender, Mail und Preisfeed.
3. Server starten: `node server.js` (Standard-Port 3000).
4. Browser öffnen: `http://localhost:3000`. Das Formular unter „Automation starten“ sendet echte Requests an `/api/task`; der Statusbereich liest `/api/tasks` und zeigt Resultate/Fehler an.
5. Tasks werden in `data/tasks.json` persistiert und bleiben zwischen Neustarts erhalten.
