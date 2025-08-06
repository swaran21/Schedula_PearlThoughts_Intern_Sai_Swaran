import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Doctor } from './doctor.entity';

@Entity('slots')
export class Slot {
  @PrimaryGeneratedColumn('uuid')
  slot_id: string;

  @Column({ name: 'doctor_user_id' })
  doctorUserId: string;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'doctor_user_id', referencedColumnName: 'user_id' })
  doctor: Doctor;

  @Column({ type: 'date' })
  date: string; // e.g., "2025-07-18"

  @Column()
  session: string; // e.g., "Morning"

  @Column({ type: 'time' })
  start_time: string; // e.g., "10:00:00"

  @Column({ type: 'time' })
  end_time: string; // e.g., "12:00:00"

  @Column({ type: 'int' })
  max_tokens: number;

  @Column({ type: 'int', default: 0 })
  tokens_issued: number;
  
  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}