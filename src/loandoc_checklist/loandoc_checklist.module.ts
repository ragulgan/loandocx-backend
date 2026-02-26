import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanDocCheckListService } from './loandoc_checklist.service';
import { LoanDocCheckListController } from './loandoc_checklist.controller';
import { LoanDocCheckList } from './loandoc_checklist.entity';
import { ResponseService } from '../base/controller';
import { Loantype } from '../loanType/loantype.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LoanDocCheckList, Loantype])],
  controllers: [LoanDocCheckListController],
  providers: [LoanDocCheckListService, ResponseService],
  exports: [LoanDocCheckListService],
})
export class LoanDocCheckListModule {}