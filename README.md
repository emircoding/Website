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
- `index.html` – Markup für alle Sektionen und Navigation.
- `assets/styles.css` – Helles, glasiges Design-System mit Tokens, Layout-Utilities und Responsive-Tweaks.
- `assets/main.js` – Mobile Navigation, Akkordeon, Formular-Feedback, dynamisches Jahr.

## Nutzung
1. `index.html` im Browser öffnen, um die Seite lokal zu sehen.
2. Texte, Farben und Icons anpassen; dafür die Variablen oben in `assets/styles.css` nutzen.
3. CTA-Links und Formular-Handler in `assets/main.js` mit deinen Endpunkten oder OAuth-Flows verbinden; Activity-Feed und Preset-Logik lassen sich dort um echte Events/States erweitern.
4. Auf einen statischen Host wie Netlify, Vercel, GitHub Pages oder eigenen Server deployen.
