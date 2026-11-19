<#
.SYNOPSIS
  Extract / inject the VB.NET body of a <ui:InvokeCode> activity in a XAML file
  WITHOUT reformatting the rest of the file (Studio view-state stays untouched).

.DESCRIPTION
  JourKa keeps most logic inside InvokeCode `Code="..."` attributes, where every
  newline is `&#xA;`, quotes are `&quot;`, `&` is `&amp;`, `<` is `&lt;`.
  Hand-editing that is error-prone. This tool:
    list    -> lists every InvokeCode IdRef + DisplayName in the file
    extract -> decodes Code="..." of one IdRef into a plain .vb file
    inject  -> re-encodes the .vb file and replaces ONLY that attribute value
  Extracted files go to <project>/.local/invokecode/ (git-ignored) by default.

  Round-trip guarantee: extract -> inject with no edits is byte-identical, except
  that any hand-written raw '>' inside Code="..." is normalized to '&gt;'
  (Studio's canonical form; semantically identical XML).

  Run with:  powershell -NoProfile -ExecutionPolicy Bypass -File InvokeCodeTool.ps1 ...
  (machine policy blocks unsigned scripts; Bypass is process-scoped only).

.EXAMPLE
  .\InvokeCodeTool.ps1 list    -Xaml D:\UiPathProject\JourKa\JourKa\Main.xaml
  .\InvokeCodeTool.ps1 extract -Xaml ...\Main.xaml -IdRef InvokeCode_1
  .\InvokeCodeTool.ps1 inject  -Xaml ...\Main.xaml -IdRef InvokeCode_1
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory, Position = 0)][ValidateSet('list', 'extract', 'inject')][string]$Action,
    [Parameter(Mandatory)][string]$Xaml,
    [string]$IdRef,
    [string]$VbFile
)
$ErrorActionPreference = 'Stop'
$Xaml = (Resolve-Path $Xaml).Path
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$raw = [System.IO.File]::ReadAllText($Xaml)

# Match each InvokeCode start tag (attribute values never contain a raw '"').
$tagRegex = [regex]'<ui:InvokeCode\b[^>]*?(?:"[^"]*"[^>]*?)*>'
function Get-Attr([string]$tag, [string]$name) {
    $m = [regex]::Match($tag, '\s' + [regex]::Escape($name) + '="([^"]*)"')
    if ($m.Success) { return $m } else { return $null }
}

$tags = foreach ($m in $tagRegex.Matches($raw)) {
    $id = Get-Attr $m.Value 'sap2010:WorkflowViewState.IdRef'
    $dn = Get-Attr $m.Value 'DisplayName'
    [pscustomobject]@{
        Match = $m
        IdRef = if ($id) { $id.Groups[1].Value } else { '' }
        DisplayName = if ($dn) { [System.Net.WebUtility]::HtmlDecode($dn.Groups[1].Value) } else { '' }
    }
}

if ($Action -eq 'list') {
    $tags | Select-Object IdRef, DisplayName | Format-Table -AutoSize
    return
}
if (-not $IdRef) { throw "-IdRef is required for '$Action'." }
$target = @($tags | Where-Object IdRef -eq $IdRef)
if ($target.Count -ne 1) { throw "Expected exactly 1 InvokeCode with IdRef '$IdRef', found $($target.Count)." }
$target = $target[0]

if (-not $VbFile) {
    $projDir = Split-Path $Xaml
    while ($projDir -and -not (Test-Path (Join-Path $projDir 'project.json'))) { $projDir = Split-Path $projDir }
    if (-not $projDir) { $projDir = Split-Path $Xaml }
    $outDir = Join-Path $projDir '.local\invokecode'
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
    $VbFile = Join-Path $outDir ("{0}__{1}.vb" -f [IO.Path]::GetFileNameWithoutExtension($Xaml), $IdRef)
}

$codeAttr = Get-Attr $target.Match.Value 'Code'
if (-not $codeAttr) { throw "InvokeCode '$IdRef' has no inline Code attribute." }

if ($Action -eq 'extract') {
    $decoded = [System.Net.WebUtility]::HtmlDecode($codeAttr.Groups[1].Value)
    $decoded = $decoded -replace "`r`n", "`n"
    [System.IO.File]::WriteAllText($VbFile, ($decoded -replace "`n", "`r`n"), $utf8NoBom)
    Write-Host "Extracted '$IdRef' ($($target.DisplayName)) -> $VbFile"
    return
}

# inject
if (-not (Test-Path $VbFile)) { throw "VB file not found: $VbFile (run extract first)." }
$code = [System.IO.File]::ReadAllText($VbFile) -replace "`r`n", "`n"
$encoded = $code.Replace('&', '&amp;').Replace('<', '&lt;').Replace('>', '&gt;').Replace('"', '&quot;').Replace("`t", '&#x9;').Replace("`n", '&#xA;')

$tagStart = $target.Match.Index
$valStart = $tagStart + $codeAttr.Groups[1].Index
$valLen = $codeAttr.Groups[1].Length
$newRaw = $raw.Substring(0, $valStart) + $encoded + $raw.Substring($valStart + $valLen)

$hasBom = $false
$bytes = [System.IO.File]::ReadAllBytes($Xaml)
if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) { $hasBom = $true }
$enc = New-Object System.Text.UTF8Encoding($hasBom)
[System.IO.File]::WriteAllText($Xaml, $newRaw, $enc)

# Sanity: file must still be well-formed XML.
try { [void]([xml][System.IO.File]::ReadAllText($Xaml)) }
catch { [System.IO.File]::WriteAllText($Xaml, $raw, $enc); throw "Injection produced malformed XML; original restored. $_" }
Write-Host "Injected $VbFile -> '$IdRef' in $Xaml (XML well-formed). Now run: uip rpa validate --file-path <rel>"
