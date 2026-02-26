import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Loantype } from '../loanType/loantype.entity';

@Entity('loandocx_company_details')
export class LoanCompanyDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  company_name: string;

  @Column({ type: 'varchar', length: 50 })
  bank_name: string;

  @Column({ type: 'varchar', length: 50 })
  branch_name: string;

  @Column({ type: 'varchar', length: 100 })
  upi_id: string;

  @Column({ type: 'varchar', length: 100 })
  company_mail_id: string;
}