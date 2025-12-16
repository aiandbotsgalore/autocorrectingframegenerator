## 2024-05-22 - Accessibility in Complex Forms
**Learning:** For inputs with complex constraints (like word counts), combining `aria-describedby` for static rules and `aria-live` for dynamic feedback is crucial.
**Action:** Always pair visible constraint text with `aria-describedby` and dynamic counters with `aria-live="polite"`.
