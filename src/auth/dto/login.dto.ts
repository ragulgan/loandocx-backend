import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class UserLoginDto {
    @IsNotEmpty()
    @ApiProperty({
        example: 1,
        required: true
    })
    readonly userId: number;

    @IsNotEmpty()
    @ApiProperty({
        example: 'Test@123',
        required: true
    })
    readonly password: string;

    @ApiProperty()
    @IsString()
    @Length(1, 100)
    @IsOptional()
    Device_ID: string;

    @ApiProperty()
    @IsString()
    @Length(1, 100)
    @IsOptional()
    platform: string;
}