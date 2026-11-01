<?php
/* POST api/album.php { id, photos: [fotoId, …], title } → Fotomappe speichern */
require __DIR__ . '/_lib.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(array('error' => 'method'), 405);
if (!same_origin()) json_out(array('error' => 'forbidden'), 403);
$body = json_decode(file_get_contents('php://input', false, null, 0, 20000), true);
$id = isset($body['id']) ? (string) $body['id'] : '';
$photos = (isset($body['photos']) && is_array($body['photos'])) ? array_values(array_map('strval', $body['photos'])) : array();
if (!preg_match(ID_RE, $id) || !$photos || count($photos) > MAX_PHOTOS) json_out(array('error' => 'bad_request'), 400);
foreach ($photos as $p) {
  if (!preg_match(ID_RE, $p) || !photo_path($p)) json_out(array('error' => 'bad_request'), 400);
}
$title = isset($body['title']) ? (function_exists('mb_substr') ? mb_substr((string) $body['title'], 0, 120) : substr((string) $body['title'], 0, 120)) : '';
file_put_contents(data_dir() . '/alben/' . $id . '.json', json_encode(array('photos' => $photos, 'title' => $title, 'created' => date('c'))));
json_out(array('ok' => true));
