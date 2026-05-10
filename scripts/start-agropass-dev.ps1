param(
  [switch]$WithTunnel
)

$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$backendPath = Join-Path $repoRoot 'backend'
$frontendPath = Join-Path $repoRoot 'frontend'

function Quote-Path {
  param([string]$Path)
  return "'" + $Path.Replace("'", "''") + "'"
}

if (!(Test-Path $backendPath)) {
  throw "Pasta backend nao encontrada em: $backendPath"
}

if (!(Test-Path $frontendPath)) {
  throw "Pasta frontend nao encontrada em: $frontendPath"
}

$repoQuoted = Quote-Path $repoRoot
$backendQuoted = Quote-Path $backendPath

$backendCmd = "Set-Location $repoQuoted; cmd /c npm --prefix backend run start:dev"
$frontendCmd = "Set-Location $repoQuoted; cmd /c npm --prefix frontend run dev"

Start-Process powershell -ArgumentList @('-NoExit', '-Command', $backendCmd) | Out-Null
Start-Process powershell -ArgumentList @('-NoExit', '-Command', $frontendCmd) | Out-Null

Write-Host 'Backend e frontend iniciados em janelas separadas.' -ForegroundColor Green

if ($WithTunnel) {
  $tunnelCmd = "Set-Location $backendQuoted; npx localtunnel --port 3000 --local-host 127.0.0.1"
  Start-Process powershell -ArgumentList @('-NoExit', '-Command', $tunnelCmd) | Out-Null

  Write-Host ''
  Write-Host 'Localtunnel iniciado em uma terceira janela.' -ForegroundColor Yellow
  Write-Host 'Quando aparecer a URL https://....loca.lt, atualize no backend/.env:' -ForegroundColor Yellow
  Write-Host '  PUBLIC_BATCHES_URL=https://SEU-LINK.loca.lt' -ForegroundColor Yellow
  Write-Host '  PUBLIC_BACKEND_URL=https://SEU-LINK.loca.lt' -ForegroundColor Yellow
  Write-Host '  QR_PDF_PUBLIC_BASE_URL=https://SEU-LINK.loca.lt' -ForegroundColor Yellow
}

Write-Host ''
Write-Host 'Dica: para garantir dados reais, desligue demo mode no frontend.' -ForegroundColor Cyan
Write-Host "Abra no navegador: http://localhost:5173/batches" -ForegroundColor Cyan
