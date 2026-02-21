import "dotenv/config";
import pg from "pg";

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();

  try {
    console.log("seeding database...\n");

    // Create system user if not exists (used by background ingest pipeline)
    const { rows: existingUsers } = await client.query(
      `SELECT id FROM users WHERE id = $1`,
      [SYSTEM_USER_ID],
    );

    if (existingUsers.length === 0) {
      await client.query(
        `INSERT INTO users (id, supabase_id, email, role, created_at, updated_at)
         VALUES ($1, 'system-crawler', 'crawler@curatedobjects.com', 'ADMIN', NOW(), NOW())`,
        [SYSTEM_USER_ID],
      );
      console.log("created system crawler user\n");
    } else {
      console.log("system crawler user already exists\n");
    }

    console.log("done!");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
