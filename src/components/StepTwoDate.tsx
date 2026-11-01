import React, { useState } from 'react';
import { Gender, Profile } from '../types';
import { formatDateInput, isValidDateFormat } from '../utils/date';
import { Calendar, ArrowLeft, Sparkles } from 'lucide-react';

interface StepTwoDateProps {
  selectedGender: Gender;
  birthdate: string;
  onChangeBirthdate: (val: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  availableProfiles?: Profile[];
  onSelectQuickDate?: (date: string, gender: Gender) => void;
  errorMessage?: string | null;
}

export const StepTwoDate: React.FC<StepTwoDateProps> = ({
  selectedGender,
  birthdate,
  onChangeBirthdate,
  onBack,
  onSubmit,
  errorMessage,
}) => {
  const [nativePickerVal, setNativePickerVal] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value);
    onChangeBirthdate(formatted);
  };

  const handleNativePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM-DD
    setNativePickerVal(val);
    if (!val) return;
    const [y, m, d] = val.split('-');
    const converted = `${d}/${m}/${y}`;
    onChangeBirthdate(converted);
  };

  const isComplete = birthdate.length === 10;
  const isValid = isValidDateFormat(birthdate);

  return (
    <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-[calc(100vh-140px)]">
      {/* Central Glass Card */}
      <div className="w-full max-w-2xl card-glass rounded-[2rem] p-8 sm:p-12 relative overflow-visible text-center mt-6">
        {/* Floating Calendar Icon Badge on top rim */}
        <div className="w-14 h-14 rounded-full border border-purple-400/40 bg-[#251540] flex items-center justify-center absolute -top-7 left-1/2 -translate-x-1/2 shadow-[0_0_25px_rgba(168,85,247,0.35)] z-10">
          <Calendar className="w-6 h-6 text-[#f7d59b]" />
        </div>

        {/* Step Kicker */}
        <p className="text-[11px] uppercase tracking-[0.25em] font-semibold text-purple-300/80 pt-2 mb-2">
          Step 02 · The Magic Date
        </p>

        {/* Editorial Headline */}
        <h2 className="text-3xl sm:text-5xl font-serif text-white font-normal leading-tight">
          When Is Your{' '}
          <span className="font-serif italic text-[#f7d59b] font-normal">
            Special Day?
          </span>
        </h2>

        <p className="text-sm sm:text-base text-purple-200/70 max-w-md mx-auto mt-3 mb-8 font-light">
          Enter your date of birth to unlock your personalized birthday surprise.
        </p>

        {/* Date Input Box */}
        <div className="max-w-md mx-auto text-left">
          <label className="block text-[11px] uppercase tracking-[0.2em] font-semibold text-purple-300/80 mb-2">
            Date of Birth
          </label>

          <div
            className={`relative w-full rounded-2xl border transition-all duration-300 bg-[#120822]/80 py-3.5 px-5 flex items-center justify-between ${
              isComplete && !isValid
                ? 'border-rose-500/70 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                : isComplete && isValid
                ? 'border-[#f7d59b] shadow-[0_0_15px_rgba(247,213,155,0.25)]'
                : 'border-purple-400/30 focus-within:border-[#f7d59b]/80'
            }`}
          >
            <input
              type="text"
              inputMode="numeric"
              value={birthdate}
              onChange={handleInputChange}
              placeholder="14/02/2002"
              maxLength={10}
              className="text-lg sm:text-xl tracking-wider text-white bg-transparent outline-none w-full font-mono placeholder:text-purple-400/30"
              autoFocus
            />

            {/* Calendar icon button that triggers hidden native datepicker */}
            <label className="cursor-pointer text-purple-300 hover:text-[#f7d59b] transition-colors p-1 relative">
              <Calendar className="w-5 h-5" />
              <input
                type="date"
                value={nativePickerVal}
                onChange={handleNativePickerChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                title="Select date"
              />
            </label>
          </div>

          <p className="text-[11px] text-purple-300/60 mt-2.5 font-light text-center">
            Profiles are matched using the selected gender ({selectedGender}) and birthday day/month.
          </p>

          {/* Validation or match error alert */}
          {errorMessage && (
            <div className="mt-4 p-3.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-200 text-xs text-center animate-fadeIn">
              <p className="font-medium text-amber-200 mb-1">{errorMessage}</p>
              <p className="text-[11px] text-purple-300/80">
                Please check your birthdate and gender, or add your profile in Manage Profiles.
              </p>
            </div>
          )}
        </div>

        {/* Buttons: Back + Reveal My Surprise */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 max-w-md mx-auto">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto px-7 py-3.5 rounded-full border border-purple-400/30 bg-[#1e1136]/80 text-purple-200 hover:text-white hover:border-purple-300/60 uppercase tracking-wider text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={!isValid}
            className={`w-full sm:flex-1 py-3.5 px-7 rounded-full uppercase tracking-wider text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
              isValid
                ? 'bg-gradient-to-r from-[#f7d59b] via-[#e8be77] to-[#dca958] text-[#140b24] shadow-[0_0_25px_rgba(247,213,155,0.4)] hover:brightness-105 active:scale-[0.99] cursor-pointer'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            <span>Reveal My Surprise</span>
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
