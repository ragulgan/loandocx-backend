import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoantypeService } from './loantype.service';
import { LoanTypeController } from './loantype.controller';
import { Loantype } from './loantype.entity';
import { ResponseService } from '../base/controller';

@Module({
  imports: [TypeOrmModule.forFeature([Loantype])],
  controllers: [LoanTypeController],
  providers: [LoantypeService, ResponseService],
  exports: [LoantypeService],
})
export class LoanTypeModule {}
