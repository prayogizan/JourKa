# 🚀 Pull Request Template — JourKa

> Copy or adapt this template when authoring a Pull Request description in the JourKa repository.

---

```markdown
# 🚀 JourKa — <Short Title / Feature Summary>

## 📌 Executive Summary & Overview
<!-- 2-3 sentences providing a clear executive summary of the changes, motivation, and system impact. -->

---

## 📋 Ticket & Review Metadata

| Field | Value |
|---|---|
| **Ticket / Issue ID** | `[<TICKET-ID>]` <!-- e.g., JK-RPA-001 --> |
| **Issue Link** | Closes #`<ISSUE_NUMBER>` |
| **Epic** | `<EPIC-NAME>` <!-- e.g., EPIC-JK-RPA --> |
| **Priority** | `<P0 / P1 / P2 / P3>` |
| **Source Branch** | `<source-branch-name>` |
| **Target Branch** | `pre-master` <!-- or master --> |
| **Scope of Impact** | `<Scope, e.g. .html generation only, UiPath workflows, etc.>` |

---

## 📌 Problem Statement & Context
<!-- Describe the specific problem, limitation, or regression risk that prompted this change. Explain what happens without this PR. -->

---

## 🏗️ Architecture & Pipeline Flow

```mermaid
flowchart TD
    %% Insert Mermaid diagram showing workflow or architectural pipeline
```

<!-- Explain the architectural decision, data flow, or state transitions illustrated above. -->

---

## 🧩 Technical Breakdown of Changes

### 1. Workflows & Core Logic
- **`<File 1>`**: <!-- e.g., JourKa/Main.xaml -->
  - <Detail 1>
  - <Detail 2>
- **`<File 2>`**: <!-- e.g., JourKa/Workflows/PublishDossier.xaml -->
  - <Detail 1>

### 2. Templates & Frontend (if applicable)
- **`<Template / HTML>`**: <!-- e.g., JourKa/Templates/DossierInteractiveTemplate.html -->
  - <Detail 1>

### 3. Agent Skills & Tooling (if applicable)
- **`<Skill / Script>`**: <!-- e.g., .agents/skills/... -->
  - <Detail 1>

---

## 🔒 Format & Data Isolation Guarantees
<!-- For JourKa: State explicitly what remains 100% UNCHANGED to prevent unintended side effects -->
- **Markdown (`.md`):** [ ] 0% change, verbatim UTF-8 output preserved.
- **Static A4 PDF (`.pdf`):** [ ] 0% visual/styling change; isolated via temporary rendering container.
- **Excel Contract (`Desire Role List.xlsx`):** [ ] Backward compatible, 0 schema breakages.
- **Workflow Signatures (`x:Members`):** [ ] In/Out argument contracts 100% preserved.

---

## 🧪 Testing & Verification Results

### 1. UiPath RPA Validation Gate (`Invoke-JourKaGate.ps1`)
```text
Compilation / Validation Status: SUCCESS (0 errors, 0 warnings)
```

### 2. Manual / Integration Test Scenarios
- [x] Scenario 1: <Description & outcome>
- [x] Scenario 2: <Description & outcome>

### 3. Acceptance Criteria (DoD)
- [x] Criterion 1
- [x] Criterion 2

---

## 🚀 Deployment & Pre-Merge Checklist
- [x] Working tree clean and all changes committed.
- [x] Tested against target branch (`pre-master`).
- [x] No secrets (`GEMINI_API_KEY`) or sensitive tokens in codebase or commit history.
- [x] UiPath cache files (`.local/`, `WorkflowFileValidator.cache`) properly handled.
- [x] Documentation / Agent Skills updated to reflect architectural changes.
```
