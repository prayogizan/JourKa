# Model Name

The AI-powered activities (ScreenPlay, Extract UI Data, Update UI Element, Fill Form, Extract Form Data, Close Popup) and the semantic selector of [`TargetAnchorable`](Target.md#targetanchorable) choose their LLM through a **model name**: a free-text `string` that identifies the model, such as `path-mini` or `gemini-2.5-flash`. When the activity does not set a model, the model comes from a project setting, named on each activity page (and, for the semantic selector, in [Semantic Selector](Target.md#semantic-selector)).

## Finding a Model Name

The model names available to each feature (ScreenPlay, Semantic Activities, Semantic selectors) are listed in [Configuring LLMs for your product](https://docs.uipath.com/automation-cloud/automation-cloud/latest/admin-guide/configuring-llms#configuring-llms-for-your-product). Use the model identifier exactly as listed there.

## Migrating from the Enum Properties

Model names replaced the enum-typed `AgentType` property: [`NUITaskAgentType`](NUITaskAgentType.md) on ScreenPlay, [`NExtractUIDataModel`](NExtractUIDataModel.md) on Extract UI Data.

- Do not write `AgentType` in new XAML; set `ModelName` instead, or leave it empty to use the project setting.
- `AgentType` is an obsolete, write-only property kept so that older XAML still loads.
- The model name of each legacy value is listed in [`NUITaskAgentType`](NUITaskAgentType.md) (ScreenPlay) and [`NExtractUIDataModel`](NExtractUIDataModel.md) (Extract UI Data).
