param(
  [switch]$ShellOnly,
  [switch]$VisibleMcp,
  [string]$SecretFile = "$env:USERPROFILE\.infinite-network\secrets\inos-runtime.json"
)

$ErrorActionPreference = "Stop"

# --- GUI pop-up prompt for VisibleMcp (when not passed on command line) ---
if (-not $PSBoundParameters.ContainsKey('VisibleMcp') -and -not $PSBoundParameters.ContainsKey('ShellOnly')) {
    try {
        $wshell = New-Object -ComObject Wscript.Shell
        $result = $wshell.Popup(
            "Run the mcp-notion clean runtime in a visible PowerShell window?`n`n(Yes = visible for debugging, No = hidden)",
            0,
            "INOS Clean Boot",
            4  # 4 = Yes/No buttons
        )
        # 6 = Yes, 7 = No
        if ($result -eq 6) {
            $VisibleMcp = $true
        }
    } catch {
        Write-Host "Could not show pop-up dialog, defaulting to hidden MCP. ($($_.Exception.Message))" -ForegroundColor Yellow
    }
}

# Resolve root dynamically so the script works when invoked from anywhere (npm, direct, etc.)
$scriptRoot = $PSScriptRoot
if (-not $scriptRoot) {
  $scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
}
$root = $scriptRoot

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
$mcpFulcrumSchemaUrl = "http://127.0.0.1:3002/api/v1/fulcrum/capability-registry/schema"
$shellUrl = "http://localhost:5173"
$shellHealth = "http://127.0.0.1:5173/"
$shellEntry = Join-Path $shellRoot "node_modules\vite\bin\vite.js"
$nodeExe = (Get-Command node -ErrorAction Stop).Source

function Get-PrivateSecrets {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    throw "Missing private secret file: $Path"
  }

  try {
    $parsed = Get-Content -Raw -Path $Path | ConvertFrom-Json
  } catch {
    throw "Failed to parse private secret file '$Path'. Expected JSON object of key/value pairs."
  }

  if (-not $parsed) {
    throw "Private secret file is empty: $Path"
  }

  $secretMap = @{}
  foreach ($property in $parsed.PSObject.Properties) {
    $key = [string]$property.Name
    $value = if ($null -eq $property.Value) { "" } else { [string]$property.Value }
    if ([string]::IsNullOrWhiteSpace($key)) {
      continue
    }
    $secretMap[$key] = $value
  }

  if ($secretMap.Count -eq 0) {
    throw "Private secret file is empty: $Path"
  }

  if (-not $secretMap.ContainsKey("NOTION_API_KEY") -or [string]::IsNullOrWhiteSpace($secretMap["NOTION_API_KEY"])) {
    throw "Private secret file '$Path' must contain NOTION_API_KEY."
  }

  return $secretMap
}

function New-ProcessStartInfo {
  param(
    [string]$FilePath,
    [string[]]$ArgumentList,
    [string]$WorkingDirectory,
    [bool]$Visible = $false,
    [hashtable]$EnvironmentOverrides
  )

  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $FilePath
  $psi.WorkingDirectory = $WorkingDirectory
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = -not $Visible

  if ($ArgumentList) {
    $escapedArguments = foreach ($argument in $ArgumentList) {
      if ($null -eq $argument) {
        '""'
      } else {
        $stringValue = [string]$argument
        if ($stringValue -match '[\s"]') {
          '"' + ($stringValue -replace '"', '\"') + '"'
        } else {
          $stringValue
        }
      }
    }

    $psi.Arguments = ($escapedArguments -join ' ')
  }

  if ($EnvironmentOverrides) {
    foreach ($entry in $EnvironmentOverrides.GetEnumerator()) {
      $psi.Environment[$entry.Key] = [string]$entry.Value
    }
  }

  return $psi
}

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

function Get-ListeningProcessInfo {
  param([int]$Port)

  $conn = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $conn) {
    return $null
  }

  $ownerPid = $conn.OwningProcess
  if (-not $ownerPid) {
    return $null
  }

  return Get-CimInstance Win32_Process -Filter "ProcessId = $ownerPid" -ErrorAction SilentlyContinue
}

function Test-McpFulcrumSchemaRoute {
  param([string]$Url)

  try {
    $null = Invoke-WebRequest -Uri $Url -Method Post -ContentType "application/json" -Body "{}" -UseBasicParsing -TimeoutSec 3
    return $true
  } catch {
    $httpResponse = $_.Exception.Response
    if ($httpResponse) {
      try {
        $statusCode = [int]$httpResponse.StatusCode
      } catch {
        $statusCode = $null
      }

      if ($statusCode -eq 404) {
        return $false
      }

      if ($statusCode) {
        return $true
      }
    }

    return $false
  }
}

