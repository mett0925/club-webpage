const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const mysql = require("mysql2/promise");
const nodemailer = require("nodemailer");
const path = require("path");

function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      return;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim();

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  });
}

loadEnvFile();

const START_PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = __dirname;
const SESSION_COOKIE_NAME = "club_session";
const sessions = new Map();
const emailVerifications = new Map();
const DB_NAME = process.env.DB_NAME || "club_web_page";
const baseDbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
};
const poolDbConfig = {
  ...baseDbConfig,
  waitForConnections: true,
  connectionLimit: 10,
};
let dbPool;
let mailTransporter;
const CLUB_NAMES = ["CodeMate", "Frame", "RunWave", "Warm Hand", "BizLab", "Stage On", "Court Mate", "Green Campus"];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendJson(response, statusCode, payload, headers = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...headers,
  });
  response.end(JSON.stringify(payload));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function createVerificationCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function getMailTransporter() {
  if (mailTransporter) {
    return mailTransporter;
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  mailTransporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user,
      pass,
    },
  });

  return mailTransporter;
}

async function sendVerificationEmail(email, code) {
  const transporter = getMailTransporter();

  if (!transporter) {
    console.log(`[개발용 이메일 인증번호] ${email}: ${code}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: "동아리픽 회원가입 인증번호",
    text: `동아리픽 회원가입 인증번호는 ${code} 입니다. 5분 안에 입력해주세요.`,
  });
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > 1_000_000) {
        reject(new Error("요청 본문이 너무 큽니다."));
        request.destroy();
      }
    });

    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("올바른 JSON 형식이 아닙니다."));
      }
    });

    request.on("error", reject);
  });
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");

  return `${salt}:${hash}`;
}

function verifyPassword(password, passwordHash) {
  const [salt, storedHash] = passwordHash.split(":");

  if (!salt || !storedHash) {
    return false;
  }

  const candidateHash = hashPassword(password, salt).split(":")[1];
  return crypto.timingSafeEqual(Buffer.from(storedHash, "hex"), Buffer.from(candidateHash, "hex"));
}

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((cookies, cookie) => {
    const [name, ...valueParts] = cookie.trim().split("=");

    if (!name) {
      return cookies;
    }

    cookies[name] = decodeURIComponent(valueParts.join("="));
    return cookies;
  }, {});
}

function getSessionUser(request) {
  const cookies = parseCookies(request.headers.cookie);
  const sessionId = cookies[SESSION_COOKIE_NAME];

  if (!sessionId) {
    return null;
  }

  const session = sessions.get(sessionId);

  if (!session) {
    return null;
  }

  return session.user;
}

function createSession(response, user) {
  const sessionId = crypto.randomBytes(32).toString("hex");
  sessions.set(sessionId, { user, createdAt: Date.now() });

  return {
    "Set-Cookie": `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}; HttpOnly; Path=/; SameSite=Lax`,
  };
}

function clearSession(request) {
  const cookies = parseCookies(request.headers.cookie);
  const sessionId = cookies[SESSION_COOKIE_NAME];

  if (sessionId) {
    sessions.delete(sessionId);
  }

  return {
    "Set-Cookie": `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`,
  };
}

function getPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    studentId: user.studentId,
    email: user.email,
  };
}

function getClubEnvKey(clubName) {
  return `CLUB_OWNER_${clubName.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
}

function getClubOwnerStudentId(clubName) {
  return process.env[getClubEnvKey(clubName)] || process.env.DEFAULT_CLUB_OWNER_STUDENT_ID || "";
}

async function getDbPool() {
  if (dbPool) {
    return dbPool;
  }

  const setupConnection = await mysql.createConnection(baseDbConfig);

  await setupConnection.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
      DEFAULT CHARACTER SET utf8mb4
      DEFAULT COLLATE utf8mb4_unicode_ci`
  );
  await setupConnection.end();

  dbPool = mysql.createPool({
    ...poolDbConfig,
    database: DB_NAME,
  });

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id CHAR(36) PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      student_id VARCHAR(12) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await ensureUsersEmailColumn(dbPool);
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id CHAR(36) PRIMARY KEY,
      club_name VARCHAR(100) NOT NULL,
      applicant_user_id CHAR(36) NOT NULL,
      applicant_name VARCHAR(50) NOT NULL,
      applicant_student_id VARCHAR(12) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      motivation TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX applications_club_name_idx (club_name),
      INDEX applications_applicant_user_id_idx (applicant_user_id)
    )
  `);
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS club_posts (
      id CHAR(36) PRIMARY KEY,
      owner_user_id CHAR(36) NOT NULL,
      owner_student_id VARCHAR(12) NOT NULL,
      club_name VARCHAR(100) NOT NULL,
      category VARCHAR(30) NOT NULL,
      description TEXT NOT NULL,
      target_text VARCHAR(255) NOT NULL,
      activity_time VARCHAR(255) NOT NULL,
      activity_days VARCHAR(50) NOT NULL,
      capacity VARCHAR(50) NOT NULL,
      deadline_date DATE NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX club_posts_owner_user_id_idx (owner_user_id),
      INDEX club_posts_club_name_idx (club_name)
    )
  `);

  return dbPool;
}

async function ensureUsersEmailColumn(pool) {
  const [columns] = await pool.execute(
    `SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email'`,
    [DB_NAME]
  );

  if (columns.length > 0) {
    return;
  }

  await pool.query("ALTER TABLE users ADD COLUMN email VARCHAR(255) NULL AFTER name");
  await pool.query("UPDATE users SET email = CONCAT(student_id, '@local.invalid') WHERE email IS NULL");
  await pool.query("ALTER TABLE users MODIFY email VARCHAR(255) NOT NULL");
  await pool.query("CREATE UNIQUE INDEX users_email_unique ON users (email)");
}

