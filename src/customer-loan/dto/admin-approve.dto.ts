import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEmail, IsDateString, IsNotEmpty, Length } from 'class-validator';

export class AdminApproveDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  adminUserId: number;

  @ApiProperty()
  agentId: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  civilUserId: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  legalUserId: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  legalHeadId: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  loanAmount: number;

  @ApiProperty()
  transactionId: string;
}
