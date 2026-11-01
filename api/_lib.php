<?php
/* ==========================================================================
   Foto-Upload beim Fahrzeugankauf – PHP-Variante für normale Webhoster
   (IONOS, Strato, All-Inkl & Co.). Wird automatisch genutzt, wenn die Seite
   nicht bei Cloudflare liegt. Läuft ab PHP 7.0, ohne Datenbank.
   Fotos landen in api/_daten/ und werden nach 60 Tagen automatisch gelöscht.
   ========================================================================== */
define('TTL_DAYS', 60);
define('TTL', TTL_DAYS * 86400);
define('MAX_BYTES', 6 * 1024 * 1024);
define('MAX_PHOTOS', 10);
define('ID_RE', '/^[A-Za-z0-9_-]{16,48}$/');

function json_out($data, $code = 200) {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  header('X-Robots-Tag: noindex');
  echo json_encode($data);
  exit;
}

function data_dir() {
  $d = __DIR__ . '/_daten';
  foreach (array('', '/fotos', '/alben') as $s) {
    if (!is_dir($d . $s)) @mkdir($d . $s, 0755, true);
  }
  return $d;
}

function random_id() {
  return rtrim(strtr(base64_encode(random_bytes(18)), '+/', '-_'), '=');
}

// Nur Anfragen von der eigenen Website annehmen
function same_origin() {
  $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : (isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '');
  $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : '';
  $o = parse_url($origin);
  if (!$o || empty($o['host'])) return false;
  $oh = $o['host'] . (isset($o['port']) ? ':' . $o['port'] : '');
  return strtolower($oh) === strtolower($host);
}

// Echte Bilddatei? (Dateisignatur prüfen)
function sniff_image($bin) {
  if (substr($bin, 0, 3) === "\xFF\xD8\xFF") return array('image/jpeg', 'jpg');
  if (substr($bin, 0, 8) === "\x89PNG\r\n\x1A\n") return array('image/png', 'png');
  if (substr($bin, 0, 4) === 'RIFF' && substr($bin, 8, 4) === 'WEBP') return array('image/webp', 'webp');
  return null;
}

function photo_path($id) {
  $files = glob(data_dir() . '/fotos/' . $id . '.*');
  return $files ? $files[0] : null;
}

// Alte Fotos/Mappen löschen (höchstens einmal pro Stunde)
function cleanup() {
  $d = data_dir();
  $mark = $d . '/.cleanup';
  if (file_exists($mark) && time() - filemtime($mark) < 3600) return;
  @touch($mark);
  foreach (array_merge(glob($d . '/fotos/*') ?: array(), glob($d . '/alben/*') ?: array()) as $f) {
    if (is_file($f) && time() - filemtime($f) > TTL) @unlink($f);
  }
}
