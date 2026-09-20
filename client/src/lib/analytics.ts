import posthog from "posthog-js";

const VISIT_KEY = "startup-speedrun-visited";
const PLACEHOLDER_KEYS = new Set(["", "phc_your_key_here", "your_key_here"]);

type IdeaGeneratedProperties = {
  idea: string;
  category: string;
  difficulty: string;
};

type SpeedrunStartedProperties = {
  minutes: number;
  difficulty: string;
  idea: string;
  category: string;
};

type SpeedrunCompletedProperties = {
  idea: string;
  minutes: number;
  projectName: string;
  hasScreenshot: boolean;
  difficulty: string;
};

function isUsablePostHogKey(key: string) {
  if (PLACEHOLDER_KEYS.has(key)) return false;
  // Project API keys are public client tokens shaped like phc_...
  return /^phc_[A-Za-z0-9]+$/.test(key) && key.length >= 20;
}

function capture(event: string, properties?: Record<string, unknown>) {
  try {
    if (!posthog.__loaded) return;
    posthog.capture(event, properties);
  } catch {
    // Analytics must never break the product.
  }
}

/** Initialize PostHog once from Vite env vars. Safe when the key is missing. */
export function initAnalytics() {
  try {
    if (typeof window === "undefined") return;
    if (posthog.__loaded) return;

    // Vite only statically replaces direct import.meta.env.VITE_* access.
    const key = String(import.meta.env.VITE_PUBLIC_POSTHOG_KEY ?? "").trim();
    const host =
      String(import.meta.env.VITE_PUBLIC_POSTHOG_HOST ?? "").trim() ||
      "https://us.i.posthog.com";

    if (!isUsablePostHogKey(key)) return;

    posthog.init(key, {
      api_host: host,
      defaults: "2025-05-24",
      capture_pageview: "history_change",
      capture_pageleave: "if_capture_pageview",
      persistence: "localStorage+cookie",
      person_profiles: "identified_only",
    });
  } catch {
    // Analytics must never break the product.
  }
}

export function trackIdeaGenerated(properties: IdeaGeneratedProperties) {
  capture("idea_generated", properties);
}

export function trackSpeedrunStarted(properties: SpeedrunStartedProperties) {
  capture("speedrun_started", properties);
}

export function trackSpeedrunCompleted(properties: SpeedrunCompletedProperties) {
  capture("speedrun_completed", properties);
}

/** Fire when a returning visitor opens the app (local first-visit marker). */
export function trackUserReturnedIfNeeded() {
  try {
    const previousVisit = window.localStorage.getItem(VISIT_KEY);
    if (previousVisit) {
      capture("user_returned", {
        previous_visit: previousVisit,
      });
    }
    window.localStorage.setItem(VISIT_KEY, new Date().toISOString());
  } catch {
    // localStorage may be unavailable; analytics is non-critical.
  }
}

export { posthog };
