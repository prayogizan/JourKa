<#
.SYNOPSIS
  Project-local UiPath skill manager for JourKa (D:\UiPathProject\JourKa\.agents\skills).
  Audits required skills, extracts core official UiPath skills from Studio's bundled
  skills.tgz (without 800-file legacy bloat), and scaffolds new project-specific skills.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File Ensure-UiPathSkills.ps1 -Audit
  powershell -NoProfile -ExecutionPolicy Bypass -File Ensure-UiPathSkills.ps1 -EnsureCore
  powershell -NoProfile -ExecutionPolicy Bypass -File Ensure-UiPathSkills.ps1 -ExtractOfficial uipath-platform
  powershell -NoProfile -ExecutionPolicy Bypass -File Ensure-UiPathSkills.ps1 -CreateSkill jourka-interactive-html -Domain fe -Description "Use when editing DossierInteractiveTemplate.html or implementing JK-FE-003..009 / JK-RPA-002."
#>
[CmdletBinding()]
param(
    [switch]$Audit,
    [switch]$EnsureCore,
    [string[]]$ExtractOfficial,
    [string]$CreateSkill,
    [ValidateSet('rpa', 'fe', 'test', 'data', 'general')][string]$Domain = 'rpa',
    [string]$Description
)
$ErrorActionPreference = 'Stop'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$skillsRoot = (Resolve-Path (Join-Path $scriptDir '..\..')).Path
$repoRoot = (Resolve-Path (Join-Path $skillsRoot '..\..')).Path

$tgz = Get-ChildItem 'C:\Program Files\UiPathPlatform\Studio\*\cli\skills.tgz' -ErrorAction SilentlyContinue |
    Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName

function Write-Utf8File([string]$Path, [string]$Text) {
    $dir = Split-Path -Parent $Path
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    [System.IO.File]::WriteAllText($Path, ($Text -replace "`r`n", "`n" -replace "`n", "`r`n"), $utf8NoBom)
}

function Extract-TgzEntry([string]$ArchivePath, [string]$OutFile) {
    if (-not $tgz) { throw "Studio skills.tgz not found under C:\Program Files\UiPathPlatform\Studio\*\cli\skills.tgz" }
    $dir = Split-Path -Parent $OutFile
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $content = & tar -zxf $tgz -O $ArchivePath 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $content) { return $false }
    Write-Utf8File $OutFile ($content -join "`n")
    return $true
}

