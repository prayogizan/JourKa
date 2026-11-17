# UIAutomation CLI Reference

Entry: `uip rpa uia` (for example, `uip rpa uia object-repository get-apps`).

Command shapes, examples, behavior. Grep `^##`; read matching section; get flags from `<command> --help`. Top-level `uip rpa uia --help` intentionally lists no subcommands.

## Common Options

All commands accept:

| Option | Flags | Description | Required |
|--------|-------|-------------|----------|
| `project-dir` | `--project-dir <project-dir>` | Project directory. | No (default: current directory) |

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Success; for a command that processes several items, every item succeeded. |
| `1` | Failure: the command did not run, or every item failed. |
| `3` | Partial failure: some items failed, the others succeeded. |

These commands process several items and print one result per item whatever the code (on stderr when every item failed): `object-repository create-elements`, `replace-elements`, `replace-screens`, `link-elements`, `get-elements-xaml`; `target-anchorable resolve-defaults`, `link`, `fuzzify`, `fuzzify-anchors`; `target-app resolve-defaults`. On `3`, the succeeded items are applied (created, replaced, linked, written); match each result to its item and retry only the failed ones.

## Remote support

`--remote` runs a command against the remote machine (robot) of the active remote session. Only the commands below accept it; every other command fails with the flag. Rules: [ui-automation-guide.md § Live authoring on a remote machine](../ui-automation-guide.md#live-authoring-on-a-remote-machine---remote).

| Group | Accepts `--remote` | Local only |
|---|---|---|
| `snapshot`, `selector-intelligence`, `interact`, `permissions`, `reset` | all | none |
| `target-app` | `resolve-defaults`, `validate` | `link`, `get-definition`, `update-definition` |
| `target-anchorable` | `resolve-defaults`, `validate`, `validate-anchor`, `preview-text`, `add-anchor`, `enable-steps`, `enable-anchor-steps` | `link`, `get-definition`, `update-definition`, `update-anchor-definition`, `disable-steps`, `disable-anchor-steps`, `remove-anchor`, `fuzzify`, `fuzzify-anchors` |
| `object-repository`, `uip rpa indicate-*` | none | all |

## Variables

Commands that search the live application for a selector accept `--variables <json>`: selector variable values as a JSON object, variable name -> string value ([`variables.schema.json`](schemas/variables.schema.json)). Required whenever the parts of a selector that the command searches with store `{{variable}}` tokens: each token resolves to its value before the search. A used variable without a value (option omitted, name missing, value not valid inside a selector) fails the command. Check the schema for how the JSON must be formed. Entries the definition does not use are ignored, as are variables of steps that are disabled on the definition; definitions without variables need no `--variables`. Quote the JSON as one literal, like `--refs`.

## Search Step Names

Options that take search step names accept `Strict`, `Fuzzy`, `CV`, `Semantic`, or `Image` (case-insensitive), mapping respectively to the definition's `Selector`, `FuzzySelector`, `CV`, `SemanticSelector`, or `Image` search step.

## Object Repository

**Base command:** `uip rpa uia object-repository`

`get-apps`, `get-screens`, and `get-elements` exit zero when nothing matches, printing a no-results message instead.

### Applications

#### Create Application

Create application entry.

Syntax: `uip rpa uia object-repository create-app [options]`

```bash
# Version defaults to "1.0.0"
uip rpa uia object-repository create-app --name "My Web App"

uip rpa uia object-repository create-app --name "My Web App" --description "The main web application"

uip rpa uia object-repository create-app --name "My Web App" --version "2.0.0"
```

#### Get Applications

Get all applications.

```bash
uip rpa uia object-repository get-apps [options]
```

Only common options.

```bash
uip rpa uia object-repository get-apps

uip rpa uia object-repository get-apps --project-dir "C:\MyProject"
```

#### Get Application

Get application by reference ID.

Syntax: `uip rpa uia object-repository get-app [options]`

```bash
uip rpa uia object-repository get-app --reference-id "app-123"
```

#### Delete Application

Delete application entry.

Syntax: `uip rpa uia object-repository delete-app [options]`

```bash
uip rpa uia object-repository delete-app --reference-id "app-123"
```

### Screens

#### Create Screen

Create screen entry from definition file.

Syntax: `uip rpa uia object-repository create-screen [options]`

```bash
# --app-reference-id is required; create the application first with create-app
uip rpa uia object-repository create-screen --definition-file-path "path/to/login.xaml" --app-reference-id "app-123"
```

Notes:

- The screen stores the definition's input mode (`target-app update-definition --input-mode`), if any; `link-screen` applies it.

#### Get Screens

Get screens, optionally filtered.

Syntax: `uip rpa uia object-repository get-screens [options]`

```bash
uip rpa uia object-repository get-screens

# Filter by definition file's window selector
uip rpa uia object-repository get-screens --definition-file-path "path/to/definition.xaml"

uip rpa uia object-repository get-screens --app-reference-id "app-123"
```

#### Get Screen

Get screen by reference ID.

Syntax: `uip rpa uia object-repository get-screen [options]`

```bash
uip rpa uia object-repository get-screen --reference-id "screen-456"
```

#### Get Screen XAML

Get screen's XAML representation.

Syntax: `uip rpa uia object-repository get-screen-xaml [options]`

```bash
uip rpa uia object-repository get-screen-xaml --reference-id "screen-456"
```

#### Delete Screen

Delete screen entry.

Syntax: `uip rpa uia object-repository delete-screen [options]`

```bash
uip rpa uia object-repository delete-screen --reference-id "screen-456"
```

### Elements

#### Create Elements

Create multiple element entries from definition files in single batch.

Syntax: `uip rpa uia object-repository create-elements [options]`

```bash
uip rpa uia object-repository create-elements \
  --screen-reference-id "screen-456" \
  --definition-file-paths "path/to/username.xaml,path/to/password.xaml"
```

#### Get Elements

Get elements for given screen.

Syntax: `uip rpa uia object-repository get-elements [options]`

```bash
uip rpa uia object-repository get-elements --screen-reference-id "screen-456"
```

#### Get Element

Get element by reference ID.

Syntax: `uip rpa uia object-repository get-element [options]`

```bash
uip rpa uia object-repository get-element --reference-id "elem-789"
```

#### Get Elements XAML

Get XAML representation of multiple elements in single batch.

Syntax: `uip rpa uia object-repository get-elements-xaml [options]`

```bash
uip rpa uia object-repository get-elements-xaml --reference-ids "elem-789,elem-012"
```

#### Delete Element

Delete element entry.

Syntax: `uip rpa uia object-repository delete-element [options]`

```bash
uip rpa uia object-repository delete-element --reference-id "elem-789"
```

#### Replace Elements

Replace multiple elements from definition files in single batch.

Syntax: `uip rpa uia object-repository replace-elements [options]`

`--elements <json>`: one `{referenceId, definitionFilePath}` entry per element. Full schema: [replace-elements.schema.json](schemas/replace-elements.schema.json).

```bash
uip rpa uia object-repository replace-elements \
  --elements "[{'referenceId':'elem-789','definitionFilePath':'path/to/username.xaml'}]"

uip rpa uia object-repository replace-elements \
  --elements "[{'referenceId':'elem-789','definitionFilePath':'path/to/username.xaml'},{'referenceId':'elem-012','definitionFilePath':'path/to/password.xaml'}]"
```

Replacing an element with its own definition recovers stale or empty coded descriptors while keeping the reference ID: [coded-authoring-guide.md § Step 1](coded-authoring-guide.md).

#### Replace Screens

Replace multiple screens from definition files in single batch.

Syntax: `uip rpa uia object-repository replace-screens [options]`

`--screens <json>`: one `{referenceId, definitionFilePath}` entry per screen. Full schema: [replace-screens.schema.json](schemas/replace-screens.schema.json).

```bash
uip rpa uia object-repository replace-screens \
  --screens "[{'referenceId':'scr-456','definitionFilePath':'path/to/window.xaml'}]"
```

Notes:

- Each screen takes the input mode of its definition (`target-app update-definition --input-mode`); a definition without one removes the screen's.

### Linking

#### Link Elements

Link one or more elements to activities in XAML workflow.

Syntax: `uip rpa uia object-repository link-elements [options]`

`--elements <json>`: one `{workflowFilePath, activityId, referenceId, targetProperty?}` entry per (activity, element) pair. Full schema: [link-elements.schema.json](schemas/link-elements.schema.json).

```bash
# targetProperty defaults to "Target"
uip rpa uia object-repository link-elements \
  --elements "[{'workflowFilePath':'<PROJECT_DIR>/Main.xaml','activityId':'act-123','referenceId':'elem-789'}]"

# Per-entry target properties and workflow paths
uip rpa uia object-repository link-elements \
  --elements "[{'workflowFilePath':'<PROJECT_DIR>/Main.xaml','activityId':'act-123','referenceId':'elem-789','targetProperty':'Target'},{'workflowFilePath':'<PROJECT_DIR>/Main.xaml','activityId':'act-456','referenceId':'elem-012','targetProperty':'SearchedElement.Target'}]"
```

#### Link Screen

Link screen to activity in XAML workflow.

Syntax: `uip rpa uia object-repository link-screen [options]`

```bash
uip rpa uia object-repository link-screen \
  --workflow-file-path "<PROJECT_DIR>/Main.xaml" \
  --activity-id "act-456" \
  --reference-id "screen-789"
```

Notes:

- The input mode stored on the screen is applied to the Use Application/Browser activity; without one, the activity keeps its own.
- A changed input mode is reported: `The activity's input mode changed from 'Simulate' to 'HardwareEvents'.`

### Definitions

#### Get Element Definition

Get element definition.

Syntax: `uip rpa uia object-repository get-element-definition [options]`

```bash
uip rpa uia object-repository get-element-definition \
  --definition-file-path "path/to/target.xaml" \
  --reference-id "elem-789"
```

#### Get Screen Definition

Get screen definition.

Syntax: `uip rpa uia object-repository get-screen-definition [options]`

```bash
uip rpa uia object-repository get-screen-definition \
  --definition-file-path "path/to/target.xaml" \
  --reference-id "screen-456"
```

## Target Anchorable

**Base command:** `uip rpa uia target-anchorable`

### Link

Link one or more target anchorable definition files to activities in XAML workflow.

Syntax: `uip rpa uia target-anchorable link [options]`

`--targets <json>`: one `{workflowFilePath, activityId, definitionFilePath, targetProperty?}` entry per (activity, definition) pair. Full schema: [link-targets.schema.json](schemas/link-targets.schema.json).

```bash
uip rpa uia target-anchorable link \
  --targets "[{'workflowFilePath':'<PROJECT_DIR>/Main.xaml','activityId':'act-123','definitionFilePath':'path/to/target.xaml'}]"

# Per-entry target properties and workflow paths
uip rpa uia target-anchorable link \
  --targets "[{'workflowFilePath':'<PROJECT_DIR>/Main.xaml','activityId':'act-123','definitionFilePath':'path/to/t1.xaml'},{'workflowFilePath':'<PROJECT_DIR>/Main.xaml','activityId':'act-456','definitionFilePath':'path/to/t2.xaml','targetProperty':'SearchedElement.Target'}]"
```

### Get Definition

Get target anchorable definition.

Syntax: `uip rpa uia target-anchorable get-definition [options]`

```bash
uip rpa uia target-anchorable get-definition \
  --definition-file-path "path/to/target.xaml" \
  --activity-id "act-1" \
  --workflow-file-path "<PROJECT_DIR>/workflows/Main.xaml"

uip rpa uia target-anchorable get-definition \
  --definition-file-path "path/to/target.xaml" \
  --activity-id "act-1" \
  --workflow-file-path "<PROJECT_DIR>/workflows/Main.xaml" \
  --target-property "SearchedElement.Target"
```

### Validate

Validate target anchorable definition against live application. Probes live UI for target and its anchors, reports whether it matched. On match, saves screenshot with matched element highlighted, prints its path. Works for both selector-based and Computer Vision (CV) definitions. Exits `0` only on match. A no-match (not found, found but not visible, several matches, `--step` not configured) exits `1` and prints its `Validation:` line on stderr; a search that hits an error (e.g., a targeting method that cannot run) exits `1` and prints that error instead.

Syntax: `uip rpa uia target-anchorable validate [options]`

`--step <step>` validates one targeting method on its own instead of the whole target; takes a [search step name](#search-step-names). The definition is restricted to that step in memory only, so the other enabled methods cannot mask the outcome and the file is not modified. A step that is not enabled on the definition reports `The '<method>' step is not configured on this target, so it could not be validated.`

`--full-screen` widens the screenshot from the matched element and its immediate surroundings to the whole application.

`--ignore-anchors` validates the target without its anchors, dropped in memory only (the file is not modified): shows whether the target is found, and unique, on its own; a target that needs its anchors to tell several matches apart reports the multiple matches. Combines with `--step`. Without it, the anchors take part in the search as they do at runtime.

`--variables <json>` supported ([Variables](#variables)); needed for tokens in the selectors used. With `--step`, only the variables of that step are required, together with those of the window selector and of the anchors. With `--ignore-anchors`, the variables of the anchors are not required.

```bash
uip rpa uia target-anchorable validate \
  --definition-file-path "path/to/target.xaml"

# Whole application instead of just the match and its surroundings
uip rpa uia target-anchorable validate \
  --definition-file-path "path/to/target.xaml" \
  --full-screen

# The target alone, without its anchors
uip rpa uia target-anchorable validate \
  --definition-file-path "path/to/target.xaml" \
  --ignore-anchors

# Definition storing {{productName}}: supply the value it resolves to
uip rpa uia target-anchorable validate \
  --definition-file-path "path/to/target.xaml" \
  --variables "{'productName':'Wireless Mouse M185'}"
```

### Validate Anchor

Validate one anchor of target anchorable definition against live application, on its own: the anchor at `--index` (0..3) is searched with its own targeting methods inside the target's window selector, without the target. Reports whether it matched. On match, saves screenshot with matched anchor highlighted next to the definition as `<definition name>-anchor-<index>-screenshot.jpg`, so it does not replace the `validate` screenshot, and prints its path. The file is not modified. An index with no anchor fails, naming how many anchors the definition has. A no-match and a search error exit `1`, as for [Validate](#validate).

Syntax: `uip rpa uia target-anchorable validate-anchor [options]`

`--step <step>` validates one targeting method of the anchor on its own; takes a [search step name](#search-step-names). Anchors have no semantic targeting method, so `Semantic` is rejected. A step that is not enabled on the anchor reports `The '<method>' step is not configured on this anchor, so it could not be validated.`

`--full-screen` widens the screenshot to the whole application, as for [Validate](#validate).

`--variables <json>` supported ([Variables](#variables)); only the variables of the window selector and of the validated anchor (with `--step`, of that step) are required.

An anchor that is not unique on its own reports the multiple matches, even when the target's position tells them apart at runtime; `validate` checks the target together with its anchors.

```bash
uip rpa uia target-anchorable validate-anchor \
  --definition-file-path "path/to/target.xaml" \
  --index 0

# Only the fuzzy selector of the second anchor
uip rpa uia target-anchorable validate-anchor \
  --definition-file-path "path/to/target.xaml" \
  --index 1 \
  --step fuzzy
```

### Preview Text

Extract text a Get Text activity would return for target anchorable definition. Searches target against live application, scrapes its text — same as Studio's Preview Extraction option. Prints extracted text; an element with no text succeeds and reports an empty extraction.

Syntax: `uip rpa uia target-anchorable preview-text [options]`

`--variables <json>` supported ([Variables](#variables)); needed for tokens in the selectors used.

```bash
uip rpa uia target-anchorable preview-text \
  --definition-file-path "path/to/target.xaml"

# Specific scraping method
uip rpa uia target-anchorable preview-text \
  --definition-file-path "path/to/target.xaml" \
  --scraping-method "Fulltext"

# Definition storing {{productName}}: supply the value it resolves to
uip rpa uia target-anchorable preview-text \
  --definition-file-path "path/to/target.xaml" \
  --variables "{'productName':'Wireless Mouse M185'}"
```

### Update Definition

Update target anchorable definition file. Only provided options updated; omitted unchanged.

Syntax: `uip rpa uia target-anchorable update-definition [options]`

`--search-steps <json>` sets new values on search steps already enabled on the target: `strictSelector`, `fuzzySelector`, `semantic`, `cv` (`image` has no value to update). Provide only the steps to change, for example `{'strictSelector':{'value':'<selector xml>'},'cv':{'text':'OK','occurrence':1,'accuracy':0.9}}`. A step that is not enabled fails the command; turn steps on and off with [`enable-steps`](#enable-steps) and [`disable-steps`](#disable-steps). Only one of `strictSelector` and `fuzzySelector` is ever enabled, so naming both fails with `Only one of 'strictSelector' and 'fuzzySelector' can be specified; they are mutually exclusive.` Full schema: [search-steps.schema.json](schemas/search-steps.schema.json).

```bash
# Update the name and strict selector
uip rpa uia target-anchorable update-definition \
  --definition-file-path "path/to/target.xaml" \
  --name "Login Button" \
  --search-steps "{'strictSelector':{'value':'<wnd cls=\'LoginForm\' /><ctrl name=\'Login\' role=\'button\' />'}}"

uip rpa uia target-anchorable update-definition \
  --definition-file-path "path/to/target.xaml" \
  --scope-selector "<wnd cls='LoginForm' />" \
  --activity-type "Click"

uip rpa uia target-anchorable update-definition \
  --definition-file-path "path/to/target.xaml" \
  --search-steps "{'semantic':{'value':'the primary Login button below the password field'}}"
```

### Enable Steps

Turn search steps on for target anchorable definition. A step given values takes them as-is; a step given none has them generated from the live element.

Syntax: `uip rpa uia target-anchorable enable-steps [options]`

`--search-steps <json>` (required) names the steps to enable, each with optional values, for example `{'cv':{}}` or `{'fuzzySelector':{'value':'<selector xml>'}}`. Full schema: [search-steps.schema.json](schemas/search-steps.schema.json).

`--variables <json>` supported ([Variables](#variables)); needed for tokens in the selectors used. Required only when enabling a search step would trigger a live search and the existing selectors use tokens.

```bash
# Switch from the strict selector to a fuzzy one with an explicit value (strict is turned off after enabling fuzzy)
uip rpa uia target-anchorable enable-steps \
  --definition-file-path "path/to/target.xaml" \
  --search-steps "{'fuzzySelector':{'value':'<ctrl name=\'Login\' role=\'button\' />'}}"

# Convert the strict selector to a fuzzy one, without searching (strict is turned off after enabling fuzzy)
uip rpa uia target-anchorable enable-steps \
  --definition-file-path "path/to/target.xaml" \
  --search-steps "{'fuzzySelector':{}}"

# Add computer vision from the live element, overriding the text it matches
uip rpa uia target-anchorable enable-steps \
  --definition-file-path "path/to/target.xaml" \
  --search-steps "{'cv':{'text':'Login'}}"

# Definition storing {{productName}}: supply the value the live search resolves it to
uip rpa uia target-anchorable enable-steps \
  --definition-file-path "path/to/target.xaml" \
  --search-steps "{'semantic':{}}" \
  --variables "{'productName':'Wireless Mouse M185'}"
```

Notes:

- A step that is already enabled fails the command; change its values with [`update-definition`](#update-definition).
- Generating values needs the live element. The command finds it itself, from the definition's scope selector, so no snapshot is needed, but the application must be open. The element is searched with the definition as it was before the command; not finding it fails the command. A `strictSelector` or `fuzzySelector` given no value is instead converted from the other selector when that one is enabled, without a live search.
- `cv` is always generated from the live element; values given are applied on top.
- `strictSelector` and `fuzzySelector` are mutually exclusive: enabling one turns the other off, and naming both fails.
- `image` cannot be enabled yet.

### Disable Steps

Turn search steps off on target anchorable definition.

Syntax: `uip rpa uia target-anchorable disable-steps [options]`

`--search-steps <json>` (required) is a JSON array of the [search step names](#search-step-names) to disable, for example `['CV','Image']`.

```bash
uip rpa uia target-anchorable disable-steps \
  --definition-file-path "path/to/target.xaml" \
  --search-steps "['CV','Image']"

# Replace the strict selector with computer vision: enable the new step first, then drop the old one
uip rpa uia target-anchorable enable-steps \
  --definition-file-path "path/to/target.xaml" \
  --search-steps "{'cv':{}}"
uip rpa uia target-anchorable disable-steps \
  --definition-file-path "path/to/target.xaml" \
  --search-steps "['Strict']"
```

Notes:

- A step that is not enabled is skipped.
- At least one valid step must remain enabled, else the command fails.

### Resolve Defaults

Resolve target anchorable definitions from snapshot refs (`w*`/`b*`/`e*`) or CV refs (`cve*` element / `cvw*` word); write one definition file per entry. CV refs resolve into CV-based definitions. Ref kinds can mix in one call; failures reported per entry. Each entry may also carry `name`/`description`, written to the created definition's metadata immediately (CV refs no longer default `name` to the application's name — set it explicitly if wanted).

Syntax: `uip rpa uia target-anchorable resolve-defaults [options]`

`--refs <json>`: one entry per element, each with `definitionFilePath` plus `ref` or `semanticDescription`, and optional `activityType` ([values](selection-activity-types.md)), `name`, `description`. Full schema: [target-anchorable-refs.schema.json](schemas/target-anchorable-refs.schema.json).

`--variables <json>` supported ([Variables](#variables)); needed for tokens in the window definition's `Selector`. The created definitions keep the `{{variable}}` tokens of the scope selector.

`--window-ref` is required for CV refs (`cve*`/`cvw*`) and for entries with a semantic description

```bash
uip rpa uia target-anchorable resolve-defaults \
  --refs "[{'ref':'e42','definitionFilePath':'path/to/target.xaml','activityType':'Click'}]" \
  --window-definition-file-path "path/to/window.xaml" \
  --window-ref "w1"

# Per-entry activity types
uip rpa uia target-anchorable resolve-defaults \
  --refs "[{'ref':'e28','definitionFilePath':'path1.xaml','activityType':'Click'},{'ref':'e30','definitionFilePath':'path2.xaml','activityType':'TypeInto'}]" \
  --window-definition-file-path "path/to/window.xaml"

# Per-entry name/description, set on creation
uip rpa uia target-anchorable resolve-defaults \
  --refs "[{'ref':'e28','definitionFilePath':'path1.xaml','activityType':'Click','name':'Login Button','description':'Button that submits the login form'}]" \
  --window-definition-file-path "path/to/window.xaml"

# CV refs picked from cv-tree.yml (requires prior `snapshot capture --type cv`)
uip rpa uia target-anchorable resolve-defaults \
  --refs "[{'ref':'cve4','definitionFilePath':'path1.xaml','activityType':'Click'},{'ref':'cvw3','definitionFilePath':'path2.xaml','activityType':'GetText'}]" \
  --window-definition-file-path "path/to/window.xaml" \
  --window-ref "w1"

# From semantic description (no element ref needed): semantic-selector-only target.
uip rpa uia target-anchorable resolve-defaults \
  --refs "[{'definitionFilePath':'path/to/target.xaml','activityType':'Click','semanticDescription':'the submit button'}]" \
  --window-definition-file-path "path/to/window.xaml" \
  --window-ref "w1"

# Window selector storing {{customerName}}: supply the value it resolves to
uip rpa uia target-anchorable resolve-defaults \
  --refs "[{'ref':'e42','definitionFilePath':'path/to/target.xaml','activityType':'Click'}]" \
  --window-definition-file-path "path/to/window.xaml" \
  --variables "{'customerName':'Contoso'}"
```

> **Tip:** Inline JSON with Windows `C:\…` paths fails: `\U` etc. are invalid JSON escapes. Use forward slashes (`C:/Users/...`) inside JSON. Same applies to `--elements` / `--targets` on link commands.

### Add Anchor

Resolve anchor element from default or CV snapshot ref, append to target anchorable definition. Target anchorable holds up to four anchors (slots `0..3`); new anchor written to next free slot, command returns that slot index.

Syntax: `uip rpa uia target-anchorable add-anchor [options]`

`--variables <json>` supported ([Variables](#variables)); needed for tokens in the selectors used.

```bash
uip rpa uia target-anchorable add-anchor \
  --element-ref "e28" \
  --window-ref "w1" \
  --definition-file-path "path/to/target.xaml"

uip rpa uia target-anchorable add-anchor \
  --element-ref "e28" \
  --window-ref "w1" \
  --definition-file-path "path/to/target.xaml" \
  --name "TitleBar" \
  --description "The window title bar"

# CV anchor from word ref (requires prior `snapshot capture --type cv`)
uip rpa uia target-anchorable add-anchor \
  --element-ref "cvw3" \
  --window-ref "w1" \
  --definition-file-path "path/to/target.xaml" \
  --name "SubmitLabel" \
  --description "The static 'Submit' caption next to the button"

# Target storing {{productName}}: supply the value it resolves to
uip rpa uia target-anchorable add-anchor \
  --element-ref "e28" \
  --window-ref "w1" \
  --definition-file-path "path/to/target.xaml" \
  --variables "{'productName':'Wireless Mouse M185'}"
```

Notes:

- A target on a strict selector is converted to a fuzzy selector before the anchor is attached; a strict selector ignores anchors. The output then adds: `A strict selector ignores anchors, so the target's strict selector was converted to a fuzzy selector.`

### Remove Anchor

Remove anchor at given index from target anchorable definition. Metadata slots shift down to stay aligned with remaining anchors.

Syntax: `uip rpa uia target-anchorable remove-anchor [options]`

```bash
uip rpa uia target-anchorable remove-anchor \
  --definition-file-path "path/to/target.xaml" \
  --index 0
```

Notes:

- Removing the last anchor of a target on a fuzzy selector converts that selector to a strict one, the reverse of [`add-anchor`](#add-anchor). The output then adds: `The target has no anchors left, so its fuzzy selector was converted to a strict selector.`

### Update Anchor Definition

Update anchor properties at given index on target anchorable definition. Only provided options updated; omitted unchanged.

Syntax: `uip rpa uia target-anchorable update-anchor-definition [options]`

`--search-steps <json>` has the same shape and rules as [`update-definition`'s](#update-definition), checked against the anchor's own steps, except `semantic` is not supported on anchors. Full schema: [anchor-search-steps.schema.json](schemas/anchor-search-steps.schema.json).

```bash
# Rename an anchor and tweak its description
uip rpa uia target-anchorable update-anchor-definition \
  --definition-file-path "path/to/target.xaml" \
  --index 0 \
  --name "TitleBar" \
  --description "The window title bar"

# Replace the anchor's strict selector
uip rpa uia target-anchorable update-anchor-definition \
  --definition-file-path "path/to/target.xaml" \
  --index 1 \
  --search-steps "{'strictSelector':{'value':'<ctrl name=\'OK\' role=\'button\' />'}}"

# Update CV anchor's text; pick second on-screen occurrence
uip rpa uia target-anchorable update-anchor-definition \
  --definition-file-path "path/to/target.xaml" \
  --index 2 \
  --search-steps "{'cv':{'text':'Submit','occurrence':2}}"
```

### Enable Anchor Steps

Turn search steps on for the anchor at given index on target anchorable definition.

Syntax: `uip rpa uia target-anchorable enable-anchor-steps [options]`

`--search-steps <json>` (required) names the steps to enable, each with optional values. Full schema: [anchor-search-steps.schema.json](schemas/anchor-search-steps.schema.json).

`--variables <json>` supported ([Variables](#variables)); needed for tokens in the selectors.

```bash
# Add computer vision to the anchor, regenerated from the snapshot
uip rpa uia target-anchorable enable-anchor-steps \
  --definition-file-path "path/to/target.xaml" \
  --index 0 \
  --search-steps "{'cv':{}}"
```

Notes:

- Same rules as [`enable-steps`](#enable-steps), applied to the anchor's own steps.
- `semantic` is not supported on anchors.

### Disable Anchor Steps

Turn search steps off on the anchor at given index on target anchorable definition.

Syntax: `uip rpa uia target-anchorable disable-anchor-steps [options]`

`--search-steps <json>` (required) is a JSON array of the [search step names](#search-step-names) to disable.

```bash
uip rpa uia target-anchorable disable-anchor-steps \
  --definition-file-path "path/to/target.xaml" \
  --index 0 \
  --search-steps "['CV']"
```

Notes:

- Same rules as [`disable-steps`](#disable-steps), applied to the anchor's own steps.
- `Semantic` is not supported on anchors.

### Fuzzify

Fuzzify selector of one or more target anchorables. Per definition, strict full selector converts to fuzzy selector: fuzzy search step enabled, strict selector step disabled. Definitions are processed independently — failure on one entry does not abort others.

```bash
uip rpa uia target-anchorable fuzzify [options]
```

`--definition-file-paths <json>`: array of definition file paths. Full schema: [fuzzify-definition-file-paths.schema.json](schemas/fuzzify-definition-file-paths.schema.json).

Definition fails to fuzzify (reported with an `Error:` line) when its fuzzy selector already enabled, no strict selector enabled to convert, or fuzzy selector generation fails.

```bash
uip rpa uia target-anchorable fuzzify \
  --definition-file-paths "['path/to/target.xaml']"

uip rpa uia target-anchorable fuzzify \
  --definition-file-paths "['path/to/t1.xaml','path/to/t2.xaml']"
```

### Fuzzify Anchors

Fuzzify selector of an anchor within target anchorable definition file. Like `fuzzify`, but targets anchor at given slot index rather than target itself. Entries are processed independently — failure on one entry does not abort others.

```bash
uip rpa uia target-anchorable fuzzify-anchors [options]
```

`--anchors <json>`: one `{definitionFilePath, index}` entry per anchor; `index` is zero-based and defaults to `0`. Full schema: [fuzzify-anchors.schema.json](schemas/fuzzify-anchors.schema.json).

Anchor fails to fuzzify (reported with an `Error:` line) when index out of range, its fuzzy selector already enabled, no strict selector enabled to convert, or fuzzy selector generation fails.

```bash
uip rpa uia target-anchorable fuzzify-anchors \
  --anchors "[{'definitionFilePath':'path/to/target.xaml','index':0}]"

uip rpa uia target-anchorable fuzzify-anchors \
  --anchors "[{'definitionFilePath':'path/to/t1.xaml','index':0},{'definitionFilePath':'path/to/t2.xaml','index':1}]"
```

## Target App

**Base command:** `uip rpa uia target-app`

### Link

Link target application to activity in XAML workflow.

Syntax: `uip rpa uia target-app link [options]`

```bash
uip rpa uia target-app link \
  --definition-file-path "path/to/app.xaml" \
  --workflow-file-path "<PROJECT_DIR>/Main.xaml" \
  --activity-id "act-123"
```

Notes:

- The input mode stored with the definition (`target-app update-definition --input-mode`) is applied to the Use Application/Browser activity; without one, the activity keeps its own.
- A changed input mode is reported: `The activity's input mode changed from 'Simulate' to 'HardwareEvents'.`

### Get Definition

Get target application definition.

Syntax: `uip rpa uia target-app get-definition [options]`

```bash
uip rpa uia target-app get-definition \
  --definition-file-path "path/to/target.xaml" \
  --activity-id "act-1" \
  --workflow-file-path "<PROJECT_DIR>/workflows/Main.xaml"
```

### Update Definition

Update target app definition file. Only provided options updated; omitted unchanged.

Syntax: `uip rpa uia target-app update-definition [options]`

```bash
uip rpa uia target-app update-definition \
  --definition-file-path "path/to/app.xaml" \
  --name "My Web App" \
  --selector "<wnd cls='MainWindow' />"

# Point a browser definition at a parametrized URL
uip rpa uia target-app update-definition \
  --definition-file-path "path/to/app.xaml" \
  --url "https://contoso.com/orders/{{orderId}}"

# Desktop: parametrized executable, no working directory, Simulate input
uip rpa uia target-app update-definition \
  --definition-file-path "path/to/app.xaml" \
  --file-path "{{appPath}}" \
  --working-directory "" \
  --input-mode Simulate
```

Notes:

- A literal `--selector` also sets the browser type of the definition. The URL, file path, arguments and working directory are kept as they are.
- `--url`, `--file-path` and `--working-directory` accept `{{variable}}` tokens like `--selector` ([selector-variables.md](selector-variables.md)); an empty value clears the setting.
- `--url` is for browser definitions only: the selector, after any `--selector` in the same call, must be the browser tab's `<html>` selector. Any other literal selector is rejected, including a blank one and a browser's window selector (`<wnd app='chrome.exe' />`).
- `--file-path` is for desktop definitions only: setting it fails without writing when the selector, after any `--selector` in the same call, is a browser tab's `<html>` selector. Clearing is always allowed. To start Chrome or Edge from a custom executable, set *Custom executable path for OpenBrowser Chrome/Edge* in the project settings (UI Automation Classic > Browser).
- `--input-mode` is stored with the definition and applied when it is linked or added to the Object Repository; `--input-mode None` removes it. `WindowMessages` and `Background` are for Windows projects only; cross-platform projects don't offer them, and the command does not check the project type.

### Resolve Defaults

Resolve target apps from snapshot refs; write target definition files.

Syntax: `uip rpa uia target-app resolve-defaults [options]`

`--refs <json>`: one `{ref, definitionFilePath, name}` entry per window, with optional `description`; `ref` being a top-level `w*`/`b*` ref. Full schema: [target-app-refs.schema.json](schemas/target-app-refs.schema.json).

```bash
uip rpa uia target-app resolve-defaults \
  --refs "[{'ref':'w1','definitionFilePath':'path/to/app.xaml','name':'My Web App'}]"

uip rpa uia target-app resolve-defaults \
  --refs "[{'ref':'w1','definitionFilePath':'path/to/app.xaml','name':'My Web App','description':'The main web application'}]"
```

Notes:

- Stores the project's default input mode, not one proven live; set the proven one with `update-definition --input-mode` before linking.

### Validate

Validate target application definition against live desktop. Probes live UI for application window, reports whether it matched. On match, saves screenshot of application, prints its path. A no-match exits `1` and prints `The application was not found against the live desktop.` on stderr.

Syntax: `uip rpa uia target-app validate [options]`

`--variables <json>` supported ([Variables](#variables)); needed for tokens in the selector.

```bash
uip rpa uia target-app validate \
  --definition-file-path "path/to/app.xaml"

# Window selector storing {{pageTitle}}: supply the value it resolves to, XML-escaped
uip rpa uia target-app validate \
  --definition-file-path "path/to/app.xaml" \
  --variables "{'pageTitle':'Rpa&apos;s Challenge'}"
```

## Snapshot

**Base command:** `uip rpa uia snapshot`

**Framework values by platform.** `Default` and `Java` everywhere; `UIA` and `AA` Windows-only; `AX` macOS-only.

**Ref lifecycle.** `uia interact` resolves against latest snapshot regardless of producer. New snapshot replaces prior refs:

- **Top-level snapshots** reset **all** refs and mint fresh `wN`/`bN` — they carry no `eN` refs.
- **App-level snapshots** re-mint `eN`; `wN`/`bN` remain until top-level snapshot changes.
- Old ref may not report stale; it can resolve to current element with same number.

### Capture

Extract live snapshot into `--folder-path`. Positional `w/b-ref` selects scope:

- **Omitted** — desktop top-level windows + browser tabs (`wN`/`bN`): `window-tree.yml`, `top-level-node-tree-info.json`, `top-level-metadata.json`, `top-level-screenshot.png`.
- **Given** — that window's element tree (`eN`): `tree.yml`, `application-level-node-tree-info.json`, `application-level-metadata.json`, `application-screenshot.png`.
- **Given + `--type cv`** — that window's visible elements (`cveN`/`cvwN`): `cv-tree.yml`, `cv-application-screenshot.png`.

Artifacts are written directly into `--folder-path`; stdout opens with an `Artifacts folder:` line giving that folder, then links each artifact by file name relative to it.

Screenshots unannotated; box an element with [`interact highlight`](#highlight). Seed refs from on-disk artifacts with [`snapshot load`](#load).

**CV scope by ref kind.** A browser-tab `bN` restricts `cv-tree.yml` to page content. A `wN` naming a browser window covers the whole browser — page content plus tab strip, address bar, bookmarks — since a window ref means the entire window. `cv-application-screenshot.png` is always the full window grab, so for a `bN` it is wider than the analysed region; map `cveN`/`cvwN` coordinates against the window, not the tree's extent.

Syntax: `uip rpa uia snapshot capture [w/b-ref] [options]`

```bash
# Desktop; pick wN/bN from the rendered tree
uip rpa uia snapshot capture \
  --folder-path "path/to/output"

# Keep every top-level window
uip rpa uia snapshot capture \
  --folder-path "path/to/output" \
  --all-windows

# One window's elements
uip rpa uia snapshot capture w1 \
  --folder-path "path/to/output"

# Retry sparse tree with explicit framework
uip rpa uia snapshot capture w1 \
  --folder-path "path/to/output" \
  --framework uia

# Computer Vision
uip rpa uia snapshot capture b3 \
  --folder-path "path/to/output" \
  --type cv
```

### Load

Seed ref cache from snapshot artifacts already in a folder; reads no live UI. For when refs are gone but artifacts survive — restarted host, or runtime tree dumped on another machine.

Reads whichever of `top-level-node-tree-info.json` / `application-level-node-tree-info.json` is present; fails when neither is. Renders `tree.yml` from element JSON using subsystem from sibling metadata, so a dump shipping only JSON becomes readable. `window-tree.yml` reported as-is when already present; assembling one needs live nodes.

As with capture, stdout opens with an `Artifacts folder:` line giving the absolute folder, even for a relative `--folder-path`, then links each artifact by file name relative to it.

`wN`/`bN` refs resolve live: a top-level node's stored selector is desktop-rooted, so it can be searched for again. `eN` refs are read-only: an element's stored selector is container-relative, and nothing in the artifacts links the element tree to a `wN`. They render in `tree.yml` and feed `selector-intelligence`; `uia interact` reports them stale. For actionable element refs, run `snapshot capture <w/b-ref>` against the live application.

Syntax: `uip rpa uia snapshot load [options]`

```bash
uip rpa uia snapshot load \
  --folder-path "path/to/output"
```

### Semantic Find

Find elements in window or browser tab by natural-language description. Recommended when app is not supported by tree-based snapshot flow. Returns up to 3 matches, each outlined on annotated screenshot in distinct colour and minted a semantic ref (`s1`, `s2`, …) for `interact click`/`type`/`hover`/`wheel`.

```bash
uip rpa uia snapshot semantic-find <w/b-ref> "<description>" [options]
```

Matches in no specific order — identify right one visually by outline colour (each match reports its colour name and hex). No matches and too-many-matches both exit non-zero; refine description. s-refs are screen positions captured at find time: each run resets previous ones, and they go stale if layout changes.

```bash
uip rpa uia snapshot semantic-find b2 "the red Submit button"
uip rpa uia interact click s1

uip rpa uia snapshot semantic-find w1 "row checkbox"
uip rpa uia interact click s2

# Avoid hard-to-spot highlight colours
uip rpa uia snapshot semantic-find w1 "the search box" --exclude-color yellow --exclude-color green

```

## Selector Intelligence

**Base command:** `uip rpa uia selector-intelligence`

### Evaluate

Score one selector against the current snapshot tree. Needs a prior `snapshot capture` or `snapshot load` — refs resolve against the session's extracted tree, not live UI.

`--refs` pairs positionally with the selector's tags: one ref per tag, same order, last is the target. All refs must come from the same tree — all `eN`, or all `wN`/`bN`. Region refs (`sN`, `cveN`, `cvwN`) are rejected.

Syntax: `uip rpa uia selector-intelligence evaluate --selector <selector> --refs <refs> [--variables <json>]`

`--variables <json>` supported ([Variables](#variables)); needed for the `{{variable}}` tokens in `--selector`. Tokens go inside attribute values only (the unresolved selector must still be well-formed XML), and the values must not contain XML syntax that changes the number of tags when resolved in the selector, as that would break the one ref per tag rule.

```bash
# Element selector: three tags, three refs, e12 is the target
uip rpa uia selector-intelligence evaluate \
  --selector "<webctrl tag='DIV' /><webctrl tag='FORM' /><webctrl tag='INPUT' aaname='Search' />" \
  --refs e1,e5,e12

# Window selector
uip rpa uia selector-intelligence evaluate \
  --selector "<wnd app='chrome.exe' title='Invoices' />" \
  --refs w1

# Selector storing {{productName}}: supply the value it resolves to
uip rpa uia selector-intelligence evaluate \
  --selector "<webctrl tag='DIV' /><webctrl tag='SPAN' aaname='{{productName}}' />" \
  --refs e3,e9 \
  --variables "{'productName':'Wireless Mouse M185'}"
```

Reports only the reason and exits non-zero when there is an error.

On success, three sections:

| Section | Contents |
| --- | --- |
| Evaluation | evaluated selector plus the refs per tag. Element refs get each tag's `idx` recalculated against the tree; a top-level selector matching several windows exactly gets `idx='*'` on its target tag, and is otherwise echoed unchanged |
| Matching candidates | one `ref` per node the selector matches exactly, target included, up to 10. Any non-target ref is an exact collision |
| Feedback | non-blocking observations: selector not unique, no candidate matched, target not among the candidates (more than 10 nodes match exactly), duplicated attribute values |

### Get Ancestors

Show the target's ancestor chain from the captured snapshot, top-down, one line per node with its role, name and ref.

Syntax: `uip rpa uia selector-intelligence get-ancestors <e-ref> [options]`

`--variables <json>` supported ([Variables](#variables)); needed for the `{{variable}}` tokens in `--selector`.

```bash
uip rpa uia selector-intelligence get-ancestors e92

# Map the selector's tags onto the ancestor chain
uip rpa uia selector-intelligence get-ancestors e92 --selector "<uia automationid='StandardFunctions' /><uia cls='Button' name='Square root' />"

# Selector storing {{productName}}: supply the value it resolves to
uip rpa uia selector-intelligence get-ancestors e9 \
  --selector "<webctrl tag='DIV' /><webctrl tag='SPAN' aaname='{{productName}}' />" \
  --variables "{'productName':'Wireless Mouse M185'}"
```

### Get Selector Attributes

Read the selector attributes from the captured snapshot.

Syntax: `uip rpa uia selector-intelligence get-selector-attributes <any-ref> [options]`

```bash
uip rpa uia selector-intelligence get-selector-attributes e42
```

Values print double-quoted, so padding stays visible; the outer quotes are never part of the value. An attribute with no value prints unquoted.

## Interact

Drive current snapshot refs (`wN`, `bN`, `eN`, `sN`, `cveN`, `cvwN`).

**Base command:** `uip rpa uia interact`

> `--folder-path` is invalid for `interact`; it uses latest snapshot.

Use after `snapshot capture` or current-screen `uia-configure-target` capture. Older refs are reinterpreted against latest snapshot and may resolve differently or fail; see [Snapshot](#snapshot). Every leaf/sub-verb accepts `--visualize` for brief target highlight.

Region refs (`sN` from `semantic-find`, `cveN`/`cvwN` from `capture --type cv`) work with `click`, `type`, `hover`, `drag`, `wheel`, `highlight`, `screenshot` only.

**Input methods by platform.** `HardwareEvents`, `Simulate` and `DebuggerApi` everywhere; `WindowMessages` Windows-only.

### Click

Click UI element.

Syntax: `uip rpa uia interact click <e/s/cv-ref> [options]`

```bash
# Single left click
uip rpa uia interact click e42

uip rpa uia interact click e42 --button Right --modifiers "Shift,Ctrl"

uip rpa uia interact click e42 --type Double --origin TopLeft --offset-x 5 --offset-y 10
```

### Type

Type text into element.

Syntax: `uip rpa uia interact type <e/s/cv-ref> <text> [options]`

```bash
uip rpa uia interact type e42 "hello world"

# Clear a single-line field first, then type
uip rpa uia interact type e42 "new value" --clear-before-mode SingleLine
```

> **Note:** With an `sN`/`cveN`/`cvwN` target, element is not clicked/focused before typing unless `--click-before-mode` is set — keystrokes go to whichever element has keyboard focus. If text landed in the wrong place, rerun with `--click-before-mode Single`.

### Hover

Hover over UI element.

Syntax: `uip rpa uia interact hover <e/s/cv-ref> [options]`

```bash
uip rpa uia interact hover e42

# Pixel offset from the default origin (center)
uip rpa uia interact hover e42 --offset-x 10 --offset-y -5

uip rpa uia interact hover e42 --origin TopLeft --offset-x 5 --offset-y -10
```

### Drag

Drag UI element and drop it onto another element.

Syntax: `uip rpa uia interact drag <e/s/cv-ref> <e/s/cv-ref> [options]`

```bash
# Drag e42 onto e57 (left button, element centers)
uip rpa uia interact drag e42 e57

uip rpa uia interact drag e42 e57 --button Right --modifiers Ctrl

# Pick up near the source's top-left corner, drop near the destination's bottom-right corner
uip rpa uia interact drag e42 e57 --source-origin TopLeft --source-offset-x 5 --source-offset-y 5 --destination-origin BottomRight --destination-offset-x -5 --destination-offset-y -5

# Move the cursor in increments instead of jumping, for drop targets that react to intermediate mouse moves (default: Instant)
uip rpa uia interact drag e42 e57 --cursor-motion Smooth
```

### Select

Select item from dropdown.

Syntax: `uip rpa uia interact select <e-ref> <value> [options]`

```bash
uip rpa uia interact select e73 "Second"
```

Works on option-list controls across UI stacks — native `<select>`, desktop combo boxes (WinForms/WPF), Java and SAP lists, web/ARIA comboboxes alike. To decide whether a control is `select`-drivable, read its valid options, and confirm result after selecting: see [select-item-usage-guide.md](select-item-usage-guide.md).

### Wheel

Scroll UI element with mouse wheel.

Syntax: `uip rpa uia interact wheel <e/s/cv-ref> [options]`

```bash
uip rpa uia interact wheel e5 --direction Down --units 10

# Pixel offset from the default origin (center)
uip rpa uia interact wheel e5 --direction Down --units 10 --offset-x 50 --offset-y 0

uip rpa uia interact wheel e5 --direction Down --origin TopLeft --offset-x 30 --offset-y 30
```

> **Note:** Scrolling changes the layout, invalidating all `sN`/`cveN`/`cvwN` refs.

### Scroll into view

Scroll element into view.

Syntax: `uip rpa uia interact scroll-into-view <e-ref> [options]`

```bash
uip rpa uia interact scroll-into-view e42
```

> **Note:** Scrolling changes the layout, invalidating all `sN`/`cveN`/`cvwN` refs.

### Focus

Set keyboard focus to a target.

Syntax: `uip rpa uia interact focus <any-ref> [options]`

### Screenshot

Screenshot entire screen or specific target.

Syntax: `uip rpa uia interact screenshot [any-ref] [options]`

```bash
# Full desktop screenshot
uip rpa uia interact screenshot

uip rpa uia interact screenshot w1

# Full-page browser screenshot
uip rpa uia interact screenshot b2 --full-page

```

### Highlight

Writes screenshot of target's window with colored box drawn around target, confirming what was highlighted. With `--visualize`, same border is also drawn on live screen for fixed duration; `--duration` applies only to that on-screen border.

Syntax: `uip rpa uia interact highlight <any-ref> [options]`

```bash
uip rpa uia interact highlight e5 --color Blue

# Also draw the border on the live screen
uip rpa uia interact highlight e5 --color Blue --duration 5 --visualize

```

### Get

Read attribute value from target.

Syntax: `uip rpa uia interact get <any-ref> <attribute> [options]`

Values print double-quoted, so padding stays visible; the outer quotes are never part of the value. An attribute with no value prints unquoted.

### Get All

Read all available attribute values from target.

Syntax: `uip rpa uia interact get-all <any-ref> [options]`

Values print double-quoted, so padding stays visible; the outer quotes are never part of the value. An attribute with no value prints unquoted.

### Extract Table

Extract structured table data from element.

Syntax: `uip rpa uia interact extract-table <e-ref> [options]`

### Window Close

Close window or browser tab.

Syntax: `uip rpa uia interact window close <w/b-ref> [options]`

### Window Foreground

Bring window to foreground.

Syntax: `uip rpa uia interact window foreground <w/b-ref> [options]`

### Window Maximize

Maximize window.

Syntax: `uip rpa uia interact window maximize <w/b-ref> [options]`

### Window Minimize

Minimize window.

Syntax: `uip rpa uia interact window minimize <w/b-ref> [options]`

### Window Restore

Restore window.

Syntax: `uip rpa uia interact window restore <w/b-ref> [options]`

### Window Hide

Hide window.

Syntax: `uip rpa uia interact window hide <w/b-ref> [options]`

### Window Show

Show window.

Syntax: `uip rpa uia interact window show <w/b-ref> [options]`

### Browser Open

Launch new browser and navigate to URL.

Syntax: `uip rpa uia interact browser open [url] [options]`

```bash
# Open the default browser
uip rpa uia interact browser open

uip rpa uia interact browser open "https://example.com" --browser Edge
```

### Browser Navigate

Navigate browser tab to URL.

Syntax: `uip rpa uia interact browser navigate <b-ref> <url> [options]`

```bash
uip rpa uia interact browser navigate b1 "https://example.com"
```

### Browser Eval

Execute JavaScript in browser tab or on element.

Syntax: `uip rpa uia interact browser eval <any-ref> <script> [options]`

```bash
# Tab-level eval
uip rpa uia interact browser eval b1 "() => document.title"

# Element-level eval
uip rpa uia interact browser eval e5 "(el) => el.textContent"

# Run in an isolated world
uip rpa uia interact browser eval b1 "() => document.title" --world Isolated
```

### Browser Tab-New

Open new tab in given browser.

Syntax: `uip rpa uia interact browser tab-new <b-ref> [url] [options]`

```bash
uip rpa uia interact browser tab-new b1 "https://example.com"
```

### Browser Tab-Close

Close browser tab.

Syntax: `uip rpa uia interact browser tab-close <b-ref> [options]`

### Browser Tab-Select

Switch to browser tab.

Syntax: `uip rpa uia interact browser tab-select <b-ref> [options]`

### Browser Go-Back

Navigate back in browser history.

Syntax: `uip rpa uia interact browser go-back <b-ref> [options]`

### Browser Go-Forward

Navigate forward in browser history.

Syntax: `uip rpa uia interact browser go-forward <b-ref> [options]`

### Browser Reload

Reload current page.

Syntax: `uip rpa uia interact browser reload <b-ref> [options]`

### SAP Logon

Launch SAP Logon application and open a connection by name. On success prints opened session's `sapSysSessionId` (`sapSysSessionId=<id>`) — server-side session identifier. To target the session, run `uip rpa uia snapshot capture`, pick the window whose `sapSysSessionId` matches; pass that window's `wN` ref to `sap login`.

Syntax: `uip rpa uia interact sap logon <connection> [options]`

```bash
uip rpa uia interact sap logon "MyConnection"
```

### SAP Login

Fill SAP login screen (client / user / password / language) on an already-open SAP window — the `w-ref` found via `uip rpa uia snapshot capture`, matching the window by the `sapSysSessionId` that `sap logon` printed. The password is **never** passed as a command-line value (which would leak into argv, shell history, and logs): supply it via stdin (piped from a file or secret store) **or** name an environment variable that holds it.

```bash
# stdin, read from a secret file (not a literal):
cat secret.txt | uip rpa uia interact sap login <w-ref> --user <name> --client <nnn> --language <xx> --password-stdin [options]

# or name an environment variable, set out-of-band in a separate step:
export SAP_PASSWORD="$(cat secret.txt)"
uip rpa uia interact sap login <w-ref> --user <name> --client <nnn> --language <xx> --password-env SAP_PASSWORD [options]
```

¹ Exactly one of `--password-stdin` / `--password-env` is required; specifying both is an error.

```bash
# Preferred for unattended/agent runs — set SAP_PASSWORD out-of-band in a separate step, then run:
export SAP_PASSWORD="$(cat secret.txt)"
uip rpa uia interact sap login w1 --user <USER> --client 100 --language EN --password-env SAP_PASSWORD

# Or pipe the secret straight from a file via stdin:
cat secret.txt | uip rpa uia interact sap login w1 --user <USER> --client 100 --language EN --password-stdin
```

### SAP Call Transaction

Run transaction code in open SAP session window (`w-ref` from `snapshot capture`). Okcd-aware equivalent of typing `/nXXXX` into command field.

```bash
uip rpa uia interact sap call-transaction <w-ref> <transaction> [options]
```

```bash
uip rpa uia interact sap call-transaction w1 VA01
```

### SAP Read Status Bar

Read active SAP session's status bar on given window; print message type / number / text.

```bash
uip rpa uia interact sap read-statusbar <w-ref> [options]
```

Prints `Status bar [<type>] <number>: <text>`.
```bash
uip rpa uia interact sap read-statusbar w1
```

### SAP Expand Tree

Expand node in SAP tree control by its slash-separated path (node's `relpath` returned by `interact get <treeRef> items`).

Syntax: `uip rpa uia interact sap expand-tree <e-ref> <node-path> [options]`

```bash
uip rpa uia interact sap expand-tree e12 "Root/Child"
```

### SAP Select Dates In Calendar

Select a date, date range, or week in SAP calendar control (`e-ref` from `snapshot capture`). `--select-type` chooses which date inputs apply.

```bash
uip rpa uia interact sap select-dates-in-calendar <e-ref> [options]
```

Single-date example:

```bash
uip rpa uia interact sap select-dates-in-calendar e34 --date 2026-03-15
```

### SAP Click Picture On Screen

Click SAP picture/image control (`e-ref` from `snapshot capture`). Optionally click at offset within picture and/or hold keyboard modifiers.

Syntax: `uip rpa uia interact sap click-picture-on-screen <e-ref> [options]`

```bash
uip rpa uia interact sap click-picture-on-screen e21 --click-type Double
```

> **Note:** pass picture's inner **`Image`** node, not surrounding `Container`.

## Permissions

**Base command:** `uip rpa uia permissions`

**macOS only.** UI Automation on macOS needs the Screen Recording and Accessibility permissions. These commands run only when this machine is a Mac: elsewhere the CLI does not offer them (`unknown command 'permissions'` or `This command is supported only on: macOS.`), with or without `--remote`. With `--remote`, they check and request the permissions of the remote Mac.

A permission granted while the UI Automation host is running takes effect only after `uip rpa uia reset` restarts the host. `reset` restarts this machine's host only and does not accept `--remote`.

### Get Permissions

Print the status of each permission UI Automation needs (`Enabled`, `Disabled` or `Uncertain`) and the process the permissions are attributed to. When a permission is not `Enabled`, the output ends with the next step to take.

Syntax: `uip rpa uia permissions get [options]`

```bash
uip rpa uia permissions get
```

### Request Accessibility Permission

Open the operating system dialog for the user to grant the Accessibility permission. The grant result is not reported: after the user grants it, run `uip rpa uia reset`, then verify with `permissions get`.

Syntax: `uip rpa uia permissions request-accessibility [options]`

```bash
uip rpa uia permissions request-accessibility
```

### Request Screen Recording Permission

Open the operating system dialog for the user to grant the Screen Recording permission. The grant result is not reported: after the user grants it, run `uip rpa uia reset`, then verify with `permissions get`.

Syntax: `uip rpa uia permissions request-screen-recording [options]`

```bash
uip rpa uia permissions request-screen-recording
```

## Reset

Stop the project's UI Automation host process through its owner Studio; the next command starts a fresh one. Every ref from earlier commands becomes invalid, so capture again afterwards. With `--remote`, it stops the host on the remote machine; the next command with `--remote` starts a fresh one.

Syntax: `uip rpa uia reset [options]`

```bash
uip rpa uia reset
```

## Indicate

User-click fallback for targets unavailable to automated `uia-configure-target` capture (for example, interaction-revealed compose form).

> Screen-blocking. Confirm readiness first; no short timeout (minutes, not seconds, if any).

> Top-level `uip rpa` commands, outside `uip rpa uia`.

**Base commands:** `uip rpa indicate-application`, `uip rpa indicate-element`

Returns `{ "Data": { "reference": "..." } }` for OR lookup/attachment. Coded `ObjectRepository.cs` picks up the new entries on the next per-file `uip rpa validate`; reread descriptor paths from it.

**Workflow:** indicate screen first, then elements within it using `--parent-id` from screen's `Data.reference`.

### Indicate Application

Create screen entry in Object Repository from user click on target window.

```bash
uip rpa indicate-application [options]
```

When no App exists in `.objects/`, omit `--parent-id` and `--parent-name` — command creates App + AppVersion automatically. When adding to existing App, provide `--parent-id` with **AppVersion** reference.

```bash
uip rpa indicate-application \
  --name "LoginScreen" \
  --description "Main login screen" \
  --project-dir "<PROJECT_DIR>" \
  --output json
```

**Troubleshooting:**

| Error | Cause | Recovery |
|-------|-------|----------|
| `"No application version found matching parentId=..."` | AppVersion reference stale or App never created. | Re-read `.objects/` metadata for fresh reference. If no App exists, call `indicate-application` without `--parent-id` — creates App automatically. |
| `.objects/` has subdirectories but no `.metadata` files | Corrupted/incomplete App from failed creation. | Clear orphan directories and run `indicate-application` without `--parent-id`. |

### Indicate Element

Create element entry under existing screen in Object Repository, from user click on target element.

Syntax: `uip rpa indicate-element [options]`

```bash
uip rpa indicate-element \
  --name "UsernameField" \
  --activity-class-name "TypeInto" \
  --parent-id "<screen-reference>" \
  --project-dir "<PROJECT_DIR>" \
  --output json
```
