import React, { useState, useEffect, useRef } from 'react';
import { Profile, Gender } from '../types';
import { calculateAge, formatDateInput, isValidDateFormat } from '../utils/date';
import { 
  X, Plus, Search, Trash2, Edit2, Sparkles, 
  Download, Upload, RefreshCw, KeyRound, ExternalLink,
  Github, Check, AlertCircle, Image as ImageIcon, Lock,
  Scissors, RotateCcw, Cloud, Database, HardDrive, CheckCircle2,
  Loader2, ArrowUpCircle, ShieldCheck
} from 'lucide-react';
import { ImageCropModal } from './ImageCropModal';
import {
  loginOwner,
  getStoredOwnerToken,
  setStoredOwnerToken,
  clearStoredOwnerToken,
  verifyOwnerSession,
  uploadProfileImage,
  checkSystemStatus,
} from '../services/api';

interface ManageProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: Profile[];
  onSaveProfile: (profile: Profile) => Promise<void> | void;
  onDeleteProfile: (id: string) => Promise<void> | void;
  onResetDefaults: () => Promise<void> | void;
  onTestProfile: (profile: Profile) => void;
  onImportProfiles: (profiles: Profile[]) => Promise<void> | void;
  ownerToken?: string | null;
  onOwnerTokenChange?: (token: string | null) => void;
}

