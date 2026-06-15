param(
  [switch]$ShellOnly,
  [switch]$VisibleMcp
)

$ErrorActionPreference = "Stop"

$root = "C:\dev\The-Infinite-Network\Operating-System"
$mcpRoot = Join-Path $root "mcp\mcp-notion"
$shellRoot = Join-Path $root "inos-shell"
$mcpEnv = Join-Path $mcpRoot ".env.local"
$mcpHealth = "http://127.0.0.1:3002/health"
$mcpDisplayUrl = "http://localhost:3002/health"
$shellUrl = "http://localhost:5173"
$shellHealth = "http://127.0.0.1:5173/"
$shellEntry = Join-Path $shellRoot "node_modules\vite\bin\vite.js"
$nodeExe = (Get-Command node -ErrorAction Stop).Source

function Test-HttpReady {
  param([string]$Url)
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  } catch {
    return $false
  }
}

function Wait-HttpReady {
  param(
    [string]$Url,
    [int]$Seconds = 15
  )

  for ($i = 0; $i -lt $Seconds; $i++) {
    if (Test-HttpReady -Url $Url) {
      return $true
    }
    Start-Sleep -Seconds 1
  }

  return $false
}

function Test-PortListening {
  param([int]$Port)
  return [bool](Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue)
}

function Start-VisiblePowerShell {
  param([string]$WorkingDirectory, [string]$Command)
  Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", "Set-Location '$WorkingDirectory'; $Command"
  ) -WorkingDirectory $WorkingDirectory
}

function Start-HiddenPowerShell {
  param([string]$WorkingDirectory, [string]$Command)
  Start-Process powershell -WindowStyle Hidden -ArgumentList @(
    "-ExecutionPolicy", "Bypass",
    "-Command", "Set-Location '$WorkingDirectory'; $Command"
  ) -WorkingDirectory $WorkingDirectory
}

if (-not (Test-Path $root)) {
  throw "Operating-System root not found: $root"
}

if (-not (Test-Path $shellRoot)) {
  throw "INOS shell path not found: $shellRoot"
}
if (-not (Test-Path $shellEntry)) {
  throw "INOS shell Vite entry not found: $shellEntry"
}
if (-not (Test-Path $nodeExe)) {
  throw "node executable not found: $nodeExe"
}

Write-Host "--- INOS CLEAN BOOT ---" -ForegroundColor Cyan
Write-Host "[root] $root" -ForegroundColor DarkCyan

if (-not $ShellOnly) {
  if (-not (Test-Path $mcpRoot)) {
    throw "mcp-notion path not found: $mcpRoot"
  }
  if (-not (Test-Path $mcpEnv)) {
    throw "Missing $mcpEnv. Set live MCP values before boot."
  }

  if (Test-PortListening -Port 3002) {
    if (Wait-HttpReady -Url $mcpHealth -Seconds 10) {
      Write-Host "[1/2] MCP already healthy at $mcpDisplayUrl" -ForegroundColor Green
    } else {
      throw "Port 3002 is already in use, but the MCP health endpoint is not ready at $mcpDisplayUrl."
    }
  } elseif (Test-HttpReady -Url $mcpHealth) {
    Write-Host "[1/2] MCP already healthy at $mcpDisplayUrl" -ForegroundColor Green
  } else {
    Write-Host "[1/2] Starting mcp-notion clean runtime..." -ForegroundColor Gray
    $mcpCommand = ".\scripts\start_clean_runtime.ps1"
    if ($VisibleMcp) {
      Start-VisiblePowerShell -WorkingDirectory $mcpRoot -Command $mcpCommand
    } else {
      Start-HiddenPowerShell -WorkingDirectory $mcpRoot -Command $mcpCommand
    }

    $maxWait = 30
    $ready = Wait-HttpReady -Url $mcpHealth -Seconds $maxWait

    if (-not $ready) {
      throw "mcp-notion did not become healthy at $mcpDisplayUrl within $maxWait seconds."
    }

    Write-Host "[1/2] MCP healthy at $mcpDisplayUrl" -ForegroundColor Green
  }
} else {
  Write-Host "[1/2] Shell-only mode enabled. Skipping MCP boot." -ForegroundColor Yellow
}

if (Test-HttpReady -Url $shellHealth) {
  Write-Host "[2/2] INOS shell already live at $shellUrl" -ForegroundColor Green
} else {
  Write-Host "[2/2] Starting INOS shell on $shellUrl ..." -ForegroundColor Gray
  Start-VisiblePowerShell -WorkingDirectory $shellRoot -Command "& '$nodeExe' '.\node_modules\vite\bin\vite.js' --host 127.0.0.1 --port 5173"

  $shellReady = Wait-HttpReady -Url $shellHealth -Seconds 20

  if (-not $shellReady) {
    throw "inos-shell did not become ready at $shellUrl within 20 seconds."
  }

  Write-Host "[2/2] INOS shell live at $shellUrl" -ForegroundColor Green
}

Write-Host "------------------------------------------------" -ForegroundColor Cyan
Write-Host "INOS clean boot started." -ForegroundColor Green
Write-Host "Primary UI: $shellUrl" -ForegroundColor Green
if (-not $ShellOnly) {
  Write-Host "MCP backend: $mcpDisplayUrl" -ForegroundColor DarkCyan
}
