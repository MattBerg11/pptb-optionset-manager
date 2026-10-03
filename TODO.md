# OptionSet Manager — Outstanding Items

LLM: ONLY MODIFY THIS LIST WHEN EXPLICTELY APPROVED

## Random list




## Accessibility — remaining items (2026-08-30)

### Not yet implemented

### P0 — Blocking / Misleading


- **Code generation exports only the default language** — `serializeDraftToTypeScript`, `serializeDraftToJavaScript`, `serializeDraftToCSharp`, and the CSV exporter silently drop all non-default-language labels. Multi-language output needs a new export shape (e.g., a nested language-keyed map for TS/JS, extra columns for CSV).
- **`createGlobalOptionSet` error swallow is too broad** — the current catch checks if the error message contains "OData-EntityId" or "MetadataId" and silently proceeds. A Dataverse 500 that happens to mention "MetadataId" in its body would be swallowed and then fail cryptically on `insertOptionValue`. Tighten the match (e.g., exact PPTB error code) or verify the option set actually exists before continuing.

### P1 — Important Gaps

- **CSV import placeholder is misleading** — the `ImportModal` shows `value,label,description` as the example format, but the parser expects `label_<lcid>` / `description_<lcid>` column names. Update the placeholder/help text to show a realistic example.
- **ErrorBoundary has no recovery path** — only shows "Try Again". Add recovery actions: "Clear metadata cache", "Reset form to blank", and a link to open browser DevTools.
- **Stale metadata cache on environment change** — `DataverseMetadataService.clearCache()` is called when the connection object changes, but if the user reconnects to a different environment before the 5-minute TTL expires, cached publishers/solutions/option sets from the previous environment could re-appear. Ensure cache is invalidated eagerly on any `connection:updated` event.

### P2 — Quality / Nice to Have

- **No undo/redo within session** — deleting a row is unrecoverable. Consider a simple action history stack in `useOptionSetBuilder`.
- **XML import** — XML is a common Dataverse choice-metadata format. Not currently supported.
- **No "Save with changelog" modal** — before committing, show a summary of what will be created/updated/deleted.
- **Console output is verbose** — production build still logs metadata load counts. Gate them behind the `__PPTB_DEBUG__` flag or remove entirely.

- Clarify what "Show system optionsets" means, because there are system ones, and read-only ones. Perhaps we have an extra option in that menu list for both.
- When clicking Save, create a modal to show a detailed changelog of what's happening, and a reset button on each row to revert that specific change
- Make sure the API is not attempting to patch actual null lines, but omit those.
- convert text inputs to a component and create a small text character count validator. When over 50% show the counter, and when 90% of max length turn red

- When deleting a row, make sure it is queued and not instantly deleted. Then delete as part of save batch from modal



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
