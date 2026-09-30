Add-Type -AssemblyName System.Drawing

Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public static class ToolbarIcon {
  public static void Build(string srcPath, string outDir, string sheetPath) {
    using (var original = new Bitmap(srcPath)) {
      var bmp = new Bitmap(original.Width, original.Height, PixelFormat.Format32bppArgb);
      using (var g = Graphics.FromImage(bmp)) {
        g.DrawImage(original, 0, 0, original.Width, original.Height);
      }
      ClearPaper(bmp);
      int[] sizes = new int[] { 16, 32, 48, 128 };
      foreach (int size in sizes) {
        using (var small = new Bitmap(size, size, PixelFormat.Format32bppArgb))
        using (var g = Graphics.FromImage(small)) {
          g.Clear(Color.Transparent);
          g.InterpolationMode = InterpolationMode.HighQualityBicubic;
          g.PixelOffsetMode = PixelOffsetMode.HighQuality;
          g.CompositingQuality = CompositingQuality.HighQuality;
          g.DrawImage(bmp, new Rectangle(0, 0, size, size));
          small.Save(Path.Combine(outDir, "icon" + size + ".png"), ImageFormat.Png);
        }
      }
      using (var sheet = new Bitmap(420, 90, PixelFormat.Format32bppArgb))
      using (var g = Graphics.FromImage(sheet)) {
        g.Clear(Color.FromArgb(255, 232, 234, 237));
        int x = 16;
        foreach (int size in new int[] { 16, 32, 48 }) {
          using (var icon = new Bitmap(Path.Combine(outDir, "icon" + size + ".png"))) {
            g.InterpolationMode = InterpolationMode.NearestNeighbor;
            g.PixelOffsetMode = PixelOffsetMode.Half;
            g.DrawImage(icon, new Rectangle(x, 13, 64, 64));
          }
          x += 96;
        }
        using (var icon = new Bitmap(Path.Combine(outDir, "icon128.png"))) {
          g.InterpolationMode = InterpolationMode.HighQualityBicubic;
          g.DrawImage(icon, new Rectangle(300, 8, 72, 72));
        }
        sheet.Save(sheetPath, ImageFormat.Png);
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

$src = "C:\Users\james\.cursor\projects\d-cursor-ai-Brush-Buddies\assets\brushbuddy-toolbar-icon.png"
$out = "d:\cursor ai\Brush Buddies\icons"
$sheet = "C:\Users\james\.cursor\projects\d-cursor-ai-Brush-Buddies\assets\brushbuddy-toolbar-sizes.png"
[ToolbarIcon]::Build($src, $out, $sheet)
Write-Output "icons written"
