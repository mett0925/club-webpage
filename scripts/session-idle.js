const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const SESSION_TOUCH_INTERVAL_MS = 60 * 1000;

let idleTimer = null;
let lastSessionTouchAt = 0;
let isLoggedIn = false;

async function fetchCurrentUser() {
  const response = await fetch("/api/me", { credentials: "same-origin" });
  const payload = await response.json();
  return payload.user || null;
}

async function logoutDueToIdle() {
  try {
    await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
  } catch (error) {
    // Ignore network errors and still redirect to login.
  }

  window.location.href = "login.html?reason=idle";
}

function touchSessionIfNeeded() {
  const now = Date.now();

  if (!isLoggedIn || now - lastSessionTouchAt < SESSION_TOUCH_INTERVAL_MS) {
    return;
  }

  lastSessionTouchAt = now;
  fetch("/api/me", { credentials: "same-origin" })
    .then((response) => response.json())
    .then((payload) => {
      if (!payload.user) {
        logoutDueToIdle();
      }
    })
    .catch(() => {});
}

function resetIdleTimer() {
  if (!isLoggedIn) {
    return;
  }

  clearTimeout(idleTimer);
  idleTimer = setTimeout(logoutDueToIdle, SESSION_IDLE_TIMEOUT_MS);
  touchSessionIfNeeded();
}

function bindIdleActivityListeners() {
  ["mousedown", "keydown", "scroll", "touchstart"].forEach((eventName) => {
    window.addEventListener(eventName, resetIdleTimer, { passive: true });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      resetIdleTimer();
    }
  });
}

async function initSessionIdleLogout() {
  try {
    isLoggedIn = Boolean(await fetchCurrentUser());
  } catch (error) {
    isLoggedIn = false;
  }

  if (!isLoggedIn) {
    return;
  }

  lastSessionTouchAt = Date.now();
  bindIdleActivityListeners();
  resetIdleTimer();
}

initSessionIdleLogout();
