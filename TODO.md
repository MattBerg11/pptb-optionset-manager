# OptionSet Manager — Outstanding Items

LLM: ONLY MODIFY THIS LIST WHEN EXPLICTELY APPROVED

## Random list




## Accessibility — remaining items (2026-08-30)

### Not yet implemented

### P0 — Blocking / Misleading


- **Code generation exports only the default language** — `serializeDraftToTypeScript`, `serializeDraftToJavaScript`, `serializeDraftToCSharp`, and the CSV exporter silently drop all non-default-language labels. Multi-language output needs a new export shape (e.g., a nested language-keyed map for TS/JS, extra columns for CSV).

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

environment API calls, but show what is queued for delete, modification, etc.

## Things to research

- Best practice for modifying system optionsets
    - What system publishers should I be showing (look at mxrm)
- Figure out why the optionset creation service is pushing each piece separate rather than the expected API payload? (Is this a PPTB limitation I am forgetting)


- rename GOS menu item
- When an entity field is read-only in Dataverse, indicate this in the editor but allow editing on properties you can _actually_ update via API
  - toggle to enable?
