# Start Process

Launches an application or opens a file through the Windows shell, optionally passing arguments, and either returns once the process has started or waits for it to exit.

**Package:** `UiPath.UIAutomation.Activities`
**Category:** System.Application
**Assembly:** `UiPath.UiAutomation.Activities`
**Class Name:** `UiPath.Core.Activities.StartProcess`

## Properties

### Input

| Name | Display Name | Kind | Type | Required | Default | Placeholder | Description |
|------|-------------|------|------|----------|---------|-------------|-------------|
| `FileName` | FileName | InArgument | `string` | Yes |  |  | The executable, document, folder or URI to start. A document opens in its default application and a URI in its handler. Environment variables are not expanded: pass `Environment.ExpandEnvironmentVariables("%windir%\...")`, not the literal `%windir%`. A relative path resolves against `WorkingDirectory`. |
| `Arguments` | Arguments | InArgument | `string` |  |  |  | The command line passed to the started program, as one string. |
| `WorkingDirectory` | WorkingDirectory | InArgument | `string` |  |  |  | The folder the process starts in. Empty: the robot's current folder. |

### Configuration

| Name | Display Name | Kind | Type | Default | Description |
|------|-------------|------|------|---------|-------------|
| `StartType` | ExecutionType | InArgument | [`StartProcessType`](#startprocesstype) | `Asynchronously` | Whether the activity returns once the process has started, or waits for it to exit. |
| `Timeout` | Timeout (milliseconds) | InArgument | `int` | `30000` | How long a synchronous start waits for the process to exit, in milliseconds. Used only when `StartType` is `Synchronously`. `-1` waits indefinitely, and any value below `-1` acts as `-1`. |
| `ContinueOnError` | ContinueOnError | InArgument | `bool` |  | Continue executing the activities in the automation if this activity fails. The default value is False. |

## Enums

### StartProcessType

`UiPath.Core.Activities.StartProcessType`

| Value | Description |
|-------|-------------|
| `StartProcessType.Asynchronously` | Starts the process and continues without waiting for it. The default. |
| `StartProcessType.Synchronously` | Starts the process and waits up to `Timeout` milliseconds for it to exit. |

## Notes

- **Started through the Windows shell.** When the shell hands the request to a process that is already running, the target still opens, but the activity fails with `System.Exception` "Application could not be opened". This happens with a folder (Explorer opens it) and with a URI an app that is already open handles (`ms-settings:`). Use `ContinueOnError` or a Try Catch where that is expected.
- **Synchronous starts do not check the exit code.** A process that exits with any code completes the activity. When `Timeout` passes first, the activity fails with `UiPath.Core.Activities.ActivityTimeoutException` ("Activity timeout exceeded"), and the process keeps running.
- **An asynchronous start returns when the process has started**, not when its window is ready. A following UI activity waits for its target on its own.
- **`FileName` is required in practice.** Validation passes when only `Arguments` is set, but the run then fails with `System.InvalidOperationException` ("Cannot start process because a file name has not been provided."), as it does for an empty `FileName`. A file that does not exist fails with `System.ComponentModel.Win32Exception` ("The system cannot find the file specified").
- **`WorkingDirectory` is the started process's folder.** The robot's own current folder changes only while the process starts and is restored afterwards.
- **No output.** The activity returns no process id or handle. Close the process with **Kill Process** by name, or attach to its window with **Use Application/Browser** to work in it.

## XAML Example

Run `uip rpa --help` to find the command that retrieves the default XAML for an activity, then run it with the class name `UiPath.Core.Activities.StartProcess`.
