param(
  [int]$Port = 3002,
  [string]$NotionApiKey = ""
)

$ErrorActionPreference = "Stop"

$scriptRoot = $PSScriptRoot
if (-not $scriptRoot) {
  $scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
}
$repoRoot = Split-Path -Parent $scriptRoot   # mcp-notion root, not the scripts subdir
$current = (Get-Location).Path

if ($current -ne $repoRoot) {
  throw "Run this script from $repoRoot (or ensure the parent boot sets the correct working directory). Current directory: $current"
}

$envPath = Join-Path $repoRoot ".env"
$envLocalPath = Join-Path $repoRoot ".env.local"
$existingEnvFiles = @($envPath, $envLocalPath) | Where-Object { Test-Path $_ }

if ($existingEnvFiles.Count -eq 0) {
  throw "Missing .env or .env.local in $repoRoot. Copy env.canonical.example or .env.example and set canonical runtime values before launch."
}

if (-not (Test-Path (Join-Path $repoRoot "dist\\index.js"))) {
  Write-Host "[build] dist/index.js not found. Running npm run build..." -ForegroundColor Yellow
  npm run build
}

$envLocalCarriesToken = $false
if (Test-Path $envLocalPath) {
  $envLocalCarriesToken = [bool](Select-String -Path $envLocalPath -Pattern '^\s*NOTION_API_KEY\s*=\s*.+$' -ErrorAction SilentlyContinue)
}

$envFileCarriesToken = $false
if (Test-Path $envPath) {
  $envFileCarriesToken = [bool](Select-String -Path $envPath -Pattern '^\s*NOTION_API_KEY\s*=\s*.+$' -ErrorAction SilentlyContinue)
}

$approvedFileToken = $envFileCarriesToken

$hasProcessToken = -not [string]::IsNullOrWhiteSpace($env:NOTION_API_KEY)
$hasParamToken = -not [string]::IsNullOrWhiteSpace($NotionApiKey)

if ($envLocalCarriesToken) {
  throw ".env.local should not store NOTION_API_KEY for the clean runtime. Keep non-secret canonical values in .env.local and inject NOTION_API_KEY via the parent process, -NotionApiKey, or an explicitly approved .env file."
}

foreach ($forbiddenKey in @("GOOGLE_APPLICATION_CREDENTIALS", "GEMINI_API_KEY")) {
  if (Test-Path $envLocalPath) {
    if (Select-String -Path $envLocalPath -Pattern ("^\s*{0}\s*=\s*\S+" -f [regex]::Escape($forbiddenKey)) -ErrorAction SilentlyContinue) {
      throw ".env.local must not store $forbiddenKey for the clean runtime. Keep it in the canonical private secret JSON and inject it via the parent process."
    }
  }
}

if ($hasParamToken) {
  $env:NOTION_API_KEY = $NotionApiKey
}

if (-not $hasProcessToken -and -not $hasParamToken -and -not $approvedFileToken) {
  throw "NOTION_API_KEY is not available. Inject it from the parent process, pass -NotionApiKey, or place it in .env if an approved local secret file is required."
}

$env:PORT = "$Port"

Write-Host "[launch] token availability: param=$hasParamToken process=$hasProcessToken approved_env_file=$approvedFileToken" -ForegroundColor DarkCyan
Write-Host "[launch] Starting clean mcp-notion runtime from $repoRoot on port $Port" -ForegroundColor Cyan
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "node"
$psi.Arguments = ".\dist\index.js"
$psi.WorkingDirectory = $repoRoot
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $false
$psi.RedirectStandardError = $false
$psi.Environment["NOTION_API_KEY"] = $env:NOTION_API_KEY
$psi.Environment["PORT"] = "$Port"

foreach ($injectKey in @("GOOGLE_APPLICATION_CREDENTIALS", "GEMINI_API_KEY")) {
  $injectVal = [Environment]::GetEnvironmentVariable($injectKey)
  if (-not [string]::IsNullOrWhiteSpace($injectVal)) {
    $psi.Environment[$injectKey] = $injectVal
  }
}

$proc = [System.Diagnostics.Process]::Start($psi)
$proc.WaitForExit()
exit $proc.ExitCode
