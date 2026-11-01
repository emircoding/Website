/* ==========================================================================
   FIRMENDATEN – HIER ZENTRAL ANPASSEN
   Alle Seiten (Startseite, Fahrzeuge, Impressum, Footer …) lesen ihre
   Kontaktdaten aus dieser Datei. Einfach die Werte ersetzen, speichern,
   hochladen – fertig.
   ========================================================================== */
window.AZN_CONFIG = {
  name: "Automobilzentrum Nagold",
  owner: "Inhaber: Max Mustermann",          // Impressum: Inhaber / Geschäftsführer
  street: "Musterstraße 1",                   // TODO: echte Adresse
  zip: "72202",
  city: "Nagold",

  phone: "+4974520000000",                    // für Klick-zum-Anrufen (ohne Leerzeichen)
  phoneDisplay: "07452 / 000 000",            // so wird die Nummer angezeigt
  whatsapp: "4917000000000",                  // WhatsApp-Nummer ohne + und ohne 0 am Anfang
  email: "info@automobilzentrum-nagold.de",

  vatId: "DE000000000",                       // Impressum: USt-IdNr.
  register: "",                               // Impressum: z. B. "Amtsgericht Stuttgart HRB 000000" (leer lassen, wenn nicht vorhanden)

  hours: [
    ["Mo – Fr", "09:00 – 18:00"],
    ["Samstag", "10:00 – 14:00"],
    ["Sonntag", "geschlossen"]
  ],
  // Für die Anzeige „Jetzt geöffnet / geschlossen“ (leer = geschlossen)
  schedule: { mo: "09:00-18:00", di: "09:00-18:00", mi: "09:00-18:00", do: "09:00-18:00", fr: "09:00-18:00", sa: "10:00-14:00", so: "" },

  // Link zur Händlerseite auf mobile.de (Button „Gesamter Bestand auf mobile.de“)
  mobileDeUrl: "https://www.mobile.de/",

  // Optional: offizielles mobile.de-Logo als Datei (z. B. "assets/img/mobile-de.svg").
  // Leer lassen = Schriftzug „mobile.de“ als Platzhalter bei Fahrzeugen ohne Fotos.
  mobileDeLogo: "",

  // Live-Bestand: wird automatisch von mobile.de geladen, sobald in Cloudflare
  // die Zugangsdaten hinterlegt sind (siehe README.md). Bis dahin: Demo-Fahrzeuge.
  inventoryApi: "/api/fahrzeuge"
};
