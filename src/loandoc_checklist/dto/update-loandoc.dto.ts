import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateLoanDocCheckListDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  doc_name: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  loan_id: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  doc_description: string;

  @ApiProperty({ example: 'Y/N', default: 'N' })
  @IsString()
  @IsOptional()
  doc_required_for_legal: string;

  @ApiProperty({ example: 'Y/N', default: 'N' })
  @IsString()
  @IsOptional()
  doc_required_for_civil: string;
}
