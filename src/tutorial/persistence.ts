import type { Consent, TutorialMode } from "./types";

const K_CONSENT = "cocycle:consent";
const K_MODE = "cocycle:tutorial-mode";
const K_STEP = "cocycle:tutorial-step";
const K_VISITED = "cocycle:visited";

export type PersistedState = {
  consent: Consent;
  tutorialMode: TutorialMode;
  tutorialStep: number;
  visited: boolean;
};

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function safeSessionGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function loadFromStorage(): PersistedState {
  const consent = (safeGet(K_CONSENT) ?? "pending") as Consent;
  const visited =
    safeSessionGet(K_VISITED) === "1" || safeGet(K_VISITED) === "1";
  if (consent !== "accepted") {
    return { consent, tutorialMode: "free", tutorialStep: 0, visited };
  }
  const tutorialMode = (safeGet(K_MODE) ?? "free") as TutorialMode;
  const stepStr = safeGet(K_STEP);
  const tutorialStep =
    stepStr == null ? 0 : Math.max(0, parseInt(stepStr, 10) || 0);
  return { consent, tutorialMode, tutorialStep, visited };
}

export function saveConsent(consent: Consent): void {
  safeSet(K_CONSENT, consent);
}

export function saveTutorialState(
  consent: Consent,
  tutorialMode: TutorialMode,
  tutorialStep: number,
): void {
  if (consent !== "accepted") return;
  safeSet(K_MODE, tutorialMode);
  safeSet(K_STEP, String(tutorialStep));
}

export function markVisited(consent: Consent): void {
  safeSessionSet(K_VISITED, "1");
  if (consent === "accepted") safeSet(K_VISITED, "1");
}
