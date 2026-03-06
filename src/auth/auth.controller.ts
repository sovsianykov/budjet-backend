import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { CookieOptions } from 'express';
import { AuthService, JwtPayload } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../generated/prisma';
import { JwtAuthGuard } from './jwt.auth.guard';
import { config } from '../config';

@Controller('/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('/users')
  getAllUsers(): Promise<User[]> {
    return this.auth.getAllUsers();
  }

  private accessCookie(): CookieOptions {
    const isProduction = config.nodeEnv === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: config.jwtAccessTokenExpiredTime * 1000,
    };
  }

  private refreshCookie(): CookieOptions {
    const isProduction = config.nodeEnv === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: config.jwtExpiredTime * 1000,
      path: '/api/v1/auth',
    };
  }

  @Post('/sign_up')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.register(dto);

    res.cookie('accessToken', result.accessToken, this.accessCookie());
    res.cookie('refreshToken', result.refreshToken, this.refreshCookie());

    return { user: result.user };
  }

  @Post('/sign_in')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(dto);

    res.cookie('accessToken', result.accessToken, this.accessCookie());
    res.cookie('refreshToken', result.refreshToken, this.refreshCookie());

    return { user: result.user };
  }

  @Post('/refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.refreshToken;
    if (!token) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const result = await this.auth.refresh(token);

    res.cookie('accessToken', result.accessToken, this.accessCookie());
    res.cookie('refreshToken', result.refreshToken, this.refreshCookie());

    return { message: 'Tokens refreshed' };
  }

  @Post('/logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() req: Request & { user: JwtPayload },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(req.user.email);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return { message: 'Logged out successfully' };
  }

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: Request & { user: JwtPayload }) {
    return this.auth.getMe(req.user.email);
  }
}
