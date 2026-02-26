import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessingFeesService } from './processing.service';
import { ProcessingFeesController } from './processing.controller';
import { LoanProcessingFees } from './processing.entity';
import { ResponseService } from '../base/controller';

@Module({
  imports: [TypeOrmModule.forFeature([LoanProcessingFees])],
  controllers: [ProcessingFeesController],
  providers: [ProcessingFeesService, ResponseService],
  exports: [ProcessingFeesService],
})
export class ProcessingFeesModule {}
