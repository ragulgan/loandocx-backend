import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('loandocx_loan_processing_fees')
export class LoanProcessingFees {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'float' })
  from_loan_amount: number;

  @Column({ type: 'float' })
  to_loan_amount: number;

  @Column({ type: 'float' })
  processing_fees: number;

  @Column({ type: 'float' })
  AT_fees: number;

  @Column({ type: 'float' })
  LU_fees: number;

  @Column({ type: 'float' })
  LH_fees: number;

  @Column({ type: 'float' })
  CU_fees: number;
}