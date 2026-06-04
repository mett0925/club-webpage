const fs = require("fs");
const path = require("path");

function loadEnvFile() {
  const envPath = path.join(__dirname, "..", ".env");

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
const PUBLIC_DIR = path.join(__dirname, "..");
const DB_NAME = process.env.DB_NAME || "club_web_page";
const SESSION_COOKIE_NAME = "club_session";
const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const CLUB_NAMES = [];

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

module.exports = {
  START_PORT,
  PUBLIC_DIR,
  DB_NAME,
  SESSION_COOKIE_NAME,
  SESSION_IDLE_TIMEOUT_MS,
  CLUB_NAMES,
  baseDbConfig,
  poolDbConfig,
};