export const ManageProfilesModal: React.FC<ManageProfilesModalProps> = ({
  isOpen,
  onClose,
  profiles,
  onSaveProfile,
  onDeleteProfile,
  onResetDefaults,
  onTestProfile,
  onImportProfiles,
  ownerToken: propOwnerToken,
  onOwnerTokenChange,
}) => {
  // Authentication State
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [localToken, setLocalToken] = useState<string | null>(propOwnerToken || getStoredOwnerToken());

  // System Status State (Database & Cloud Storage)
  const [systemStatus, setSystemStatus] = useState<{
    database?: { connected: boolean; provider: string; count: number; message: string };
    storage?: { provider: string; isCloudStorage: boolean; message: string };
  }>({});

  // Tabs: 'directory' | 'add' | 'cloud' | 'github'
  const [activeTab, setActiveTab] = useState<'directory' | 'add' | 'cloud' | 'github'>('directory');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all');

  // Form State for Adding / Editing Profile
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState<Gender>('female');
  const [formBirthdate, setFormBirthdate] = useState('');
  const [formRelationship, setFormRelationship] = useState('Friend');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [formPhotoPosition, setFormPhotoPosition] = useState('center 20%');
  const [formPhotoScale, setFormPhotoScale] = useState(1.15);
  const [formOriginalPhotoUrl, setFormOriginalPhotoUrl] = useState('');
  const [formWish, setFormWish] = useState('');
  const [formQuote, setFormQuote] = useState('');
  const [formQuoteAuthor, setFormQuoteAuthor] = useState('');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Cloud Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadSuccessInfo, setUploadSuccessInfo] = useState<{ provider: string; bytes: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dedicated Cropper Modal State
  const [cropModalData, setCropModalData] = useState<{
    isOpen: boolean;
    imageUrl: string;
    originalImageUrl?: string;
    initialPosition?: string;
    initialScale?: number;
    profileName: string;
    directProfileId?: string;
  }>({
    isOpen: false,
    imageUrl: '',
    profileName: '',
  });

  // Check saved session on modal open
  useEffect(() => {
    if (isOpen) {
      checkSystemStatus().then((res) => {
        if (res.success) {
          setSystemStatus({ database: res.database, storage: res.storage });
        }
      });

      const token = propOwnerToken || getStoredOwnerToken();
      if (token) {
        verifyOwnerSession(token).then((valid) => {
          if (valid) {
            setIsUnlocked(true);
            setLocalToken(token);
          } else {
            clearStoredOwnerToken();
            setLocalToken(null);
            setIsUnlocked(false);
          }
        });
      } else {
        setIsUnlocked(false);
      }
      setPinInput('');
      setPinError('');
    }
  }, [isOpen, propOwnerToken]);

  if (!isOpen) return null;

  const currentToken = localToken || propOwnerToken || getStoredOwnerToken();

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;

    setIsAuthenticating(true);
    setPinError('');

    try {
      const res = await loginOwner(pinInput.trim());
      if (res.success && res.token) {
        setIsUnlocked(true);
        setLocalToken(res.token);
        setStoredOwnerToken(res.token);
        if (onOwnerTokenChange) onOwnerTokenChange(res.token);
        setPinError('');
      } else {
        setPinError(res.message || 'Incorrect PIN. Please try again.');
      }
    } catch (err: any) {
      setPinError(err.message || 'Authentication error.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLockVault = () => {
    clearStoredOwnerToken();
    setLocalToken(null);
    if (onOwnerTokenChange) onOwnerTokenChange(null);
    setIsUnlocked(false);
    setPinInput('');
  };

  const handleStartAdd = () => {
    setEditingId(null);
    setFormName('');
    setFormGender('female');
    setFormBirthdate('');
    setFormRelationship('Friend');
    setFormPhotoUrl('/src/assets/images/portrait_avery_1793117204559.jpg');
    setFormPhotoPosition('center 20%');
    setFormPhotoScale(1.15);
    setFormOriginalPhotoUrl('');
    setFormWish('May laughter light your way, wonderful memories fill your days, and every new adventure bring you closer to your dreams.');
    setFormQuote('The more you praise and celebrate your life, the more there is in life to celebrate.');
    setFormQuoteAuthor('Oprah Winfrey');
    setFormError('');
    setUploadFile(null);
    setUploadPreview(null);
    setUploadProgress(0);
    setUploadError('');
    setUploadSuccessInfo(null);
    setActiveTab('add');
  };

  const handleStartEdit = (p: Profile) => {
    setEditingId(p.id);
    setFormName(p.name);
    setFormGender(p.gender);
    setFormBirthdate(p.birthdate);
    setFormRelationship(p.relationship);
    setFormPhotoUrl(p.photoUrl);
    setFormPhotoPosition(p.photoPosition || 'center 20%');
    setFormPhotoScale(p.photoScale || 1.15);
    setFormOriginalPhotoUrl(p.originalPhotoUrl || p.photoUrl);
    setFormWish(p.wish);
    setFormQuote(p.quote);
    setFormQuoteAuthor(p.quoteAuthor || '');
    setFormError('');
    setUploadFile(null);
    setUploadPreview(null);
    setUploadProgress(0);
    setUploadError('');
    setUploadSuccessInfo(null);
    setActiveTab('add');
  };

  // Actual Image File Selection & Upload
  const handleSelectImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setUploadError('Invalid format. Please select a JPG, JPEG, PNG, or WebP image.');
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(`File is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum allowed is 10MB.`);
      return;
    }

    setUploadFile(file);
    setUploadError('');
    const previewUrl = URL.createObjectURL(file);
    setUploadPreview(previewUrl);

    // If owner is authenticated, perform actual upload to cloud storage
    if (currentToken) {
      setIsUploading(true);
      setUploadProgress(10);
      try {
        const result = await uploadProfileImage(file, currentToken, (progress) => {
          setUploadProgress(progress);
        });

        // Set the permanent URL returned by Cloudinary / server
        setFormPhotoUrl(result.url);
        setFormOriginalPhotoUrl(result.url);
        setFormPhotoPosition('center 20%');
        setFormPhotoScale(1.15);
        setUploadSuccessInfo({ provider: result.provider, bytes: result.bytes });
        setSuccessMsg(`Photo uploaded permanently to ${result.provider === 'cloudinary' ? 'Cloudinary Cloud Storage' : 'server storage'}!`);
        setTimeout(() => setSuccessMsg(''), 4000);
      } catch (err: any) {
        setUploadError(err.message || 'Upload failed. Please try again.');
      } finally {
        setIsUploading(false);
      }
    } else {
      // Fallback local preview
      setFormPhotoUrl(previewUrl);
      setFormOriginalPhotoUrl(previewUrl);
    }
  };

  const handleApplyCrop = (result: {
    photoUrl: string;
    photoPosition: string;
    photoScale: number;
    originalPhotoUrl: string;
  }) => {
    if (cropModalData.directProfileId) {
      // Direct crop from Directory card
      const target = profiles.find((p) => p.id === cropModalData.directProfileId);
      if (target) {
        const updatedProfile: Profile = {
          ...target,
          photoUrl: result.photoUrl,
          photoPosition: result.photoPosition,
          photoScale: result.photoScale,
          originalPhotoUrl: result.originalPhotoUrl,
        };
        onSaveProfile(updatedProfile);
        setSuccessMsg(`Permanently saved cropped picture for ${target.name}!`);
        setTimeout(() => setSuccessMsg(''), 3500);
      }
    } else {
      // Form crop
      setFormPhotoUrl(result.photoUrl);
      setFormPhotoPosition(result.photoPosition);
      setFormPhotoScale(result.photoScale);
      setFormOriginalPhotoUrl(result.originalPhotoUrl);
      setSuccessMsg('Photo framing updated!');
      setTimeout(() => setSuccessMsg(''), 3500);
    }
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Please enter a name');
      return;
    }
    if (!isValidDateFormat(formBirthdate)) {
      setFormError('Please enter a valid birthdate in DD/MM/YYYY format');
      return;
    }
    if (!formWish.trim()) {
      setFormError('Please enter a birthday wish');
      return;
    }

    setIsSaving(true);
    setFormError('');

    try {
      const newProfile: Profile = {
        id: editingId || `profile-${Date.now()}`,
        name: formName.trim(),
        gender: formGender,
        birthdate: formBirthdate.trim(),
        relationship: formRelationship.trim() || 'Friend',
        photoUrl: formPhotoUrl.trim() || '/src/assets/images/portrait_avery_1793117204559.jpg',
        photoPosition: formPhotoPosition,
        photoScale: formPhotoScale,
        originalPhotoUrl: formOriginalPhotoUrl || formPhotoUrl.trim(),
        wish: formWish.trim(),
        quote: formQuote.trim() || 'Count your life by smiles, not tears.',
        quoteAuthor: formQuoteAuthor.trim() || 'Birthday Verse',
        createdAt: new Date().toISOString(),
      };

      await onSaveProfile(newProfile);
      setSuccessMsg(editingId ? 'Profile updated and saved to shared database!' : 'New profile added to vault and database!');
      setTimeout(() => setSuccessMsg(''), 3000);
      setActiveTab('directory');
    } catch (err: any) {
      setFormError(err.message || 'Failed to save profile. Check connection.');
    } finally {
      setIsSaving(false);
    }
  };

  // Export profiles as JSON file
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(profiles, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `birthday_verse_profiles_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Copy profiles code for initialProfiles.ts
  const handleCopyCode = () => {
    const code = `import { Profile } from '../types';\n\nexport const INITIAL_PROFILES: Profile[] = ${JSON.stringify(profiles, null, 2)};\n`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setSuccessMsg('Profiles code copied! You can paste it into src/data/initialProfiles.ts or share it in chat.');
    setTimeout(() => {
      setCopiedCode(false);
      setSuccessMsg('');
    }, 4000);
  };

  // Import profiles from JSON file
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          await onImportProfiles(json);
          setSuccessMsg(`Successfully imported ${json.length} profiles to database!`);
          setTimeout(() => setSuccessMsg(''), 3000);
        } else {
          alert('Invalid format. Expected a JSON array of profiles.');
        }
      } catch {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.birthdate.includes(searchTerm) ||
      p.relationship.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = filterGender === 'all' || p.gender === filterGender;
    return matchesSearch && matchesGender;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#140a24] border border-purple-400/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-left">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/20 bg-[#1c0f33]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg border border-[#f7d59b]/40 flex items-center justify-center rotate-45 bg-[#251242]">
              <span className="-rotate-45 text-[#f7d59b] text-xs">✦</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-serif text-white font-normal">
                  Owner Portal · <span className="text-[#f7d59b] italic">Manage Profiles</span>
                </h2>
                {isUnlocked && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Owner Verified
                  </span>
                )}
              </div>
              <p className="text-[11px] text-purple-300/60 font-light">
                Vault of {profiles.length} loved ones · Shared across all devices
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isUnlocked && (
              <button
                type="button"
                onClick={handleLockVault}
                className="px-3 py-1.5 rounded-full border border-purple-400/30 text-purple-300 hover:text-white hover:bg-purple-900/40 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Lock Management Vault"
              >
                <Lock className="w-3.5 h-3.5 text-[#f7d59b]" />
                <span>Lock Vault</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-purple-300 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lock Screen if not verified */}
        {!isUnlocked ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center my-auto">
            <div className="w-16 h-16 rounded-full bg-purple-900/40 border border-purple-400/30 flex items-center justify-center mb-6">
              <KeyRound className="w-8 h-8 text-[#f7d59b]" />
            </div>

            <h3 className="text-2xl font-serif text-white mb-2">Owner Authentication</h3>
            <p className="text-sm text-purple-200/70 max-w-md mb-6 font-light">
              Only the authenticated website owner can add, edit, delete, or upload profile pictures. Visitors can only search and view birthday surprises.
            </p>

            <form onSubmit={handleUnlock} className="w-full max-w-xs space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="Enter owner PIN"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  disabled={isAuthenticating}
                  className="w-full px-4 py-3 rounded-xl bg-[#200f38] border border-purple-400/40 text-center tracking-widest text-white text-base font-mono focus:outline-none focus:border-[#f7d59b] disabled:opacity-50"
                  autoFocus
                />
                {pinError && (
                  <p className="text-xs text-rose-400 mt-2 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {pinError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#f7d59b] to-[#dca958] text-[#140b24] font-semibold text-xs uppercase tracking-wider shadow-lg hover:brightness-105 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Unlock Management</span>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Unlocked Portal Content */
          <>
            {/* Top Status & Navigation Bar */}
            <div className="px-6 py-2.5 bg-[#170a2c] border-b border-purple-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
              {/* Cloud DB & Storage Status Badges */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-purple-200">
                  <Database className="w-3.5 h-3.5 text-[#f7d59b]" />
                  <span className="font-medium">Database:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    systemStatus.database?.connected
                      ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40'
                      : 'bg-purple-900/60 text-purple-300 border border-purple-400/20'
                  }`}>
                    {systemStatus.database?.connected ? 'Neon PostgreSQL (Connected)' : 'Persistent Local Store'}
                  </span>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 text-purple-200">
                  <Cloud className="w-3.5 h-3.5 text-sky-400" />
                  <span className="font-medium">Storage:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    systemStatus.storage?.isCloudStorage
                      ? 'bg-sky-950/90 text-sky-300 border border-sky-500/40'
                      : 'bg-purple-900/60 text-purple-300 border border-purple-400/20'
                  }`}>
                    {systemStatus.storage?.isCloudStorage ? 'Cloudinary (Cloud CDN)' : 'Server Storage'}
                  </span>
                </div>
              </div>

              {/* Data Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  title="Copy profiles as TypeScript code for GitHub"
                  className="p-1.5 text-xs text-[#f7d59b] hover:text-white rounded-lg border border-[#f7d59b]/40 hover:bg-[#f7d59b]/20 flex items-center gap-1 px-2.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{copiedCode ? 'Code Copied!' : 'Copy Code for GitHub'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportJson}
                  title="Export profiles to JSON"
                  className="p-1.5 text-xs text-purple-300 hover:text-[#f7d59b] rounded-lg border border-purple-500/20 hover:border-purple-400/40 flex items-center gap-1 px-2.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </button>

                <label
                  title="Import profiles from JSON"
                  className="p-1.5 text-xs text-purple-300 hover:text-[#f7d59b] rounded-lg border border-purple-500/20 hover:border-purple-400/40 flex items-center gap-1 px-2.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Import</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJson}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Reset to default 17 profiles? Any custom ones not exported will be replaced.')) {
                      onResetDefaults();
                    }
                  }}
                  title="Reset to default profiles"
                  className="p-1.5 text-xs text-purple-300 hover:text-rose-400 rounded-lg border border-purple-500/20 hover:border-rose-500/40 flex items-center gap-1 px-2.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset Defaults</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center px-6 py-2.5 border-b border-purple-500/20 bg-[#140a24] gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'directory'
                    ? 'bg-[#f7d59b] text-[#140b24]'
                    : 'text-purple-300 hover:text-white bg-purple-950/40 hover:bg-purple-900/40'
                }`}
              >
                Profiles Directory ({profiles.length})
              </button>

              <button
                type="button"
                onClick={handleStartAdd}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'add'
                    ? 'bg-[#f7d59b] text-[#140b24]'
                    : 'text-purple-300 hover:text-white bg-purple-950/40 hover:bg-purple-900/40'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{editingId ? 'Edit Profile' : 'Add Profile'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('cloud')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'cloud'
                    ? 'bg-[#f7d59b] text-[#140b24]'
                    : 'text-purple-300 hover:text-white bg-purple-950/40 hover:bg-purple-900/40'
                }`}
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Cloud & DB Setup</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('github')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'github'
                    ? 'bg-[#f7d59b] text-[#140b24]'
                    : 'text-purple-300 hover:text-white bg-purple-950/40 hover:bg-purple-900/40'
                }`}
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub & Sharing</span>
              </button>
            </div>

            {/* Notification message banner */}
            {successMsg && (
              <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-6 py-2.5 text-emerald-200 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Tab 1: Profiles Directory */}
            {activeTab === 'directory' && (
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)] space-y-4">
                {/* Search & Filter Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#1c0f33] p-3 rounded-2xl border border-purple-500/20">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search name, birthdate, relationship..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#120822] border border-purple-400/20 text-xs text-white placeholder:text-purple-400/40 focus:outline-none focus:border-[#f7d59b]"
                    />
                  </div>

                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    {(['all', 'female', 'male'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setFilterGender(g)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                          filterGender === g
                            ? 'bg-[#f7d59b] text-[#140b24]'
                            : 'text-purple-300 hover:text-white bg-[#120822]'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Profiles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProfiles.map((p) => {
                    const age = calculateAge(p.birthdate);
                    return (
                      <div
                        key={p.id}
                        className="p-4 rounded-2xl bg-[#1c0e35]/80 border border-purple-400/20 hover:border-purple-300/40 transition-all flex gap-3.5 relative group"
                      >
                        {/* Profile Thumbnail */}
                        <div className="w-18 h-22 rounded-xl overflow-hidden bg-purple-950 shrink-0 border border-[#f7d59b]/30 relative">
                          {p.photoUrl && p.photoUrl.trim() !== '' ? (
                            <img
                              src={p.photoUrl}
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              style={{ objectPosition: p.photoPosition || 'center 20%' }}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                if (target.parentElement) {
                                  target.parentElement.innerHTML = `
                                    <div class="w-full h-full flex items-center justify-center bg-purple-900 text-[#f7d59b] font-serif text-xl font-bold">
                                      ${p.name.charAt(0)}
                                    </div>
                                  `;
                                }
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-purple-900 text-[#f7d59b] font-serif text-xl font-bold">
                              ${p.name.charAt(0)}
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-serif text-base text-white font-medium truncate">
                                {p.name}
                              </h4>
                              <p className="text-[11px] text-purple-300/70">
                                {p.relationship} · <span className="capitalize">{p.gender}</span>
                              </p>
                            </div>
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-900/60 border border-purple-400/20 text-[#f7d59b]">
                              {age} yrs
                            </span>
                          </div>

                          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-purple-200">
                            <span className="text-[#f7d59b]">🎂</span>
                            <span className="font-mono font-semibold">{p.birthdate}</span>
                          </div>

                          <p className="text-[11px] text-purple-300/60 line-clamp-2 mt-1 italic font-light">
                            "{p.wish}"
                          </p>

                          {/* Quick Actions */}
                          <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-purple-500/10">
                            <button
                              type="button"
                              onClick={() => {
                                onTestProfile(p);
                                onClose();
                              }}
                              className="px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-purple-900/70 hover:bg-[#f7d59b] hover:text-[#140b24] text-purple-200 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3 text-[#f7d59b] group-hover:text-[#140b24]" />
                              <span>Preview Surprise</span>
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setCropModalData({
                                    isOpen: true,
                                    imageUrl: p.photoUrl,
                                    originalImageUrl: p.originalPhotoUrl || p.photoUrl,
                                    initialPosition: p.photoPosition || 'center 20%',
                                    initialScale: p.photoScale || 1.15,
                                    profileName: p.name,
                                    directProfileId: p.id,
                                  });
                                }}
                                title={`Crop & frame ${p.name}'s picture`}
                                className="p-1.5 text-purple-300 hover:text-[#f7d59b] rounded hover:bg-white/10 transition-colors cursor-pointer"
                              >
                                <Scissors className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(p)}
                                title="Edit profile"
                                className="p-1.5 text-purple-300 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (confirm(`Delete ${p.name}? This removes the record from the shared database.`)) {
                                    await onDeleteProfile(p.id);
                                  }
                                }}
                                title="Delete profile"
                                className="p-1.5 text-purple-300 hover:text-rose-400 rounded hover:bg-white/10 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredProfiles.length === 0 && (
                  <div className="py-12 text-center text-purple-300/60 font-light">
                    No profiles matched your search. Click "Add Profile" to create one.
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Add / Edit Profile Form with Actual File Upload */}
            {activeTab === 'add' && (
              <form onSubmit={handleSubmitProfile} className="p-6 overflow-y-auto max-h-[calc(90vh-160px)] space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
                  <h3 className="font-serif text-lg text-white">
                    {editingId ? `Editing Profile: ${formName}` : 'Add New Loved One to Vault'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('directory')}
                    className="text-xs text-purple-300 hover:text-white underline cursor-pointer"
                  >
                    Back to Directory
                  </button>
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-purple-300/80 font-semibold mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Avery Brooks"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b0d33] border border-purple-400/30 text-white text-sm focus:outline-none focus:border-[#f7d59b]"
                      required
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-purple-300/80 font-semibold mb-1">
                      Gender *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['female', 'male'] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setFormGender(g)}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                            formGender === g
                              ? 'bg-[#f7d59b] text-[#140b24]'
                              : 'bg-[#1b0d33] text-purple-300 border border-purple-400/20 hover:border-purple-300/50'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-purple-300/80 font-semibold mb-1">
                      Date of Birth (DD/MM/YYYY) *
                    </label>
                    <input
                      type="text"
                      placeholder="14/02/2002"
                      value={formBirthdate}
                      onChange={(e) => setFormBirthdate(formatDateInput(e.target.value))}
                      maxLength={10}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b0d33] border border-purple-400/30 text-white font-mono text-sm focus:outline-none focus:border-[#f7d59b]"
                      required
                    />
                    <p className="text-[10px] text-purple-300/50 mt-1">
                      Format: Day/Month/Year (e.g. 14/02/2002)
                    </p>
                  </div>

                  {/* Relationship */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-purple-300/80 font-semibold mb-1">
                      Relationship / Role
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Best Friend, Sister, Brother, Mom..."
                      value={formRelationship}
                      onChange={(e) => setFormRelationship(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b0d33] border border-purple-400/30 text-white text-sm focus:outline-none focus:border-[#f7d59b]"
                    />
                  </div>
                </div>

                {/* Actual Picture Upload & Cropper */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#f7d59b] font-semibold">
                        Profile Picture (Permanent Cloud Upload)
                      </label>
                      <p className="text-[11px] text-purple-300/60 font-light">
                        Upload an actual JPG, PNG, or WebP photo from your phone or laptop. Saved to permanent cloud storage.
                      </p>
                    </div>

                    {formOriginalPhotoUrl && formOriginalPhotoUrl !== formPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormPhotoUrl(formOriginalPhotoUrl);
                          setFormPhotoPosition('center 20%');
                          setFormPhotoScale(1.15);
                        }}
                        className="text-[11px] text-purple-300 hover:text-white underline flex items-center gap-1 cursor-pointer"
                        title="Revert back to uncropped original photo"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Revert uncropped</span>
                      </button>
                    )}
                  </div>

                  {uploadError && (
                    <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-[#1b0d33] border border-purple-400/25">
                    {/* Live Arched Preview matching Birthday Card Arch */}
                    <div className="relative w-22 h-32 rounded-t-full rounded-b-xl overflow-hidden bg-purple-950 border-2 border-[#f7d59b]/50 shadow-md shrink-0 flex items-center justify-center">
                      {formPhotoUrl && formPhotoUrl.trim() !== '' ? (
                        <img
                          src={formPhotoUrl.trim()}
                          alt="Preview"
                          referrerPolicy="no-referrer"
                          style={{
                            objectPosition: formPhotoPosition,
                            transform: `scale(${formPhotoScale})`,
                          }}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-purple-400">
                          <ImageIcon className="w-8 h-8 opacity-40" />
                        </div>
                      )}
                      <div className="absolute inset-0.5 rounded-t-full rounded-b-lg border border-[#f7d59b]/30 pointer-events-none" />

                      {isUploading && (
                        <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-1 text-center p-2">
                          <Loader2 className="w-5 h-5 text-[#f7d59b] animate-spin" />
                          <span className="text-[10px] text-white font-mono">{uploadProgress}%</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-3 w-full">
                      {/* Upload Button + Replace Button */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          onChange={handleSelectImageFile}
                          className="hidden"
                        />

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#f7d59b] to-[#dca958] text-[#140b24] text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg hover:brightness-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <ArrowUpCircle className="w-4 h-4 text-[#140b24]" />
                          <span>{formPhotoUrl ? 'Replace Picture' : 'Upload Picture'}</span>
                        </button>

                        {/* Crop & Adjust Framing Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (!formPhotoUrl) return;
                            setCropModalData({
                              isOpen: true,
                              imageUrl: formPhotoUrl,
                              originalImageUrl: formOriginalPhotoUrl || formPhotoUrl,
                              initialPosition: formPhotoPosition,
                              initialScale: formPhotoScale,
                              profileName: formName || 'Profile Photo',
                            });
                          }}
                          disabled={!formPhotoUrl || isUploading}
                          className="px-3.5 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 border border-purple-400/30 text-purple-200 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                        >
                          <Scissors className="w-3.5 h-3.5" />
                          <span>Crop & Frame</span>
                        </button>

                        {/* Framing pill */}
                        <span className="text-[10px] font-mono px-2 py-1 rounded bg-[#200f38] border border-purple-400/20 text-[#f7d59b]">
                          {formPhotoPosition} · {Math.round(formPhotoScale * 100)}%
                        </span>
                      </div>

                      {/* Upload progress bar */}
                      {isUploading && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-purple-200">
                            <span>Uploading to Cloud Storage...</span>
                            <span className="font-mono">{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-[#120822] rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-[#f7d59b] to-emerald-400 h-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Photo URL / Reference string */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-purple-400/70 mb-1">
                          Photo URL or Cloud Reference:
                        </label>
                        <input
                          type="text"
                          placeholder="https://res.cloudinary.com/... or uploaded image path"
                          value={formPhotoUrl}
                          onChange={(e) => {
                            setFormPhotoUrl(e.target.value);
                            setFormOriginalPhotoUrl(e.target.value);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#120822] border border-purple-400/20 text-white text-xs font-mono focus:outline-none focus:border-[#f7d59b]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personalized Wish */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs uppercase tracking-wider text-purple-300/80 font-semibold">
                      Personalized Birthday Wish *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setFormWish(
                          `Happy Birthday ${formName || 'my dear'}! May laughter light your way, wonderful memories fill your days, and every new adventure bring you closer to your brightest dreams.`
                        );
                      }}
                      className="text-[11px] text-[#f7d59b] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Inspire with template</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Write a heartfelt birthday message..."
                    value={formWish}
                    onChange={(e) => setFormWish(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b0d33] border border-purple-400/30 text-white text-sm focus:outline-none focus:border-[#f7d59b]"
                    required
                  />
                </div>

                {/* Quote and Author */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase tracking-wider text-purple-300/80 font-semibold mb-1">
                      Inspirational Birthday Quote
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. The more you praise and celebrate your life..."
                      value={formQuote}
                      onChange={(e) => setFormQuote(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#1b0d33] border border-purple-400/30 text-white text-xs focus:outline-none focus:border-[#f7d59b]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-purple-300/80 font-semibold mb-1">
                      Quote Author
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Oprah Winfrey"
                      value={formQuoteAuthor}
                      onChange={(e) => setFormQuoteAuthor(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#1b0d33] border border-purple-400/30 text-white text-xs focus:outline-none focus:border-[#f7d59b]"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-purple-500/20">
                  <button
                    type="button"
                    onClick={() => setActiveTab('directory')}
                    disabled={isSaving || isUploading}
                    className="px-5 py-2.5 rounded-xl border border-purple-400/30 text-xs font-semibold uppercase text-purple-300 hover:text-white cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || isUploading}
                    className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-[#f7d59b] to-[#dca958] text-[#140b24] text-xs font-bold uppercase tracking-wider shadow-lg hover:brightness-105 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving to Database...</span>
                      </>
                    ) : (
                      <span>{editingId ? 'Save Changes' : 'Add to Birthday Vault'}</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 3: Cloud & Persistent Database Setup */}
            {activeTab === 'cloud' && (
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)] space-y-5 text-sm text-purple-100 font-light">
                <div className="bg-[#1c0f33] p-5 rounded-2xl border border-[#f7d59b]/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Cloud className="w-6 h-6 text-[#f7d59b]" />
                    <div>
                      <h4 className="font-serif text-lg text-white font-medium">
                        Cloud Database & Object Storage Architecture
                      </h4>
                      <p className="text-xs text-purple-300/80">
                        Shared persistence across all devices, phones, laptops, and Vercel deployments.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 1: Neon PostgreSQL */}
                <div className="p-4 rounded-xl bg-[#180a2b] border border-purple-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                      <Database className="w-4 h-4 text-[#f7d59b]" />
                      1. Neon PostgreSQL Database
                    </h5>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      systemStatus.database?.connected
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    }`}>
                      {systemStatus.database?.connected ? '✓ Connected' : 'Persistent Fallback Mode'}
                    </span>
                  </div>
                  <p className="text-xs text-purple-200/80 leading-relaxed">
                    Set your <code className="text-[#f7d59b] font-mono">DATABASE_URL</code> environment variable in Vercel or your local environment. Birthday Verse automatically creates the database table and seeds all 17+ initial family profiles on first run!
                  </p>
                  <div className="bg-[#0e051a] p-3 rounded-lg font-mono text-[11px] text-purple-300 overflow-x-auto">
                    DATABASE_URL="postgresql://username:password@ep-sample-pooler.region.neon.tech/neondb?sslmode=require"
                  </div>
                </div>

                {/* Step 2: Cloudinary Object Storage */}
                <div className="p-4 rounded-xl bg-[#180a2b] border border-purple-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-sky-400" />
                      2. Cloudinary Permanent Cloud Object Storage
                    </h5>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      systemStatus.storage?.isCloudStorage
                        ? 'bg-sky-950 text-sky-300 border border-sky-500/40'
                        : 'bg-purple-950 text-purple-300 border border-purple-500/40'
                    }`}>
                      {systemStatus.storage?.isCloudStorage ? '✓ Cloud CDN Active' : 'Server Fallback Active'}
                    </span>
                  </div>
                  <p className="text-xs text-purple-200/80 leading-relaxed">
                    Uploaded photos are securely transferred to Cloudinary CDN so they never get lost when redeploying or opening on another phone:
                  </p>
                  <div className="bg-[#0e051a] p-3 rounded-lg font-mono text-[11px] text-sky-300 overflow-x-auto space-y-1">
                    <p>CLOUDINARY_URL="cloudinary://API_KEY:API_SECRET@CLOUD_NAME"</p>
                    <p className="text-purple-400 text-[10px]"># Or individual keys: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET</p>
                  </div>
                </div>

                {/* Step 3: Owner Security */}
                <div className="p-4 rounded-xl bg-[#180a2b] border border-purple-500/20 space-y-2">
                  <h5 className="font-semibold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#f7d59b]" />
                    3. Owner Authentication PIN
                  </h5>
                  <p className="text-xs text-purple-200/80 leading-relaxed">
                    Set your custom secret owner PIN via <code className="text-[#f7d59b] font-mono">OWNER_PIN</code>. All add, edit, delete, and upload requests are cryptographically verified by server middleware.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 4: GitHub & Sharing Guide */}
            {activeTab === 'github' && (
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)] space-y-5 text-sm text-purple-100 font-light">
                <div className="bg-[#1c0f33] p-5 rounded-2xl border border-[#f7d59b]/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Github className="w-5 h-5 text-[#f7d59b]" />
                    <h4 className="font-serif text-lg text-white font-medium">
                      Publish & Share with Friends
                    </h4>
                  </div>
                  <p className="text-xs text-purple-200/80 leading-relaxed">
                    You can host this entire full-stack website with Vercel and share links with friends and family worldwide.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#180a2b] border border-purple-500/20">
                    <h5 className="font-semibold text-white text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#f7d59b] text-[#140b24] flex items-center justify-center font-bold text-[10px]">1</span>
                      Push to GitHub
                    </h5>
                    <div className="bg-[#0e051a] p-3 rounded-lg font-mono text-[11px] text-purple-300 overflow-x-auto space-y-1">
                      <p>git init</p>
                      <p>git add .</p>
                      <p>git commit -m "Birthday Verse full-stack with cloud uploads"</p>
                      <p>git branch -M main</p>
                      <p>git remote add origin https://github.com/YOUR_USERNAME/birthday-verse.git</p>
                      <p>git push -u origin main</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#180a2b] border border-purple-500/20">
                    <h5 className="font-semibold text-white text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#f7d59b] text-[#140b24] flex items-center justify-center font-bold text-[10px]">2</span>
                      Deploy on Vercel with Environment Variables
                    </h5>
                    <p className="text-xs text-purple-200/70 leading-relaxed mb-2">
                      Import your GitHub repository on Vercel. In Project Settings → Environment Variables, add:
                    </p>
                    <ul className="text-xs text-purple-300/80 list-disc list-inside space-y-1 font-mono">
                      <li>DATABASE_URL (from Neon console)</li>
                      <li>CLOUDINARY_URL (from Cloudinary dashboard)</li>
                      <li>OWNER_PIN (your secret PIN, default: Shubhade#7002)</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-[#180a2b] border border-purple-500/20">
                    <h5 className="font-semibold text-white text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#f7d59b] text-[#140b24] flex items-center justify-center font-bold text-[10px]">3</span>
                      Sharing Direct Surprise Links
                    </h5>
                    <p className="text-xs text-purple-200/70 leading-relaxed mb-2">
                      Send personalized surprise links directly to friends:
                    </p>
                    <div className="bg-[#0e051a] p-2.5 rounded-lg font-mono text-[11px] text-amber-200 break-all">
                      https://your-domain.vercel.app/?gender=male&dob=19/12/2017
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Interactive Photo Crop & Framing Modal */}
      <ImageCropModal
        isOpen={cropModalData.isOpen}
        onClose={() => setCropModalData((prev) => ({ ...prev, isOpen: false }))}
        imageUrl={cropModalData.imageUrl}
        originalImageUrl={cropModalData.originalImageUrl}
        initialPosition={cropModalData.initialPosition}
        initialScale={cropModalData.initialScale}
        profileName={cropModalData.profileName}
        onApplyCrop={handleApplyCrop}
      />
    </div>
  );
};
