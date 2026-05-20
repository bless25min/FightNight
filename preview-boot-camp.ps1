$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$PreviewDir = Join-Path $Root 'offline-preview'
$PidFile = Join-Path $Root 'offline-preview-server.pid'
$PortFile = Join-Path $Root 'offline-preview-server.port'
$LogFile = Join-Path $Root 'offline-preview-server.log'
$ErrFile = Join-Path $Root 'offline-preview-server.err.log'

function Test-PortFree([int] $Port) {
  $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
    Where-Object { $_.State -eq 'Listen' }
  return -not $connection
}

function Wait-PreviewReady([string] $Url) {
  for ($i = 0; $i -lt 50; $i += 1) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -eq 200) {
        return $true
      }
    } catch {
      Start-Sleep -Milliseconds 200
    }
  }

  return $false
}

if (-not (Test-Path -LiteralPath $PreviewDir)) {
  Write-Host "offline-preview folder was not found." -ForegroundColor Red
  Write-Host "Please run npm.cmd run build -- --base ./ --outDir offline-preview first."
  Read-Host "Press Enter to close"
  exit 1
}

$IndexHtml = Join-Path $PreviewDir 'index.html'
if (Test-Path -LiteralPath $IndexHtml) {
  Copy-Item -LiteralPath $IndexHtml -Destination (Join-Path $PreviewDir 'boot-camp.html') -Force

  $PrivacyDir = Join-Path $PreviewDir 'privacy-policy'
  $PrivacyHtml = Join-Path $PrivacyDir 'index.html'
  New-Item -ItemType Directory -Force -Path $PrivacyDir | Out-Null
  Copy-Item -LiteralPath $IndexHtml -Destination $PrivacyHtml -Force

  $PrivacyContent = Get-Content -LiteralPath $PrivacyHtml -Raw
  $PrivacyContent = $PrivacyContent -replace '\./assets/', '../assets/'
  Set-Content -LiteralPath $PrivacyHtml -Value $PrivacyContent -Encoding utf8

  $GuideSlugs = @(
    'taipei-boxing-muay-thai-classes',
    'taichung-boxing-muay-thai-classes',
    'beginner-combat-fitness',
    'stress-release-after-workout'
  )

  foreach ($Slug in $GuideSlugs) {
    $GuideDir = Join-Path $PreviewDir (Join-Path 'guides' $Slug)
    $GuideHtml = Join-Path $GuideDir 'index.html'
    New-Item -ItemType Directory -Force -Path $GuideDir | Out-Null
    Copy-Item -LiteralPath $IndexHtml -Destination $GuideHtml -Force

    $GuideContent = Get-Content -LiteralPath $GuideHtml -Raw
    $GuideContent = $GuideContent -replace '\./assets/', '../../assets/'
    Set-Content -LiteralPath $GuideHtml -Value $GuideContent -Encoding utf8
  }
}

$Python = Get-Command python -ErrorAction SilentlyContinue
if (-not $Python) {
  Write-Host "Python was not found." -ForegroundColor Red
  Write-Host "Install Python or use npm preview instead."
  Read-Host "Press Enter to close"
  exit 1
}

$Port = 5292
while (($Port -lt 5310) -and -not (Test-PortFree $Port)) {
  $Port += 1
}

if ($Port -ge 5310) {
  Write-Host "No free preview port found between 5292 and 5309." -ForegroundColor Red
  Read-Host "Press Enter to close"
  exit 1
}

Remove-Item -LiteralPath $LogFile, $ErrFile -ErrorAction SilentlyContinue

$Arguments = @(
  '-m',
  'http.server',
  "$Port",
  '--bind',
  '127.0.0.1',
  '--directory',
  $PreviewDir
)

$Process = Start-Process `
  -FilePath $Python.Source `
  -ArgumentList $Arguments `
  -WorkingDirectory $Root `
  -RedirectStandardOutput $LogFile `
  -RedirectStandardError $ErrFile `
  -WindowStyle Hidden `
  -PassThru

Set-Content -LiteralPath $PidFile -Value $Process.Id -Encoding ascii
Set-Content -LiteralPath $PortFile -Value $Port -Encoding ascii

$Url = "http://127.0.0.1:$Port/boot-camp.html"

Write-Host ""
Write-Host "Starting Boot Camp offline preview..." -ForegroundColor Cyan
Write-Host $Url
Write-Host ""

if (Wait-PreviewReady $Url) {
  Start-Process $Url
  Write-Host "Preview is ready and opened in your browser." -ForegroundColor Green
  Write-Host ""
  Write-Host "To stop it later, double-click stop-preview-boot-camp.cmd"
  Write-Host "Server PID: $($Process.Id)"
  Write-Host ""
  Write-Host "Keep this window open while previewing." -ForegroundColor Yellow
  Write-Host "Close this window or run stop-preview-boot-camp.cmd to stop the server."

  if ($env:FN_PREVIEW_NO_PAUSE -ne '1') {
    Wait-Process -Id $Process.Id
  }
} else {
  Write-Host "Preview server did not become ready." -ForegroundColor Red
  Write-Host ""
  Write-Host "Server log:"
  if (Test-Path -LiteralPath $LogFile) {
    Get-Content -LiteralPath $LogFile
  }
  Write-Host ""
  Write-Host "Error log:"
  if (Test-Path -LiteralPath $ErrFile) {
    Get-Content -LiteralPath $ErrFile
  }
  Write-Host ""
  if ($env:FN_PREVIEW_NO_PAUSE -ne '1') {
    Read-Host "Press Enter to close this window"
  }
}
