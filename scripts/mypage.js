const mypageContent = document.querySelector("#mypageContent");
const mypageGuard = document.querySelector("#mypageGuard");
const profileInitial = document.querySelector("[data-profile-initial]");
const profileName = document.querySelector("[data-profile-name]");
const profileEmail = document.querySelector("[data-profile-email]");
const profileNameDetail = document.querySelector("[data-profile-name-detail]");
const profileStudentId = document.querySelector("[data-profile-student-id]");
const profileEmailDetail = document.querySelector("[data-profile-email-detail]");
const mypageLogoutButton = document.querySelector("[data-auth-logout]");
const showMyApplicationsButton = document.querySelector("#showMyApplicationsButton");
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

function renderMyApplications(applications) {
  myApplicationsSection.hidden = false;
  myApplicationsList.innerHTML = "";
  myApplicationsEmpty.classList.toggle("is-visible", applications.length === 0);

  applications.forEach((application) => {
    const item = document.createElement("article");
    item.className = "received-card";
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

showMyApplicationsButton.addEventListener("click", loadMyApplications);

loadProfile();
