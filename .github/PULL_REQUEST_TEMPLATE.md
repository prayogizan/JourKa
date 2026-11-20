<!--
JourKa Pull Request Template
Please ensure all sections are filled out before requesting review.
-->

# 🚀 JourKa — [Ticket-ID] Title

## 📌 Executive Summary & Overview
<!-- 2-3 sentences summarizing the purpose, motivation, and system impact of this PR. -->

---

## 📋 Ticket & Review Metadata

| Field | Value |
|---|---|
| **Ticket / Issue ID** | `[JK-...]` |
| **Issue Link** | Closes # |
| **Epic** | `EPIC-JK-...` |
| **Priority** | `P0 / P1 / P2 / P3` |
| **Source Branch** | `` |
| **Target Branch** | `pre-master` |
| **Scope of Impact** |  |

---

## 📌 Problem Statement & Context
<!-- Describe the specific problem, architectural bottleneck, or regression risk addressed by this PR. -->

---

## 🏗️ Architecture & Pipeline Flow

```mermaid
flowchart TD
    %% Insert Mermaid diagram showing workflow or architectural pipeline
```

---

## 🧩 Technical Breakdown of Changes

### 1. Workflows & Core Logic
- **`JourKa/Main.xaml`**:
  - 
- **`JourKa/Workflows/PublishDossier.xaml`**:
  - 

### 2. Templates & Frontend (if applicable)
- **`JourKa/Templates/DossierInteractiveTemplate.html`**:
  - 

### 3. Agent Skills & Tooling (if applicable)
- **`.agents/skills/...`**:
  - 

---

## 🔒 Format & Data Isolation Guarantees
- **Markdown (`.md`):** [ ] 0% change, verbatim UTF-8 output preserved.
- **Static A4 PDF (`.pdf`):** [ ] 0% visual/styling change; isolated via temporary rendering container.
- **Excel Contract (`Desire Role List.xlsx`):** [ ] Backward compatible, 0 schema breakages.
- **Workflow Signatures (`x:Members`):** [ ] In/Out argument contracts 100% preserved.

---

## 🧪 Testing & Verification Results

### 1. UiPath RPA Validation Gate (`Invoke-JourKaGate.ps1`)
- [ ] `0` XAML schema errors
- [ ] `0` VB.NET diagnostic / expression compilation errors
- [ ] UiPath CLI validation (`uip rpa validate`) / ActivityCompiler passed cleanly

### 2. Test Scenarios Executed
- [ ] Scenario 1: 
- [ ] Scenario 2: 

### 3. Acceptance Criteria (DoD)
- [ ] All issue acceptance criteria verified.

---

## 🚀 Deployment & Pre-Merge Checklist
- [ ] Working tree clean and all changes committed.
- [ ] Rebased / synchronized with `pre-master`.
- [ ] No secrets (`GEMINI_API_KEY`) or sensitive tokens in codebase or commit history.
- [ ] UiPath cache files (`.local/`) properly isolated and excluded.
- [ ] Documentation / Agent Skills updated.
