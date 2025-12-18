## 2024-05-23 - Missing Memoization in List Components
**Learning:** The application renders lists of images (`IterationHistory`) and complex displays (`IterationDisplay`) without `React.memo`. This causes unnecessary re-renders of the entire history whenever the parent component (`App`) updates its state, which happens frequently during generation (status updates).
**Action:** Wrap these functional components with `React.memo` to ensure they only re-render when their props actually change. This is especially critical for components rendering images or large lists.
