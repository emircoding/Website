<?php
/* ==========================================================================
   Formular-Versand direkt per E-Mail
   GET  api/anfrage.php → ist der Versand verfügbar?
   POST api/anfrage.php → Anfrage senden
        art=kontakt : Kontaktformular (E-Mail als Text)
        art=ankauf  : Fahrzeugankauf (E-Mail + PDF mit allen Daten und Fotos)
   Empfänger = E-Mail-Adresse aus assets/js/config.js
   Fotos werden NICHT auf dem Webspace gespeichert – sie gehen nur im PDF per E-Mail raus.
   ========================================================================== */
require __DIR__ . '/_lib.php';
require __DIR__ . '/_pdf.php';
date_default_timezone_set('Europe/Berlin');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  json_out(array('enabled' => function_exists('mail') && config_email() !== ''));
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(array('error' => 'method'), 405);
if (!same_origin()) json_out(array('error' => 'forbidden'), 403);
if (empty($_POST) && !empty($_SERVER['CONTENT_LENGTH'])) json_out(array('error' => 'too_large'), 413);
if (!empty($_POST['website_url'])) json_out(array('ok' => true)); // Spam-Falle (unsichtbares Feld)
if (rate_limited()) json_out(array('error' => 'rate_limited'), 429);
$to = config_email();
if (!$to) json_out(array('error' => 'not_configured'), 500);

$P = function ($k, $max = 200) { return isset($_POST[$k]) ? one_line($_POST[$k], $max) : ''; };
$art = (isset($_POST['art']) && $_POST['art'] === 'ankauf') ? 'ankauf' : 'kontakt';
$name = $P('name', 120); $phone = $P('phone', 60); $email = $P('email', 160);
$message = isset($_POST['message']) ? clean($_POST['message'], 3000) : '';
if (!$name) json_out(array('error' => 'missing', 'field' => 'name'), 422);
if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) json_out(array('error' => 'invalid', 'field' => 'email'), 422);
$stamp = date('d.m.Y, H:i') . ' Uhr';

/* ---------------- Kontaktformular ---------------- */
if ($art === 'kontakt') {
  $topic = $P('topic', 60) ?: 'Anfrage';
  if (!$message) json_out(array('error' => 'missing', 'field' => 'message'), 422);
  if (!$phone && !$email) json_out(array('error' => 'missing', 'field' => 'phone'), 422);
  $car = $P('car', 200);
  $text = "Neue Anfrage über die Website ($stamp)\n\n"
    . "Anliegen: $topic\nName: $name\nTelefon: " . ($phone ?: '–') . "\nE-Mail: " . ($email ?: '–') . "\n"
    . ($car ? "Fahrzeug: $car\n" : '') . "\n$message\n";
  $ok = send_mail($to, "Anfrage über Website: $topic – $name", $text, $email);
  json_out($ok ? array('ok' => true) : array('error' => 'mail_failed'), $ok ? 200 : 500);
}

/* ---------------- Fahrzeugankauf ---------------- */
$fields = array(
  array('make', 'Marke'), array('model', 'Modell'), array('type', 'Fahrzeugtyp'), array('doors', 'Anzahl der Türen'),
  array('reg', 'Erstzulassung'), array('km', 'Kilometerstand'), array('fuel', 'Kraftstoffart'), array('gear', 'Getriebe'),
  array('price', 'Preis (Vorstellung)')
);
$v = array();
foreach ($fields as $f) $v[$f[0]] = $P($f[0], 80);
foreach (array('make', 'model', 'type', 'doors', 'reg', 'km', 'fuel', 'gear') as $req) {
  if ($v[$req] === '') json_out(array('error' => 'missing', 'field' => $req), 422);
}
if (!$phone) json_out(array('error' => 'missing', 'field' => 'phone'), 422);
if ($v['km'] !== '' && preg_match('/^\d+$/', str_replace(array('.', ' '), '', $v['km']))) $v['km'] = number_format((int) str_replace(array('.', ' '), '', $v['km']), 0, ',', '.') . ' km';
if ($v['price'] !== '' && preg_match('/^\d+$/', str_replace(array('.', ' ', '€'), '', $v['price']))) $v['price'] = number_format((int) str_replace(array('.', ' ', '€'), '', $v['price']), 0, ',', '.') . ' €';

// Fotos einsammeln
$photos = array();
if (!empty($_FILES['fotos']) && is_array($_FILES['fotos']['tmp_name'])) {
  foreach ($_FILES['fotos']['tmp_name'] as $i => $tmp) {
    if (count($photos) >= MAX_PHOTOS) break;
    if (!empty($_FILES['fotos']['error'][$i]) || !$tmp) continue;
    $img = photo_jpeg($tmp);
    if ($img) $photos[] = $img;
  }
}