if ($EnsureCore) {
    Write-Host "Ensuring core project-local UiPath skills in $skillsRoot ..."
    # 1. uipath-rpa: core SKILL.md + essential Modern Windows XAML & InvokeCode references (skipping 780 legacy activity docs)
    $rpaEntries = @(
        'SKILL.md',
        'references/cli-reference.md',
        'references/common-activity-card.md',
        'references/common-pattern-card.md',
        'references/data-manipulation-guide.md',
        'references/error-handling-guide.md',
        'references/execution-maps-guide.md',
        'references/testing-guide.md',
        'references/xaml/xaml-basics-and-rules.md',
        'references/xaml/xaml-editing-catalog.md',
        'references/xaml/common-pitfalls.md',
        'references/legacy/activity-docs/_INVOKE-CODE.md'
    )
    foreach ($rel in $rpaEntries) {
        $dst = Join-Path $skillsRoot ("uipath-rpa\" + ($rel -replace '/', '\'))
        if (-not (Test-Path $dst)) {
            [void](Extract-TgzEntry "package/skills/uipath-rpa/$rel" $dst)
        }
    }

    # 2. uipath-planner: SKILL.md + plan-and-tasks-format.md
    $plannerEntries = @(
        'SKILL.md',
        'references/plan-and-tasks-format.md',
        'references/non-pdd-lane-guide.md'
    )
    foreach ($rel in $plannerEntries) {
        $dst = Join-Path $skillsRoot ("uipath-planner\" + ($rel -replace '/', '\'))
        if (-not (Test-Path $dst)) {
            [void](Extract-TgzEntry "package/skills/uipath-planner/$rel" $dst)
        }
    }

    # 3. uipath-review: SKILL.md + RPA review checklists
    $reviewEntries = @(
        'SKILL.md',
        'references/rpa/rpa-review-checklist.md',
        'references/rpa/rpa-common-issues.md',
        'references/rpa/modern-studio-issues.md'
    )
    foreach ($rel in $reviewEntries) {
        $dst = Join-Path $skillsRoot ("uipath-review\" + ($rel -replace '/', '\'))
        if (-not (Test-Path $dst)) {
            [void](Extract-TgzEntry "package/skills/uipath-review/$rel" $dst)
        }
    }
    Write-Host "Core official skills ensured: uipath-rpa, uipath-planner, uipath-review."
}

if ($ExtractOfficial) {
    foreach ($s in ($ExtractOfficial | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() } | Where-Object { $_ })) {
        $dst = Join-Path $skillsRoot "$s\SKILL.md"
        $ok = Extract-TgzEntry "package/skills/$s/SKILL.md" $dst
        if ($ok) { Write-Host "Extracted official skill '$s' -> $dst" }
        else { Write-Warning "Skill '$s' not found in $tgz" }
    }
}

if ($CreateSkill) {
    $skillName = $CreateSkill.Trim().ToLowerInvariant() -replace '[^a-z0-9\-]', '-'
    $skillDir = Join-Path $skillsRoot $skillName
    $skillMd = Join-Path $skillDir 'SKILL.md'
    if (-not $Description) {
        $Description = "Project-local JourKa skill for $skillName ($Domain domain). Activate when tasks touch $skillName components or workflows."
    }
    if (-not (Test-Path $skillMd)) {
        New-Item -ItemType Directory -Force -Path (Join-Path $skillDir 'references') | Out-Null
        $template = @"
---
name: $skillName
description: >-
  $Description
---

# $skillName (JourKa Project-Local Skill)

## 1. When to Activate
$Description

## 2. Mandatory Pre-Flight & Planning
1. Load [jourka-uipath-rpa](../jourka-uipath-rpa/SKILL.md) for JourKa repository invariants.
2. Follow [plan-template.md](../jourka-uipath-rpa/resources/plan-template.md) before modifying project files.
3. Verify required skills via `Ensure-UiPathSkills.ps1 -Audit`.

## 3. Domain Rules & Workflow ($Domain)
- Keep `.md` and `.pdf` generation pipelines untouched unless explicitly scoped.
- Preserve bilingual (`EN` / `ID`) structural and functional parity.
- For XAML / `InvokeCode` edits, use `../jourka-uipath-rpa/scripts/InvokeCodeTool.ps1` (`extract` -> edit `.vb` -> `inject`).

## 4. Verification Gate
- Run `../jourka-uipath-rpa/scripts/Invoke-JourKaGate.ps1` (`uip rpa validate` + `uip rpa build`).
- Confirm `git status --short -- JourKa/Output PDF_Results` shows zero unintended artifact modifications.
"@
        Write-Utf8File $skillMd $template
        Write-Host "Created project-local skill '$skillName' -> $skillMd"
    } else {
        Write-Host "Skill '$skillName' already exists at $skillMd"
    }
}

if ($Audit -or (-not $EnsureCore -and -not $ExtractOfficial -and -not $CreateSkill)) {
    $installed = Get-ChildItem $skillsRoot -Directory | ForEach-Object {
        $md = Join-Path $_.FullName 'SKILL.md'
        $desc = ''
        if (Test-Path $md) {
            $raw = [System.IO.File]::ReadAllText($md)
            $m = [regex]::Match($raw, '(?ms)^---\s*.*?description:\s*(?:>-\s*)?(.+?)\r?\n(?:[a-zA-Z0-9_-]+:|---)')
            if ($m.Success) { $desc = ($m.Groups[1].Value -replace '\s+', ' ').Trim() }
        }
        [pscustomobject]@{
            Skill = $_.Name
            HasSkillMd = (Test-Path $md)
            Files = @(Get-ChildItem $_.FullName -Recurse -File).Count
            Description = if ($desc.Length -gt 95) { $desc.Substring(0, 92) + '...' } else { $desc }
        }
    }
    $installed | Format-Table -AutoSize
}
