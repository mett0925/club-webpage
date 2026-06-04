function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    studentId: user.studentId,
    email: user.email,
    birthDate: user.birthDate,
  };
}

function normalizeSignupInput(input) {
  const {
    name = "",
    email = "",
    verificationCode = "",
    birthDate = "",
    studentId = "",
    password = "",
    passwordConfirm = "",
  } = input;

  return {
    name: String(name).trim(),
    email: normalizeEmail(email),
    verificationCode: String(verificationCode).trim(),
    birthDate: String(birthDate).trim(),
    studentId: String(studentId).trim(),
    password: String(password),
    passwordConfirm: String(passwordConfirm),
  };
}

function normalizeProfileInput(input) {
  return normalizeSignupInput(input);
}

function isValidBirthDate(birthDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return false;
  }

  const [year, month, day] = birthDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function validateProfileInput(name, email, birthDate, studentId, password = "", passwordConfirm = "") {
  if (!name || !email || !birthDate || !studentId) {
    return "이름, 이메일, 생년월일, 학번을 모두 입력해주세요.";
  }

  if (!isValidEmail(email)) {
    return "올바른 이메일 주소를 입력해주세요.";
  }

  if (!isValidBirthDate(birthDate)) {
    return "생년월일을 올바르게 입력해주세요.";
  }

  if (!/^\d{4,12}$/.test(studentId)) {
    return "학번은 숫자 4~12자리로 입력해주세요.";
  }

  if ((password || passwordConfirm) && password !== passwordConfirm) {
    return "새 비밀번호와 비밀번호 확인이 일치하지 않습니다.";
  }

  if (password && password.length < 6) {
    return "새 비밀번호는 6자 이상이어야 합니다.";
  }

  return "";
}

function validateCredentials(name, email, birthDate, studentId, password, passwordConfirm) {
  if (!name || !email || !birthDate || !studentId || !password || !passwordConfirm) {
    return "이름, 이메일, 생년월일, 학번, 비밀번호를 모두 입력해주세요.";
  }

  if (!isValidEmail(email)) {
    return "올바른 이메일 주소를 입력해주세요.";
  }

  if (!isValidBirthDate(birthDate)) {
    return "생년월일을 올바르게 입력해주세요.";
  }

  if (!/^\d{4,12}$/.test(studentId)) {
    return "학번은 숫자 4~12자리로 입력해주세요.";
  }

  if (password !== passwordConfirm) {
    return "비밀번호와 비밀번호 확인이 일치하지 않습니다.";
  }

  if (password.length < 6) {
    return "비밀번호는 6자 이상이어야 합니다.";
  }

  return "";
}

module.exports = {
  isValidEmail,
  normalizeEmail,
  toPublicUser,
  normalizeSignupInput,
  normalizeProfileInput,
  validateProfileInput,
  validateCredentials,
};
