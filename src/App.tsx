import { useState, useRef, useCallback, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameModals } from './components/GameModals';
import { StartScreen } from './screens/StartScreen';
import { PlayScreen } from './screens/PlayScreen';
import { GameOverScreen } from './screens/GameOverScreen';
import { useGameEngine } from './hooks/useGameEngine';
import { useViewport } from './hooks/useViewport';
import { generateQuestion, generateBossQuestion } from './utils/questions';
import { loadSave, saveSave, unlockAchievement } from './utils/storage';
import {
  playCorrectSound, playWrongSound, playCatchSound, playClickSound,
  playTimerWarning, playSharkSound, playBossSound, playVictorySound,
  playPowerUpSound, playAchievementSound, startBGMusic, stopBGMusic,
} from './utils/sound';
import {
  TOTAL_SEASONS,
  EPISODES_PER_SEASON,
  INITIAL_LIVES,
  BASE_TIME_LIMIT,
  HINT_PENALTY,
  CHEER_TEXTS,
  OOPS_TEXTS,
  DEFAULT_POWERUPS,
} from './constants';
import type { GameState, VisualSeason, Achievement, SaveData, PowerUp } from './types';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getVisualSeason(season: number): VisualSeason {
  const mod = ((season - 1) % 4);
  return (['spring', 'summer', 'autumn', 'winter'] as VisualSeason[])[mod];
}

function maxFactorForSeason(season: number): number {
  if (season <= 2) return 5;
  if (season <= 4) return 7;
  if (season <= 6) return 9;
  if (season <= 8) return 10;
  return 12;
}

function currentTimeLimit(season: number): number {
  return Math.max(8, BASE_TIME_LIMIT - Math.floor(season / 2));
}

function calculateStars(timeLeft: number, timeLimit: number, lives: number, combo: number): number {
  const timeRatio = timeLeft / timeLimit;
  let stars = 1;
  if (timeRatio > 0.5 && lives >= 3) stars = 2;
  if (timeRatio > 0.7 && lives >= 4 && combo >= 2) stars = 3;
  return stars;
}

function createInitialState(): GameState {
  const q = generateQuestion(1, 5);
  return {
    screen: 'start',
    season: 1,
    episode: 1,
    score: 0,
    lives: INITIAL_LIVES,
    combo: 0,
    bestCombo: 0,
    question: q,
    timeLimit: BASE_TIME_LIMIT,
    timeLeft: BASE_TIME_LIMIT,
    timerRunning: false,
    paused: false,
    feedbackText: 'یکی از گزینه‌ها را لمس کن! 🎯',
    feedbackColor: '#f8fafc',
    gameWon: false,
    shaking: false,
    flashWhite: false,
    visualSeason: 'spring',
    shark: {
      visible: false, x: -200, y: 150, targetX: 200, targetY: 130,
      expression: 'happy', message: '', phase: 'idle', timer: 0,
      scale: 1, wobble: 0, bubbles: [],
    },
    stars: 0,
    isBoss: false,
    bossHP: 0,
    bossMaxHP: 0,
    coins: 0,
    powerUps: DEFAULT_POWERUPS.map(p => ({ ...p })),
    shieldActive: false,
    timeFrozen: false,
    timeFreezeLeft: 0,
    questionType: 'normal',
    selectedChoice: null,
    soundOn: true,
    musicOn: true,
  };
}

