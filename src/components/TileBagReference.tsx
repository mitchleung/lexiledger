import React, { useState } from 'react';
import {
  getLetterBasePoints,
  playTabletopSound,
  SCRABBLE_TILES,
} from '../data/scrabbleData';

export interface PlayerSummary {
  id: string;
  name: string;
  score: number;
}

interface TileBagReferenceProps {
  playedWords: { word: string; blankCount: number }[];
  players: PlayerSummary[];
  onApplyEndgameAdjustment: (adjustments: { playerId: string; delta: number; note: string }[]) => void;
}

export const TileBagReference: React.FC<TileBagReferenceProps> = ({
  playedWords,
  players,
  onApplyEndgameAdjustment,
}) => {
  const [winnerId, setWinnerId] = useState<string>(players[0]?.id || '');
  const [remainingRacks, setRemainingRacks] = useState<Record<string, string>>({});
  const [endgameApplied, setEndgameApplied] = useState(false);

  // Count how many of each tile have been played in recorded turns
  const usedCounts: Record<string, number> = {};
  let usedBlanks = 0;

  playedWords.forEach(({ word, blankCount }) => {
    usedBlanks += blankCount;
    const clean = word.toUpperCase().replace(/[^A-Z]/g, '');
    for (const ch of clean) {
      usedCounts[ch] = (usedCounts[ch] || 0) + 1;
    }
  });

  const allTileKeys = Object.keys(SCRABBLE_TILES);
  const totalPlayedTiles = Object.values(usedCounts).reduce((a, b) => a + b, 0);
  const estimatedRemainingTotal = Math.max(0, 100 - totalPlayedTiles);

  const handleCalculateEndgame = (e: React.FormEvent) => {
    e.preventDefault();
    const adjustments: { playerId: string; delta: number; note: string }[] = [];
    let totalDeductedFromOthers = 0;

    players.forEach((p) => {
      if (p.id === winnerId) return;
      const rackLetters = (remainingRacks[p.id] || '').toUpperCase().replace(/[^A-Z]/g, '');
      const rackPenalty = rackLetters
        .split('')
        .reduce((acc, ch) => acc + getLetterBasePoints(ch), 0);
      totalDeductedFromOthers += rackPenalty;
      if (rackPenalty > 0) {
        adjustments.push({
          playerId: p.id,
          delta: -rackPenalty,
          note: `Endgame Rack Deduction (${rackLetters})`,
        });
      }
    });

    if (winnerId && totalDeductedFromOthers > 0) {
      adjustments.push({
        playerId: winnerId,
        delta: totalDeductedFromOthers,
        note: `Endgame Out-Bonus (+${totalDeductedFromOthers} from opponents' racks)`,
      });
    }

    if (adjustments.length > 0) {
      playTabletopSound('score');
      onApplyEndgameAdjustment(adjustments);
      setEndgameApplied(true);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left 7 Cols: Live 100-Tile Distribution & Remaining Tracker */}
      <div className="lg:col-span-7 bg-white border border-[#E6E1DA] rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[#E6E1DA] pb-4">
          <div>
            <h2 className="text-xl font-bold text-[#1C1917] tracking-tight">
              Live 100-Tile Bag &amp; Letter Distribution
            </h2>
            <p className="text-sm text-[#57534E] mt-1">
              Automatically tracks tiles played in recorded turns against standard 100-tile distribution
            </p>
          </div>
          <div className="text-xs font-mono tabular-nums text-[#44403C]">
            <span>Played: {totalPlayedTiles}</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span className="font-semibold text-[#114B36]">
              Unseen (Bag + Racks): {estimatedRemainingTotal}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2.5">
          {allTileKeys.map((key) => {
            const tile = SCRABBLE_TILES[key];
            const used = key === '?' ? usedBlanks : usedCounts[key] || 0;
            const remaining = Math.max(0, tile.countInBag - used);
            const isDepleted = remaining === 0;

            return (
              <div
                key={key}
                className={`p-2.5 rounded-xl border transition-colors ${
                  isDepleted
                    ? 'bg-[#F5F5F4] border-[#E7E5E4] opacity-55'
                    : 'bg-[#FAF8F5] border-[#D6CFC5]'
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-display font-bold text-lg text-[#1C1917]">
                    {key === '?' ? 'Blank' : key}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-[#78716C]">
                    {tile.basePoints}pt
                  </span>
                </div>
                <div className="mt-1.5 flex items-baseline justify-between font-mono text-xs tabular-nums">
                  <span className={isDepleted ? 'text-[#A8A29E]' : 'font-bold text-[#114B36]'}>
                    {remaining} left
                  </span>
                  <span className="text-[11px] text-[#78716C]">/{tile.countInBag}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right 5 Cols: Endgame Unplayed Tile Deduction Calculator & Tournament Rules */}
      <div className="lg:col-span-5 bg-white border border-[#E6E1DA] rounded-2xl p-6 space-y-5">
        <div className="border-b border-[#E6E1DA] pb-4">
          <h3 className="text-lg font-bold text-[#1C1917] tracking-tight">
            Endgame Rack Deduction Calculator
          </h3>
          <p className="text-xs text-[#57534E] mt-1">
            Official rule: When the game ends, each player’s score is reduced by the sum of their unplayed tiles. If one player used all tiles, they receive the sum of all other players’ unplayed tiles.
          </p>
        </div>

        <form onSubmit={handleCalculateEndgame} className="space-y-4">
          <div>
            <label
              htmlFor="out-player-select"
              className="block text-xs font-semibold text-[#44403C] mb-1.5"
            >
              Player Who Went Out (Emptied Rack)
            </label>
            <select
              id="out-player-select"
              value={winnerId}
              onChange={(e) => {
                setWinnerId(e.target.value);
                setEndgameApplied(false);
              }}
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:border-[#114B36]"
            >
              <option value="">No player went out (Blocked board / 6 passes)</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Current: {p.score} pts)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <span className="block text-xs font-semibold text-[#44403C]">
              Remaining Letters on Opponents&apos; Racks
            </span>
            {players.map((p) => {
              const isOutPlayer = p.id === winnerId;
              const rackStr = (remainingRacks[p.id] || '').toUpperCase().replace(/[^A-Z]/g, '');
              const penalty = rackStr
                .split('')
                .reduce((acc, ch) => acc + getLetterBasePoints(ch), 0);

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA]"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#1C1917] truncate">{p.name}</div>
                    <div className="text-xs text-[#78716C] font-mono tabular-nums">
                      {isOutPlayer ? 'Went out (+Bonus recipient)' : `Deduction: -${penalty} pts`}
                    </div>
                  </div>
                  {!isOutPlayer && (
                    <input
                      type="text"
                      maxLength={7}
                      value={remainingRacks[p.id] || ''}
                      onChange={(e) => {
                        setEndgameApplied(false);
                        setRemainingRacks((prev) => ({
                          ...prev,
                          [p.id]: e.target.value.toUpperCase().replace(/[^A-Z]/g, ''),
                        }));
                      }}
                      placeholder="e.g. QZV"
                      className="w-28 px-3 py-1.5 bg-white border border-[#D6CFC5] rounded-lg font-mono text-sm font-bold tracking-wider uppercase text-right text-[#1C1917] focus:outline-none focus:border-[#114B36]"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            {endgameApplied ? (
              <span className="text-xs font-medium text-[#047857]">
                Endgame rack adjustments applied to scoreboard.
              </span>
            ) : (
              <span className="text-xs text-[#78716C]">
                Applies adjustments directly to the official turn log.
              </span>
            )}
            <button
              type="submit"
              className="px-4 py-2.5 text-xs font-semibold text-white bg-[#114B36] hover:bg-[#0D3B2A] rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              Apply Endgame Rack Adjustments
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
