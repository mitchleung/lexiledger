import React from 'react';
import {
  getEffectiveTilePoints,
  getLetterBasePoints,
  LetterMultiplier,
  playTabletopSound,
} from '../data/scrabbleData';

interface ScrabbleTileRackProps {
  word: string;
  multipliers: LetterMultiplier[];
  onToggleMultiplier?: (index: number) => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const NEXT_MULTIPLIER: Record<LetterMultiplier, LetterMultiplier> = {
  '1x': 'DL',
  DL: 'TL',
  TL: 'BLANK',
  BLANK: '1x',
};

export const ScrabbleTileRack: React.FC<ScrabbleTileRackProps> = ({
  word,
  multipliers,
  onToggleMultiplier,
  interactive = true,
  size = 'lg',
}) => {
  const letters = word
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .split('');

  if (letters.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 rounded-xl border border-dashed border-[#D6CFC5] bg-[#F5F1EA]/60 px-6 text-sm text-[#78716C]">
        Type a word above to place tiles on the rack and calculate letter &amp; square multipliers
      </div>
    );
  }

  const sizeClasses = {
    sm: 'w-10 h-11 text-lg',
    md: 'w-12 h-14 text-xl',
    lg: 'w-14 h-16 text-2xl',
  }[size];

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2 p-3.5 rounded-xl bg-[#EAE3D5] border border-[#D5CBB8] shadow-inner">
        {letters.map((char, index) => {
          const mult: LetterMultiplier = multipliers[index] || '1x';
          const basePts = getLetterBasePoints(char);
          const effectivePts = getEffectiveTilePoints(char, mult);
          const nextMult = NEXT_MULTIPLIER[mult];

          let tileSurface =
            'bg-gradient-to-b from-[#FBF3DC] to-[#EFE0B9] border-[#C8B282] text-[#1C1917] shadow-[0_3px_0_#B89F6D]';
          let badgeText = '';
          let badgeStyle = 'text-[#78716C]';

          if (mult === 'DL') {
            tileSurface =
              'bg-gradient-to-b from-[#E0F2FE] to-[#BAE6FD] border-[#38BDF8] text-[#0C4A6E] shadow-[0_3px_0_#0284C7]';
            badgeText = '2× LTR';
            badgeStyle = 'text-[#0369A1] font-semibold';
          } else if (mult === 'TL') {
            tileSurface =
              'bg-gradient-to-b from-[#BAE6FD] to-[#7DD3FC] border-[#0284C7] text-[#082F49] shadow-[0_3px_0_#0369A1]';
            badgeText = '3× LTR';
            badgeStyle = 'text-[#075985] font-bold';
          } else if (mult === 'BLANK') {
            tileSurface =
              'bg-gradient-to-b from-[#F5F5F4] to-[#E7E5E4] border-[#A8A29E] text-[#57534E] shadow-[0_3px_0_#78716C]';
            badgeText = 'BLANK';
            badgeStyle = 'text-[#57534E] font-medium';
          }

          return (
            <div key={`${char}-${index}`} className="flex flex-col items-center gap-1">
              <button
                type="button"
                disabled={!interactive}
                onClick={() => {
                  if (interactive && onToggleMultiplier) {
                    playTabletopSound('tile');
                    onToggleMultiplier(index);
                  }
                }}
                title={
                  interactive
                    ? `Click to change "${char}" from ${mult} to ${nextMult} (Base: ${basePts} pt)`
                    : `${char} (${effectivePts} pts)`
                }
                className={`relative flex items-center justify-center rounded-lg border select-none transition-transform duration-150 ${sizeClasses} ${tileSurface} ${
                  interactive
                    ? 'cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#114B36]'
                    : 'cursor-default'
                }`}
              >
                <span className="font-display font-bold tracking-tight leading-none -mt-1">
                  {char}
                </span>
                <span className="absolute bottom-1 right-1.5 font-mono text-[11px] font-bold tabular-nums leading-none opacity-85">
                  {effectivePts}
                </span>
              </button>
              {interactive && (
                <span className={`font-mono text-[10px] tracking-tight tabular-nums h-3.5 ${badgeStyle}`}>
                  {badgeText || '1×'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {interactive && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#57534E]">
          <span>
            Click any letter tile to cycle square bonus: Standard (1×) · Double Letter (2×) · Triple Letter (3×) · Blank Tile (0 pt)
          </span>
          <span className="font-mono tabular-nums text-[#1C1917] font-medium">
            {letters.length} {letters.length === 1 ? 'tile' : 'tiles'}
          </span>
        </div>
      )}
    </div>
  );
};
