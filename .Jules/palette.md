## 2024-05-22 - [Accessibility: Icon Buttons]
**Learning:** Icon-only buttons (like password toggles) are completely invisible to screen readers without an `aria-label`.
**Action:** Always add dynamic `aria-label` props (e.g., "Show password" / "Hide password") to state-dependent icon buttons.

## 2024-05-22 - [Accessibility: Toggle Buttons]
**Learning:** Visual toggle buttons (e.g., Simple/Pro mode) that rely only on color to show state are inaccessible to screen reader users.
**Action:** Add `aria-pressed={isActive}` to toggle buttons to programmatically communicate their state.
