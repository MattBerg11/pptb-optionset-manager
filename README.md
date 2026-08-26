# OptionSet Manager

A [Power Platform ToolBox](https://powerplatformtoolbox.com) tool for creating and managing Dataverse Choice fields (Option Sets) with full multi-language support, solution-aware publishing, and bulk operations.

## Features

- Create and update **global Choice fields** across environments
- Edit **local Choice fields** on any Dataverse table/attribute
- Full **multi-language label support** - only languages installed in your environment are shown
- **Import** options via CSV or JSON
- **Drag-to-reorder** rows with one-click OrderOption publish
- Tracks **dirty rows** - only sends changed options to Dataverse on save
- Automatically **deletes removed options** from Dataverse
- **Activity log** panel showing all API interactions

## Requirements

- [Power Platform ToolBox](https://powerplatformtoolbox.com) desktop app  
- Active Dataverse connection
- Customizer or System Administrator security role

## Usage

1. Select a **Publisher** and **Solution** in the left sidebar
2. Choose **Global** to work with global choices, or **Local** for table-specific attributes
3. Select an existing choice field to load its current options
4. Edit labels, add/remove/reorder options
5. Click **Save** - only modified options are sent to Dataverse

## Development

```bash
pnpm install
pnpm dev-watch   # builds to dist/ with source maps, watches for changes
```

In PPTB: **Debug → Load Local Tool** → select this project root → **Help → Toggle Tool DevTools**

## Building & Publishing

```bash
pnpm build
npx pptb-validate --skip-url-checks
pnpm finalize-package
npm publish --access public
```
