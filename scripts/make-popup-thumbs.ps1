Add-Type -AssemblyName System.Drawing

Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class PopupThumbs {
  public static void Save(string srcPath, string destPath, int size) {
    using (var original = new Bitmap(srcPath)) {
      var bmp = new Bitmap(original.Width, original.Height, PixelFormat.Format32bppArgb);
      using (var g = Graphics.FromImage(bmp)) {
        g.DrawImage(original, 0, 0, original.Width, original.Height);
      }
      ClearPaper(bmp);
      using (var thumb = new Bitmap(size, size, PixelFormat.Format32bppArgb))
      using (var tg = Graphics.FromImage(thumb)) {
        tg.Clear(Color.Transparent);
        tg.InterpolationMode = InterpolationMode.HighQualityBicubic;
        tg.PixelOffsetMode = PixelOffsetMode.HighQuality;
        tg.CompositingQuality = CompositingQuality.HighQuality;
        tg.DrawImage(bmp, new Rectangle(0, 0, size, size));
        thumb.Save(destPath, ImageFormat.Png);
      }
      bmp.Dispose();
    }
  }

  static void ClearPaper(Bitmap bmp) {
    var data = bmp.LockBits(new Rectangle(0, 0, bmp.Width, bmp.Height), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
    int bytes = Math.Abs(data.Stride) * bmp.Height;
    byte[] px = new byte[bytes];
    Marshal.Copy(data.Scan0, px, 0, bytes);
    int w = bmp.Width;
    int h = bmp.Height;
    int stride = data.Stride;
    bool[] seen = new bool[w * h];
    var q = new Queue<int>();
    int[] seeds = new int[] { 0, w - 1, (h - 1) * w, (h - 1) * w + (w - 1) };
    foreach (int seed in seeds) q.Enqueue(seed);
    while (q.Count > 0) {
      int i = q.Dequeue();
      if (i < 0 || i >= seen.Length || seen[i]) continue;
      seen[i] = true;
      int x = i % w;
      int y = i / w;
      int o = y * stride + x * 4;
      byte b = px[o];
      byte g = px[o + 1];
      byte r = px[o + 2];
      byte a = px[o + 3];
      if (a < 200 || r < 242 || g < 242 || b < 242) continue;
      px[o + 3] = 0;
      if (x + 1 < w) q.Enqueue(i + 1);
      if (x - 1 >= 0) q.Enqueue(i - 1);
      if (y + 1 < h) q.Enqueue(i + w);
      if (y - 1 >= 0) q.Enqueue(i - w);
    }
    Marshal.Copy(px, 0, data.Scan0, bytes);
    bmp.UnlockBits(data);
  }
}
"@

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

foreach ($entry in $map.GetEnumerator()) {
  $srcPath = Join-Path $root "assets\library\$($entry.Key)"
  [PopupThumbs]::Save($srcPath, (Join-Path $out $entry.Value), 64)
}

$overlay = Join-Path $root "assets\library\thumbs\128"
New-Item -ItemType Directory -Force -Path $overlay | Out-Null
foreach ($entry in $map.GetEnumerator()) {
  $srcPath = Join-Path $root "assets\library\$($entry.Key)"
  [PopupThumbs]::Save($srcPath, (Join-Path $overlay $entry.Value), 128)
}
Write-Output "popup + overlay thumbs ok"
