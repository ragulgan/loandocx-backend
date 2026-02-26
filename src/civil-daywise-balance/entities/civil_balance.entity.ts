import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from 'src/users/entities/users.entity';

@Entity('loandocx_daywise_civil_user_balance')
export class DaywiseCivilBalance {
  @PrimaryColumn({ type: 'bigint' })
  civil_user_id: string;

  @PrimaryColumn({ type: 'date' })
  civil_completion_date: string;

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

  @ManyToOne(() => User, (user) => user.daywiseCivilBalances)
  @JoinColumn({ name: 'civil_user_id', referencedColumnName: 'user_id' })
  civil: User;
}
