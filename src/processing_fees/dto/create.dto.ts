import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Min } from 'class-validator';

export class CreateProcessingFeesDto {
  @ApiProperty({ description: 'Minimum loan amount (exclusive)', example: 2500000 })
  @IsNumber()
  @Min(0)
  from_loan_amount: number;

  @ApiProperty({ description: 'Maximum loan amount (inclusive)', example: 7500000 })
  @IsNumber()
  @IsPositive()
  to_loan_amount: number;

  @ApiProperty({ description: 'Processing fees', example: 1000 })
  @IsNumber()
  @Min(0)
  processing_fees: number;

  @ApiProperty({ description: 'AT fees', example: 1000 })
  @IsNumber()
  @Min(0)
  AT_fees: number;

  @ApiProperty({ description: 'LU fees', example: 1000 })
  @IsNumber()
  @Min(0)
  LU_fees: number;

  @ApiProperty({ description: 'LH fees', example: 1500 })
  @IsNumber()
  @Min(0)
  LH_fees: number;

  @ApiProperty({ description: 'CU fees', example: 1000 })
  @IsNumber()
  @Min(0)
  CU_fees: number;
}