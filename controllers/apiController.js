const crypto = require("crypto");
const { START_PORT } = require("../config/env");
const { sendJson, readRequestBody } = require("../utils/http");
const { verifyPassword, hashPassword } = require("../services/passwordService");
const {
  getSessionUser,
  updateSessionUser,
  createSession,
  clearSession,
} = require("../services/sessionService");
const {
  createVerificationCode,
  sendVerificationEmail,
  setEmailVerification,
  getEmailVerification,
  deleteEmailVerification,
} = require("../services/emailService");
const {
  findUserByStudentId,
  findUserByEmail,
  updateUserProfile,
  createUser,
} = require("../dao/userDao");
const {
  createClubPost,
  getClubPosts,
  getClubPostById,
  updateClubPost,
  deleteClubPost,
  getClubPostsByOwner,
  getManagedClubNames,
  getAvailableClubNames,
} = require("../dao/clubPostDao");
const {
  createApplication,
  getApplicationsByClubNames,
  getApplicationsByUserId,
  getApplicationCount,
  updateApplication,
  deleteApplication,
} = require("../dao/applicationDao");
const {
  isValidEmail,
  normalizeEmail,
  toPublicUser,
  normalizeSignupInput,
  normalizeProfileInput,
  validateProfileInput,
  validateCredentials,
} = require("../dto/userDto");
const { normalizeClubPostInput } = require("../dto/clubPostDto");
const { normalizeApplicationInput } = require("../dto/applicationDto");

async function sendVerificationResponse(response, email, successMessage) {
  const code = createVerificationCode();
  setEmailVerification(email, code);

  try {
    await sendVerificationEmail(email, code);
  } catch (error) {
    console.error("이메일 인증번호 발송 실패:", error.message);
    deleteEmailVerification(email);
    sendJson(response, 400, {
      message: "이메일 발송에 실패했습니다. SMTP 계정과 앱 비밀번호를 확인해주세요.",
    });
    return;
  }

  sendJson(response, 200, { message: successMessage });
}

function validateVerification(response, email, verificationCode, emptyMessage) {
  const verification = getEmailVerification(email);

  if (!verification || verification.expiresAt < Date.now()) {
    deleteEmailVerification(email);
    sendJson(response, 400, { message: emptyMessage });
    return false;
  }

  if (verification.code !== verificationCode) {
    sendJson(response, 400, { message: "이메일 인증번호가 올바르지 않습니다." });
    return false;
  }

  return true;
}

