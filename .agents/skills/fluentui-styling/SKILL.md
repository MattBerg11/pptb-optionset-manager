---
name: fluentui-styling
description: Styling guidance for React apps using Fluent UI v9, FluentProvider, makeStyles, tokens, theme-aware layouts, and PPTB-compatible UI patterns.
---

# Fluent UI styling guidance

Use Fluent UI components and tokens as the default styling system for this repo. Prefer token-based layout and semantic surfaces over custom CSS or ad hoc HTML styling.

## Core rules

- Use `@fluentui/react-components` components instead of raw HTML equivalents when the component exists.
- Prefer `makeStyles` defined outside the component and use design tokens from `tokens`.
- Avoid inline `style={{ ... }}` objects for app layout or component styling.
- Avoid custom CSS variables in component code; use Fluent UI tokens instead.
- Keep styles theme-aware so they render correctly in both light and dark mode.

## Standard pattern

```tsx
import { Input, makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
    container: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalM,
        padding: tokens.spacingVerticalL,
        backgroundColor: tokens.colorNeutralBackground1,
        borderRadius: tokens.borderRadiusMedium,
    },
    input: {
        borderColor: tokens.colorNeutralStroke1,
        ":focus": {
            borderColor: tokens.colorBrandStroke1,
        },
    },
});

export function Example() {
    const styles = useStyles();

    return (
        <div className={styles.container}>
            <Input className={styles.input} />
        </div>
    );
}
```

## Use these patterns

- `Button` instead of `<button>`
- `Input` / `Textarea` instead of native form controls
- `Dropdown` + `Option` instead of `<select>`
- `Dialog` / `Drawer` instead of custom modal markup
- `Checkbox` / `Switch` instead of custom toggles
- `TabList` / `Tab` for tabbed interfaces when appropriate

## Tokens to prefer

- Colors: `colorNeutralBackground1`, `colorNeutralStroke1`, `colorBrandBackground`, `colorNeutralForeground2`
- Spacing: `spacingVerticalS`, `spacingVerticalM`, `spacingHorizontalM`, `spacingHorizontalL`
- Typography: `fontSizeBase300`, `fontWeightSemibold`, `lineHeightBase300`
- Radius and shadows: `borderRadiusMedium`, `borderRadiusLarge`, `shadow4`, `shadow16`

## Avoid

- inline styles for layout, padding, and color
- custom CSS classes when a Fluent component or token-based style is enough
- hard-coded colors that do not follow the theme system
- duplicating component behavior with hand-written HTML controls

## Theme integration

If the app needs theme state, prefer FluentProvider with the current PPTB theme and use tokens rather than explicit CSS color values. The component should render correctly in both light and dark modes with no custom theme assumptions.
