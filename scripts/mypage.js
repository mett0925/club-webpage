const mypageContent = document.querySelector("#mypageContent");
const mypageGuard = document.querySelector("#mypageGuard");
const profileInitial = document.querySelector("[data-profile-initial]");
const profileName = document.querySelector("[data-profile-name]");
const profileEmail = document.querySelector("[data-profile-email]");
const profileNameDetail = document.querySelector("[data-profile-name-detail]");
const profileStudentId = document.querySelector("[data-profile-student-id]");
const profileEmailDetail = document.querySelector("[data-profile-email-detail]");
const profileBirthDate = document.querySelector("[data-profile-birth-date]");
const mypageLogoutButton = document.querySelector("[data-auth-logout]");
const showMyApplicationsButton = document.querySelector("#showMyApplicationsButton");
const showMyPostsButton = document.querySelector("#showMyPostsButton");
const myPostsSection = document.querySelector("#myPostsSection");
const myPostsList = document.querySelector("#myPostsList");
const myPostsEmpty = document.querySelector("#myPostsEmpty");
const myApplicationsSection = document.querySelector("#myApplicationsSection");
const myApplicationsList = document.querySelector("#myApplicationsList");
const myApplicationsEmpty = document.querySelector("#myApplicationsEmpty");
const receivedApplicationsSection = document.querySelector("#receivedApplicationsSection");
const receivedApplicationsList = document.querySelector("#receivedApplicationsList");
const receivedApplicationsEmpty = document.querySelector("#receivedApplicationsEmpty");
const managedClubText = document.querySelector("#managedClubText");

