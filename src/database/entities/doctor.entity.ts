import { Entity, Column, OneToOne, JoinColumn, OneToMany, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { Appointment } from './appointment.entity';
import { Slot } from './slot.entity';
import { RecurringAvailability } from './recurring-availability.entity';

@Entity('doctors')
export class Doctor {
  
  @PrimaryColumn('uuid')
  user_id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int', default: 0 })
  yeo: number;

  @OneToMany(() => RecurringAvailability, (ra) => ra.doctor)
  recurring_availabilities: RecurringAvailability[];

  @Column()
  specialization: string;

  @Column({ type: 'jsonb', nullable: true, comment: 'Stores doctor availability rules' })
  availability_schedule: any;

  @Column("text", { array: true, nullable: true })
  services: string[];

  @OneToMany(() => Appointment, (appointment) => appointment.doctor)
  appointments: Appointment[];

  @OneToMany(() => Slot, (slot) => slot.doctor)
  slots: Slot[];

}