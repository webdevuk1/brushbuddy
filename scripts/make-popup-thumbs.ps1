Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$out = Join-Path $root "assets\library\thumbs\64"
New-Item -ItemType Directory -Force -Path $out | Out-Null
$map = @{
  "04-clay-brushing.png" = "brushing.png"
  "06-closeup.png" = "closeup.png"
  "08-night.png" = "night.png"
  "09-morning.png" = "morning.png"
  "12-wink.png" = "wink.png"
}
function Save-Thumb($srcPath, $destPath, $size) {
  $src = [System.Drawing.Bitmap]::FromFile($srcPath)
  $thumb = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($thumb)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($src, 0, 0, $size, $size)
  $g.Dispose()
  $src.Dispose()
  $thumb.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $thumb.Dispose()
}

foreach ($entry in $map.GetEnumerator()) {
  $srcPath = Join-Path $root "assets\library\$($entry.Key)"
  Save-Thumb $srcPath (Join-Path $out $entry.Value) 64
}

$overlay = Join-Path $root "assets\library\thumbs\128"
New-Item -ItemType Directory -Force -Path $overlay | Out-Null
foreach ($entry in $map.GetEnumerator()) {
  $srcPath = Join-Path $root "assets\library\$($entry.Key)"
  Save-Thumb $srcPath (Join-Path $overlay $entry.Value) 128
}
Write-Output "popup + overlay thumbs ok"
