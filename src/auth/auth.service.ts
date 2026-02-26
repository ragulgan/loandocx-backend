import { Injectable, NotAcceptableException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as _ from 'lodash';
import * as jwt from 'jsonwebtoken';
import { UsersService } from '../users/users.service';
import { User } from "../users/users.entity";
import { UserLoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private readonly userService: UsersService,
    ) { }

    decodeToken(token: string): any {
        try {
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                throw new Error('JWT_SECRET is not defined');
            }
            const decoded = jwt.verify(token, secret);
            return decoded;
        } catch (error) {
            return null;
        }
    }

    async validateUser(mobile_number: string, createUserDto): Promise<User> {
        const result = await this.userService.findAll(mobile_number);
        const user = result.userList[0];
        if (!user) {
            throw new NotAcceptableException('Could not find the user');
        }
        return user;
    }

    async validateUserByEmail(email: string): Promise<User> {
        const user = await this.userService.findByEmail(email);
        if (!user) {
            throw new NotAcceptableException('Could not find the user');
        }
        return user;
    }

    async userLogin(createUserDto: UserLoginDto) {
        const result = await this.userService.userLogin(createUserDto);
        if (!result) return false;
        const payload = await this.userGeneratePayload(result);
        return {
            user: result,
            token: this.jwtService.sign(payload)
        };
    }

    async userGeneratePayload(userData: any) {
        return {
            user_id: userData.user_id,
            user_type: userData.user_type,
            user_name: userData.user_name,
            mobile_number: userData.mobile_number,
            email_id: userData.email_id
        }
    }
}