Add-Type -AssemblyName System.Drawing

$root = Split-Path $PSScriptRoot -Parent
$out = Join-Path $root "store\chrome"
New-Item -ItemType Directory -Force -Path $out | Out-Null

$iconPath = Join-Path $root "icons\icon128.png"
$buddyPath = Join-Path $root "assets\library\06-closeup.png"
$reminderPath = Join-Path $root "store\reminder.png"
$settingsPath = Join-Path $root "store\settings.png"

function New-Canvas([int]$w, [int]$h) {
  $bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  return @{ Bitmap = $bmp; Graphics = $g }
}

function Save-Opaque([System.Drawing.Bitmap]$src, [string]$path) {
  $flat = New-Object System.Drawing.Bitmap $src.Width, $src.Height, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $g = [System.Drawing.Graphics]::FromImage($flat)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($src, 0, 0, $src.Width, $src.Height)
  $g.Dispose()
  $flat.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $flat.Dispose()
}

function Fill-Gradient($g, [int]$w, [int]$h) {
  $c1 = [System.Drawing.Color]::FromArgb(255, 8, 18, 16)
  $c2 = [System.Drawing.Color]::FromArgb(255, 16, 52, 42)
  $rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $c1, $c2, 28
  $g.FillRectangle($brush, $rect)
  $brush.Dispose()
  $glow = New-Object System.Drawing.Drawing2D.GraphicsPath
  $glow.AddEllipse([int]($w * 0.55), [int]($h * -0.35), [int]($w * 0.7), [int]($h * 1.4))
  $gb = New-Object System.Drawing.Drawing2D.PathGradientBrush $glow
  $gb.CenterColor = [System.Drawing.Color]::FromArgb(70, 94, 233, 181)
  $gb.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 94, 233, 181))
  $g.FillPath($gb, $glow)
  $gb.Dispose()
  $glow.Dispose()
}

function Draw-Buddy($g, [string]$path, [int]$x, [int]$y, [int]$size) {
  $loaded = New-Object System.Drawing.Bitmap $path
  $src = New-Object System.Drawing.Bitmap $loaded.Width, $loaded.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $cg = [System.Drawing.Graphics]::FromImage($src)
  $cg.DrawImage($loaded, 0, 0, $loaded.Width, $loaded.Height)
  $cg.Dispose()
  $loaded.Dispose()
  $w = $src.Width
  $h = $src.Height
  $seen = New-Object 'bool[,]' $w, $h
  $queue = New-Object System.Collections.Generic.Queue[object]
  function Test-EdgeWhite([System.Drawing.Color]$c) {
    return ($c.A -lt 16) -or ($c.R -gt 246 -and $c.G -gt 246 -and $c.B -gt 246)
  }
  for ($px = 0; $px -lt $w; $px++) {
    $queue.Enqueue(@($px, 0))
    $bottom = $h - 1
    $queue.Enqueue(@($px, $bottom))
  }
  $right = $w - 1
  for ($py = 0; $py -lt $h; $py++) {
    $queue.Enqueue(@(0, $py))
    $queue.Enqueue(@($right, $py))
  }
  while ($queue.Count -gt 0) {
    $p = $queue.Dequeue()
    $px = [int]$p[0]; $py = [int]$p[1]
    if ($px -lt 0 -or $py -lt 0 -or $px -ge $w -or $py -ge $h) { continue }
    if ($seen[$px, $py]) { continue }
    $c = $src.GetPixel($px, $py)
    if (-not (Test-EdgeWhite $c)) { continue }
    $seen[$px, $py] = $true
    $src.SetPixel($px, $py, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
    $nx = $px + 1; $queue.Enqueue(@($nx, $py))
    $nx = $px - 1; $queue.Enqueue(@($nx, $py))
    $ny = $py + 1; $queue.Enqueue(@($px, $ny))
    $ny = $py - 1; $queue.Enqueue(@($px, $ny))
  }
  $g.DrawImage($src, $x, $y, $size, $size)
  $src.Dispose()
}

function Draw-Pill($g, [string]$text, [int]$x, [int]$y) {
  $font = New-Object System.Drawing.Font "Segoe UI", 16, ([System.Drawing.FontStyle]::Regular)
  $size = $g.MeasureString($text, $font)
  $w = [int]$size.Width + 36
  $h = 40
  $rect = New-Object System.Drawing.Rectangle $x, $y, $w, $h
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $r = 20
  $path.AddArc($rect.X, $rect.Y, $r, $r, 180, 90)
  $path.AddArc($rect.Right - $r, $rect.Y, $r, $r, 270, 90)
  $path.AddArc($rect.Right - $r, $rect.Bottom - $r, $r, $r, 0, 90)
  $path.AddArc($rect.X, $rect.Bottom - $r, $r, $r, 90, 90)
  $path.CloseFigure()
  $fill = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(40, 255, 255, 255))
  $g.FillPath($fill, $path)
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 232, 245, 239))
  $g.DrawString($text, $font, $brush, ($x + 18), ($y + 8))
  $brush.Dispose(); $fill.Dispose(); $path.Dispose(); $font.Dispose()
  return $w
}

# --- Store icon 128x128, opaque ---
$icon = New-Canvas 128 128
$mint = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 167, 232, 214))
$icon.Graphics.FillRectangle($mint, 0, 0, 128, 128)
$mint.Dispose()
Draw-Buddy $icon.Graphics $iconPath 0 0 128
Save-Opaque $icon.Bitmap (Join-Path $out "store-icon-128.png")
$icon.Graphics.Dispose(); $icon.Bitmap.Dispose()

