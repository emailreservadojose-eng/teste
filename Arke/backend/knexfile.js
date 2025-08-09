// backend/knexfile.js
import dotenv from 'dotenv';
dotenv.config();

export default {
  client: 'pg',
  connection: process.env.DATABASE_URL || {
    host: process.env.DB_HOST || '127.0.0.1',
    port: +(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'arke'
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: './db/migrations'
  },
  seeds: {
    directory: './db/seeds'
  },
  pool: { min: 2, max: 10 }
};
