# [JK-FE-008] Interactive Visualizations: ASCII-to-Stepper Flow Converter, Citation Popovers & Filterable Tables — Implementation Plan

> **Issue / Source:** `https://github.com/prayogizan/JourKa/issues/10` (`#10`, retrieved via GitHub MCP `get_issue`)
> **Git Branch:** `feat/jk-fe-008-interactive-steppers-citations-tables` *(checked out on `cf722b5`, including merged PRs `#12`–`#18`: `JK-RPA-001`, `JK-RPA-002`, `JK-FE-003`–`JK-FE-007`)*
> **Epic:** `EPIC-JK-INT` — Interactive Visualizations, Search, Navigation & `EN ↔ ID` Switcher · **Priority / Points:** `P1 (High) / 5 pts`
> **Project Root:** `D:\UiPathProject\JourKa\JourKa` (`project.json`)
> **Project Type:** `Modern Windows XAML Process` (`targetFramework: Windows`, `dotNetVersion: net10.0`, frontend template asset: 100% self-contained single-file HTML5/CSS/JS)
> **Expression Language:** `VisualBasic` *(`0` `.xaml` edits in this ticket; 8-token VB.NET `.Replace()` contract preserved verbatim)*
> **Execution Autonomy:** `interactive`
> **UI Targeting:** `N/A (static HTML5/CSS/JS template authoring; no UiPath UIA selectors or desktop capture)`
> **Canonical Plan Path:** `JourKa/docs/plans/2026-11-21-jk-fe-008-interactive-steppers-citations-tables.md`

---

## 1. Skill Auto-Discovery, Routing & Auto-Creation Gate *(mandatory — execute first)*

Audited live via `Ensure-UiPathSkills.ps1 -Audit` — all 6 project-local skills are present and verified in `.agents/skills/`:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\UiPathProject\JourKa\.agents\skills\jourka-uipath-rpa\scripts\Ensure-UiPathSkills.ps1" -Audit
```

### 1.1 Active & Required Skills Matrix
| Skill Name | Scope (`D:\UiPathProject\JourKa\.agents\skills\<name>`) | Trigger / Role in This Plan | Status (`Loaded` / `Auto-Extract` / `Auto-Create`) |
|---|---|---|---|
| `jourka-uipath-rpa` | [SKILL.md](file:///D:/UiPathProject/JourKa/.agents/skills/jourka-uipath-rpa/SKILL.md) | Master JourKa runbook, hard invariants, format isolation, plan template, `Invoke-JourKaGate.ps1` | `Loaded` |
| `jourka-interactive-html` | [SKILL.md](file:///D:/UiPathProject/JourKa/.agents/skills/jourka-interactive-html/SKILL.md) | `DossierInteractiveTemplate.html` (`v2`) 8-token contract, offline GFM parity, `JK-FE-003..009` boundaries | `Loaded` |
| `uipath-planner` | [SKILL.md](file:///D:/UiPathProject/JourKa/.agents/skills/uipath-planner/SKILL.md) | Task derivation (`Identity` tuples), stop conditions, mandatory testing task | `Loaded` |
| `uipath-rpa` | [SKILL.md](file:///D:/UiPathProject/JourKa/.agents/skills/uipath-rpa/SKILL.md) | Reference only — confirms `0` `.xaml` edits and VB.NET `.Replace()` token contract safety | `Loaded` |
| `uipath-review` | [SKILL.md](file:///D:/UiPathProject/JourKa/.agents/skills/uipath-review/SKILL.md) | Read-only quality & invariant verification before PR | `Loaded` |
| `jourka-github-pr` | [SKILL.md](file:///D:/UiPathProject/JourKa/.agents/skills/jourka-github-pr/SKILL.md) | Conventional Commit & PR checklist (`Closes #10`) when PR is requested | `Loaded` |

### 1.2 Skill Gap Auto-Creation Decision
- **Does this ticket introduce a repeatable workflow, external API, NuGet package, or UI subsystem not covered above?** `No` — all 6 project-local skills in `.agents/skills/` cover the single-file template, bilingual UI, accessibility, verification, and RPA invariance requirements of `JK-FE-008`.

---

## 2. Goal, Epic Boundary & Artifact Isolation *(mandatory)*

