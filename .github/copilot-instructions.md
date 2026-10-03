# OptionSet Manager

This repo is a Power Platform ToolBox tool for managing Dataverse OptionSets (choice fields). Keep work aligned with the existing React + TypeScript + Fluent UI codebase and the PPTB host APIs.

## Project context

- Stack: React 18, TypeScript, Vite, Fluent UI React v9
- Runtime: runs in a PPTB BrowserView via `file://` and must work inside the app host

## Rules

- When running the build task, increment the patch version, but when doing a major update, increment the minor version
- Reuse the existing service and hook patterns before adding new wrappers or abstractions.
- Prefer current API/service files in `src/api`, `src/services`, and `src/hooks` over creating parallel implementations.
- Keep changes small and scoped; avoid unrelated refactors.
- Use strict TypeScript, explicit types, and avoid `any`.
- Follow the repo’s existing naming conventions for components, hooks, models, and utilities.
- Prefer Fluent UI components and token-based styling over native HTML and custom CSS variables.
- Keep async logic and error handling explicit and local to the feature.
- When adding settings persistence, follow the existing toolboxAPI pattern.

## References

- PPTB tool workflow and validation: `pptb-tool-dev` skill
- UI styling rules: `fluentui-styling` skill
- optionset api: `optionset-web-api` skill
- Build and usage scripts: `README.md` and `package.json`

## Minimum standards

- Keep changes directly relevant to the task.
- Update touched imports and exports.
- Validate the affected build path before finishing work.
- Increase patch version for minor changes
