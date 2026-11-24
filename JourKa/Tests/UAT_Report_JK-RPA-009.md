# [JK-RPA-009] Release Gate & UAT Verification Report (`EPIC-JK-MAIL`)

- **Issue:** `#29` (`JK-RPA-009`) — Parent Epic: `#22` (`EPIC-JK-MAIL` / `JK-RPA-003`)
- **Branch:** `test/jk-rpa-009-email-pk-e2e-uat` (based on `pre-master` `6544cb7` after `#23`–`#28` merged)
- **Project:** `JourKa` (`Modern Windows`, `.NET 10.0`, `VisualBasic`, UiPath Studio `26.10.0`, CLI `uip 1.205.0`)
- **Verification Date:** `2026-11-23`

---

## 1. Automated Regression Suite (`UiPath.Testing.Activities [25.10.3]`) — Track 1 PASSED

All 4 Given-When-Then XAML test cases under `JourKa/Tests/` are registered in `JourKa/project.json` (`designOptions.fileInfoCollection`) and passed per-file `uip rpa validate` (`0` errors), project `uip rpa build` (`Success: true`), and headless `uip rpa run` (`hasErrors: false`).

| Test Case | Coverage | Duration | Verdict | Verified Evidence |
|---|---|---|---|---|
| `Tests\Test_AC03_SchemaEnforcement.xaml` | `AC-03`, `E1` | `00:00:08` | **PASS** | Legacy v1 workbook (`Job` at Col A) throws `UiPath.Core.BusinessRuleException` (wrapped in `TargetInvocationException` by `InvokeCode`) citing `RecipientEmail` before `ForEachRow_1`; v2 workbook resolves `RecipientEmail=0`, `Job=1`, `AbroadMarkets=2`, `StudentName=3` by column name. |
| `Tests\Test_AC04_FormalEmailTemplateAndXss.xaml` | `AC-04`, `E6`, XSS | `00:00:11` | **PASS** | Exact formal Subject (`em-dash` safe), `Dear Rina &amp; Wijaya and Parent/Guardian,`, 0 unreplaced `[Tokens]`, all 4 template sections present, `E6` blank `StudentName` → `Valued Student`, `<script>` / `<img>` / `<b>` XSS payloads neutralized via `WebUtility.HtmlEncode`. |
| `Tests\Test_E8E9_SmtpFailureAndRedaction.xaml` | `E8`, `E9`, `E7` | `00:00:27` | **PASS** | 0-byte attachment rejected immediately (`Email attachment is 0 bytes`); simulated SMTP `535` server triggers `RetryScope` failure with `out_Success=False` and redacts both `SMTP_USER` (`[REDACTED_SMTP_USER]`) and `SMTP_PASSWORD` (`[REDACTED]`). |
| `Tests\Test_E2E_MixedOutcomeBatch_AC01_to_AC07.xaml` | `AC-01`..`AC-07`, `E2`–`E7`, `E10`, Idempotency | `00:00:28` | **PASS** | **Run 1:** 5 MIME emails captured via `127.0.0.1` loopback SMTP (`anisa.putri@student.ac.id`, `dimas.pratama@school.id;parent.pratama@gmail.com`, `rina.wijaya@mail.com`, `no.name@student.ac.id`, `gamma.ok@student.ac.id`); 3 BRE rows (`Skipped - BRE`) + 1 `ForcedZeroByteRole` (`Failed - System`) received 0 emails; 0 cross-row leaks; all 9 Excel audit rows verified. **Run 2:** Idempotent rerun sent `0` additional emails (`count=5`). **Run 3 (`E10`):** Locked workbook (`FileShare.Read`) fell back cleanly to `EmailAudit_<timestamp>.csv` containing all 9 audit rows. |

### Scenario Traceability (`#22` §6 `AC-01`..`AC-07`)

| Scenario | Fixture Row / Test | Expected Outcome | Observed Outcome |
|---|---|---|---|
| **AC-01** | Row 2 (`anisa.putri@student.ac.id`, `Android Developer`, `Anisa Putri`) | 1 HTML email to `anisa.putri@student.ac.id`, `Android Developer - EN/ID.{pdf,html}` only, `EmailStatus="Sent"` | **Verified PASS** |
| **AC-02 / E5** | Row 3 (` dimas.pratama@school.id , parent.pratama@gmail.com ; `, `Video Editor`, `Singapore, Malaysia, United Kingdom`) | Normalized `;` recipients, both in `RCPT TO`, `Video Editor - EN/ID.{pdf,html}` + abroad scope in body | **Verified PASS** |
| **AC-03 / E1** | `LegacyV1Schema.xlsx` + `E2E UAT.xlsx` | Fatal BRE on Col A `!= RecipientEmail`; zero index-shift defects on `Job` (B) / `AbroadMarkets` (C) | **Verified PASS** |
| **AC-04 / E6** | Row 4 (`Rina & Wijaya`), Row 5 (`""`), XSS payload | Formal subject, `Dear Rina &amp; Wijaya and Parent/Guardian,`, `Valued Student` fallback, `HtmlEncode` XSS safety | **Verified PASS** |
| **AC-05 / E4** | Row 8 (`ANISA.PUTRI@student.ac.id`, `Mobile Engineer`) | Rejected as `Skipped - BRE` (`Duplicate Primary Key`); `Mobile Engineer` never sent to Row 2 | **Verified PASS** |
| **AC-06 / E2, E3** | Row 6 (blank email), Row 7 (`valid@student.id; invalid-email-format`) | Both skipped as `Skipped - BRE`; `0` emails to `valid@student.id`; Row 10 continues | **Verified PASS** |
| **AC-07 / E7** | Row 9 (`ForcedZeroByteRole`, 0-byte PDF) + Row 10 (`gamma.ok@student.ac.id`, `Mobile Engineer`) | Row 9 marked `Failed - System` (`0` emails, no stale leak); Row 10 receives only `Mobile Engineer` (`EN/ID.{pdf,html}`) | **Verified PASS** |

