const VALID_CATEGORIES = ["study", "culture", "sports", "volunteer", "performance", "startup", "media", "religion"];

function normalizeClubPostInput(input) {
  const {
    clubName = "",
    category = "",
    description = "",
    targetText = "",
    activityTime = "",
    activityDays = "",
    capacity = "",
    deadlineDate = "",
  } = input;
  const post = {
    clubName: String(clubName).trim(),
    category: String(category).trim(),
    description: String(description).trim(),
    targetText: String(targetText).trim(),
    activityTime: String(activityTime).trim(),
    activityDays: String(activityDays).trim(),
    capacity: String(capacity).trim(),
    deadlineDate: String(deadlineDate).trim(),
  };

  if (
    !post.clubName ||
    !post.category ||
    !post.description ||
    !post.targetText ||
    !post.activityTime ||
    !post.activityDays ||
    !post.capacity ||
    !post.deadlineDate
  ) {
    return { error: "모집 공고 내용을 모두 입력해주세요." };
  }

  if (!VALID_CATEGORIES.includes(post.category)) {
    return { error: "분야를 올바르게 선택해주세요." };
  }

  return { post };
}

module.exports = {
  normalizeClubPostInput,
};
