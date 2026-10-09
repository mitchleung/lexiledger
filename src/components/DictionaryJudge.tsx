import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  BookOpen,
  RotateCcw,
} from 'lucide-react';
import {
  calculateWordScore,
  DictionaryVerificationResult,
  LetterMultiplier,
  playTabletopSound,
  TOURNAMENT_LEXICON,
  verifyScrabbleWord,
  WordMultiplier,
} from '../data/scrabbleData';
import { ScrabbleTileRack } from './ScrabbleTileRack';

interface DictionaryJudgeProps {
  onSendToScorer: (
    word: string,
    letterMultipliers: LetterMultiplier[],
    wordMultiplier: WordMultiplier,
    isBingo: boolean
  ) => void;
  activePlayerName: string;
  initialQuery?: string;
}

type CheatCategory = 'two-letter' | 'q-without-u' | 'power-tiles' | 'vowel-dump';

export const DictionaryJudge: React.FC<DictionaryJudgeProps> = ({
  onSendToScorer,
  activePlayerName,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [letterMultipliers, setLetterMultipliers] = useState<LetterMultiplier[]>([]);
  const [wordMultiplier, setWordMultiplier] = useState<WordMultiplier>(1);
  const [isBingo, setIsBingo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DictionaryVerificationResult | null>(null);
  const [cheatCategory, setCheatCategory] = useState<CheatCategory>('two-letter');
  const [recentLookups, setRecentLookups] = useState<DictionaryVerificationResult[]>([]);

  const cleanWord = query.toUpperCase().replace(/[^A-Z]/g, '');

  useEffect(() => {
    setLetterMultipliers((prev) => {
      const next: LetterMultiplier[] = [];
      for (let i = 0; i < cleanWord.length; i++) {
        next.push(prev[i] || '1x');
      }
      return next;
    });
    if (cleanWord.length >= 7) {
      setIsBingo(true);
    } else {
      setIsBingo(false);
    }
  }, [cleanWord]);

  useEffect(() => {
    if (!cleanWord) {
      setResult(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      const verified = await verifyScrabbleWord(cleanWord);
      if (!cancelled) {
        setResult(verified);
        setLoading(false);
        setRecentLookups((prev) => {
          const filtered = prev.filter((item) => item.word !== verified.word);
          return [verified, ...filtered].slice(0, 6);
        });
      }
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cleanWord]);

  const handleToggleTileMultiplier = (index: number) => {
    const order: LetterMultiplier[] = ['1x', 'DL', 'TL', 'BLANK'];
    setLetterMultipliers((prev) => {
      const copy = [...prev];
      const current = copy[index] || '1x';
      const nextIdx = (order.indexOf(current) + 1) % order.length;
      copy[index] = order[nextIdx];
      return copy;
    });
  };

  const scoreBreakdown = calculateWordScore(
    cleanWord,
    letterMultipliers,
    wordMultiplier,
    isBingo,
    0
  );

  const cheatWords = Object.values(TOURNAMENT_LEXICON).filter(
    (entry) => entry.category === cheatCategory
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left 7 columns: Interactive Word Verifier & Point Simulator */}
      <div className="lg:col-span-7 bg-white border border-[#E6E1DA] rounded-2xl p-6 space-y-6">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[#E6E1DA] pb-4">
          <div>
            <h2 className="text-xl font-bold text-[#1C1917] tracking-tight">
              Official Word Judge &amp; Point Calculator
            </h2>
            <p className="text-sm text-[#57534E] mt-1">
              Instant spelling verification with live tile &amp; board square multiplier simulation
            </p>
          </div>
          <span className="text-xs text-[#78716C] font-mono">
            TWL · CSW · Oxford Lexical Engine
          </span>
        </div>

        {/* Search Input */}
        <div className="space-y-2">
          <label
            htmlFor="dictionary-word-input"
            className="block text-xs font-semibold text-[#44403C]"
          >
            Enter Word to Verify (2–15 Letters)
          </label>
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-[#78716C] absolute left-4 pointer-events-none" />
            <input
              id="dictionary-word-input"
              type="text"
              maxLength={15}
              value={query}
              onChange={(e) => setQuery(e.target.value.toUpperCase().replace(/[^A-Za-z]/g, ''))}
              placeholder="Type any word (e.g. QUARTZ, QI, ZA, ZEPHYR)..."
              className="w-full pl-12 pr-28 py-3.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl font-mono text-lg font-bold tracking-wider text-[#1C1917] placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-[#A8A29E] focus:outline-none focus:border-[#114B36] focus:bg-white transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setWordMultiplier(1);
                  setIsBingo(false);
                }}
                className="absolute right-3 px-3 py-1.5 text-xs font-medium text-[#57534E] hover:text-[#1C1917] bg-[#EFECE6] hover:bg-[#E5E0D8] rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Interactive Tile Rack */}
        <ScrabbleTileRack
          word={cleanWord}
          multipliers={letterMultipliers}
          onToggleMultiplier={handleToggleTileMultiplier}
          interactive={true}
          size="lg"
        />

        {/* Word-Level Multipliers & Bingo Controls */}
        {cleanWord.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#E6E1DA]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-[#57534E] mr-1">Word Bonus:</span>
              {(
                [
                  { value: 1, label: '1× Standard' },
                  { value: 2, label: '2× Double Word' },
                  { value: 3, label: '3× Triple Word' },
                  { value: 4, label: '4× Double-Double' },
                  { value: 9, label: '9× Triple-Triple' },
                ] as { value: WordMultiplier; label: string }[]
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    playTabletopSound('tile');
                    setWordMultiplier(option.value);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    wordMultiplier === option.value
                      ? option.value >= 2
                        ? 'bg-[#FFF1F2] border-[#F43F5E] text-[#9F1239] font-semibold'
                        : 'bg-[#1C1917] border-[#1C1917] text-white'
                      : 'bg-[#FAF8F5] border-[#D6CFC5] text-[#44403C] hover:bg-[#F0ECE3]'
                  }`}
                >
                  {option.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  playTabletopSound('tile');
                  setIsBingo((b) => !b);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                  isBingo
                    ? 'bg-[#ECFDF5] border-[#059669] text-[#065F46] font-semibold'
                    : 'bg-[#FAF8F5] border-[#D6CFC5] text-[#44403C] hover:bg-[#F0ECE3]'
                }`}
              >
                +50 Bingo (7 Tiles)
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setLetterMultipliers(cleanWord.split('').map(() => '1x'));
                setWordMultiplier(1);
                setIsBingo(cleanWord.length >= 7);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#57534E] hover:text-[#1C1917] whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Multipliers
            </button>
          </div>
        )}

        {/* Verification Verdict & Definition Area */}
        {loading ? (
          <div className="p-5 rounded-xl border border-[#E6E1DA] bg-[#FAF8F5] animate-pulse space-y-3">
            <div className="h-5 w-48 bg-[#E6E1DA] rounded" />
            <div className="h-4 w-full bg-[#E6E1DA] rounded" />
            <div className="h-4 w-2/3 bg-[#E6E1DA] rounded" />
          </div>
        ) : result && cleanWord ? (
          <div
            className={`p-5 rounded-xl border transition-colors ${
              result.isValid
                ? 'bg-[#F3FAF6] border-[#A7F3D0]'
                : 'bg-[#FEF2F2] border-[#FECACA]'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {result.isValid ? (
                    <CheckCircle2 className="w-5 h-5 text-[#047857] shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-[#B91C1C] shrink-0" />
                  )}
                  <span
                    className={`text-sm font-bold tracking-tight ${
                      result.isValid ? 'text-[#065F46]' : 'text-[#991B1B]'
                    }`}
                  >
                    {result.isValid
                      ? `Valid Tournament Word — "${result.word}"`
                      : `Invalid Scrabble Word — "${result.word}"`}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E] pl-7">
                  <span>{result.partOfSpeech}</span>
                  {result.phonetic && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{result.phonetic}</span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span>Source: {result.source}</span>
                  {result.specialNote && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-[#114B36]">{result.specialNote}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Total Points Display */}
              <div className="text-right pl-7 sm:pl-0">
                <div className="font-mono text-2xl font-bold tabular-nums text-[#1C1917]">
                  {scoreBreakdown.totalScore} pts
                </div>
                <div className="text-xs text-[#57534E] font-mono tabular-nums">
                  Base: {result.basePoints} pts
                  {wordMultiplier > 1 ? ` × ${wordMultiplier}` : ''}
                  {isBingo ? ' + 50 Bingo' : ''}
                </div>
              </div>
            </div>

            {/* Definitions List */}
            <div className="mt-4 pl-7 space-y-1.5 text-sm text-[#292524]">
              {result.definitions.map((def, i) => (
                <p key={i} className="leading-relaxed">
                  {result.definitions.length > 1 ? `${i + 1}. ` : ''}
                  {def}
                </p>
              ))}
            </div>

            {/* Action to send straight to active player's turn scorer */}
            {result.isValid && (
              <div className="mt-5 pl-7 pt-4 border-t border-[#A7F3D0]/60 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-[#065F46]">
                  Ready to score for <strong>{activePlayerName}</strong>?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    playTabletopSound('valid');
                    onSendToScorer(cleanWord, letterMultipliers, wordMultiplier, isBingo);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#114B36] hover:bg-[#0D3B2A] rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Load into {activePlayerName}&apos;s Turn ({scoreBreakdown.totalScore} pts)
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : null}

        {/* Recent Lookups Strip */}
        {recentLookups.length > 0 && (
          <div className="pt-2 border-t border-[#E6E1DA] flex flex-wrap items-center gap-2 text-xs text-[#57534E]">
            <span className="font-medium text-[#44403C]">Recent Verifications:</span>
            {recentLookups.map((item, idx) => (
              <React.Fragment key={item.word}>
                {idx > 0 && <span aria-hidden="true">·</span>}
                <button
                  type="button"
                  onClick={() => setQuery(item.word)}
                  className="font-mono hover:underline text-[#1C1917] inline-flex items-center gap-1"
                >
                  <span>{item.word}</span>
                  <span className={item.isValid ? 'text-[#047857]' : 'text-[#B91C1C]'}>
                    ({item.isValid ? `${item.basePoints}p` : '✕'})
                  </span>
                </button>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Right 5 columns: Official Tournament Cheat Sheet */}
      <div className="lg:col-span-5 bg-white border border-[#E6E1DA] rounded-2xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-3 border-b border-[#E6E1DA] pb-4">
          <div>
            <h3 className="text-lg font-bold text-[#1C1917] tracking-tight flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#114B36]" />
              Tournament Word Reference
            </h3>
            <p className="text-xs text-[#57534E] mt-1">
              Click any high-utility tournament word to inspect its definition and point value
            </p>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F3EFEA] rounded-xl">
          {(
            [
              { id: 'two-letter', label: '2-Letter Words (107)' },
              { id: 'q-without-u', label: 'Q Without U' },
              { id: 'power-tiles', label: 'J / X / Z Power' },
              { id: 'vowel-dump', label: 'Vowel Dumps' },
            ] as { id: CheatCategory; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCheatCategory(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                cheatCategory === tab.id
                  ? 'bg-white text-[#1C1917] shadow-xs font-semibold'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Grid of clickable words */}
        <div className="max-h-96 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {cheatWords.map((entry) => {
            const pts = entry.word
              .split('')
              .reduce((sum, ch) => sum + (TOURNAMENT_LEXICON[entry.word] ? 0 : 0) + (ch ? 0 : 0), 0);
            void pts;
            const baseScore = calculateWordScore(entry.word, [], 1, false).baseLetterSum;
            const isSelected = cleanWord === entry.word;

            return (
              <button
                key={entry.word}
                type="button"
                onClick={() => {
                  playTabletopSound('tile');
                  setQuery(entry.word);
                }}
                className={`text-left p-2.5 rounded-xl border transition-colors ${
                  isSelected
                    ? 'bg-[#F3FAF6] border-[#114B36]'
                    : 'bg-[#FAF8F5] border-[#E6E1DA] hover:bg-[#F3EFEA]'
                }`}
              >
                <div className="flex items-baseline justify-between gap-1">
                  <span className="font-mono font-bold text-sm text-[#1C1917]">
                    {entry.word}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-[#114B36] font-semibold">
                    {baseScore}p
                  </span>
                </div>
                <p className="text-[11px] text-[#57534E] truncate mt-0.5" title={entry.definition}>
                  {entry.definition}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
