import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

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
}