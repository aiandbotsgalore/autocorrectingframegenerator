## 2024-05-22 - [Accessibility: Icon Buttons]
**Learning:** Icon-only buttons (like password toggles) are completely invisible to screen readers without an `aria-label`.  
**Action:** Always add dynamic `aria-label` props (e.g., "Show password" / "Hide password") to state-dependent icon buttons.

## 2025-12-28 - [Accessibility: Accordions]
**Learning:** Accordion components and other collapsible sections are a common accessibility trap. Without `aria-expanded`, screen reader users have no way of knowing whether content is visible or hidden, and relying on visual changes alone excludes non-visual users.  
**Action:** Always pair toggle buttons with `aria-expanded={isOpen}` and `aria-controls={contentId}` to clearly communicate state and relationships.
