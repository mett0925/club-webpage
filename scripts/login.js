const loginForm = document.querySelector("#loginForm");
const loginMessage = document.querySelector("#loginMessage");
const signupLink = document.querySelector("#signupLink");
const requestedReturnUrl = new URLSearchParams(window.location.search).get("return") || "index.html";
const returnUrl = requestedReturnUrl.startsWith("http") ? "index.html" : requestedReturnUrl;

async function requestJson(url, options = {}) {
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

function setMessage(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("is-error", isError);
}

function moveToReturnPage() {
  window.location.href = returnUrl;
}

document.querySelectorAll("[data-password-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const input = button.closest(".password-field").querySelector("input");
    const shouldShow = input.type === "password";

    input.type = shouldShow ? "text" : "password";
    button.textContent = shouldShow ? "🙈" : "👁";
    button.setAttribute("aria-label", shouldShow ? "비밀번호 숨기기" : "비밀번호 표시");
  });
});

signupLink.href = `signup.html?return=${encodeURIComponent(returnUrl)}`;

const loginQuery = new URLSearchParams(window.location.search);

if (loginQuery.get("reason") === "idle") {
  setMessage(loginMessage, "30분 동안 활동이 없어 자동으로 로그아웃되었습니다.", true);
}

const oauthError = loginQuery.get("oauthError");

if (oauthError) {
  setMessage(loginMessage, oauthError, true);
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(loginMessage, "");

  const formData = new FormData(loginForm);

  try {
    const payload = await requestJson("/api/login", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData)),
    });

    setMessage(loginMessage, `${payload.message} 메인 페이지로 이동합니다.`);
    setTimeout(moveToReturnPage, 500);
  } catch (error) {
    setMessage(loginMessage, error.message, true);
  }
});
