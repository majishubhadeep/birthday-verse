import React, { useEffect } from 'react';
import { Profile } from '../types';
import { calculateAge, getOrdinalSuffix } from '../utils/date';
import { playCelebrationChime } from '../utils/audio';
import confetti from 'canvas-confetti';
import { ArrowRight, Sparkles, Volume2, Share2, Check } from 'lucide-react';

interface StepThreeSurpriseProps {
  profile: Profile;
  onThankYou: () => void;
}

export const StepThreeSurprise: React.FC<StepThreeSurpriseProps> = ({
  profile,
  onThankYou,
}) => {
  const [copied, setCopied] = React.useState(false);

  // Trigger celebration on mount
  useEffect(() => {
    triggerConfetti();
    playCelebrationChime();
  }, [profile.id]);

  const triggerConfetti = () => {
    try {
      // Golden & violet confetti burst
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#f7d59b', '#e8be77', '#c99a4c', '#a855f7', '#d8b4fe', '#ffffff'],
      });

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 70,
          origin: { x: 0.1, y: 0.65 },
          colors: ['#f7d59b', '#e8be77', '#9333ea'],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 70,
          origin: { x: 0.9, y: 0.65 },
          colors: ['#f7d59b', '#e8be77', '#9333ea'],
        });
      }, 350);
    } catch {
      // Graceful fallback if confetti fails
    }
  };

  const handleShare = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('gender', profile.gender);
    url.searchParams.set('dob', profile.birthdate);
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const age = calculateAge(profile.birthdate);
  const ordinalAge = getOrdinalSuffix(age);

  return (
    <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-8 sm:py-12 min-h-[calc(100vh-120px)] flex items-center justify-center">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left Column: Arched Portrait with Double Gold Hairline Border */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative p-6">
            {/* Fine orbital curved hairline accents matching Figma */}
            <div className="absolute inset-0 rounded-full border border-[#f7d59b]/15 pointer-events-none scale-105" />
            <div className="absolute inset-2 rounded-full border border-purple-400/10 pointer-events-none scale-110" />

            {/* Arched Portrait Container */}
            <div className="relative w-64 sm:w-72 md:w-80 h-96 sm:h-[420px] rounded-t-full rounded-b-3xl p-2.5 bg-gradient-to-b from-[#331c59]/60 to-[#180a2b]/90 border border-[#f7d59b]/40 shadow-[0_0_40px_rgba(247,213,155,0.18)] flex flex-col items-center justify-between overflow-hidden">
              {/* Inner arched hairline border */}
              <div className="absolute inset-1.5 rounded-t-full rounded-b-2xl border border-[#f7d59b]/30 pointer-events-none z-10" />

              {/* Portrait Image */}
              <div className="w-full h-full rounded-t-full rounded-b-2xl overflow-hidden relative bg-[#200f38]">
                {profile.photoUrl && profile.photoUrl.trim() !== '' ? (
                  <img
                    src={profile.photoUrl}
                    alt={profile.name}
                    referrerPolicy="no-referrer"
                    style={{
                      objectPosition: profile.photoPosition || 'center 20%',
                      transform: profile.photoScale ? `scale(${profile.photoScale})` : undefined,
                    }}
                    className="w-full h-full object-cover transition-transform duration-700"
                    onError={(e) => {
                      // Fallback to high-styled monogram placeholder
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      if (target.parentElement) {
                        target.parentElement.innerHTML = `
                          <div class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 to-[#140826] text-[#f7d59b] p-6 text-center">
                            <span class="text-6xl font-serif mb-2">✦</span>
                            <span class="text-2xl font-serif text-white">${profile.name}</span>
                            <span class="text-xs uppercase tracking-widest text-[#f7d59b]/70 mt-2">${profile.relationship}</span>
                          </div>
                        `;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 to-[#140826] text-[#f7d59b] p-6 text-center">
                    <span className="text-6xl font-serif mb-2">✦</span>
                    <span className="text-2xl font-serif text-white">{profile.name}</span>
                    <span className="text-xs uppercase tracking-widest text-[#f7d59b]/70 mt-2">{profile.relationship}</span>
                  </div>
                )}

                {/* Subtle dark gradient scrim at bottom */}
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#140826] via-[#140826]/60 to-transparent" />

                {/* "TODAY'S STAR" Pill Badge inside bottom of arch */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                  <div className="px-4 py-1 rounded-full bg-[#180b2c]/85 border border-[#f7d59b]/40 backdrop-blur-md shadow-md">
                    <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#f7d59b]">
                      Today's Star
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-purple-300/40 mt-3 font-light tracking-wider">
              Birthday profile portrait
            </p>
          </div>
        </div>

        {/* Right Column: Narrative, Wishes & Quote */}
        <div className="lg:col-span-7 flex flex-col justify-center text-left max-w-xl">
          {/* Subtitle kicker */}
          <p className="font-serif italic text-base sm:text-lg text-[#f7d59b] mb-1">
            A little magic, just for you
          </p>

          {/* Grand Birthday Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-white tracking-tight uppercase leading-[1.08]">
            Happy {ordinalAge} <br />
            Birthday, <br />
            <span className="text-[#f7d59b] italic normal-case font-normal">
              {profile.name}!
            </span>
          </h1>

          {/* Golden star divider */}
          <div className="flex items-center gap-2 my-5 text-[#f7d59b]">
            <span className="w-6 h-[1px] bg-[#f7d59b]/40" />
            <span className="text-xs">✦</span>
            <span className="w-12 h-[1px] bg-[#f7d59b]/40" />
          </div>

          {/* Heartfelt Birthday Message */}
          <p className="text-base sm:text-lg text-purple-100/90 leading-relaxed font-light mb-6">
            {profile.wish}
          </p>

          {/* Quote Card matching Figma design */}
          <div className="card-glass rounded-2xl p-5 sm:p-6 border border-[#f7d59b]/25 bg-[#1e1038]/75 relative overflow-hidden mb-8 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
            <div className="flex items-start gap-3.5">
              <span className="text-[#f7d59b] text-base shrink-0 mt-0.5">✦</span>
              <div>
                <p className="font-serif italic text-white/95 text-sm sm:text-base leading-relaxed">
                  "{profile.quote}"
                </p>
                {profile.quoteAuthor && (
                  <p className="text-[11px] uppercase tracking-widest text-[#f7d59b]/80 mt-2 font-sans font-medium">
                    — {profile.quoteAuthor}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3.5">
            {/* Primary Action Button: "THANK YOU →" */}
            <button
              type="button"
              onClick={onThankYou}
              className="py-3.5 px-8 rounded-full bg-gradient-to-r from-[#f7d59b] via-[#e8be77] to-[#dca958] text-[#140b24] shadow-[0_0_25px_rgba(247,213,155,0.4)] hover:brightness-105 active:scale-[0.99] uppercase tracking-wider text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Thank You</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Celebrate Again / Confetti button */}
            <button
              type="button"
              onClick={triggerConfetti}
              title="Launch Confetti"
              className="py-3.5 px-5 rounded-full border border-purple-400/30 bg-[#20103b]/80 text-purple-200 hover:text-white hover:border-[#f7d59b]/50 text-xs font-medium uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#f7d59b]" />
              <span>Celebrate</span>
            </button>

            {/* Play Chime Audio */}
            <button
              type="button"
              onClick={playCelebrationChime}
              title="Play celebratory chime"
              className="p-3.5 rounded-full border border-purple-400/30 bg-[#20103b]/80 text-purple-200 hover:text-white hover:border-[#f7d59b]/50 transition-all cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-[#f7d59b]" />
            </button>

            {/* Share Link */}
            <button
              type="button"
              onClick={handleShare}
              title="Copy direct link for this person"
              className="py-3.5 px-4 rounded-full border border-purple-400/30 bg-[#20103b]/80 text-purple-200 hover:text-white hover:border-[#f7d59b]/50 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Share Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
