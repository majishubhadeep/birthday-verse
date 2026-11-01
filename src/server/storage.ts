import './envSanitizer.ts';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from './config.ts';

// Safely configure Cloudinary if valid credentials exist
try {
  if (config.cloudinary.url && config.cloudinary.url.startsWith('cloudinary://')) {
    cloudinary.config({
      cloudinary_url: config.cloudinary.url,
    });
  } else if (
    config.cloudinary.cloudName &&
    config.cloudinary.apiKey &&
    config.cloudinary.apiSecret
  ) {
    cloudinary.config({
      cloud_name: config.cloudinary.cloudName,
      api_key: config.cloudinary.apiKey,
      api_secret: config.cloudinary.apiSecret,
      secure: true,
    });
  }
} catch (err) {
  console.warn('[Cloudinary Config Warning]:', err);
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadResult {
  url: string;
  provider: 'cloudinary' | 'local-static';
  publicId?: string;
  format?: string;
  bytes: number;
}

export function validateImageFile(file: Express.Multer.File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No image file uploaded.' };
  }
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported image format (${file.mimetype}). Please upload JPG, PNG, or WebP.`,
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 10MB.`,
    };
  }
  return { valid: true };
}

export async function uploadImageBuffer(
  buffer: Buffer,
  filename: string,
  mimetype: string
): Promise<UploadResult> {
  // 1. Try Cloudinary if configured
  if (config.isCloudinaryConfigured()) {
    try {
      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'birthday_verse_profiles',
            resource_type: 'image',
            transformation: [{ quality: 'auto:good' }, { fetch_format: 'auto' }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });

      return {
        url: result.secure_url,
        provider: 'cloudinary',
        publicId: result.public_id,
        format: result.format,
        bytes: result.bytes || buffer.length,
      };
    } catch (err: any) {
      console.error('[Cloudinary] Upload failed, falling back to static storage:', err);
    }
  }

  // 2. Fallback: Save to public/uploads directory for local dev
  const uploadDir = path.resolve(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const ext = mimetype.includes('png')
    ? '.png'
    : mimetype.includes('webp')
    ? '.webp'
    : '.jpg';

  const hash = crypto.randomBytes(8).toString('hex');
  const safeBase = filename.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 20);
  const finalFilename = `profile_${Date.now()}_${safeBase}_${hash}${ext}`;
  const targetPath = path.join(uploadDir, finalFilename);

  fs.writeFileSync(targetPath, buffer);

  return {
    url: `/uploads/${finalFilename}`,
    provider: 'local-static',
    bytes: buffer.length,
  };
}

export function getStorageStatus() {
  const isCloudinary = config.isCloudinaryConfigured();
  return {
    provider: isCloudinary ? 'Cloudinary (Cloud Object Storage)' : 'Local Static Fallback',
    isCloudStorage: isCloudinary,
    message: isCloudinary
      ? 'Permanent cloud image storage active via Cloudinary'
      : 'Using local static storage. Add CLOUDINARY_URL in Vercel / environment for production CDN.',
  };
}
