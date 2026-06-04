# 동아리픽

**동아리픽**은 우리 학교 동아리 모집 공고를 한곳에 모아 보여 주고, 학생이 회원가입·로그인 후 지원서를 제출할 수 있게 하는 **캠퍼스 동아리 모집 웹 서비스**입니다.  
CampusPick 스타일의 단일 페이지형 UI에, Node.js + MySQL 기반의 가벼운 백엔드 API를 붙인 구조입니다.

---

## 서비스 개요

| 구분 | 설명 |
|------|------|
| **대상** | 동아리에 지원하고 싶은 학생, 모집 공고를 올리는 동아리 담당자 |
| **핵심 가치** | 모집 공고 조회 → 상세 확인 → 로그인 → 지원서 제출까지 한 사이트에서 처리 |
| **데이터** | 공고·지원서·회원 정보는 MySQL에 저장 (서버 기동 시 DB·테이블 자동 생성) |

### 이용 흐름

1. **비회원** — 메인·모집 목록에서 공고를 둘러보고 상세를 확인합니다.
2. **지원자** — 회원가입(이메일 인증 또는 Google) 후 로그인 → 지원서 작성·제출 → 마이페이지에서 내 지원 내역을 확인·수정·삭제합니다.
3. **동아리 담당자** — 로그인 후 모집 공고를 등록·수정·삭제하고, 마이페이지 **받은 지원서** 탭에서 같은 동아리명으로 들어온 지원을 확인합니다.

---

## 주요 기능

### 모집 공고

- **목록·상세**: DB에 등록된 공고만 표시합니다 (정적 더미 카드 없음).
- **카테고리 8종**: 학술, 문화, 운동, 봉사, 공연, 창업, 미디어, 종교.
- **필터·검색**: 메인·`clubs.html`에서 카테고리 필터, 동아리명·설명 키워드 검색.
- **모집 상태**: 마감일(`deadline_date`) 기준으로 모집 중 여부를 표시합니다.
- **CRUD**: 로그인 사용자가 `post.html`에서 공고 작성, 마이페이지에서 본인 공고 수정·삭제.

### 지원서

- **제출**: 공고 상세에서 지원하기 → `apply.html`에서 동기부여·연락처 등 입력.
- **관리**: 마이페이지 **내 지원서**에서 수정·삭제.
- **담당자 조회**: 로그인 사용자가 올린 공고의 `club_name`과 일치하는 지원서를 **받은 지원서** 탭에서 확인.

### 회원·인증

- **학번 로그인**: 학번 + 비밀번호.
- **회원가입**: 이름, 이메일, 생년월일, 학번, 비밀번호 + **이메일 인증번호** 확인.
- **Google 로그인**: OAuth 2.0 (`.env`에 클라이언트 ID/시크릿 설정 시 버튼 표시).
- **회원정보 수정**: `profile.html` — 이메일 인증 후 이름·생년월일·비밀번호 변경.

### 메인 페이지 통계

홈 히어로 영역에 API 기반 실시간 수치를 표시합니다.

| 항목 | 계산 방식 |
|------|-----------|
| 등록 동아리 | 모집 공고에 등록된 고유 `club_name` 수 |
| 현재 모집 중 | 마감일이 오늘 이후인 공고 수 |
| 누적 신청 | `applications` 테이블 전체 건수 |

---

## 부가 기능

