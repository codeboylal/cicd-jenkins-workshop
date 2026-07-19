const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'db',
  port: Number(process.env.POSTGRES_PORT) || 5432,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

// Postgres inside the compose network takes a few seconds to accept
// connections after it starts, so retry instead of crashing on boot.
async function waitForDb(retries = 10, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query('SELECT 1');
      console.log('Connected to Postgres');
      return;
    } catch (err) {
      console.log(`Postgres not ready yet (attempt ${attempt}/${retries}): ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('Could not connect to Postgres after multiple retries');
}

module.exports = { pool, waitForDb };
