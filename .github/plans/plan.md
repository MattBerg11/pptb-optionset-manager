## Plan: Component Refactoring & Folder Reorganization

Refactor the OptionSet Manager codebase to improve maintainability by extracting reusable components, reorganizing folder structure, and splitting large files. Research reveals ~400-500 lines of duplicated code across components and several 500+ line files that need decomposition.

### TL;DR
**What**: Reorganize component structure, extract shared components, and split large files  
**Why**: Reduce code duplication (~400-500 lines), improve maintainability, align with React best practices  
**How**: Phased approach starting with high-impact quick wins (folder structure, shared components), then decomposing large files

---

## Implementation Steps

### Phase 1: Folder Structure & Quick Wins ⚡
*Dependencies: None | Can parallelize all steps in this phase*

**1.1** Create new folder structure:
- Create `src/components/common/` directory for shared components
- Create `src/components/common/index.ts` barrel export
- Create `src/components/flags/` directory for flag SVG components
- Create `src/components/ui/` directory for reusable UI patterns

**1.2** Move LanguageCodeDropdown to shared location:
- Move `src/components/Main/LanguageCodeDropdown.tsx` → `src/components/common/LanguageCodeDropdown.tsx`
- Update all import statements in:
  - OptionValuesGrid.tsx
  - SettingsPanel.tsx (likely imports it)
  - Any other files importing from `../Main/LanguageCodeDropdown`
- Update `src/components/common/index.ts` to export both LanguageCodeDropdown and LanguageFlag
- Remove from `src/components/Main/index.ts` if listed

**1.3** Move ErrorBoundary to common:
- Move `src/components/ErrorBoundary.tsx` → `src/components/common/ErrorBoundary.tsx`
- Update import in main.tsx or wherever it's imported
- Export from `src/components/common/index.ts`

**1.4** Verify Phase 1:
- Run `npm run build` - should succeed with no errors
- Visual test: App renders correctly
- All imports resolve correctly

---

### Phase 2: Extract Reusable UI Components 🎨
*Dependencies: Phase 1.1 complete (ui/ folder exists) | Steps 2.1-2.4 can parallelize*

**2.1** Create StatusMessageBar component:
- Create `src/components/ui/StatusMessageBar.tsx`
- Extract common status/validation panel pattern used in 4 files:
  - Pattern in OptionSetManagerPage.tsx (or App.tsx if this is duplicate)
  - Pattern in ImportModal.tsx
  - Pattern in LoadOptionSetModal.tsx
- Props: `intent: 'success' | 'error' | 'warning' | 'info'`, `message: string | ReactNode`, `onDismiss?: () => void`, `actions?: ReactNode`
- Implement consistent styling with Fluent UI tokens
- Replace all 4 instances with StatusMessageBar component

**2.2** Create ConfirmDialog component:
- Create `src/components/ui/ConfirmDialog.tsx`
- Extract Dialog pattern from:
  - OptionSetManagerPage.tsx (or App.tsx)
  - SettingsPanel.tsx
  - SidebarPanel.tsx
  - MetadataSelector.tsx
- Props: `open: boolean`, `title: string`, `message: string | ReactNode`, `confirmLabel?: string`, `confirmIntent?: 'primary' | 'danger'`, `cancelLabel?: string`, `onConfirm: () => void`, `onCancel: () => void`
- Replace all 4 instances

**2.3** Create EmptyState component:
- Create `src/components/ui/EmptyState.tsx`
- Extract empty state pattern from:
  - OptionValuesGrid.tsx
  - LoadOptionSetModal.tsx
  - SidebarPanel.tsx
  - ActivityLog.tsx
- Props: `icon?: ReactNode`, `title: string`, `description?: string`, `action?: ReactNode`
- Replace all 4 instances

**2.4** Create MetadataDropdown wrapper component:
- Create `src/components/ui/MetadataDropdown.tsx`
- Extract repeated InfoLabel + Dropdown + loading + error pattern from MetadataSelector.tsx
- Pattern used 8+ times in MetadataSelector
- Props: `label: string`, `infoTooltip?: string`, `value: string | undefined`, `options: Array<{key: string, text: string}>`, `onChange: (value: string) => void`, `loading?: boolean`, `error?: string`, `disabled?: boolean`, `placeholder?: string`
- Replace all 8+ instances in MetadataSelector

**2.5** Export from barrel:
- Update `src/components/ui/index.ts` to export all new components

**2.6** Verify Phase 2:
- Run `npm run build` - should succeed
- Test all UI interactions: validation messages, dialogs, empty states
- Visual regression: all components render identically

---

### Phase 3: Split Large Files - LanguageCodeDropdown 🌍
*Dependencies: Phase 1.2 complete (file in common/) | Parallelize with Phase 4*

