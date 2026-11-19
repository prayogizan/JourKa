<#
.SYNOPSIS
  JourKa quality gate: per-file `uip rpa validate` for every changed .xaml, then
  one project-level `uip rpa build`. Exit code 0 only when both are clean.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File Invoke-JourKaGate.ps1
  powershell -NoProfile -ExecutionPolicy Bypass -File Invoke-JourKaGate.ps1 -Files Main.xaml,Workflows\PublishDossier.xaml
#>
[CmdletBinding()]
param(
    [string]$ProjectDir,
    [string[]]$Files,
    [switch]$SkipBuild
)
$ErrorActionPreference = 'Stop'
if (-not $ProjectDir) {
    # .agents/skills/jourka-uipath-rpa/scripts -> repo root -> JourKa (UiPath project)
    $ProjectDir = (Resolve-Path (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) '..\..\..\..\JourKa')).Path
}

# Resolve uip: PATH first, then the Studio-bundled CLI.
$uip = (Get-Command uip -ErrorAction SilentlyContinue).Source
if (-not $uip) {
    $uip = Get-ChildItem 'C:\Program Files\UiPathPlatform\Studio\*\cli\uip.cmd' -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
}
if (-not $uip) { throw "uip CLI not found. Ask the user to install it (see JourKa/AGENTS.md)." }
Write-Host "uip: $uip"

if (-not $Files) {
    # Changed + untracked .xaml files relative to the project dir.
    Push-Location $ProjectDir
    try {
        $Files = @(git status --porcelain -- '*.xaml' | ForEach-Object { $_.Substring(3).Trim('"') } |
            ForEach-Object { (Resolve-Path (Join-Path (git rev-parse --show-toplevel) $_)).Path } |
            ForEach-Object { $_.Substring($ProjectDir.Length).TrimStart('\') })
    } finally { Pop-Location }
} else {
    $Files = @($Files | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() } | Where-Object { $_ })
}

$failed = $false
$prevEap = $ErrorActionPreference
foreach ($f in $Files) {
    Write-Host "`n=== validate $f ==="
    $ErrorActionPreference = 'Continue'
    $out = & $uip rpa validate --project-dir $ProjectDir --file-path $f --min-severity error --output json 2>&1 | Out-String
    $ec = $LASTEXITCODE
    $ErrorActionPreference = $prevEap
    Write-Host $out
    # Clean baseline looks like: {"Result":"Success", "Data":{"message":"No diagnostics found."}}
    if ($ec -ne 0 -or $out -notmatch '"Result"\s*:\s*"Success"' -or $out -match '"Severity"\s*:\s*"Error"') { $failed = $true }
}

if (-not $SkipBuild) {
    Write-Host "`n=== build $ProjectDir ==="
    $ErrorActionPreference = 'Continue'
    $buildOut = & $uip rpa build $ProjectDir --output json 2>&1 | Out-String
    $ec = $LASTEXITCODE
    $ErrorActionPreference = $prevEap
    Write-Host $buildOut
    if ($ec -ne 0) { $failed = $true }
}

if ($failed) { Write-Host "`nGATE: FAILED" -ForegroundColor Red; exit 1 }
Write-Host "`nGATE: PASSED" -ForegroundColor Green
