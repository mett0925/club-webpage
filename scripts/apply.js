const applicationContent = document.querySelector("#applicationContent");
const applicationGuard = document.querySelector("#applicationGuard");
const applicationLoginLink = document.querySelector("#applicationLoginLink");
const applicationForm = document.querySelector("#applicationForm");
const applicationMessage = document.querySelector("#applicationMessage");
const applicationClubSelect = document.querySelector("#applicationClubSelect");
const applicationUserName = document.querySelector("[data-application-user-name]");
const applicationUserMeta = document.querySelector("[data-application-user-meta]");

async function applicationRequestJson(url, options = {}) {
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

function setApplicationMessage(message, isError = false) {
  applicationMessage.textContent = message;
  applicationMessage.classList.toggle("is-error", isError);
}

function fillClubFromUrl() {
  const clubName = new URLSearchParams(window.location.search).get("club");

  if (clubName) {
    const hasOption = [...applicationClubSelect.options].some((option) => option.value === clubName);

    if (!hasOption) {
      applicationClubSelect.add(new Option(clubName, clubName));
    }

    applicationClubSelect.value = clubName;
  }
}

function showLoginGuard() {
  applicationContent.hidden = true;
  applicationGuard.hidden = false;
  applicationLoginLink.href = `login.html?return=${encodeURIComponent(window.location.pathname + window.location.search)}`;
}

async function loadApplicationUser() {
  try {
    const { user } = await applicationRequestJson("/api/me");

    if (!user) {
      showLoginGuard();
      return;
    }

    applicationGuard.hidden = true;
    applicationContent.hidden = false;
    applicationUserName.textContent = `${user.name}님`;
    applicationUserMeta.textContent = `학번 ${user.studentId} · ${user.email || "이메일 정보 없음"}`;
  } catch (error) {
    showLoginGuard();
  }
}

applicationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setApplicationMessage("");

  const formData = new FormData(applicationForm);

  try {
    const payload = await applicationRequestJson("/api/applications", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData)),
    });

    setApplicationMessage(payload.message);
    applicationForm.reset();
    fillClubFromUrl();
  } catch (error) {
    setApplicationMessage(error.message, true);
  }
});

fillClubFromUrl();
loadApplicationUser();
