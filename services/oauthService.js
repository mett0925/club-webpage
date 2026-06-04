const crypto = require("crypto");
const { getRedirectUri, getProviderConfig } = require("../config/oauth");

const oauthStates = new Map();
const STATE_TTL_MS = 10 * 60 * 1000;

function cleanupExpiredStates() {
  const now = Date.now();

  for (const [state, value] of oauthStates.entries()) {
    if (value.expiresAt <= now) {
      oauthStates.delete(state);
    }
  }
}

function createOAuthState(returnUrl) {
  cleanupExpiredStates();

  const state = crypto.randomBytes(24).toString("hex");
  oauthStates.set(state, {
    returnUrl: returnUrl || "index.html",
    expiresAt: Date.now() + STATE_TTL_MS,
  });

  return state;
}

function consumeOAuthState(state) {
  cleanupExpiredStates();

  const stored = oauthStates.get(state);

  if (!stored) {
    return null;
  }

  oauthStates.delete(state);

  if (stored.expiresAt <= Date.now()) {
    return null;
  }

  return stored;
}

function buildAuthorizeUrl(providerKey, returnUrl, request) {
  const provider = getProviderConfig(providerKey);

  if (!provider || !provider.enabled) {
    throw new Error("지원하지 않는 소셜 로그인입니다.");
  }

  const state = createOAuthState(returnUrl);
  const redirectUri = getRedirectUri(providerKey, request);
  const params = new URLSearchParams({
    client_id: provider.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
  });

  if (providerKey === "google") {
    params.set("scope", provider.scope);
    params.set("access_type", "online");
    params.set("prompt", "select_account");
  }

  return `${provider.authorizeUrl}?${params.toString()}`;
}

async function exchangeAuthorizationCode(providerKey, code, state = "", request) {
  const provider = getProviderConfig(providerKey);
  const redirectUri = getRedirectUri(providerKey, request);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: provider.clientId,
    redirect_uri: redirectUri,
    code,
  });

  if (provider.clientSecret) {
    body.set("client_secret", provider.clientSecret);
  }

  const response = await fetch(provider.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || "소셜 로그인 토큰 발급에 실패했습니다.");
  }

  return payload;
}

async function fetchGoogleProfile(accessToken) {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const payload = await response.json();

  if (!response.ok || !payload.id) {
    throw new Error("Google 계정 정보를 가져오지 못했습니다.");
  }

  return {
    providerUserId: String(payload.id),
    email: payload.email || "",
    name: payload.name || "Google 사용자",
  };
}

async function fetchSocialProfile(providerKey, tokenPayload) {
  const accessToken = tokenPayload.access_token;

  if (!accessToken) {
    throw new Error("소셜 로그인 access token이 없습니다.");
  }

  if (providerKey === "google") {
    return fetchGoogleProfile(accessToken);
  }

  throw new Error("지원하지 않는 소셜 로그인입니다.");
}

module.exports = {
  buildAuthorizeUrl,
  consumeOAuthState,
  exchangeAuthorizationCode,
  fetchSocialProfile,
};
