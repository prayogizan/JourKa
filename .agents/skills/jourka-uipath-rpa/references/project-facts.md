# JourKa Project Facts (verified 2026-11-19 on branch `feat/jk-rpa-001-decoupled-html-pipeline`)

Re-verify anything marked *(drifts)* before relying on it.

## Layout
| Path | Role |
|---|---|
| `JourKa/project.json` | Manifest. `targetFramework: Windows`, `dotNetVersion: net10.0`, `expressionLanguage: VisualBasic`, entry `Main.xaml`. Never change language/framework. |
| `JourKa/Main.xaml` | Orchestrator. Reads `Desire Role List.xlsx` (Workbook `ReadRange`, no Excel licence), `ForEachRow`, per-row `TryCatch_1`. |
| `JourKa/Workflows/ResearchAbroadJobs.xaml` | **Invoked** by Main (inside `TryCatch_Abroad`). Args: `in_RoleName`, `in_ExtraKeywords`, `in_AbroadMarkets`, `out_AbroadEvidenceText`, `out_AbroadCount`. |
| `JourKa/Workflows/{ResearchJobBoards,ResearchYouTubeRoutine,GenerateDossier,PublishDossier}.xaml` | **Standalone reference** workflows — NOT invoked by Main. Their logic is duplicated inside Main's `InvokeCode_1`. |
| `JourKa/Templates/` | Does not exist yet; created by JK-RPA-001. |
| `JourKa/Output/<Role>/<Role> - {EN,ID}.{md,html,pdf}` | Committed artifacts (7 roles × 6 files). |
| `PDF_Results/<Role> - {EN,ID}.pdf` | Consolidated PDFs; `pdfOutputDir` is hardcoded `D:\UiPathProject\JourKa\PDF_Results`. |
| `JourKa/.local/` | Generated, git-ignored. Safe scratch (InvokeCodeTool writes here). |

## InvokeCode inventory *(drifts)*
| File | IdRef | Purpose |
|---|---|---|
| Main.xaml | `InvokeCode_EnsureCols` | Adds `AbroadMarkets` column if missing. |
| Main.xaml | `InvokeCode_1` | Scrape LinkedIn+YouTube → Gemini EN → Gemini ID (+heading/URL validation) → `publishDossier` lambda (`Action(Of String,String,String,String,String)` = md, mdFile, htmlFile, pdfFile, langCode) called for EN then ID. |
| PublishDossier.xaml | `InvokeCode_1` | Older, simpler publish (no banner, `--virtual-time-budget=3000`, no role-folder PDF copy). Has **no** `Language` attribute (defaults VBNet). |

`Main.xaml/InvokeCode_1` arguments: `in_RoleName, in_RoleLevel, in_RoleLocation, in_ExtraKeywords, in_AbroadMarkets, in_RoleFolder, in_MarkdownPath, in_HtmlPath, in_PdfPath, in_MarkdownPathID, in_HtmlPathID, in_PdfPathID, in_AbroadEvidenceText, in_AbroadCount (Int32), in_GeminiApiKey, in_GeminiEndpoint, out_DossierMarkdown, out_DossierMarkdownID`.

`PublishDossier.xaml` public contract (keep stable): `in_RoleName, in_DossierMarkdown, in_RoleFolder, in_MarkdownPath, in_HtmlPath, in_PdfPath` (In String), `out_PdfExists` (Out Boolean).

## Path semantics
- In Studio runs `Environment.CurrentDirectory` = project folder `D:\UiPathProject\JourKa\JourKa`.
- `roleFolder = <project>\Output\<safeRoleName>`; so `<roleFolder>\..\..\Templates` = `<project>\Templates`.
- EN/ID PDFs are written to `PDF_Results\` first, then copied into `roleFolder`.

## Current HTML/PDF coupling (pre JK-RPA-001)
`publishDossier` builds one A4 print HTML (banner + meta pills + `marked` from jsDelivr CDN rendering a hidden `<textarea id='m'>`), writes it to `htmlFile`, then runs
`chrome.exe --headless --disable-gpu --no-pdf-header-footer --virtual-time-budget=4000 --print-to-pdf="<pdf>" "<htmlFile>"` with `WaitForExit(60000)`.
Chrome path hardcoded: `C:\Program Files\Google\Chrome\Application\chrome.exe`.

## Tooling
- `uip` 1.205.0: `C:\Program Files\UiPathPlatform\Studio\26.10.0-cloud.25715\cli\uip.cmd` (not on PATH). Auto-starts headless Studio.
  - `uip rpa validate --project-dir <p> --file-path <rel> --min-severity error --output json`
  - `uip rpa build <p> --output json`
- Activity compiler: `...\Studio\26.10.0-cloud.25715\UiPath.ActivityCompiler.CommandLine.exe`.
- PowerShell execution policy blocks unsigned scripts → use `powershell -NoProfile -ExecutionPolicy Bypass -File <script>`.
- Git: remote `origin` = github.com/prayogizan/JourKa, default branch `master`, integration branch `pre-master`.

## Epic map (open issues)
| # | Ticket | Owns | Depends on |
|---|---|---|---|
| 3 | JK-RPA-001 | Decoupled `.html` (template) vs `%TEMP%` print HTML for `.pdf`; Main + PublishDossier; template **token contract** | — |
| 4 | JK-RPA-002 | `If_2.Then` HTML-only v2 upgrade + backfill 14 existing HTMLs | 001, FE-003..009 |
| 5 | JK-FE-003 | Full template shell, tokens, theme, layout | — |
| 6 | JK-FE-004 | Markdown parser + offline fallback + section normalizer | 003 |
| 7 | JK-FE-005 | Bento KPI grid | 003, 004 |
| 8 | JK-FE-006 | Tier-1 accordions | 003, 004 |
| 9 | JK-FE-007 | Tier-2 expandables | 004, 006 |
| 10 | JK-FE-008 | Steppers, citation popovers, table filters | 004, 006 |
| 11 | JK-FE-009 | TOC, search, view mode, EN/ID toggle, print CSS | 003, 006, 007 |
