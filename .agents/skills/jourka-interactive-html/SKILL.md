---
name: jourka-interactive-html
description: >-
  Project-local frontend and template runbook for JourKa's interactive Web Frontend v2
  (JourKa/Templates/DossierInteractiveTemplate.html and JourKa/Output/<Role>/<Role> - {EN,ID}.html).
  Activate whenever working on JK-RPA-001, JK-RPA-002, or JK-FE-003 through JK-FE-009
  (app shell, Light/Dark tokens, offline Markdown parser, SectionModel normalizer,
  Tier 0 Bento KPI grid, Tier 1 section accordions, Tier 2 blueprints/30-60-90 checklist/deep-dives,
  ASCII-to-Stepper converter, citation popovers, sticky TOC, Ctrl+K search, EN/ID switcher).
---

# JourKa Interactive HTML v2 Runbook (`DossierInteractiveTemplate.html`)

## 1. Architecture & Portability Contract
- **Single-File Portability (`file://` Ready):** `JourKa/Templates/DossierInteractiveTemplate.html` must be 100% self-contained (inline `<style>` and `<script>`). Zero external CSS/JS files other than optional CDN `marked.min.js`, which MUST have an offline vanilla-JS GFM fallback (`fallbackMarkdownToHtml`).
- **Version Stamp:** `<html lang="{{LANG_CODE}}" data-jourka-ui="v2" data-theme="light">` is mandatory so `Main.xaml` (`If_2.Then` in `JK-RPA-002`) detects `v2` outputs deterministically.
- **Format Isolation:** Modifying `DossierInteractiveTemplate.html` or backfilling `<Role> - {EN,ID}.html` must NEVER alter `.md` files or the `%TEMP%\jourka_pdf_<guid>.html` static print HTML used for `.pdf` generation.

## 2. Immutable 8-Token VB.NET Injection Contract
Injected via chained `.Replace("{{TOKEN}}", value)` in `Main.xaml` and `Workflows/PublishDossier.xaml` (`{{MARKDOWN_ENCODED}}` replaced **last**):

| Token | Source / Format | Target Element |
|---|---|---|
| `{{LANG_CODE}}` | `"en"` or `"id"` | `<html lang="{{LANG_CODE}}">` |
| `{{DOC_TITLE}}` | `HtmlEncode(in_RoleName & docTitleSuffix)` | `<title>{{DOC_TITLE}}</title>` |
| `{{ROLE_NAME}}` | `HtmlEncode(in_RoleName)` | Hero banner `<h1>` & toolbar badge |
| `{{BANNER_SUFFIX}}` | `"Career Intelligence Dossier"` / `"Dosier Intelijen Karier"` | Hero banner subtitle |
| `{{META_PILLS_HTML}}` | Pre-built `<span class='pill'>...</span>` tags | `.banner .meta` container |
| `{{COUNTERPART_HREF}}` | `HtmlEncode(Uri.EscapeDataString(counterpartFile))` | Bilingual switcher `<a href="{{COUNTERPART_HREF}}">` |
| `{{COUNTERPART_LABEL}}` | `"ID"` or `"EN"` | Bilingual switcher label |
| `{{MARKDOWN_ENCODED}}` | `HtmlEncode(mdContent)` | `<textarea id="m" style="display:none;">{{MARKDOWN_ENCODED}}</textarea>` |

## 3. Epic Ticket Map (`JK-FE-003` .. `JK-FE-009` & `JK-RPA-002`)
1. **`JK-FE-003` (Shell & Theme):** `:root` Light Editorial (`#f8fafc` / `#ffffff` / `#2563eb`) + `[data-theme="dark"]` Dark Slate (`#0b1120` / `#111827`), zero-FOUC `<head>` theme init (`localStorage.getItem('jourka_theme')`), 3px scroll progress bar, sticky `.app-toolbar`, 2-column desktop (`260px` TOC + `880px` main) / 1-column mobile grid.
2. **`JK-FE-004` (Parser & Normalizer):** Dual parser (`window.marked.parse` + pure-JS `fallbackMarkdownToHtml` supporting headings, GFM pipe tables, fenced code blocks, 2-level nested lists, blockquotes, links). Role-agnostic `classifySection(title, index, totalSections)` into `overview | skills | roadmap | routine | salary | guidance | onboarding | abroad | evidence | generic` across 8-section and 9-section EN/ID dossiers.
3. **`JK-FE-005` (Tier 0 Bento KPIs):** 4-card `.bento-summary` auto-extracting S1/D4 Degree Verdict, Core Competencies count + top 4 pills, Entry-Level (0–1 yr) IDR salary band, and Verified Evidence (`[J]`, `[Y]`, `[A]`) counts with click-to-expand scroll navigation.
4. **`JK-FE-006` (Tier 1 Section Accordions):** `.dossier-card` accordions collapsed by default (`data-expanded="false"`), auto-generated 1–2 sentence TL;DR preview strip + topic pills, `grid-template-rows: 0fr -> 1fr` transition, `sessionStorage` state (`jourka_open_<role>_<lang>`).
5. **`JK-FE-007` (Tier 2 Nested Expandables):** Dual-pattern Portfolio Blueprint parser (`<h4>` in Android Dev/Apoteker + nested `<li>` in Kotlin Multiplatform), 3-phase 30/60/90 onboarding tabs + `localStorage` checklist (`jourka_check_<role>_<lang>`), mentor deep-dive paragraph expander (`>= 3` paragraphs or `> 1,100` chars), S1/D4 Verdict & AI Sentiment callout boxes.
6. **`JK-FE-008` (Visualizations):** Horizontal (`--->` / `──►`) and vertical (`│` / `▼`) ASCII flowchart → `.flow-stepper` converter with `"Raw Diagram"` toggle; `evidenceMap` + `.cite-chip` floating `.cite-popover` for `[Jxx]`/`[Yxx]`/`[Axx]`; filter bars on Section 2 Skills table and Section 8/9 Evidence Register.
7. **`JK-FE-009` (TOC, Search & Bilingual Nav):** Sticky desktop TOC (`IntersectionObserver`) + mobile FAB drawer, `Compact Summary` ↔ `Expand All` mode switcher, debounced `Ctrl+K` / `/` full-text search with auto-expand and `<mark class="search-hit">` highlight/unwrap, `I18N.en` / `I18N.id` dictionary, and browser `@media print` rules.
8. **`JK-RPA-002` (In-Workflow HTML Auto-Upgrade):** `Main.xaml` `If_2.Then` checks `data-jourka-ui="v2"` and upgrades legacy/fallback HTMLs from disk `.md` files (preserving original `Generated:` / `Dibuat:` and `Abroad` pills) with 0 network/API calls and 0 `.md`/`.pdf` edits.

## 4. Verification Checklist for Frontend Tickets
- Test across all 3 structural archetypes in `JourKa/Output/`:
  1. `Android Developer` (`EN` & `ID` — 8 sections, `<h4>` projects, vertical ASCII roadmap, nested-list 30/60/90).
  2. `Kotlin Multiplatform` (`EN` & `ID` — 8 sections, nested-list projects).
  3. `Apoteker` (`EN` & `ID` — non-tech healthcare domain, `Wajib/Required` S1 verdict) & `Video Editor` (`EN` & `ID` — 9 sections with Section 8 Abroad `[A01]`).
- Verify offline rendering by blocking/removing CDN `marked.min.js`.
- Run `../jourka-uipath-rpa/scripts/Invoke-JourKaGate.ps1` if any `.xaml` file was touched.