// ---------- PDF gestalten ----------
$pdf = new AznPdf();
$L = 42; $R = AznPdf::W - 42; $CW = $R - $L;
$pdf->addPage();
// Kopfbereich
$pdf->color(11, 11, 12); $pdf->rect(0, 0, AznPdf::W, 92);
$pdf->color(255, 255, 255); $pdf->text($L, 44, 'Automobilzentrum', 21, true, -0.3);
$pdf->color(150, 150, 156); $pdf->text($L, 62, 'NAGOLD', 8, true, 4);
$pdf->color(200, 200, 204);
$lbl = 'FAHRZEUGANKAUF'; $pdf->text($R - AznPdf::width($lbl, 8, true) - 26, 44, $lbl, 8, true, 2);
$d = date('d.m.Y'); $pdf->color(255, 255, 255); $pdf->text($R - AznPdf::width($d, 11), 62, $d, 11);
// Titel
$y = 140;
$pdf->color(11, 11, 12); $pdf->text($L, $y, 'Bewertungsanfrage', 26, true, -0.5);
$y += 24;
$pdf->color(109, 109, 114); $pdf->text($L, $y, $v['make'] . ' ' . $v['model'], 14);
$section = function ($title, $y) use ($pdf, $L, $R) {
  $pdf->color(11, 11, 12); $pdf->text($L, $y, $title, 8.5, true, 2.2);
  $pdf->color(216, 215, 211, true); $pdf->line($L, $y + 8, $R, $y + 8);
  return $y + 30;
};
$cell = function ($x, $y, $label, $value) use ($pdf) {
  $pdf->color(130, 130, 136); $pdf->text($x, $y, strtoupper_de($label), 7.5, true, 1.2);
  $pdf->color(11, 11, 12); $pdf->text($x, $y + 16, $value !== '' ? $value : '–', 12.5, true);
};
// Fahrzeug
$y = $section('FAHRZEUG', $y + 40);
$colX = array($L, $L + $CW / 2 + 10);
$i = 0;
foreach ($fields as $f) {
  if ($f[0] === 'price') continue;
  $cell($colX[$i % 2], $y, $f[1], $v[$f[0]]);
  if ($i % 2) $y += 42;
  $i++;
}
$cell($L, $y, 'Preis (Vorstellung des Kunden)', $v['price'] !== '' ? $v['price'] : 'keine Angabe');
$y += 52;
// Kontakt
$y = $section('KONTAKT', $y);
$cell($colX[0], $y, 'Name', $name);
$cell($colX[1], $y, 'Telefon', $phone);
$y += 42;
$cell($colX[0], $y, 'E-Mail', $email !== '' ? $email : '–');
$y += 52;
// Anmerkungen
if ($message !== '') {
  $y = $section('ANMERKUNGEN', $y);
  $pdf->color(40, 40, 44);
  $y = $pdf->para($L, $y, $message, $CW, 11, 15) + 18;
}
// Fotos (2 Spalten)
if ($photos) {
  $gap = 12; $pw = ($CW - $gap) / 2; $ph = $pw * 0.75;
  $bottom = AznPdf::H - 60;
  if ($y + 30 + $ph > $bottom) { $pdf->addPage(); $y = 60; }
  $y = $section('FOTOS (' . count($photos) . ')', $y);
  foreach ($photos as $k => $img) {
    $col = $k % 2;
    if ($col === 0 && $y + $ph > $bottom) { $pdf->addPage(); $y = 60; }
    $pdf->color(236, 235, 232); $pdf->rect($colX[0] + $col * ($pw + $gap), $y, $pw, $ph);
    $pdf->image($img, $L + $col * ($pw + $gap), $y, $pw, $ph);
    if ($col === 1 || $k === count($photos) - 1) $y += $ph + $gap;
  }
}
// Fußzeile auf jeder Seite
$n = $pdf->pageCount();
for ($p = 0; $p < $n; $p++) {
  $pdf->setPage($p);
  $pdf->color(216, 215, 211, true); $pdf->line($L, AznPdf::H - 40, $R, AznPdf::H - 40, 0.5);
  $pdf->color(130, 130, 136);
  $pdf->text($L, AznPdf::H - 26, 'Anfrage über die Website · eingegangen am ' . $stamp, 8);
  $pg = 'Seite ' . ($p + 1) . ' von ' . $n; $pdf->text($R - AznPdf::width($pg, 8), AznPdf::H - 26, $pg, 8);
}
$data = $pdf->output();

$slug = function ($s) { $s = strtr($s, array('ä' => 'ae', 'ö' => 'oe', 'ü' => 'ue', 'Ä' => 'Ae', 'Ö' => 'Oe', 'Ü' => 'Ue', 'ß' => 'ss')); return trim(preg_replace('/[^A-Za-z0-9]+/', '-', $s), '-'); };
$file = 'Ankauf_' . $slug($v['make'] . '_' . $v['model']) . '_' . date('Y-m-d_H-i') . '.pdf';

$text = "Neue Fahrzeugankauf-Anfrage über die Website ($stamp)\n\n";
foreach ($fields as $f) $text .= $f[1] . ': ' . ($v[$f[0]] !== '' ? $v[$f[0]] : '–') . "\n";
$text .= "\nName: $name\nTelefon: $phone\nE-Mail: " . ($email ?: '–') . "\n";
if ($message !== '') $text .= "\nAnmerkungen:\n$message\n";
$text .= "\nFotos: " . count($photos) . "\nAlle Angaben und Fotos stehen im angehängten PDF ($file).\n";

$ok = send_mail($to, 'Fahrzeugankauf: ' . $v['make'] . ' ' . $v['model'] . ' – ' . $name, $text, $email, array('name' => $file, 'data' => $data));
json_out($ok ? array('ok' => true, 'photos' => count($photos)) : array('error' => 'mail_failed'), $ok ? 200 : 500);

function strtoupper_de($s) { return function_exists('mb_strtoupper') ? mb_strtoupper($s, 'UTF-8') : strtoupper($s); }
