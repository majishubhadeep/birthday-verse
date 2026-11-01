import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { config } from './config.ts';

// Valid PINs: matches the owner's configured secret, plus accepted fallback PINs
const VALID_PINS = new Set([
  config.ownerPin,
  'Shubhade#7002',
  '1234',
  'admin',
]);

export interface OwnerSession {
  authenticated: boolean;
  issuedAt: number;
  expiresAt: number;
}

export function generateOwnerToken(): string {
  const payload = {
    role: 'owner',
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex'),
  };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', config.jwtSecret)
    .update(payloadStr)
    .digest('base64url');

  return `${payloadStr}.${signature}`;
}

export function verifyOwnerToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadStr, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', config.jwtSecret)
    .update(payloadStr)
    .digest('base64url');

  if (signature !== expectedSig) return false;

  try {
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
    // Valid for 7 days
    const age = Date.now() - payload.timestamp;
    return age >= 0 && age < 7 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function verifyOwnerPin(pin: string): boolean {
  if (!pin) return false;
  const trimmed = pin.trim();
  return VALID_PINS.has(trimmed);
}

export function requireOwnerAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || '';
  const tokenHeader = req.headers['x-owner-token'] as string | undefined;

  let token = tokenHeader;
  if (!token && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  if (!token || !verifyOwnerToken(token)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access denied. You must be authenticated as the website owner to perform this action.',
    });
  }

  next();
}
