const headerAuthUser = document.querySelector("[data-auth-user]");
const headerLoginLink = document.querySelector("[data-auth-login-link]");
const headerLogoutButton = document.querySelector("[data-auth-logout]");

async function headerRequestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "same-origin",
    ...options,
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || "요청 처리 중 문제가 발생했습니다.");
  }

  return payload;
}

function renderHeaderAuth(user) {
  if (headerAuthUser) {
    headerAuthUser.hidden = !user;
    headerAuthUser.textContent = user ? `${user.name}님` : "";
  }

  if (headerLoginLink) {
    headerLoginLink.hidden = Boolean(user);
  }

  if (headerLogoutButton) {
    headerLogoutButton.hidden = !user;
  }
}

async function loadHeaderAuth() {
  try {
    const { user } = await headerRequestJson("/api/me");
    renderHeaderAuth(user);
  } catch (error) {
    renderHeaderAuth(null);
  }
}

if (headerLogoutButton) {
  headerLogoutButton.addEventListener("click", async () => {
    try {
      await headerRequestJson("/api/logout", { method: "POST" });
    } finally {
      renderHeaderAuth(null);
    }
  });
}

loadHeaderAuth();
