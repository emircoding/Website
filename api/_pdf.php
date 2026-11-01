<?php
/* ==========================================================================
   Minimaler PDF-Erzeuger (ohne Zusatzbibliotheken) für die Ankauf-Anfrage:
   A4-Seiten, Texte in Helvetica, Linien/Flächen und JPEG-Fotos.
   ========================================================================== */
class AznPdf {
  const W = 595.28; // A4 in Punkt
  const H = 841.89;
  private $pages = array();   // je Seite: Inhalts-Stream
  private $pageImgs = array(); // je Seite: genutzte Bilder
  private $images = array();  // Bilddaten
  private $imgKeys = array(); // Schlüssel → Bild-Nr. (dasselbe Foto nur einmal einbetten)
  private $links = array();   // je Seite: anklickbare Bereiche → Zielseite
  private $cur = -1;

  public function addPage() {
    $this->pages[] = '';
    $this->pageImgs[] = array();
    $this->links[] = array();
    $this->cur = count($this->pages) - 1;
  }
  public function pageCount() { return count($this->pages); }
  public function current() { return $this->cur; }
  // Anklickbarer Bereich (y von oben) auf Seite $page, der zur Seite $target springt
  public function link($page, $x, $y, $w, $h, $target) {
    $this->links[$page][] = array($x, self::H - $y - $h, $x + $w, self::H - $y, $target);
  }
  public function setPage($i) { $this->cur = $i; }

  private function out($s) { $this->pages[$this->cur] .= $s . "\n"; }
  private static function n($v) { return rtrim(rtrim(sprintf('%.2F', $v), '0'), '.'); }

  // Text in Windows-1252 (für ä, ö, ü, ß, €) umwandeln und für PDF maskieren
  public static function enc($s) {
    $s = (string) $s;
    if (function_exists('mb_convert_encoding')) $t = @mb_convert_encoding($s, 'Windows-1252', 'UTF-8');
    elseif (function_exists('iconv')) $t = @iconv('UTF-8', 'Windows-1252//TRANSLIT', $s);
    else $t = preg_replace('/[^\x20-\x7E]/', '?', $s);
    return str_replace(array('\\', '(', ')', "\r", "\n"), array('\\\\', '\\(', '\\)', '', ' '), (string) $t);
  }
  // Ungefähre Textbreite (Helvetica ~0,5 em je Zeichen)
  public static function width($s, $size, $bold = false) {
    $len = function_exists('mb_strlen') ? mb_strlen($s, 'UTF-8') : strlen($s);
    return $len * $size * ($bold ? 0.56 : 0.52);
  }

  public function color($r, $g, $b, $stroke = false) {
    $this->out(self::n($r / 255) . ' ' . self::n($g / 255) . ' ' . self::n($b / 255) . ($stroke ? ' RG' : ' rg'));
  }
  public function rect($x, $y, $w, $h) { // y von oben gemessen
    $this->out(self::n($x) . ' ' . self::n(self::H - $y - $h) . ' ' . self::n($w) . ' ' . self::n($h) . ' re f');
  }
  public function line($x1, $y1, $x2, $y2, $width = 0.6) {
    $this->out(self::n($width) . ' w ' . self::n($x1) . ' ' . self::n(self::H - $y1) . ' m ' . self::n($x2) . ' ' . self::n(self::H - $y2) . ' l S');
  }
  public function text($x, $y, $s, $size = 11, $bold = false, $spacing = 0) { // y = Grundlinie von oben
    $this->out('BT /' . ($bold ? 'F2' : 'F1') . ' ' . self::n($size) . ' Tf ' . self::n($spacing) . ' Tc '
      . self::n($x) . ' ' . self::n(self::H - $y) . ' Td (' . self::enc($s) . ') Tj ET');
  }
  // Mehrzeiliger Text mit Umbruch, gibt neue y-Position zurück
  public function para($x, $y, $s, $maxW, $size = 11, $lead = 15) {
    foreach (preg_split('/\n/', (string) $s) as $p) {
      $line = '';
      foreach (preg_split('/\s+/', trim($p)) as $word) {
        $try = $line === '' ? $word : $line . ' ' . $word;
        if (self::width($try, $size) > $maxW && $line !== '') { $this->text($x, $y, $line, $size); $y += $lead; $line = $word; }
        else $line = $try;
      }
      if ($line !== '') { $this->text($x, $y, $line, $size); $y += $lead; }
    }
    return $y;
  }
  // JPEG-Bild einpassen (Seitenverhältnis bleibt), gibt die tatsächliche Fläche zurück
  public function image($img, $x, $y, $maxW, $maxH, $key = null) {
    if ($key !== null && isset($this->imgKeys[$key])) $id = $this->imgKeys[$key];
    else {
      $this->images[] = $img;
      $id = count($this->images);
      if ($key !== null) $this->imgKeys[$key] = $id;
    }
    $this->pageImgs[$this->cur][] = $id;
    $s = min($maxW / $img['w'], $maxH / $img['h']);
    $w = $img['w'] * $s; $h = $img['h'] * $s;
    $x += ($maxW - $w) / 2;
    $y += ($maxH - $h) / 2;
    $this->out('q ' . self::n($w) . ' 0 0 ' . self::n($h) . ' ' . self::n($x) . ' ' . self::n(self::H - $y - $h) . ' cm /Im' . $id . ' Do Q');
    return array('x' => $x, 'y' => $y, 'w' => $w, 'h' => $h);
  }

