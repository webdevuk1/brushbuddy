$root = Split-Path $PSScriptRoot -Parent
$stage = Join-Path $root "dist\stage"
$zip = Join-Path $root "dist\BrushBuddy-store.zip"

if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Force -Path $stage | Out-Null

foreach ($name in @("manifest.json", "background.js", "privacy.html", "terms.html", "cookies.html", "legal", "content", "lib", "popup", "options", "ui", "icons", "assets")) {
  Copy-Item (Join-Path $root $name) (Join-Path $stage $name) -Recurse
}

foreach ($extra in @("assets\archive", "assets\library\reference")) {
  $path = Join-Path $stage $extra
  if (Test-Path $path) { Remove-Item $path -Recurse -Force }
}
Get-ChildItem (Join-Path $stage "assets\library") -File -Filter *.png -ErrorAction SilentlyContinue | Remove-Item -Force

$manifestPath = Join-Path $stage "manifest.json"
$manifest = Get-Content $manifestPath -Raw
$manifest = $manifest -replace '(?m)^\s*"key":\s*".*",\r?\n', ""
[System.IO.File]::WriteAllText($manifestPath, $manifest)

if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $zip
Write-Output $zip
