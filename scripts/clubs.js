const searchInput = document.querySelector("#clubSearch");
const categoryFilter = document.querySelector("#categoryFilter");
const dayFilter = document.querySelector("#dayFilter");
const deadlineFilter = document.querySelector("#deadlineFilter");
const resetSearchButton = document.querySelector("#resetSearch");
const resultText = document.querySelector("#searchResultText");
const emptyMessage = document.querySelector("#emptySearchMessage");
const recruitDetailList = document.querySelector(".recruit-detail-list");
const recruitSummaryCount = document.querySelector("#recruitSummaryCount");
let recruitCards = document.querySelectorAll(".recruit-detail-card");
const authUser = document.querySelector("[data-auth-user]");
const authLoginLink = document.querySelector("[data-auth-login-link]");
const authLogoutButton = document.querySelector("[data-auth-logout]");

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

function renderAuthState(user) {
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
}

async function loadCurrentUser() {
  try {
    const { user } = await requestJson("/api/me");
    renderAuthState(user);
  } catch (error) {
    renderAuthState(null);
  }
}

function matchesDeadline(card, selectedDeadline) {
  const deadlineDay = Number(card.dataset.deadline);

  if (selectedDeadline === "soon") {
    return deadlineDay <= 10;
  }

  if (selectedDeadline === "open") {
    return deadlineDay > 10;
  }

  return true;
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

function renderClubPost(post) {
  const deadlineDays = getDeadlineDays(post.deadlineDate);
  const article = document.createElement("article");
  article.className = "recruit-detail-card";
  article.dataset.postId = post.id;
  article.dataset.club = post.clubName;
  article.dataset.category = post.category;
  article.dataset.days = post.activityDays;
  article.dataset.deadline = String(deadlineDays);
  article.innerHTML = `
    <div class="card-top">
      <span class="badge">${escapeHtml(getCategoryLabel(post.category))}</span>
      <span class="deadline">D-${deadlineDays}</span>
    </div>
    <h3>${escapeHtml(post.clubName)}</h3>
    <p>${escapeHtml(post.description)}</p>
    <dl>
      <div><dt>모집 대상</dt><dd>${escapeHtml(post.targetText)}</dd></div>
      <div><dt>활동 시간</dt><dd>${escapeHtml(post.activityTime)}</dd></div>
      <div><dt>모집 인원</dt><dd>${escapeHtml(post.capacity)}</dd></div>
    </dl>
    <a class="apply-button detail-apply-link" href="apply.html?club=${encodeURIComponent(post.clubName)}">지원하기</a>
  `;

  recruitDetailList.appendChild(article);
}

function attachCardNavigation() {
  document.querySelectorAll(".recruit-detail-card").forEach((card) => {
    if (card.dataset.navigationAttached) {
      return;
    }

    card.dataset.navigationAttached = "true";
    card.dataset.club = card.dataset.club || card.querySelector("h3")?.textContent.trim() || "";
    card.addEventListener("click", (event) => {
      if (event.target.closest("a, button")) {
        return;
      }

      const destination = card.dataset.postId
        ? `detail.html?id=${encodeURIComponent(card.dataset.postId)}`
        : `detail.html?club=${encodeURIComponent(card.dataset.club)}`;
      window.location.href = destination;
    });
  });
}

async function loadClubPosts() {
  try {
    const { posts } = await requestJson("/api/club-posts");
    recruitDetailList.innerHTML = "";
    posts.forEach(renderClubPost);
    recruitCards = document.querySelectorAll(".recruit-detail-card");
    recruitSummaryCount.textContent = String(posts.length);
    attachCardNavigation();
  } catch (error) {
    recruitDetailList.innerHTML = "";
    recruitCards = document.querySelectorAll(".recruit-detail-card");
    recruitSummaryCount.textContent = "0";
    attachCardNavigation();
  }
}

function applyRecruitFilters() {
  const keyword = searchInput.value.trim().toLowerCase();
  const selectedCategory = categoryFilter.value;
  const selectedDay = dayFilter.value;
  const selectedDeadline = deadlineFilter.value;
  let visibleCount = 0;

  recruitCards.forEach((card) => {
    const searchableText = card.textContent.toLowerCase();
    const matchesKeyword = !keyword || searchableText.includes(keyword);
    const matchesCategory = selectedCategory === "all" || card.dataset.category === selectedCategory;
    const matchesDay = selectedDay === "all" || card.dataset.days.includes(selectedDay);
    const shouldShow = matchesKeyword && matchesCategory && matchesDay && matchesDeadline(card, selectedDeadline);

    card.classList.toggle("is-hidden", !shouldShow);

    if (shouldShow) {
      visibleCount += 1;
    }
  });

  resultText.textContent = `총 ${visibleCount}개의 모집 공고가 검색되었습니다.`;
  emptyMessage.classList.toggle("is-visible", visibleCount === 0);
}

function resetRecruitFilters() {
  searchInput.value = "";
  categoryFilter.value = "all";
  dayFilter.value = "all";
  deadlineFilter.value = "all";
  applyRecruitFilters();
  searchInput.focus();
}

searchInput.addEventListener("input", applyRecruitFilters);
categoryFilter.addEventListener("change", applyRecruitFilters);
dayFilter.addEventListener("change", applyRecruitFilters);
deadlineFilter.addEventListener("change", applyRecruitFilters);
resetSearchButton.addEventListener("click", resetRecruitFilters);
authLogoutButton.addEventListener("click", async () => {
  try {
    await requestJson("/api/logout", { method: "POST" });
  } finally {
    renderAuthState(null);
  }
});

attachCardNavigation();
loadClubPosts().finally(applyRecruitFilters);
loadCurrentUser();
