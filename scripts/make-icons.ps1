Add-Type -AssemblyName System.Drawing

function Get-RoundedRectPath([single]$x, [single]$y, [single]$w, [single]$h, [single]$r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90) | Out-Null
  $path.AddArc(($x + $w - $d), $y, $d, $d, 270, 90) | Out-Null
  $path.AddArc(($x + $w - $d), ($y + $h - $d), $d, $d, 0, 90) | Out-Null
  $path.AddArc($x, ($y + $h - $d), $d, $d, 90, 90) | Out-Null
  $path.CloseFigure()
  return $path
}

function Save-Icon([int]$size, [string]$path) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))

  $pad = [single]($size * 0.08)
  $side = [single]($size - (2 * $pad))
  $radius = [single]($size * 0.28)
  $rect = Get-RoundedRectPath $pad $pad $side $side $radius
  $mint = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 110, 231, 183))
  $g.FillPath($mint, $rect)

  $ink = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 8, 40, 32))
  $face = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 253, 230, 138))
  $cx = [single]($size * 0.46)
  $cy = [single]($size * 0.52)
  $r = [single]($size * 0.28)
  $g.FillEllipse($face, ($cx - $r), ($cy - $r), ($r * 2), ($r * 2))
  $eye = [single]([Math]::Max(1, $size * 0.045))
  $g.FillEllipse($ink, ($cx - $r * 0.38), ($cy - $r * 0.18), $eye, $eye)
  $g.FillEllipse($ink, ($cx + $r * 0.12), ($cy - $r * 0.18), $eye, $eye)
  $brush = New-Object System.Drawing.Pen($ink, [Math]::Max(1, $size * 0.06))
  $brush.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $brush.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $g.DrawLine($brush, ($cx + $r * 0.35), ($cy + $r * 0.55), ($cx + $r * 1.35), ($cy - $r * 0.35))
  $brush.Dispose()
  $face.Dispose()

  $dir = Split-Path $path
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
  $mint.Dispose()
  $ink.Dispose()
  $rect.Dispose()
}

$root = Split-Path $PSScriptRoot -Parent
foreach ($s in 16, 32, 48, 128) {
  Save-Icon $s (Join-Path $root "icons\icon$s.png")
}
Write-Output "icons ok"
