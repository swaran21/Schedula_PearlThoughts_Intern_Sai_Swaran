import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';
import { UserRole } from '../enums/user-role.enum';
import { Chat } from './chat.entity';
import { Gender } from '../enums/gender.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  user_id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'int', nullable: true })
  age: number;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @OneToOne(() => Doctor, (doctor) => doctor.user)
  doctorProfile: Doctor;

  @OneToOne(() => Patient, (patient) => patient.user)
  patientProfile: Patient;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

