---
name: jourka-uipath-rpa
description: >-
  Project-specific runbook for the JourKa UiPath RPA project (D:\UiPathProject\JourKa).
  Use this skill whenever a task touches JourKa's UiPath sources (Main.xaml,
  Workflows/*.xaml, project.json, Templates/*, Output artifacts) or when the user
  asks to analyze/plan/implement a JourKa GitHub issue (JK-RPA-*, JK-FE-*). It
  provides the mandatory plan template, automatic skill discovery/creation
  (Ensure-UiPathSkills.ps1), InvokeCode-safe editing tooling (InvokeCodeTool.ps1),
  the validate/build gate (Invoke-JourKaGate.ps1), and JourKa-specific invariants.
---

# JourKa UiPath RPA Runbook

JourKa is a **Modern Windows** UiPath process (`targetFramework: Windows`, `net10.0`,
**VB.NET** expressions, Studio 26.10). Almost all business logic lives in large
`ui:InvokeCode` VB.NET bodies embedded as XML-encoded `Code="..."` attributes.

## 0. Always First — Auto-Verify & Load Project Skills

1. Read [JourKa/AGENTS.md](../../../JourKa/AGENTS.md) (project rules; wins on conflict).
2. Read [references/project-facts.md](references/project-facts.md) — file map, argument
   contracts, InvokeCode inventory, epic boundaries.
3. Run the project-local skill bootstrap & audit script so core skills exist in
   `D:\UiPathProject\JourKa\.agents\skills\`:
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File "D:\UiPathProject\JourKa\.agents\skills\jourka-uipath-rpa\scripts\Ensure-UiPathSkills.ps1" -EnsureCore -Audit
   ```
4. **Auto-Route & Auto-Create Skills:**
   - Touching `.xaml` / `project.json` → also load [../uipath-rpa/SKILL.md](../uipath-rpa/SKILL.md).
   - Planning / deriving tasks → also load [../uipath-planner/SKILL.md](../uipath-planner/SKILL.md).
   - Auditing / reviewing workflows → also load [../uipath-review/SKILL.md](../uipath-review/SKILL.md).
   - Touching `DossierInteractiveTemplate.html` or `JK-FE-003..009` / `JK-RPA-002` → also load [../jourka-interactive-html/SKILL.md](../jourka-interactive-html/SKILL.md).
   - **Missing domain skill?** Run `Ensure-UiPathSkills.ps1 -CreateSkill <name> -Domain <rpa|fe|test|data> -Description "..."` (or `-ExtractOfficial <uipath-skill>`) before authoring.

## 1. Workflow: Issue → Plan → Implement → Gate → PR

### Step 1 — Analyze the issue & audit skills
- Fetch the issue (GitHub MCP `get_issue`, owner `prayogizan`, repo `JourKa`) **and list
  sibling issues** (`list_issues state=all`): JourKa tickets form an epic chain
  (`JK-RPA-001` → `JK-RPA-002`, `JK-FE-003..009`). Identify what the ticket owns vs.
  what a sibling owns — **scope creep into sibling tickets is the #1 planning error**.
- Confirm current branch / clean tree (`git status`).
- Verify every line/file reference in the issue against actual code (issue line numbers drift).

### Step 2 — Write the plan from the template
Copy [resources/plan-template.md](resources/plan-template.md) into the conversation
artifact directory as `implementation_plan.md`, fill **every** mandatory section
(including **§1 Skill Auto-Discovery, Routing & Auto-Creation Gate**, **§3 Rule 21 Activity Gate**,
**§4 Rule 22 Common Pitfalls Vetting Gate**, **§8 `uipath-planner` Tasks with `Identity` tuples**,
and **§9 Multi-Layer Verification Matrix**), and stop for user approval before editing XAML.

### Step 3 — Implement (`InvokeCode`-safe editing)
Never hand-edit a multi-line `Code="..."` attribute. Use the tool:

```powershell
$T = "D:\UiPathProject\JourKa\.agents\skills\jourka-uipath-rpa\scripts\InvokeCodeTool.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -File $T list    -Xaml D:\UiPathProject\JourKa\JourKa\Main.xaml
powershell -NoProfile -ExecutionPolicy Bypass -File $T extract -Xaml D:\UiPathProject\JourKa\JourKa\Main.xaml -IdRef InvokeCode_1
#   -> snapshot *__before.vb, then edit JourKa\.local\invokecode\Main__InvokeCode_1.vb
powershell -NoProfile -ExecutionPolicy Bypass -File $T inject  -Xaml D:\UiPathProject\JourKa\JourKa\Main.xaml -IdRef InvokeCode_1
```

`inject` rewrites only that attribute value, keeps BOM/view-state untouched, and
auto-restores the file if the result is not well-formed XML. Apply all coding rules
in [references/invokecode-rules.md](references/invokecode-rules.md).

For non-InvokeCode XAML edits (new activities, arguments, variables): minimal targeted
edits only, never reformat, never touch `sap:VirtualizedContainerService.HintSize` /
`WorkflowViewState` of unchanged nodes; wrap every container slot in `<Sequence>`.

### Step 4 — Gate (Definition of Done)
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\UiPathProject\JourKa\.agents\skills\jourka-uipath-rpa\scripts\Invoke-JourKaGate.ps1"
```
Runs per-file `uip rpa validate --min-severity error` on every changed `.xaml`, then one
`uip rpa build`. Both must return clean (`GATE: PASSED`). Max 5 fix attempts per error,
fixing in order Package → Structure → Type → Properties → Logic.

Then run the ticket's **functional verification** (from §9 of the plan). `uip rpa run`
executes on this machine — **ask the user first** (`AGENTS.md`).

### Step 5 — Invariant check & PR
- `git status --short -- JourKa/Output PDF_Results` must show zero unintended `.md` or
  `.pdf` modifications.
- `git diff --stat` must be a strict subset of §7 Change Manifest.
- Conventional commit (`feat(rpa-html): ...`), body ends with `Closes #<n>`. Push / PR
  only when the user asks. Never `uip rpa publish` unless explicitly asked.

## 2. Hard Invariants (Never Violate)
1. **Format isolation:** a ticket scoped to one artifact type (`.html`) must not change
   bytes fed to the other pipelines (`.md` content, the HTML string Chrome prints).
2. **Bilingual parity:** every change to EN publishing has the identical ID counterpart.
3. **Main.xaml ↔ Workflows/PublishDossier.xaml parity:** publishing logic exists in both
   (Main does not invoke PublishDossier). Change both or document why not.
4. **Secrets:** API key only from `.env` / user env var; any message that may contain it
   goes through `.Replace(geminiApiKey, "[REDACTED]")`. Never log request headers.
5. **Template tokens:** use `.Replace("{{TOKEN}}", v)` — never `String.Format` (CSS/JS
   braces). Replace raw content (`{{MARKDOWN_ENCODED}}`) **last**.
6. **Idempotent reruns:** don't break the `If_2` skip predicate (EN+ID PDF exist and both
   MD > 2,500 bytes) unless the ticket owns it (`JK-RPA-002`).
