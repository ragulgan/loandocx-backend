import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateLoantypeDto {
  @ApiProperty()
  @IsString()
  loan_name: string;

  @ApiProperty({ example: 'Y/N', default: 'Y' })
  @IsString()
  loan_active: string;
}