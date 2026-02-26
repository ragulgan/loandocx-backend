import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsNotEmpty } from 'class-validator';

export class CivilApproveDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  transactionId: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  loanAmount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  courierName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  courierTrackingId: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  courierDate: Date;
}