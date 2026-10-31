# OptionSet Manager

A [Power Platform ToolBox](https://powerplatformtoolbox.com) tool for creating and editing Dataverse choices (option sets), with multi-language labels, a review step before every save, and publishing scoped to just what you changed.

![OptionSet Manager editing a global choice with English, German and French labels](https://raw.githubusercontent.com/mattberg11/pptb-optionset-manager/main/docs/images/optionset-manager.png)

![OptionSet Manager editing a local Channel choice column on a Ticket table, light theme](https://raw.githubusercontent.com/mattberg11/pptb-optionset-manager/main/docs/images/optionset-manager-local.png)

## Features

- **Global choices**: create new ones in a solution, or load an existing one to edit its display name, description and options.
- **Local choices**: edit the options of an existing choice or multi-select choice column on any table. State and Status columns open read-only.
- **Multi-language labels and descriptions** for every option. Only the languages installed in your environment are offered.
- **Option details**: value, color, external value and hidden flag. New values follow the publisher's option value prefix, and existing values can be changed.
- **Reorder** options by dragging or with Alt+Up/Down.
- **Review before saving**: see every insert, update, delete and reorder before anything is sent, and revert any single change. Deleted options can be restored from the pending changes bar until you save.
- **Saves only what changed**, then publishes only that choice (and its table for a local choice), so other unpublished customizations are left alone.
- **Import** options from CSV or JSON, and **export** the current choice from the Code tab as JSON (all languages) or CSV (default language).

## Requirements

- [Power Platform ToolBox](https://powerplatformtoolbox.com) desktop app
- An active Dataverse connection
- System Customizer or System Administrator security role

## Usage

1. Choose **Global** or **Local** at the top of the sidebar.
2. Pick a **Publisher** and **Solution**.
3. For a global choice, pick one from **Global Option Set** to edit it, or click **New** to start one. For a local choice, pick the **Entity** and **Attribute**.
4. Edit labels, values and descriptions, add or remove rows, and reorder them. Expand a row to edit its other languages.
5. Click **Validate**, then **Save**. Review the changes and confirm.

Settings (the gear icon) control language sub-rows, validation of blank translations, reordering and more.

## What this tool changes

Nothing is written to Dataverse until you click **Save** and confirm. The confirmation names the connected environment.

- **Global choices**: creates a new global choice in the selected solution and updates the display name and description of an existing one.
- **Options** of a global choice or a local choice column: inserts new options; updates labels, descriptions, color, external value and the hidden flag; deletes options; and changes their order. A global choice is shared, so its changes apply to every column that uses it.
- **Changed option values**: the option is created with the new value and the old one is deleted. Records are not updated: records that stored the old value, or a deleted option's value, keep that number, which no longer has a label.
- **Solutions**: new choices and options are added to the selected solution.
- **Publishing**: after a save, only that choice is published. A local choice that doesn't use a global choice is published by publishing its table, which also publishes any other unpublished changes on that table.
- **Files**: export writes a file only where you choose to save it.
- **Settings**: your preferences for this tool are stored in ToolBox.

It doesn't change records, tables, forms, views or security, or any column other than the options of the one you load.

**There is no undo.** Saved changes and deletes can't be reverted from this tool. If you need a backup, export the solution from Dataverse before saving.

## Data and privacy

The tool talks only to your connected Dataverse environment, through the ToolBox APIs. It makes no other network calls, sends no telemetry and declares no CSP exceptions. Debug logging is off unless you set `window.__PPTB_DEBUG__ = true` in the tool's DevTools, and it logs only metadata names and counts.

## Development

```bash
pnpm install
pnpm dev-watch   # builds to dist/ with source maps, watches for changes
pnpm test        # unit tests
pnpm lint
```

In PPTB: **Debug → Load Local Tool** → select this project root → **Help → Toggle Tool DevTools**. There is no hot reload, so close and reload the tool tab after each rebuild.

## Building and publishing

```bash
pnpm build
pnpm validate
npm publish --access public
```

## AI Assistance

Much of this tool's code was written with AI coding assistants (Claude Code by Anthropic and GitHub Copilot). Matt Berg reviewed it, tested it against a real Dataverse environment, and maintains it.

## License

[MIT](LICENSE)
