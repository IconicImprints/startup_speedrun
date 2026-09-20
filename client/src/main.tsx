import { createRoot } from "react-dom/client";
import { PostHogProvider } from "posthog-js/react";
import App from "./App";
import { initAnalytics, posthog } from "./lib/analytics";
import "./index.css";

initAnalytics();

createRoot(document.getElementById("root")!).render(
  <PostHogProvider client={posthog}>
    <App />
  </PostHogProvider>,
);
