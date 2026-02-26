import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsArray, IsIn, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateScreenDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Screen name must not exceed 50 characters' })
  screen_name?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'Screen URL must not exceed 200 characters' })
  screen_url?: string;

  @ApiProperty()
  @IsString()
  @IsIn(['Y', 'N'], { message: 'Screen active must be Y or N' })
  @IsOptional()
  screen_active?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  user_type: string;
}