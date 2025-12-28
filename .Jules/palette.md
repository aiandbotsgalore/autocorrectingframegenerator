## 2024-05-22 - [Accessibility: Icon Buttons]
**Learning:** Icon-only buttons (like password toggles) are completely invisible to screen readers without an `aria-label`.
**Action:** Always add dynamic `aria-label` props (e.g., "Show password" / "Hide password") to state-dependent icon buttons.
## 2025-02-18 - [Accessibility: Accordions]
**Learning:** Accordion components are a common accessibility trap. Without `aria-expanded`, screen reader users have no way of knowing if the content is visible or hidden.
**Action:** Always pair the toggle button with `aria-expanded={isOpen}` and `aria-controls={contentId}`.
