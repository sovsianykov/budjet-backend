import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { config } from '../config';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: config.jwtSecret,
      signOptions: { expiresIn: config.jwtExpiredTime },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
