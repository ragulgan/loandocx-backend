import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/users.entity';
import { ResponseService } from '../base/controller';
import { Screen } from 'src/screen/entities/screen.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Screen])],
  controllers: [UsersController],
  providers: [UsersService, ResponseService],
  exports: [UsersService],
})
export class UsersModule {}
