import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

const REDACTED_KEYS = ['accessToken', 'refreshToken', 'password', 'token', 'secret', 'email'];

function sanitize(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  const sanitized = { ...obj };
  for (const key of Object.keys(sanitized)) {
    if (REDACTED_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitize(sanitized[key]);
    }
  }
  return sanitized;
}

@Injectable()
export class AppLogger implements NestLoggerService {
  log(message: string, context?: string) {
    console.log(`[${new Date().toISOString()}] [LOG] [${context ?? 'App'}] ${message}`);
  }

  error(message: string, trace?: string, context?: string) {
    console.error(`[${new Date().toISOString()}] [ERROR] [${context ?? 'App'}] ${message}`);
    if (trace) console.error(trace);
  }

  warn(message: string, context?: string) {
    console.warn(`[${new Date().toISOString()}] [WARN] [${context ?? 'App'}] ${message}`);
  }

  logSafe(message: string, data?: Record<string, any>, context?: string) {
    const safe = data ? sanitize(data) : '';
    console.log(`[${new Date().toISOString()}] [LOG] [${context ?? 'App'}] ${message}`, safe ? JSON.stringify(safe) : '');
  }
}
