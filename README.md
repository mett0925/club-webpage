# 동아리픽

우리 학교 동아리 모집 공고를 확인하고, 회원가입 후 동아리 지원서를 제출할 수 있는 웹 서비스입니다.

## 주요 기능

- 동아리 모집 공고 목록/상세 조회
- 회원가입, 로그인, 로그아웃
- 이메일 인증 기반 회원가입 및 회원정보 수정
- 동아리 모집 공고 작성/수정/삭제
- 동아리 지원서 제출/수정/삭제
- 마이페이지에서 내 지원서 및 담당 동아리 지원서 확인
- 30분 미사용 시 자동 로그아웃

## 기술 스택

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js (기본 `http` 모듈)
- **Database:** MySQL
- **Email:** Nodemailer (SMTP)

## 프로젝트 구조

```
club-web-page/
├── server.js              # 서버 실행 진입점
├── config/                # 환경변수, DB 설정
├── controllers/           # Controller (API, View)
├── dao/                   # DAO (DB 접근)
├── dto/                   # DTO (요청/응답 데이터 변환)
├── services/              # 세션, 비밀번호, 이메일 서비스
├── utils/                 # HTTP 유틸
├── pages/                 # View (HTML)
├── scripts/               # View (프론트엔드 JS)
├── styles/                # View (CSS)
└── schema.sql             # DB 스키마 참고용
```

## 사전 준비

- [Node.js](https://nodejs.org/) (LTS 권장)
- [MySQL](https://www.mysql.com/)
- [Git](https://git-scm.com/)

## 설치 및 실행

```bash
git clone https://github.com/mett0925/club-webpage.git
cd club-web-page
npm install
```

`.env.example`을 복사해 `.env` 파일을 만든 뒤 환경변수를 설정합니다.

```bash
# Windows
copy .env.example .env
```

MySQL을 실행한 후 서버를 시작합니다.

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 으로 접속합니다.

> DB와 테이블은 서버 실행 시 자동으로 생성됩니다. `schema.sql`을 수동 실행할 필요는 없습니다.

## 환경변수

| 변수 | 설명 |
|------|------|
| `DB_HOST` | MySQL 호스트 |
| `DB_PORT` | MySQL 포트 |
| `DB_USER` | MySQL 사용자 |
| `DB_PASSWORD` | MySQL 비밀번호 |
| `DB_NAME` | 데이터베이스 이름 |
| `PORT` | 서버 포트 (기본값: 3000) |
| `SMTP_HOST` | SMTP 서버 주소 |
| `SMTP_PORT` | SMTP 포트 (Gmail: 587) |
| `SMTP_SECURE` | SSL/TLS 즉시 사용 여부 (587 포트: `false`) |
| `SMTP_USER` | SMTP 로그인 이메일 |
| `SMTP_PASS` | SMTP 앱 비밀번호 |
| `MAIL_FROM` | 발신자 이메일 |

SMTP 설정이 없으면 이메일 인증번호가 서버 콘솔에 출력됩니다.

## 주요 페이지

| 경로 | 설명 |
|------|------|
| `/` | 메인 페이지 |
| `/login.html` | 로그인 |
| `/signup.html` | 회원가입 |
| `/clubs.html` | 전체 모집 공고 |
| `/detail.html` | 모집 공고 상세 |
| `/apply.html` | 지원서 작성 |
| `/post.html` | 모집 공고 작성 |
| `/mypage.html` | 마이페이지 |
| `/profile.html` | 회원정보 수정 |

## API 예시

| Method | Endpoint | 설명 |
|--------|----------|------|
| `POST` | `/api/signup` | 회원가입 |
| `POST` | `/api/login` | 로그인 |
| `POST` | `/api/logout` | 로그아웃 |
| `GET` | `/api/me` | 현재 로그인 사용자 |
| `GET` | `/api/club-posts` | 모집 공고 목록 |
| `POST` | `/api/club-posts` | 모집 공고 등록 |
| `POST` | `/api/applications` | 지원서 제출 |
| `GET` | `/api/applications/mine` | 내 지원서 목록 |
| `GET` | `/api/applications/received` | 담당 동아리 지원서 목록 |

## 라이선스

MIT
