import { IsInt, IsDateString, IsNumber, IsOptional, IsString, Length } from 'class-validator';

export class CreateDaywiseAgentBalanceDto {
  @IsInt()
  agent_id: string;

  @IsString()
  @IsDateString()
  trans_aproved_date: Date;

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