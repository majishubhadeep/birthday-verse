export type Gender = 'male' | 'female';

export interface Profile {
  id: string;
  name: string;
  gender: Gender;
  birthdate: string; // DD/MM/YYYY format
  photoUrl: string;
  relationship: string;
  wish: string;
  quote: string;
  quoteAuthor?: string;
  songUrl?: string;
  photoPosition?: string;
  photoScale?: number;
  originalPhotoUrl?: string;
  createdAt?: string;
}

export type StepNumber = 1 | 2 | 3 | 4;
