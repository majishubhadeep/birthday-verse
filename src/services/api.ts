import { Profile } from '../types';

const OWNER_TOKEN_KEY = 'bv_owner_session_token';

export function getStoredOwnerToken(): string | null {
  return localStorage.getItem(OWNER_TOKEN_KEY);
}

export function setStoredOwnerToken(token: string): void {
  localStorage.setItem(OWNER_TOKEN_KEY, token);
}

export function clearStoredOwnerToken(): void {
  localStorage.removeItem(OWNER_TOKEN_KEY);
}

export async function loginOwner(pin: string): Promise<{ success: boolean; token?: string; message?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.token) {
      setStoredOwnerToken(data.token);
      return { success: true, token: data.token, message: data.message };
    }
    return { success: false, message: data.message || 'Incorrect PIN.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error during login.' };
  }
}

export async function verifyOwnerSession(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch('/api/auth/verify', {
      headers: { 'x-owner-token': token },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.valid;
  } catch {
    return false;
  }
}

export async function fetchProfiles(): Promise<Profile[]> {
  const res = await fetch('/api/profiles');
  if (!res.ok) {
    throw new Error(`Failed to fetch profiles: ${res.statusText}`);
  }
  return res.json();
}

export async function uploadProfileImage(
  file: File,
  token: string,
  onProgress?: (percent: number) => void
): Promise<{ url: string; provider: string; bytes: number }> {
  // Validate format before sending
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowed.includes(file.type.toLowerCase())) {
    throw new Error('Unsupported format. Please select a JPG, PNG, or WebP photo.');
  }

  // Validate size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Limit is 10MB.`);
  }

  const formData = new FormData();
  formData.append('image', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');
    xhr.setRequestHeader('x-owner-token', token);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && json.success) {
          resolve({
            url: json.url,
            provider: json.provider,
            bytes: json.bytes || file.size,
          });
        } else {
          reject(new Error(json.error || json.message || 'Image upload failed.'));
        }
      } catch (err: any) {
        reject(new Error('Invalid response from server.'));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during image upload. Check internet connection.'));
    };

    xhr.send(formData);
  });
}

export async function saveProfileApi(profile: Profile, token: string): Promise<Profile> {
  const isExisting = !!profile.id;
  const endpoint = isExisting ? `/api/profiles/${profile.id}` : '/api/profiles';
  const method = isExisting ? 'PUT' : 'POST';

  const res = await fetch(endpoint, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-owner-token': token,
    },
    body: JSON.stringify(profile),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || `Failed to save profile (${res.status})`);
  }

  return res.json();
}

export async function deleteProfileApi(id: string, token: string): Promise<boolean> {
  const res = await fetch(`/api/profiles/${id}`, {
    method: 'DELETE',
    headers: {
      'x-owner-token': token,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || `Failed to delete profile (${res.status})`);
  }

  return true;
}

export async function resetProfilesApi(token: string): Promise<Profile[]> {
  const res = await fetch('/api/profiles/reset', {
    method: 'POST',
    headers: {
      'x-owner-token': token,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Failed to reset profiles');
  }

  const data = await res.json();
  return data.profiles;
}

export async function importProfilesApi(profiles: Profile[], token: string): Promise<Profile[]> {
  const res = await fetch('/api/profiles/import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-owner-token': token,
    },
    body: JSON.stringify({ profiles }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Failed to import profiles');
  }

  const data = await res.json();
  return data.profiles;
}

export async function checkSystemStatus(): Promise<{
  success: boolean;
  database: {
    connected: boolean;
    provider: string;
    count: number;
    message: string;
  };
  storage: {
    provider: string;
    isCloudStorage: boolean;
    message: string;
  };
}> {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Status check failed');
    return res.json();
  } catch (err: any) {
    return {
      success: false,
      database: {
        connected: false,
        provider: 'offline',
        count: 0,
        message: 'Could not connect to backend server.',
      },
      storage: {
        provider: 'unknown',
        isCloudStorage: false,
        message: 'Could not connect to storage service.',
      },
    };
  }
}