async function handleApiRequest(request, response, pathname) {
  try {
    if (request.method === "GET" && pathname === "/api/me") {
      const user = getSessionUser(request, response);

      sendJson(response, 200, { user });
      return true;
    }

    if (request.method === "POST" && pathname === "/api/send-profile-verification") {
      const user = getSessionUser(request, response);

      if (!user) {
        sendJson(response, 401, { message: "로그인이 필요합니다." });
        return true;
      }

      const normalizedEmail = normalizeEmail(user.email);

      if (!isValidEmail(normalizedEmail)) {
        sendJson(response, 400, { message: "현재 계정 이메일이 올바르지 않습니다." });
        return true;
      }

      await sendVerificationResponse(
        response,
        normalizedEmail,
        "현재 계정 이메일로 인증번호를 보냈습니다. 5분 안에 입력해주세요."
      );
      return true;
    }

    if (request.method === "POST" && pathname === "/api/verify-profile-access") {
      const user = getSessionUser(request, response);

      if (!user) {
        sendJson(response, 401, { message: "로그인이 필요합니다." });
        return true;
      }

      const { verificationCode = "" } = await readRequestBody(request);
      const normalizedEmail = normalizeEmail(user.email);
      const normalizedVerificationCode = String(verificationCode).trim();

      if (!validateVerification(response, normalizedEmail, normalizedVerificationCode, "이메일 인증번호를 먼저 받아주세요.")) {
        return true;
      }

      sendJson(response, 200, { message: "이메일 인증이 완료되었습니다." });
      return true;
    }

    if (request.method === "POST" && pathname === "/api/send-verification") {
      const { email = "" } = await readRequestBody(request);
      const normalizedEmail = normalizeEmail(email);

      if (!isValidEmail(normalizedEmail)) {
        sendJson(response, 400, { message: "올바른 이메일 주소를 입력해주세요." });
        return true;
      }

      const emailExists = await findUserByEmail(normalizedEmail);

      if (emailExists) {
        sendJson(response, 409, { message: "이미 가입된 이메일입니다." });
        return true;
      }

      await sendVerificationResponse(response, normalizedEmail, "인증번호를 이메일로 보냈습니다. 5분 안에 입력해주세요.");
      return true;
    }

    if (request.method === "POST" && pathname === "/api/signup") {
      const signupInput = normalizeSignupInput(await readRequestBody(request));
      const validationMessage = validateCredentials(
        signupInput.name,
        signupInput.email,
        signupInput.birthDate,
        signupInput.studentId,
        signupInput.password,
        signupInput.passwordConfirm
      );

      if (validationMessage) {
        sendJson(response, 400, { message: validationMessage });
        return true;
      }

      if (!validateVerification(response, signupInput.email, signupInput.verificationCode, "이메일 인증번호를 먼저 받아주세요.")) {
        return true;
      }

      const emailExists = await findUserByEmail(signupInput.email);

      if (emailExists) {
        sendJson(response, 409, { message: "이미 가입된 이메일입니다." });
        return true;
      }

      const exists = await findUserByStudentId(signupInput.studentId);

      if (exists) {
        sendJson(response, 409, { message: "이미 가입된 학번입니다." });
        return true;
      }

      const user = {
        id: crypto.randomUUID(),
        name: signupInput.name,
        email: signupInput.email,
        birthDate: signupInput.birthDate,
        studentId: signupInput.studentId,
        passwordHash: hashPassword(signupInput.password),
        createdAt: new Date().toISOString(),
      };

      await createUser(user);
      deleteEmailVerification(signupInput.email);

      const publicUser = toPublicUser(user);
      const sessionHeaders = createSession(publicUser);
      sendJson(response, 201, { user: publicUser, message: "회원가입이 완료되었습니다." }, sessionHeaders);
      return true;
    }

    if (request.method === "POST" && pathname === "/api/login") {
      const { studentId = "", password = "" } = await readRequestBody(request);
      const normalizedStudentId = String(studentId).trim();
      const normalizedPassword = String(password);
      const user = await findUserByStudentId(normalizedStudentId);

      if (!user) {
        sendJson(response, 401, { message: "학번 또는 비밀번호가 올바르지 않습니다." });
        return true;
      }

      if (!user.passwordHash) {
        sendJson(response, 401, { message: "이 계정은 소셜 로그인으로 접속해주세요." });
        return true;
      }

      if (!verifyPassword(normalizedPassword, user.passwordHash)) {
        sendJson(response, 401, { message: "학번 또는 비밀번호가 올바르지 않습니다." });
        return true;
      }

      const publicUser = toPublicUser(user);
      const sessionHeaders = createSession(publicUser);
      sendJson(response, 200, { user: publicUser, message: "로그인되었습니다." }, sessionHeaders);
      return true;
    }

    if (request.method === "POST" && pathname === "/api/logout") {
      sendJson(response, 200, { message: "로그아웃되었습니다." }, clearSession(request));
      return true;
    }

    if (request.method === "PUT" && pathname === "/api/me") {
      const user = getSessionUser(request, response);

      if (!user) {
        sendJson(response, 401, { message: "로그인이 필요합니다." });
        return true;
      }

      const profileInput = normalizeProfileInput(await readRequestBody(request));
      const validationMessage = validateProfileInput(
        profileInput.name,
        profileInput.email,
        profileInput.birthDate,
        profileInput.studentId,
        profileInput.password,
        profileInput.passwordConfirm
      );

      if (validationMessage) {
        sendJson(response, 400, { message: validationMessage });
        return true;
      }

      const profileAccessEmail = normalizeEmail(user.email);

      if (!validateVerification(response, profileAccessEmail, profileInput.verificationCode, "회원정보 수정 페이지 입장 인증을 먼저 완료해주세요.")) {
        return true;
      }

      const emailExists = await findUserByEmail(profileInput.email);

      if (emailExists && emailExists.id !== user.id) {
        sendJson(response, 409, { message: "이미 다른 계정에서 사용 중인 이메일입니다." });
        return true;
      }

      const studentIdExists = await findUserByStudentId(profileInput.studentId);

      if (studentIdExists && studentIdExists.id !== user.id) {
        sendJson(response, 409, { message: "이미 다른 계정에서 사용 중인 학번입니다." });
        return true;
      }

      const updatedUser = await updateUserProfile(user.id, {
        name: profileInput.name,
        email: profileInput.email,
        birthDate: profileInput.birthDate,
        studentId: profileInput.studentId,
        password: profileInput.password,
      });
      const publicUser = toPublicUser(updatedUser);
      updateSessionUser(request, publicUser);
      deleteEmailVerification(profileAccessEmail);

      sendJson(response, 200, { user: publicUser, message: "회원정보가 수정되었습니다." });
      return true;
    }

    if (request.method === "GET" && pathname === "/api/club-posts/mine") {
      const user = getSessionUser(request, response);

      if (!user) {
        sendJson(response, 401, { message: "로그인이 필요합니다." });
        return true;
      }

      const posts = await getClubPostsByOwner(user.id, user.studentId);
      sendJson(response, 200, { posts });
      return true;
    }

    if (request.method === "GET" && pathname === "/api/club-posts") {
      const parsedUrl = new URL(request.url, `http://localhost:${START_PORT}`);
      const id = parsedUrl.searchParams.get("id");

      if (id) {
        const post = await getClubPostById(id);

        if (!post) {
          sendJson(response, 404, { message: "모집 공고를 찾을 수 없습니다." });
          return true;
        }

        sendJson(response, 200, { post });
        return true;
      }

      const posts = await getClubPosts();
      sendJson(response, 200, { posts });
      return true;
    }

    if (request.method === "POST" && pathname === "/api/club-posts") {
      const user = getSessionUser(request, response);

      if (!user) {
        sendJson(response, 401, { message: "로그인 후 모집 공고를 작성할 수 있습니다." });
        return true;
      }

      const { post: postInput, error } = normalizeClubPostInput(await readRequestBody(request));

      if (error) {
        sendJson(response, 400, { message: error });
        return true;
      }

      const post = {
        id: crypto.randomUUID(),
        ownerUserId: user.id,
        ownerStudentId: user.studentId,
        ...postInput,
      };

      await createClubPost(post);
      sendJson(response, 201, { post, message: "모집 공고가 등록되었습니다." });
      return true;
    }

    const clubPostMatch = pathname.match(/^\/api\/club-posts\/([^/]+)\/?$/);

    if ((request.method === "PUT" || request.method === "DELETE") && clubPostMatch) {
      const user = getSessionUser(request, response);

      if (!user) {
        sendJson(response, 401, { message: "로그인이 필요합니다." });
        return true;
      }

      const postId = decodeURIComponent(clubPostMatch[1]);

      if (request.method === "DELETE") {
        const deleted = await deleteClubPost(postId, user.id, user.studentId);

        if (!deleted) {
          sendJson(response, 404, { message: "삭제할 모집 공고를 찾을 수 없습니다." });
          return true;
        }

        sendJson(response, 200, { message: "모집 공고가 삭제되었습니다." });
        return true;
      }

      const { post: postInput, error } = normalizeClubPostInput(await readRequestBody(request));

      if (error) {
        sendJson(response, 400, { message: error });
        return true;
      }

      const updated = await updateClubPost(postId, user.id, user.studentId, postInput);

      if (!updated) {
        sendJson(response, 404, { message: "수정할 모집 공고를 찾을 수 없습니다." });
        return true;
      }

      const post = await getClubPostById(postId);
      sendJson(response, 200, { post, message: "모집 공고가 수정되었습니다." });
      return true;
    }

    if (request.method === "GET" && pathname === "/api/applications/count") {
      const count = await getApplicationCount();
      sendJson(response, 200, { count });
      return true;
    }

    if (request.method === "POST" && pathname === "/api/applications") {
      const user = getSessionUser(request, response);

      if (!user) {
        sendJson(response, 401, { message: "로그인 후 지원서를 제출할 수 있습니다." });
        return true;
      }

      const { application: applicationInput, error } = normalizeApplicationInput(await readRequestBody(request));

      if (error) {
        sendJson(response, 400, { message: error });
        return true;
      }

      const availableClubNames = await getAvailableClubNames();

      if (!availableClubNames.includes(applicationInput.clubName)) {
        sendJson(response, 400, { message: "지원할 동아리를 올바르게 선택해주세요." });
        return true;
      }

      const application = {
        id: crypto.randomUUID(),
        ...applicationInput,
        applicantUserId: user.id,
        applicantName: user.name,
        applicantStudentId: user.studentId,
      };

      await createApplication(application);
      sendJson(response, 201, { application, message: "지원서가 제출되었습니다." });
      return true;
    }

    if (request.method === "GET" && pathname === "/api/applications/received") {
      const user = getSessionUser(request, response);

      if (!user) {
        sendJson(response, 401, { message: "로그인이 필요합니다." });
        return true;
      }

      const managedClubNames = await getManagedClubNames(user);
      const applications = await getApplicationsByClubNames(managedClubNames);

      sendJson(response, 200, { managedClubNames, applications });
      return true;
    }

    if (request.method === "GET" && pathname === "/api/applications/mine") {
      const user = getSessionUser(request, response);

      if (!user) {
        sendJson(response, 401, { message: "로그인이 필요합니다." });
        return true;
      }

      const applications = await getApplicationsByUserId(user.id, user.studentId);
      sendJson(response, 200, { applications });
      return true;
    }

    const applicationMatch = pathname.match(/^\/api\/applications\/([^/]+)\/?$/);

    if ((request.method === "PUT" || request.method === "DELETE") && applicationMatch) {
      const user = getSessionUser(request, response);

      if (!user) {
        sendJson(response, 401, { message: "로그인이 필요합니다." });
        return true;
      }

      const applicationId = decodeURIComponent(applicationMatch[1]);

      if (request.method === "DELETE") {
        const deleted = await deleteApplication(applicationId, user.id, user.studentId);

        if (!deleted) {
          sendJson(response, 404, { message: "삭제할 지원서를 찾을 수 없습니다." });
          return true;
        }

        sendJson(response, 200, { message: "지원서가 삭제되었습니다." });
        return true;
      }

      const { application: applicationInput, error } = normalizeApplicationInput(await readRequestBody(request));

      if (error) {
        sendJson(response, 400, { message: error });
        return true;
      }

      const availableClubNames = await getAvailableClubNames();

      if (!availableClubNames.includes(applicationInput.clubName)) {
        sendJson(response, 400, { message: "지원할 동아리를 올바르게 선택해주세요." });
        return true;
      }

      const updated = await updateApplication(applicationId, user.id, user.studentId, applicationInput);

      if (!updated) {
        sendJson(response, 404, { message: "수정할 지원서를 찾을 수 없습니다." });
        return true;
      }

      sendJson(response, 200, { application: applicationInput, message: "지원서가 수정되었습니다." });
      return true;
    }

    sendJson(response, 404, { message: "존재하지 않는 API입니다." });
    return true;
  } catch (error) {
    sendJson(response, 400, { message: error.message || "요청 처리 중 문제가 발생했습니다." });
    return true;
  }
}

module.exports = {
  handleApiRequest,
};
