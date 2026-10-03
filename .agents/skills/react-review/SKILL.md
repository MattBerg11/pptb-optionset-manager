---
name: react-review
description: >
  Deep React code review that catches architectural violations, hook misuse, React Compiler incompatibilities,
  and component design anti-patterns. Use this skill whenever the user asks to review React code, check React
  best practices, audit a React codebase, find React anti-patterns, or says things like "review my components",
  "check my hooks", "is this React code good", "react review", or "lint my react". Also trigger when the user
  mentions React Compiler readiness, hook dependency issues, or component architecture concerns — even if they
  don't explicitly say "review".
---

# React Code Review

You are performing a deep architectural review of React code. Your job is to find real problems that cause bugs, performance issues, or maintenance nightmares — not to nitpick style.

## Step 1: Discover React Code

Before reviewing, understand where React code lives in this repo.

1. Look for framework config files (`next.config.*`, `vite.config.*`, `expo` in package.json, `remix.config.*`, etc.) to determine the framework
2. Find React entry points via `Glob` for `**/*.tsx`, `**/*.jsx` patterns
3. Identify the component directory structure (e.g., `src/components/`, `app/`, `pages/`, `features/`)
4. Check for React Compiler setup: look for `babel-plugin-react-compiler` or `react-compiler` in package.json or babel/bundler config
5. Check React version in package.json — this affects which rules apply

## Step 2: Determine Review Scope

The user controls scope. Default behavior:

- **If there are uncommitted changes**: review only changed `.tsx`/`.jsx` files (`git diff --name-only` + `git diff --cached --name-only`)
- **If working tree is clean**: review files from the most recent commit (`git diff HEAD~1 --name-only`)
- **If user specifies files/directories**: review exactly what they asked for

Filter to only `.tsx`, `.jsx`, `.ts`, `.js` files that contain React code (JSX or hook imports).

## Step 3: Review Against the Checklist

Read each file in scope. For every violation found, record:
- **File and line number**
- **Rule violated** (use the rule ID)
- **Severity**: `error` (will cause bugs/crashes), `warning` (performance/maintenance risk), `info` (improvement opportunity)
- **What's wrong** (1 sentence)
- **How to fix** (concrete code suggestion)

### The Rules

#### Architecture Rules

**ARCH-01: No business logic in components**
Components are a reflection of state, not the system itself. If a component contains domain logic (calculations, transformations, validation, state machines, API orchestration), that logic belongs in a service, store, or custom hook — not inline in the render tree.

Why this matters: business logic buried in components can't be tested independently, can't be reused, and creates coupling between UI and domain. When the design changes, you shouldn't have to rewrite business logic.

Look for: complex conditionals, data transformations, multi-step workflows, anything that isn't directly about "what to render given this state."

**ARCH-02: External systems via custom hooks only**
All interaction with external systems (APIs, localStorage, WebSocket, geolocation, clipboard, IndexedDB, etc.) must go through a custom hook. Components should never directly call `fetch`, `localStorage.getItem`, `navigator.clipboard`, etc.

Why: isolates side effects, makes components testable, creates a single place to manage connection lifecycle and error states.

**ARCH-03: No `useEffect` directly in components**
Every `useEffect` must live inside a custom hook, never directly in a component body. The custom hook should have a name that describes what it synchronizes (e.g., `useDocumentTitle`, `useSyncToLocalStorage`, `useWebSocketConnection`).

Why: `useEffect` is React's escape hatch for synchronization with external systems. When effects are inline in components, their purpose is opaque, their cleanup is easy to botch, and they encourage piling more unrelated synchronization into the same component.

Exception: one-liner effects in tiny utility components are acceptable if the hook name would just restate the effect (use judgment).

**ARCH-04: Colocate related logic**
If a component imports 5+ hooks/utilities from different files to assemble one behavior, that behavior should be a single custom hook. Scattered logic across many files is worse than a slightly longer hook.

#### Hook Rules

**HOOK-01: Correct dependency arrays**
Every value from the component scope that's used inside `useEffect`, `useCallback`, or `useMemo` must appear in the dependency array. Missing deps cause stale closures. Unnecessary deps cause over-firing.

Common violations:
- Missing object/array deps (often intentional but wrong — use refs or restructure)
- Using `// eslint-disable-next-line react-hooks/exhaustive-deps` to silence warnings instead of fixing the code

**HOOK-02: No conditional or nested hook calls**
Hooks must be called at the top level of the component or custom hook, every render, in the same order. Never inside `if`, loops, `try/catch`, callbacks, or after early returns.

