import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { User } from '../generated/prisma';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { config } from 'src/config';

export interface JwtPayload {
  email: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private readonly SALT_ROUNDS = 10;

  async register(registerDto: RegisterDto) {
    const { email, password, lastName, firstName, phone } = registerDto;

    const existingUser: User | null = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const encryptedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    const { accessToken, refreshToken } = this.generateTokens(email);

    const newUser = await this.prisma.user.create({
      data: {
        email: this.normalizeEmail(email),
        encryptedPassword,
        lastName,
        firstName,
        phone,
        refreshToken,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { encryptedPassword: _, ...userWithoutPassword } = newUser;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user: User | null = await this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(email) },
    });

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.encryptedPassword,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    const { accessToken, refreshToken } = this.generateTokens(email);

    await this.prisma.user.update({
      where: { email },
      data: { refreshToken },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { encryptedPassword: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  public getAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async refresh(token: string) {
    try {
      const payload = this.verifyRefreshToken(token);
      const email = payload.email;

      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (user.refreshToken !== token) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        this.generateTokens(email);

      await this.prisma.user.update({
        where: { email },
        data: { refreshToken: newRefreshToken },
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (e) {
      this.logger.error('Refresh token failed', e);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(email: string) {
    const accessToken = this.jwtService.sign(
      { email },
      {
        secret: config.jwtAccessTokenSecret,
        expiresIn: config.jwtAccessTokenExpiredTime,
      },
    );

    const refreshToken = this.jwtService.sign(
      { email },
      {
        secret: config.jwtRefreshTokenSecret,
        expiresIn: config.jwtExpiredTime,
      },
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(email: string): Promise<{ message: string }> {
    await this.prisma.user.update({
      where: { email },
      data: { refreshToken: null },
    });

    return { message: 'Logged out successfully' };
  }

  verifyRefreshToken(token: string): { email: string } {
    try {
      const payload = this.jwtService.verify(token, {
        secret: config.jwtRefreshTokenSecret,
      });

      if (typeof payload === 'object' && 'email' in payload) {
        return payload as { email: string; iat: number; exp: number };
      }

      throw new UnauthorizedException('Invalid token payload');
    } catch (err) {
      this.logger.error('Refresh token verification failed', err);
      throw new UnauthorizedException('Refresh token verification failed');
    }
  }

  protected normalizeEmail(email: string): string {
    return (email || '').toLowerCase().trim();
  }

  async getMe(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(email) },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { encryptedPassword, refreshToken, ...safeUser } = user;

    return safeUser;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const normalizedEmail = this.normalizeEmail(email);
    return this.prisma.user.findUnique({ where: { email: normalizedEmail } });
  }
}
