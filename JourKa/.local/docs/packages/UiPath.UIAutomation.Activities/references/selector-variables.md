# Selector Variables

Inject variable/argument values into configured selector values. Read this file whenever writing a `{{variable}}` token or a `string.Format` selector, to get the input syntax and the stored form right.

| Location | Authoring form | Result |
|---|---|---|
| Hand-authored XAML `InArgument<string>` | Write `string.Format` | Stored/runtime form |
| Definition (`window.xaml`, `target-n.xaml`) | Pass `{{variableName}}` to CLI `update-definition`; never hand-edit | CLI writes equivalent `string.Format` |

`{{variableName}}` is CLI input only, never stored. Every referenced variable must be declared as an XAML argument or enclosing activity variable (for example, parent `Sequence`); unresolved runtime token becomes literal text. Definition files belong to [`uia-configure-target`](../skills/uia-configure-target/SKILL.md): mutate windows with `target-app update-definition`, elements with `target-anchorable update-definition`.

## In XAML

Variable-capable selector `InArgument<string>` properties:

- `Selector` — selector on `TargetApp` (Use Application/Browser). Only `TargetApp` property supporting variables.
- `ScopeSelectorArgument` — window selector on `TargetAnchorable`.
- `FullSelectorArgument` — strict element selector on `TargetAnchorable`.
- `FuzzySelectorArgument` — fuzzy element selector on `TargetAnchorable`.

Rules:

- Positional placeholders: `{0}`, `{1}`, …
- Each placeholder binds, in order, to variables listed after format string.
- Escape literal `{` and `}` as `{{` and `}}`.

VB expression:

```text
String.Format("<webctrl id='{0}' tag='{1}' />", elementId, tagName)
```

C# expression:

```text
string.Format("<webctrl id='{0}' tag='{1}' />", elementId, tagName)
```

Entire selector may be bare variable (no `string.Format`):

```text
mySelector
```

### XAML example

`TargetAnchorable` example:

```xml
<uix:TargetAnchorable Version="V6">
  <uix:TargetAnchorable.ScopeSelectorArgument>
    <InArgument x:TypeArguments="x:String">[string.Format("&lt;wnd app='chrome.exe' title='{0} - Google Chrome' /&gt;", pageTitle)]</InArgument>
  </uix:TargetAnchorable.ScopeSelectorArgument>
  <uix:TargetAnchorable.FullSelectorArgument>
    <InArgument x:TypeArguments="x:String">[string.Format("&lt;webctrl id='{0}' tag='BUTTON' /&gt;", elementId)]</InArgument>
  </uix:TargetAnchorable.FullSelectorArgument>
  <uix:TargetAnchorable.FuzzySelectorArgument>
    <InArgument x:TypeArguments="x:String">[string.Format("&lt;webctrl id='{0}' /&gt;", elementId)]</InArgument>
  </uix:TargetAnchorable.FuzzySelectorArgument>
</uix:TargetAnchorable>
```

`TargetApp.Selector` example:

```xml
<uix:TargetApp Version="V3">
  <uix:TargetApp.Selector>
    <InArgument x:TypeArguments="x:String">[string.Format("&lt;wnd app='chrome.exe' title='{0} - Google Chrome' /&gt;", pageTitle)]</InArgument>
  </uix:TargetApp.Selector>
</uix:TargetApp>
```

## In definition files

Definition is serialized `TargetApp`/`TargetAnchorable` plus sibling `*.xaml.metadata`. CLI atomically rewrites both. Pass `{{variableName}}` to `update-definition`; never hand-edit or pass handwritten `string.Format`.

`{{...}}` input syntax:

- Token must be valid identifier; otherwise literal.
- Repeated variable uses same placeholder (`{0}`) and one trailing argument per distinct variable.
- Bare entire-selector variable (for example, `mySelector`) stores direct variable expression.

### Element selector (`target-anchorable`)

The `strictSelector`, `fuzzySelector`, and `semantic` entries of `--search-steps`, plus `--scope-selector` (window), accept `{{variable}}`; the strict and fuzzy selectors are mutually exclusive.

```bash
uip rpa uia target-anchorable update-definition \
  --definition-file-path "C:/path/to/target-1.xaml" \
  --search-steps "{'strictSelector':{'value':'<webctrl data-test=\'{{testName}}\' data-field=\'result\' tag=\'INPUT\' />'}}"
```

CLI stores:

```xml
<uix:TargetAnchorable.FullSelectorArgument>
  <InArgument x:TypeArguments="x:String">[string.Format("&lt;webctrl data-test='{0}' data-field='result' tag='INPUT' /&gt;", testName)]</InArgument>
</uix:TargetAnchorable.FullSelectorArgument>
```

### Window selector (`target-app`)

`--selector`, `--url` ([Browser URL](#browser-url-target-app)), `--file-path` and `--working-directory` ([Desktop launch settings](#desktop-launch-settings-target-app)) are the variable-capable `TargetApp` options.

```bash
uip rpa uia target-app update-definition \
  --definition-file-path "C:/path/to/window.xaml" \
  --selector "<wnd app='chrome.exe' title='{{pageTitle}} - Google Chrome' />"
```

CLI stores:

```xml
<uix:TargetApp.Selector>
  <InArgument x:TypeArguments="x:String">[string.Format("&lt;wnd app='chrome.exe' title='{0} - Google Chrome' /&gt;", pageTitle)]</InArgument>
</uix:TargetApp.Selector>
```

### Browser URL (`target-app`)

`--url` accepts `{{variable}}` for browser definitions only (`<html>` selector); the CLI rejects it for any other literal selector. CLI stores equivalent `string.Format` in `TargetApp.Url`.

```bash
uip rpa uia target-app update-definition \
  --definition-file-path "C:/path/to/window.xaml" \
  --url "https://contoso.com/orders/{{orderId}}"
```

### Desktop launch settings (`target-app`)

`--file-path` and `--working-directory` accept `{{variable}}`; the CLI rejects `--file-path` when the literal selector targets a browser (`<html>` selector). CLI stores equivalent `string.Format` in `TargetApp.FilePath` / `TargetApp.WorkingDirectory`.

```bash
uip rpa uia target-app update-definition \
  --definition-file-path "C:/path/to/window.xaml" \
  --file-path "{{installDir}}/Acme/Acme.exe" \
  --working-directory "{{installDir}}/Acme"
```

## Verifying a parametrized definition

A definition storing `{{variable}}` tokens is validated against the live app by supplying the values its tokens resolve to, via `--variables` (JSON object, variable name -> string value). Check [`variables.schema.json`](schemas/variables.schema.json) for how the JSON must be formed, and [`cli-reference.md`](cli-reference.md) for which variables each command requires.

```bash
# Element definition
uip rpa uia target-anchorable validate \
  --definition-file-path "C:/path/to/target-1.xaml" \
  --variables "{'productName':'Wireless Mouse M185'}"

# Window definition
uip rpa uia target-app validate \
  --definition-file-path "C:/path/to/window.xaml" \
  --variables "{'pageTitle':'Home'}"
```

## Conversion between the two forms

| Form | Where it appears | Example |
|------|------------------|---------|
| `{{variable}}` | input to `update-definition` (CLI/UI "string view") | `<webctrl id='{{x}}' />` |
| `string.Format` | `InArgument` stored in XAML / definition file | `string.Format("<webctrl id='{0}' />", x)` |
