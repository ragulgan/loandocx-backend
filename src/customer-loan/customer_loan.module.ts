import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerLoanDetailService } from './customer_loan.service';
import { CustomerLoanDetailController } from './customer_loan.controller';
import { Transaction } from '../transaction/transaction.entity';
import { ResponseService } from '../base/controller';
import { CustomerLoanDetails } from './entities/customer_loan.entity';
import { DaywiseAgentBalance } from 'src/agent-daywise-balance/entities/agent_balance.entity';
import { LoanProcessingFees } from 'src/processing_fees/processing.entity';
import { LoanDocCheckList } from 'src/loandoc_checklist/loandoc_checklist.entity';
import { Loantype } from 'src/loanType/loantype.entity';
import { DaywiseCivilBalance } from 'src/civil-daywise-balance/entities/civil_balance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    CustomerLoanDetails,
    Transaction,
    DaywiseAgentBalance,
    LoanProcessingFees,
    LoanDocCheckList, 
    Loantype, 
    DaywiseCivilBalance
  ])],
  controllers: [CustomerLoanDetailController],
  providers: [CustomerLoanDetailService, ResponseService],
  exports: [CustomerLoanDetailService],
})
export class CustomerLoanDetailsModule {}