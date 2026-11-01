import dotenv from 'dotenv';

// Load .env variables first
dotenv.config();

function cleanEnvValue(val: string | undefined, prefix?: string): string {
  if (!val) return '';
  let str = val.trim();
  // Strip wrapping double or single quotes
  if (
    (str.startsWith('"') && str.endsWith('"')) ||
    (str.startsWith("'") && str.endsWith("'"))
  ) {
    str = str.slice(1, -1).trim();
  }
  // Strip accidental "VARIABLE_NAME=" prefix
  if (prefix && str.startsWith(`${prefix}=`)) {
    str = str.replace(new RegExp(`^${prefix}=`), '').trim();
    if (
      (str.startsWith('"') && str.endsWith('"')) ||
      (str.startsWith("'") && str.endsWith("'"))
    ) {
      str = str.slice(1, -1).trim();
    }
  }
  return str;
}

/**
 * Sanitizes all runtime environment variables for Vercel Serverless and Node:
 * - DATABASE_URL (removes accidental quotes that break node-pg hostname resolution)
 * - CLOUDINARY credentials (repairs malformed URLs or constructs from separate keys)
 * - OWNER_PIN and JWT_SECRET
 */
export function sanitizeEnvironment(): void {
  try {
    // 1. Sanitize DATABASE_URL
    if (process.env.DATABASE_URL) {
      const cleanedDb = cleanEnvValue(process.env.DATABASE_URL, 'DATABASE_URL');
      if (cleanedDb) {
        process.env.DATABASE_URL = cleanedDb;
      }
    }

    // 2. Sanitize OWNER_PIN and JWT_SECRET
    if (process.env.OWNER_PIN) {
      process.env.OWNER_PIN = cleanEnvValue(process.env.OWNER_PIN, 'OWNER_PIN');
    }
    if (process.env.JWT_SECRET) {
      process.env.JWT_SECRET = cleanEnvValue(process.env.JWT_SECRET, 'JWT_SECRET');
    }

    // 3. Sanitize individual Cloudinary variables
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      process.env.CLOUDINARY_CLOUD_NAME = cleanEnvValue(
        process.env.CLOUDINARY_CLOUD_NAME,
        'CLOUDINARY_CLOUD_NAME'
      );
    }
    if (process.env.CLOUDINARY_API_KEY) {
      process.env.CLOUDINARY_API_KEY = cleanEnvValue(
        process.env.CLOUDINARY_API_KEY,
        'CLOUDINARY_API_KEY'
      );
    }
    if (process.env.CLOUDINARY_API_SECRET) {
      process.env.CLOUDINARY_API_SECRET = cleanEnvValue(
        process.env.CLOUDINARY_API_SECRET,
        'CLOUDINARY_API_SECRET'
      );
    }

    // 4. Sanitize and validate CLOUDINARY_URL
    let rawCldUrl = cleanEnvValue(process.env.CLOUDINARY_URL, 'CLOUDINARY_URL');

    const hasPlaceholder =
      rawCldUrl.includes('<your_') ||
      rawCldUrl.includes('API_KEY:API_SECRET') ||
      rawCldUrl.includes('CLOUD_NAME') ||
      rawCldUrl.includes('your_api_key');

    const isValidUrl = rawCldUrl.startsWith('cloudinary://') && !hasPlaceholder;

    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
    const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim();
    const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim();

    const hasValidIndividualCreds =
      Boolean(cloudName && apiKey && apiSecret) &&
      !cloudName.includes('<') &&
      !apiKey.includes('<') &&
      !apiSecret.includes('<');

    if (isValidUrl) {
      process.env.CLOUDINARY_URL = rawCldUrl;
    } else if (hasValidIndividualCreds) {
      // Reconstruct valid CLOUDINARY_URL from separate credentials
      process.env.CLOUDINARY_URL = `cloudinary://${apiKey}:${apiSecret}@${cloudName}`;
    } else {
      // Delete invalid or placeholder URL so Cloudinary SDK does not throw fatal init error
      delete process.env.CLOUDINARY_URL;
    }
  } catch (err) {
    console.warn('[EnvSanitizer] Warning while sanitizing environment:', err);
  }
}

// Run immediately upon import
sanitizeEnvironment();
