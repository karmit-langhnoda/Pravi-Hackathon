import { pool } from './pgClient.js';
import { logger } from './logger.js';

export const connectDB = async () => {
  try {
    const res = await pool.query('SELECT NOW() as current_time, version()');
    logger.info(`✅ Supabase PostgreSQL connected! DB Time: ${res.rows[0].current_time}`);
  } catch (error) {
    logger.error({ err: error }, '❌ Supabase PostgreSQL connection failed');
    process.exit(1);
  }
};

export const closeDB = async () => {
  try {
    await pool.end();
    logger.info('PostgreSQL pool closed');
  } catch (err) {
    logger.error({ err }, 'Error closing PostgreSQL pool');
  }
};

