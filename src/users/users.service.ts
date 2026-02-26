import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, Not } from 'typeorm';
import { User } from './users.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Screen } from 'src/screen/screen.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Screen) private screenRepo: Repository<Screen>,
  ) { }

  async create(dto: CreateUserDto) {
    if (dto.mobile_number) {
      const existMobile = await this.userRepo.findOne({
        where: { mobile_number: dto.mobile_number }
      });
      if (existMobile) {
        throw new BadRequestException({ code: 1008, message: 'User mobile number duplicate entry!' });
      }
    }

    if (dto.aadhar_number) {
      const existAadhar = await this.userRepo.findOne({
        where: { aadhar_number: dto.aadhar_number }
      });
      if (existAadhar) {
        throw new BadRequestException({ code: 1009, message: 'User aadhar number duplicate entry!' });
      }
    }

    const user = this.userRepo.create(dto);
    return await this.userRepo.save(user);
  }

  async findAll(params: any) {
    const { limit = 10, skip = 0, status , mobile_number, user_name, email_id} = params || {};

    let where: FindOptionsWhere<User> | FindOptionsWhere<User>[] = {};

    if (status) {
      where.user_active = status;
    }

    if (mobile_number || user_name || email_id) {
      const baseWhere = { ...where };
      const orConditions: FindOptionsWhere<User>[] = [];

      if (mobile_number) {
        orConditions.push({
          ...baseWhere,
          mobile_number: Like(`%${mobile_number}%`),
        });
      }

      if (user_name) {
        orConditions.push({
          ...baseWhere,
          user_name: Like(`%${user_name}%`),
        });
      }

      if (email_id) {
        orConditions.push({
          ...baseWhere,
          email_id: Like(`%${email_id}%`),
        });
      }
      where = orConditions;
    }

    const [userList, count] = await this.userRepo.findAndCount({
      where,
      take: limit,
      skip,
      order: { user_id: 'DESC' }
    });

    return { userList, count };
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepo.findOne({ 
      where: { email_id: email }
    });
  }

  async findOne(user_id: string) {
    const user = await this.userRepo.findOne({ where: { user_id } });
    if (!user) throw new NotFoundException(`User with id ${user_id} not found`);
    return user;
  }

  async findByUserRoleType(type: string) {
    return await this.userRepo
      .createQueryBuilder('u')
      .select(['u.user_id AS user_id', 'u.user_name AS user_name'])
      .where('u.user_type = :type', { type })
      .andWhere('u.user_active = :active', { active: 'Y' })
      .getRawMany();
  }

  async userLogin(req: any) {
    const user: any = await this.userRepo.findOne({
      where: {
        user_id: req.userId,
        user_active: 'Y'
      },
      select: {
        user_id: true,
        user_name: true,
        mobile_number: true,
        email_id: true,
        user_pwd: true,
        user_active: true,
        user_type: true
      }
    });
    if (!user) {
      console.log('User not found in database');
      return false;
    }

    const isPasswordMatch = await bcrypt.compare(req.password, user.user_pwd);
    console.log('Password match:', isPasswordMatch);
    if (!isPasswordMatch) {
      console.log('Password does not match');
      return false;
    }
    delete user.user_pwd;
    const screens = await this.screenRepo.find({
      where: {
        user_type: user.user_type,
        screen_active: 'Y'
      },
      order: { screen_id: 'ASC' }
    });
    return { ...user, screens };
  }

  async update(user_id: string, dto: UpdateUserDto) {
    const user = await this.findOne(user_id);
    if (dto.mobile_number && String(dto.mobile_number) !== String(user.mobile_number)) {
      const existMobile = await this.userRepo.findOne({
        where: { mobile_number: dto.mobile_number }
      });
      if (existMobile && existMobile.user_id !== user_id) {
        throw new BadRequestException({ code: 1008, message: 'User mobile number duplicate entry!' });
      }
    }

    if (dto.aadhar_number && dto.aadhar_number !== user.aadhar_number) {
      const existAadhar = await this.userRepo.findOne({
        where: { aadhar_number: dto.aadhar_number }
      });
      if (existAadhar && existAadhar.user_id !== user_id) {
        throw new BadRequestException({ code: 1009, message: 'User aadhar number duplicate entry!' });
      }
    }
    Object.assign(user, dto);
    return await this.userRepo.save(user);
  }

  async updatePassword(user_id: string, user_type: string, dto: ChangePasswordDto) {
    const user = await this.userRepo.findOne({
      where: {
        user_id: user_id,
        user_type: user_type
      }
    });
    if (!user) {
    throw new NotFoundException('User not found');
  }
    user.user_pwd = dto.newPassword;
    return await this.userRepo.save(user);
  }

  async remove(user_id: string) {
    const user = await this.findOne(user_id);
    return await this.userRepo.remove(user);
  }
}