| 기능 | 설명 |
|------|------|
| **30분 자동 로그아웃** | 서버 세션에 마지막 활동 시각을 저장하고, 30분 미사용 시 세션 만료. 만료 후 로그인 페이지에 안내 메시지 표시. |
| **로그아웃 확인** | 로그아웃 버튼 클릭 시 `confirm`으로 한 번 더 확인. |
| **세션 쿠키** | `HttpOnly`, `SameSite=Lax` 쿠키로 세션 ID 관리. |
| **이메일 인증 (개발 편의)** | SMTP 미설정 시 인증번호를 **서버 콘솔**에 출력. |
| **OAuth Redirect 자동 맞춤** | 요청 `Host` 기준으로 콜백 URL 생성 (프록시 환경은 `X-Forwarded-*` 지원). |
| **포트 자동 증가** | 3000번이 사용 중이면 3001, 3002… 순으로 재시도. |
| **서버 기동 시 OAuth 점검** | 비정상 `client_id`·포트 불일치 시 콘솔 경고. |
| **소셜 계정 연동 테이블** | `user_social_accounts`로 Google 계정과 내부 회원 ID 매핑 (기존 이메일 계정과 자동 연결 가능). |

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | Node.js (`http` 모듈, MVC 스타일 폴더 구조) |
| Database | MySQL (`mysql2`) |
| Email | Nodemailer (SMTP) |
| Auth | 쿠키 세션 + bcrypt 비밀번호 + Google OAuth 2.0 |

---

## 프로젝트 구조

```
club-web-page/
├── server.js                 # HTTP 서버 진입점
├── config/
│   ├── env.js                # .env 로드, 포트·세션 상수
│   ├── database.js           # DB·테이블 초기화
│   └── oauth.js              # Google OAuth 설정
├── controllers/
│   ├── apiController.js      # REST API
│   ├── oauthController.js    # /api/auth/* OAuth
│   └── viewController.js     # 정적 HTML/CSS/JS 서빙
├── dao/                      # DB 접근
├── dto/                      # 요청 검증·응답 변환
├── services/                 # 세션, 비밀번호, 이메일, OAuth
├── migrations/               # 스키마 추가 SQL (수동 적용용)
├── pages/                    # HTML 화면
├── scripts/                  # 프론트엔드 JS
├── styles/                   # CSS
└── schema.sql                # DB 스키마 참고용
```

---

## 데이터베이스

서버 실행 시 `club_web_page` DB와 아래 테이블이 없으면 자동 생성됩니다.

| 테이블 | 용도 |
|--------|------|
| `users` | 회원 (학번, 이메일, 생년월일, 비밀번호 해시 등) |
| `user_social_accounts` | Google 등 소셜 계정 ↔ 사용자 매핑 |
| `club_posts` | 동아리 모집 공고 |
| `applications` | 지원서 |

Google 로그인을 처음 도입할 때는 `migrations/add_social_accounts.sql`을 참고해 기존 DB에 소셜 테이블·nullable 컬럼을 맞출 수 있습니다.

---

## 사전 준비

