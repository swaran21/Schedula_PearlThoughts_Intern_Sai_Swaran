import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  PrimaryColumn ,
} from 'typeorm';
import { User } from './user.entity';
import { Appointment } from './appointment.entity';
import { Gender } from '../enums/gender.enum';

@Entity('patients')
export class Patient {

  @PrimaryColumn('uuid')
  user_id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, comment: 'Weight in kilograms' })
  weight: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, comment: 'Height in meters' })
  height: number;

  @Column({ type: 'text', nullable: true })
  medical_history: string;  

  @OneToMany(() => Appointment, (appointment) => appointment.patient)
  appointments: Appointment[];
}

