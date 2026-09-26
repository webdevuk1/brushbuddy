$root = Split-Path $PSScriptRoot -Parent
$docs = Join-Path $root "docs"
New-Item -ItemType Directory -Force -Path (Join-Path $docs "legal") | Out-Null
foreach ($name in @("privacy.html", "terms.html", "cookies.html")) {
  Copy-Item (Join-Path $root $name) (Join-Path $docs $name) -Force
}
Copy-Item (Join-Path $root "legal\legal.css") (Join-Path $docs "legal\legal.css") -Force
Write-Output "Synced legal pages to docs/"