async function findUserByStudentId(studentId) {
  const pool = await getDbPool();
  const [rows] = await pool.execute(
    `SELECT
      id,
      name,
      email,
      student_id AS studentId,
      password_hash AS passwordHash,
      created_at AS createdAt
    FROM users
    WHERE student_id = ?
    LIMIT 1`,
    [studentId]
  );

  return rows[0] || null;
}

async function findUserByEmail(email) {
  const pool = await getDbPool();
  const [rows] = await pool.execute(
    `SELECT
      id,
      name,
      email,
      student_id AS studentId,
      password_hash AS passwordHash,
      created_at AS createdAt
    FROM users
    WHERE email = ?
    LIMIT 1`,
    [email]
  );

  return rows[0] || null;
}

async function createUser(user) {
  const pool = await getDbPool();

  await pool.execute(
    "INSERT INTO users (id, name, email, student_id, password_hash) VALUES (?, ?, ?, ?, ?)",
    [user.id, user.name, user.email, user.studentId, user.passwordHash]
  );
}

async function createApplication(application) {
  const pool = await getDbPool();

  await pool.execute(
    `INSERT INTO applications (
      id,
      club_name,
      applicant_user_id,
      applicant_name,
      applicant_student_id,
      phone,
      motivation
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      application.id,
      application.clubName,
      application.applicantUserId,
      application.applicantName,
      application.applicantStudentId,
      application.phone,
      application.motivation,
    ]
  );
}

async function getApplicationsByClubNames(clubNames) {
  if (clubNames.length === 0) {
    return [];
  }

  const pool = await getDbPool();
  const placeholders = clubNames.map(() => "?").join(", ");
  const [rows] = await pool.execute(
    `SELECT
      id,
      club_name AS clubName,
      applicant_name AS applicantName,
      applicant_student_id AS applicantStudentId,
      phone,
      motivation,
      created_at AS createdAt
    FROM applications
    WHERE club_name IN (${placeholders})
    ORDER BY created_at DESC`,
    clubNames
  );

  return rows;
}

async function getApplicationsByUserId(userId) {
  const pool = await getDbPool();
  const [rows] = await pool.execute(
    `SELECT
      id,
      club_name AS clubName,
      phone,
      motivation,
      created_at AS createdAt
    FROM applications
    WHERE applicant_user_id = ?
    ORDER BY created_at DESC`,
    [userId]
  );

  return rows;
}

async function createClubPost(post) {
  const pool = await getDbPool();

  await pool.execute(
    `INSERT INTO club_posts (
      id,
      owner_user_id,
      owner_student_id,
      club_name,
      category,
      description,
      target_text,
      activity_time,
      activity_days,
      capacity,
      deadline_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      post.id,
      post.ownerUserId,
      post.ownerStudentId,
      post.clubName,
      post.category,
      post.description,
      post.targetText,
      post.activityTime,
      post.activityDays,
      post.capacity,
      post.deadlineDate,
    ]
  );
}

