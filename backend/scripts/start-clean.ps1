[CmdletBinding()]
param(
  [int]$Port = 3000,
  [switch]$Build,
  [switch]$DisableTelegram
)

$ErrorActionPreference = "Stop"

$backendPath = Resolve-Path (Join-Path $PSScriptRoot "..")

function Stop-PortListeners {
  param([int]$LocalPort)

  $listeners = Get-NetTCPConnection -LocalPort $LocalPort -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique

  if (-not $listeners) {
    Write-Host "No process is listening on port $LocalPort."
    return
  }

  foreach ($listenerPid in $listeners) {
    if ($listenerPid -eq $PID) {
      continue
    }

    try {
      Stop-Process -Id $listenerPid -Force -ErrorAction Stop
      Write-Host "Stopped process $listenerPid on port $LocalPort."
    } catch {
      Write-Warning "Could not stop process $listenerPid on port ${LocalPort}: $($_.Exception.Message)"
    }
  }

  Start-Sleep -Milliseconds 400
}

Push-Location $backendPath
try {
  if ($Build) {
    Write-Host "Running backend build..."
    cmd /c "npm run build" | Out-Host
    if ($LASTEXITCODE -ne 0) {
      throw "Build failed with exit code $LASTEXITCODE."
    }
  }

  Stop-PortListeners -LocalPort $Port

  if ($DisableTelegram) {
    Write-Host "Starting backend on port $Port with TELEGRAM_ENABLED=false..."
    cmd /c "set TELEGRAM_ENABLED=false&&set PORT=$Port&&npm run start:prod"
  } else {
    Write-Host "Starting backend on port $Port..."
    cmd /c "set PORT=$Port&&npm run start:prod"
  }

  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
} finally {
  Pop-Location
}