---

## 2. Multi-Client Email Rendering Audit

### 2.1 Automated Static & Headless Chrome Audit (Completed)
- **Outlook Desktop / Word Engine Readiness:** `StudentParentEmailTemplate.html` uses `xmlns:v`/`xmlns:o`, `<!--[if gte mso 9]>` `96 DPI` XML, `<!--[if mso]>` fixed `640px` table wrapper, `mso-table-lspace/rspace:0pt`, and `border-collapse` on presentation tables.
- **Gmail Web / Apple Mail Readiness:** Zero `<style>` blocks or external CSS/JS dependencies (100% inline CSS); preheader hidden span (`mso-hide:all`); `table-layout:fixed` with `word-break:break-word; overflow-wrap:anywhere` on dynamic cells (`[Student Name]`, `[Document/Report Title]`, `[Target Market Scope]`, `[Attached File Names]`, `[Recipient Email Key]`).
- **Headless Chrome Viewport Verification:**
  - **Desktop (`1280×1050`):** Centered `640px` card, crisp dark-navy header, summary table borders aligned, `Rina & Wijaya` rendered cleanly, `Recommended Next Steps` callout and disclaimer footer legible.
  - **Mobile (`375px` layout viewport):** Full card and 2-column summary table fit within `375px` with zero horizontal clipping; long `;`-delimited PK address (`rina.wijaya@mail.com;parent.wijaya@gmail.com`) wraps cleanly inside the cell.

### 2.2 Track 2 — Live Inbox & Stakeholder UAT Checklist *(Pending Real SMTP `.env` + Test Mailboxes)*
- [ ] Configure git-ignored `.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_SENDER_NAME`) and populate designated test Student & Parent/Guardian email addresses in `Desire Role List.xlsx`.
- [ ] Execute live `Main.xaml` run with user consent (`uip rpa run` or Studio `F5`).
- [ ] Verify received email rendering in **Gmail Web**.
- [ ] Verify received email rendering in **Outlook Desktop**.
- [ ] Verify received email rendering in **Mobile Email App** (iOS Mail / Gmail Mobile).
- [ ] **Product Owner Sign-Off:** *(Pending live UAT email inspection)*
- [ ] **Academic Operations Sign-Off:** *(Pending live UAT email inspection)*

---

## 3. Security, Credential Hygiene & UiPath Review Sign-Off

- **Credential & Secret Hygiene:**
  - `0` hardcoded API keys or SMTP passwords across all `.xaml` and `.html` files (`GEMINI_API_KEY` and `SMTP_*` loaded strictly from git-ignored `.env` or `User`/`Process` environment variables).
  - `SendStudentEmail.xaml` uses `SecurePassword` (`Password="{x:Null}"`), clears `smtpPasswordPlain` in `TryCatch.Finally`, and masks `SMTP_PASSWORD` (`[REDACTED]`) and `SMTP_USER` (`[REDACTED_SMTP_USER]`).
  - `Main.xaml` clears `smtpPasswordSecret` and `smtpUserSecret` in end-of-batch `TryCatch_4.Finally` and redacts all 3 secrets (`SMTP_PASSWORD`, `SMTP_USER`, `GEMINI_API_KEY`) in every `Catch` block and fallback audit CSV (`InvokeCode_6`).
- **HTML Injection (XSS) Protection:** Verified by code inspection (`RenderStudentEmail.xaml#L60`) and automated test (`Test_AC04_FormalEmailTemplateAndXss.xaml`) that `System.Net.WebUtility.HtmlEncode` wraps all 6 template tokens (`[Student Name]`, `[Document/Report Title]`, `[Target Market Scope]`, `[Attached File Names]`, `[Recipient Email Key]`, `[Generated Date]`).
- **Column-Index Safety:** Static scan confirmed `0` occurrences of `CurrentRow(0)` or `CurrentRow(1)` across all `.xaml` workflows; all lookups use exact column names (`CurrentRow("RecipientEmail")`, `CurrentRow("Job")`, `CurrentRow("AbroadMarkets")`, etc.).
- **Non-Blocking `Info` Observations (Out of Scope for `#29`):**
  1. `JourKa/Workflows/RenderStudentEmail.xaml` uses `x:Class="RenderStudentEmail"` instead of `Workflows_RenderStudentEmail` (passes `uip rpa validate`/`build` and `uip rpa run` cleanly).
  2. `JourKa/Main.xaml` retains legacy placeholder guard literal `"AIzaqwertyuiop"` (non-secret sentinel check, not a credential).
