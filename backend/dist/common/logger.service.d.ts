import { LoggerService as NestLoggerService } from '@nestjs/common';
export declare class AppLogger implements NestLoggerService {
    log(message: string, context?: string): void;
    error(message: string, trace?: string, context?: string): void;
    warn(message: string, context?: string): void;
    logSafe(message: string, data?: Record<string, any>, context?: string): void;
}
