/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StepNumber, Gender, Profile } from './types';
import { INITIAL_PROFILES } from './data/initialProfiles';
import { Header } from './components/Header';
import { BackgroundStars } from './components/BackgroundStars';
import { StepOneGender } from './components/StepOneGender';
import { StepTwoDate } from './components/StepTwoDate';
import { StepThreeSurprise } from './components/StepThreeSurprise';
import { StepFourThankYou } from './components/StepFourThankYou';
import { ManageProfilesModal } from './components/ManageProfilesModal';
import {
  fetchProfiles,
  saveProfileApi,
  deleteProfileApi,
  resetProfilesApi,
  importProfilesApi,
  getStoredOwnerToken,
} from './services/api';

const STORAGE_KEY = 'birthday_verse_profiles_vault_v2';

export default function App() {
  const [step, setStep] = useState<StepNumber>(1);
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null);
  const [birthdate, setBirthdate] = useState('');
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ownerToken, setOwnerToken] = useState<string | null>(() => getStoredOwnerToken());
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);

  // Load profiles from LocalStorage or initialize with custom profiles
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Remove deleted profile-deb if cached, and merge initial profiles
          const cleaned = parsed
            .filter(
              (p: Profile) =>
                p.id !== 'profile-deb' &&
                !(p.name?.toLowerCase() === 'deb' && p.birthdate === '31/10/2007')
            )
            .map((p: Profile) => {
              const initialMatch = INITIAL_PROFILES.find((ip) => ip.id === p.id);
              if (initialMatch && initialMatch.photoUrl.startsWith('/assets/')) {
                return {
                  ...p,
                  photoUrl: initialMatch.photoUrl,
                  photoPosition: initialMatch.photoPosition || p.photoPosition,
                  photoScale: initialMatch.photoScale || p.photoScale,
                };
              }
              return p;
            });
          const existingIds = new Set(cleaned.map((p: Profile) => p.id));
          const additions = INITIAL_PROFILES.filter((p) => !existingIds.has(p.id));
          return [...additions, ...cleaned];
        }
      }
    } catch {
      // fallback to initial profiles
    }
    return INITIAL_PROFILES;
  });

  // Fetch shared persistent profiles from backend database on mount
  useEffect(() => {
    setIsLoadingProfiles(true);
    fetchProfiles()
      .then((serverProfiles) => {
        if (Array.isArray(serverProfiles) && serverProfiles.length > 0) {
          setProfiles(serverProfiles);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(serverProfiles));
          } catch {
            // Storage quota handled
          }
        }
      })
      .catch((err) => {
        console.log('Running with local profile vault cache:', err.message);
      })
      .finally(() => {
        setIsLoadingProfiles(false);
      });
  }, []);

  // Persist profiles to LocalStorage whenever modified
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } catch {
      // Storage quota or private browsing gracefully handled
    }
  }, [profiles]);

  // Check URL query parameters for direct shared links (?gender=female&dob=14/02/2002)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlGender = params.get('gender') as Gender | null;
      const urlDob = params.get('dob');

      if (urlGender && (urlGender === 'male' || urlGender === 'female')) {
        setSelectedGender(urlGender);
        if (urlDob) {
          setBirthdate(urlDob);
          // Find profile matching url
          const match = findMatchingProfile(urlGender, urlDob, profiles);
          if (match) {
            setMatchedProfile(match);
            setStep(3);
          } else {
            setStep(2);
          }
        } else {
          setStep(2);
        }
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, [profiles]);

  // Matching helper function
  const findMatchingProfile = (
    gender: Gender,
    dob: string,
    profileList: Profile[]
  ): Profile | null => {
    const cleanedDob = dob.trim();

    // 1. Try exact match on gender + exact birthdate (DD/MM/YYYY)
    const exact = profileList.find(
      (p) =>
        p.gender.toLowerCase() === gender.toLowerCase() &&
        p.birthdate.trim() === cleanedDob
    );
    if (exact) return exact;

    // 2. Try day/month match with same gender (in case recipient enters different year)
    const [day, month] = cleanedDob.split('/');
    if (day && month) {
      const dayMonthMatch = profileList.find((p) => {
        const [pDay, pMonth] = p.birthdate.trim().split('/');
        return (
          p.gender.toLowerCase() === gender.toLowerCase() &&
          pDay === day &&
          pMonth === month
        );
      });
      if (dayMonthMatch) return dayMonthMatch;
    }

    // 3. Fallback: exact birthdate regardless of gender
    const dateMatch = profileList.find((p) => p.birthdate.trim() === cleanedDob);
    if (dateMatch) return dateMatch;

    return null;
  };

  const handleSelectGender = (gender: Gender) => {
    setSelectedGender(gender);
  };

  const handleContinueToDate = () => {
    if (!selectedGender) return;
    setErrorMessage(null);
    setStep(2);
  };

  const handleRevealSurprise = () => {
    if (!selectedGender) {
      setStep(1);
      return;
    }

    const match = findMatchingProfile(selectedGender, birthdate, profiles);
    if (match) {
      setMatchedProfile(match);
      setErrorMessage(null);
      setStep(3);
    } else {
      setErrorMessage(
        `No profile found for ${birthdate} with gender "${selectedGender}".`
      );
    }
  };

  const handleQuickSelectDate = (date: string, gender: Gender) => {
    setSelectedGender(gender);
    setBirthdate(date);
    setErrorMessage(null);
  };

  const handleThankYou = () => {
    setStep(4);
  };

  const handleBackToHome = () => {
    setStep(1);
    setSelectedGender(null);
    setBirthdate('');
    setMatchedProfile(null);
    setErrorMessage(null);
  };

  // Owner Portal CRUD Handlers with Database Synchronization
  const handleSaveProfile = async (newOrUpdated: Profile) => {
    // 1. Optimistic local update
    setProfiles((prev) => {
      const idx = prev.findIndex((p) => p.id === newOrUpdated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newOrUpdated;
        return copy;
      }
      return [newOrUpdated, ...prev];
    });

    // 2. Sync to server database if authenticated
    if (ownerToken) {
      try {
        const saved = await saveProfileApi(newOrUpdated, ownerToken);
        setProfiles((prev) => {
          const idx = prev.findIndex((p) => p.id === saved.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = saved;
            return copy;
          }
          return [saved, ...prev];
        });
      } catch (err) {
        console.error('Failed to sync saved profile to database:', err);
      }
    }
  };

  const handleDeleteProfile = async (id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    if (ownerToken) {
      try {
        await deleteProfileApi(id, ownerToken);
      } catch (err) {
        console.error('Failed to sync profile deletion to database:', err);
      }
    }
  };

  const handleResetDefaults = async () => {
    setProfiles(INITIAL_PROFILES);
    localStorage.removeItem(STORAGE_KEY);
    if (ownerToken) {
      try {
        const defaults = await resetProfilesApi(ownerToken);
        if (Array.isArray(defaults)) {
          setProfiles(defaults);
        }
      } catch (err) {
        console.error('Failed to reset profiles on database:', err);
      }
    }
  };

  const handleTestProfileDirectly = (profile: Profile) => {
    setSelectedGender(profile.gender);
    setBirthdate(profile.birthdate);
    setMatchedProfile(profile);
    setErrorMessage(null);
    setStep(3);
  };

  const handleImportProfiles = async (imported: Profile[]) => {
    setProfiles(imported);
    if (ownerToken) {
      try {
        const result = await importProfilesApi(imported, ownerToken);
        if (Array.isArray(result)) {
          setProfiles(result);
        }
      } catch (err) {
        console.error('Failed to sync imported profiles to database:', err);
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0b0414] text-white flex flex-col justify-between selection:bg-[#f7d59b] selection:text-[#0b0414]">
      {/* Background Ambience, Cosmic Radial Glows, Balloons, and Twinkling Stars */}
      <BackgroundStars />

      {/* Top Header */}
      <Header
        currentStep={step}
        onOpenManage={() => setIsManageOpen(true)}
        onSelectStep={(targetStep) => {
          if (targetStep === 1) {
            handleBackToHome();
          } else if (targetStep === 2 && selectedGender) {
            setStep(2);
          } else if (targetStep === 3 && matchedProfile) {
            setStep(3);
          } else if (targetStep === 4) {
            setStep(4);
          }
        }}
      />

      {/* Main Content by Step */}
      <main className="relative z-10 flex-1 flex flex-col justify-center">
        {step === 1 && (
          <StepOneGender
            selectedGender={selectedGender}
            onSelectGender={handleSelectGender}
            onContinue={handleContinueToDate}
          />
        )}

        {step === 2 && selectedGender && (
          <StepTwoDate
            selectedGender={selectedGender}
            birthdate={birthdate}
            onChangeBirthdate={(val) => {
              setBirthdate(val);
              if (errorMessage) setErrorMessage(null);
            }}
            onBack={() => setStep(1)}
            onSubmit={handleRevealSurprise}
            availableProfiles={profiles}
            onSelectQuickDate={handleQuickSelectDate}
            errorMessage={errorMessage}
          />
        )}

        {step === 3 && matchedProfile && (
          <StepThreeSurprise
            profile={matchedProfile}
            onThankYou={handleThankYou}
          />
        )}

        {step === 4 && (
          <StepFourThankYou onBackToHome={handleBackToHome} />
        )}
      </main>

      {/* Owner Management Modal */}
      <ManageProfilesModal
        isOpen={isManageOpen}
        onClose={() => setIsManageOpen(false)}
        profiles={profiles}
        onSaveProfile={handleSaveProfile}
        onDeleteProfile={handleDeleteProfile}
        onResetDefaults={handleResetDefaults}
        onTestProfile={handleTestProfileDirectly}
        onImportProfiles={handleImportProfiles}
        ownerToken={ownerToken}
        onOwnerTokenChange={(token) => setOwnerToken(token)}
      />
    </div>
  );
}
