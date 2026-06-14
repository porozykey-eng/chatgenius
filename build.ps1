$ErrorActionPreference = "Stop"

# Define paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BuildDir = Join-Path $ScriptDir "dist"
$ZipFile = Join-Path $ScriptDir "chatgenius_extension.zip"

Write-Host "Cleaning up old build..."
if (Test-Path $BuildDir) { Remove-Item -Recurse -Force $BuildDir }
if (Test-Path $ZipFile) { Remove-Item -Force $ZipFile }

New-Item -ItemType Directory -Path $BuildDir | Out-Null

# Define files to include
$Files = @(
    "manifest.json",
    "background.js",
    "content.js",
    "options.html",
    "options.js",
    "popup.html",
    "popup.js",
    "models-config.json"
)

# Define directories to include
$Dirs = @(
    "icons",
    "_locales"
)

Write-Host "Copying extension files..."
foreach ($file in $Files) {
    if (Test-Path (Join-Path $ScriptDir $file)) {
        Copy-Item (Join-Path $ScriptDir $file) (Join-Path $BuildDir $file)
    }
}

foreach ($dir in $Dirs) {
    if (Test-Path (Join-Path $ScriptDir $dir)) {
        Copy-Item (Join-Path $ScriptDir $dir) (Join-Path $BuildDir $dir) -Recurse
    }
}

Write-Host "Creating zip package..."
Compress-Archive -Path "$BuildDir\*" -DestinationPath $ZipFile -Force

Write-Host "Cleaning up build directory..."
Remove-Item -Recurse -Force $BuildDir

Write-Host "Build successful! Package saved at: $ZipFile" -ForegroundColor Green
