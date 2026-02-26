import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('loandocx_screens')
export class Screen {
  @PrimaryGeneratedColumn()
  screen_id: number;

  @Column({ type: 'varchar', length: 50 })
  screen_name: string;

  @Column({ type: 'varchar', length: 200 })
  screen_url: string;

  @Column({ type: 'char', length: 1 })
  screen_active: string;

  @Column({ type: 'varchar', length: 2 })
  user_type: string;
}