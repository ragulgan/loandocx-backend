import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateLoanCompanyDetailsDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  company_name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  bank_name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  branch_name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  upi_id: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  company_mail_id: string;
}
