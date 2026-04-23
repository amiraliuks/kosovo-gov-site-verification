$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$distDir = Join-Path $root "dist"
$stagingDir = Join-Path $distDir "chromium-package"
$outZip = Join-Path $distDir "kosovo-gov-site-verification-chromium.zip"

if (!(Test-Path $distDir)) {
  New-Item -ItemType Directory -Path $distDir | Out-Null
}

if (Test-Path $outZip) {
  Remove-Item -LiteralPath $outZip -Force
}

if (Test-Path $stagingDir) {
  Remove-Item -LiteralPath $stagingDir -Recurse -Force
}

New-Item -ItemType Directory -Path $stagingDir | Out-Null

$include = @(
  "manifest.json",
  "src",
  "assets",
  "LICENSE"
)

foreach ($entry in $include) {
  $source = Join-Path $root $entry
  Copy-Item -LiteralPath $source -Destination $stagingDir -Recurse
}

$manifestPath = Join-Path $stagingDir "manifest.json"
$manifest = Get-Content -Raw -Path $manifestPath | ConvertFrom-Json
$manifest.PSObject.Properties.Remove("browser_specific_settings")

$manifestJson = $manifest | ConvertTo-Json -Depth 100
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($manifestPath, $manifestJson + [Environment]::NewLine, $utf8NoBom)

Push-Location $stagingDir
try {
  Compress-Archive -Path * -DestinationPath $outZip -CompressionLevel Optimal
  Write-Host "Created Chromium package:" $outZip
}
finally {
  Pop-Location
}

Remove-Item -LiteralPath $stagingDir -Recurse -Force
