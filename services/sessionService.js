const crypto = require("crypto");
const { SESSION_COOKIE_NAME, SESSION_IDLE_TIMEOUT_MS } = require("../config/env");

const sessions = new Map();

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((cookies, cookie) => {
    const [name, ...valueParts] = cookie.trim().split("=");

    if (!name) {
      return cookies;
    }

    cookies[name] = decodeURIComponent(valueParts.join("="));
    return cookies;
  }, {});
}

function getSessionUser(request, response = null) {
  const cookies = parseCookies(request.headers.cookie);
  const sessionId = cookies[SESSION_COOKIE_NAME];

  if (!sessionId) {
    return null;
  }

  const session = sessions.get(sessionId);

  if (!session) {
    return null;
  }

  const lastActivityAt = session.lastActivityAt ?? session.createdAt ?? 0;

  if (Date.now() - lastActivityAt > SESSION_IDLE_TIMEOUT_MS) {
    sessions.delete(sessionId);

    if (response) {
      response.setHeader(
        "Set-Cookie",
        `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`
      );
    }

    return null;
  }

  session.lastActivityAt = Date.now();
  return session.user;
}

function updateSessionUser(request, user) {
  const cookies = parseCookies(request.headers.cookie);
  const sessionId = cookies[SESSION_COOKIE_NAME];
  const session = sessionId ? sessions.get(sessionId) : null;

  if (session) {
    session.user = user;
    session.lastActivityAt = Date.now();
  }
}

function createSession(user) {
  const sessionId = crypto.randomBytes(32).toString("hex");
  sessions.set(sessionId, {
    user,
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
  });

  return {
    "Set-Cookie": `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}; HttpOnly; Path=/; SameSite=Lax`,
  };
}

function clearSession(request) {
  const cookies = parseCookies(request.headers.cookie);
  const sessionId = cookies[SESSION_COOKIE_NAME];

  if (sessionId) {
    sessions.delete(sessionId);
  }

  return {
    "Set-Cookie": `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`,
  };
}

module.exports = {
  getSessionUser,
  updateSessionUser,
  createSession,
  clearSession,
};
