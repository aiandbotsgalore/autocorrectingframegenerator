## 2024-05-23 - [React Component Memoization]
**Learning:** In a React application with a parent component that updates frequently (e.g., status updates during a long-running process), child components that receive props that change less frequently (e.g., a history list) should be memoized with `React.memo`. This prevents unnecessary re-renders of the child component and its children.
**Action:** When a parent component has high-frequency state updates, check if heavy child components can be isolated with `React.memo`. Also, use `loading="lazy"` for images in lists to improve performance.
