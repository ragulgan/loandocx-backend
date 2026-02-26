import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Min, IsOptional } from 'class-validator';

export class UpdateProcessingFeesDto {
  @ApiProperty({ description: 'Minimum loan amount (exclusive)', example: 2500000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  from_loan_amount: number;

  @ApiProperty({ description: 'Maximum loan amount (inclusive)', example: 7500000 })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  to_loan_amount: number;

  @ApiProperty({ description: 'Processing fees', example: 1000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  processing_fees: number;

  @ApiProperty({ description: 'AT fees', example: 1000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  AT_fees: number;

  @ApiProperty({ description: 'LU fees', example: 1000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  LU_fees: number;

  @ApiProperty({ description: 'LH fees', example: 1500 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  LH_fees: number;

  @ApiProperty({ description: 'CU fees', example: 1000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  CU_fees: number;
}