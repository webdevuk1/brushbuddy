$root = Split-Path $PSScriptRoot -Parent
& (Join-Path $root "scripts\pack-store.ps1") | Out-Null
$zip = Join-Path $root "dist\BrushBuddy-store.zip"
$store = Join-Path $root "store"
$paste = Join-Path $root "docs\LISTING-PASTE.txt"
explorer.exe "/select,$zip"
Start-Process $store
Start-Process notepad.exe $paste
Start-Process "https://chrome.google.com/webstore/devconsole"
Start-Process "https://brushbuddy-roan.vercel.app/privacy.html"
Write-Host "Ready: upload zip, copy from Notepad, add screenshots from store folder."
