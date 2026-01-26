import {
  BadRequestException,
  Injectable,
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

    // Find user by email
    const user: User | null = await this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(email) },
    });

    // If user not found, throw error
    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    // Compare input password with stored hashed password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.encryptedPassword,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    // Generate access and refresh tokens
    const { accessToken, refreshToken } = this.generateTokens(email);

    // Store the new refresh token in the DB (consider hashing it for increased security)
    await this.prisma.user.update({
      where: { email },
      data: { refreshToken },
    });

    // Remove sensitive data from user object before returning

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { encryptedPassword: _, ...userWithoutPassword } = user;

    // Return user info and tokens to the client
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
      // 1. Verify and decode the refresh token
      const payload = this.verifyRefreshToken(token); // your method to verify JWT refresh token
      const email = payload.email;

      // 2. Find user by email
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // 3. Check if refresh token matches the one in DB
      if (user.refreshToken !== token) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // 4. Generate new tokens
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        this.generateTokens(email);

      // 5. Save new refresh token
      await this.prisma.user.update({
        where: { email },
        data: { refreshToken: newRefreshToken },
      });

      // 6. Return new tokens
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (e) {
      console.error(e as Error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(email: string) {
    const accessToken = this.jwtService.sign(
      { email },
      {
        secret: config.jwtAccessTokenSecret,
        expiresIn: config.jwtExpiredTime,
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

      throw new Error('Invalid token payload');
    } catch (err) {
      console.error(err);
      throw new Error('Refresh token verification failed');
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

    console.log('user ', safeUser);

    return safeUser;
  }
}