- [Node.js](https://nodejs.org/) (LTS 권장)
- [MySQL](https://www.mysql.com/)
- [Git](https://git-scm.com/)

---

## 설치 및 실행

```bash
git clone https://github.com/mett0925/club-webpage.git
cd club-web-page
npm install
```

`.env.example`을 복사해 `.env`를 만든 뒤 DB·SMTP·Google OAuth 값을 채웁니다.

```bash
# Windows
copy .env.example .env
```

MySQL을 실행한 후:

```bash
npm run dev
```

브라우저에서 **`http://localhost:3000`** 으로 접속합니다.  
(3000이 이미 사용 중이면 터미널에 표시된 포트로 접속하고, Google Redirect URI도 그 포트에 맞춥니다.)

> DB·테이블은 서버 기동 시 자동 생성됩니다. `schema.sql`을 수동 실행할 필요는 없습니다.

---

## 환경변수

| 변수 | 설명 |
|------|------|
| `DB_HOST` | MySQL 호스트 |
| `DB_PORT` | MySQL 포트 |
| `DB_USER` | MySQL 사용자 |
| `DB_PASSWORD` | MySQL 비밀번호 |
| `DB_NAME` | 데이터베이스 이름 (기본: `club_web_page`) |
| `PORT` | 서버 포트 (기본: `3000`) |
| `OAUTH_REDIRECT_BASE` | OAuth 콜백 기준 URL (선택, 미설정 시 접속 Host 사용) |
| `GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 클라이언트 시크릿 |
| `SMTP_HOST` | SMTP 서버 (예: `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP 포트 (Gmail: `587`) |
| `SMTP_SECURE` | TLS 즉시 사용 (`587` → `false`) |
| `SMTP_USER` | SMTP 로그인 이메일 |
| `SMTP_PASS` | SMTP 앱 비밀번호 |
| `MAIL_FROM` | 발신자 주소 |

**Google OAuth 설정 요약**

1. [Google Cloud Console](https://console.cloud.google.com/)에서 OAuth 클라이언트 생성
2. 승인된 리디렉션 URI: `http://localhost:3000/api/auth/google/callback` (실제 접속 포트와 동일하게)
3. `.env`에 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 입력 후 서버 재시작

SMTP가 없으면 회원가입·프로필 수정용 인증번호가 **터미널 콘솔**에 출력됩니다.

---

## 주요 페이지

| 경로 | 설명 |
|------|------|
| `/` (`index.html`) | 메인 — 통계, 카테고리 필터, 모집 미리보기 |
| `/clubs.html` | 전체 모집 공고 목록·검색 |
| `/detail.html?id=` | 모집 공고 상세·지원 링크 |
| `/apply.html` | 지원서 작성 |
| `/post.html` | 모집 공고 작성 (로그인 필요) |
| `/login.html` | 로그인 (학번 / Google) |
| `/signup.html` | 회원가입 (이메일 인증 / Google) |
| `/mypage.html` | 내 공고·내 지원서·받은 지원서 |
| `/profile.html` | 회원정보 수정 (이메일 인증 후) |

---

## API

### 인증·회원

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/auth/providers` | 사용 가능한 소셜 로그인 목록 |
| `GET` | `/api/auth/google` | Google 로그인 시작 |
| `GET` | `/api/auth/google/callback` | Google OAuth 콜백 |
| `POST` | `/api/send-verification` | 회원가입용 이메일 인증번호 발송 |
| `POST` | `/api/signup` | 회원가입 |
| `POST` | `/api/login` | 학번 로그인 |
| `POST` | `/api/logout` | 로그아웃 |
| `GET` | `/api/me` | 현재 로그인 사용자 |
| `PUT` | `/api/me` | 회원정보 수정 |
| `POST` | `/api/send-profile-verification` | 프로필 수정용 인증번호 발송 |
| `POST` | `/api/verify-profile-access` | 프로필 수정 접근 인증 |

### 모집 공고

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/club-posts` | 공고 목록 |
| `GET` | `/api/club-posts/mine` | 내가 등록한 공고 |
| `GET` | `/api/club-posts/:id` | 공고 상세 |
| `POST` | `/api/club-posts` | 공고 등록 |
| `PUT` | `/api/club-posts/:id` | 공고 수정 |
| `DELETE` | `/api/club-posts/:id` | 공고 삭제 |

### 지원서

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/applications/count` | 누적 지원 건수 (메인 통계) |
| `GET` | `/api/applications/mine` | 내 지원서 목록 |
| `GET` | `/api/applications/received` | 담당 동아리로 받은 지원서 |
| `POST` | `/api/applications` | 지원서 제출 |
| `PUT` | `/api/applications/:id` | 지원서 수정 |
| `DELETE` | `/api/applications/:id` | 지원서 삭제 |

---

## 개발 시 참고

- **`.env`는 Git에 올리지 마세요.** 비밀번호·OAuth 시크릿·SMTP 앱 비밀번호가 포함됩니다.
- **코드 수정 후** OAuth·DB 설정 반영을 위해 `Ctrl+C` → `npm run dev`로 서버를 재시작하세요.
- 프론트는 별도 빌드 없이 `pages/`·`scripts/`·`styles/`를 수정하면 즉시 반영됩니다 (브라우저 새로고침).

---

## 라이선스

MIT
