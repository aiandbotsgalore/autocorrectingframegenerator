## 2024-03-24 - Copy to Clipboard
**Learning:** Users often need to quickly extract the final generated text. Adding a "copy" button next to key output text is a high-value, low-effort micro-UX improvement.
**Action:** When displaying generated content (like prompts or code), always consider adding a copy utility.

## 2024-05-22 - Generation Feedback
**Learning:** For long-running processes like image generation, dynamic text updates ("Generating...", "Analyzing...") are invisible to screen readers without `aria-live`.
**Action:** Always wrap dynamic status text containers in `aria-live="polite"` so users on assistive technology know progress is happening.