export default function App() {
  const { width: canvasW, height: canvasH } = useViewport();
  const [game, setGame] = useState<GameState>(createInitialState());
  const [showAquarium, setShowAquarium] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [saveData, setSaveData] = useState<SaveData>(loadSave());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [mistakesInSeason, setMistakesInSeason] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameRef = useRef(game);
  gameRef.current = game;
  const saveRef = useRef(saveData);
  saveRef.current = saveData;
  const answerLockRef = useRef(false);

  const engine = useGameEngine(canvasW, canvasH);

  useEffect(() => {
    engine.spawnBackgroundFish();
    // Ocean world is spawned once; start/replay re-seed the school.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAchievement = useCallback((id: string) => {
    const save = saveRef.current;
    const wasNew = unlockAchievement(save, id);
    if (wasNew) {
      const ach = save.achievements.find(a => a.id === id);
      if (ach) {
        setNewAchievement(ach);
        if (gameRef.current.soundOn) playAchievementSound();
        setTimeout(() => setNewAchievement(null), 3000);
      }
      setSaveData({ ...save });
    }
  }, []);

  const updateSave = useCallback((updater: (s: SaveData) => SaveData) => {
    setSaveData(prev => {
      const next = updater(prev);
      saveSave(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (game.screen !== 'playing' && game.screen !== 'boss') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setGame(prev => {
        if (!prev.timerRunning || prev.paused || prev.timeFrozen) return prev;
        const newTime = prev.timeLeft - 1;

        if (newTime === 3 && prev.soundOn) playTimerWarning();

        if (newTime <= 0) {
          const protected_ = prev.shieldActive;
          const newLives = protected_ ? prev.lives : prev.lives - 1;
          engine.splashEffect();
          if (prev.soundOn) playWrongSound();
          answerLockRef.current = false;

          if (newLives <= 0) {
            setTimeout(() => {
              setGame(p => ({ ...p, screen: 'gameover', gameWon: false }));
            }, 600);
            return {
              ...prev,
              timeLeft: 0,
              timerRunning: false,
              combo: 0,
              lives: 0,
              shieldActive: false,
              feedbackText: `وقت تموم شد! جواب: ${prev.question.correct} ⏰`,
              feedbackColor: '#ef4444',
            };
          }
          setTimeout(() => advanceQuestion(), 900);
          return {
            ...prev,
            timeLeft: 0,
            timerRunning: false,
            combo: 0,
            lives: newLives,
            shieldActive: false,
            feedbackText: protected_
              ? `🛡️ محافظ نجاتت داد! جواب: ${prev.question.correct}`
              : `وقت تموم شد! جواب: ${prev.question.correct} ⏰`,
            feedbackColor: protected_ ? '#60a5fa' : '#ef4444',
          };
        }
        return { ...prev, timeLeft: newTime };
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line
  }, [game.screen, game.timerRunning, game.paused, game.timeFrozen]);

  useEffect(() => {
    if (!game.timeFrozen) return;
    const t = setTimeout(() => {
      setGame(prev => ({ ...prev, timeFrozen: false, timeFreezeLeft: 0 }));
    }, game.timeFreezeLeft * 1000);
    return () => clearTimeout(t);
  }, [game.timeFrozen, game.timeFreezeLeft]);

  const advanceQuestion = useCallback(() => {
    answerLockRef.current = false;
    setGame(prev => {
      let newSeason = prev.season;
      let newEpisode = prev.episode;

      if (prev.episode < EPISODES_PER_SEASON) {
        newEpisode = prev.episode + 1;
      } else {
        if (!prev.isBoss && prev.episode === EPISODES_PER_SEASON) {
          const bossHP = 3 + Math.floor(prev.season / 2);
          if (prev.soundOn) playBossSound();
          const bq = generateBossQuestion(prev.season);
          return {
            ...prev,
            isBoss: true,
            bossHP,
            bossMaxHP: bossHP,
            question: bq,
            questionType: bq.type,
            timeLimit: currentTimeLimit(prev.season),
            timeLeft: currentTimeLimit(prev.season),
            timerRunning: true,
            feedbackText: '👹 هیولای دریایی ظاهر شد! شکستش بده!',
            feedbackColor: '#ef4444',
            selectedChoice: null,
          };
        }

        if (prev.season < TOTAL_SEASONS) {
          if (mistakesInSeason === 0) {
            checkAchievement('no_mistake');
          }
          setMistakesInSeason(0);

          newSeason = prev.season + 1;
          newEpisode = 1;

          if (newSeason > 1) checkAchievement('season_1');
          if (newSeason > 5) checkAchievement('season_5');

          const key = `${prev.season}-${prev.episode}`;
          updateSave(s => ({
            ...s,
            starsPerEpisode: {
              ...s.starsPerEpisode,
              [key]: Math.max(s.starsPerEpisode[key] || 0, prev.stars),
            },
          }));
        } else {
          if (prev.soundOn) playVictorySound();
          checkAchievement('season_10');
          return { ...prev, screen: 'gameover', gameWon: true, timerRunning: false };
        }
      }

      const tl = currentTimeLimit(newSeason);
      const maxF = maxFactorForSeason(newSeason);
      const q = generateQuestion(newSeason, maxF, 1, undefined, saveRef.current.tableStats);
      const vs = getVisualSeason(newSeason);
      engine.setVisualSeason(vs);

      const isNewSeason = newSeason !== prev.season;
      if (isNewSeason) {
        engine.fireworkBurst();
        engine.confettiBurst();
      }

      const prevKey = `${prev.season}-${prev.episode}`;
      const stars = calculateStars(prev.timeLeft, prev.timeLimit, prev.lives, prev.combo);
      updateSave(s => ({
        ...s,
        starsPerEpisode: {
          ...s.starsPerEpisode,
          [prevKey]: Math.max(s.starsPerEpisode[prevKey] || 0, stars),
        },
      }));

      setQuestionStartTime(Date.now());

      return {
        ...prev,
        season: newSeason,
        episode: newEpisode,
        question: q,
        questionType: q.type,
        timeLimit: tl,
        timeLeft: tl,
        timerRunning: true,
        isBoss: false,
        bossHP: 0,
        bossMaxHP: 0,
        visualSeason: vs,
        stars,
        selectedChoice: null,
        feedbackText: isNewSeason
          ? `🎊 فصل جدید! فصل ${newSeason} - ${vs === 'spring' ? '🌸 بهار' : vs === 'summer' ? '☀️ تابستان' : vs === 'autumn' ? '🍂 پاییز' : '❄️ زمستان'}`
          : 'یکی را انتخاب کن! 🎯',
        feedbackColor: isNewSeason ? '#22c55e' : '#f8fafc',
      };
    });
  }, [engine, checkAchievement, updateSave, mistakesInSeason]);

  const startGame = useCallback(() => {
    const tl = currentTimeLimit(1);
    const q = generateQuestion(1, 5, 1, undefined, saveRef.current.tableStats);
    engine.spawnBackgroundFish();
    engine.setVisualSeason('spring');
    startBGMusic();
    if (game.soundOn) playClickSound();
    answerLockRef.current = false;

    setMistakesInSeason(0);
    setQuestionStartTime(Date.now());

    updateSave(s => ({ ...s, totalPlayed: s.totalPlayed + 1 }));

    const loadedPowerUps = saveRef.current.powerUps.length > 0
      ? saveRef.current.powerUps.map(p => ({ ...p }))
      : DEFAULT_POWERUPS.map(p => ({ ...p }));

    setGame({
      ...createInitialState(),
      screen: 'playing',
      question: q,
      questionType: q.type,
      timeLimit: tl,
      timeLeft: tl,
      timerRunning: true,
      coins: saveRef.current.coins,
      powerUps: loadedPowerUps,
      soundOn: game.soundOn,
      musicOn: true,
      feedbackText: 'یکی از گزینه‌های رنگی را لمس کن! 🎯',
      feedbackColor: '#f8fafc',
    });
  }, [engine, game.soundOn, updateSave]);

  const submitAnswer = useCallback((ans: number) => {
    const g = gameRef.current;
    if (g.paused || !g.timerRunning || answerLockRef.current) return;
    answerLockRef.current = true;

    const responseTime = (Date.now() - questionStartTime) / 1000;

    const tableKey = String(Math.max(g.question.a, g.question.b));
    const recordTableResult = (wasCorrect: boolean) => {
      updateSave(s => {
        const prev = s.tableStats[tableKey] || { attempts: 0, correct: 0, totalResponseTime: 0, bestResponseTime: Number.MAX_SAFE_INTEGER, currentStreak: 0, bestStreak: 0 };
        const currentStreak = wasCorrect ? prev.currentStreak + 1 : 0;
        return {
          ...s,
          tableStats: {
            ...s.tableStats,
            [tableKey]: {
              attempts: prev.attempts + 1,
              correct: prev.correct + (wasCorrect ? 1 : 0),
              totalResponseTime: prev.totalResponseTime + responseTime,
              bestResponseTime: wasCorrect ? Math.min(prev.bestResponseTime, responseTime) : prev.bestResponseTime,
              currentStreak,
              bestStreak: Math.max(prev.bestStreak, currentStreak),
            },
          },
        };
      });
    };

    if (ans === g.question.correct) {
      recordTableResult(true);
      const newCombo = g.combo + 1;
      const gained = 5 + g.timeLeft + Math.min(25, newCombo * 3);
      const coinsGained = 1 + Math.floor(newCombo / 3);

      engine.confettiBurst();
      if (g.soundOn) {
        playCorrectSound();
        playCatchSound();
      }

      const fishKind: 'golden' | 'rare' | 'normal' = newCombo >= 8 ? 'golden' : (newCombo >= 5 ? 'rare' : 'normal');
      engine.catchFish(g.question.correct, fishKind);

      if (fishKind === 'golden') checkAchievement('golden_fish');
      if (responseTime < 3) checkAchievement('speed_demon');
      if (newCombo >= 5) checkAchievement('combo_5');
      if (newCombo >= 10) checkAchievement('combo_10');
      checkAchievement('first_fish');

      updateSave(s => ({
        ...s,
        totalCorrect: s.totalCorrect + 1,
        coins: s.coins + coinsGained,
        bestCombo: Math.max(s.bestCombo, newCombo),
        aquarium: [...s.aquarium, {
          body: fishKind === 'golden' ? '#ffd700' : '#60a5fa',
          outline: fishKind === 'golden' ? '#b8860b' : '#1d4ed8',
          size: 24,
          value: g.question.correct,
          kind: fishKind,
          timestamp: Date.now(),
        }].slice(-50),
      }));

      if (g.score + gained >= 100) checkAchievement('score_100');
      if (g.score + gained >= 500) checkAchievement('score_500');

      const shouldTriggerShark = (
        newCombo >= 5 && newCombo % 5 === 0
      ) || (
        newCombo >= 3 && responseTime < 2.5
      );

      if (shouldTriggerShark && !engine.sharkRef.current.visible) {
        engine.triggerShark();
        if (g.soundOn) playSharkSound();
        checkAchievement('shark_friend');
        updateSave(s => ({ ...s, sharkSeen: s.sharkSeen + 1 }));
        if (saveRef.current.sharkSeen >= 3) {
          updateSave(s => ({ ...s, hasSharkPet: true }));
        }
        engine.fireworkBurst();
      }

      if (g.isBoss) {
        const newBossHP = g.bossHP - 1;
        if (newBossHP <= 0) {
          checkAchievement('boss_defeat');
          engine.fireworkBurst();
          engine.fireworkBurst();
          engine.confettiBurst();
          if (g.soundOn) playVictorySound();
          setGame(prev => ({
            ...prev,
            timerRunning: false,
            isBoss: false,
            bossHP: 0,
            combo: newCombo,
            bestCombo: Math.max(prev.bestCombo, newCombo),
            score: prev.score + gained + 20,
            coins: prev.coins + coinsGained + 5,
            feedbackText: '🎉 هیولا رو شکست دادی! آفرین! 🏆',
            feedbackColor: '#22c55e',
            flashWhite: true,
          }));
          setTimeout(() => setGame(p => ({ ...p, flashWhite: false })), 250);
          setTimeout(() => advanceQuestion(), 2000);
          return;
        }

        const bq = generateBossQuestion(g.season);
        setGame(prev => ({
          ...prev,
          bossHP: newBossHP,
          combo: newCombo,
          bestCombo: Math.max(prev.bestCombo, newCombo),
          score: prev.score + gained,
          coins: prev.coins + coinsGained,
          question: bq,
          questionType: bq.type,
          timeLeft: prev.timeLimit,
          selectedChoice: null,
          feedbackText: `${pick(CHEER_TEXTS)} 💥 ضربه زدی! (${newBossHP}/${prev.bossMaxHP})`,
          feedbackColor: '#22c55e',
          flashWhite: true,
        }));
        setTimeout(() => setGame(p => ({ ...p, flashWhite: false })), 250);
        setQuestionStartTime(Date.now());
        answerLockRef.current = false;
        return;
      }

      setGame(prev => ({
        ...prev,
        timerRunning: false,
        combo: newCombo,
        bestCombo: Math.max(prev.bestCombo, newCombo),
        score: prev.score + gained,
        coins: prev.coins + coinsGained,
        feedbackText: `${pick(CHEER_TEXTS)}  (+${gained} 💰+${coinsGained})`,
        feedbackColor: '#22c55e',
        flashWhite: true,
      }));

      setTimeout(() => setGame(p => ({ ...p, flashWhite: false })), 250);
      setTimeout(() => advanceQuestion(), 1200);
    } else {
      recordTableResult(false);
      const protected_ = g.shieldActive;
      const newLives = protected_ ? g.lives : g.lives - 1;
      engine.splashEffect();
      if (g.soundOn) playWrongSound();
      setMistakesInSeason(m => m + 1);

      setGame(prev => ({
        ...prev,
        timerRunning: false,
        combo: 0,
        lives: newLives,
        shieldActive: false,
        feedbackText: protected_
          ? `🛡️ محافظ نجاتت داد! جواب: ${prev.question.correct}`
          : `${pick(OOPS_TEXTS)} جواب: ${prev.question.correct}`,
        feedbackColor: protected_ ? '#60a5fa' : '#ef4444',
        shaking: true,
      }));

      setTimeout(() => setGame(p => ({ ...p, shaking: false })), 400);

      if (newLives <= 0) {
        setTimeout(() => {
          setGame(p => ({ ...p, screen: 'gameover', gameWon: false }));
        }, 800);
        return;
      }
      setTimeout(() => advanceQuestion(), 1100);
    }
  }, [engine, advanceQuestion, checkAchievement, updateSave, questionStartTime]);

  const answerTrueFalse = useCallback((isTrue: boolean) => {
    const g = gameRef.current;
    if (g.paused || !g.timerRunning || g.question.type !== 'truefalse') return;
    if (g.soundOn) playClickSound();
    const correct = g.question.isProposedCorrect === isTrue;
    submitAnswer(correct ? g.question.correct : -1);
  }, [submitAnswer]);

  const answerChoice = useCallback((choice: number) => {
    const g = gameRef.current;
    if (g.paused || !g.timerRunning || g.question.type === 'truefalse') return;
    if (g.soundOn) playClickSound();
    setGame(prev => ({ ...prev, selectedChoice: choice }));
    submitAnswer(choice);
  }, [submitAnswer]);

  const skipQuestion = useCallback(() => {
    const g = gameRef.current;
    if (g.paused || !g.timerRunning || answerLockRef.current) return;
    if (g.soundOn) playClickSound();
    answerLockRef.current = true;

    const protected_ = g.shieldActive;
    const newLives = protected_ ? g.lives : g.lives - 1;
    engine.splashEffect();
    setMistakesInSeason(m => m + 1);

    setGame(prev => ({
      ...prev,
      timerRunning: false,
      combo: 0,
      lives: newLives,
      shieldActive: false,
      feedbackText: `رد شد! جواب: ${prev.question.correct} ⏭️`,
      feedbackColor: '#f59e0b',
    }));

    if (newLives <= 0) {
      setTimeout(() => {
        setGame(p => ({ ...p, screen: 'gameover', gameWon: false }));
      }, 800);
      return;
    }
    setTimeout(() => advanceQuestion(), 900);
  }, [engine, advanceQuestion]);

  const useHint = useCallback(() => {
    const g = gameRef.current;
    if (g.paused || !g.timerRunning) return;
    if (g.soundOn) playClickSound();

    setGame(prev => {
      const newTime = Math.max(0, prev.timeLeft - HINT_PENALTY);
      const c = prev.question.correct;
      const lo = Math.max(1, c - Math.max(2, Math.floor(c / 4)));
      const hi = c + Math.max(2, Math.floor(c / 4));
      return {
        ...prev,
        timeLeft: newTime,
        feedbackText: `💡 راهنما: جواب بین ${lo} و ${hi}! (زمان -${HINT_PENALTY})`,
        feedbackColor: '#60a5fa',
      };
    });
  }, []);

  const usePowerUp = useCallback((type: PowerUp['type']) => {
    const g = gameRef.current;
    if (g.paused || !g.timerRunning) return;

    const puIndex = g.powerUps.findIndex(p => p.type === type && p.count > 0);
    if (puIndex === -1) return;

    if (g.soundOn) playPowerUpSound();

    setGame(prev => {
      const newPowerUps = prev.powerUps.map((p, i) =>
        i === puIndex ? { ...p, count: p.count - 1 } : { ...p }
      );

      switch (type) {
        case 'extraTime':
          return {
            ...prev,
            powerUps: newPowerUps,
            timeLeft: Math.min(prev.timeLeft + 5, prev.timeLimit + 5),
            feedbackText: '⏰ +۵ ثانیه اضافه!',
            feedbackColor: '#22c55e',
          };
        case 'freezeTime':
          return {
            ...prev,
            powerUps: newPowerUps,
            timeFrozen: true,
            timeFreezeLeft: 3,
            feedbackText: '❄️ زمان یخ زد! ۳ ثانیه',
            feedbackColor: '#38bdf8',
          };
        case 'shield':
          return {
            ...prev,
            powerUps: newPowerUps,
            shieldActive: true,
            feedbackText: '🛡️ محافظ فعال شد!',
            feedbackColor: '#a78bfa',
          };
        case 'removeChoice':
          if (prev.question.choices && prev.question.choices.length > 2) {
            const wrongChoices = prev.question.choices.filter(c => c !== prev.question.correct);
            if (wrongChoices.length > 0) {
              const toRemove = wrongChoices[Math.floor(Math.random() * wrongChoices.length)];
              const newChoices = prev.question.choices.filter(c => c !== toRemove);
              return {
                ...prev,
                powerUps: newPowerUps,
                question: { ...prev.question, choices: newChoices },
                feedbackText: '🔍 یک گزینه غلط حذف شد!',
                feedbackColor: '#f59e0b',
              };
            }
          }
          return {
            ...prev,
            powerUps: newPowerUps,
            feedbackText: '🔍 گزینه‌ای برای حذف نبود!',
            feedbackColor: '#f59e0b',
          };
        default:
          return prev;
      }
    });

    updateSave(s => {
      const newPU = s.powerUps.map(p =>
        p.type === type ? { ...p, count: Math.max(0, p.count - 1) } : { ...p }
      );
      return { ...s, powerUps: newPU };
    });
  }, [updateSave]);

  const togglePause = useCallback(() => {
    if (game.soundOn) playClickSound();
    setGame(prev => ({
      ...prev,
      paused: !prev.paused,
      feedbackText: prev.paused ? 'ادامه بده! 🎮' : 'بازی متوقف شد ⏸️',
      feedbackColor: '#cbd5e1',
    }));
  }, [game.soundOn]);

  const toggleSound = useCallback(() => {
    setGame(prev => ({ ...prev, soundOn: !prev.soundOn }));
  }, []);

  const toggleMusic = useCallback(() => {
    setGame(prev => {
      if (!prev.musicOn) {
        startBGMusic();
      } else {
        stopBGMusic();
      }
      return { ...prev, musicOn: !prev.musicOn };
    });
  }, []);

  const replay = useCallback(() => {
    engine.spawnBackgroundFish();
    answerLockRef.current = false;
    setGame(createInitialState());
    setSaveData(loadSave());
  }, [engine]);

  useEffect(() => {
    if (game.screen === 'gameover') {
      stopBGMusic();
      updateSave(s => ({
        ...s,
        highScore: Math.max(s.highScore, game.score),
        bestCombo: Math.max(s.bestCombo, game.bestCombo),
        coins: game.coins,
      }));
      if (saveRef.current.aquarium.length >= 10) {
        checkAchievement('aquarium_10');
      }
    }
  }, [game.screen]);

  const timerPercent = game.timeLimit > 0 ? (game.timeLeft / game.timeLimit) * 100 : 0;
  const timerColor = game.timeFrozen ? '#38bdf8' : (game.timeLeft <= 3 ? '#ef4444' : game.timeLeft <= 6 ? '#f59e0b' : '#a78bfa');
  const seasonLabel = game.visualSeason === 'spring' ? '🌸' : game.visualSeason === 'summer' ? '☀️' : game.visualSeason === 'autumn' ? '🍂' : '❄️';

  return (
    <div
      className={`app-shell ${game.shaking ? 'animate-shake' : ''}`}
      dir="rtl"
    >
      <GameCanvas
        width={canvasW}
        height={canvasH}
        bubbles={engine.bubblesRef.current}
        bgFish={engine.bgFishRef.current}
        particles={engine.particlesRef.current}
        caught={engine.caughtRef.current}
        wavePhase={engine.wavePhaseRef.current}
        shark={engine.sharkRef.current}
        visualSeason={engine.visualSeasonRef.current}
        birds={engine.birdsRef.current}
        clouds={engine.cloudsRef.current}
        isBoss={game.isBoss}
        bossHP={game.bossHP}
        bossMaxHP={game.bossMaxHP}
        flashWhite={game.flashWhite}
      />

      {newAchievement && (
        <div className="fixed top-[max(1rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
            <span className="text-3xl">{newAchievement.emoji}</span>
            <div>
              <div className="font-bold text-sm">دستاورد جدید! 🎉</div>
              <div className="text-xs opacity-90">{newAchievement.title}</div>
            </div>
          </div>
        </div>
      )}

      {game.screen === 'start' && (
        <StartScreen
          saveData={saveData}
          onStart={startGame}
          onAquarium={() => setShowAquarium(true)}
          onAchievements={() => setShowAchievements(true)}
          onProgress={() => setShowProgress(true)}
          onSupport={() => setShowSupport(true)}
        />
      )}

      {(game.screen === 'playing' || game.screen === 'boss') && (
        <PlayScreen
          game={game}
          seasonLabel={seasonLabel}
          timerPercent={timerPercent}
          timerColor={timerColor}
          onChoice={answerChoice}
          onTrueFalse={answerTrueFalse}
          onHint={useHint}
          onSkip={skipQuestion}
          onPause={togglePause}
          onSound={toggleSound}
          onMusic={toggleMusic}
          onPowerUp={usePowerUp}
        />
      )}

      {game.screen === 'gameover' && (
        <GameOverScreen
          game={game}
          saveData={saveData}
          caughtCount={engine.caughtRef.current.length}
          seasonLabel={seasonLabel}
          onReplay={replay}
          onAquarium={() => setShowAquarium(true)}
          onAchievements={() => setShowAchievements(true)}
          onSupport={() => setShowSupport(true)}
        />
      )}

      <GameModals
        saveData={saveData}
        showAquarium={showAquarium}
        showAchievements={showAchievements}
        showProgress={showProgress}
        showSupport={showSupport}
        onCloseAquarium={() => setShowAquarium(false)}
        onCloseAchievements={() => setShowAchievements(false)}
        onCloseProgress={() => setShowProgress(false)}
        onCloseSupport={() => setShowSupport(false)}
      />
    </div>
  );
}
