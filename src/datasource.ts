import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
// Import ALL your entity classes
import { User } from './database/entities/user.entity';
import { Doctor } from './database/entities/doctor.entity';
import { Patient } from './database/entities/patient.entity';
import { Appointment } from './database/entities/appointment.entity';
import { Slot } from './database/entities/slot.entity';
import { Chat } from './database/entities/chat.entity';
import { RescheduleHistory } from './database/entities/reschedule-history.entity';

config();

const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE } = process.env;

if (!DB_HOST || !DB_PORT || !DB_USERNAME || !DB_PASSWORD || !DB_DATABASE) {
  throw new Error(
    'One or more database environment variables are not defined. Please check your .env file.',
  );
}

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: DB_HOST,
  port: parseInt(DB_PORT, 10),
  username: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  // EITHER use glob patterns (as before) OR list entities explicitly.
  // Using glob patterns is generally more robust as you don't have to remember to update this file.
  // Let's stick with the glob pattern but ensure it's correct.
  entities: ['dist/**/*.entity.js'], // This pattern should find all .entity.js files in dist.
  
  // OR, if you prefer explicit listing (less recommended):
  // entities: [User, Doctor, Patient, Appointment, Slot, Chat, RescheduleHistory],
  
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false,
  migrationsTableName: 'migrations',
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;