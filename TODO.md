# OptionSet Manager — Outstanding Items

LLM: ONLY MODIFY THIS LIST WHEN EXPLICTELY APPROVED

## Random list

- remove environment from bottom bar, right align # of rows
- Redo activity log to provide a diff-like log instead. No need for environment API calls, but show what is queued for delete, modification, etc.
- Fix error boundary / checking. Some errors say to check row level errors and nothing shows.
- Provide a log like the activity log as well (hiddenwhen no errors), that will show what is in an error state and clicking the line focuses that area

## Accessibility — remaining items (2026-08-30)

### Not yet implemented
- **WCAG 2.4.3 — Keyboard shortcut discoverability**: The Alt+Up/Down row-reorder shortcut is hidden. Add a Tooltip or visible hint (e.g., in the drag-handle button tooltip) explaining the keyboard shortcut.
- **WCAG 1.3.1 — MetadataSelector error association**: Individual API error messages in MetadataSelector are displayed in a list but not linked via `aria-describedby` to the specific field that failed. Restructure errors to be per-field.
- **WCAG 1.3.1 — MetadataSelector local-scope dropdowns**: Entity and Attribute dropdowns in local scope are missing `aria-label` and `aria-busy` (publisher/solution global-scope dropdowns were fixed; local-scope was not).
- **WCAG 1.3.1 — CodeMirror editor label**: The CodeMirror editor container has no `aria-label` or `aria-labelledby` pointing to the selected format. Requires patching the `CodeMirrorEditor` component to accept and apply an `aria-label` on the editor container div.
- **WCAG 1.3.1 — CodeMirror read-only note not associated**: The "Read-only — edit in Builder tab" notice should be linked to the editor via `aria-describedby`.
- **WCAG 4.1.3 — Sidebar connection loading**: The sidebar spinner when checking connection should mark its container with `aria-busy="true"`.
- **WCAG 1.4.1 — ConfirmDialog danger button**: The "danger" intent confirm button looks identical to a primary button. Consider adding a warning icon or distinct styling so colour isn't the only differentiator.
- **WCAG 1.3.1 — OptionMetadataPopover field label**: The "External value" `Field` component should use `htmlFor` pointing to the `Input`'s `id` to ensure screen readers associate label and input.

## Deferred from Code Review (2026-08-30)

### P0 — Blocking / Misleading

- **`hidden` field in gear popover has no effect** — declared in `OptionDraftRow`, shown in `OptionMetadataPopover`, but never serialized or sent to Dataverse. Either determine if Dataverse supports a hidden flag on option metadata and implement it, or remove the checkbox from the UI.
- **Code generation exports only the default language** — `serializeDraftToTypeScript`, `serializeDraftToJavaScript`, `serializeDraftToCSharp`, and the CSV exporter silently drop all non-default-language labels. Multi-language output needs a new export shape (e.g., a nested language-keyed map for TS/JS, extra columns for CSV).
- **`createGlobalOptionSet` error swallow is too broad** — the current catch checks if the error message contains "OData-EntityId" or "MetadataId" and silently proceeds. A Dataverse 500 that happens to mention "MetadataId" in its body would be swallowed and then fail cryptically on `insertOptionValue`. Tighten the match (e.g., exact PPTB error code) or verify the option set actually exists before continuing.

### P1 — Important Gaps

- **Grid always enabled** — the builder grid should be disabled/greyed until the user selects an existing option set or clicks "New". Currently any draft changes are possible in a context-free state.
- **No memoization on grid rows** — `<OptionRowMain>` and `<LanguageSubRow>` re-render on every state change. Wrap them in `React.memo` and memoize row-level callbacks to avoid sluggishness on 100+ options.
- **CSV import placeholder is misleading** — the `ImportModal` shows `value,label,description` as the example format, but the parser expects `label_<lcid>` / `description_<lcid>` column names. Update the placeholder/help text to show a realistic example.
- **No dirty-row visual indicator** — `dirtyRowIds` is tracked internally but unchanged rows look identical to modified ones. Add a subtle left-border highlight or badge on dirty rows.
- **ErrorBoundary has no recovery path** — only shows "Try Again". Add recovery actions: "Clear metadata cache", "Reset form to blank", and a link to open browser DevTools.
- **Stale metadata cache on environment change** — `DataverseMetadataService.clearCache()` is called when the connection object changes, but if the user reconnects to a different environment before the 5-minute TTL expires, cached publishers/solutions/option sets from the previous environment could re-appear. Ensure cache is invalidated eagerly on any `connection:updated` event.

### P2 — Quality / Nice to Have

- **No virtual scrolling** — rendering all rows for a 1000+ option set will freeze the UI. Add windowed rendering (e.g., `react-window` or a manual intersection-observer approach).
- **No undo/redo within session** — deleting a row is unrecoverable. Consider a simple action history stack in `useOptionSetBuilder`.
- **Label/description length** — Dataverse limits labels to 100 chars and descriptions to 255 chars. ✅ Validation added; consider also showing a live character count on focused inputs.
- **XML import** — XML is a common Dataverse choice-metadata format. Not currently supported.
- **No "Save with changelog" modal** — before committing, show a summary of what will be created/updated/deleted.
- **Console output is verbose** — production build still logs metadata load counts. Gate them behind the `__PPTB_DEBUG__` flag or remove entirely.

- Disable the main grid area until at least one of the following is true:
    - An existing optionset is selected
    - The New button is pressed to create a new one.
- Clarify what "Show system optionsets" means, because there are system ones, and read-only ones. Perhaps we have an extra option in that menu list for both.
- increase padding on the right side of the color picker, increase Label column width 10%
- When clicking Save, create a modal to show a detailed changelog of what's happening, and a reset button on each row to revert that specific change
- Make sure the API is not attempting to patch actual null lines, but omit those.
- convert text inputs to a component and create a small text character count validator. When over 50% show the counter, and when 90% of max length turn red
- When deleting a row, make sure it is queued and not instantly deleted. Then delete as part of save batch from modal

### Main grid

- button to enable / disable row ordering, checkbox in settings to have always on ability or require that button (show all buttons accordingly, and apply order only on dirty form)
- idea: Save button could be complex with Save | then submenu of Save all changes; Save deletes; Save Order?


### Sidebar

- When I select New, the optionset dropdown is still visible.
- The input field for schema name needs to have the publisher prefix be non-modifiable.
- The loading spinner is still causing the UI to shift. Should be the height of the label and be inline with it.
- Rename / remove the header "creation context"
- remove the refresh metadata icon in sidebar, move to the action bar of main grid below tab list
- Put Required asterisks at the beginning, info buttons at the end, match all info buttons to the size the publisher label uses
- Remove the bluw border around optionset section
- Remove the text section at the bottom showing publisher prefix / solution again.

## Things to research

- Best practice for modifying system optionsets
    - What system publishers should I be showing (look at mxrm)
- Figure out why the optionset creation service is pushing each piece separate rather than the expected API payload? (Is this a PPTB limitation I am forgetting)

## P0

## P1

## P2
