import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerLoanDetailService } from './customer_loan.service';
import { CustomerLoanDetailController } from './customer_loan.controller';
import { Transaction, TransactionArchive } from '../transaction/entities/transaction.entity';
import { ResponseService } from '../base/controller';
import { CustomerLoanDetails } from './entities/customer_loan.entity';
import { DaywiseAgentBalance } from 'src/agent-daywise-balance/entities/agent_balance.entity';
import { LoanProcessingFees } from 'src/processing_fees/entities/processing.entity';
import { LoanDocCheckList } from 'src/loandoc_checklist/entities/loandoc_checklist.entity';
import { Loantype } from 'src/loanType/entities/loantype.entity';
import { DaywiseCivilBalance } from 'src/civil-daywise-balance/entities/civil_balance.entity';
import { S3Service } from './s3.service';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';

@Module({
  imports: [TypeOrmModule.forFeature([
    CustomerLoanDetails,
    Transaction,
    TransactionArchive,
    DaywiseAgentBalance,
    LoanProcessingFees,
    LoanDocCheckList, 
    Loantype, 
    DaywiseCivilBalance
  ]),
    MulterModule.register({
      storage: multer.memoryStorage(),
    })],
  controllers: [CustomerLoanDetailController],
  providers: [CustomerLoanDetailService, ResponseService, S3Service],
  exports: [CustomerLoanDetailService],
})
export class CustomerLoanDetailsModule {}