const { getEnabledProviders } = require("../config/oauth");
const { sendJson, redirect } = require("../utils/http");
const { createSession } = require("../services/sessionService");
const { toPublicUser, normalizeEmail, isValidEmail } = require("../dto/userDto");
const {
  findUserById,
  findUserByEmail,
  createSocialUser,
} = require("../dao/userDao");
const { findSocialAccount, linkSocialAccount } = require("../dao/socialAccountDao");
const {
  buildAuthorizeUrl,
  consumeOAuthState,
  exchangeAuthorizationCode,
  fetchSocialProfile,
} = require("../services/oauthService");

function getSafeReturnUrl(returnUrl) {
  const fallback = "index.html";

  if (!returnUrl || returnUrl.startsWith("http")) {
    return fallback;
  }

  return returnUrl.startsWith("/") ? returnUrl.slice(1) : returnUrl;
}

function redirectWithOAuthError(response, message) {
  redirect(response, `/login.html?oauthError=${encodeURIComponent(message)}`);
}

async function resolveUserFromSocialProfile(providerKey, profile) {
  if (!profile.providerUserId) {
    throw new Error("소셜 계정 식별 정보를 확인하지 못했습니다.");
  }

  const linkedAccount = await findSocialAccount(providerKey, profile.providerUserId);

  if (linkedAccount) {
    const linkedUser = await findUserById(linkedAccount.userId);

    if (!linkedUser) {
      throw new Error("연결된 회원 정보를 찾을 수 없습니다.");
    }

    return linkedUser;
  }

  const normalizedEmail = normalizeEmail(profile.email);

  if (normalizedEmail && isValidEmail(normalizedEmail)) {
    const existingUser = await findUserByEmail(normalizedEmail);

    if (existingUser) {
      await linkSocialAccount(existingUser.id, providerKey, profile.providerUserId);
      return existingUser;
    }
  }

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    throw new Error("소셜 계정에서 이메일 정보를 받지 못했습니다. 이메일 제공 동의 후 다시 시도해주세요.");
  }

  const user = await createSocialUser({
    name: String(profile.name || `${providerKey} 사용자`).trim().slice(0, 50),
    email: normalizedEmail,
    provider: providerKey,
    providerUserId: profile.providerUserId,
  });

  await linkSocialAccount(user.id, providerKey, profile.providerUserId);
  return user;
}

async function handleOAuthCallback(request, response, providerKey, parsedUrl) {
  const error = parsedUrl.searchParams.get("error");
  const code = parsedUrl.searchParams.get("code");
  const state = parsedUrl.searchParams.get("state");

  if (error) {
    redirectWithOAuthError(response, "소셜 로그인이 취소되었습니다.");
    return true;
  }

  const storedState = consumeOAuthState(state);

  if (!code || !storedState) {
    redirectWithOAuthError(response, "소셜 로그인 인증이 만료되었습니다. 다시 시도해주세요.");
    return true;
  }

  try {
    const tokenPayload = await exchangeAuthorizationCode(providerKey, code, state, request);
    const profile = await fetchSocialProfile(providerKey, tokenPayload);
    const user = await resolveUserFromSocialProfile(providerKey, profile);
    const sessionHeaders = createSession(toPublicUser(user));
    const returnUrl = getSafeReturnUrl(storedState.returnUrl);

    redirect(response, `/${returnUrl}`, sessionHeaders);
    return true;
  } catch (callbackError) {
    console.error(`${providerKey} OAuth callback error:`, callbackError.message);
    redirectWithOAuthError(response, callbackError.message || "소셜 로그인에 실패했습니다.");
    return true;
  }
}

async function handleOAuthRequest(request, response, parsedUrl) {
  const pathname = parsedUrl.pathname;

  if (request.method === "GET" && pathname === "/api/auth/providers") {
    sendJson(response, 200, {
      providers: getEnabledProviders().map((provider) => ({
        key: provider.key,
        label: provider.label,
      })),
    });
    return true;
  }

  const startMatch = pathname.match(/^\/api\/auth\/(google)$/);

  if (request.method === "GET" && startMatch) {
    const providerKey = startMatch[1];
    const returnUrl = getSafeReturnUrl(parsedUrl.searchParams.get("return"));

    try {
      const authorizeUrl = buildAuthorizeUrl(providerKey, returnUrl, request);
      redirect(response, authorizeUrl);
      return true;
    } catch (startError) {
      redirectWithOAuthError(response, startError.message);
      return true;
    }
  }

  const callbackMatch = pathname.match(/^\/api\/auth\/(google)\/callback$/);

  if (request.method === "GET" && callbackMatch) {
    return handleOAuthCallback(request, response, callbackMatch[1], parsedUrl);
  }

  sendJson(response, 404, { message: "존재하지 않는 소셜 로그인 API입니다." });
  return true;
}

module.exports = {
  handleOAuthRequest,
};