  public function output() {
    $objs = array();
    $objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    $objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    $objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
    $next = 5;
    $imgObj = array();
    foreach ($this->images as $i => $img) {
      $cs = $img['channels'] == 4 ? '/DeviceCMYK /Decode [1 0 1 0 1 0 1 0]' : ($img['channels'] == 1 ? '/DeviceGray' : '/DeviceRGB');
      $imgObj[$i + 1] = $next;
      $objs[$next++] = array('<< /Type /XObject /Subtype /Image /Width ' . $img['w'] . ' /Height ' . $img['h'] . ' /ColorSpace ' . $cs
        . ' /BitsPerComponent 8 /Filter /DCTDecode /Length ' . strlen($img['data']) . ' >>', $img['data']);
    }
    // Objektnummern der Seiten vorab festlegen (für Sprung-Links)
    $cIds = array(); $pIds = array();
    foreach ($this->pages as $i => $content) { $cIds[$i] = $next++; $pIds[$i] = $next++; }
    $kids = array();
    foreach ($this->pages as $i => $content) {
      $xo = '';
      foreach (array_unique($this->pageImgs[$i]) as $id) $xo .= '/Im' . $id . ' ' . $imgObj[$id] . ' 0 R ';
      $annots = '';
      foreach ($this->links[$i] as $l) {
        if (!isset($pIds[$l[4]])) continue;
        $annots .= '<< /Type /Annot /Subtype /Link /Rect [' . self::n($l[0]) . ' ' . self::n($l[1]) . ' ' . self::n($l[2]) . ' ' . self::n($l[3])
          . '] /Border [0 0 0] /Dest [' . $pIds[$l[4]] . ' 0 R /Fit] >> ';
      }
      $objs[$cIds[$i]] = array('<< /Length ' . strlen($content) . ' >>', $content);
      $objs[$pIds[$i]] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' . self::n(self::W) . ' ' . self::n(self::H) . '] '
        . '/Resources << /Font << /F1 3 0 R /F2 4 0 R >>' . ($xo ? ' /XObject << ' . $xo . '>>' : '') . ' >> /Contents ' . $cIds[$i] . ' 0 R'
        . ($annots ? ' /Annots [' . $annots . ']' : '') . ' >>';
      $kids[] = $pIds[$i] . ' 0 R';
    }
    $objs[2] = '<< /Type /Pages /Kids [' . implode(' ', $kids) . '] /Count ' . count($kids) . ' >>';
    ksort($objs);

    $pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
    $offsets = array();
    foreach ($objs as $num => $o) {
      $offsets[$num] = strlen($pdf);
      $pdf .= $num . " 0 obj\n";
      $pdf .= is_array($o) ? $o[0] . "\nstream\n" . $o[1] . "\nendstream" : $o;
      $pdf .= "\nendobj\n";
    }
    $max = max(array_keys($objs));
    $xref = strlen($pdf);
    $pdf .= "xref\n0 " . ($max + 1) . "\n0000000000 65535 f \n";
    for ($i = 1; $i <= $max; $i++) $pdf .= isset($offsets[$i]) ? sprintf("%010d 00000 n \n", $offsets[$i]) : "0000000000 65535 f \n";
    $pdf .= "trailer\n<< /Size " . ($max + 1) . " /Root 1 0 R >>\nstartxref\n" . $xref . "\n%%EOF";
    return $pdf;
  }
}
