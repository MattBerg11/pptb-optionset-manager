# OptionSet Manager — Outstanding Items

LLM: ONLY MODIFY THIS LIST WHEN EXPLICTELY APPROVED

## Random list




## Accessibility — remaining items (2026-08-30)

### Not yet implemented

### P1 — Important Gaps

- **ErrorBoundary has no recovery path** — only shows "Try Again". Add recovery actions: "Clear metadata cache", "Reset form to blank", and a link to open browser DevTools.

### P2 — Quality / Nice to Have

- **No undo/redo within session** — deleting a row is unrecoverable. Consider a simple action history stack in `useOptionSetBuilder`.
- **XML import** — XML is a common Dataverse choice-metadata format. Not currently supported.
- **Import templates** — offer a downloadable .csv and .json template from the Import dialog, so users can start from the expected columns and shape.

- Clarify what "Show system optionsets" means, because there are system ones, and read-only ones. Perhaps we have an extra option in that menu list for both.
- convert text inputs to a component and create a small text character count validator. When over 50% show the counter, and when 90% of max length turn red




### Main grid

- idea: Save button could be complex with Save | then submenu of Save all changes; Save deletes; Save Order?

## Things to research

- rename GOS menu item
- When an entity field is read-only in Dataverse, indicate this in the editor but allow editing on properties you can _actually_ update via API
  - toggle to enable?
