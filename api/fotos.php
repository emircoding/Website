<?php
/* GET  api/fotos.php → ist der Foto-Upload verfügbar?
   POST api/fotos.php → ein Foto speichern (Body = Bilddatei), Antwort { id } */
require __DIR__ . '/_lib.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  json_out(array('enabled' => is_writable(data_dir() . '/fotos')));
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(array('error' => 'method'), 405);
if (!same_origin()) json_out(array('error' => 'forbidden'), 403);

$len = isset($_SERVER['CONTENT_LENGTH']) ? (int) $_SERVER['CONTENT_LENGTH'] : 0;
if ($len > MAX_BYTES) json_out(array('error' => 'too_large'), 413);
$bin = file_get_contents('php://input', false, null, 0, MAX_BYTES + 1);
if ($bin === false || strlen($bin) < 100) json_out(array('error' => 'bad_request'), 400);
if (strlen($bin) > MAX_BYTES) json_out(array('error' => 'too_large'), 413);
$type = sniff_image($bin);
if (!$type) json_out(array('error' => 'unsupported_type'), 415);

$id = random_id();
if (file_put_contents(data_dir() . '/fotos/' . $id . '.' . $type[1], $bin) === false) json_out(array('error' => 'storage'), 500);
cleanup();
json_out(array('id' => $id));
