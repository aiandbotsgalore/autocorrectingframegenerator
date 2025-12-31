## 2024-05-22 - [Accessibility: Icon Buttons]
**Learning:** Icon-only buttons (like password toggles) are completely invisible to screen readers without an `aria-label`.
**Action:** Always add dynamic `aria-label` props (e.g., "Show password" / "Hide password") to state-dependent icon buttons.

## 2025-12-28 - [Accessibility: Accordions]
**Learning:** Collapsible sections need `aria-expanded` and `aria-controls` to properly communicate state to screen readers. Relying on visual changes alone excludes non-visual users.
**Action:** Ensure all toggle buttons have `aria-expanded` state and point to their content via `aria-controls`.
