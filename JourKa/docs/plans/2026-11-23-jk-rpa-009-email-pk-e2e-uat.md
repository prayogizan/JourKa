# [JK-RPA-009] End-to-End Regression Suite (AC-01..AC-07), Multi-Client Rendering & UAT Sign-Off — Implementation Plan

> **Issue / Source:** [https://github.com/prayogizan/JourKa/issues/29](https://github.com/prayogizan/JourKa/issues/29) *(Parent Epic: [#22](https://github.com/prayogizan/JourKa/issues/22) `EPIC-JK-MAIL` / `JK-RPA-003` §6 `AC-01`..`AC-07`, §7.2–§7.3)*
> **Git Branch:** `test/jk-rpa-009-email-pk-e2e-uat` *(checked out cleanly at `6544cb7`, after `#23`–`#28` merged into `pre-master`)*
> **Epic:** `EPIC-JK-MAIL` — Column A Primary Key & Automated Student/Parent Email Delivery · **Priority / Points:** `P1 (High / Release Gate) / 2 pts`
> **Project Root:** `D:\UiPathProject\JourKa\JourKa` (`project.json`)
> **Project Type:** `Modern Windows XAML Process` (`targetFramework: Windows`, `dotNetVersion: net10.0`)
> **Expression Language:** `VisualBasic` (`Option Strict On`, `Option Explicit On`)
> **Canonical Plan Path:** `JourKa/docs/plans/2026-11-23-jk-rpa-009-email-pk-e2e-uat.md`

---

## 1. Skill Auto-Discovery & Audit

- Audited via `.agents/skills/jourka-uipath-rpa/scripts/Ensure-UiPathSkills.ps1 -EnsureCore -Audit`:
  - `jourka-uipath-rpa`, `uipath-rpa`, `uipath-planner`, `uipath-review`, `jourka-interactive-html`, `jourka-github-pr`.
- `UiPath.Testing.Activities [25.10.3]` already installed in `JourKa/project.json`.

---

## 2. Goal, Epic Boundary & Artifact Isolation

- **Outcome:** Release-gate regression suite (`UiPath.Testing.Activities [25.10.3]`) verifying `AC-01`..`AC-07` and `E1`–`E10`, multi-client email rendering & security audit, documentation (`README.md`), and UAT report (`JourKa/Tests/UAT_Report_JK-RPA-009.md`).
- **Immutable Artifacts:** Existing 42 dossier files in `JourKa/Output/`, 14 PDFs in `PDF_Results/`, `Templates/DossierInteractiveTemplate.html`, `Templates/StudentParentEmailTemplate.html`, and production `Desire Role List.xlsx` (`0` unintended edits).

---

## 3. Two-Track Verification & 9-Row Fixture Matrix

- **Track 1 (Automated Offline Release Gate):**
  - `Tests/Test_AC03_SchemaEnforcement.xaml`: Tests `E1` fatal BRE on `LegacyV1Schema.xlsx` and `v2.0` column-name resolution.
  - `Tests/Test_AC04_FormalEmailTemplateAndXss.xaml`: Tests `RenderStudentEmail.xaml` (`AC-04`, `E6` blank `StudentName`, and `HtmlEncode` XSS protection).
  - `Tests/Test_E8E9_SmtpFailureAndRedaction.xaml`: Tests `SendStudentEmail.xaml` under simulated SMTP `535`, unreachable port, 0-byte attachment rejection, and 3-secret redaction.
  - `Tests/Test_E2E_MixedOutcomeBatch_AC01_to_AC07.xaml`: Executes `Main.xaml` via optional `in_WorkbookPath` against an isolated copy of the 9-row mixed-outcome workbook (`Desire Role List - E2E UAT.xlsx`) + in-process loopback SMTP capture server (`127.0.0.1`) + 2nd idempotent rerun + `E10` locked-workbook CSV fallback check.
- **Track 2 (Rendering, Security & Live Inbox UAT):**
  - Headless Chrome Desktop (`1280×900`) and Mobile (`375×812`) rendering snapshots of rendered `StudentParentEmailTemplate.html`.
  - `uipath-review` + static security & `HtmlEncode` audit.
  - Live inbox UAT once real SMTP `.env` credentials and Student/Parent mailboxes are configured.

---

## 4. Strict Change Manifest

1. `JourKa/docs/plans/2026-11-23-jk-rpa-009-email-pk-e2e-uat.md` *(new)*
2. `JourKa/Main.xaml` *(edit — optional `in_WorkbookPath` argument)*
3. `JourKa/Tests/Data/Desire Role List - E2E UAT.xlsx` *(new)*
4. `JourKa/Tests/Data/Desire Role List - LegacyV1Schema.xlsx` *(new)*
5. `JourKa/Tests/Test_AC03_SchemaEnforcement.xaml` *(new)*
6. `JourKa/Tests/Test_AC04_FormalEmailTemplateAndXss.xaml` *(new)*
7. `JourKa/Tests/Test_E8E9_SmtpFailureAndRedaction.xaml` *(new)*
8. `JourKa/Tests/Test_E2E_MixedOutcomeBatch_AC01_to_AC07.xaml` *(new)*
9. `JourKa/project.json` *(edit — `fileInfoCollection` registration)*
10. `JourKa/Tests/UAT_Report_JK-RPA-009.md` *(new)*
11. `README.md` *(edit — finalize §2, §4, §5, §7, §8, §9)*
