<?php
/* ==========================================================================
   Gemeinsame Helfer für die Formulare (PHP, ab Version 7.0, ohne Datenbank).
   Läuft bei normalen Webhostern wie IONOS, Strato, All-Inkl, Hetzner …
   ========================================================================== */

// Absender der E-Mails. Leer = automatisch "website@<eure-domain>".
// Tipp: Beim Hoster ein Postfach/Alias mit dieser Adresse anlegen, dann landen die Mails nicht im Spam.
define('MAIL_FROM', '');
define('MAX_PHOTOS', 10);
define('MAX_PHOTO_BYTES', 8 * 1024 * 1024);

function json_out($data, $code = 200) {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  header('X-Robots-Tag: noindex');
  echo json_encode($data);
  exit;
}

// Empfänger-Adresse direkt aus assets/js/config.js lesen (eine Stelle für alles)
function config_email() {
  $cfg = @file_get_contents(__DIR__ . '/../assets/js/config.js');
  if ($cfg && preg_match('/\bemail\s*:\s*"([^"]+)"/', $cfg, $m) && filter_var($m[1], FILTER_VALIDATE_EMAIL)) return $m[1];
  return '';
}

function site_host() {
  $h = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost';
  $h = preg_replace('/:\d+$/', '', strtolower($h));
  return preg_replace('/^www\./', '', $h);
}

function mail_from() {
  if (MAIL_FROM && filter_var(MAIL_FROM, FILTER_VALIDATE_EMAIL)) return MAIL_FROM;
  return 'website@' . site_host();
}

// Nur Anfragen von der eigenen Website annehmen
function same_origin() {
  $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : (isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '');
  $host = isset($_SERVER['HTTP_HOST']) ? strtolower($_SERVER['HTTP_HOST']) : '';
  $o = parse_url($origin);
  if (!$o || empty($o['host'])) return false;
  return strtolower($o['host'] . (isset($o['port']) ? ':' . $o['port'] : '')) === $host;
}

// Einfacher Schutz gegen Massen-Anfragen: max. 8 pro Stunde und IP (IP wird nur gehasht gespeichert)
function rate_limited() {
  $dir = __DIR__ . '/_daten';
  if (!is_dir($dir)) @mkdir($dir, 0755, true);
  $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '';
  $f = $dir . '/rl_' . substr(hash('sha256', $ip . __DIR__), 0, 24);
  $now = time();
  $hits = array();
  if (is_file($f)) foreach (explode(',', (string) @file_get_contents($f)) as $t) if ((int) $t > $now - 3600) $hits[] = (int) $t;
  if (count($hits) >= 8) return true;
  $hits[] = $now;
  @file_put_contents($f, implode(',', $hits));
  foreach (glob($dir . '/rl_*') ?: array() as $old) if (is_file($old) && $now - filemtime($old) > 3600) @unlink($old);
  return false;
}

function clean($s, $max = 200) {
  $s = trim(str_replace(array("\r", "\0"), '', (string) $s));
  return function_exists('mb_substr') ? mb_substr($s, 0, $max, 'UTF-8') : substr($s, 0, $max);
}
function one_line($s, $max = 200) { return preg_replace('/\s+/', ' ', clean($s, $max)); }

// Bild prüfen und als JPEG-Daten liefern (für das PDF)
function photo_jpeg($tmp) {
  if (!is_uploaded_file($tmp) && !is_file($tmp)) return null;
  if (filesize($tmp) > MAX_PHOTO_BYTES) return null;
  $bin = file_get_contents($tmp);
  $info = @getimagesizefromstring($bin);
  if (!$info) return null;
  if ($info[2] === IMAGETYPE_JPEG) {
    return array('data' => $bin, 'w' => $info[0], 'h' => $info[1], 'channels' => isset($info['channels']) ? $info['channels'] : 3);
  }
  // PNG/WebP/GIF → JPEG umwandeln (falls GD vorhanden)
  if (function_exists('imagecreatefromstring') && ($im = @imagecreatefromstring($bin))) {
    $w = imagesx($im); $h = imagesy($im);
    $bg = imagecreatetruecolor($w, $h);
    imagefill($bg, 0, 0, imagecolorallocate($bg, 255, 255, 255));
    imagecopy($bg, $im, 0, 0, 0, 0, $w, $h);
    ob_start(); imagejpeg($bg, null, 82); $jpg = ob_get_clean();
    imagedestroy($im); imagedestroy($bg);
    return array('data' => $jpg, 'w' => $w, 'h' => $h, 'channels' => 3);
  }
  return null;
}

// E-Mail mit optionalen Anhängen über die PHP-Funktion mail() des Hosters senden
// $attachments = [ ['name' => 'datei.pdf', 'type' => 'application/pdf', 'data' => …], … ]
function send_mail($to, $subject, $text, $replyTo = '', $attachments = array()) {
  $from = mail_from();
  $enc = function ($s) { return '=?UTF-8?B?' . base64_encode($s) . '?='; };
  $headers = array();
  $headers[] = 'From: ' . $enc('Website Automobilzentrum Nagold') . ' <' . $from . '>';
  if ($replyTo && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) $headers[] = 'Reply-To: ' . $replyTo;
  $headers[] = 'MIME-Version: 1.0';
  $headers[] = 'X-Mailer: Automobilzentrum-Website';
  if ($attachments) {
    $b = 'azn_' . bin2hex(random_bytes(12));
    $headers[] = 'Content-Type: multipart/mixed; boundary="' . $b . '"';
    $body = "--$b\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($text));
    foreach ($attachments as $a) {
      $body .= "--$b\r\nContent-Type: " . $a['type'] . "; name=\"" . $a['name'] . "\"\r\nContent-Transfer-Encoding: base64\r\n"
        . "Content-Disposition: attachment; filename=\"" . $a['name'] . "\"\r\n\r\n" . chunk_split(base64_encode($a['data']));
    }
    $body .= "--$b--\r\n";
  } else {
    $headers[] = 'Content-Type: text/plain; charset=UTF-8';
    $headers[] = 'Content-Transfer-Encoding: base64';
    $body = chunk_split(base64_encode($text));
  }
  $h = implode("\r\n", $headers);
  $ok = @mail($to, $enc($subject), $body, $h, '-f' . $from);
  if (!$ok) $ok = @mail($to, $enc($subject), $body, $h);
  return $ok;
}
