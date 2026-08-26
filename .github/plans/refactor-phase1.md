## Phase 1 refactor plan

- Create shared UI area: src/components/common/
- Move generic reusable components there:
  - src/components/common/ErrorBoundary.tsx
  - src/components/common/LanguageCodeDropdown.tsx
- Keep compatibility shims at legacy locations:
  - src/components/ErrorBoundary.tsx -> re-export from ./common/ErrorBoundary
  - src/components/Main/LanguageCodeDropdown.tsx -> re-export from ../common/LanguageCodeDropdown
- Update active imports to prefer common path:
  - src/main.tsx -> import ErrorBoundary from src/components/common/ErrorBoundary
  - src/components/Main/OptionValuesGrid.tsx -> import LanguageCodeDropdown/LanguageFlag from ../common/LanguageCodeDropdown
  - src/components/Settings/SettingsPanel.tsx -> import LanguageCodeDropdown from ../common/LanguageCodeDropdown
- No runtime behavior changes expected; preserve component logic and exported API.

Validation path:
- Run npm run build in project root.
- Expected result: TypeScript compile + Vite build complete without errors.
