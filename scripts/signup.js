const signupForm = document.querySelector("#signupForm");
const signupMessage = document.querySelector("#signupMessage");
const loginLink = document.querySelector("#loginLink");
const emailInput = document.querySelector("#emailInput");
const sendCodeButton = document.querySelector("#sendCodeButton");
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
  const contentType = response.headers.get("Content-Type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : { message: "서버가 API 응답 대신 HTML을 반환했습니다. 최신 서버 주소로 접속했는지 확인해주세요." };

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

loginLink.href = `login.html?return=${encodeURIComponent(returnUrl)}`;

sendCodeButton.addEventListener("click", async () => {
  const email = emailInput.value.trim();

  setMessage(signupMessage, "");

  if (!email) {
    setMessage(signupMessage, "이메일을 먼저 입력해주세요.", true);
    emailInput.focus();
    return;
  }

  sendCodeButton.disabled = true;
  sendCodeButton.textContent = "발송 중...";

  try {
    const payload = await requestJson("/api/send-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    setMessage(signupMessage, payload.message);
  } catch (error) {
    setMessage(signupMessage, error.message, true);
  } finally {
    sendCodeButton.disabled = false;
    sendCodeButton.textContent = "인증번호 받기";
  }
});

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(signupMessage, "");

  const formData = new FormData(signupForm);

  try {
    const payload = await requestJson("/api/signup", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData)),
    });

    setMessage(signupMessage, `${payload.message} 메인 페이지로 이동합니다.`);
    setTimeout(moveToReturnPage, 700);
  } catch (error) {
    setMessage(signupMessage, error.message, true);
  }
});
