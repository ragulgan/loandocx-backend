import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { LoanDocCheckList } from '../loandoc_checklist/loandoc_checklist.entity';

@Entity('loandocx_loan_types')
export class Loantype {
  @PrimaryGeneratedColumn()
  loan_id: number;

  @Column({ type: 'varchar', length: 50, nullable: false })
  loan_name: string;

  @Column({ type: 'char', length: 1, nullable: false })
  loan_active: string;

  @OneToMany(() => LoanDocCheckList, (doc) => doc.loan)
  docs: LoanDocCheckList[];
}