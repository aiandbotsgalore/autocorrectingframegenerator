## 2025-05-23 - Avoid useEffect for Derived State
**Learning:** Using `useEffect` to update local state based on another state change triggers an unnecessary second render loop. In `PromptInput.jsx`, updating `wordCount` in `useEffect` caused a re-render on every keystroke.
**Action:** Derive the state directly during the render phase if the calculation is cheap. This cuts re-renders by 50% for that interaction.
