const pino = require("pino");
const { createWriteStream } = require("pino-logflare");
require("dotenv").config(); // Load environment variables from .env

// Initialize Logflare stream with API key and source token
const logflareStream = createWriteStream({
  apiKey: process.env.LOGFLARE_API_KEY, // Get API key from environment
  sourceToken: process.env.LOGFLARE_SOURCE_TOKEN, // Get source token from environment
});

// Configure Pino logger
const logger = pino(
  {
    level: process.env.LOG_LEVEL || "info", // Set log level based on environment
    base: {
      app: "bugbusters-projectmanagement", // Add application metadata to logs
      env: process.env.NODE_ENV || "development",
    },
    formatters: {
      level(label) {
        return { level: label }; // Use structured log levels
      },
    },
    redact: ["req.headers.authorization", "password"], // Protect sensitive data
  },
  logflareStream // Send logs to Logflare
);

module.exports = logger;
