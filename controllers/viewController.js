const fs = require("fs");
const path = require("path");
const { PUBLIC_DIR, START_PORT } = require("../config/env");

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

function getFilePath(requestUrl) {
  const parsedUrl = new URL(requestUrl, `http://localhost:${START_PORT}`);
  const decodedPath = decodeURIComponent(parsedUrl.pathname);
  const routedPath = decodedPath === "/"
    ? "/pages/index.html"
    : /^\/[^/]+\.html$/.test(decodedPath)
      ? `/pages${decodedPath}`
      : decodedPath;
  const safePath = path.normalize(routedPath).replace(/^(\.\.[/\\])+/, "").replace(/^[/\\]+/, "");

  return path.join(PUBLIC_DIR, safePath);
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

function handleViewRequest(request, response) {
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

    sendFile(response, path.join(PUBLIC_DIR, "pages", "index.html"));
  });
}

module.exports = {
  handleViewRequest,
};
