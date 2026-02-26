import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class AdminPayoutSettleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userType: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fromDate: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  toDate: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  paymentOn: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  paymentTranId: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  adminUserId: number;
}