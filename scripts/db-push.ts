import '../src/server/envSanitizer.ts';
import pg from 'pg';
import { INITIAL_PROFILES } from '../src/data/initialProfiles.ts';
import { config } from '../src/server/config.ts';

const { Pool } = pg;

async function runMigrationAndSeed() {
  console.log('----------------------------------------------------');
  console.log('🚀 Neon PostgreSQL Database Migration & Seeding Tool');
  console.log('----------------------------------------------------');

  if (!config.databaseUrl) {
    console.error('❌ Error: DATABASE_URL environment variable is not defined.');
    process.exit(1);
  }

  // Obfuscate credentials in output for safety
  const safeDbUrl = config.databaseUrl.replace(/:([^:@]+)@/, ':****@');
  console.log(`🔌 Target Database: ${safeDbUrl}`);

  const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database successfully.\n');

    console.log('1️⃣  Running migrations (ensuring schema & columns)...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id VARCHAR(120) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        gender VARCHAR(30) NOT NULL,
        birthdate VARCHAR(50) NOT NULL,
        photo_url TEXT NOT NULL,
        photo_position VARCHAR(100) DEFAULT 'center 20%',
        photo_scale REAL DEFAULT 1.15,
        original_photo_url TEXT,
        relationship VARCHAR(100) DEFAULT 'Friend',
        wish TEXT NOT NULL,
        quote TEXT NOT NULL,
        quote_author VARCHAR(255) DEFAULT 'Birthday Verse',
        song_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Table "profiles" schema migrated and ready.\n');

    console.log(`2️⃣  Seeding and syncing ${INITIAL_PROFILES.length} profile records...`);
    let inserted = 0;
    let updated = 0;

    for (const p of INITIAL_PROFILES) {
      const res = await client.query(
        `INSERT INTO profiles (
          id, name, gender, birthdate, photo_url, photo_position,
          photo_scale, original_photo_url, relationship, wish,
          quote, quote_author, song_url, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          gender = EXCLUDED.gender,
          birthdate = EXCLUDED.birthdate,
          photo_url = EXCLUDED.photo_url,
          photo_position = EXCLUDED.photo_position,
          photo_scale = EXCLUDED.photo_scale,
          original_photo_url = EXCLUDED.original_photo_url,
          relationship = EXCLUDED.relationship,
          wish = EXCLUDED.wish,
          quote = EXCLUDED.quote,
          quote_author = EXCLUDED.quote_author,
          song_url = EXCLUDED.song_url,
          updated_at = NOW()
        RETURNING (xmax = 0) AS was_inserted;`,
        [
          p.id,
          p.name,
          p.gender,
          p.birthdate,
          p.photoUrl,
          p.photoPosition || 'center 20%',
          p.photoScale || 1.15,
          p.originalPhotoUrl || p.photoUrl,
          p.relationship || 'Friend',
          p.wish,
          p.quote,
          p.quoteAuthor || 'Birthday Verse',
          p.songUrl || null,
        ]
      );

      if (res.rows[0]?.was_inserted) {
        inserted++;
      } else {
        updated++;
      }
    }

    const countRes = await client.query('SELECT COUNT(*) FROM profiles');
    const totalCount = parseInt(countRes.rows[0].count, 10);

    console.log(`✅ Seeding complete:`);
    console.log(`   - Newly inserted: ${inserted}`);
    console.log(`   - Synchronized/Updated: ${updated}`);
    console.log(`   - Total active profiles in database: ${totalCount}\n`);

    client.release();
    await pool.end();
    console.log('🎉 Database migration and seed finished successfully!');
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
    await pool.end();
    process.exit(1);
  }
}

runMigrationAndSeed();
