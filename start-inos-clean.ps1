param(
  [switch]$ShellOnly,
  [switch]$VisibleMcp
)

$ErrorActionPreference = "Stop"

$root = "C:\dev\The-Infinite-Network\Operating-System"
$pythonApiRoot = Join-Path $root "inos-api"
$mcpRoot = Join-Path $root "mcp\mcp-notion"
$shellRoot = Join-Path $root "inos-shell"
$mcpEnv = Join-Path $mcpRoot ".env.local"
$pythonExe = Join-Path $pythonApiRoot "venv\Scripts\python.exe"
$pythonHealth = "http://127.0.0.1:8000/health"
$pythonDisplayUrl = "http://localhost:8000/health"
$nodeApiHealth = "http://127.0.0.1:3005/health"
$nodeApiDisplayUrl = "http://localhost:3005/health"
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

function Start-HiddenProcess {
  param(
    [string]$FilePath,
    [string[]]$ArgumentList,
    [string]$WorkingDirectory
  )

  Start-Process -FilePath $FilePath -ArgumentList $ArgumentList -WorkingDirectory $WorkingDirectory -WindowStyle Hidden
}

if (-not (Test-Path $root)) {
  throw "Operating-System root not found: $root"
}

if (-not (Test-Path $pythonApiRoot)) {
  throw "INOS Python API path not found: $pythonApiRoot"
}

if (-not (Test-Path $shellRoot)) {
  throw "INOS shell path not found: $shellRoot"
}
if (-not (Test-Path $pythonExe)) {
  throw "INOS Python venv executable not found: $pythonExe"
}
if (-not (Test-Path $shellEntry)) {
  throw "INOS shell Vite entry not found: $shellEntry"
}
if (-not (Test-Path $nodeExe)) {
  throw "node executable not found: $nodeExe"
}

Write-Host "--- INOS CLEAN BOOT ---" -ForegroundColor Cyan
Write-Host "[root] $root" -ForegroundColor DarkCyan

if (Test-PortListening -Port 8000) {
  if (Wait-HttpReady -Url $pythonHealth -Seconds 10) {
    Write-Host "[1/4] Python API already healthy at $pythonDisplayUrl" -ForegroundColor Green
  } else {
    throw "Port 8000 is already in use, but the Python API health endpoint is not ready at $pythonDisplayUrl."
  }
} elseif (Test-HttpReady -Url $pythonHealth) {
  Write-Host "[1/4] Python API already healthy at $pythonDisplayUrl" -ForegroundColor Green
} else {
  Write-Host "[1/4] Starting Python API on $pythonDisplayUrl ..." -ForegroundColor Gray
  Start-HiddenProcess -FilePath $pythonExe -ArgumentList @("-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000") -WorkingDirectory $pythonApiRoot

  $pythonReady = Wait-HttpReady -Url $pythonHealth -Seconds 25
  if (-not $pythonReady) {
    throw "Python API did not become healthy at $pythonDisplayUrl within 25 seconds."
  }

  Write-Host "[1/4] Python API healthy at $pythonDisplayUrl" -ForegroundColor Green
}

if (Test-PortListening -Port 3005) {
  if (Wait-HttpReady -Url $nodeApiHealth -Seconds 10) {
    Write-Host "[2/4] Node API already healthy at $nodeApiDisplayUrl" -ForegroundColor Green
  } else {
    throw "Port 3005 is already in use, but the Node API health endpoint is not ready at $nodeApiDisplayUrl."
  }
} elseif (Test-HttpReady -Url $nodeApiHealth) {
  Write-Host "[2/4] Node API already healthy at $nodeApiDisplayUrl" -ForegroundColor Green
} else {
  Write-Host "[2/4] Starting Node API on $nodeApiDisplayUrl ..." -ForegroundColor Gray
  Start-HiddenProcess -FilePath $nodeExe -ArgumentList @(".\server\index.mjs") -WorkingDirectory $shellRoot

  $nodeApiReady = Wait-HttpReady -Url $nodeApiHealth -Seconds 20
  if (-not $nodeApiReady) {
    throw "Node API did not become healthy at $nodeApiDisplayUrl within 20 seconds."
  }

  Write-Host "[2/4] Node API healthy at $nodeApiDisplayUrl" -ForegroundColor Green
}

if (-not $ShellOnly) {
  if (-not (Test-Path $mcpRoot)) {
    throw "mcp-notion path not found: $mcpRoot"
  }
  if (-not (Test-Path $mcpEnv)) {
    throw "Missing $mcpEnv. Set live MCP values before boot."
  }

  if (Test-PortListening -Port 3002) {
    if (Wait-HttpReady -Url $mcpHealth -Seconds 10) {
      Write-Host "[3/4] MCP already healthy at $mcpDisplayUrl" -ForegroundColor Green
    } else {
      throw "Port 3002 is already in use, but the MCP health endpoint is not ready at $mcpDisplayUrl."
    }
  } elseif (Test-HttpReady -Url $mcpHealth) {
    Write-Host "[3/4] MCP already healthy at $mcpDisplayUrl" -ForegroundColor Green
  } else {
    Write-Host "[3/4] Starting mcp-notion clean runtime..." -ForegroundColor Gray
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

    Write-Host "[3/4] MCP healthy at $mcpDisplayUrl" -ForegroundColor Green
  }
} else {
  Write-Host "[3/4] Shell-only mode enabled. Skipping MCP boot." -ForegroundColor Yellow
}

if (Test-HttpReady -Url $shellHealth) {
  Write-Host "[4/4] INOS shell already live at $shellUrl" -ForegroundColor Green
} else {
  Write-Host "[4/4] Starting INOS shell on $shellUrl ..." -ForegroundColor Gray
  Start-VisiblePowerShell -WorkingDirectory $shellRoot -Command "& '$nodeExe' '.\node_modules\vite\bin\vite.js' --host 127.0.0.1 --port 5173"

  $shellReady = Wait-HttpReady -Url $shellHealth -Seconds 20

  if (-not $shellReady) {
    throw "inos-shell did not become ready at $shellUrl within 20 seconds."
  }

  Write-Host "[4/4] INOS shell live at $shellUrl" -ForegroundColor Green
}

Write-Host "------------------------------------------------" -ForegroundColor Cyan
Write-Host "INOS clean boot started." -ForegroundColor Green
Write-Host "Primary UI: $shellUrl" -ForegroundColor Green
Write-Host "Python API: $pythonDisplayUrl" -ForegroundColor DarkCyan
Write-Host "Node API: $nodeApiDisplayUrl" -ForegroundColor DarkCyan
if (-not $ShellOnly) {
  Write-Host "MCP backend: $mcpDisplayUrl" -ForegroundColor DarkCyan
}
