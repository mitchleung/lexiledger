import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Plus,
  Trash2,
  ArrowRight,
  Clock,
  SkipForward,
  RefreshCw,
  Award,
  Search,
  UserPlus,
  Download,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import {
  calculateWordScore,
  DictionaryVerificationResult,
  LetterMultiplier,
  playTabletopSound,
  verifyScrabbleWord,
  WordMultiplier,
} from './data/scrabbleData';
import { ScrabbleTileRack } from './components/ScrabbleTileRack';
import { DictionaryJudge } from './components/DictionaryJudge';
import { TileBagReference } from './components/TileBagReference';

export interface Player {
  id: string;
  name: string;
}

export interface TurnEntry {
  id: string;
  round: number;
  turnNumber: number;
  playerId: string;
  playerName: string;
  actionType: 'PLAY' | 'PASS' | 'EXCHANGE' | 'ADJUSTMENT';
  word: string;
  secondaryWords?: string;
  letterMultipliers: LetterMultiplier[];
  wordMultiplier: WordMultiplier;
  isBingo: boolean;
  crossWordsPoints: number;
  pointsEarned: number;
  isValidDictionaryWord: boolean;
  timestamp: string;
}

type ActiveTab = 'scoreboard' | 'dictionary' | 'history' | 'tilebag';

const INITIAL_PLAYERS: Player[] = [
  { id: 'p1', name: 'Player 1' },
  { id: 'p2', name: 'Player 2' },
  { id: 'p3', name: 'Player 3' },
  { id: 'p4', name: 'Player 4' },
];

const INITIAL_TURNS: TurnEntry[] = [];

