const http = require("http");
const { START_PORT } = require("./config/env");
const { handleApiRequest } = require("./controllers/apiController");
const { handleOAuthRequest } = require("./controllers/oauthController");
const { handleViewRequest } = require("./controllers/viewController");

async function handleRequest(request, response) {
  const parsedUrl = new URL(request.url, `http://localhost:${START_PORT}`);

  if (parsedUrl.pathname.startsWith("/api/auth/")) {
    const handled = await handleOAuthRequest(request, response, parsedUrl);

    if (handled) {
      return;
    }
  }

  if (parsedUrl.pathname.startsWith("/api/")) {
    await handleApiRequest(request, response, parsedUrl.pathname);
    return;
  }

  handleViewRequest(request, response);
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
    const redirectBase = process.env.OAUTH_REDIRECT_BASE?.trim().replace(/\/$/, "") || `http://localhost:${port}`;
    const expectedBase = `http://localhost:${port}`;

    console.log(`동아리픽 서버가 실행 중입니다: http://localhost:${port}`);

    if (redirectBase !== expectedBase) {
      console.warn(
        `[OAuth] 접속 포트(${port})와 OAUTH_REDIRECT_BASE(${redirectBase})가 다릅니다. Google 콘솔 Redirect URI를 ${expectedBase}/api/auth/google/callback 로 맞추세요.`
      );
    }

    const { getEnabledProviders } = require("./config/oauth");
    getEnabledProviders().forEach((provider) => {
      if (provider.clientId.length < 16) {
        console.warn(`[OAuth] ${provider.label} client_id가 비정상입니다. .env를 확인한 뒤 서버를 재시작하세요.`);
      }
    });
  });
}

startServer(START_PORT);
