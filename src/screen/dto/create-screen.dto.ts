import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsIn, IsArray, ArrayMinSize, IsOptional } from 'class-validator';

export class CreateScreenDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Screen name is required' })
  @MaxLength(50, { message: 'Screen name must not exceed 50 characters' })
  @IsString()
  screen_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Screen URL is required' })
  @MaxLength(200, { message: 'Screen URL must not exceed 200 characters' })
  screen_url: string;

  @ApiProperty({ example: 'Y/N', default: 'Y' })
  @IsString()
  @IsIn(['Y', 'N'], { message: 'Screen active must be Y or N' })
  @IsOptional()
  screen_active: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  user_type: string; 
}


