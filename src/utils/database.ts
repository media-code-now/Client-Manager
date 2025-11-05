// Utility function to construct database URL from environment variables
export function getDatabaseUrl(): string {
  // Try to get the full DATABASE_URL first
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // If not available, construct from parts
  const host = process.env.DB_HOST;
  const dbName = process.env.DB_NAME;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  
  if (!host || !dbName || !user || !password) {
    throw new Error('Database configuration incomplete. Missing DB_HOST, DB_NAME, DB_USER, or DB_PASSWORD');
  }
  
  return `postgresql://${user}:${password}@${host}/${dbName}?sslmode=require&channel_binding=require`;
}