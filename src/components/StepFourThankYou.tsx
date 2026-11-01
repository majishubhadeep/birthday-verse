import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface StepFourThankYouProps {
  onBackToHome: () => void;
}

export const StepFourThankYou: React.FC<StepFourThankYouProps> = ({ onBackToHome }) => {
  return (
    <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-16 flex flex-col items-center justify-center text-center min-h-[calc(100vh-140px)]">
      {/* Centered Glowing Star Circle Badge matching Figma */}
      <div className="w-16 h-16 rounded-full border border-purple-400/40 bg-[#23133d] flex items-center justify-center shadow-[0_0_30px_rgba(247,213,155,0.25)] mb-8 transition-transform duration-500 hover:scale-105">
        <span className="text-2xl text-[#f7d59b] font-serif">✦</span>
      </div>

      {/* Subtitle */}
      <p className="font-serif italic text-lg sm:text-xl text-[#f7d59b]/90 mb-3 tracking-wide">
        Until we celebrate again
      </p>

      {/* Grand Title */}
      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif text-white tracking-tight uppercase leading-[1.1] max-w-3xl">
        Thank You For Being <br className="hidden sm:inline" />
        Part Of <br />
        <span className="text-[#f7d59b] italic font-normal">
          Birthday Verse!
        </span>
      </h1>

      {/* Subtext */}
      <p className="mt-8 text-base sm:text-lg text-purple-200/80 max-w-xl mx-auto font-light leading-relaxed">
        May happiness, love, and beautiful memories always find their way to you.
      </p>

      {/* Back to Home CTA */}
      <div className="mt-10">
        <button
          type="button"
          onClick={onBackToHome}
          className="py-3.5 px-8 rounded-full bg-gradient-to-r from-[#f7d59b] via-[#e8be77] to-[#dca958] text-[#140b24] shadow-[0_0_25px_rgba(247,213,155,0.4)] hover:brightness-105 active:scale-[0.99] uppercase tracking-wider text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>

      {/* Footer Branding Note */}
      <div className="mt-20">
        <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-purple-300/40 font-light">
          Made For Moments Worth Remembering
        </p>
      </div>
    </div>
  );
};
