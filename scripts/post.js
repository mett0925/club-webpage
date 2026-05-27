const postContent = document.querySelector("#postContent");
const postGuard = document.querySelector("#postGuard");
const clubPostForm = document.querySelector("#clubPostForm");
const clubPostMessage = document.querySelector("#clubPostMessage");

async function postRequestJson(url, options = {}) {
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

async function loadPostPage() {
  try {
    const { user } = await postRequestJson("/api/me");

    if (!user) {
      postContent.hidden = true;
      postGuard.hidden = false;
      return;
    }

    postGuard.hidden = true;
    postContent.hidden = false;
  } catch (error) {
    postContent.hidden = true;
    postGuard.hidden = false;
  }
}

clubPostForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clubPostMessage.textContent = "";
  clubPostMessage.classList.remove("is-error");

  const formData = new FormData(clubPostForm);

  try {
    const payload = await postRequestJson("/api/club-posts", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData)),
    });

    clubPostMessage.textContent = `${payload.message} 모집 공고 페이지로 이동합니다.`;
    clubPostForm.reset();
    setTimeout(() => {
      window.location.href = "clubs.html";
    }, 700);
  } catch (error) {
    clubPostMessage.textContent = error.message;
    clubPostMessage.classList.add("is-error");
  }
});

loadPostPage();
