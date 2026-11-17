# NVerifyMode

`UiPath.UIAutomationNext.Enums.NVerifyMode`

The runtime verification check performed after an action.

## Values

| Value | Description |
|-------|-------------|
| `NVerifyMode.Appears` | Checks whether the element appears. |
| `NVerifyMode.Disappears` | Checks whether the element disappears. |
| `NVerifyMode.TextChanges` | Checks whether there are any changes in the text of the element. |
| `NVerifyMode.AspectChanges` | Checks whether there are any image changes of the element. |

## Usage

Reference values as `NVerifyMode.<Value>`, e.g. `NVerifyMode.Appears`.

## Notes

`Appears` and `Disappears` check only the element's state after the action, not a change from before it. `Appears` passes whenever the element is present after the action, even if it was already present before. `Disappears` passes whenever the element is absent after the action, even if it was never present. On their own, they don't prove the action had an effect.
