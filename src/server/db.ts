import pg from 'pg';
import fs from 'fs';
import path from 'path';
import type { Profile } from '../types/index.ts';
import { INITIAL_PROFILES } from '../data/initialProfiles.ts';
import { config } from './config.ts';

const { Pool } = pg;

let pool: pg.Pool | null = null;
let isPostgresInitialized = false;

// Fallback JSON data store path for local development before DATABASE_URL is set
const LOCAL_DATA_DIR = path.resolve(process.cwd(), 'data');
const LOCAL_DATA_FILE = path.join(LOCAL_DATA_DIR, 'profiles.json');

function ensureLocalDataDir() {
  if (!fs.existsSync(LOCAL_DATA_DIR)) {
    fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOCAL_DATA_FILE)) {
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(INITIAL_PROFILES, null, 2), 'utf8');
  }
}

function getLocalProfiles(): Profile[] {
  ensureLocalDataDir();
  try {
    const raw = fs.readFileSync(LOCAL_DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PROFILES;
  } catch (err) {
    console.error('Failed to read local profiles fallback:', err);
    return INITIAL_PROFILES;
  }
}

function saveLocalProfiles(profiles: Profile[]) {
  ensureLocalDataDir();
  fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(profiles, null, 2), 'utf8');
}

export async function getDbPool(): Promise<pg.Pool | null> {
  if (pool) return pool;
  if (!config.databaseUrl) {
    return null;
  }

  try {
    pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err);
    });

    return pool;
  } catch (err) {
    console.error('Failed to create PostgreSQL pool:', err);
    return null;
  }
}

export async function initDatabase(): Promise<boolean> {
  const currentPool = await getDbPool();
  if (!currentPool) {
    console.log('[Database] No DATABASE_URL provided. Using persistent file-store fallback.');
    ensureLocalDataDir();
    return false;
  }

  try {
    const client = await currentPool.connect();
    try {
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

      // Check if table is empty, if so, seed from INITIAL_PROFILES
      const res = await client.query('SELECT COUNT(*) FROM profiles');
      const count = parseInt(res.rows[0].count, 10);

      if (count === 0) {
        console.log('[Database] Seeding initial profiles into Neon PostgreSQL...');
        for (const p of INITIAL_PROFILES) {
          await client.query(
            `INSERT INTO profiles (
              id, name, gender, birthdate, photo_url, photo_position,
              photo_scale, original_photo_url, relationship, wish,
              quote, quote_author, song_url, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
            ON CONFLICT (id) DO NOTHING`,
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
        }
        console.log(`[Database] Successfully seeded ${INITIAL_PROFILES.length} profiles.`);
      }

      isPostgresInitialized = true;
      console.log('[Database] PostgreSQL connected and initialized successfully.');
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[Database] Failed to initialize PostgreSQL table:', err);
    return false;
  }
}

function mapRowToProfile(row: any): Profile {
  return {
    id: row.id,
    name: row.name,
    gender: row.gender,
    birthdate: row.birthdate,
    photoUrl: row.photo_url,
    photoPosition: row.photo_position || 'center 20%',
    photoScale: row.photo_scale ? parseFloat(row.photo_scale) : 1.15,
    originalPhotoUrl: row.original_photo_url || row.photo_url,
    relationship: row.relationship || 'Friend',
    wish: row.wish,
    quote: row.quote,
    quoteAuthor: row.quote_author || 'Birthday Verse',
    songUrl: row.song_url || undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
  };
}

export async function getAllProfiles(): Promise<Profile[]> {
  const currentPool = await getDbPool();
  if (currentPool && isPostgresInitialized) {
    try {
      const res = await currentPool.query('SELECT * FROM profiles ORDER BY name ASC');
      if (res.rows && res.rows.length > 0) {
        return res.rows.map(mapRowToProfile);
      }
    } catch (err) {
      console.error('Error querying profiles from PostgreSQL, using fallback:', err);
    }
  }
  return getLocalProfiles();
}

export async function saveProfileToDb(profile: Profile): Promise<Profile> {
  const currentPool = await getDbPool();
  if (currentPool && isPostgresInitialized) {
    try {
      await currentPool.query(
        `INSERT INTO profiles (
          id, name, gender, birthdate, photo_url, photo_position,
          photo_scale, original_photo_url, relationship, wish,
          quote, quote_author, song_url, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
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
          updated_at = NOW()`,
        [
          profile.id,
          profile.name,
          profile.gender,
          profile.birthdate,
          profile.photoUrl,
          profile.photoPosition || 'center 20%',
          profile.photoScale || 1.15,
          profile.originalPhotoUrl || profile.photoUrl,
          profile.relationship || 'Friend',
          profile.wish,
          profile.quote,
          profile.quoteAuthor || 'Birthday Verse',
          profile.songUrl || null,
        ]
      );
      return profile;
    } catch (err) {
      console.error('Error saving profile to PostgreSQL, saving to fallback:', err);
    }
  }

  // Fallback to local file store
  const list = getLocalProfiles();
  const index = list.findIndex((p) => p.id === profile.id);
  if (index >= 0) {
    list[index] = profile;
  } else {
    list.unshift(profile);
  }
  saveLocalProfiles(list);
  return profile;
}

export async function deleteProfileFromDb(id: string): Promise<boolean> {
  const currentPool = await getDbPool();
  if (currentPool && isPostgresInitialized) {
    try {
      await currentPool.query('DELETE FROM profiles WHERE id = $1', [id]);
      return true;
    } catch (err) {
      console.error('Error deleting profile from PostgreSQL:', err);
    }
  }

  const list = getLocalProfiles();
  const filtered = list.filter((p) => p.id !== id);
  saveLocalProfiles(filtered);
  return true;
}

export async function resetProfilesInDb(defaults: Profile[] = INITIAL_PROFILES): Promise<Profile[]> {
  const currentPool = await getDbPool();
  if (currentPool && isPostgresInitialized) {
    try {
      await currentPool.query('DELETE FROM profiles');
      for (const p of defaults) {
        await currentPool.query(
          `INSERT INTO profiles (
            id, name, gender, birthdate, photo_url, photo_position,
            photo_scale, original_photo_url, relationship, wish,
            quote, quote_author, song_url, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
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
      }
      return defaults;
    } catch (err) {
      console.error('Error resetting profiles in PostgreSQL:', err);
    }
  }

  saveLocalProfiles(defaults);
  return defaults;
}

export async function importProfilesToDb(profiles: Profile[]): Promise<Profile[]> {
  for (const p of profiles) {
    await saveProfileToDb(p);
  }
  return getAllProfiles();
}

export async function getDbStatus(): Promise<{
  connected: boolean;
  provider: 'neon-postgresql' | 'local-store';
  count: number;
  message: string;
}> {
  const currentPool = await getDbPool();
  if (currentPool && isPostgresInitialized) {
    try {
      const res = await currentPool.query('SELECT COUNT(*) FROM profiles');
      const count = parseInt(res.rows[0].count, 10);
      return {
        connected: true,
        provider: 'neon-postgresql',
        count,
        message: 'Connected to persistent Neon PostgreSQL database',
      };
    } catch (err: any) {
      return {
        connected: false,
        provider: 'local-store',
        count: getLocalProfiles().length,
        message: `PostgreSQL connection issue: ${err.message}`,
      };
    }
  }
  return {
    connected: false,
    provider: 'local-store',
    count: getLocalProfiles().length,
    message: 'Running on local persistent store. Provide DATABASE_URL for Neon PostgreSQL.',
  };
}
