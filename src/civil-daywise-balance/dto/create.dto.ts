import { IsInt, IsDateString, IsNumber, IsOptional, IsString, Length } from 'class-validator';

export class CreateDaywiseCivilBalanceDto {
  @IsInt()
  civil_user_id: string;

  @IsString()
  @IsDateString()
  civil_completion_date: Date;

  @IsNumber()
  account_balance: number;

  @IsString()
  @Length(1, 1)
  payment_done: string;

  @IsOptional()
  @IsDateString()
  payment_on?: Date;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  payment_tran_id?: string;

  @IsOptional()
  @IsInt()
  payment_done_by?: number;
}