export const config = {
  PORT: parseInt(process.env["PORT"] || "8080"),
  NODE_ENV: process.env["NODE_ENV"] || "development",
  FRONTEND_ORIGIN: process.env["FRONTEND_ORIGIN"] || "http://localhost:5173",
  API_KEY: process.env["API_KEY"] || "changeme",
  DB_VENDOR: process.env["DB_VENDOR"] || "postgresql",
  DATABASE_URL:
    process.env["DATABASE_URL"] ||
    "postgresql://postgres:postgres@localhost:5432/finance_db",
  LOG_LEVEL: process.env["LOG_LEVEL"] || "info",
  OPENAI_API_KEY: process.env["OPENAI_API_KEY"] || "",
  OPENAI_MODEL: process.env["OPENAI_MODEL"] || "gpt-4o",
} as const;
