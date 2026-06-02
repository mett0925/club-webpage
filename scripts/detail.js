const detailCard = document.querySelector("#clubDetail");
const detailError = document.querySelector("#detailError");
const detailCategory = document.querySelector("[data-detail-category]");
const detailTitle = document.querySelector("[data-detail-title]");
const detailDescription = document.querySelector("[data-detail-description]");
const detailBody = document.querySelector("[data-detail-body]");
const detailBullets = document.querySelector("[data-detail-bullets]");
const detailTarget = document.querySelector("[data-detail-target]");
const detailTime = document.querySelector("[data-detail-time]");
const detailCapacity = document.querySelector("[data-detail-capacity]");
const detailDeadline = document.querySelector("[data-detail-deadline]");
const detailDeadlineChip = document.querySelector("[data-detail-deadline-chip]");
const detailApplyButtons = document.querySelectorAll("[data-detail-apply]");

async function detailRequestJson(url) {
  const response = await fetch(url, { credentials: "same-origin" });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || "요청 처리 중 문제가 발생했습니다.");
  }

  return payload;
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

function getDeadlineText(post) {
  if (post.deadlineText) {
    return post.deadlineText;
  }

  if (!post.deadlineDate) {
    return "-";
  }

  return new Date(post.deadlineDate).toLocaleDateString("ko-KR");
}

function renderDetail(post) {
  detailError.hidden = true;
  detailCard.hidden = false;
  detailCategory.textContent = getCategoryLabel(post.category);
  detailTitle.textContent = `${post.clubName} 모집 공고`;
  detailDescription.textContent = post.description;
  detailBody.textContent = post.body || post.description;
  detailTarget.textContent = post.targetText;
  detailTime.textContent = post.activityTime;
  detailCapacity.textContent = post.capacity;
  detailDeadline.textContent = getDeadlineText(post);
  detailDeadlineChip.textContent = getDeadlineText(post);
  detailApplyButtons.forEach((button) => {
    button.href = `apply.html?club=${encodeURIComponent(post.clubName)}`;
  });
  detailBullets.innerHTML = "";

  [
    `활동요일: ${post.activityDays || "-"}`,
    "지원서를 제출하면 모집 담당자가 마이페이지에서 확인합니다.",
    "활동 가능 시간과 지원 동기를 구체적으로 작성하면 선발에 도움이 됩니다.",
  ].forEach((text) => {
    const item = document.createElement("li");
    item.textContent = text;
    detailBullets.appendChild(item);
  });
}

async function loadDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  try {
    if (!id) {
      throw new Error("공고를 찾을 수 없습니다.");
    }

    const { post } = await detailRequestJson(`/api/club-posts?id=${encodeURIComponent(id)}`);
    renderDetail(post);
  } catch (error) {
    detailCard.hidden = true;
    detailError.hidden = false;
  }
}

loadDetail();
