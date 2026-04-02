import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
export declare class AuthController {
    private readonly authService;
    private readonly jwtService;
    private readonly configService;
    constructor(authService: AuthService, jwtService: JwtService, configService: ConfigService);
    connect(userId: string, email: string, res: Response): Promise<void>;
    callback(code: string, state: string, error: string, res: Response): Promise<void>;
    disconnect(req: Request): Promise<void>;
    status(req: Request): Promise<{
        connected: boolean;
    }>;
    register(body: {
        email: string;
        wixSiteId?: string;
    }): Promise<{
        userId: string;
        token: string;
    }>;
}
