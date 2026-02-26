import { Transaction } from 'src/transaction/transaction.entity';
import { User } from 'src/users/users.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, ManyToOne } from 'typeorm';

@Entity('loandocx_customers_loan_details')
export class CustomerLoanDetails {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  customer_id: string;

  @Column({ length: 50 })
  customer_name: string;

  @Column({ length: 20 })
  loan_name: string;

  @Column({ length: 100 })
  upi_id: string;

  @Column({ length: 200 })
  address1: string;

  @Column({ length: 200 })
  address2: string;

  @Column({ type: 'bigint' })
  mobile_number: string;

  @Column({ length: 100 })
  email_id: string;

  @Column({ length: 50 })
  aadhar_number: string;

  @Column({ length: 20 })
  pan_card_number: string;

  @Column('float')
  loan_amount: number;

  @Column('float')
  processing_fees: number;

  @Column('float')
  amount_recived: number;

  @Column({ type: 'bigint' })
  transaction_id: string;

  @Column({ type: 'bigint' })
  agent_id: string;

  @Column({ type: 'date' })
  creation_date: Date;

  @Column({ length: 50 })
  Loan_bank_name: string;

  @Column({ length: 30 })
  Loan_branch_name: string;

  @Column({ length: 200 })
  Loan_branch_address1: string;

  @Column({ length: 200 })
  Loan_branch_address2: string;

  @Column({ length: 100 })
  Loan_branch_mailid: string;

  @Column({ length: 100 })
  Document_Stored_path: string;

  @Column({ length: 64 })
  Device_ID: string;

  @Column({ length: 20 })
  platform: string;

  @OneToOne(() => Transaction, (tx) => tx.customerLoan)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;

  @ManyToOne(() => User, (user) => user.customerLoans)
  @JoinColumn({
    name: 'agent_id',
    referencedColumnName: 'user_id',
  })
  agent: User;
}
