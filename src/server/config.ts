import './envSanitizer.ts';
import dotenv from 'dotenv';
dotenv.config();

// CLI argument '--port 3000' or default to 3000
const portArgIdx = process.argv.indexOf('--port');
const cliPort = portArgIdx !== -1 && process.argv[portArgIdx + 1] ? parseInt(process.argv[portArgIdx + 1], 10) : undefined;
const resolvedPort = cliPort || (process.env.NODE_ENV === 'production' && process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);

export const config = {
  port: resolvedPort,
  databaseUrl: process.env.DATABASE_URL || '',
  ownerPin: process.env.OWNER_PIN || process.env.OWNER_SECRET_KEY || 'Shubhade#7002',
  jwtSecret: process.env.JWT_SECRET || 'birthday-verse-owner-secret-key-2026',
  get cloudinary() {
    return {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      apiKey: process.env.CLOUDINARY_API_KEY || '',
      apiSecret: process.env.CLOUDINARY_API_SECRET || '',
      url: process.env.CLOUDINARY_URL || '',
    };
  },
  isCloudinaryConfigured(): boolean {
    const c = this.cloudinary;
    const hasValidUrl =
      c.url.startsWith('cloudinary://') &&
      !c.url.includes('<') &&
      !c.url.includes('API_KEY:API_SECRET');
    const hasValidCreds =
      Boolean(c.cloudName && c.apiKey && c.apiSecret) &&
      !c.cloudName.includes('<') &&
      !c.apiKey.includes('<') &&
      !c.apiSecret.includes('<');
    return hasValidUrl || hasValidCreds;
  },
  isDatabaseConfigured(): boolean {
    return !!this.databaseUrl;
  },
};
