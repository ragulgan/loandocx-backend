import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNumber, IsOptional, IsPhoneNumber, Matches, IsNotEmpty } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  user_name?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  user_type: string; 

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  user_pwd?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  upi_id?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  address1?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  address2?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  mobile_number?: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  email_id?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  aadhar_number?: string;

  @ApiProperty({ required: false, example: 'Y/N', default: 'Y' })
  @IsString()
  @IsOptional()
  user_active?: string;
}
