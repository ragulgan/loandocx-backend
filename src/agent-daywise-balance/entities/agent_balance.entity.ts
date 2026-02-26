import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from 'src/users/users.entity';

@Entity('loandocx_daywise_agent_balance')
export class DaywiseAgentBalance {
  @PrimaryColumn({ type: 'bigint' })
  agent_id: string;

  @PrimaryColumn({ type: 'date' })
  trans_aproved_date: string;

  @Column({ type: 'float' })
  account_balance: number;

  @Column({
    type: 'char',
    length: 1,
    default: 'N',
  })
  payment_done: string;

  @Column({ type: 'date' })
  payment_on: Date;

  @Column({ type: 'varchar', length: 50 })
  payment_tran_id: string;

  @Column({ type: 'int' })
  payment_done_by: number;

  @ManyToOne(() => User, (user) => user.daywiseAgentBalances)
  @JoinColumn({ name: 'agent_id', referencedColumnName: 'user_id' })
  agent: User;
}
