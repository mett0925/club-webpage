const filterButtons = document.querySelectorAll(".filter-button");
const clubCards = document.querySelectorAll(".club-card");
const applyButtons = document.querySelectorAll(".apply-button");
const clubSelect = document.querySelector("#clubSelect");
const applyForm = document.querySelector("#applyForm");
const formMessage = document.querySelector("#formMessage");
const authUser = document.querySelector("[data-auth-user]");
const authLoginLink = document.querySelector("[data-auth-login-link]");
const authLogoutButton = document.querySelector("[data-auth-logout]");
const recruitCountText = document.querySelector("#recruitCountText");
let currentUser = null;

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
  if (!element) {
    return;
  }

  element.textContent = message;
  element.classList.toggle("is-error", isError);
}

function renderRecruitCount(count) {
  if (!recruitCountText) {
    return;
  }

  recruitCountText.textContent = `현재 모집 중인 동아리 ${count}개를 더 자세히 확인할 수 있어요.`;
}

async function loadRecruitCount() {
  if (!recruitCountText) {
    return;
  }

  const baseCount = Number(recruitCountText.dataset.baseCount) || 0;

  try {
    const { posts } = await requestJson("/api/club-posts");
    renderRecruitCount(baseCount + posts.length);
  } catch (error) {
    renderRecruitCount(baseCount);
  }
}

function fillApplyForm(user) {
  if (!user || !applyForm) {
    return;
  }

  const nameInput = applyForm.elements.name;
  const studentIdInput = applyForm.elements.studentId;

  if (nameInput && !nameInput.value) {
    nameInput.value = user.name;
  }

  if (studentIdInput && !studentIdInput.value) {
    studentIdInput.value = user.studentId;
  }
}

function renderAuthState(user) {
  currentUser = user;

  if (authUser) {
    authUser.hidden = !user;
    authUser.textContent = user ? `${user.name}님` : "";
  }

  if (authLoginLink) {
    authLoginLink.hidden = Boolean(user);
  }

  if (authLogoutButton) {
    authLogoutButton.hidden = !user;
  }

  fillApplyForm(user);
}

async function loadCurrentUser() {
  try {
    const { user } = await requestJson("/api/me");
    renderAuthState(user);
  } catch (error) {
    renderAuthState(null);
  }
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedFilter = button.dataset.filter;

    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    clubCards.forEach((card) => {
      const shouldShow = selectedFilter === "all" || card.dataset.category === selectedFilter;
      card.classList.toggle("is-hidden", !shouldShow);
    });
  });
});

function ensureClubOption(clubName) {
  if (!clubSelect) {
    return;
  }

  const hasOption = [...clubSelect.options].some((option) => option.value === clubName);

  if (!hasOption) {
    const option = new Option(clubName, clubName);
    clubSelect.add(option);
  }
}

applyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedClub = button.dataset.club;

    if (!clubSelect || !document.querySelector("#apply")) {
      window.location.href = `apply.html?club=${encodeURIComponent(selectedClub)}`;
      return;
    }

    ensureClubOption(selectedClub);
    clubSelect.value = selectedClub;
    document.querySelector("#apply").scrollIntoView({ behavior: "smooth", block: "start" });
    clubSelect.focus({ preventScroll: true });
  });
});

const selectedClubFromUrl = new URLSearchParams(window.location.search).get("club");

if (selectedClubFromUrl) {
  ensureClubOption(selectedClubFromUrl);
  if (clubSelect) {
    clubSelect.value = selectedClubFromUrl;
  }
}

if (authLogoutButton) {
  authLogoutButton.addEventListener("click", async () => {
    try {
      await requestJson("/api/logout", { method: "POST" });
    } finally {
      renderAuthState(null);
    }
  });
}

if (applyForm) {
  applyForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!currentUser) {
      const selectedClub = new FormData(applyForm).get("club");
      const returnTarget = selectedClub ? `index.html?club=${encodeURIComponent(selectedClub)}#apply` : "index.html#apply";

      formMessage.textContent = "로그인 후 가입 신청서를 제출할 수 있습니다.";
      formMessage.classList.add("is-error");
      window.location.href = `login.html?return=${encodeURIComponent(returnTarget)}`;
      return;
    }

    const formData = new FormData(applyForm);
    const applicantName = formData.get("name");
    const selectedClub = formData.get("club");

    formMessage.textContent = `${applicantName}님의 ${selectedClub} 가입 신청이 접수되었습니다.`;
    formMessage.classList.remove("is-error");
    applyForm.reset();
    fillApplyForm(currentUser);
  });
}

loadCurrentUser();
loadRecruitCount();
