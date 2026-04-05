import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// If there's no hash at all, set it to root — Auth gate in App.tsx
// will redirect to /login if unauthenticated, or / if authenticated.
// We do NOT force /onboarding here anymore; the auth layer handles that.
if (!window.location.hash || window.location.hash === '#') {
  window.location.hash = '#/';
}

createRoot(document.getElementById("root")!).render(<App />);
