import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

// This loads the .env file for local use and allows Render's variables to be used in production
config();

// Destructure environment variables
const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE } = process.env;

// Guard clause to ensure all variables are present
if (!DB_HOST || !DB_PORT || !DB_USERNAME || !DB_PASSWORD || !DB_DATABASE) {
  throw new Error('One or more database environment variables are not defined.');
}

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: DB_HOST,
  port: parseInt(DB_PORT, 10),
  username: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_DATABASE,

  // --- THIS IS THE CRITICAL FIX ---
  // It enables SSL when NODE_ENV is 'production' (like on Render)
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
  // ------------------------------------

  // This path correctly points to your compiled entity files after `npm run build`
  entities: ['dist/database/entities/**/*.entity.js'],
  
  // This path correctly points to your compiled migration files
  migrations: ['dist/database/migrations/*.js'],
  
  migrationsTableName: 'migrations',
  synchronize: false, // Must be false for migrations to work properly
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;