import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

// In-memory state store for CSRF protection (use Redis in production)
const pendingStates = new Map<string, { userId: string; expiresAt: number }>();

@ApiTags('Auth')
@Controller('auth/hubspot')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Step 1: Initiate HubSpot OAuth flow.
   * Called by frontend with userId (from JWT or initial setup).
   */
  @Get('connect')
  @ApiOperation({ summary: 'Initiate HubSpot OAuth flow' })
  async connect(
    @Query('userId') userId: string,
    @Query('email') email: string,
    @Res() res: Response,
  ) {
    if (!email && !userId) {
      throw new BadRequestException('Provide userId or email to initiate OAuth');
    }

    let resolvedUserId = userId;
    if (!resolvedUserId && email) {
      resolvedUserId = await this.authService.getOrCreateUser(email);
    }

    // Generate state token for CSRF protection
    const state = uuidv4();
    pendingStates.set(state, {
      userId: resolvedUserId,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 min
    });

    const authUrl = this.authService.buildHubspotAuthUrl(state);
    return res.redirect(authUrl);
  }

  /**
   * Step 2: HubSpot redirects back with code + state.
   */
  @Get('callback')
  @ApiOperation({ summary: 'HubSpot OAuth callback' })
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');

    if (error) {
      return res.redirect(`${frontendUrl}?error=oauth_denied`);
    }

    const pending = pendingStates.get(state);
    if (!pending || Date.now() > pending.expiresAt) {
      return res.redirect(`${frontendUrl}?error=invalid_state`);
    }
    pendingStates.delete(state);

    try {
      await this.authService.connectHubspot(pending.userId, code);
      const jwt = await this.authService.issueJwt(pending.userId);
      return res.redirect(`${frontendUrl}?token=${jwt}&connected=true`);
    } catch {
      return res.redirect(`${frontendUrl}?error=oauth_failed`);
    }
  }

  /**
   * Disconnect HubSpot account.
   */
  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Disconnect HubSpot account' })
  async disconnect(@Req() req: Request) {
    const userId = req['user']?.userId;
    await this.authService.disconnectHubspot(userId);
  }

  /**
   * Check connection status.
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check HubSpot connection status' })
  async status(@Req() req: Request) {
    const userId = req['user']?.userId;
    const connected = await this.authService.isConnected(userId);
    return { connected };
  }

  /**
   * Register a new user and get a JWT (used for initial app setup).
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register user and get JWT' })
  async register(@Body() body: { email: string; wixSiteId?: string }) {
    if (!body.email) throw new BadRequestException('email is required');
    const userId = await this.authService.getOrCreateUser(body.email, body.wixSiteId);
    const token = await this.authService.issueJwt(userId);
    return { userId, token };
  }
}
