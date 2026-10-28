# OptionSet Manager

A [Power Platform ToolBox](https://powerplatformtoolbox.com) tool for creating and editing Dataverse choices (option sets), with multi-language labels, a review step before every save, and publishing scoped to just what you changed.

![OptionSet Manager editing a global choice with English, German and French labels](https://raw.githubusercontent.com/mattberg11/pptb-optionset-manager/main/docs/images/optionset-manager.png)

![OptionSet Manager editing a local Channel choice column on a Ticket table, light theme](https://raw.githubusercontent.com/mattberg11/pptb-optionset-manager/main/docs/images/optionset-manager-local.png)

## Features

- **Global choices**: create new ones in a solution, or load an existing one to edit its display name, description and options. Delete a global choice you no longer need.
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

Settings (the gear icon) control language sub-rows, validation of blank translations, the review step and more.

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
pnpm finalize-package
npm publish --access public
```

## License

[MIT](LICENSE)
