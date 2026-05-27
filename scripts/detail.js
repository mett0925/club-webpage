const staticPosts = {
  CodeMate: {
    clubName: "CodeMate",
    category: "학술",
    description: "프론트엔드, 백엔드, 디자인 팀이 함께 캠퍼스 서비스를 만드는 개발 동아리입니다.",
    targetText: "개발 입문자부터 프로젝트 경험자까지",
    activityTime: "목요일 18:30, 공학관 세미나실",
    activityDays: "목",
    capacity: "15명",
    deadlineText: "~ 6/12",
    body: "CodeMate는 웹 서비스를 직접 기획하고 개발하며 실전 프로젝트 경험을 쌓는 동아리입니다. 신입 부원은 Git, HTML/CSS, JavaScript, React 기초 세션부터 시작하고, 이후 팀 프로젝트에 참여합니다.",
  },
  Frame: {
    clubName: "Frame",
    category: "문화",
    description: "사진 촬영, 전시 기획, 포토워크를 함께하는 시각예술 동아리입니다.",
    targetText: "카메라가 없어도 사진에 관심 있는 학생",
    activityTime: "수요일 19:00, 학생회관",
    activityDays: "수",
    capacity: "12명",
    deadlineText: "~ 6/9",
    body: "Frame은 캠퍼스 출사, 사진 보정 스터디, 학기 말 전시를 함께 준비합니다. 장비보다 사진을 좋아하는 마음과 꾸준한 참여를 중요하게 봅니다.",
  },
  RunWave: {
    clubName: "RunWave",
    category: "운동",
    description: "초보자도 함께 달릴 수 있는 러닝 크루형 운동 동아리입니다.",
    targetText: "5km 완주를 목표로 하는 누구나",
    activityTime: "화/토 20:00, 대운동장",
    activityDays: "화 토",
    capacity: "20명",
    deadlineText: "~ 6/6",
    body: "RunWave는 러닝을 처음 시작하는 학생도 함께할 수 있도록 페이스별 그룹을 운영합니다. 학기 중 5km 완주 프로그램과 캠퍼스 러닝 이벤트를 진행합니다.",
  },
  "Warm Hand": {
    clubName: "Warm Hand",
    category: "봉사",
    description: "지역 아동센터 학습 멘토링과 캠퍼스 나눔 캠페인을 운영합니다.",
    targetText: "꾸준한 봉사 활동이 가능한 재학생",
    activityTime: "격주 토요일 10:00",
    activityDays: "토",
    capacity: "18명",
    deadlineText: "~ 6/15",
    body: "Warm Hand는 지역 아동센터 멘토링과 교내 나눔 캠페인을 진행하는 봉사 동아리입니다. 책임감 있게 장기 활동할 수 있는 부원을 기다립니다.",
  },
  BizLab: {
    clubName: "BizLab",
    category: "학술",
    description: "창업 아이디어 검증, IR 피칭, 공모전 준비를 함께하는 비즈니스 동아리입니다.",
    targetText: "창업과 마케팅에 관심 있는 학생",
    activityTime: "월요일 18:00, 경영관",
    activityDays: "월",
    capacity: "10명",
    deadlineText: "~ 6/18",
    body: "BizLab은 문제 발견부터 아이디어 검증, 시장 조사, 피칭까지 창업 과정을 함께 실습합니다. 공모전과 교내 창업 프로그램 참가도 지원합니다.",
  },
  "Stage On": {
    clubName: "Stage On",
    category: "문화",
    description: "보컬, 밴드, 음향 스태프가 함께 정기 공연을 준비하는 공연 동아리입니다.",
    targetText: "공연 무대와 음악을 좋아하는 학생",
    activityTime: "금요일 18:30, 소강당",
    activityDays: "금",
    capacity: "16명",
    deadlineText: "~ 6/20",
    body: "Stage On은 보컬, 악기, 음향, 기획 파트가 함께 공연을 만듭니다. 무대 경험이 없어도 연습과 합주에 꾸준히 참여할 수 있다면 환영합니다.",
  },
  "Court Mate": {
    clubName: "Court Mate",
    category: "운동",
    description: "농구 기초 훈련과 교내 리그 참가를 목표로 하는 스포츠 동아리입니다.",
    targetText: "농구 초보와 경험자 모두 가능",
    activityTime: "수/일 19:30, 체육관",
    activityDays: "수 일",
    capacity: "14명",
    deadlineText: "~ 6/14",
    body: "Court Mate는 기본기 훈련, 팀 전술 연습, 교내 리그 참가를 함께합니다. 실력보다 팀워크와 꾸준한 참여를 중요하게 생각합니다.",
  },
  "Green Campus": {
    clubName: "Green Campus",
    category: "봉사",
    description: "캠퍼스 플로깅, 분리배출 캠페인, 환경 콘텐츠 제작을 진행합니다.",
    targetText: "환경 문제 해결에 관심 있는 학생",
    activityTime: "격주 목요일 17:00",
    activityDays: "목",
    capacity: "20명",
    deadlineText: "~ 6/22",
    body: "Green Campus는 캠퍼스 안의 환경 문제를 직접 발견하고 개선 캠페인을 만드는 동아리입니다. 플로깅과 환경 콘텐츠 제작 활동을 진행합니다.",
  },
};

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
  const club = params.get("club");

  try {
    if (id) {
      const { post } = await detailRequestJson(`/api/club-posts?id=${encodeURIComponent(id)}`);
      renderDetail(post);
      return;
    }

    if (club && staticPosts[club]) {
      renderDetail(staticPosts[club]);
      return;
    }

    throw new Error("공고를 찾을 수 없습니다.");
  } catch (error) {
    detailCard.hidden = true;
    detailError.hidden = false;
  }
}

loadDetail();
