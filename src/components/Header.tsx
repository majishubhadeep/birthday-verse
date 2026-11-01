import React from 'react';
import { StepNumber } from '../types';

interface HeaderProps {
  currentStep: StepNumber;
  onOpenManage: () => void;
  onSelectStep?: (step: StepNumber) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentStep, onOpenManage, onSelectStep }) => {
  const steps: StepNumber[] = [1, 2, 3, 4];

  return (
    <header className="relative z-20 flex items-center justify-between px-6 sm:px-12 py-6 w-full max-w-7xl mx-auto">
      {/* Brand logo & title */}
      <button 
        onClick={() => onSelectStep && onSelectStep(1)}
        className="flex items-center gap-3.5 group cursor-pointer focus:outline-none"
        title="Birthday Verse Home"
      >
        <div className="w-8 h-8 rounded-md border border-[#f7d59b]/50 flex items-center justify-center rotate-45 bg-[#23123d]/80 shadow-[0_0_15px_rgba(247,213,155,0.2)] transition-transform duration-300 group-hover:scale-105 group-hover:border-[#f7d59b]">
          <span className="-rotate-45 text-[#f7d59b] text-xs font-serif select-none">✦</span>
        </div>
        <div className="text-left">
          <span className="text-sm sm:text-base font-bold tracking-[0.22em] text-white select-none">
            BIRTHDAY <span className="text-[#f7d59b] font-medium">VERSE</span>
          </span>
        </div>
      </button>

      {/* Right controls: Manage Profiles + Step Progress Indicator */}
      <div className="flex items-center gap-6 sm:gap-8">
        <button
          onClick={onOpenManage}
          className="px-4 py-1.5 rounded-full border border-purple-300/30 bg-purple-950/40 text-purple-200 hover:text-white hover:border-[#f7d59b]/60 hover:bg-[#2c184d] transition-all text-xs font-semibold tracking-wider uppercase shadow-sm cursor-pointer"
        >
          Manage Profiles
        </button>

        {/* Step Numbers: 01 —— 02 —— 03 —— 04 */}
        <div className="hidden md:flex items-center gap-2 text-xs font-mono select-none">
          {steps.map((num, idx) => {
            const isActive = currentStep === num;
            const isCompleted = currentStep > num;
            return (
              <React.Fragment key={num}>
                <button
                  type="button"
                  onClick={() => onSelectStep && onSelectStep(num)}
                  disabled={!isCompleted && !isActive}
                  className={`transition-colors duration-200 cursor-pointer disabled:cursor-default ${
                    isActive
                      ? 'text-[#f7d59b] font-bold text-sm drop-shadow-[0_0_8px_rgba(247,213,155,0.5)]'
                      : isCompleted
                      ? 'text-purple-300 hover:text-white'
                      : 'text-purple-400/40'
                  }`}
                >
                  0{num}
                </button>
                {idx < steps.length - 1 && (
                  <span
                    className={`w-4 h-[1px] ${
                      isCompleted ? 'bg-[#f7d59b]/50' : 'bg-purple-500/20'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </header>
  );
};
