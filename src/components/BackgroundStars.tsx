import React from 'react';

export const BackgroundStars: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Deep purple radial glows */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-purple-700/20 blur-[130px] rounded-full" />
      <div className="absolute top-1/3 -left-32 w-[550px] h-[550px] bg-indigo-900/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-10 right-0 w-[600px] h-[600px] bg-purple-900/25 blur-[140px] rounded-full" />

      {/* Floating subtle celebratory balloons (visible as in Figma screenshots) */}
      <div className="absolute bottom-12 left-10 opacity-30 select-none animate-subtle-float">
        <div className="w-16 h-22 rounded-full bg-gradient-to-t from-purple-950 via-purple-900 to-purple-800 shadow-lg relative">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-2 h-1 bg-purple-900 rounded-sm" />
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-[1px] h-28 bg-purple-800/40" />
        </div>
      </div>

      <div className="absolute top-20 right-14 opacity-25 select-none animate-subtle-float [animation-delay:2s]">
        <div className="w-20 h-26 rounded-full bg-gradient-to-t from-purple-950 via-purple-900 to-indigo-950 shadow-lg relative">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-2 h-1 bg-purple-900 rounded-sm" />
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-[1px] h-36 bg-purple-800/40" />
        </div>
      </div>

      <div className="absolute bottom-32 -left-4 opacity-20 select-none animate-subtle-float [animation-delay:4s]">
        <div className="w-24 h-32 rounded-full bg-gradient-to-t from-purple-950 to-purple-900 relative">
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-[1px] h-40 bg-purple-800/30" />
        </div>
      </div>

      {/* Twinkling gold star sparkles (as seen across the Figma backgrounds) */}
      <span className="absolute top-16 left-[28%] text-[#f7d59b] text-xs twinkle-star [animation-delay:0.3s]">✦</span>
      <span className="absolute top-36 left-[18%] text-[#f7d59b] text-[10px] twinkle-star [animation-delay:1.1s]">✦</span>
      <span className="absolute top-28 right-[32%] text-[#f7d59b] text-xs twinkle-star [animation-delay:2.2s]">✦</span>
      <span className="absolute top-64 right-[12%] text-[#f7d59b] text-[11px] twinkle-star [animation-delay:0.8s]">✦</span>
      <span className="absolute bottom-36 left-[34%] text-[#f7d59b] text-xs twinkle-star [animation-delay:1.7s]">✦</span>
      <span className="absolute bottom-20 right-[25%] text-[#f7d59b] text-sm twinkle-star [animation-delay:2.9s]">✦</span>
      <span className="absolute top-[52%] left-[8%] text-[#f7d59b] text-[9px] twinkle-star [animation-delay:3.1s]">✦</span>
      <span className="absolute bottom-48 right-[8%] text-[#f7d59b] text-[10px] twinkle-star [animation-delay:1.4s]">✦</span>
      <span className="absolute top-1/2 right-[42%] text-[#f7d59b] text-[8px] twinkle-star [animation-delay:2.5s]">✦</span>
    </div>
  );
};
