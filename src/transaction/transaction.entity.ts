// transactions.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/users.entity';
import { CustomerLoanDetails } from 'src/customer-loan/entities/customer_loan.entity';

@Entity('LoandocX_Transactions')
export class Transaction {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  transaction_id: string;

  @Column({ length: 50 })
  loan_name: string;

  @Column({ type: 'bigint' })
  customer_id: string;

  @OneToOne(() => CustomerLoanDetails, (cl) => cl.transaction)
  @JoinColumn({ name: 'customer_id' })
  customerLoan: CustomerLoanDetails;

  @Column({ type: 'bigint' })
  agent_id: string;

  @ManyToOne(() => User, (user) => user.agentTransactions)
  @JoinColumn({ name: 'agent_id', referencedColumnName: 'user_id' })
  agent: User;

  @Column({ type: 'date' })
  trans_creation_date: Date;

  @Column({ type: 'char', length: 1 })
  transaction_state: string;

  @Column()
  trans_state_modified_by: number;

  @ManyToOne(() => User, (user) => user.adminTransactions)
  @JoinColumn({ name: 'trans_state_modified_by', referencedColumnName: 'user_id' })
  admin: User;

  @Column({ type: 'date' })
  trans_state_modified_on: string;

  @Column()
  legal_team_user: number;

  @ManyToOne(() => User, (user) => user.legalTeamTransactions)
  @JoinColumn({ name: 'legal_team_user', referencedColumnName: 'user_id' })
  legalTeamUser: User;

  @Column({ type: 'date' })
  legal_team_job_allocation_date: string;

  @Column({ type: 'date' })
  legal_team_job_completion_date: Date;

  @Column()
  civil_team_user: number;

  @ManyToOne(() => User, (user) => user.civilTeamTransactions)
  @JoinColumn({ name: 'civil_team_user', referencedColumnName: 'user_id' })
  civilTeamUser: User;

  @Column({ type: 'date' })
  civil_team_job_allocation_date: string;

  @Column({ type: 'date' })
  civil_team_job_completion_date: Date;

  @Column()
  legal_head_user: number;

  @ManyToOne(() => User, (user) => user.legalHeadTransactions)
  @JoinColumn({ name: 'legal_head_user', referencedColumnName: 'user_id' })
  legalHeadUser: User;

  @Column({ type: 'date' })
  legal_head_job_allocation_date: Date;

  @Column({ type: 'date' })
  legal_head_job_completion_date: Date;

  @Column({ type: 'longtext' })
  legal_team_report: string;

  @Column({ length: 100 })
  legal_send_courier_name: string;

  @Column({ length: 50 })
  legal_courier_tracking_id: string;

  @Column({ type: 'date' })
  legal_courier_date: Date;

  @Column({ length: 100 })
  civil_send_courier_name: string;

  @Column({ length: 50 })
  civil_courier_tracking_id: string;

  @Column({ type: 'date' })
  civil_courier_date: Date;
}
