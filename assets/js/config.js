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
  street: "Ferdinand-Porsche-Str. 20",
  zip: "72202",
  city: "Nagold",

  phone: "+4915901484988",                    // für Klick-zum-Anrufen (ohne Leerzeichen)
  phoneDisplay: "01590 1484988",              // so wird die Nummer angezeigt
  whatsapp: "4915901484988",                  // WhatsApp-Nummer ohne + und ohne 0 am Anfang
  email: "emir742001@gmail.com",               // TEST – danach zurück auf automobilzentrum.nagold@gmail.com

  vatId: "",                                  // Impressum: USt-IdNr. (leer lassen, wenn keine vorhanden)
  register: "",                               // Impressum: z. B. "Amtsgericht Stuttgart HRB 000000" (leer lassen, wenn nicht vorhanden)

  hours: [
    ["Mo – Fr", "08:00 – 18:00"],
    ["Samstag", "09:00 – 17:00"],
    ["Sonntag", "geschlossen"]
  ],
  // Für die Anzeige „Jetzt geöffnet / geschlossen“ (leer = geschlossen)
  schedule: { mo: "08:00-18:00", di: "08:00-18:00", mi: "08:00-18:00", do: "08:00-18:00", fr: "08:00-18:00", sa: "09:00-17:00", so: "" },

  // ===== mobile.de =====
  // Ihre Kunden-ID bei mobile.de (steht im mobile.de-Händlerbereich, z. B. "12345678").
  // Sobald sie hier steht, zeigt die Seite „Fahrzeuge“ automatisch den kompletten
  // Bestand von mobile.de – neue Fahrzeuge erscheinen sofort, verkaufte verschwinden.
  mobileDeCustomerId: "",

  // Optional: Adresse Ihrer Händlerseite auf mobile.de (für „In neuem Tab öffnen“),
  // z. B. "https://home.mobile.de/AUTOMOBILZENTRUMNAGOLD". Leer = wird aus der Kunden-ID gebildet.
  mobileDeUrl: "",

  // Optional (nur für Profis): komplett eigene Einbettungs-Adresse statt der Standard-Adresse.
  mobileDeEmbed: "",

  // ===== Google-Bewertungen =====
  // Werte aus dem Google-Unternehmensprofil übernehmen. Solange rating 0 ist,
  // wird der Bewertungsbereich auf der Startseite ausgeblendet.
  google: {
    rating: 0,          // Durchschnitt, z. B. 4.9
    count: 0,           // Anzahl aller Bewertungen auf Google, z. B. 87
    profileUrl: "",     // Link zum Google-Profil (Google Maps → Teilen → Link kopieren). Leer = Google-Maps-Suche
    reviewUrl: "",      // Link „Bewertung schreiben“ (Google-Unternehmensprofil → „Bewertungen erhalten“). Leer = profileUrl
    reviews: [
      // Ausgewählte echte Bewertungen, z. B.:
      // { name: "Max M.", stars: 5, date: "Oktober 2026", text: "Sehr freundliche Beratung …" },
    ]
  }
};
