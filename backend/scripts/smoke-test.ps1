[CmdletBinding()]
param(
  [string]$ApiBaseUrl = "http://127.0.0.1:3000",
  [switch]$SkipBuild,
  [switch]$KeepServerRunning
)

$ErrorActionPreference = "Stop"

$backendPath = Resolve-Path (Join-Path $PSScriptRoot "..")
$serverProcess = $null
$startedByScript = $false
$tempImagePath = Join-Path $backendPath "tmp-car-smoke.png"

function Test-ApiAvailable {
  param([string]$BaseUrl)

  try {
    $null = Invoke-WebRequest -Uri "$BaseUrl/" -TimeoutSec 2 -UseBasicParsing
    return $true
  } catch {
    return $false
  }
}

function Wait-ApiReady {
  param([string]$BaseUrl)

  for ($i = 0; $i -lt 40; $i++) {
    if (Test-ApiAvailable -BaseUrl $BaseUrl) {
      return
    }
    Start-Sleep -Milliseconds 500
  }

  throw "API nao respondeu em $BaseUrl dentro do timeout."
}

function Invoke-Json {
  param(
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Url,
    [object]$Body
  )

  if ($null -eq $Body) {
    return Invoke-RestMethod -Method $Method -Uri $Url
  }

  return Invoke-RestMethod -Method $Method -Uri $Url -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 20)
}

try {
  Write-Host "== AgroPass Smoke Test =="
  Write-Host "API: $ApiBaseUrl"

  if (-not $SkipBuild) {
    Write-Host "1) Build do backend..."
    cmd /c "npm run build" | Out-Host
  }

  if (-not (Test-ApiAvailable -BaseUrl $ApiBaseUrl)) {
    Write-Host "2) Subindo backend (TELEGRAM_ENABLED=false)..."
    $serverCmd = "set TELEGRAM_ENABLED=false&&npm run start:prod"
    $serverProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", $serverCmd -WorkingDirectory $backendPath -PassThru -WindowStyle Hidden
    $startedByScript = $true
    Wait-ApiReady -BaseUrl $ApiBaseUrl
  } else {
    Write-Host "2) API ja estava ativa, vou reutilizar a instancia existente."
  }

  Write-Host "3) Health check..."
  $healthRaw = curl.exe -s -i "$ApiBaseUrl/health"
  Write-Host $healthRaw

  $suffix = Get-Random -Minimum 10000 -Maximum 99999
  $phone = "31${suffix}1234"
  $document = "31${suffix}1234"
  $carSuffix = Get-Random -Minimum 1000000 -Maximum 9999999

  Write-Host "4) Criando produtor..."
  $producer = Invoke-Json -Method "POST" -Url "$ApiBaseUrl/producers" -Body @{
    name = "Produtor Smoke Test"
    phone = $phone
    document = $document
  }

  Write-Host "5) Criando fazenda..."
  $farm = Invoke-Json -Method "POST" -Url "$ApiBaseUrl/farms" -Body @{
    name = "Fazenda Smoke Test"
    city = "Rio Verde"
    state = "GO"
    latitude = -17.79
    longitude = -50.93
    carNumber = "GO-5218805-SMOKE$carSuffix"
    biome = "CERRADO"
    producerId = $producer.id
  }

  Write-Host "6) Rodando validacao EUDR MOCK..."
  $eudr = Invoke-Json -Method "POST" -Url "$ApiBaseUrl/eudr/farms/$($farm.id)/validate" -Body @{
    mode = "MOCK"
    mockHectaresDeforested = 0
    notes = "Smoke test automatico"
  }

  Write-Host "7) Criando lote..."
  $batch = Invoke-Json -Method "POST" -Url "$ApiBaseUrl/batches" -Body @{
    farmId = $farm.id
    productType = "COFFEE"
    quantity = 40
    unit = "sacas"
  }

  Write-Host "8) Enviando documento CAR no lote..."
  $randomBytes = New-Object byte[] 64
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($randomBytes)
  [IO.File]::WriteAllBytes($tempImagePath, $randomBytes)

  $uploadCmd = "curl.exe -s -X POST $ApiBaseUrl/batches/$($batch.id)/documents -F type=CAR -F file=@`"$tempImagePath`";type=image/png"
  $documentJson = cmd /c $uploadCmd
  if ([string]::IsNullOrWhiteSpace($documentJson)) {
    throw "Falha no upload do documento CAR (resposta vazia)."
  }

  $documentResponse = $documentJson | ConvertFrom-Json
  if (-not $documentResponse.id) {
    throw "Upload do documento CAR falhou. Resposta: $documentJson"
  }

  Write-Host "9) Validando lote..."
  $batchValidation = Invoke-Json -Method "PATCH" -Url "$ApiBaseUrl/batches/$($batch.id)/validate"

  Write-Host "10) Consultando endpoint publico..."
  $publicBatch = Invoke-Json -Method "GET" -Url "$ApiBaseUrl/public/batches/$($batch.code)"
  $metadata = Invoke-Json -Method "GET" -Url "$ApiBaseUrl/public/batches/$($batch.code)/metadata.json"

  Write-Host ""
  Write-Host "== RESULTADO =="
  Write-Host ("producerId: " + $producer.id)
  Write-Host ("farmId: " + $farm.id)
  Write-Host ("batchId: " + $batch.id)
  Write-Host ("batchCode: " + $batch.code)
  Write-Host ("eudrStatus: " + $eudr.status)
  Write-Host ("farmStatus: " + $eudr.farmStatus)
  Write-Host ("batchStatus: " + $batchValidation.status)
  Write-Host ("uploadedDocumentId: " + $documentResponse.id)
  Write-Host ("publicEndpoint: $ApiBaseUrl/public/batches/$($batch.code)")
  Write-Host ("metadataEndpoint: $ApiBaseUrl/public/batches/$($batch.code)/metadata.json")
  Write-Host ("metadataName: " + $metadata.name)
  Write-Host ""
  Write-Host "Smoke test concluido com sucesso."
}
finally {
  if (Test-Path $tempImagePath) {
    Remove-Item -LiteralPath $tempImagePath -Force
  }

  if ($startedByScript -and -not $KeepServerRunning -and $serverProcess -and -not $serverProcess.HasExited) {
    Stop-Process -Id $serverProcess.Id -Force
  }
}
