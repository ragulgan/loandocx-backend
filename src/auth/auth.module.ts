import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from "./auth.service";
import { AuthController } from './auth.controller';
import { LocalStrategy } from './local.auth';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { ResponseService } from '../base/controller';
import { UsersModule } from "../users/users.module";
import { UsersService } from "../users/users.service";
import { User } from '../users/entities/users.entity';
import { Screen } from 'src/screen/entities/screen.entity';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // Get secret key from env
        signOptions: { 
          expiresIn: configService.get<string>('JWT_EXPIRES') // Get expire time from env
        },
      }),
    }),
    TypeOrmModule.forFeature([User, Screen]),
    UsersModule,
],
  controllers: [AuthController],
  exports: [AuthService],
  providers: [AuthService, JwtAuthGuard, ResponseService, UsersService, LocalStrategy, JwtStrategy],
})
export class AuthModule {}