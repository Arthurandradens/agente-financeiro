export const config = {
  PORT: parseInt(process.env.PORT || '8080'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  API_KEY: process.env.API_KEY || 'changeme',
  DB_VENDOR: process.env.DB_VENDOR || 'sqlite',
  DATABASE_URL: process.env.DATABASE_URL,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
} as const
