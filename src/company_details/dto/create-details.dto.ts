import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateLoanCompanyDetailsDto {
  @ApiProperty()
  @IsString()
  company_name: string;

  @ApiProperty()
  @IsString()
  bank_name: string;

  @ApiProperty()
  @IsString()
  branch_name: string;

  @ApiProperty()
  @IsString()
  upi_id: string;

  @ApiProperty()
  @IsString()
  company_mail_id: string;
}