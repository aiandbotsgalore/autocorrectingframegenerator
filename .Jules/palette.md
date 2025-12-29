## 2024-05-22 - [Accessibility: Icon Buttons]
**Learning:** Icon-only buttons (like password toggles) are completely invisible to screen readers without an `aria-label`.
**Action:** Always add dynamic `aria-label` props (e.g., "Show password" / "Hide password") to state-dependent icon buttons.

## 2024-05-22 - [Accessibility: Toggle Buttons]
**Learning:** Visual-only toggle buttons (changing background color) are ambiguous to screen readers.
**Action:** Use `aria-pressed` on toggle buttons to programmatically communicate their state to assistive technology.
