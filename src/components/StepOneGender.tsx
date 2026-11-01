import React from 'react';
import { Gender } from '../types';

interface StepOneGenderProps {
  selectedGender: Gender | null;
  onSelectGender: (gender: Gender) => void;
  onContinue: () => void;
}

export const StepOneGender: React.FC<StepOneGenderProps> = ({
  selectedGender,
  onSelectGender,
  onContinue,
}) => {
  return (
    <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-8 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center min-h-[calc(100vh-120px)]">
      {/* Left Column: Editorial Headline & Narrative */}
      <div className="lg:col-span-7 flex flex-col justify-center max-w-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-[2px] bg-[#f7d59b]" />
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[#f7d59b]">
            A Celebration Made For You
          </span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif text-white leading-[1.08] tracking-tight">
          Every Birthday <br />
          Has a <span className="text-[#f7d59b] italic font-normal">Story.</span>
        </h1>

        <p className="mt-8 text-base sm:text-lg text-purple-200/80 leading-relaxed font-light">
          A little surprise, a lot of happiness. Discover your special birthday message crafted just for this day.
        </p>

        <div className="mt-12 flex items-center gap-3 text-xs sm:text-sm text-purple-300/70 font-light">
          <div className="flex text-[#f7d59b] text-xs gap-1">
            <span>✦</span>
            <span>✦</span>
            <span>✦</span>
          </div>
          <span>One date. One person. One beautiful moment.</span>
        </div>
      </div>

      {/* Right Column: Step 01 Selection Glass Card */}
      <div className="lg:col-span-5 flex justify-center lg:justify-end">
        <div className="w-full max-w-md card-glass rounded-[2rem] p-7 sm:p-9 relative overflow-hidden transition-all duration-300">
          {/* Subtle card glow overlay */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 blur-2xl rounded-full pointer-events-none" />

          <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-purple-300/80">
            Step 01 · Tell Us About You
          </p>

          <h2 className="font-serif text-3xl sm:text-4xl text-white mt-2 font-normal">
            How do you identify?
          </h2>

          <p className="text-sm text-purple-200/70 mt-1.5 mb-7 font-light">
            Choose one to begin your birthday journey.
          </p>

          {/* Gender selection cards */}
          <div className="grid grid-cols-2 gap-4 mb-7">
            {/* Male option card */}
            <button
              type="button"
              onClick={() => onSelectGender('male')}
              className={`group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl text-left transition-all duration-300 cursor-pointer h-48 sm:h-52 ${
                selectedGender === 'male'
                  ? 'bg-purple-900/50 border-2 border-[#f7d59b] shadow-[0_0_20px_rgba(247,213,155,0.2)]'
                  : 'bg-[#1e1336]/60 border border-purple-500/20 hover:border-purple-400/40 hover:bg-[#251744]/70'
              }`}
            >
              {/* Radio Indicator */}
              <div className="self-end">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    selectedGender === 'male'
                      ? 'border-2 border-[#f7d59b] bg-[#f7d59b]/20 text-[#f7d59b]'
                      : 'border border-purple-400/30 group-hover:border-purple-300/60'
                  }`}
                >
                  {selectedGender === 'male' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#f7d59b]" />
                  )}
                </div>
              </div>

              {/* Male Avatar Illustration */}
              <div className="my-auto flex flex-col items-center justify-center relative">
                <div className="w-16 h-16 sm:w-18 sm:h-18 relative flex items-center justify-center">
                  <span className="absolute -top-1 -right-1 text-[#f7d59b] text-[10px]">◇</span>
                  
                  <svg
                    viewBox="0 0 80 80"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full drop-shadow-md"
                  >
                    <path
                      d="M28 26C28 17.5 33 13 40 13C47 13 52 17.5 52 26V32C52 38.6 46.6 44 40 44C33.4 44 28 38.6 28 32V26Z"
                      fill="#ab7a66"
                    />
                    <path
                      d="M27 24C27 15 32.5 11 40 11C47.5 11 53 15 53 24C50 20 44 19 40 19C35 19 30 21 27 24Z"
                      fill="#1a1528"
                    />
                    <path
                      d="M18 69C18 54 26 47 40 47C54 47 62 54 62 69V70H18V69Z"
                      fill="url(#maleGradient2)"
                    />
                    <defs>
                      <linearGradient id="maleGradient2" x1="18" y1="47" x2="62" y2="70" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#6847ba" />
                        <stop offset="1" stopColor="#432685" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              <span className="font-serif text-lg text-white font-normal mt-2">
                Male
              </span>
            </button>

            {/* Female option card */}
            <button
              type="button"
              onClick={() => onSelectGender('female')}
              className={`group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl text-left transition-all duration-300 cursor-pointer h-48 sm:h-52 ${
                selectedGender === 'female'
                  ? 'bg-purple-900/50 border-2 border-[#f7d59b] shadow-[0_0_20px_rgba(247,213,155,0.2)]'
                  : 'bg-[#1e1336]/60 border border-purple-500/20 hover:border-purple-400/40 hover:bg-[#251744]/70'
              }`}
            >
              {/* Radio Indicator */}
              <div className="self-end">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    selectedGender === 'female'
                      ? 'border-2 border-[#f7d59b] bg-[#f7d59b]/20 text-[#f7d59b]'
                      : 'border border-purple-400/30 group-hover:border-purple-300/60'
                  }`}
                >
                  {selectedGender === 'female' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#f7d59b]" />
                  )}
                </div>
              </div>

              {/* Female Avatar Illustration */}
              <div className="my-auto flex flex-col items-center justify-center relative">
                <div className="w-16 h-16 sm:w-18 sm:h-18 relative flex items-center justify-center">
                  <span className="absolute -top-1 -right-1 text-[#f7d59b] text-[10px]">◇</span>
                  
                  <svg
                    viewBox="0 0 80 80"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full drop-shadow-md"
                  >
                    <path
                      d="M24 33C24 20 31 11 40 11C49 11 56 20 56 33C56 46 51 52 40 52C29 52 24 46 24 33Z"
                      fill="#2b1a38"
                    />
                    <ellipse cx="40" cy="33" rx="10" ry="13" fill="#c49079" />
                    <path
                      d="M18 69C18 53 26 47 40 47C54 47 62 53 62 69V70H18V69Z"
                      fill="url(#femaleGradient2)"
                    />
                    <defs>
                      <linearGradient id="femaleGradient2" x1="18" y1="47" x2="62" y2="70" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#9a3e7e" />
                        <stop offset="1" stopColor="#5d2258" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              <span className="font-serif text-lg text-white font-normal mt-2">
                Female
              </span>
            </button>
          </div>

          {/* Continue CTA */}
          <button
            type="button"
            disabled={!selectedGender}
            onClick={onContinue}
            className={`w-full py-3.5 px-6 rounded-full font-medium tracking-wider text-xs uppercase flex items-center justify-center gap-2 transition-all duration-300 ${
              selectedGender
                ? 'bg-gradient-to-r from-[#f7d59b] via-[#e8be77] to-[#dca958] text-[#140b24] shadow-[0_0_25px_rgba(247,213,155,0.35)] hover:brightness-105 active:scale-[0.99] cursor-pointer'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            <span>Continue</span>
            <span>→</span>
          </button>

          <p className="text-center text-xs text-purple-300/50 mt-3 font-light">
            {selectedGender ? `Selected: ${selectedGender.toUpperCase()}` : 'Select an option to continue'}
          </p>
        </div>
      </div>
    </div>
  );
};
