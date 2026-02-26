import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({ required: true })
    @IsString()
    @IsNotEmpty()
    userType: string;

    @ApiProperty({ required: true })
    @IsString()
    @IsNotEmpty()
    userId: string;

    @ApiProperty({ required: true })
    @IsNotEmpty()
    @IsString()
    newPassword: string;
}