**3.1** Extract LanguageFlag to separate file:
- Create `src/components/flags/LanguageFlag.tsx`
- Move LanguageFlag component from LanguageCodeDropdown.tsx (lines 15-363)
- Keep the 40+ SVG case statements in LanguageFlag for now (see Decision #1)
- Import LanguageFlag in LanguageCodeDropdown.tsx

**3.2** Extract flag styles to shared:
- Create `src/components/flags/flagStyles.ts`
- Move flag-related makeStyles to shared file
- Import in both LanguageFlag.tsx and LanguageCodeDropdown.tsx

**3.3** Update LanguageCodeDropdown:
- Keep only the dropdown component logic
- Import LanguageFlag from `./flags/LanguageFlag`
- Update common/index.ts to export from flags/ as needed

**3.4** Verify Phase 3:
- All 40+ language flags render correctly
- Dropdown functions correctly in all contexts (grid, settings, etc.)
- Run `npm run build`

---

### Phase 4: Split Large Files - App.tsx 📄
*Dependencies: Phase 2 complete (UI components exist) | Parallelize with Phase 3*

**4.1** Identify App.tsx vs OptionSetManagerPage.tsx:
- Determine if OptionSetManagerPage.tsx is a duplicate of App.tsx
- If duplicate and unused: DELETE OptionSetManagerPage.tsx
- If both used: Clarify which is the correct main component

**4.2** Extract ValidationPanel component:
- Create `src/components/validation/ValidationPanel.tsx` (~100 lines)
- Create `src/components/validation/ValidationIssueItem.tsx` (~40 lines)
- Extract validation panel JSX from App.tsx
- Extract related validation styles
- Props: `issues: ValidationIssue[]`, `onDismiss: () => void`, `onIssueClick?: (issue: ValidationIssue) => void`

**4.3** Extract ActionBar component:
- Create `src/components/layout/ActionBar.tsx` (~80 lines)
- Extract action bar JSX from App.tsx
- Props: `onValidate`, `onSave`, `onImport`, `onDelete`, `disabled` states, validation status, save status
- Move computed button logic and tooltip state into ActionBar

**4.4** Extract StatusBar component:
- Create `src/components/layout/StatusBar.tsx` (~50 lines)
- Extract status bar JSX from App.tsx
- Props: `connection`, `stats: {rows, languages, success, error}`

**4.5** Extract usePageOrchestration hook:
- Create `src/hooks/usePageOrchestration.ts` (~200 lines)
- Extract state management: modal states, tab state, validation state
- Extract UI handlers: openModal, closeModal, setActiveTab, etc.
- Keep data/business logic in existing hooks

**4.6** Refactor App.tsx:
- Import and compose extracted components
- Use usePageOrchestration for UI state
- Target: Reduce from 750 lines → ~300-350 lines

**4.7** Verify Phase 4:
- Full app functionality test: validate, save, load, import, delete
- All modals open/close correctly
- All buttons and status displays work
- Run `npm run build`

---

### Phase 5: Split Large Files - OptionValuesGrid.tsx 📊
*Dependencies: None (but after Phase 4 to avoid too much parallel change)*

**5.1** Extract OptionRowMain component:
- Create `src/components/grid/OptionRowMain.tsx` (~100 lines)
- Extract main row rendering JSX from OptionValuesGrid
- Props: row data, handlers, validation, styles

**5.2** Extract LanguageSubRow component:
- Create `src/components/grid/LanguageSubRow.tsx` (~80 lines)
- Extract language variant row rendering
- Props: language code, label, description, handlers

**5.3** Extract LanguagePickerRow component:
- Create `src/components/grid/LanguagePickerRow.tsx` (~50 lines)
- Extract language picker UI

**5.4** Extract useRowDragDrop hook:
- Create `src/hooks/useRowDragDrop.ts` (~60 lines)
- Extract drag state and handlers

**5.5** Extract useRowExpansion hook:
- Create `src/hooks/useRowExpansion.ts` (~30 lines)
- Extract expansion state and toggle logic

**5.6** Refactor OptionValuesGrid:
- Import and compose extracted components and hooks
- Target: Reduce from 501 lines → ~150 lines

**5.7** Verify Phase 5:
- Test grid interactions: add row, delete row, edit cells
- Test drag & drop reordering
- Test row expansion/collapse
- Test language add/remove within rows
- Run `npm run build`

---

### Phase 6: Optional - Further Decomposition 🔧
*Dependencies: Phases 1-5 complete | Only if needed*

**6.1** MetadataSelector split (if still too complex after Phase 2.4):
- Create `src/components/Sidebar/GlobalScopeSelector.tsx` (~150 lines)
- Create `src/components/Sidebar/LocalScopeSelector.tsx` (~150 lines)
- Create `src/hooks/useMetadataLoader.ts` (~100 lines)
- Reduce MetadataSelector from 501+ → ~100 lines

**6.2** Hook decomposition (if useOptionSetBuilder.ts needs splitting):
- Extract `src/hooks/useRowOperations.ts` (~80 lines)
- Extract `src/hooks/useCodeSync.ts` (~60 lines)
- Extract `src/hooks/useImportParser.ts` (~50 lines)
- Reduce useOptionSetBuilder from 356 → ~150 lines

---

## Relevant Files

**Files to modify (Phase 1-2)**:
- `src/components/Main/LanguageCodeDropdown.tsx` — Move to common/, split LanguageFlag
- `src/components/ErrorBoundary.tsx` — Move to common/
- `src/components/Main/OptionValuesGrid.tsx` — Update imports, replace with StatusMessageBar/EmptyState
- `src/components/Modals/ImportModal.tsx` — Replace with StatusMessageBar/ConfirmDialog
- `src/components/Modals/LoadOptionSetModal.tsx` — Replace with StatusMessageBar/EmptyState
- `src/components/Settings/SettingsPanel.tsx` — Replace with ConfirmDialog
- `src/components/Sidebar/SidebarPanel.tsx` — Replace with ConfirmDialog/EmptyState
- `src/components/Sidebar/MetadataSelector.tsx` — Replace with MetadataDropdown wrapper
- `src/components/Sidebar/ActivityLog.tsx` — Replace with EmptyState

**Files to modify/delete (Phase 4)**:
- `src/OptionSetManagerPage.tsx` — Investigate if duplicate, possibly DELETE
- `src/app/App.tsx` — Extract ValidationPanel, ActionBar, StatusBar, usePageOrchestration

**New directories to create**:
- `src/components/common/` — Shared components (LanguageCodeDropdown, ErrorBoundary)
- `src/components/ui/` — Reusable UI patterns (StatusMessageBar, ConfirmDialog, EmptyState, MetadataDropdown)
- `src/components/flags/` — Flag components (LanguageFlag, styles)
- `src/components/validation/` — Validation UI (ValidationPanel, ValidationIssueItem)
- `src/components/layout/` — Layout components (ActionBar, StatusBar)
- `src/components/grid/` — Grid sub-components (OptionRowMain, LanguageSubRow, etc.)

**Files to create**:
- All index.ts barrel exports for new directories
- All new component and hook files listed in steps above

---

## Verification

**After each phase**:
1. Run `npm run build` with zero errors
2. Visual regression test: UI renders identically to before
3. Functional test: All features work (specific tests per phase in steps above)

**Final verification**:
1. Full app test: create optionset, load, validate, save, import, export code, change theme
2. No console errors or warnings
3. Build output size comparable or smaller than before
4. TypeScript strict mode passes

---

## Decisions

**Decision 1: How to handle 40+ flag SVG cases in LanguageFlag?**
- **Option A (Quick)**: Keep all 40+ case statements in LanguageFlag.tsx (~350 lines in one file)
- **Option B (Moderate)**: Extract each flag to individual file in flags/ (40+ files ~15 lines each, enables lazy loading)
- **Option C (Complex)**: Data-driven SVG definitions (requires significant refactoring)

**Recommendation**: Start with Option A (keep in LanguageFlag.tsx) for Phase 3, can upgrade to Option B later if needed. Option B enables tree-shaking and lazy loading but adds 40+ new files.

**Decision 2: Is OptionSetManagerPage.tsx used?**
- Research indicates it may be an unused duplicate of App.tsx
- **Action needed**: Confirm via code search before Phase 4

**Decision 3: Should Phase 6 (optional decomposition) be included?**
- MetadataSelector and hook splitting are lower priority
- **Recommendation**: Defer until after Phase 5 complete, re-evaluate need

**Decision 4: Component location - ui/ vs common/?**
- `common/` = Shared domain components (LanguageCodeDropdown, ErrorBoundary)
- `ui/` = Generic reusable UI patterns (StatusMessageBar, ConfirmDialog)
- **Recommendation**: Keep this distinction for clarity

---

## Estimated Impact

**Code Reduction**:
- Eliminate ~400-500 lines of duplicated code (Phases 1-2)
- Reduce large files by ~1100 lines total:
  - App.tsx: 750 → 350 lines (-400)
  - OptionValuesGrid: 501 → 150 lines (-351)
  - LanguageCodeDropdown: 412 → 60 lines (-352)

**New Files Created**: ~15-20 new component/hook files
**Import Updates Required**: ~10-15 files need import path updates
**Estimated Effort**: 
- Phase 1-2 (high value): 4-6 hours
- Phase 3-5 (decomposition): 6-8 hours
- Phase 6 (optional): 2-4 hours
- Total: 12-18 hours for Phases 1-5

**Benefits**:
- Easier to find and modify specific components
- Better code reusability
- Improved testability (smaller, focused units)
- Follows React community best practices
- Better developer onboarding experience
