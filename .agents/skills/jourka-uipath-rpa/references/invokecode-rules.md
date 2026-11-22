# InvokeCode (VB.NET) Rules for JourKa

Distilled from the vendor `_INVOKE-CODE.md` + JourKa history. Apply to every edited `.vb` body.

## Compilation model
- Body is wrapped in `Module ... Sub Run(ByVal in_X As T, ByRef out_Y As T)` with
  **`Option Strict On` + `Option Explicit On`**. Write the method body only.
- No `Return` at top level (it's a `Sub`); assign `out_*` args. `Return` inside lambdas is fine.
- Imports come from the workflow's `TextExpression.NamespacesForImplementation`.
  `PublishDossier.xaml` imports far fewer namespaces than `Main.xaml` → **always use fully
  qualified names** (`System.IO.File`, `System.Text.RegularExpressions.Regex`,
  `System.Net.WebUtility`, `System.Uri.EscapeDataString`) so code is portable between both.
- Compilation errors are never suppressed by `ContinueOnError`.

## Option Strict traps seen in this repo
- Declare every type: `Dim x As String = ...`, lambdas as `Func(Of String, String)` /
  `Action(Of String, String, String, String, String)`.
- Multi-line `Sub(...)`/`Function(...)` lambdas need explicit parameter types.
- `JToken` → string: `.ToString()`; integer → string: `.ToString()`; no implicit `Object` ops.
- `Char` literals: `","c`. Arrays: `New String() {"a", "b"}`.

## File / process hygiene
- Text output: `System.IO.File.WriteAllText(path, s, System.Text.Encoding.UTF8)` (writes a
  BOM — existing artifacts have it; stay consistent).
- Temp files: `System.IO.Path.Combine(System.IO.Path.GetTempPath(), "jourka_<purpose>_" & Guid.NewGuid().ToString("N") & ".<ext>")`,
  always deleted in `Finally` inside its own `Try/Catch` (deletion failure must not mask the real error).
- External processes: after `WaitForExit(ms)` returns `False`, `p.Kill(True)` and
  `p.WaitForExit(5000)` **before** deleting input files the process may still read.
- Never swallow exceptions silently in new code unless matching existing best-effort
  scraping semantics; prefer surfacing via an `out_*` status string.

## Templates
- Load with `System.IO.File.ReadAllText(p, System.Text.Encoding.UTF8)`.
- Fill with chained `.Replace("{{TOKEN}}", value)`; HTML-encode every value except
  pre-built trusted HTML (`{{META_PILLS_HTML}}`, built from encoded parts).
- Replace `{{MARKDOWN_ENCODED}}` **last** so LLM content containing literal `{{...}}` is
  never re-substituted.
- After filling, assert no `{{` placeholder from the known token list remains.

## XML attribute encoding (handled by InvokeCodeTool)
`&`→`&amp;`, `<`→`&lt;`, `>`→`&gt;`, `"`→`&quot;`, newline→`&#xA;`, tab→`&#x9;`.
If you must hand-edit a one-liner, follow the same mapping.
