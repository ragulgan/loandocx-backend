import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DaywiseCivilBalance } from './entities/civil_balance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DaywiseCivilBalance])],
})
export class CivilDayWiseBalanceModule {}