# --- Marquee 1400x560 ---
$m = New-Canvas 1400 560
Fill-Gradient $m.Graphics 1400 560
$title = New-Object System.Drawing.Font "Segoe UI", 64, ([System.Drawing.FontStyle]::Bold)
$sub = New-Object System.Drawing.Font "Segoe UI", 26, ([System.Drawing.FontStyle]::Regular)
$white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 250, 250, 250))
$soft = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 110, 231, 183))
$m.Graphics.DrawString("BrushBuddy", $title, $white, 72, 150)
$m.Graphics.DrawString("Your little buddy pops up", $sub, $white, 76, 270)
$m.Graphics.DrawString("when it's time to brush.", $sub, $soft, 76, 312)
$px = 76
foreach ($label in @("On the page you're on", "Done or snooze", "Stays on your device")) {
  $px += (Draw-Pill $m.Graphics $label $px 400) + 14
}
Draw-Buddy $m.Graphics $buddyPath 980 70 420
Save-Opaque $m.Bitmap (Join-Path $out "marquee-1400x560.png")
$title.Dispose(); $sub.Dispose(); $white.Dispose(); $soft.Dispose()
$m.Graphics.Dispose(); $m.Bitmap.Dispose()

# --- Small promo 440x280 ---
$s = New-Canvas 440 280
Fill-Gradient $s.Graphics 440 280
$st = New-Object System.Drawing.Font "Segoe UI", 28, ([System.Drawing.FontStyle]::Bold)
$ss = New-Object System.Drawing.Font "Segoe UI", 13, ([System.Drawing.FontStyle]::Regular)
$white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 250, 250, 250))
$soft = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 214, 228, 222))
$s.Graphics.DrawString("BrushBuddy", $st, $white, 24, 78)
$s.Graphics.DrawString("Time to brush.", $ss, $soft, 26, 128)
$s.Graphics.DrawString("A gentle reminder", $ss, $soft, 26, 150)
$s.Graphics.DrawString("on the page you're on.", $ss, $soft, 26, 172)
Draw-Buddy $s.Graphics $buddyPath 248 36 200
Save-Opaque $s.Bitmap (Join-Path $out "small-promo-440x280.png")
$st.Dispose(); $ss.Dispose(); $white.Dispose(); $soft.Dispose()
$s.Graphics.Dispose(); $s.Bitmap.Dispose()

function New-Screenshot([string]$shotPath, [string]$kicker, [string]$headline, [string]$dest, [System.Drawing.Color]$pad) {
  $c = New-Canvas 1280 800
  $bg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 12, 14, 16))
  $c.Graphics.FillRectangle($bg, 0, 0, 1280, 800)
  $bg.Dispose()
  $kFont = New-Object System.Drawing.Font "Segoe UI", 13, ([System.Drawing.FontStyle]::Bold)
  $hFont = New-Object System.Drawing.Font "Segoe UI", 22, ([System.Drawing.FontStyle]::Bold)
  $mintB = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 110, 231, 183))
  $whiteB = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 250, 250, 250))
  $c.Graphics.DrawString($kicker.ToUpper(), $kFont, $mintB, 48, 28)
  $c.Graphics.DrawString($headline, $hFont, $whiteB, 46, 52)

  $frameX = 48
  $frameY = 112
  $frameW = 1184
  $frameH = 640
  $frame = New-Object System.Drawing.Drawing2D.GraphicsPath
  $rad = 18
  $fr = New-Object System.Drawing.Rectangle $frameX, $frameY, $frameW, $frameH
  $frame.AddArc($fr.X, $fr.Y, $rad, $rad, 180, 90)
  $frame.AddArc($fr.Right - $rad, $fr.Y, $rad, $rad, 270, 90)
  $frame.AddArc($fr.Right - $rad, $fr.Bottom - $rad, $rad, $rad, 0, 90)
  $frame.AddArc($fr.X, $fr.Bottom - $rad, $rad, $rad, 90, 90)
  $frame.CloseFigure()
  $c.Graphics.SetClip($frame)
  $padBrush = New-Object System.Drawing.SolidBrush $pad
  $c.Graphics.FillRectangle($padBrush, $fr)
  $padBrush.Dispose()
  $shot = [System.Drawing.Image]::FromFile($shotPath)
  $scale = [Math]::Min($frameW / $shot.Width, $frameH / $shot.Height)
  $dw = [int]($shot.Width * $scale)
  $dh = [int]($shot.Height * $scale)
  $dx = $frameX + [int](($frameW - $dw) / 2)
  $dy = $frameY + [int](($frameH - $dh) / 2)
  $c.Graphics.DrawImage($shot, $dx, $dy, $dw, $dh)
  $shot.Dispose()
  $c.Graphics.ResetClip()
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 42, 46, 48)), 2
  $c.Graphics.DrawPath($pen, $frame)
  $pen.Dispose(); $frame.Dispose()
  $kFont.Dispose(); $hFont.Dispose(); $mintB.Dispose(); $whiteB.Dispose()
  Save-Opaque $c.Bitmap $dest
  $c.Graphics.Dispose(); $c.Bitmap.Dispose()
}

New-Screenshot $reminderPath "On any website" "He shows up when it's time to brush." (Join-Path $out "screenshot-reminder-1280x800.png") ([System.Drawing.Color]::FromArgb(255, 236, 236, 236))
New-Screenshot $settingsPath "Your times" "Set morning, night, sound, and notifications." (Join-Path $out "screenshot-settings-1280x800.png") ([System.Drawing.Color]::FromArgb(255, 9, 9, 11))

Get-ChildItem $out -Filter *.png | ForEach-Object {
  $img = [System.Drawing.Image]::FromFile($_.FullName)
  "{0}  {1}x{2}  {3}" -f $_.Name, $img.Width, $img.Height, $img.PixelFormat
  $img.Dispose()
}
