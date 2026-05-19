const K_CONSENT = "cocycle:consent";
const K_MODE = "cocycle:tutorial-mode";
const K_STEP = "cocycle:tutorial-step";
const K_VISITED = "cocycle:visited";
function safeGet(key) {
    try {
        return localStorage.getItem(key);
    }
    catch {
        return null;
    }
}
function safeSet(key, value) {
    try {
        localStorage.setItem(key, value);
    }
    catch {
        /* ignore */
    }
}
function safeSessionGet(key) {
    try {
        return sessionStorage.getItem(key);
    }
    catch {
        return null;
    }
}
function safeSessionSet(key, value) {
    try {
        sessionStorage.setItem(key, value);
    }
    catch {
        /* ignore */
    }
}
export function loadFromStorage() {
    const consent = (safeGet(K_CONSENT) ?? "pending");
    const visited = safeSessionGet(K_VISITED) === "1" || safeGet(K_VISITED) === "1";
    if (consent !== "accepted") {
        return { consent, tutorialMode: "free", tutorialStep: 0, visited };
    }
    const tutorialMode = (safeGet(K_MODE) ?? "free");
    const stepStr = safeGet(K_STEP);
    const tutorialStep = stepStr == null ? 0 : Math.max(0, parseInt(stepStr, 10) || 0);
    return { consent, tutorialMode, tutorialStep, visited };
}
export function saveConsent(consent) {
    safeSet(K_CONSENT, consent);
}
export function saveTutorialState(consent, tutorialMode, tutorialStep) {
    if (consent !== "accepted")
        return;
    safeSet(K_MODE, tutorialMode);
    safeSet(K_STEP, String(tutorialStep));
}
export function markVisited(consent) {
    safeSessionSet(K_VISITED, "1");
    if (consent === "accepted")
        safeSet(K_VISITED, "1");
}
