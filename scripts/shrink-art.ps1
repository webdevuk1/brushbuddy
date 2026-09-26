Add-Type -AssemblyName System.Drawing

$lib = Join-Path (Split-Path $PSScriptRoot -Parent) "assets\library"
$archive = Join-Path (Split-Path $PSScriptRoot -Parent) "assets\archive"
New-Item -ItemType Directory -Force -Path $archive | Out-Null

Get-ChildItem $lib -File -Filter *.png | ForEach-Object {
  $kept = Join-Path $archive $_.Name
  if (-not (Test-Path $kept)) { Copy-Item $_.FullName $kept }
  $src = [System.Drawing.Bitmap]::FromFile($kept)
  $max = 384
  $scale = [Math]::Min(1.0, $max / [Math]::Max($src.Width, $src.Height))
  $w = [Math]::Max(1, [int]($src.Width * $scale))
  $h = [Math]::Max(1, [int]($src.Height * $scale))
  $small = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($small)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($src, 0, 0, $w, $h)
  $g.Dispose()
  $src.Dispose()
  $small.Save($_.FullName, [System.Drawing.Imaging.ImageFormat]::Png)
  $small.Dispose()
  Write-Output ($_.Name + " " + $w + "x" + $h)
}
