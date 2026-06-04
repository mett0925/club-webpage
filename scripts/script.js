const filterButtons = document.querySelectorAll(".filter-button");
const clubGrid = document.querySelector(".club-grid");
const clubSelect = document.querySelector("#clubSelect");
const applyForm = document.querySelector("#applyForm");
const formMessage = document.querySelector("#formMessage");
const authUser = document.querySelector("[data-auth-user]");
const authLoginLink = document.querySelector("[data-auth-login-link]");
const authLogoutButton = document.querySelector("[data-auth-logout]");
const recruitCountText = document.querySelector("#recruitCountText");
const homeApplicationCount = document.querySelector("#homeApplicationCount");
const homeRegisteredClubCount = document.querySelector("#homeRegisteredClubCount");
const homeRecruitSummaryCount = document.querySelector("#homeRecruitSummaryCount");
const homeRecruitEmpty = document.querySelector("#homeRecruitEmpty");
let currentUser = null;
let clubCards = document.querySelectorAll(".club-card");
let activeFilter = "all";

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

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getCategoryLabel(category) {
  const labels = {
    study: "학술",
    culture: "문화",
    sports: "운동",
    volunteer: "봉사",
    performance: "공연",
    startup: "창업",
    media: "미디어",
    religion: "종교",
  };

  return labels[category] || category;
}

function getDeadlineDays(deadlineDate) {
  const today = new Date();
  const deadline = new Date(deadlineDate);
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);

  return Math.max(0, Math.ceil((deadline - today) / (1000 * 60 * 60 * 24)));
}

function isActiveRecruitPost(post) {
  const today = new Date();
  const deadline = new Date(post.deadlineDate);
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  return deadline >= today;
}

function getRegisteredClubCount(posts) {
  return new Set(posts.map((post) => post.clubName)).size;
}

function getActiveRecruitCount(posts) {
  return posts.filter(isActiveRecruitPost).length;
}

function renderHomeStats(posts, applicationCount = 0) {
  const registeredCount = getRegisteredClubCount(posts);
  const activeRecruitCount = getActiveRecruitCount(posts);

  if (homeRegisteredClubCount) {
    homeRegisteredClubCount.textContent = String(registeredCount);
  }

  if (homeRecruitSummaryCount) {
    homeRecruitSummaryCount.textContent = String(activeRecruitCount);
  }

  if (homeApplicationCount) {
    homeApplicationCount.textContent = String(applicationCount);
  }

  if (recruitCountText) {
    recruitCountText.textContent = `현재 모집 중인 동아리 ${activeRecruitCount}개를 더 자세히 확인할 수 있어요.`;
  }
}

function renderHomeClubPost(post) {
  const deadlineDays = getDeadlineDays(post.deadlineDate);
  const article = document.createElement("article");
  article.className = "club-card";
  article.dataset.category = post.category;
  article.innerHTML = `
    <div class="card-top">
      <span class="badge">${escapeHtml(getCategoryLabel(post.category))}</span>
      <span class="deadline">D-${deadlineDays}</span>
    </div>
    <h3>${escapeHtml(post.clubName)}</h3>
    <p>${escapeHtml(post.description)}</p>
    <ul>
      <li>${escapeHtml(post.targetText)}</li>
      <li>${escapeHtml(post.activityTime)}</li>
    </ul>
    <button class="apply-button" type="button" data-club="${escapeHtml(post.clubName)}">지원하기</button>
  `;
  clubGrid.appendChild(article);
}

function applyHomeFilter() {
  clubCards.forEach((card) => {
    const shouldShow = activeFilter === "all" || card.dataset.category === activeFilter;
    card.classList.toggle("is-hidden", !shouldShow);
  });
}

async function loadRecruitPosts() {
  if (!clubGrid) {
    return;
  }

  try {
    const [{ posts }, { count }] = await Promise.all([
      requestJson("/api/club-posts"),
      requestJson("/api/applications/count"),
    ]);
    const activePosts = posts.filter(isActiveRecruitPost);

    clubGrid.innerHTML = "";
    activePosts.slice(0, 4).forEach(renderHomeClubPost);
    clubCards = document.querySelectorAll(".club-card");
    homeRecruitEmpty.classList.toggle("is-visible", activePosts.length === 0);
    renderHomeStats(posts, count);
    applyHomeFilter();
  } catch (error) {
    clubGrid.innerHTML = "";
    clubCards = document.querySelectorAll(".club-card");
    homeRecruitEmpty.textContent = "모집 공고를 불러오지 못했습니다.";
    homeRecruitEmpty.classList.add("is-visible");
    renderHomeStats([], 0);
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
    activeFilter = button.dataset.filter;

    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    applyHomeFilter();
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

if (clubGrid) {
  clubGrid.addEventListener("click", (event) => {
    const button = event.target.closest(".apply-button");

    if (!button) {
      return;
    }

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
}

const selectedClubFromUrl = new URLSearchParams(window.location.search).get("club");

if (selectedClubFromUrl) {
  ensureClubOption(selectedClubFromUrl);
  if (clubSelect) {
    clubSelect.value = selectedClubFromUrl;
  }
}

if (authLogoutButton) {
  authLogoutButton.addEventListener("click", async () => {
    if (!confirm("정말 로그아웃하시겠습니까?")) {
      return;
    }

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
loadRecruitPosts();
