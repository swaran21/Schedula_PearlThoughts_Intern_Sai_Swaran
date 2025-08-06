import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Doctor } from './doctor.entity';

// Using numbers for weekdays: 0=Sunday, 1=Monday, ..., 6=Saturday
export enum Weekday {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

@Entity('recurring_availabilities')
export class RecurringAvailability {
  @PrimaryGeneratedColumn('uuid')
  recurring_availability_id: string;

  @Column({ name: 'doctor_user_id' })
  doctorUserId: string;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'doctor_user_id', referencedColumnName: 'user_id' })
  doctor: Doctor;

  @Column({
    type: 'enum',
    enum: Weekday,
  })
  weekday: Weekday; // 0 for Sunday, 1 for Monday, etc.

  @Column()
  session: string; // e.g., "Morning"

  @Column({ type: 'time' })
  start_time: string; // "10:00:00"

  @Column({ type: 'time' })
  end_time: string; // "13:00:00"

  @Column({ type: 'int' })
  max_tokens: number;
}