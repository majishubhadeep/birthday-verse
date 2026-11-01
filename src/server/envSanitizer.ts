import dotenv from 'dotenv';

// Load .env variables first
dotenv.config();

/**
 * Sanitizes CLOUDINARY_URL and other configuration variables.
 * Prevents fatal server crash if CLOUDINARY_URL contains:
 * - A prepended "CLOUDINARY_URL="
 * - Unreplaced placeholder tokens like <your_api_key> or API_KEY:API_SECRET
 * - Missing or invalid cloudinary:// protocol
 * If individual credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)
 * are provided, constructs the canonical CLOUDINARY_URL automatically.
 */
export function sanitizeEnvironment(): void {
  try {
    let raw = (process.env.CLOUDINARY_URL || '').trim();

    // Remove wrapping quotes if present
    if (
      (raw.startsWith('"') && raw.endsWith('"')) ||
      (raw.startsWith("'") && raw.endsWith("'"))
    ) {
      raw = raw.slice(1, -1).trim();
    }

    // Remove leading "CLOUDINARY_URL=" prefix if accidentally pasted with key
    if (raw.startsWith('CLOUDINARY_URL=')) {
      raw = raw.replace(/^CLOUDINARY_URL=/, '').trim();
    }

    const hasPlaceholder =
      raw.includes('<your_') ||
      raw.includes('API_KEY:API_SECRET') ||
      raw.includes('CLOUD_NAME') ||
      raw.includes('your_api_key');

    const isValidUrl = raw.startsWith('cloudinary://') && !hasPlaceholder;

    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
    const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim();
    const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim();

    const hasValidIndividualCreds =
      Boolean(cloudName && apiKey && apiSecret) &&
      !cloudName.includes('<') &&
      !apiKey.includes('<') &&
      !apiSecret.includes('<');

    if (isValidUrl) {
      process.env.CLOUDINARY_URL = raw;
    } else if (hasValidIndividualCreds) {
      // Reconstruct valid CLOUDINARY_URL from separate credentials
      process.env.CLOUDINARY_URL = `cloudinary://${apiKey}:${apiSecret}@${cloudName}`;
    } else {
      // Delete invalid or placeholder URL so Cloudinary SDK does not throw fatal init error
      delete process.env.CLOUDINARY_URL;
    }
  } catch (err) {
    console.warn('[EnvSanitizer] Warning while sanitizing environment:', err);
    delete process.env.CLOUDINARY_URL;
  }
}

// Run immediately upon import
sanitizeEnvironment();