- **Outcome in one sentence:** Upgrade [DossierInteractiveTemplate.html](file:///D:/UiPathProject/JourKa/JourKa/Templates/DossierInteractiveTemplate.html) with three role-agnostic, bilingual (`EN`/`ID`), offline-capable (`file://`), WCAG 2.2 AA interactive visualization modules: an ASCII-to-Visual Stepper converter (`.flow-stepper`), an `evidenceMap`-backed inline citation chip & collision-aware floating popover system (`.cite-chip` / `.cite-popover`), and responsive sticky-header filterable tables (`.table-scroll` + Section 2 Skills Matrix & Section 8/9 Evidence Register filter bars).
- **In scope (strictly owned by `JK-FE-008` / Issue `#10`):**
  - **ASCII Flowchart → Responsive Visual Stepper (`.flow-stepper`):** Scan `<pre><code>` blocks for horizontal (`--->`, `──►`, `──>`, `-->`, `->`, `─►`, `=>`, `→`) and vertical (`│`, `▼`, `↓`) flow patterns across all 4 observed structural archetypes (simple vertical, annotated vertical, single-line horizontal, and multi-line column-aligned horizontal); extract step title, optional duration/meta annotation, and per-step bullet/sub-line details; render numbered milestone cards (`01`, `02`, `03`...) with directional SVG connectors (horizontal flex-wrap on desktop, vertical timeline on mobile `<= 639px`) plus a top-right `"Raw Diagram"` / `"Diagram Asli"` toggle button revealing the preserved original `<pre>` block.
  - **Evidence Map & Interactive Citation Popovers (`.cite-chip` & `.cite-popover`):** Parse the Evidence Register (`sectionType === 'evidence'`) once during init into an in-memory `evidenceMap` keyed by normalized ID (`J01`..`J08`, `Y01`..`Y08`, `A01`..`A08`, stripping bold `**[J01]**` wrappers); tokenize inline bracketed citations across narrative paragraphs, lists, callouts, blueprints, onboarding items, and non-register tables — including single (`[J01]`), multi (`[J01, J03]`, `[J02, J04, J05]`), bold (`**[J01]**`), and range (`[J01–J06]`) notations — into `<button type="button" class="cite-chip" data-cite="J01">[J01]</button>`; wire a body-mounted singleton floating `.cite-popover` (click, hover with intent delay, and keyboard focus; WCAG 1.4.13 compliant; viewport collision clamped) displaying Source ID badge, localized Source Type pill, Title, Company/Creator context, safe `"Open Original Link ↗"` CTA, and `"View in Evidence Register ↓"` jump-and-highlight button, dismissing on `Esc` or outside click.
  - **Filterable & Responsive Data Tables (`.table-scroll`, `.table-filter-bar`):** Enhance every `<table>` wrapper with `.table-scroll` (`overflow-x: auto`, sticky `<thead>` with sharp bottom hairline, bounded vertical scroll on tall tables); add a grouped demand-level filter pill bar (`All`, `Critical / Must-Have`, `High`, `Moderate / Specialized`, localized `EN`/`ID`, hiding 0-count buckets) to Section 2 (`skills`); add source-type filter tabs (`All (N)`, `Job Boards [J] (N)`, `YouTube [Y] (N)`, and when `A > 0`, `Abroad [A] (N)`), live keyword filter input, visible row counter (`"X of Y sources"` / `"X dari Y sumber"`), and empty-state reset row to Section 8/9 (`evidence`).
  - **Downstream Integration & Controller Exports (`window.JourKaViz` & `window.JourKaShell.viz`):** Expose programmatic APIs and extend `revealElement(el)` so `Ctrl+F` (`beforematch`), `#hash` links, and future `JK-FE-009` search auto-reset table filters when revealing a filtered-out row.
- **Out of scope (owned by sibling tickets — zero scope creep):**
  - `JK-FE-009` (`#11`): Activating `#view-mode-group` (`Compact` ↔ `Expand All` — keep `aria-disabled="true"` untouched), `#dossier-search` (`Ctrl+K` / `/` live search with `<mark class="search-hit">` — keep `aria-disabled="true" readonly` untouched), `IntersectionObserver` active-TOC scrollspy + TOC click-to-expand, and global `I18N` consolidation.
  - `JK-RPA-001` (`#3`), `JK-RPA-002` (`#4`), `JK-FE-003`–`007` (`#5`–`#9`): Already merged; do not alter `.xaml` workflows or backfill committed `JourKa/Output/*/*.html` files.
- **Immutable Artifacts & Contracts (MUST NOT change):**
  - Exact `<html lang="{{LANG_CODE}}" data-jourka-ui="v2" data-theme="light">` stamp and all 8 VB.NET template tokens (`{{LANG_CODE}}`, `{{DOC_TITLE}}`, `{{ROLE_NAME}}`, `{{BANNER_SUFFIX}}`, `{{META_PILLS_HTML}}`, `{{COUNTERPART_HREF}}`, `{{COUNTERPART_LABEL}}`, `{{MARKDOWN_ENCODED}}`).
  - Existing APIs & IDs: `window.JourKaParser`, `window.JourKaBento`, `window.JourKaAccordion`, `window.JourKaTier2`, `window.JourKaShell`, `#m`, `#c`, `#bento-root`, `#section-N`, `#section-N-heading`, `#sec-body-N`.
  - [Main.xaml](file:///D:/UiPathProject/JourKa/JourKa/Main.xaml), [PublishDossier.xaml](file:///D:/UiPathProject/JourKa/JourKa/Workflows/PublishDossier.xaml), [project.json](file:///D:/UiPathProject/JourKa/JourKa/project.json), all 14 `.md` files, and all 28 `.pdf` files (`JourKa/Output/` & `PDF_Results/`): **0 byte changes**.

---

## 3. Codebase, Workflow & Activity Discovery *(mandatory — Rule 17 & Rule 21)*

Verified directly against live [DossierInteractiveTemplate.html](file:///D:/UiPathProject/JourKa/JourKa/Templates/DossierInteractiveTemplate.html) (`6,164` lines) and a full empirical scan of all `14` committed EN/ID Markdown dossiers in `JourKa/Output/` (`34` ASCII code blocks, `30` distinct citation bracket formats, `98` Skills Matrix rows, `206` Evidence Register rows, `72` total Markdown tables).

### 3.1 Live Codebase & 14-Dossier Empirical Findings
| # | Finding | Verified Location / Evidence | Impact on Plan |
|---|---|---|---|
| **F1** | Template init executes `renderTier1Accordions()` → `extractBentoData()` → `renderBentoGrid()` → `enhanceTier2Sections()` at lines `4791–4798` and `6057`. | [DossierInteractiveTemplate.html#L4791-L4798](file:///D:/UiPathProject/JourKa/JourKa/Templates/DossierInteractiveTemplate.html#L4791-L4798), [#L6057](file:///D:/UiPathProject/JourKa/JourKa/Templates/DossierInteractiveTemplate.html#L6057) | Run `enhanceInteractiveVisualizations()` **immediately after** `enhanceTier2Sections()` so Tier 0 Bento KPIs, Tier 1 previews, and Tier 2 Blueprints/Playbook/Callouts/Deep-Dives are already built and 100% regression-free; citations inside Tier 2 DOM nodes are tokenized automatically. |
| **F2** | **All `34/34` `<pre><code>` blocks across 14 dossiers are ASCII flowcharts spanning 4 structural archetypes:** **(V1)** Simple vertical (`6`: `Android Dev` S3, `Mobile Dev` S3, `Apoteker` S3 with `(Weeks 1-6)` outside brackets); **(V2)** Annotated vertical (`2`: `Apoteker` S5 EN/ID where `│ (Description)` sits *below* each step, including *after* the 5th step with no trailing `▼`); **(H1)** Single-line horizontal using `--->`, `──►`, `──>` (`14`: `Android Dev` S5/S7, `KMP` S3/S5/S7, `Mobile Dev` S5, `Video Editor` S7); **(H2)** Multi-line column-aligned horizontal (`12`: `Android Eng` S3/S5, `Mobile Eng` S3/S5, `Video Editor` S3/S5 with parenthesized or `-` / `•` sub-lines aligned under each `[Step]`). | Audited all `14` `JourKa/Output/*/*.md` files (`34/34` blocks inspected verbatim) | Parser MUST handle all 4 archetypes: attach vertical `│ (...)` annotations to the **preceding** step; align horizontal multi-line sub-rows (parenthesized groups `/\([^)]+\)/g`, bullet columns `(?:^|\s)(?:•|-\s)`, or multi-space columns) to matching steps without dropping a single word; guard non-flowchart code blocks (`language-kotlin`/`json`/etc. or `< 2` steps). |
| **F3** | **All `30` distinct inline citation tokens across 14 dossiers resolve `100%` (`0` unmapped)**, including bold `**[J01]**` (`Apoteker`, `Mobile Eng`, `Video Editor`), comma lists (`[J01, J03]`, `[J02, J04, J05]`, `[Y01, Y05]`), and **en-dash range `[J01–J06]`** (`Apoteker` EN & ID). `0` citations occur in headings or inline `<code>`. | Audited all `14` dossiers (`evIds` vs `bodyIds`: `0` missing across all 14 files) | Tokenize `[JYA...]` groups including commas and ranges (`-`/`–`/`—`, expanding `J01–J06` → `J01..J06` with safety cap `<= 20`); skip Evidence Register table cells, `<a>`, `<button>`, `<pre>`, `<code>`, and `.flow-stepper`; only convert IDs present in `evidenceMap`. |
| **F4** | **All `14` Evidence Register tables have 5 columns (`Source ID \| Type \| Title \| Company/Context \| URL`), `206` total rows, `0` missing URLs.** Counts: `Video Editor` has `8 [J], 8 [Y], 1 [A]` (`17`); `Kotlin Multiplatform` has `8 [J], 0 [Y], 0 [A]` (`8`); `Apoteker` has `8 [J], 6 [Y], 0 [A]` (`14`); remaining 4 roles have `8 [J], 8 [Y], 0 [A]` (`16`). Extra-pipe YouTube titles (`10` rows like `APOTEKER VLOG \|\| PRODUCTIVE DAY`) are already repaired by `JK-FE-004`'s `normalizeMarkdownInput()`. | [DossierInteractiveTemplate.html#L2650-L2660](file:///D:/UiPathProject/JourKa/JourKa/Templates/DossierInteractiveTemplate.html#L2650-L2660) & 14-dossier Evidence audit | Parse `evidenceMap` via `extractTableData(evidenceSec)` (dynamic header mapping + positional fallback `0..4`); derive category deterministically from ID prefix (`J`/`Y`/`A`); render `YouTube [Y]` and `Abroad [A]` filter tabs only when their count `> 0`. |
| **F5** | **All `14` Section 2 Skills Matrix tables (`98` rows) have 5 columns with Column 3 (`Market Demand Level` / `Tingkat Permintaan Pasar`) containing 25+ EN/ID phrasing variants** (e.g., `Mission-Critical (Must-Have)`, `Critical / High`, `High & Rapidly Growing`, `High (PBF / Wholesale)`, `Moderate to High`, `Niche / High-Value`, `Sangat Kritis (Wajib Dikuasai)`, `Menengah ke Tinggi`, `Berkembang & Strategis`). | Audited all `14` dossiers Section 2 tables (`98` rows) | Classify every row into 3 grouped filter buckets (`critical`, `high`, `moderate`) checking `critical` first, then `moderate` (preventing `Moderate to High` / `Niche / High-Value` / `Sedang-Tinggi` from leaking into `high`), then `high` (`High & Rapidly Growing`, `Essential`, `Tinggi`), with fallback `moderate`. Hide `0`-count pills. |
| **F6** | **Existing `wrapTables(root)` wraps all tables in `.table-wrapper` (`overflow-x: auto`) without `.table-scroll` or sticky `<thead>`.** | [DossierInteractiveTemplate.html#L878-L920](file:///D:/UiPathProject/JourKa/JourKa/Templates/DossierInteractiveTemplate.html#L878-L920), [#L2473-L2487](file:///D:/UiPathProject/JourKa/JourKa/Templates/DossierInteractiveTemplate.html#L2473-L2487) | Add `.table-scroll` alongside `.table-wrapper` (`class="table-wrapper table-scroll"`) for 100% backward compatibility + Issue `#10` conformance; add sticky `thead th` (`position: sticky; top: 0; z-index: 2; box-shadow: inset 0 -1px 0 var(--border)`) and bounded vertical scroll (`max-block-size: min(65vh, 560px)`) for tall tables (`>= 8` rows), reset in `@media print`. |
| **F7** | **Clipping hazard:** `.section-body-inner`, `.blueprint-body-inner`, `.deepdive-rest-inner` use `overflow: hidden`, and `.table-wrapper` uses `overflow-x: auto`. | [DossierInteractiveTemplate.html#L878-L885](file:///D:/UiPathProject/JourKa/JourKa/Templates/DossierInteractiveTemplate.html#L878-L885), [#L1228-L1231](file:///D:/UiPathProject/JourKa/JourKa/Templates/DossierInteractiveTemplate.html#L1228-L1231), [#L1443-L1447](file:///D:/UiPathProject/JourKa/JourKa/Templates/DossierInteractiveTemplate.html#L1443-L1447) | Mount `.cite-popover` as a **single portal element on `document.body`** using `position: fixed` viewport coordinates (`getBoundingClientRect()`), completely avoiding ancestor `overflow` clipping and stacking-context traps. |
| **F8** | **Onboarding `<label class="check-item">` click-bubbling hazard:** Tier 2 wraps each onboarding checkbox + `.check-text` inside `<label class="check-item">`. | [DossierInteractiveTemplate.html#L5539-L5559](file:///D:/UiPathProject/JourKa/JourKa/Templates/DossierInteractiveTemplate.html#L5539-L5559) | On `.cite-chip` click handler, call `ev.preventDefault(); ev.stopPropagation();` so clicking a citation inside an onboarding item opens `.cite-popover` and **never** toggles the parent checkbox. |
| **F9** | **`revealElement(el)` & `applyHashExpansion()`:** Currently reveal Tier 1 + Tier 2 containers, and `applyHashExpansion()` runs before Tier 2 / Viz init. | [DossierInteractiveTemplate.html#L4584-L4612](file:///D:/UiPathProject/JourKa/JourKa/Templates/DossierInteractiveTemplate.html#L4584-L4612), [#L4785](file:///D:/UiPathProject/JourKa/JourKa/Templates/DossierInteractiveTemplate.html#L4785), [#L6014-L6040](file:///D:/UiPathProject/JourKa/JourKa/Templates/DossierInteractiveTemplate.html#L6014-L6040) | Extend `revealElement(el)` to also clear active table filters if `el` is inside a filtered-out `tr[hidden]` (and expand `.flow-raw-wrap` if `el` is inside raw diagram); re-run `applyHashExpansion({ scroll: true })` once after `JK-FE-008` init if `window.location.hash` targets `#ev-row-*` or `#blueprint-*`. |

### 3.2 NuGet Package & Activity Resolution Gate (`Rule 21`)
- **Dependencies in `project.json` sufficient?** `Yes` — zero `.xaml` / `.cs` edits, zero NuGet changes.
- **New XAML Activities Added:** `None` (`N/A` — pure single-file HTML5/CSS/JS template deliverable).

---

## 4. UiPath Common Pitfalls & Modern Frontend / WCAG 2.2 AA Vetting Gate (`Rule 22`)

- [x] **8-Token & `v2` Stamp Hygiene:** Keep `<html lang="{{LANG_CODE}}" data-jourka-ui="v2" data-theme="light">` and all 8 `{{TOKEN}}` placeholders exact; never write literal `{{...}}` sequences in new CSS/JS/comments.
- [x] **Single-File `file://` Offline Portability:** Zero external scripts, CSS, or font URLs added; all icons are inline `<svg aria-hidden="true" focusable="false">` via existing `createSvgIcon()`.
- [x] **Zero Unsafe DOM Sinks & URL Validation:** Construct all `.flow-stepper`, `.cite-chip`, `.cite-popover`, and `.table-filter-bar` DOM nodes via `document.createElement()` / `.textContent`. Validate every popover external link with existing `isSafeHref(url)` and enforce `target="_blank" rel="noopener noreferrer"`.
- [x] **WCAG 1.4.13 Compliant Hover/Focus Popover (Dismissible, Hoverable, Persistent):** `140ms` mouse hover-open delay (`pointerType === 'mouse'`), `220ms` leave grace timer cancelled on `pointerenter` over popover, `Esc` dismissal restoring focus to triggering chip, outside click & `×` close button.
- [x] **Safe Text-Node Tokenization:** Collect `TreeWalker` (`NodeFilter.SHOW_TEXT`) nodes into an array before DOM mutation; skip `A`, `BUTTON`, `PRE`, `CODE`, `SCRIPT`, `STYLE`, `.flow-stepper`, `.table-filter-bar`, `.cite-popover`, and Evidence Register `TABLE` subtrees.
- [x] **Parent `<label>` Click Isolation:** `ev.preventDefault(); ev.stopPropagation();` in `.cite-chip` click handler.
- [x] **Semantic Stepper & Non-Flowchart Guard:** `<figure class="flow-stepper"><ol class="flow-stepper-list">`; original `<pre>` inside `.flow-raw-wrap[hidden]`; reject programming language blocks or `< 2` parsed steps.
- [x] **Accessible Table Filters, Contrast, Motion & Print:** `role="group"` + `aria-pressed`, visually-hidden `<label>` for search input, `aria-live="polite"` counters, `prefers-reduced-motion` gating, `@media (forced-colors: active)`, and `@media print` completeness.

---

## 5. Strict Change Manifest

`git diff --stat` at completion must be a strict subset of this table:

| File Path | Action | Section / Scope | Summary of Change |
|---|---|---|---|
| `JourKa/docs/plans/2026-11-21-jk-fe-008-interactive-steppers-citations-tables.md` | `new` | Canonical plan doc | Persist approved `uipath-planner` plan & task tracker |
| [JourKa/Templates/DossierInteractiveTemplate.html](file:///D:/UiPathProject/JourKa/JourKa/Templates/DossierInteractiveTemplate.html) | `edit` | `<style>` & `<script>` | Implement `.flow-stepper`, `evidenceMap` + `.cite-chip` / `.cite-popover`, `.table-scroll` sticky `<thead>`, Section 2 & Section 8/9 table filter bars, `revealElement` filter-reset hook, and `window.JourKaViz` API |

---

## 6. Turn-Budgeted Implementation Tasks (`uipath-planner` Schema)

- **T0 (`jourka-uipath-rpa:JourKa:jk-fe-008-skills-and-baseline`):** Persist canonical plan, audit skills, snapshot baseline template to `JourKa/.local/preview/DossierInteractiveTemplate__before_fe008.html`.
- **T1 (`jourka-interactive-html:JourKa:Templates/DossierInteractiveTemplate.html:viz-styles`):** Add Light/Dark, responsive (`<= 639px`), `pointer: coarse`, `forced-colors`, and `@media print` CSS for `.flow-stepper*`, `.cite-chip`, `.cite-popover*`, `.table-scroll`, `.table-filter-bar*`, `.demand-badge*`, and `.is-row-highlight`.
- **T2 (`jourka-interactive-html:JourKa:Templates/DossierInteractiveTemplate.html:viz-steppers`):** Implement `VIZ_I18N`, `VIZ_ICONS`, `parseAsciiFlowchart()` (V1/V2/H1/H2 + non-flowchart guard), `buildFlowStepper()`, `enhanceAsciiSteppers()`, and `toggleRawDiagram()`.
- **T3 (`jourka-interactive-html:JourKa:Templates/DossierInteractiveTemplate.html:viz-citations`):** Implement `buildEvidenceMap()`, `expandCitationGroup()`, `enhanceInlineCitations()`, and body-mounted `.cite-popover` controller + `navigateToEvidence()`.
- **T4 (`jourka-interactive-html:JourKa:Templates/DossierInteractiveTemplate.html:viz-tables-api`):** Upgrade `wrapTables()` to `.table-wrapper.table-scroll`, implement Section 2 Skills Matrix & Section 8/9 Evidence Register filter bars, wire `enhanceInteractiveVisualizations()`, extend `revealElement()` + late `applyHashExpansion()`, and export `window.JourKaViz` & `window.JourKaShell.viz`.
- **T5 (`jourka-interactive-html:JourKa:jk-fe-008-testing`):** Run L1–L7 verification matrix across all 14 dossiers (online + offline), live browser Gherkin ACs (`AC-1`, `AC-2`, `AC-3`), `Invoke-JourKaGate.ps1`, and format-isolation checks.
