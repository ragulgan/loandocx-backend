import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEmail, IsDateString, IsNotEmpty, Length, IsOptional } from 'class-validator';

export class CreateCustomerLoanDetailsDto {
  @ApiProperty()
  @IsString()
  @Length(1, 50)
  customer_name: string;

  @ApiProperty()
  @IsString()
  @Length(1, 20)
  loan_name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  upi_id: string;

  @ApiProperty()
  @IsString()
  @Length(1, 200)
  address1: string;

  @ApiProperty()
  @IsString()
  @Length(1, 200)
  address2: string;

  @ApiProperty()
  @IsString()
  mobile_number: string;

  @ApiProperty()
  @IsEmail()
  @IsOptional()
  email_id: string;

  @ApiProperty()
  @IsString()
  @Length(1, 50)
  aadhar_number: string;

  @ApiProperty()
  @IsString()
  @Length(1, 20)
  pan_card_number: string;

  @ApiProperty()
  @IsNumber()
  loan_amount: number;

  @ApiProperty()
  @IsNumber()
  processing_fees: number;

  @ApiProperty()
  @IsNumber()
  amount_recived: number;

  @ApiProperty()
  agent_id: string;

  @ApiProperty()
  @IsDateString()
  creation_date: Date;

  @ApiProperty()
  @IsString()
  @Length(1, 50)
  Loan_bank_name: string;

  @ApiProperty()
  @IsString()
  @Length(1, 30)
  Loan_branch_name: string;

  @ApiProperty()
  @IsString()
  @Length(1, 200)
  Loan_branch_address1: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  Loan_branch_address2: string;

  @ApiProperty()
  @IsString()
  @Length(1, 100)
  Loan_branch_mailid: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  Document_Stored_path: string;
}
