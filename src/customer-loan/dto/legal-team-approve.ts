import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class LegalTeamApproveDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  transactionId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  evaluationReport: string;
}