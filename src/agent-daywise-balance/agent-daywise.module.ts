import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DaywiseAgentBalance } from './entities/agent_balance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DaywiseAgentBalance])],
})
export class AgentDayWiseBalanceModule {}