<?php
/* GET api/mappe.php?id=… → Fotomappe einer Ankauf-Anfrage (Link aus der WhatsApp-/E-Mail-Nachricht) */
require __DIR__ . '/_lib.php';

function e($s) { return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8'); }
function page($title, $body, $code = 200) {
  http_response_code($code);
  header('Content-Type: text/html; charset=utf-8');
  header('Cache-Control: private, no-store');
  header('X-Robots-Tag: noindex, nofollow');
  echo '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
    . '<meta name="robots" content="noindex, nofollow"><meta name="referrer" content="no-referrer"><title>' . e($title) . ' – Automobilzentrum Nagold</title>'
    . '<style>:root{--ink:#0b0b0c;--paper:#ecebe8;--mute:#6d6d72}*{box-sizing:border-box}body{margin:0;font-family:-apple-system,"Segoe UI",Inter,Arial,sans-serif;background:var(--paper);color:var(--ink)}'
    . 'header{background:var(--ink);color:#fff;padding:18px 20px}header b{font-size:18px;letter-spacing:-.02em}header span{display:block;color:#9b9ba0;font-size:13px;margin-top:4px}'
    . 'main{max-width:1200px;margin:0 auto;padding:20px 16px 40px}h1{font-size:26px;margin:6px 0 4px;letter-spacing:-.02em}p{color:var(--mute);margin:0 0 18px}'
    . '.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}.grid a{display:block;border-radius:8px;overflow:hidden;background:#ddd;aspect-ratio:4/3}'
    . '.grid img{width:100%;height:100%;object-fit:cover;display:block}</style></head><body><header><b>Automobilzentrum Nagold</b><span>Fahrzeugankauf · Fotomappe</span></header><main>'
    . $body . '</main></body></html>';
  exit;
}

$id = isset($_GET['id']) ? (string) $_GET['id'] : '';
$file = data_dir() . '/alben/' . $id . '.json';
if (!preg_match(ID_RE, $id) || !is_file($file)) page('Nicht gefunden', '<h1>Nicht gefunden</h1><p>Diese Fotomappe existiert nicht.</p>', 404);
if (time() - filemtime($file) > TTL) page('Nicht verfügbar', '<h1>Nicht verfügbar</h1><p>Diese Fotomappe ist nicht mehr verfügbar. Fotos werden nach ' . TTL_DAYS . ' Tagen automatisch gelöscht.</p>', 404);
$album = json_decode(file_get_contents($file), true);
$imgs = '';
foreach ($album['photos'] as $i => $p) {
  if (!photo_path($p)) continue;
  $imgs .= '<a href="foto.php?id=' . e($p) . '" target="_blank" rel="noopener"><img src="foto.php?id=' . e($p) . '" alt="Foto ' . ($i + 1) . '" loading="lazy"></a>';
}
$n = count($album['photos']);
$date = !empty($album['created']) ? date('j.n.Y', strtotime($album['created'])) : '';
page($album['title'] ?: 'Fotomappe', '<h1>' . e($album['title'] ?: 'Fahrzeugfotos') . '</h1><p>' . $n . ' Foto' . ($n === 1 ? '' : 's') . ($date ? ' · eingegangen am ' . e($date) : '') . ' · wird nach ' . TTL_DAYS . ' Tagen automatisch gelöscht. Zum Vergrößern antippen.</p><div class="grid">' . $imgs . '</div>');
