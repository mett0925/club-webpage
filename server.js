const http = require("http");
const { START_PORT } = require("./config/env");
const { handleApiRequest } = require("./controllers/apiController");
const { handleViewRequest } = require("./controllers/viewController");

async function handleRequest(request, response) {
  const parsedUrl = new URL(request.url, `http://localhost:${START_PORT}`);

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
    console.log(`동아리픽 서버가 실행 중입니다: http://localhost:${port}`);
  });
}

startServer(START_PORT);
