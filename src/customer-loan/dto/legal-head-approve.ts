import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsNotEmpty } from 'class-validator';

export class LegalHeadApproveDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  transactionId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  courierName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  trackingId: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  sendDate: Date;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  loanAmount: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  legalUserId: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  legalHeadId: number;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  legalUserCompDate: Date;
}