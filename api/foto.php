<?php
/* GET api/foto.php?id=… → gespeichertes Foto ausliefern */
require __DIR__ . '/_lib.php';

$id = isset($_GET['id']) ? (string) $_GET['id'] : '';
$path = preg_match(ID_RE, $id) ? photo_path($id) : null;
if (!$path || time() - filemtime($path) > TTL) { http_response_code(404); header('Content-Type: text/plain; charset=utf-8'); echo 'Dieses Foto ist nicht mehr verfügbar.'; exit; }
$types = array('jpg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp');
$ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
header('Content-Type: ' . (isset($types[$ext]) ? $types[$ext] : 'application/octet-stream'));
header('Content-Length: ' . filesize($path));
header('Cache-Control: private, max-age=86400');
header('X-Robots-Tag: noindex, nofollow');
header('X-Content-Type-Options: nosniff');
readfile($path);