async function mypageRequestJson(url, options = {}) {
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

function showGuard() {
  mypageContent.hidden = true;
  myPostsSection.hidden = true;
  myApplicationsSection.hidden = true;
  receivedApplicationsSection.hidden = true;
  mypageGuard.hidden = false;
}

function renderProfile(user) {
  if (!user) {
    showGuard();
    return;
  }

  const email = user.email || "이메일 정보 없음";

  mypageGuard.hidden = true;
  mypageContent.hidden = false;
  profileInitial.textContent = user.name ? user.name.slice(0, 1) : "U";
  profileName.textContent = `${user.name}님`;
  profileEmail.textContent = email;
  profileNameDetail.textContent = user.name || "-";
  profileStudentId.textContent = user.studentId || "-";
  profileEmailDetail.textContent = email;
  profileBirthDate.textContent = user.birthDate ? user.birthDate.slice(0, 10) : "-";
  loadMyClubPosts();
  loadReceivedApplications();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDateInputValue(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
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

function renderReceivedApplications(managedClubNames, applications) {
  receivedApplicationsSection.hidden = false;
  managedClubText.textContent = managedClubNames.length > 0
    ? `담당 동아리: ${managedClubNames.join(", ")}`
    : "담당 동아리가 설정되지 않았습니다.";
  receivedApplicationsList.innerHTML = "";
  receivedApplicationsEmpty.classList.toggle("is-visible", applications.length === 0);

  applications.forEach((application) => {
    const item = document.createElement("article");
    item.className = "received-card";
    item.innerHTML = `
      <div class="card-top">
        <span class="badge">${escapeHtml(application.clubName)}</span>
        <span class="deadline">${escapeHtml(new Date(application.createdAt).toLocaleDateString("ko-KR"))}</span>
      </div>
      <h3>${escapeHtml(application.applicantName)}</h3>
      <dl>
        <div><dt>학번</dt><dd>${escapeHtml(application.applicantStudentId)}</dd></div>
        <div><dt>연락처</dt><dd>${escapeHtml(application.phone)}</dd></div>
      </dl>
      <p>${escapeHtml(application.motivation)}</p>
    `;
    receivedApplicationsList.appendChild(item);
  });
}

function renderMyClubPosts(posts) {
  myPostsSection.hidden = false;
  myPostsList.innerHTML = "";
  myPostsEmpty.classList.toggle("is-visible", posts.length === 0);

  posts.forEach((post) => {
    const item = document.createElement("article");
    item.className = "received-card managed-post-card";
    item.dataset.postId = post.id;
    item.innerHTML = `
      <div class="card-top">
        <span class="badge">${escapeHtml(getCategoryLabel(post.category))}</span>
        <span class="deadline">마감 ${escapeHtml(formatDateInputValue(post.deadlineDate))}</span>
      </div>
      <h3>${escapeHtml(post.clubName)}</h3>
      <dl>
        <div><dt>모집 대상</dt><dd>${escapeHtml(post.targetText)}</dd></div>
        <div><dt>활동 시간</dt><dd>${escapeHtml(post.activityTime)}</dd></div>
        <div><dt>활동요일</dt><dd>${escapeHtml(post.activityDays)}</dd></div>
        <div><dt>모집 인원</dt><dd>${escapeHtml(post.capacity)}</dd></div>
      </dl>
      <p>${escapeHtml(post.description)}</p>
      <div class="managed-post-actions">
        <button class="secondary-button" type="button" data-edit-post>수정</button>
        <button class="secondary-button danger-button" type="button" data-delete-post>삭제</button>
      </div>
      <form class="post-form managed-post-form" data-edit-post-form hidden>
        <label>
          동아리명
          <input type="text" name="clubName" value="${escapeHtml(post.clubName)}" required>
        </label>
        <label>
          분야
          <select name="category" required>
            <option value="study" ${post.category === "study" ? "selected" : ""}>학술</option>
            <option value="culture" ${post.category === "culture" ? "selected" : ""}>문화</option>
            <option value="sports" ${post.category === "sports" ? "selected" : ""}>운동</option>
            <option value="volunteer" ${post.category === "volunteer" ? "selected" : ""}>봉사</option>
            <option value="performance" ${post.category === "performance" ? "selected" : ""}>공연</option>
            <option value="startup" ${post.category === "startup" ? "selected" : ""}>창업</option>
            <option value="media" ${post.category === "media" ? "selected" : ""}>미디어</option>
            <option value="religion" ${post.category === "religion" ? "selected" : ""}>종교</option>
          </select>
        </label>
        <label>
          모집 대상
          <input type="text" name="targetText" value="${escapeHtml(post.targetText)}" required>
        </label>
        <label>
          활동 시간
          <input type="text" name="activityTime" value="${escapeHtml(post.activityTime)}" required>
        </label>
        <label>
          활동요일
          <input type="text" name="activityDays" value="${escapeHtml(post.activityDays)}" required>
        </label>
        <label>
          모집 인원
          <input type="text" name="capacity" value="${escapeHtml(post.capacity)}" required>
        </label>
        <label>
          마감일
          <input type="date" name="deadlineDate" value="${escapeHtml(formatDateInputValue(post.deadlineDate))}" required>
        </label>
        <label class="full">
          모집 소개
          <textarea name="description" rows="4" required>${escapeHtml(post.description)}</textarea>
        </label>
        <button class="primary-button full" type="submit">수정 저장</button>
        <p class="form-message full" data-edit-post-message role="status"></p>
      </form>
    `;
    myPostsList.appendChild(item);
  });
}

async function loadMyClubPosts({ shouldScroll = false } = {}) {
  try {
    const { posts } = await mypageRequestJson("/api/club-posts/mine");
    renderMyClubPosts(posts);
    if (shouldScroll) {
      myPostsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (error) {
    myPostsSection.hidden = false;
    myPostsList.innerHTML = "";
    myPostsEmpty.textContent = "내 모집 공고를 불러오지 못했습니다.";
    myPostsEmpty.classList.add("is-visible");
  }
}

function renderMyApplications(applications) {
  myApplicationsSection.hidden = false;
  myApplicationsList.innerHTML = "";
  myApplicationsEmpty.classList.toggle("is-visible", applications.length === 0);

  applications.forEach((application) => {
    const item = document.createElement("article");
    item.className = "received-card managed-application-card";
    item.dataset.applicationId = application.id;
    item.innerHTML = `
      <div class="card-top">
        <span class="badge">${escapeHtml(application.clubName)}</span>
        <span class="deadline">${escapeHtml(new Date(application.createdAt).toLocaleDateString("ko-KR"))}</span>
      </div>
      <h3>${escapeHtml(application.clubName)}</h3>
      <dl>
        <div><dt>연락처</dt><dd>${escapeHtml(application.phone)}</dd></div>
        <div><dt>상태</dt><dd>제출 완료</dd></div>
      </dl>
      <p>${escapeHtml(application.motivation)}</p>
      <div class="managed-post-actions">
        <button class="secondary-button" type="button" data-edit-application>수정</button>
        <button class="secondary-button danger-button" type="button" data-delete-application>삭제</button>
      </div>
      <form class="post-form managed-post-form" data-edit-application-form hidden>
        <label>
          동아리명
          <input type="text" name="clubName" value="${escapeHtml(application.clubName)}" required>
        </label>
        <label>
          연락처
          <input type="tel" name="phone" value="${escapeHtml(application.phone)}" required>
        </label>
        <label class="full">
          지원 동기
          <textarea name="motivation" rows="4" required>${escapeHtml(application.motivation)}</textarea>
        </label>
        <button class="primary-button full" type="submit">수정 저장</button>
        <p class="form-message full" data-edit-application-message role="status"></p>
      </form>
    `;
    myApplicationsList.appendChild(item);
  });
}

async function loadMyApplications() {
  try {
    const { applications } = await mypageRequestJson("/api/applications/mine");
    renderMyApplications(applications);
  } catch (error) {
    myApplicationsSection.hidden = false;
    myApplicationsList.innerHTML = "";
    myApplicationsEmpty.textContent = "내 지원서를 불러오지 못했습니다.";
    myApplicationsEmpty.classList.add("is-visible");
  }
}

async function loadReceivedApplications() {
  try {
    const { managedClubNames, applications } = await mypageRequestJson("/api/applications/received");
    renderReceivedApplications(managedClubNames, applications);
  } catch (error) {
    receivedApplicationsSection.hidden = true;
  }
}

async function loadProfile() {
  try {
    const { user } = await mypageRequestJson("/api/me");
    renderProfile(user);
  } catch (error) {
    showGuard();
  }
}

if (mypageLogoutButton) {
  mypageLogoutButton.addEventListener("click", showGuard);
}

showMyApplicationsButton.addEventListener("click", () => {
  if (myApplicationsSection.hidden) {
    loadMyApplications();
    return;
  }

  myApplicationsSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

myApplicationsList.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit-application]");
  const deleteButton = event.target.closest("[data-delete-application]");
  const card = event.target.closest("[data-application-id]");

  if (!card) {
    return;
  }

  if (editButton) {
    const form = card.querySelector("[data-edit-application-form]");
    form.hidden = !form.hidden;
    return;
  }

  if (deleteButton) {
    const confirmed = window.confirm("이 지원서를 삭제할까요?");

    if (!confirmed) {
      return;
    }

    try {
      await mypageRequestJson(`/api/applications/${encodeURIComponent(card.dataset.applicationId)}`, { method: "DELETE" });
      loadMyApplications();
      loadReceivedApplications();
    } catch (error) {
      window.alert(error.message);
    }
  }
});

myApplicationsList.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-edit-application-form]");

  if (!form) {
    return;
  }

  event.preventDefault();
  const card = form.closest("[data-application-id]");
  const message = form.querySelector("[data-edit-application-message]");
  message.textContent = "";
  message.classList.remove("is-error");

  try {
    const payload = await mypageRequestJson(`/api/applications/${encodeURIComponent(card.dataset.applicationId)}`, {
      method: "PUT",
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    message.textContent = payload.message;
    loadMyApplications();
    loadReceivedApplications();
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("is-error");
  }
});

showMyPostsButton.addEventListener("click", () => {
  if (myPostsSection.hidden) {
    loadMyClubPosts({ shouldScroll: true });
    return;
  }

  myPostsSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

myPostsList.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit-post]");
  const deleteButton = event.target.closest("[data-delete-post]");
  const card = event.target.closest("[data-post-id]");

  if (!card) {
    return;
  }

  if (editButton) {
    const form = card.querySelector("[data-edit-post-form]");
    form.hidden = !form.hidden;
    return;
  }

  if (deleteButton) {
    const confirmed = window.confirm("이 모집 공고를 삭제할까요?");

    if (!confirmed) {
      return;
    }

    try {
      await mypageRequestJson(`/api/club-posts/${encodeURIComponent(card.dataset.postId)}`, { method: "DELETE" });
      loadMyClubPosts();
      loadReceivedApplications();
    } catch (error) {
      window.alert(error.message);
    }
  }
});

myPostsList.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-edit-post-form]");

  if (!form) {
    return;
  }

  event.preventDefault();
  const card = form.closest("[data-post-id]");
  const message = form.querySelector("[data-edit-post-message]");
  message.textContent = "";
  message.classList.remove("is-error");

  try {
    const payload = await mypageRequestJson(`/api/club-posts/${encodeURIComponent(card.dataset.postId)}`, {
      method: "PUT",
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    message.textContent = payload.message;
    loadMyClubPosts();
    loadReceivedApplications();
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("is-error");
  }
});

loadProfile();
