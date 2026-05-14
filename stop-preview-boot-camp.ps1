$ErrorActionPreference = 'SilentlyContinue'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$PidFile = Join-Path $Root 'offline-preview-server.pid'
$PortFile = Join-Path $Root 'offline-preview-server.port'

if (-not (Test-Path -LiteralPath $PidFile)) {
  Write-Host "No preview server PID file found."
  if ($env:FN_PREVIEW_NO_PAUSE -ne '1') {
    Read-Host "Press Enter to close"
  }
  exit 0
}

$ProcessId = [int](Get-Content -LiteralPath $PidFile | Select-Object -First 1)
$Process = Get-Process -Id $ProcessId

if ($Process) {
  Stop-Process -Id $ProcessId -Force
  Write-Host "Stopped Boot Camp preview server. PID: $ProcessId"
} else {
  Write-Host "Preview server was not running. PID: $ProcessId"
}

Remove-Item -LiteralPath $PidFile, $PortFile -Force
if ($env:FN_PREVIEW_NO_PAUSE -ne '1') {
  Read-Host "Press Enter to close"
}