**HOOK-03: Stable references for callbacks passed to children**
Functions passed as props to child components (especially those wrapped in `React.memo`) should be wrapped in `useCallback`. Objects/arrays created in render that are passed as props should use `useMemo` when the child is memoized.

Why: without stable references, memoized children re-render every time anyway, defeating the purpose.

**HOOK-04: No `setState` during render**
Calling `setState` (or a dispatch) during the render phase creates an infinite re-render loop or, at best, triggers unnecessary extra renders. State updates belong in event handlers, effects, or callbacks — never in the component body outside of those.

Look for: `useState` setter calls that execute unconditionally in the component body, or inside `useMemo`/`useCallback` factory functions.

**HOOK-05: Don't sync state that can be derived**
If a value can be computed from existing props or state, compute it — don't store it in separate state and try to keep it in sync via effects. The "sync two states with useEffect" pattern is almost always wrong.

```tsx
// Bad: derived state stored separately
const [items, setItems] = useState(props.items);
useEffect(() => setItems(props.items), [props.items]);

// Good: derive it
const items = props.items; // or compute from it
```

#### React Compiler Compatibility

**COMPILER-01: No refs in render output**
Don't read or write `.current` on refs during rendering. Refs are for effects, event handlers, and callbacks. Reading a ref during render breaks React Compiler's ability to memoize because ref reads are side effects that the compiler can't track.

**COMPILER-02: No mutations of props, state, or values returned from hooks**
React Compiler assumes all values from hooks, props, and state are immutable during render. Mutating them (e.g., `array.push()`, `obj.key = value`, `sort()` in place) breaks memoization and can cause subtle bugs.

Always create new objects/arrays: `[...arr, newItem]`, `{...obj, key: value}`, `arr.toSorted()`.

**COMPILER-03: Avoid non-idempotent render logic**
Render must be a pure function of props and state. Code that produces different results when called twice with the same inputs (e.g., `Date.now()`, `Math.random()`, `id++` counters in render) is incompatible with React Compiler and Strict Mode double-rendering.

**COMPILER-04: No external mutable state reads in render**
Reading from module-level mutable variables, global state outside of React, or mutable class instances during render is invisible to React Compiler. Use `useSyncExternalStore` for external stores, or refs (read in effects only) for mutable values.

#### Performance Rules

**PERF-01: Avoid creating objects/arrays/functions in JSX props**
Inline `style={{...}}`, `onClick={() => ...}`, or `data={[1,2,3]}` in JSX creates new references every render. For components that are rendered in lists, memoized, or rendered frequently, hoist these to constants, `useMemo`, or `useCallback`.

Don't flag this for simple leaf elements like `<button>` or `<div>` where it doesn't matter — focus on when it's passed to memoized or expensive children.

**PERF-02: Lists need stable, unique keys**
Array `.map()` in JSX must use stable, unique keys — not array index (unless the list is truly static and never reordered/filtered). Using index keys on dynamic lists causes state corruption and incorrect DOM recycling.

**PERF-03: Expensive computations should be memoized**
If a computation inside a component is O(n) or worse, or involves serialization/parsing/heavy transforms, wrap it in `useMemo`. Don't memoize trivial computations — that adds overhead for no gain.

#### Common Anti-Patterns

**ANTI-01: God components**
Components over ~200 lines that handle multiple responsibilities. Break them into focused sub-components with clear data flow.

**ANTI-02: Prop drilling more than 2 levels**
If the same prop passes through 3+ intermediate components untouched, consider context, composition (children prop), or a state management solution.

**ANTI-03: Async operations without cleanup**
`useEffect` that starts async work (fetch, timers, subscriptions) without returning a cleanup function. Leads to state updates on unmounted components and race conditions.

**ANTI-04: Ref forwarding gaps**
Custom components that accept `ref` but don't forward it with `forwardRef` (React <19) or the `ref` prop (React 19+). Check the React version to know which pattern applies.

## Step 4: Generate the Report

Present findings as a structured report:

```
## React Review: [scope description]

### Summary
- X errors, Y warnings, Z info
- React version: [version]
- React Compiler: [enabled/not detected]
- Framework: [Next.js/Vite/Expo/etc.]
- Files reviewed: N

### Findings

#### [filename]:[line] — ARCH-01 (error)
**Business logic in component**
[description of what's wrong]

**Fix:**
[concrete code change]

---
[...more findings...]
```

Group findings by file. Within each file, sort by severity (errors first).

## Step 5: Offer to Fix

After presenting the report, ask:

> "Found X issues (N errors, N warnings, N info). Want me to fix these? I can fix all, errors only, or specific files — your call."

If the user says yes, fix the issues. Apply the principles — extract hooks, move business logic out, fix dependency arrays, etc. Don't just suppress warnings.