const STORAGE_KEY = 'lexiledger_scrabble_state_v2';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('scoreboard');
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.players) && parsed.players.length >= 2) {
          return parsed.players;
        }
      }
    } catch {
      // Fallback to initial
    }
    return INITIAL_PLAYERS;
  });

  const [turns, setTurns] = useState<TurnEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.turns)) {
          return parsed.turns;
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_TURNS;
  });

  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.activePlayerIndex === 'number') {
          return parsed.activePlayerIndex % (parsed.players?.length || 4);
        }
      }
    } catch {
      // Fallback
    }
    return 0;
  });

  // Turn Scorer State
  const [wordInput, setWordInput] = useState<string>('');
  const [letterMultipliers, setLetterMultipliers] = useState<LetterMultiplier[]>([]);
  const [wordMultiplier, setWordMultiplier] = useState<WordMultiplier>(1);
  const [isBingo, setIsBingo] = useState<boolean>(false);
  const [crossWordsDesc, setCrossWordsDesc] = useState<string>('');
  const [crossWordsPoints, setCrossWordsPoints] = useState<number>(0);
  const [liveVerification, setLiveVerification] = useState<DictionaryVerificationResult | null>(null);
  const [verifyingWord, setVerifyingWord] = useState<boolean>(false);
  const [strictTournamentRule, setStrictTournamentRule] = useState<boolean>(false);
  const [turnErrorMsg, setTurnErrorMsg] = useState<string | null>(null);

  // Turn Timer State
  const [turnSeconds, setTurnSeconds] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(true);

  // Inline Player Name Editing
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState<string>('');

  // New Game Setup Modal
  const [showNewGameModal, setShowNewGameModal] = useState<boolean>(false);
  const [setupPlayerCount, setSetupPlayerCount] = useState<number>(4);
  const [setupNames, setSetupNames] = useState<string[]>([
    'Player 1',
    'Player 2',
    'Player 3',
    'Player 4',
  ]);

  // History filter
  const [historyPlayerFilter, setHistoryPlayerFilter] = useState<string>('ALL');

  // Quick Dashboard Dictionary Verifier State
  const [quickDictInput, setQuickDictInput] = useState<string>('');
  const [quickDictResult, setQuickDictResult] = useState<DictionaryVerificationResult | null>(null);
  const [quickDictLoading, setQuickDictLoading] = useState<boolean>(false);

  // Clean up legacy demo storage key on mount
  useEffect(() => {
    try {
      localStorage.removeItem('lexiledger_scrabble_state_v1');
    } catch {
      // Ignore storage errors
    }
  }, []);

  useEffect(() => {
    const cleanQuick = quickDictInput.toUpperCase().replace(/[^A-Z]/g, '');
    if (!cleanQuick) {
      setQuickDictResult(null);
      setQuickDictLoading(false);
      return;
    }
    let cancelled = false;
    setQuickDictLoading(true);
    const timer = setTimeout(async () => {
      const res = await verifyScrabbleWord(cleanQuick);
      if (!cancelled) {
        setQuickDictResult(res);
        setQuickDictLoading(false);
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [quickDictInput]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ players, turns, activePlayerIndex })
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [players, turns, activePlayerIndex]);

  // Turn Timer Effect
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setTurnSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const cleanWord = wordInput.toUpperCase().replace(/[^A-Z]/g, '');

  // Keep letterMultipliers array synced with cleanWord length
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
    setTurnErrorMsg(null);
  }, [cleanWord]);

  // Live Dictionary Verification inside Turn Scorer
  useEffect(() => {
    if (!cleanWord) {
      setLiveVerification(null);
      setVerifyingWord(false);
      return;
    }

    let cancelled = false;
    setVerifyingWord(true);

    const timer = setTimeout(async () => {
      const res = await verifyScrabbleWord(cleanWord);
      if (!cancelled) {
        setLiveVerification(res);
        setVerifyingWord(false);
      }
    }, 160);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cleanWord]);

  const activePlayer = players[activePlayerIndex] || players[0];
  const currentRound = Math.floor(turns.length / players.length) + 1;

  // Compute Player Stats & Real-Time Leaderboard
  const playerStats = useMemo(() => {
    const stats = players.map((player, seatIndex) => {
      const playerTurns = turns.filter((t) => t.playerId === player.id);
      const playTurns = playerTurns.filter((t) => t.actionType === 'PLAY');
      const totalScore = playerTurns.reduce((sum, t) => sum + t.pointsEarned, 0);
      const avgScore =
        playerTurns.length > 0
          ? Math.round((totalScore / playerTurns.length) * 10) / 10
          : 0;
      const bestTurn =
        playTurns.length > 0
          ? playTurns.reduce((best, curr) =>
              curr.pointsEarned > best.pointsEarned ? curr : best
            )
          : null;
      const bingoCount = playTurns.filter((t) => t.isBingo).length;

      return {
        ...player,
        seatIndex,
        totalScore,
        turnsTaken: playerTurns.length,
        avgScore,
        bestTurn,
        bingoCount,
        recentTurns: playerTurns.slice(-4),
      };
    });

    const sortedByScore = [...stats].sort((a, b) => b.totalScore - a.totalScore);
    const leaderScore = sortedByScore[0]?.totalScore || 0;

    return stats.map((st) => {
      const rank =
        sortedByScore.findIndex((item) => item.id === st.id) + 1;
      const pointsBehind = Math.max(0, leaderScore - st.totalScore);
      return {
        ...st,
        rank,
        pointsBehind,
      };
    });
  }, [players, turns]);

  const leaderboard = useMemo(() => {
    return [...playerStats].sort((a, b) => b.totalScore - a.totalScore);
  }, [playerStats]);

  const currentScorePreview = useMemo(() => {
    return calculateWordScore(
      cleanWord,
      letterMultipliers,
      wordMultiplier,
      isBingo,
      Number(crossWordsPoints) || 0
    );
  }, [cleanWord, letterMultipliers, wordMultiplier, isBingo, crossWordsPoints]);

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

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const resetTurnForm = () => {
    setWordInput('');
    setLetterMultipliers([]);
    setWordMultiplier(1);
    setIsBingo(false);
    setCrossWordsDesc('');
    setCrossWordsPoints(0);
    setTurnErrorMsg(null);
    setTurnSeconds(0);
  };

  const handleRecordWordTurn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanWord || cleanWord.length < 2) {
      playTabletopSound('invalid');
      setTurnErrorMsg('Please enter a played word of at least 2 letters.');
      return;
    }

    const verification = liveVerification || (await verifyScrabbleWord(cleanWord));

    if (strictTournamentRule && !verification.isValid) {
      playTabletopSound('invalid');
      setTurnErrorMsg(
        `Strict Tournament Challenge Active: "${cleanWord}" is not in the official Scrabble dictionary and cannot be recorded.`
      );
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newEntry: TurnEntry = {
      id: `turn_${Date.now()}`,
      round: currentRound,
      turnNumber: turns.length + 1,
      playerId: activePlayer.id,
      playerName: activePlayer.name,
      actionType: 'PLAY',
      word: cleanWord,
      secondaryWords: crossWordsDesc.trim() || undefined,
      letterMultipliers: [...letterMultipliers],
      wordMultiplier,
      isBingo,
      crossWordsPoints: Number(crossWordsPoints) || 0,
      pointsEarned: currentScorePreview.totalScore,
      isValidDictionaryWord: verification.isValid,
      timestamp: timeStr,
    };

    playTabletopSound('score');
    setTurns((prev) => [...prev, newEntry]);
    setActivePlayerIndex((prev) => (prev + 1) % players.length);
    resetTurnForm();
  };

  const handlePassOrExchange = (type: 'PASS' | 'EXCHANGE') => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newEntry: TurnEntry = {
      id: `turn_${Date.now()}`,
      round: currentRound,
      turnNumber: turns.length + 1,
      playerId: activePlayer.id,
      playerName: activePlayer.name,
      actionType: type,
      word: type === 'PASS' ? 'PASSED TURN' : 'EXCHANGED TILES',
      letterMultipliers: [],
      wordMultiplier: 1,
      isBingo: false,
      crossWordsPoints: 0,
      pointsEarned: 0,
      isValidDictionaryWord: true,
      timestamp: timeStr,
    };

    playTabletopSound('tile');
    setTurns((prev) => [...prev, newEntry]);
    setActivePlayerIndex((prev) => (prev + 1) % players.length);
    resetTurnForm();
  };

  const handleUndoLastTurn = () => {
    if (turns.length === 0) return;
    playTabletopSound('tile');
    setTurns((prev) => prev.slice(0, -1));
    setActivePlayerIndex((prev) => (prev - 1 + players.length) % players.length);
  };

  const handleDeleteTurnById = (turnId: string) => {
    playTabletopSound('tile');
    setTurns((prev) => prev.filter((t) => t.id !== turnId));
  };

  const handleAddPlayerSeat = () => {
    if (players.length >= 4) return;
    const nextSeatNum = players.length + 1;
    const newPlayer: Player = {
      id: `p_${Date.now()}`,
      name: `Player ${nextSeatNum}`,
    };
    setPlayers((prev) => [...prev, newPlayer]);
  };

  const handleRemovePlayerSeat = (playerId: string) => {
    if (players.length <= 2) return;
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    setActivePlayerIndex(0);
  };

  const handleSavePlayerName = (playerId: string) => {
    const trimmed = editingNameValue.trim();
    if (!trimmed) {
      setEditingPlayerId(null);
      return;
    }
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, name: trimmed } : p))
    );
    setTurns((prev) =>
      prev.map((t) => (t.playerId === playerId ? { ...t, playerName: trimmed } : t))
    );
    setEditingPlayerId(null);
  };

  const handleStartNewGame = (e: React.FormEvent) => {
    e.preventDefault();
    const newPlayers: Player[] = Array.from({ length: setupPlayerCount }).map(
      (_, idx) => ({
        id: `p${idx + 1}_${Date.now()}`,
        name: setupNames[idx]?.trim() || `Player ${idx + 1}`,
      })
    );
    playTabletopSound('score');
    setPlayers(newPlayers);
    setTurns([]);
    setActivePlayerIndex(0);
    resetTurnForm();
    setShowNewGameModal(false);
    setActiveTab('scoreboard');
  };

  const handleExportCSV = () => {
    const headers = [
      'Turn',
      'Round',
      'Player',
      'Action',
      'Word',
      'Word Multiplier',
      'Bingo Bonus',
      'Cross Words Pts',
      'Total Points',
      'Dictionary Verified',
      'Time',
    ];
    const rows = turns.map((t) => [
      t.turnNumber,
      t.round,
      `"${t.playerName}"`,
      t.actionType,
      t.word,
      `${t.wordMultiplier}x`,
      t.isBingo ? 'YES (+50)' : 'NO',
      t.crossWordsPoints,
      t.pointsEarned,
      t.isValidDictionaryWord ? 'VALID' : 'UNVERIFIED',
      t.timestamp,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `scrabble_scorecard_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const playedWordsForBag = useMemo(() => {
    return turns
      .filter((t) => t.actionType === 'PLAY')
      .map((t) => ({
        word: t.word,
        blankCount: t.letterMultipliers.filter((m) => m === 'BLANK').length,
      }));
  }, [turns]);

  const filteredTurns = useMemo(() => {
    const list =
      historyPlayerFilter === 'ALL'
        ? turns
        : turns.filter((t) => t.playerId === historyPlayerFilter);
    return [...list].reverse();
  }, [turns, historyPlayerFilter]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1C1917]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-4 bg-[#FAF8F5]/95 backdrop-blur-xs border-b border-[#E6E1DA]">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#scoreboard"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('scoreboard');
          }}
          className="font-display text-xl font-bold tracking-tight text-[#114B36] whitespace-nowrap shrink-0"
        >
          LexiLedger
        </a>

        {/* Zone 2: 4 clean single-line navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#57534E]">
          <a
            href="#scoreboard"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('scoreboard');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'scoreboard'
                ? 'text-[#1C1917] font-semibold underline decoration-[#114B36] decoration-2 underline-offset-8'
                : 'hover:text-[#1C1917]'
            }`}
          >
            Scoreboard
          </a>
          <a
            href="#dictionary"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('dictionary');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'dictionary'
                ? 'text-[#1C1917] font-semibold underline decoration-[#114B36] decoration-2 underline-offset-8'
                : 'hover:text-[#1C1917]'
            }`}
          >
            Word Judge
          </a>
          <a
            href="#history"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('history');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'history'
                ? 'text-[#1C1917] font-semibold underline decoration-[#114B36] decoration-2 underline-offset-8'
                : 'hover:text-[#1C1917]'
            }`}
          >
            Turn Ledger
          </a>
          <a
            href="#tilebag"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('tilebag');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'tilebag'
                ? 'text-[#1C1917] font-semibold underline decoration-[#114B36] decoration-2 underline-offset-8'
                : 'hover:text-[#1C1917]'
            }`}
          >
            Tile Bag
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setSetupPlayerCount(players.length);
              setSetupNames([
                players[0]?.name || 'Player 1',
                players[1]?.name || 'Player 2',
                players[2]?.name || 'Player 3',
                players[3]?.name || 'Player 4',
              ]);
              setShowNewGameModal(true);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#114B36] hover:bg-[#0D3B2A] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            New Match
          </button>
        </div>
      </header>

      {/* Mobile Navigation Bar (visible only on small screens) */}
      <div className="md:hidden flex items-center gap-1 px-4 py-2 bg-[#F3EFEA] border-b border-[#E6E1DA] overflow-x-auto">
        {(
          [
            { id: 'scoreboard', label: 'Scoreboard' },
            { id: 'dictionary', label: 'Dictionary Judge' },
            { id: 'history', label: `History (${turns.length})` },
            { id: 'tilebag', label: 'Tile Bag' },
          ] as { id: ActiveTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 ${
              activeTab === tab.id
                ? 'bg-white text-[#1C1917] font-semibold shadow-xs'
                : 'text-[#57534E]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Container (1440px Desktop Presence) */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Top Match Status & Real-Time Leaderboard Banner */}
        <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#E6E1DA]">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E] font-mono tabular-nums">
              <span>Round {currentRound}</span>
              <span aria-hidden="true">·</span>
              <span>Turn {turns.length + 1}</span>
              <span aria-hidden="true">·</span>
              <span>{players.length} Players Seated</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#114B36] font-semibold">
                On the Clock: {activePlayer?.name}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
              Match Scorecard &amp; Real-Time Standings
            </h1>
          </div>

          {/* Live Compact Standings Strip + Quick Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E6E1DA] text-xs font-mono tabular-nums">
              <Clock className="w-3.5 h-3.5 text-[#114B36]" />
              <span>Turn Clock: {formatTimer(turnSeconds)}</span>
              <span aria-hidden="true" className="text-[#D6CFC5]">|</span>
              <button
                type="button"
                onClick={() => setTimerRunning((r) => !r)}
                className="font-sans font-medium text-[#114B36] hover:underline whitespace-nowrap shrink-0"
              >
                {timerRunning ? 'Pause' : 'Resume'}
              </button>
              <span aria-hidden="true" className="text-[#D6CFC5]">·</span>
              <button
                type="button"
                onClick={() => setTurnSeconds(0)}
                className="font-sans text-[#57534E] hover:text-[#1C1917] whitespace-nowrap shrink-0"
              >
                Reset
              </button>
            </div>

            {players.length < 4 && (
              <button
                type="button"
                onClick={handleAddPlayerSeat}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#1C1917] bg-white hover:bg-[#F3EFEA] border border-[#D6CFC5] rounded-xl transition-colors whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#114B36]" />
                Add Player ({players.length}/4)
              </button>
            )}

            {turns.length > 0 && (
              <button
                type="button"
                onClick={handleUndoLastTurn}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#57534E] hover:text-[#1C1917] bg-white hover:bg-[#F3EFEA] border border-[#D6CFC5] rounded-xl transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Undo Last Turn
              </button>
            )}
          </div>
        </section>

        {/* Individual Player Scorecards Grid (2 to 4 Players) */}
        <section aria-label="Player Scorecards">
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 ${
              players.length === 3
                ? 'lg:grid-cols-3'
                : players.length === 2
                ? 'lg:grid-cols-2'
                : 'lg:grid-cols-4'
            } gap-5`}
          >
            {playerStats.map((player) => {
              const isCurrentTurn = players[activePlayerIndex]?.id === player.id;
              const isLeader = player.rank === 1 && player.totalScore > 0;
              const isEditing = editingPlayerId === player.id;

              return (
                <div
                  key={player.id}
                  className={`flex flex-col justify-between rounded-2xl p-5 border transition-colors ${
                    isCurrentTurn
                      ? 'bg-white border-[#114B36] shadow-sm'
                      : 'bg-white border-[#E6E1DA]'
                  }`}
                >
                  {/* Top Row: Rank, Turn Status, Seat Actions */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 font-mono tabular-nums text-[#57534E]">
                        {isLeader && (
                          <Trophy className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
                        )}
                        <span className={isLeader ? 'font-bold text-[#1C1917]' : ''}>
                          Rank #{player.rank}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {player.pointsBehind === 0
                            ? 'Match Leader'
                            : `-${player.pointsBehind} pts`}
                        </span>
                      </div>

                      {isCurrentTurn ? (
                        <span className="font-mono text-xs font-bold text-[#114B36] whitespace-nowrap shrink-0">
                          Active Turn
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActivePlayerIndex(player.seatIndex)}
                          className="text-xs text-[#78716C] hover:text-[#114B36] transition-colors whitespace-nowrap shrink-0"
                          title="Switch active turn to this player"
                        >
                          Set Active
                        </button>
                      )}
                    </div>

                    {/* Player Name with Inline Rename */}
                    <div className="flex items-center justify-between gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <input
                            type="text"
                            value={editingNameValue}
                            onChange={(e) => setEditingNameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSavePlayerName(player.id);
                              if (e.key === 'Escape') setEditingPlayerId(null);
                            }}
                            autoFocus
                            className="w-full px-2.5 py-1 text-sm font-semibold bg-[#FAF8F5] border border-[#114B36] rounded-lg focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSavePlayerName(player.id)}
                            className="p-1 text-[#047857] hover:bg-[#ECFDF5] rounded"
                            title="Save Name"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPlayerId(null)}
                            className="p-1 text-[#78716C] hover:bg-[#F5F5F4] rounded"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <h2 className="text-lg font-bold text-[#1C1917] truncate">
                            {player.name}
                          </h2>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPlayerId(player.id);
                              setEditingNameValue(player.name);
                            }}
                            className="text-[#A8A29E] hover:text-[#1C1917] transition-colors shrink-0"
                            title="Rename Player"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {players.length > 2 && !isEditing && (
                        <button
                          type="button"
                          onClick={() => handleRemovePlayerSeat(player.id)}
                          className="text-xs text-[#A8A29E] hover:text-[#B91C1C] transition-colors shrink-0"
                          title="Remove Player Seat"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {/* Dominant Score Numeral */}
                    <div className="pt-1 flex items-baseline justify-between">
                      <div className="font-mono text-4xl font-bold tabular-nums tracking-tight text-[#1C1917]">
                        {player.totalScore}
                        <span className="ml-1.5 text-xs font-normal text-[#78716C]">pts</span>
                      </div>
                      <div className="text-right font-mono text-xs tabular-nums text-[#57534E]">
                        Avg {player.avgScore}/turn
                      </div>
                    </div>
                  </div>

                  {/* Bottom Player Stats & Recent Words */}
                  <div className="mt-5 pt-3.5 border-t border-[#E6E1DA] space-y-2 text-xs text-[#57534E]">
                    <div className="flex items-center justify-between gap-2">
                      <span>Best Play:</span>
                      <span className="font-mono font-semibold text-[#1C1917] tabular-nums">
                        {player.bestTurn
                          ? `${player.bestTurn.word} (${player.bestTurn.pointsEarned}p)`
                          : '—'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span>Turns · Bingos:</span>
                      <span className="font-mono tabular-nums text-[#1C1917]">
                        {player.turnsTaken} turns · {player.bingoCount} bingo
                        {player.bingoCount === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-[#78716C] truncate">
                      <span>Recent:</span>
                      {player.recentTurns.length === 0 ? (
                        <span>No plays yet</span>
                      ) : (
                        player.recentTurns.map((rt, idx) => (
                          <React.Fragment key={rt.id}>
                            {idx > 0 && <span aria-hidden="true">·</span>}
                            <span className="text-[#44403C]">
                              {rt.actionType === 'PLAY'
                                ? `${rt.word} (+${rt.pointsEarned})`
                                : rt.actionType}
                            </span>
                          </React.Fragment>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Tab 1: Active Turn Scorer + Real-Time Leaderboard & Recent Ledger */}
        {activeTab === 'scoreboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Cols: Interactive Turn Scorer with Built-in Dictionary Judge */}
            <div className="lg:col-span-7 bg-white border border-[#E6E1DA] rounded-2xl p-6 space-y-6">
              <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[#E6E1DA] pb-4">
                <div>
                  <div className="text-xs font-mono text-[#114B36] font-semibold">
                    Round {currentRound} · Turn {turns.length + 1}
                  </div>
                  <h2 className="text-xl font-bold text-[#1C1917] tracking-tight mt-0.5 text-balance">
                    Score Turn for {activePlayer?.name}
                  </h2>
                </div>

                {/* Strict Tournament Challenge Toggle */}
                <label className="inline-flex items-center gap-2 text-xs text-[#57534E] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={strictTournamentRule}
                    onChange={(e) => setStrictTournamentRule(e.target.checked)}
                    className="rounded border-[#D6CFC5] text-[#114B36] focus:ring-[#114B36]"
                  />
                  <span>Block invalid dictionary words</span>
                </label>
              </div>

              <form onSubmit={handleRecordWordTurn} className="space-y-5">
                {/* Word Input + Live Verification Status */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="turn-word-input"
                      className="text-xs font-semibold text-[#44403C]"
                    >
                      Primary Word Played on Board
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveTab('dictionary')}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#114B36] hover:underline"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Open Full Dictionary Judge
                    </button>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      id="turn-word-input"
                      type="text"
                      maxLength={15}
                      value={wordInput}
                      onChange={(e) =>
                        setWordInput(e.target.value.toUpperCase().replace(/[^A-Za-z]/g, ''))
                      }
                      placeholder="Type played word (e.g. QUARTZ, QI, VORTEX)..."
                      className="w-full px-4 py-3.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl font-mono text-xl font-bold tracking-wider text-[#1C1917] placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-[#A8A29E] focus:outline-none focus:border-[#114B36] focus:bg-white transition-colors"
                    />
                    {wordInput && (
                      <button
                        type="button"
                        onClick={resetTurnForm}
                        className="absolute right-3 px-3 py-1.5 text-xs font-medium text-[#57534E] hover:text-[#1C1917] bg-[#EFECE6] rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Instant Dictionary Verification Banner inside Scorer */}
                  {cleanWord.length > 0 && (
                    <div
                      className={`px-3.5 py-2.5 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
                        verifyingWord
                          ? 'bg-[#FAF8F5] border-[#E6E1DA] text-[#57534E]'
                          : liveVerification?.isValid
                          ? 'bg-[#F3FAF6] border-[#A7F3D0] text-[#065F46]'
                          : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {verifyingWord ? (
                          <span>Checking official Scrabble dictionary...</span>
                        ) : liveVerification?.isValid ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0" />
                            <span className="font-semibold">
                              Valid Scrabble Word ({liveVerification.partOfSpeech})
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="truncate text-[#292524]">
                              {liveVerification.definitions[0]}
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />
                            <span className="font-semibold">
                              Not in Official Lexicon
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="truncate">
                              {liveVerification?.definitions[0]}
                            </span>
                          </>
                        )}
                      </div>
                      <span className="font-mono font-semibold shrink-0 tabular-nums">
                        Base: {liveVerification?.basePoints || 0} pts
                      </span>
                    </div>
                  )}
                </div>

                {/* Interactive Tile Rack for Letter Multipliers */}
                <ScrabbleTileRack
                  word={cleanWord}
                  multipliers={letterMultipliers}
                  onToggleMultiplier={handleToggleTileMultiplier}
                  interactive={true}
                  size="lg"
                />

                {/* Word Multipliers & 7-Tile Bingo */}
                <div className="space-y-3 pt-2 border-t border-[#E6E1DA]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#44403C]">
                      Word Square Multiplier &amp; Rack Bonus
                    </span>
                    <span className="text-xs text-[#78716C] font-mono tabular-nums">
                      Word Score: {currentScorePreview.multipliedWordScore} pts
                      {isBingo ? ' + 50 Bingo' : ''}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {(
                      [
                        { value: 1, label: '1× Normal' },
                        { value: 2, label: '2× Double Word (DW)' },
                        { value: 3, label: '3× Triple Word (TW)' },
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
                        className={`px-3 py-2 text-xs font-medium rounded-xl border transition-colors whitespace-nowrap shrink-0 ${
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
                      className={`px-3.5 py-2 text-xs font-medium rounded-xl border transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${
                        isBingo
                          ? 'bg-[#ECFDF5] border-[#059669] text-[#065F46] font-semibold'
                          : 'bg-[#FAF8F5] border-[#D6CFC5] text-[#44403C] hover:bg-[#F0ECE3]'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      7-Tile Bingo (+50 pts)
                    </button>
                  </div>
                </div>

                {/* Optional Hook / Cross-Word Points in Same Turn */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-[#E6E1DA]">
                  <div className="sm:col-span-8">
                    <label
                      htmlFor="cross-words-desc"
                      className="block text-xs font-medium text-[#57534E] mb-1"
                    >
                      Additional Cross-Words Formed (Optional)
                    </label>
                    <input
                      id="cross-words-desc"
                      type="text"
                      value={crossWordsDesc}
                      onChange={(e) => setCrossWordsDesc(e.target.value.toUpperCase())}
                      placeholder="e.g. QI, AX (hooked words)"
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl text-xs font-mono text-[#1C1917] focus:outline-none focus:border-[#114B36]"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label
                      htmlFor="cross-words-pts"
                      className="block text-xs font-medium text-[#57534E] mb-1"
                    >
                      Cross-Words Points
                    </label>
                    <input
                      id="cross-words-pts"
                      type="number"
                      min={0}
                      max={300}
                      value={crossWordsPoints || ''}
                      onChange={(e) =>
                        setCrossWordsPoints(Math.max(0, parseInt(e.target.value, 10) || 0))
                      }
                      placeholder="0"
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl text-xs font-mono font-bold tabular-nums text-right text-[#1C1917] focus:outline-none focus:border-[#114B36]"
                    />
                  </div>
                </div>

                {turnErrorMsg && (
                  <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] font-medium">
                    {turnErrorMsg}
                  </div>
                )}

                {/* Submit Turn Score & Secondary Turn Actions */}
                <div className="pt-3 border-t border-[#E6E1DA] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePassOrExchange('PASS')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-[#44403C] bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#D6CFC5] rounded-xl transition-colors whitespace-nowrap shrink-0"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                      Pass Turn (0 pts)
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePassOrExchange('EXCHANGE')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-[#44403C] bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#D6CFC5] rounded-xl transition-colors whitespace-nowrap shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Exchange Tiles (0 pts)
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#114B36] hover:bg-[#0D3B2A] rounded-xl transition-colors whitespace-nowrap shrink-0 shadow-xs"
                  >
                    <span>
                      Record Turn (+{currentScorePreview.totalScore} pts)
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>

            {/* Right 5 Cols: Real-Time Leaderboard Standings & Live Turn Feed */}
            <div className="lg:col-span-5 space-y-6">
              {/* Real-Time Leaderboard Table */}
              <div className="bg-white border border-[#E6E1DA] rounded-2xl p-6 space-y-4">
                <div className="flex items-baseline justify-between border-b border-[#E6E1DA] pb-3">
                  <h3 className="text-lg font-bold text-[#1C1917] tracking-tight">
                    Real-Time Leaderboard
                  </h3>
                  <span className="text-xs text-[#78716C] font-mono tabular-nums">
                    After {turns.length} {turns.length === 1 ? 'turn' : 'turns'}
                  </span>
                </div>

                <div className="divide-y divide-[#E6E1DA]">
                  {leaderboard.map((entry, idx) => {
                    const maxScore = Math.max(1, leaderboard[0]?.totalScore || 1);
                    const pct = Math.max(4, Math.round((entry.totalScore / maxScore) * 100));

                    return (
                      <div key={entry.id} className="py-3 first:pt-1 last:pb-1 space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="font-mono text-xs font-bold tabular-nums text-[#57534E] w-5">
                              #{idx + 1}
                            </span>
                            <span className="font-semibold text-sm text-[#1C1917] truncate">
                              {entry.name}
                            </span>
                            {players[activePlayerIndex]?.id === entry.id && (
                              <span className="text-[11px] font-mono text-[#114B36] font-semibold">
                                · Playing
                              </span>
                            )}
                          </div>

                          <div className="text-right font-mono tabular-nums shrink-0">
                            <span className="text-base font-bold text-[#1C1917]">
                              {entry.totalScore}
                            </span>
                            <span className="text-xs text-[#78716C] ml-1">pts</span>
                          </div>
                        </div>

                        {/* Proportional Score Bar */}
                        <div className="w-full h-1.5 bg-[#F3EFEA] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-transform duration-200 origin-left ${
                              idx === 0 ? 'bg-[#114B36]' : 'bg-[#A8A29E]'
                            }`}
                            style={{ transform: `scaleX(${pct / 100})` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Instant Dictionary & Point Verifier Card */}
              <div className="bg-white border border-[#E6E1DA] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E6E1DA] pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-[#1C1917] tracking-tight">
                      Instant Dictionary &amp; Point Verifier
                    </h3>
                    <p className="text-xs text-[#57534E]">
                      Check any word’s spelling validity and base tile points before playing
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (quickDictInput) {
                        setWordInput(quickDictInput);
                      }
                      setActiveTab('dictionary');
                    }}
                    className="text-xs font-medium text-[#114B36] hover:underline whitespace-nowrap shrink-0"
                  >
                    Full Judge
                  </button>
                </div>

                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    maxLength={15}
                    value={quickDictInput}
                    onChange={(e) =>
                      setQuickDictInput(e.target.value.toUpperCase().replace(/[^A-Za-z]/g, ''))
                    }
                    placeholder="Verify spelling & points (e.g. QI, QANAT, VORTEX)..."
                    aria-label="Quick word dictionary check"
                    className="w-full pl-10 pr-20 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl font-mono text-sm font-bold tracking-wider text-[#1C1917] placeholder:font-sans placeholder:text-xs placeholder:font-normal placeholder:tracking-normal placeholder:text-[#A8A29E] focus:outline-none focus:border-[#114B36] focus:bg-white transition-colors"
                  />
                  {quickDictInput && (
                    <button
                      type="button"
                      onClick={() => setQuickDictInput('')}
                      className="absolute right-2.5 px-2.5 py-1 text-xs font-medium text-[#57534E] hover:text-[#1C1917] bg-[#EFECE6] rounded-md transition-colors whitespace-nowrap shrink-0"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {quickDictInput.trim().length > 0 && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                      quickDictLoading
                        ? 'bg-[#FAF8F5] border-[#E6E1DA] text-[#57534E]'
                        : quickDictResult?.isValid
                        ? 'bg-[#F3FAF6] border-[#A7F3D0] text-[#065F46]'
                        : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                    }`}
                  >
                    {quickDictLoading ? (
                      <div>Verifying word in tournament lexicon...</div>
                    ) : quickDictResult ? (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-semibold">
                            {quickDictResult.isValid ? (
                              <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />
                            )}
                            <span>
                              {quickDictResult.isValid
                                ? `Valid Scrabble Word (${quickDictResult.partOfSpeech})`
                                : 'Invalid Scrabble Word'}
                            </span>
                          </div>
                          <span className="font-mono text-sm font-bold tabular-nums text-[#1C1917]">
                            {quickDictResult.basePoints} pts base
                          </span>
                        </div>
                        <p className="text-[#292524] leading-relaxed">
                          {quickDictResult.definitions[0]}
                        </p>
                        {quickDictResult.isValid && (
                          <div className="pt-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                playTabletopSound('tile');
                                setWordInput(quickDictResult.word);
                              }}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#114B36] hover:bg-[#0D3B2A] rounded-lg transition-colors whitespace-nowrap shrink-0"
                            >
                              Use &ldquo;{quickDictResult.word}&rdquo; in Turn Scorer
                            </button>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Recent Turn Log */}
              <div className="bg-white border border-[#E6E1DA] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E6E1DA] pb-3">
                  <h3 className="text-lg font-bold text-[#1C1917] tracking-tight">
                    Recent Plays
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="text-xs font-medium text-[#114B36] hover:underline whitespace-nowrap shrink-0"
                  >
                    View Full Ledger ({turns.length})
                  </button>
                </div>

                {turns.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#78716C]">
                    No turns recorded yet. Enter the first word on the left to begin tracking scores.
                  </div>
                ) : (
                  <div className="divide-y divide-[#E6E1DA]">
                    {[...turns]
                      .reverse()
                      .slice(0, 5)
                      .map((turn) => (
                        <div
                          key={turn.id}
                          className="py-2.5 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[#78716C] tabular-nums">
                                #{turn.turnNumber}
                              </span>
                              <span className="font-semibold text-[#1C1917] truncate">
                                {turn.playerName}
                              </span>
                              <span aria-hidden="true" className="text-[#A8A29E]">·</span>
                              <span className="font-mono font-bold text-[#114B36]">
                                {turn.word}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#78716C] font-mono tabular-nums">
                              Round {turn.round}
                              {turn.wordMultiplier > 1 ? ` · ${turn.wordMultiplier}× Word` : ''}
                              {turn.isBingo ? ' · +50 Bingo' : ''}
                              {turn.crossWordsPoints > 0
                                ? ` · +${turn.crossWordsPoints}p cross`
                                : ''}
                            </div>
                          </div>

                          <div className="font-mono text-sm font-bold tabular-nums text-[#1C1917] shrink-0">
                            {turn.pointsEarned >= 0 ? `+${turn.pointsEarned}` : turn.pointsEarned}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Dedicated Dictionary Judge & Point Simulator */}
        {activeTab === 'dictionary' && (
          <DictionaryJudge
            activePlayerName={activePlayer?.name || 'Active Player'}
            initialQuery={cleanWord || ''}
            onSendToScorer={(word, lMults, wMult, bingo) => {
              setWordInput(word);
              setLetterMultipliers(lMults);
              setWordMultiplier(wMult);
              setIsBingo(bingo);
              setActiveTab('scoreboard');
            }}
          />
        )}

        {/* Tab 3: Full Turn-by-Turn Ledger & CSV Export */}
        {activeTab === 'history' && (
          <div className="bg-white border border-[#E6E1DA] rounded-2xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6E1DA] pb-4">
              <div>
                <h2 className="text-xl font-bold text-[#1C1917] tracking-tight">
                  Official Turn-by-Turn Score Ledger
                </h2>
                <p className="text-sm text-[#57534E] mt-0.5">
                  Complete chronological audit of every word, multiplier, and score adjustment
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Player Filter Segmented Control */}
                <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F3EFEA] rounded-xl">
                  <button
                    type="button"
                    onClick={() => setHistoryPlayerFilter('ALL')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      historyPlayerFilter === 'ALL'
                        ? 'bg-white text-[#1C1917] font-semibold shadow-xs'
                        : 'text-[#57534E] hover:text-[#1C1917]'
                    }`}
                  >
                    All Players
                  </button>
                  {players.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setHistoryPlayerFilter(p.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                        historyPlayerFilter === p.id
                          ? 'bg-white text-[#1C1917] font-semibold shadow-xs'
                          : 'text-[#57534E] hover:text-[#1C1917]'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>

                {turns.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#1C1917] bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#D6CFC5] rounded-xl transition-colors whitespace-nowrap shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download CSV
                  </button>
                )}
              </div>
            </div>

            {filteredTurns.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <p className="text-sm text-[#57534E]">
                  No recorded turns match the selected filter.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('scoreboard')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#114B36] rounded-lg"
                >
                  Log First Turn
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E6E1DA] text-xs font-semibold text-[#57534E]">
                      <th className="py-3 px-3">Turn</th>
                      <th className="py-3 px-3">Round</th>
                      <th className="py-3 px-3">Player</th>
                      <th className="py-3 px-3">Word / Action</th>
                      <th className="py-3 px-3">Multipliers &amp; Notes</th>
                      <th className="py-3 px-3">Verification</th>
                      <th className="py-3 px-3 text-right">Points</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E1DA] text-sm">
                    {filteredTurns.map((t) => {
                      const dlCount = t.letterMultipliers.filter((m) => m === 'DL').length;
                      const tlCount = t.letterMultipliers.filter((m) => m === 'TL').length;
                      const blankCount = t.letterMultipliers.filter((m) => m === 'BLANK').length;

                      return (
                        <tr key={t.id} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="py-3 px-3 font-mono text-xs tabular-nums text-[#78716C]">
                            #{t.turnNumber}
                          </td>
                          <td className="py-3 px-3 font-mono text-xs tabular-nums text-[#57534E]">
                            R{t.round}
                          </td>
                          <td className="py-3 px-3 font-semibold text-[#1C1917]">
                            {t.playerName}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-[#114B36]">
                            {t.word}
                            {t.secondaryWords && (
                              <span className="ml-2 text-xs font-normal text-[#57534E]">
                                (+{t.secondaryWords})
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-xs text-[#57534E] font-mono tabular-nums">
                            {[
                              t.wordMultiplier > 1 ? `${t.wordMultiplier}× Word` : null,
                              dlCount > 0 ? `${dlCount}× DL` : null,
                              tlCount > 0 ? `${tlCount}× TL` : null,
                              blankCount > 0 ? `${blankCount} Blank` : null,
                              t.isBingo ? '+50 Bingo' : null,
                              t.crossWordsPoints > 0 ? `+${t.crossWordsPoints}p Hook` : null,
                            ]
                              .filter(Boolean)
                              .join(' · ') || 'Standard (1×)'}
                          </td>
                          <td className="py-3 px-3 text-xs">
                            {t.actionType === 'PLAY' ? (
                              t.isValidDictionaryWord ? (
                                <span className="text-[#047857] font-medium">
                                  Verified Lexicon
                                </span>
                              ) : (
                                <span className="text-[#B45309] font-medium">
                                  House / Unverified
                                </span>
                              )
                            ) : (
                              <span className="text-[#78716C]">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-[#1C1917]">
                            {t.pointsEarned >= 0 ? `+${t.pointsEarned}` : t.pointsEarned}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteTurnById(t.id)}
                              className="p-1.5 text-[#A8A29E] hover:text-[#B91C1C] rounded-lg transition-colors"
                              title="Remove this turn entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Tile Bag Tracker & Endgame Deduction Calculator */}
        {activeTab === 'tilebag' && (
          <TileBagReference
            playedWords={playedWordsForBag}
            players={playerStats.map((p) => ({
              id: p.id,
              name: p.name,
              score: p.totalScore,
            }))}
            onApplyEndgameAdjustment={(adjustments) => {
              const now = new Date();
              const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
                now.getMinutes()
              ).padStart(2, '0')}`;

              const newEntries: TurnEntry[] = adjustments.map((adj, idx) => {
                const pl = players.find((p) => p.id === adj.playerId);
                return {
                  id: `endgame_${Date.now()}_${idx}`,
                  round: currentRound,
                  turnNumber: turns.length + idx + 1,
                  playerId: adj.playerId,
                  playerName: pl?.name || 'Player',
                  actionType: 'ADJUSTMENT',
                  word: adj.note,
                  letterMultipliers: [],
                  wordMultiplier: 1,
                  isBingo: false,
                  crossWordsPoints: 0,
                  pointsEarned: adj.delta,
                  isValidDictionaryWord: true,
                  timestamp: timeStr,
                };
              });

              setTurns((prev) => [...prev, ...newEntries]);
            }}
          />
        )}
      </main>

      {/* New Game Setup Modal */}
      {showNewGameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#E6E1DA] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E6E1DA] pb-3">
              <h2 className="text-lg font-bold text-[#1C1917]">
                Start New Scrabble Match
              </h2>
              <button
                type="button"
                onClick={() => setShowNewGameModal(false)}
                className="p-1 text-[#78716C] hover:text-[#1C1917]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStartNewGame} className="space-y-4">
              <div>
                <span className="block text-xs font-semibold text-[#44403C] mb-2">
                  Number of Players (2–4)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 3, 4].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setSetupPlayerCount(count)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-colors ${
                        setupPlayerCount === count
                          ? 'bg-[#114B36] text-white border-[#114B36]'
                          : 'bg-[#FAF8F5] text-[#44403C] border-[#D6CFC5]'
                      }`}
                    >
                      {count} Players
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <span className="block text-xs font-semibold text-[#44403C]">
                  Player Names (In Turn Order)
                </span>
                {Array.from({ length: setupPlayerCount }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#78716C] w-14">
                      Seat #{idx + 1}
                    </span>
                    <input
                      type="text"
                      required
                      value={setupNames[idx] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSetupNames((prev) => {
                          const copy = [...prev];
                          copy[idx] = val;
                          return copy;
                        });
                      }}
                      placeholder={`Player ${idx + 1}`}
                      className="flex-1 px-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:border-[#114B36]"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#E6E1DA] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewGameModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[#57534E] hover:text-[#1C1917]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-[#114B36] hover:bg-[#0D3B2A] rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Start Zeroed Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clean Quiet Footer */}
      <footer className="mt-12 border-t border-[#E6E1DA] py-5 px-6 text-xs text-[#78716C]">
        <div className="max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <span>LexiLedger — Official Tabletop Scrabble Scorecard &amp; Lexical Judge</span>
          <span>Supports 2 to 4 Players · Standard 100-Tile Distribution · TWL / CSW / Oxford Verification</span>
        </div>
      </footer>
    </div>
  );
}
