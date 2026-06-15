param(
  [int]$Port = 3002,
  [string]$NotionApiKey = ""
)

$ErrorActionPreference = "Stop"

$repoRoot = "C:\dev\The-Infinite-Network\Operating-System\mcp\mcp-notion"
$current = (Get-Location).Path

if ($current -ne $repoRoot) {
  throw "Run this script from $repoRoot. Current directory: $current"
}

$envPath = Join-Path $repoRoot ".env"
$envLocalPath = Join-Path $repoRoot ".env.local"
$existingEnvFiles = @($envPath, $envLocalPath) | Where-Object { Test-Path $_ }

if ($existingEnvFiles.Count -eq 0) {
  throw "Missing .env or .env.local in $repoRoot. Copy env.canonical.example or .env.example and set live values before launch."
}

if (-not (Test-Path (Join-Path $repoRoot "dist\\index.js"))) {
  Write-Host "[build] dist/index.js not found. Running npm run build..." -ForegroundColor Yellow
  npm run build
}

$hasProcessToken = -not [string]::IsNullOrWhiteSpace($env:NOTION_API_KEY)
$hasParamToken = -not [string]::IsNullOrWhiteSpace($NotionApiKey)

if ($hasParamToken) {
  $env:NOTION_API_KEY = $NotionApiKey
}

$hasFileToken = [bool](Select-String -Path $existingEnvFiles -Pattern '^\s*NOTION_API_KEY\s*=\s*.+$' -ErrorAction SilentlyContinue)

if (-not $hasProcessToken -and -not $hasParamToken -and -not $hasFileToken) {
  throw "NOTION_API_KEY is not available. Set it in .env/.env.local, pass -NotionApiKey, or launch from a process that already has NOTION_API_KEY."
}

$env:PORT = "$Port"

Write-Host "[launch] token availability: param=$hasParamToken process=$hasProcessToken file=$hasFileToken" -ForegroundColor DarkCyan
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

$proc = [System.Diagnostics.Process]::Start($psi)
$proc.WaitForExit()
exit $proc.ExitCode
