---
name: jourka-github-pr
description: >-
  Project-local runbook and template guide for creating, reviewing, and publishing production-grade
  GitHub Pull Requests in JourKa. Enforces Conventional Commits PR naming, issue linkage (#3, JK-*),
  architectural diff diagrams, UiPath gate validation proof (0 diagnostics), and format isolation checks.
---

# JourKa GitHub Pull Request Standard & Skill Runbook

## 1. When to Activate
Activate this skill whenever:
- Creating a GitHub Pull Request from a feature/bugfix branch (`feat/*`, `fix/*`, `rpa/*`, `fe/*`) to a target branch (`pre-master` or `master`).
- Generating or formatting a PR description adhering to JourKa's enterprise-grade documentation standards.
- Performing pre-merge auditing or verifying DoD compliance before submitting a PR.

---

## 2. Core Pull Request Invariants & Best Practices

### 2.1 Branching Strategy & Targeting
- **Feature Branches:** Always branch from `pre-master` (or latest `master` if `pre-master` is synced) following naming convention:
  - `feat/<ticket-id>-<short-description>` (e.g., `feat/jk-rpa-001-decoupled-html-pipeline`)
  - `fix/<ticket-id>-<short-description>`
  - `fe/<ticket-id>-<short-description>`
- **PR Target:**
  - Feature PRs **must** target `pre-master` as the primary integration and staging branch.
  - Release PRs merge `pre-master` into `master` after staging validation.

### 2.2 PR Title Convention (Conventional Commits)
Titles must follow the format:
```text
<type>(<scope>): <imperative description> (#<issue-number>)
```
*Types:* `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`  
*Scope:* Ticket ID or component (`jk-rpa-001`, `rpa-html`, `bento-kpi`, `abroad`)  
*Example:* `feat(jk-rpa-001): decouple interactive HTML pipeline and isolate PDF generation (#3)`

---

## 3. Mandatory PR Description Anatomy

Every JourKa Pull Request description must follow the project's standard 8-section anatomy:

```text
1. 🚀 Executive Summary & Overview
2. 📋 Issue / Ticket Metadata Table (ID, Epic, Priority, Target Branches, Closes #<id>)
3. 📌 Problem Statement & Context (Why this change was needed)
4. 🏗️ Architecture & Pipeline Flow (Mermaid flowchart / state diagram)
5. 🧩 Technical Changes Breakdown (By file and component)
6. 🔒 Invariants & Format Isolation Guarantees (.md/.pdf vs .html integrity)
7. 🧪 Testing, Verification & Gate Results (Invoke-JourKaGate.ps1 log, tests)
8. 🚀 Deployment, Environment & Pre-Merge Checklist
```

See [resources/pr-template.md](resources/pr-template.md) and the repo root [.github/PULL_REQUEST_TEMPLATE.md](../../../.github/PULL_REQUEST_TEMPLATE.md) for the exact markdown template.

---

## 4. Pre-Flight Verification Checklist (Must Pass Before Submitting PR)

Before creating the Pull Request:
1. **UiPath Gate Validation:**
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File ".agents\skills\jourka-uipath-rpa\scripts\Invoke-JourKaGate.ps1"
   ```
   *Requirement:* `0` compilation errors, `0` XAML schema errors, `0` VB.NET diagnostic errors.
2. **Git Working Tree Check:**
   ```powershell
   git status --short
   ```
   *Requirement:* Clean tree. No untracked cache files (`.local/`, `WorkflowFileValidator.cache`, etc.).
3. **Secret Redaction Check:**
   Ensure no API keys (`GEMINI_API_KEY`) or `.env` credentials are committed.
4. **Remote Branch Sync:**
   Ensure local commits are pushed to `origin/<branch-name>`.

---

## 5. Automation Tooling

To programmatically create a PR:
- Use the GitHub MCP tool `create_pull_request` on `github-mcp-server-personal` with:
  - `owner`: `"prayogizan"`
  - `repo`: `"JourKa"`
  - `head`: `<feature-branch>`
  - `base`: `"pre-master"` (or `"master"`)
  - `title`: Conventional commit title
  - `body`: Fully rendered markdown following [resources/pr-template.md](resources/pr-template.md)
