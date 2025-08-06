import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Appointment } from './appointment.entity';

@Entity('reschedule_history')
export class RescheduleHistory {
  @PrimaryGeneratedColumn('uuid')
  reschedule_id: string;

  @Column()
  appointment_id: string;

  @ManyToOne(() => Appointment, (appointment) => appointment.reschedule_logs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @Column({ type: 'timestamp with time zone' })
  original_date: Date;

  @Column({ type: 'timestamp with time zone' })
  new_date: Date;

  @Column({ type: 'text' })
  reason: string;

  @CreateDateColumn()
  logged_at: Date;
}

