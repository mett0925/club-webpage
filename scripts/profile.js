const profileContent = document.querySelector("#profileContent");
const profileVerification = document.querySelector("#profileVerification");
const profileGuard = document.querySelector("#profileGuard");
const profileForm = document.querySelector("#profileForm");
const profileMessage = document.querySelector("#profileMessage");
const profileEmailInput = document.querySelector("#profileEmailInput");
const profileVerificationCodeInput = document.querySelector("#profileVerificationCodeInput");
const profileAccessSendCodeButton = document.querySelector("#profileAccessSendCodeButton");
const profileAccessVerifyButton = document.querySelector("#profileAccessVerifyButton");
const profileAccessCodeInput = document.querySelector("#profileAccessCodeInput");
const profileAccessMessage = document.querySelector("#profileAccessMessage");
const profileVerificationName = document.querySelector("[data-profile-verification-name]");
const profileVerificationEmail = document.querySelector("[data-profile-verification-email]");
let currentUser = null;

async function profileRequestJson(url, options = {}) {
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

function setProfileMessage(message, isError = false) {
  profileMessage.textContent = message;
  profileMessage.classList.toggle("is-error", isError);
}

function setProfileAccessMessage(message, isError = false) {
  profileAccessMessage.textContent = message;
  profileAccessMessage.classList.toggle("is-error", isError);
}

function showProfileGuard() {
  profileVerification.hidden = true;
  profileContent.hidden = true;
  profileGuard.hidden = false;
}

function showProfileVerification(user) {
  currentUser = user;
  profileGuard.hidden = true;
  profileContent.hidden = true;
  profileVerification.hidden = false;
  profileVerificationName.textContent = `${user.name}님`;
  profileVerificationEmail.textContent = user.email || "이메일 정보 없음";
}

function renderProfileForm(user) {
  if (!user) {
    showProfileGuard();
    return;
  }

  profileGuard.hidden = true;
  profileVerification.hidden = true;
  profileContent.hidden = false;
  profileForm.elements.name.value = user.name || "";
  profileForm.elements.email.value = user.email || "";
  profileForm.elements.birthDate.value = user.birthDate ? user.birthDate.slice(0, 10) : "";
  profileForm.elements.studentId.value = user.studentId || "";
}

async function loadProfile() {
  try {
    const { user } = await profileRequestJson("/api/me");
    if (!user) {
      showProfileGuard();
      return;
    }

    showProfileVerification(user);
  } catch (error) {
    showProfileGuard();
  }
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

profileAccessSendCodeButton.addEventListener("click", async () => {
  setProfileAccessMessage("");
  profileAccessSendCodeButton.disabled = true;
  profileAccessSendCodeButton.textContent = "발송 중...";

  try {
    const payload = await profileRequestJson("/api/send-profile-verification", {
      method: "POST",
      body: JSON.stringify({}),
    });
    setProfileAccessMessage(payload.message);
  } catch (error) {
    setProfileAccessMessage(error.message, true);
  } finally {
    profileAccessSendCodeButton.disabled = false;
    profileAccessSendCodeButton.textContent = "인증번호 받기";
  }
});

profileAccessVerifyButton.addEventListener("click", async () => {
  const verificationCode = profileAccessCodeInput.value.trim();

  setProfileAccessMessage("");

  if (!verificationCode) {
    setProfileAccessMessage("인증번호를 입력해주세요.", true);
    profileAccessCodeInput.focus();
    return;
  }

  try {
    const payload = await profileRequestJson("/api/verify-profile-access", {
      method: "POST",
      body: JSON.stringify({ verificationCode }),
    });
    setProfileAccessMessage(payload.message);
    profileVerificationCodeInput.value = verificationCode;
    renderProfileForm(currentUser);
  } catch (error) {
    setProfileAccessMessage(error.message, true);
  }
});

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setProfileMessage("");

  try {
    const formData = new FormData(profileForm);
    const password = formData.get("password");
    const passwordConfirm = formData.get("passwordConfirm");

    if ((password || passwordConfirm) && password !== passwordConfirm) {
      setProfileMessage("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.", true);
      return;
    }

    const payload = await profileRequestJson("/api/me", {
      method: "PUT",
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    setProfileMessage(payload.message);
    profileForm.elements.password.value = "";
    profileForm.elements.passwordConfirm.value = "";
  } catch (error) {
    setProfileMessage(error.message, true);
  }
});

loadProfile();
