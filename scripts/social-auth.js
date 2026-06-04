const socialLoginSections = document.querySelectorAll("[data-social-login-section]");
const socialLoginButtons = document.querySelectorAll("[data-social-login]");

async function loadSocialLoginProviders() {
  if (socialLoginSections.length === 0) {
    return;
  }

  try {
    const response = await fetch("/api/auth/providers", { credentials: "same-origin" });
    const payload = await response.json();
    const providers = Array.isArray(payload.providers) ? payload.providers : [];
    const returnUrl = new URLSearchParams(window.location.search).get("return") || "index.html";

    socialLoginButtons.forEach((button) => {
      const providerKey = button.dataset.socialLogin;
      const provider = providers.find((item) => item.key === providerKey);
      const isEnabled = Boolean(provider);

      button.hidden = !isEnabled;
      button.disabled = !isEnabled;

      if (!isEnabled) {
        return;
      }

      button.addEventListener("click", () => {
        window.location.href = `/api/auth/${providerKey}?return=${encodeURIComponent(returnUrl)}`;
      });
    });

    socialLoginSections.forEach((section) => {
      section.hidden = providers.length === 0;
    });
  } catch (error) {
    socialLoginSections.forEach((section) => {
      section.hidden = true;
    });
  }
}

loadSocialLoginProviders();
