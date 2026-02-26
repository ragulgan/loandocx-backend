import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { CustomerLoanDetails } from 'src/customer-loan/entities/customer_loan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, CustomerLoanDetails])],
})
export class TransactionModule {}