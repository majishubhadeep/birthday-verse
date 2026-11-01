import { Router, Request, Response } from 'express';
import multer from 'multer';
import {
  getAllProfiles,
  saveProfileToDb,
  deleteProfileFromDb,
  resetProfilesInDb,
  importProfilesToDb,
  getDbStatus,
} from './db.ts';
import { uploadImageBuffer, validateImageFile, getStorageStatus } from './storage.ts';
import { verifyOwnerPin, generateOwnerToken, requireOwnerAuth, verifyOwnerToken } from './auth.ts';
import type { Profile } from '../types/index.ts';

export const apiRouter = Router();

// Configure Multer for in-memory uploads with 10MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// 1. Health & Status
apiRouter.get('/status', async (_req: Request, res: Response) => {
  try {
    const dbStatus = await getDbStatus();
    const storageStatus = getStorageStatus();
    res.json({
      success: true,
      database: dbStatus,
      storage: storageStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Owner Auth Login
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { pin } = req.body || {};
  if (!pin || typeof pin !== 'string') {
    return res.status(400).json({ success: false, message: 'Owner PIN or password is required.' });
  }

  if (verifyOwnerPin(pin)) {
    const token = generateOwnerToken();
    return res.json({
      success: true,
      token,
      message: 'Owner authentication successful.',
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Incorrect PIN. Please enter the correct owner PIN.',
  });
});

// 3. Verify Owner Session Token
apiRouter.get('/auth/verify', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || '';
  const tokenHeader = req.headers['x-owner-token'] as string | undefined;
  let token = tokenHeader;
  if (!token && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  if (token && verifyOwnerToken(token)) {
    return res.json({ valid: true, authenticated: true });
  }
  return res.json({ valid: false, authenticated: false });
});

// 4. Public Profiles List (Visitors can read)
apiRouter.get('/profiles', async (_req: Request, res: Response) => {
  try {
    const profiles = await getAllProfiles();
    res.json(profiles);
  } catch (err: any) {
    console.error('Failed to get profiles:', err);
    res.status(500).json({ error: 'Failed to retrieve profiles', details: err.message });
  }
});

// 5. Image Upload (Protected - Owner only)
apiRouter.post(
  '/upload',
  requireOwnerAuth,
  upload.single('image'),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ success: false, error: 'No image file provided in form-data.' });
      }

      const validation = validateImageFile(file);
      if (!validation.valid) {
        return res.status(400).json({ success: false, error: validation.error });
      }

      const result = await uploadImageBuffer(file.buffer, file.originalname, file.mimetype);
      return res.json({
        success: true,
        url: result.url,
        provider: result.provider,
        bytes: result.bytes,
        format: result.format,
        message: 'Image uploaded successfully to permanent storage.',
      });
    } catch (err: any) {
      console.error('[Upload Error]', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Image upload failed. Please try again.',
      });
    }
  }
);

// 6. Create Profile (Protected - Owner only)
apiRouter.post('/profiles', requireOwnerAuth, async (req: Request, res: Response) => {
  try {
    const profileData: Profile = req.body;
    if (!profileData || !profileData.name || !profileData.birthdate) {
      return res.status(400).json({ error: 'Name and birthdate are required.' });
    }

    if (!profileData.id) {
      profileData.id = `profile-${Date.now()}`;
    }

    const saved = await saveProfileToDb(profileData);
    return res.status(201).json(saved);
  } catch (err: any) {
    console.error('Failed to create profile:', err);
    return res.status(500).json({ error: 'Failed to save profile', details: err.message });
  }
});

// 7. Update Profile (Protected - Owner only)
apiRouter.put('/profiles/:id', requireOwnerAuth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const profileData: Profile = { ...req.body, id };

    if (!profileData.name || !profileData.birthdate) {
      return res.status(400).json({ error: 'Name and birthdate are required.' });
    }

    const saved = await saveProfileToDb(profileData);
    return res.json(saved);
  } catch (err: any) {
    console.error('Failed to update profile:', err);
    return res.status(500).json({ error: 'Failed to update profile', details: err.message });
  }
});

// 8. Delete Profile (Protected - Owner only)
apiRouter.delete('/profiles/:id', requireOwnerAuth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    await deleteProfileFromDb(id);
    return res.json({ success: true, message: `Profile ${id} deleted successfully.` });
  } catch (err: any) {
    console.error('Failed to delete profile:', err);
    return res.status(500).json({ error: 'Failed to delete profile', details: err.message });
  }
});

// 9. Reset Profiles to Initial Defaults (Protected - Owner only)
apiRouter.post('/profiles/reset', requireOwnerAuth, async (_req: Request, res: Response) => {
  try {
    const reset = await resetProfilesInDb();
    return res.json({ success: true, count: reset.length, profiles: reset });
  } catch (err: any) {
    console.error('Failed to reset profiles:', err);
    return res.status(500).json({ error: 'Failed to reset profiles', details: err.message });
  }
});

// 10. Import Profiles in Bulk (Protected - Owner only)
apiRouter.post('/profiles/import', requireOwnerAuth, async (req: Request, res: Response) => {
  try {
    const { profiles } = req.body;
    if (!Array.isArray(profiles)) {
      return res.status(400).json({ error: 'Expected an array of profiles.' });
    }
    const imported = await importProfilesToDb(profiles);
    return res.json({ success: true, count: imported.length, profiles: imported });
  } catch (err: any) {
    console.error('Failed to import profiles:', err);
    return res.status(500).json({ error: 'Failed to import profiles', details: err.message });
  }
});
