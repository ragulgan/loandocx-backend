import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadDocDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  customerId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  docName: string;
}