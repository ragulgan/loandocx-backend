import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, BeforeInsert, BeforeUpdate, OneToMany } from 'typeorm';
import { Transaction } from '../transaction/transaction.entity';
import * as bcrypt from 'bcrypt';
import { CustomerLoanDetails } from 'src/customer-loan/entities/customer_loan.entity';
import { DaywiseAgentBalance } from 'src/agent-daywise-balance/entities/agent_balance.entity';
import { DaywiseCivilBalance } from 'src/civil-daywise-balance/entities/civil_balance.entity';

@Entity('loandocx_users_profile')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  user_id: string;

  @Column({ type: 'varchar', length: 50 })
  user_name: string;

  @Column({ type: 'varchar', length: 2 })
  user_type: string;

  @OneToMany(() => CustomerLoanDetails, (loan) => loan.agent)
  customerLoans: CustomerLoanDetails[];

  @OneToMany(() => Transaction, (tx) => tx.agent)
  agentTransactions: Transaction[];

  @OneToMany(() => Transaction, (tx) => tx.legalTeamUser)
  legalTeamTransactions: Transaction[];

  @OneToMany(() => Transaction, (tx) => tx.civilTeamUser)
  civilTeamTransactions: Transaction[];

  @OneToMany(() => Transaction, (tx) => tx.legalHeadUser)
  legalHeadTransactions: Transaction[];

  @OneToMany(() => Transaction, (tx) => tx.admin)
  adminTransactions: Transaction[];

  @OneToMany(() => DaywiseAgentBalance,(balance) => balance.agent)
  daywiseAgentBalances: DaywiseAgentBalance[];

  @OneToMany(() => DaywiseCivilBalance,(balance) => balance.civil)
  daywiseCivilBalances: DaywiseCivilBalance[];

  @Column({ type: 'varchar', length: 255, select: false })
  user_pwd: string;

  @Column({ type: 'varchar', length: 100 })
  upi_id: string;

  @Column({ type: 'varchar', length: 200 })
  address1: string;

  @Column({ type: 'varchar', length: 200 })
  address2: string;

  @Column({ type: 'bigint' })
  mobile_number: string;

  @Column({ type: 'varchar', length: 100 })
  email_id: string;

  @Column({ type: 'varchar', length: 50 })
  aadhar_number: string;

  @Column({ type: 'char', length: 1 })
  user_active: string;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.user_pwd) {
      const salt = await bcrypt.genSalt(10);
      this.user_pwd = await bcrypt.hash(this.user_pwd, salt);
    }
  }
}
