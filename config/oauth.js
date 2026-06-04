const { START_PORT } = require("./env");

const OAUTH_REDIRECT_BASE = process.env.OAUTH_REDIRECT_BASE || `http://localhost:${START_PORT}`;

function readEnv(key) {
  const value = String(process.env[key] || "").trim();

  if (!value || value === "..." || value.includes("your_")) {
    return "";
  }

  return value;
}

function getRedirectBase(request) {
  if (request?.headers?.host) {
    const forwardedProto = request.headers["x-forwarded-proto"];
    const forwardedHost = request.headers["x-forwarded-host"];

    if (forwardedProto && forwardedHost) {
      const proto = forwardedProto.split(",")[0].trim();
      const resolvedHost = forwardedHost.split(",")[0].trim();
      return `${proto}://${resolvedHost}`;
    }

    return `http://${request.headers.host}`;
  }

  return process.env.OAUTH_REDIRECT_BASE?.trim().replace(/\/$/, "") || OAUTH_REDIRECT_BASE;
}

function getRedirectUri(provider, request) {
  return `${getRedirectBase(request)}/api/auth/${provider}/callback`;
}

const providerDefinitions = {
  google: {
    key: "google",
    label: "Google",
    enabled: Boolean(readEnv("GOOGLE_CLIENT_ID") && readEnv("GOOGLE_CLIENT_SECRET")),
    clientId: readEnv("GOOGLE_CLIENT_ID"),
    clientSecret: readEnv("GOOGLE_CLIENT_SECRET"),
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope: "openid email profile",
    usesSecret: true,
  },
};

function getEnabledProviders() {
  return Object.values(providerDefinitions).filter((provider) => provider.enabled);
}

function getProviderConfig(providerKey) {
  return providerDefinitions[providerKey] || null;
}

module.exports = {
  OAUTH_REDIRECT_BASE,
  getRedirectBase,
  getRedirectUri,
  getEnabledProviders,
  getProviderConfig,
};
