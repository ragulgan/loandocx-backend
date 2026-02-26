import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanCompanyDetailService } from './company_details.service';
import { LoanCompanyDetailController } from './company_details.controller';
import { LoanCompanyDetails } from './company_details.entity';
import { ResponseService } from '../base/controller';

@Module({
  imports: [TypeOrmModule.forFeature([LoanCompanyDetails])],
  controllers: [LoanCompanyDetailController],
  providers: [LoanCompanyDetailService, ResponseService],
  exports: [LoanCompanyDetailService],
})
export class LoanCompanyModule {}