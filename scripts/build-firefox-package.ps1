$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$distDir = Join-Path $root "dist"
$outZip = Join-Path $distDir "kosovo-gov-site-verification-firefox.zip"

if (!(Test-Path $distDir)) {
  New-Item -ItemType Directory -Path $distDir | Out-Null
}

if (Test-Path $outZip) {
  Remove-Item -LiteralPath $outZip -Force
}

$include = @(
  "manifest.json",
  "src",
  "assets",
  "LICENSE"
)

Push-Location $root
try {
  Compress-Archive -Path $include -DestinationPath $outZip -CompressionLevel Optimal
  Write-Host "Created Firefox package:" $outZip
}
finally {
  Pop-Location
}