async function getClubPosts() {
  const pool = await getDbPool();
  const [rows] = await pool.execute(
    `SELECT
      id,
      owner_user_id AS ownerUserId,
      owner_student_id AS ownerStudentId,
      club_name AS clubName,
      category,
      description,
      target_text AS targetText,
      activity_time AS activityTime,
      activity_days AS activityDays,
      capacity,
      deadline_date AS deadlineDate,
      created_at AS createdAt
    FROM club_posts
    ORDER BY created_at DESC`
  );

  return rows;
}

async function getClubPostById(id) {
  const pool = await getDbPool();
  const [rows] = await pool.execute(
    `SELECT
      id,
      owner_user_id AS ownerUserId,
      owner_student_id AS ownerStudentId,
      club_name AS clubName,
      category,
      description,
      target_text AS targetText,
      activity_time AS activityTime,
      activity_days AS activityDays,
      capacity,
      deadline_date AS deadlineDate,
      created_at AS createdAt
    FROM club_posts
    WHERE id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function getClubPostsByOwner(userId) {
  const pool = await getDbPool();
  const [rows] = await pool.execute(
    `SELECT
      id,
      club_name AS clubName,
      category,
      deadline_date AS deadlineDate,
      created_at AS createdAt
    FROM club_posts
    WHERE owner_user_id = ?
    ORDER BY created_at DESC`,
    [userId]
  );

  return rows;
}

async function getManagedClubNames(user) {
  const envManagedClubNames = CLUB_NAMES.filter((clubName) => getClubOwnerStudentId(clubName) === user.studentId);
  const ownedPosts = await getClubPostsByOwner(user.id);
  const postClubNames = ownedPosts.map((post) => post.clubName);

  return [...new Set([...envManagedClubNames, ...postClubNames])];
}

function validateCredentials(name, email, studentId, password) {
  if (!name || !email || !studentId || !password) {
    return "이름, 이메일, 학번, 비밀번호를 모두 입력해주세요.";
  }

  if (!isValidEmail(email)) {
    return "올바른 이메일 주소를 입력해주세요.";
  }

  if (!/^\d{4,12}$/.test(studentId)) {
    return "학번은 숫자 4~12자리로 입력해주세요.";
  }

  if (password.length < 6) {
    return "비밀번호는 6자 이상이어야 합니다.";
  }

  return "";
}

async function handleApiRequest(request, response, pathname) {
  try {
    if (request.method === "GET" && pathname === "/api/me") {
      const user = getSessionUser(request);

      sendJson(response, 200, { user });
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

      const code = createVerificationCode();
      emailVerifications.set(normalizedEmail, {
        code,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      try {
        await sendVerificationEmail(normalizedEmail, code);
      } catch (error) {
        console.error("이메일 인증번호 발송 실패:", error.message);
        emailVerifications.delete(normalizedEmail);
        sendJson(response, 400, {
          message: "이메일 발송에 실패했습니다. SMTP 계정과 앱 비밀번호를 확인해주세요.",
        });
        return true;
      }

      sendJson(response, 200, { message: "인증번호를 이메일로 보냈습니다. 5분 안에 입력해주세요." });
      return true;
    }

    if (request.method === "POST" && pathname === "/api/signup") {
      const { name = "", email = "", verificationCode = "", studentId = "", password = "" } = await readRequestBody(request);
      const normalizedName = String(name).trim();
      const normalizedEmail = normalizeEmail(email);
      const normalizedVerificationCode = String(verificationCode).trim();
      const normalizedStudentId = String(studentId).trim();
      const normalizedPassword = String(password);
      const validationMessage = validateCredentials(normalizedName, normalizedEmail, normalizedStudentId, normalizedPassword);

      if (validationMessage) {
        sendJson(response, 400, { message: validationMessage });
        return true;
      }

      const verification = emailVerifications.get(normalizedEmail);

      if (!verification || verification.expiresAt < Date.now()) {
        emailVerifications.delete(normalizedEmail);
        sendJson(response, 400, { message: "이메일 인증번호를 먼저 받아주세요." });
        return true;
      }

      if (verification.code !== normalizedVerificationCode) {
        sendJson(response, 400, { message: "이메일 인증번호가 올바르지 않습니다." });
        return true;
      }

      const emailExists = await findUserByEmail(normalizedEmail);

      if (emailExists) {
        sendJson(response, 409, { message: "이미 가입된 이메일입니다." });
        return true;
      }

      const exists = await findUserByStudentId(normalizedStudentId);

      if (exists) {
        sendJson(response, 409, { message: "이미 가입된 학번입니다." });
        return true;
      }

      const user = {
        id: crypto.randomUUID(),
        name: normalizedName,
        email: normalizedEmail,
        studentId: normalizedStudentId,
        passwordHash: hashPassword(normalizedPassword),
        createdAt: new Date().toISOString(),
      };

      await createUser(user);
      emailVerifications.delete(normalizedEmail);

      const publicUser = getPublicUser(user);
      const sessionHeaders = createSession(response, publicUser);
      sendJson(response, 201, { user: publicUser, message: "회원가입이 완료되었습니다." }, sessionHeaders);
      return true;
    }

    if (request.method === "POST" && pathname === "/api/login") {
      const { studentId = "", password = "" } = await readRequestBody(request);
      const normalizedStudentId = String(studentId).trim();
      const normalizedPassword = String(password);
      const user = await findUserByStudentId(normalizedStudentId);

      if (!user || !verifyPassword(normalizedPassword, user.passwordHash)) {
        sendJson(response, 401, { message: "학번 또는 비밀번호가 올바르지 않습니다." });
        return true;
      }

      const publicUser = getPublicUser(user);
      const sessionHeaders = createSession(response, publicUser);
      sendJson(response, 200, { user: publicUser, message: "로그인되었습니다." }, sessionHeaders);
      return true;
    }

    if (request.method === "POST" && pathname === "/api/logout") {
      sendJson(response, 200, { message: "로그아웃되었습니다." }, clearSession(request));
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
      const user = getSessionUser(request);

      if (!user) {
        sendJson(response, 401, { message: "로그인 후 모집 공고를 작성할 수 있습니다." });
        return true;
      }

      const {
        clubName = "",
        category = "",
        description = "",
        targetText = "",
        activityTime = "",
        activityDays = "",
        capacity = "",
        deadlineDate = "",
      } = await readRequestBody(request);
      const normalizedClubName = String(clubName).trim();
      const normalizedCategory = String(category).trim();
      const normalizedDescription = String(description).trim();
      const normalizedTargetText = String(targetText).trim();
      const normalizedActivityTime = String(activityTime).trim();
      const normalizedActivityDays = String(activityDays).trim();
      const normalizedCapacity = String(capacity).trim();
      const normalizedDeadlineDate = String(deadlineDate).trim();

      if (
        !normalizedClubName ||
        !normalizedCategory ||
        !normalizedDescription ||
        !normalizedTargetText ||
        !normalizedActivityTime ||
        !normalizedActivityDays ||
        !normalizedCapacity ||
        !normalizedDeadlineDate
      ) {
        sendJson(response, 400, { message: "모집 공고 내용을 모두 입력해주세요." });
        return true;
      }

      if (!["study", "culture", "sports", "volunteer"].includes(normalizedCategory)) {
        sendJson(response, 400, { message: "분야를 올바르게 선택해주세요." });
        return true;
      }

      const post = {
        id: crypto.randomUUID(),
        ownerUserId: user.id,
        ownerStudentId: user.studentId,
        clubName: normalizedClubName,
        category: normalizedCategory,
        description: normalizedDescription,
        targetText: normalizedTargetText,
        activityTime: normalizedActivityTime,
        activityDays: normalizedActivityDays,
        capacity: normalizedCapacity,
        deadlineDate: normalizedDeadlineDate,
      };

      await createClubPost(post);
      sendJson(response, 201, { post, message: "모집 공고가 등록되었습니다." });
      return true;
    }

    if (request.method === "POST" && pathname === "/api/applications") {
      const user = getSessionUser(request);

      if (!user) {
        sendJson(response, 401, { message: "로그인 후 지원서를 제출할 수 있습니다." });
        return true;
      }

      const { clubName = "", phone = "", motivation = "" } = await readRequestBody(request);
      const normalizedClubName = String(clubName).trim();
      const normalizedPhone = String(phone).trim();
      const normalizedMotivation = String(motivation).trim();

      const clubPosts = await getClubPosts();
      const dynamicClubNames = clubPosts.map((post) => post.clubName);
      const availableClubNames = [...new Set([...CLUB_NAMES, ...dynamicClubNames])];

      if (!availableClubNames.includes(normalizedClubName)) {
        sendJson(response, 400, { message: "지원할 동아리를 올바르게 선택해주세요." });
        return true;
      }

      if (!normalizedPhone || !normalizedMotivation) {
        sendJson(response, 400, { message: "연락처와 지원 동기를 입력해주세요." });
        return true;
      }

      const application = {
        id: crypto.randomUUID(),
        clubName: normalizedClubName,
        applicantUserId: user.id,
        applicantName: user.name,
        applicantStudentId: user.studentId,
        phone: normalizedPhone,
        motivation: normalizedMotivation,
      };

      await createApplication(application);
      sendJson(response, 201, { application, message: "지원서가 제출되었습니다." });
      return true;
    }

    if (request.method === "GET" && pathname === "/api/applications/received") {
      const user = getSessionUser(request);

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
      const user = getSessionUser(request);

      if (!user) {
        sendJson(response, 401, { message: "로그인이 필요합니다." });
        return true;
      }

      const applications = await getApplicationsByUserId(user.id);
      sendJson(response, 200, { applications });
      return true;
    }

    sendJson(response, 404, { message: "존재하지 않는 API입니다." });
    return true;
  } catch (error) {
    sendJson(response, 400, { message: error.message || "요청 처리 중 문제가 발생했습니다." });
    return true;
  }
}

function getFilePath(requestUrl) {
  const parsedUrl = new URL(requestUrl, `http://localhost:${START_PORT}`);
  const safePath = path.normalize(decodeURIComponent(parsedUrl.pathname)).replace(/^(\.\.[/\\])+/, "");
  const requestedPath = safePath === "/" ? "/index.html" : safePath;

  return path.join(PUBLIC_DIR, requestedPath);
}

function sendFile(response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extension] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("서버에서 파일을 읽는 중 문제가 발생했습니다.");
      return;
    }

    response.writeHead(200, { "Content-Type": contentType });
    response.end(content);
  });
}

async function handleRequest(request, response) {
  const parsedUrl = new URL(request.url, `http://localhost:${START_PORT}`);

  if (parsedUrl.pathname.startsWith("/api/")) {
    await handleApiRequest(request, response, parsedUrl.pathname);
    return;
  }

  const filePath = getFilePath(request.url);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("접근할 수 없는 경로입니다.");
    return;
  }

  fs.stat(filePath, (error, stats) => {
    if (!error && stats.isFile()) {
      sendFile(response, filePath);
      return;
    }

    sendFile(response, path.join(PUBLIC_DIR, "index.html"));
  });
}

function startServer(port) {
  const server = http.createServer(handleRequest);

  server.once("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.log(`${port}번 포트가 이미 사용 중입니다. ${port + 1}번 포트로 다시 시도합니다.`);
      startServer(port + 1);
      return;
    }

    console.error("서버 실행 중 오류가 발생했습니다:", error);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`동아리픽 서버가 실행 중입니다: http://localhost:${port}`);
  });
}

startServer(START_PORT);