function Restart-StaleMcpRuntime {
  param([string]$RootPath)

  $proc = Get-ListeningProcessInfo -Port 3002
  if (-not $proc) {
    return
  }

  $commandLine = [string]$proc.CommandLine
  $isLocalMcpProcess =
    $proc.Name -match '^node(\.exe)?$' -and (
      $commandLine -match 'mcp-notion' -or
      $commandLine -match 'dist\\index\.js' -or
      $commandLine -match 'src\\index\.ts'
    )

  if (-not $isLocalMcpProcess) {
    throw "Port 3002 is occupied by a process that does not look like the local mcp-notion runtime. ProcessId=$($proc.ProcessId) Name=$($proc.Name) CommandLine=$commandLine"
  }

  Write-Host "[3/4] Retiring stale MCP runtime on port 3002 (PID $($proc.ProcessId))..." -ForegroundColor Yellow
  Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop

  for ($i = 0; $i -lt 10; $i++) {
    if (-not (Test-PortListening -Port 3002)) {
      return
    }
    Start-Sleep -Milliseconds 500
  }

  throw "Stale MCP runtime on port 3002 did not exit cleanly after forced stop."
}

function Start-VisiblePowerShell {
  param(
    [string]$WorkingDirectory,
    [string]$Command,
    [hashtable]$EnvironmentOverrides,
    [string]$WindowTitle = "PowerShell"
  )

  # Temporarily set env vars in parent so child inherits them (avoids putting secrets in command line)
  $originalEnv = @{}
  if ($EnvironmentOverrides) {
    foreach ($entry in $EnvironmentOverrides.GetEnumerator()) {
      $key = $entry.Key
      $originalEnv[$key] = [Environment]::GetEnvironmentVariable($key)
      [Environment]::SetEnvironmentVariable($key, $entry.Value)
    }
  }

  $fullCommand = "Set-Location '$WorkingDirectory'; `$host.ui.RawUI.WindowTitle = '$WindowTitle'; $Command"

  $argList = @(
    "-NoProfile",
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", $fullCommand
  )

  Start-Process -FilePath "powershell.exe" -ArgumentList $argList -WorkingDirectory $WorkingDirectory -WindowStyle Normal

  # Restore original env
  if ($EnvironmentOverrides) {
    foreach ($entry in $EnvironmentOverrides.GetEnumerator()) {
      [Environment]::SetEnvironmentVariable($entry.Key, $originalEnv[$entry.Key])
    }
  }
}

function Start-HiddenPowerShell {
  param(
    [string]$WorkingDirectory,
    [string]$Command,
    [hashtable]$EnvironmentOverrides
  )

  $psi = New-ProcessStartInfo -FilePath "powershell" -ArgumentList @(
    "-ExecutionPolicy", "Bypass",
    "-Command", "Set-Location '$WorkingDirectory'; $Command"
  ) -WorkingDirectory $WorkingDirectory -EnvironmentOverrides $EnvironmentOverrides

  [void][System.Diagnostics.Process]::Start($psi)
}

