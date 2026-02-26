import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from "./auth.service";
import { AuthController } from './auth.controller';
import { LocalStrategy } from './local.auth';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { ResponseService } from '../base/controller';
import { UsersModule } from "../users/users.module";
import { UsersService } from "../users/users.service";
import { User } from '../users/users.entity';
import { Screen } from 'src/screen/screen.entity';

@Module({
  imports: [
    PassportModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: 'mySecretKey123',
      signOptions: { expiresIn: '30d' },
    }),
    TypeOrmModule.forFeature([User, Screen]),
    UsersModule,
],
  controllers: [AuthController],
  exports: [AuthService],
  providers: [AuthService, JwtAuthGuard, ResponseService, UsersService, LocalStrategy, JwtStrategy],
})
export class AuthModule {}