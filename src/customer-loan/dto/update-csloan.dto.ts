import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEmail, IsDateString, Length } from 'class-validator';

export class UpdateCustomerLoanDetailsDto {
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
  @Length(1, 100)
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
  @Length(1, 200)
  Loan_branch_address2: string;

  @ApiProperty()
  @IsString()
  @Length(1, 100)
  Loan_branch_mailid: string;

  @ApiProperty()
  @IsString()
  @Length(1, 100)
  Document_Stored_path: string;

  @ApiProperty()
  @IsString()
  @Length(1, 64)
  Device_ID: string;

  @ApiProperty()
  @IsString()
  @Length(1, 20)
  platform: string;
}
