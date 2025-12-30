import 'dotenv/config';
import * as process from 'node:process';

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'secret',
  jwtRefreshTokenSecret:
    process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh-secret',
  jwtAccessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET || 'access-secret',
  jwtExpiredTime: 48 * 60 * 60,
};
