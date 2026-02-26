import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateLoanDocCheckListDto {
  @ApiProperty()
  @IsString()
  doc_name: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  loan_id: number; 

  @ApiProperty()
  @IsString()
  doc_description: string;

  @ApiProperty({ example: 'Y/N', default: 'N' })
  @IsString()
  doc_required_for_legal: string;

  @ApiProperty({ example: 'Y/N', default: 'N' })
  @IsString()
  doc_required_for_civil: string;
}