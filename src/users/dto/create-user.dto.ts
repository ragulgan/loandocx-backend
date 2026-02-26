import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNumber, IsOptional, IsBoolean, IsPhoneNumber, Matches, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  user_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  user_type: string; 

  @ApiProperty()
  @IsString()
  user_pwd: string;

  @ApiProperty()
  @IsString()
  upi_id: string;

  @ApiProperty()
  @IsString()
  address1: string;

  @ApiProperty()
  @IsString()
  address2: string;

  @ApiProperty()
  mobile_number: string;

  @ApiProperty()
  @IsEmail()
  email_id: string;

  @ApiProperty()
  @IsString()
  aadhar_number: string;

  @ApiProperty({ example: 'Y/N', default: 'Y' })
  @IsString()
  user_active: string;
}
