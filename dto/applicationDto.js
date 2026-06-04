function normalizeApplicationInput(input) {
  const { clubName = "", phone = "", motivation = "" } = input;
  const application = {
    clubName: String(clubName).trim(),
    phone: String(phone).trim(),
    motivation: String(motivation).trim(),
  };

  if (!application.clubName) {
    return { error: "지원할 동아리를 올바르게 선택해주세요." };
  }

  if (!application.phone || !application.motivation) {
    return { error: "연락처와 지원 동기를 입력해주세요." };
  }

  return { application };
}

module.exports = {
  normalizeApplicationInput,
};
