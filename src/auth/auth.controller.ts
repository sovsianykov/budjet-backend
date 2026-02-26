import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../generated/prisma';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { JwtAuthGuard } from './jwt.auth.guard';

@Controller('/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/users')
  getAllUsers(): Promise<User[]> {
    return this.auth.getAllUsers();
  }

  @Post('/sign_up')
  register(@Body() registerDto: RegisterDto) {
    return this.auth.register(registerDto);
  }

  @Post('/sign_in')
  login(@Body() loginDto: LoginDto) {
    return this.auth.login(loginDto);
  }

  @Post('/refresh')
  async refresh(@Body() body: RefreshTokenDto) {
    const { token } = body;

    if (!token) {
      throw new BadRequestException('Refresh token is required');
    }

    return await this.auth.refresh(token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/logout')
  async logout(@Body() body: LogoutDto) {
    const { email } = body;

    if (!email) {
      throw new BadRequestException('Email is required');
    }
    return this.auth.logout(email);
  }

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req) {
    return this.auth.getMe(req.user.email as string);
  }
}