function Start-HiddenProcess {
  param(
    [string]$FilePath,
    [string[]]$ArgumentList,
    [string]$WorkingDirectory,
    [hashtable]$EnvironmentOverrides
  )

  $psi = New-ProcessStartInfo -FilePath $FilePath -ArgumentList $ArgumentList -WorkingDirectory $WorkingDirectory -EnvironmentOverrides $EnvironmentOverrides
  [void][System.Diagnostics.Process]::Start($psi)
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

$secretEnv = Get-PrivateSecrets -Path $SecretFile
Write-Host "[secrets] Loaded private runtime secrets from $SecretFile" -ForegroundColor DarkCyan

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
  Start-HiddenProcess -FilePath $pythonExe -ArgumentList @("-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000") -WorkingDirectory $pythonApiRoot -EnvironmentOverrides $secretEnv

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
  Start-HiddenProcess -FilePath $nodeExe -ArgumentList @(".\server\index.mjs") -WorkingDirectory $shellRoot -EnvironmentOverrides $secretEnv

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
    throw "Missing $mcpEnv. Set canonical non-secret MCP values before boot. Secrets are loaded from the private machine-only file at $SecretFile."
  }

  $shouldStartMcp = $false

  if (Test-PortListening -Port 3002) {
    if (Wait-HttpReady -Url $mcpHealth -Seconds 10) {
      if (Test-McpFulcrumSchemaRoute -Url $mcpFulcrumSchemaUrl) {
        Write-Host "[3/4] MCP already healthy at $mcpDisplayUrl" -ForegroundColor Green
      } else {
        Restart-StaleMcpRuntime -RootPath $mcpRoot
        $shouldStartMcp = $true
      }
    } else {
      throw "Port 3002 is already in use, but the MCP health endpoint is not ready at $mcpDisplayUrl."
    }
  } elseif (Test-HttpReady -Url $mcpHealth) {
    if (Test-McpFulcrumSchemaRoute -Url $mcpFulcrumSchemaUrl) {
      Write-Host "[3/4] MCP already healthy at $mcpDisplayUrl" -ForegroundColor Green
    } else {
      Restart-StaleMcpRuntime -RootPath $mcpRoot
      $shouldStartMcp = $true
    }
  } else {
    $shouldStartMcp = $true
  }

  if ($shouldStartMcp -or $VisibleMcp) {
    if (Test-PortListening -Port 3002) {
      Restart-StaleMcpRuntime -RootPath $mcpRoot
    }
    Write-Host "[3/4] Starting mcp-notion clean runtime..." -ForegroundColor Gray
    $mcpScriptsDir = Join-Path $mcpRoot "scripts"
    $mcpCommand = ".\start_clean_runtime.ps1"
    if ($VisibleMcp) {
      Start-VisiblePowerShell -WorkingDirectory $mcpScriptsDir -Command $mcpCommand -EnvironmentOverrides $secretEnv -WindowTitle "INOS MCP Visible"
    } else {
      Start-HiddenPowerShell -WorkingDirectory $mcpScriptsDir -Command $mcpCommand -EnvironmentOverrides $secretEnv
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
  Start-VisiblePowerShell -WorkingDirectory $shellRoot -Command "& '$nodeExe' '.\node_modules\vite\bin\vite.js' --host 127.0.0.1 --port 5173" -EnvironmentOverrides $secretEnv -WindowTitle "INOS Shell"

  # Give Vite a moment to initialize the dev server
  Start-Sleep -Seconds 5
  $shellReady = Wait-HttpReady -Url $shellHealth -Seconds 90

  if (-not $shellReady) {
    throw "inos-shell did not become ready at $shellUrl within 90 seconds."
  }

  Write-Host "[4/4] INOS shell live at $shellUrl" -ForegroundColor Green
}

# Safe capture of PS console history and open in notepad (after shell is live)
# This prevents crash if PSConsoleReadLine not initialized, and ensures timing after 5173 is live
try {
  if (Get-Module -ListAvailable -Name PSReadLine) {
    Import-Module PSReadLine -ErrorAction SilentlyContinue | Out-Null
    $historyItems = [Microsoft.PowerShell.PSConsoleReadLine]::GetHistoryItems()
    if ($historyItems -and $historyItems.Count -gt 0) {
      $temp = [System.IO.Path]::GetTempFileName() + ".txt"
      $historyItems | ForEach-Object { $_.CommandLine } | Out-File -FilePath $temp -Encoding UTF8
      Write-Host "History captured. Opening notepad: $temp" -ForegroundColor Yellow
      Start-Process notepad.exe $temp -WindowStyle Normal
    } else {
      Write-Host "No history items to capture." -ForegroundColor Yellow
    }
  } else {
    Write-Host "PSReadLine module not available for history capture." -ForegroundColor Yellow
  }
} catch {
  Write-Host "Failed to capture history or open notepad: $_" -ForegroundColor Yellow
}

# --- Smoke Test ---
Write-Host ""
Write-Host "=== SMOKE TEST ===" -ForegroundColor Cyan

$allGood = $true

if (Test-HttpReady -Url $pythonHealth) {
    Write-Host "[+] Python API healthy" -ForegroundColor Green
} else {
    Write-Host "[-] Python API not responding" -ForegroundColor Red
    $allGood = $false
}

if (Test-HttpReady -Url $nodeApiHealth) {
    Write-Host "[+] Node API healthy" -ForegroundColor Green
} else {
    Write-Host "[-] Node API not responding" -ForegroundColor Red
    $allGood = $false
}

if (-not $ShellOnly) {
    if (Test-HttpReady -Url $mcpHealth) {
        Write-Host "[+] MCP backend healthy" -ForegroundColor Green
    } else {
        Write-Host "[-] MCP backend not responding" -ForegroundColor Red
        $allGood = $false
    }
}

if (Test-HttpReady -Url $shellHealth) {
    Write-Host "[+] INOS shell live" -ForegroundColor Green
} else {
    Write-Host "[-] INOS shell not responding" -ForegroundColor Red
    $allGood = $false
}

if ($allGood) {
    Write-Host "Smoke test PASSED" -ForegroundColor Green
} else {
    Write-Host "Smoke test had issues - check logs" -ForegroundColor Red
}

Write-Host "------------------------------------------------" -ForegroundColor Cyan
Write-Host "INOS clean boot started." -ForegroundColor Green
Write-Host "Primary UI: $shellUrl" -ForegroundColor Green
Write-Host "Python API: $pythonDisplayUrl" -ForegroundColor DarkCyan
Write-Host "Node API: $nodeApiDisplayUrl" -ForegroundColor DarkCyan
if (-not $ShellOnly) {
  Write-Host "MCP backend: $mcpDisplayUrl" -ForegroundColor DarkCyan
}
