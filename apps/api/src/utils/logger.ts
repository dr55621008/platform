import winston from 'winston';
import { config } from '../config/index.js';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom format for development
const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
});

export const logger = winston.createLogger({
  level: config.logLevel,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    config.nodeEnv === 'development' ? colorize() : json(),
    config.nodeEnv === 'development' ? devFormat : json()
  ),
  defaultMeta: { service: 'brokerhub-api' },
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error', 'warn'],
    }),
  ],
});
