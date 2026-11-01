/* ==========================================================================
   FIRMENDATEN – HIER ZENTRAL ANPASSEN
   Alle Seiten (Startseite, Fahrzeuge, Impressum, Footer …) lesen ihre
   Kontaktdaten aus dieser Datei. Einfach die Werte ersetzen, speichern,
   hochladen – fertig.
   ========================================================================== */
window.AZN_CONFIG = {
  name: "Automobilzentrum Nagold",
  legalName: "",                              // Impressum: vollständiger Firmenname inkl. Rechtsform, z. B. "Automobilzentrum Nagold GmbH" oder "Max Mustermann e.K." (leer = name)
  owner: "Inhaber: Max Mustermann",          // Impressum: "Inhaber: …" (Einzelunternehmen) bzw. "Geschäftsführer: …" (GmbH)
  street: "Musterstraße 1",                   // TODO: echte Adresse
  zip: "72202",
  city: "Nagold",

  phone: "+4974520000000",                    // für Klick-zum-Anrufen (ohne Leerzeichen)
  phoneDisplay: "07452 / 000 000",            // so wird die Nummer angezeigt
  whatsapp: "4917000000000",                  // WhatsApp-Nummer ohne + und ohne 0 am Anfang
  email: "info@automobilzentrum-nagold.de",

  vatId: "",                                  // Impressum: USt-IdNr. (leer lassen, wenn keine vorhanden)
  register: "",                               // Impressum: z. B. "Amtsgericht Stuttgart HRB 000000" (leer lassen, wenn nicht vorhanden)

  hours: [
    ["Mo – Fr", "09:00 – 18:00"],
    ["Samstag", "10:00 – 14:00"],
    ["Sonntag", "geschlossen"]
  ],
  // Für die Anzeige „Jetzt geöffnet / geschlossen“ (leer = geschlossen)
  schedule: { mo: "09:00-18:00", di: "09:00-18:00", mi: "09:00-18:00", do: "09:00-18:00", fr: "09:00-18:00", sa: "10:00-14:00", so: "" },

  // ===== mobile.de =====
  // Ihre Kunden-ID bei mobile.de (steht im mobile.de-Händlerbereich, z. B. "12345678").
  // Sobald sie hier steht, zeigt die Seite „Fahrzeuge“ automatisch den kompletten
  // Bestand von mobile.de – neue Fahrzeuge erscheinen sofort, verkaufte verschwinden.
  mobileDeCustomerId: "",

  // Optional: Adresse Ihrer Händlerseite auf mobile.de (für „In neuem Tab öffnen“),
  // z. B. "https://home.mobile.de/AUTOMOBILZENTRUMNAGOLD". Leer = wird aus der Kunden-ID gebildet.
  mobileDeUrl: "",

  // Optional (nur für Profis): komplett eigene Einbettungs-Adresse statt der Standard-Adresse.
  mobileDeEmbed: ""
};
