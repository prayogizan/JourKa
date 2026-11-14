# Table Cell Scope

A container that attaches to one cell of an SAP table: it finds the row (by index, by a row filter, or the first empty row) in the column you name, then runs its child activities on that cell.

**Package:** `UiPath.UIAutomation.Activities`
**Category:** UI Automation.SAP
**Assembly:** `UiPath.UIAutomationNext.Activities`
**Class Name:** `UiPath.UIAutomationNext.Activities.NSAPTableCellScope`
**Required Scope:** `UiPath.UIAutomationNext.Activities.NApplicationCard`

## Properties

### Input

| Name | Display Name | Kind | Type | Required | Default | Placeholder | Description |
|------|-------------|------|------|----------|---------|-------------|-------------|
| `Target` | Target | Property | [`TargetAnchorable`](common/Target.md#targetanchorable) |  |  |  | The table: an SAP GUI table control (`GuiTableControl`) or ALV grid (`GuiGridView`), or an SAP Fiori / Web GUI table. Indicating a cell sets the target to its table. |
| `ColumnName` | Column Name / Filter | InArgument | `string` | Yes |  |  | The column of the cell. Either a column name — on SAP GUI the column's tooltip, matched as `colTooltip` (often not the header text) — or a cell selector naming the column, for example `<sap tableCol='3' />`; on a table control `<sap colName='PO Quantity' />` (a table control's `colName` is the header text it displays); on an ALV grid `<sap colName='MATNR' />` (an ALV grid's `colName` is the technical field name). Studio lists the table's columns after you indicate a cell. |
| `RowIndex` | Row index | InArgument | `uint` | Conditional |  |  | The 0-based row, counted from the first row of the table (not the first visible row). Used when `RowType` is `Index`. |
| `RowSelector` | Row selector | InArgument | `string` | Conditional |  |  | A selector for one cell inside the table; the scope takes that cell's row. Used when `RowType` is `SelectorFilter`. See [Valid Configurations](#valid-configurations). |
| `RowType` | Row input type | InArgument | [`NSAPTableCellScopeRowType`](#nsaptablecellscoperowtype) |  |  |  | How the row is found: by index, by row selector, or the first empty row of the column. |
| `InUiElement` | Input element | InArgument | [`UiElement`](common/UiElement.md) |  |  |  | The Input UI Element defines the screen element that the activity will be executed on. |

### Configuration

| Name | Display Name | Kind | Type | Default | Required | Description |
|------|-------------|------|------|---------|----------|-------------|
| `HealingAgentBehavior` | Healing Agent mode | InArgument | [`NChildHealingAgentBehavior`](common/NChildHealingAgentBehavior.md) |  |  | Configures the Healing Agent actions if they are allowed by Governance or Orchestrator process/job/trigger level settings |
| `ScopeIdentifier` | Scope identifier | Property | `string` |  |  | Attaches this activity to a specific Application Card. Use the Application Card's `ScopeGuid` property. |

### Output

| Name | Display Name | Kind | Type | Description |
|------|-------------|------|------|-------------|
| `TableRow` | Table Row Index | OutArgument | `uint` | The 0-based row of the cell found, in every row mode: the first empty row, the row the row selector matched, or `RowIndex`. Use it to reach other columns of the same row. This field only supports uint variables. |
| `OutUiElement` | Output element | OutArgument | [`UiElement`](common/UiElement.md) | The cell found, when the table is given through `Target`. With `InUiElement` set, or with neither set (the input is then inferred from an enclosing element scope or the Application Card's window), it is that input element, not the cell. Inside the body, the cell is the `ContextTarget` argument. |

### Common

| Name | Display Name | Kind | Type | Default | Description |
|------|-------------|------|------|---------|-------------|
| `ContinueOnError` | Continue on error | InArgument | `bool` |  | Continue executing the activities in the automation if this activity fails. The default value is False. |
| `Timeout` | Timeout | InArgument | `double` |  | The amount of time (in seconds) to wait for the operation to be performed before generating an error. The default value is 30 seconds. |
| `DelayAfter` | Delay after | InArgument | `double` |  | Delay (in seconds) after this activity is completed, before next activity starts. The default amount of time is 0.3 seconds. |
| `DelayBefore` | Delay before | InArgument | `double` |  | Delay (in seconds) to wait before executing this activity. The default amount of time is 0.2 seconds. |

## Valid Configurations

The scope finds **one cell**: the row comes from `RowType`, the column from `ColumnName` (always required). On SAP GUI it builds a cell selector under the table from the two and takes the first match.

**Mode A — Row by index** (`RowType` = `Index`): set `RowIndex`. Example: `RowIndex` `0` is the first row. A row below the visible area is scrolled into view.

**Mode B — First empty row** (`RowType` = `FirstEmptyRow`): the first row whose cell **in `ColumnName`** has empty text. Only that column is tested; other columns of the row may hold values.

**Mode C — Row by filter** (`RowType` = `SelectorFilter`): set `RowSelector` to a selector for a cell inside the table. The scope finds that cell and uses its row; `ColumnName` then picks the cell of that row the scope attaches to (it can be another column than the one the filter tests). Standard selector matching applies:

| Match | `RowSelector` |
|-------|---------------|
| Equals | `<sap colTooltip='Material' text='RM-1001' />` |
| Equals, ignoring case | `<sap colTooltip='Material' text='rm-1001' casesensitive:text='false' />` |
| Contains | `<sap colTooltip='Material' text='*1001*' />` |
| Starts with | `<sap colTooltip='Material' text='RM-*' />` |
| Not blank | `<sap colTooltip='Material' text='?*' />` |
| Equals, ignoring padding and case (regex) | `<sap colTooltip='Material' text='\s*rm-1001\s*' matching:text='regex' casesensitive:text='false' />` |

Matching is case-sensitive unless `casesensitive:text='false'` is set, in regex mode too. A regex must match the whole cell text (`RM-.*`, not `RM-`), and an inline flag such as `(?i)` does not parse. SAP cell text can be padded with spaces; use a wildcard or a regex when the exact text may carry padding. Escape a value built at run time before putting it in the selector (XML: `&`, `<`, `>`, `'`, `"`; regex metacharacters when `matching:text='regex'` is used).

**Not expressible in one scope:** a condition on two or more columns (for example "Amount is blank **and** Type is X"), negations ("Status is not X"), and value comparisons ("Date after today"). Read the rows and compare in the workflow instead (Extract Table Data, or a loop of Table Cell Scopes by index).

**Acting on the cell (child activities):**
- **Type Into**, **Keyboard Shortcuts** and **Take Screenshot** placed in the body **without a target** act on the found cell.
- **Get Text**, **Get Attribute** and **Click**: pass the cell as their `InUiElement`. Inside the body it is the body's `ContextTarget` argument cast to `UiPath.Core.UiElement` (`[CType(ContextTarget, UiElement)]` in VB, `[(UiElement)ContextTarget]` in C#). After the scope it is the scope's `OutUiElement`, which holds the cell only when the table is given through `Target` (Output above).
- **Another column of the same row**: a second Table Cell Scope with `RowType` `Index` and `RowIndex` = the first scope's `TableRow`.

```xml
<!-- Find the row whose Material is RM-1001, then type the quantity into that row's Quantity cell -->
<uix:NSAPTableCellScope DisplayName="Find Material Row" ColumnName="Material" RowType="SelectorFilter" RowSelector="&lt;sap colTooltip='Material' text='RM-1001' /&gt;" TableRow="[rowIndex]" ColumnNames="{x:Null}" HealingAgentBehavior="SameAsCard" Version="V5">
  <uix:NSAPTableCellScope.Target>
    <!-- the table, from the Object Repository: the same element in both scopes, since TableRow counts the rows of that table -->
    <uix:TargetAnchorable Version="V6" />
  </uix:NSAPTableCellScope.Target>
</uix:NSAPTableCellScope>
<uix:NSAPTableCellScope DisplayName="Enter Quantity" ColumnName="Quantity" RowType="Index" RowIndex="[rowIndex]" ColumnNames="{x:Null}" HealingAgentBehavior="SameAsCard" Version="V5">
  <uix:NSAPTableCellScope.Target>
    <uix:TargetAnchorable Version="V6" />
  </uix:NSAPTableCellScope.Target>
  <uix:NSAPTableCellScope.Body>
    <ActivityAction x:TypeArguments="x:Object">
      <ActivityAction.Argument>
        <DelegateInArgument x:TypeArguments="x:Object" Name="ContextTarget" />
      </ActivityAction.Argument>
      <Sequence DisplayName="Do">
        <uix:NTypeInto DisplayName="Type Quantity" Text="[quantity]" EmptyFieldMode="SingleLine" HealingAgentBehavior="SameAsCard" Version="V5" />
      </Sequence>
    </ActivityAction>
  </uix:NSAPTableCellScope.Body>
</uix:NSAPTableCellScope>
```

## Enums

### NSAPTableCellScopeRowType

`UiPath.UIAutomationNext.Enums.NSAPTableCellScopeRowType`

How a row is identified by **SAP Table Cell Scope**.

| Value | Description |
|-------|-------------|
| `NSAPTableCellScopeRowType.SelectorFilter` | The row of the cell that `RowSelector` matches inside the table. |
| `NSAPTableCellScopeRowType.Index` | The row at `RowIndex` (0-based). |
| `NSAPTableCellScopeRowType.FirstEmptyRow` | The first row whose cell in `ColumnName` has empty text. |

## XAML Example

Run `uip rpa --help` to find the command that retrieves the default XAML for an activity, then run it with the class name `UiPath.UIAutomationNext.Activities.NSAPTableCellScope`.

## Notes

- Before automating SAP, read [`sap-guide.md`](../references/sap-guide.md).
- This activity must be placed inside a `UiPath.UIAutomationNext.Activities.NApplicationCard` scope.
- This activity is a scope/container. Place child activities inside the body to perform actions on the specified table cell.
- **Supported tables:** SAP GUI for Windows and SAP GUI for Java table controls and ALV grids, and SAP Fiori / Web GUI tables. Other controls fail with "This control does not support SAP Table Cell Scope activity."
- **Column names are tooltips.** On SAP GUI the column name is the column's tooltip, read from the cell's `colTooltip`; it often differs from the header text (a column headed `PO Quantity` can have the tooltip `Order Quantity`). On a table control the header text works too, as the column selector `<sap colName='<header text>' />` (`ColumnName` above). Where a column has no tooltip, Studio names it by a cell selector without the row, such as `<sap tableCol='0' />`. `ColumnNames` holds the list Studio read at design time; it is not used at run time.
- **Only committed values are seen.** The row search reads the values SAP holds: a cell typed into but not yet confirmed with Enter still reads empty, so First Empty Row finds it again. Confirm the input (Enter) before searching on it.
- **Not found:** a row search that finds no cell fails with `UiPath.UIAutomationNext.Exceptions.NodeNotFoundException` on SAP GUI, and with `UiPath.UIAutomationNext.Exceptions.SAPTableCellScopeException` ("Could not find the target cell.") on SAP Fiori / Web GUI. To treat "no such row" as an outcome rather than a failure, wrap the scope in a Try Catch that catches the exception of the table's kind. `SAPTableCellScopeException` also reports an invalid `ColumnName` or `RowSelector` selector and a control the scope does not support, so a catch on it hides those too: run the scope once against a row that exists before relying on that catch.
- **Screen changes:** confirming an entry can re-lay the screen (for example, opening the item details), which can change the table's scripting id. A table target pinned to the full `id` path then no longer matches; prefer a target that identifies the table by its own name segment, `leafid='tblSAPLMEGUITC_1211'` (the last segment of the `id`, matched at any depth).
- One scope finds one cell; it is not a loop. To visit every row, iterate `RowIndex` or use Extract Table Data.
