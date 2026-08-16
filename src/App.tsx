import { useState, useRef, useCallback, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { useGameEngine } from './hooks/useGameEngine';
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
import type { GameState, VisualSeason, Achievement, SaveData } from './types';

// بوم بزرگ‌تر برای پر کردن بیشتر صفحه موبایل
const CANVAS_W = 480;
const CANVAS_H = 340;

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
    feedbackText: 'برای شروع روی دکمه کلیک کن! 🎣',
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
    musicOn: true, // موسیقی ملایم به صورت پیش‌فرض روشن
  };
}

export default function App() {
  const [game, setGame] = useState<GameState>(createInitialState());
  const [answer, setAnswer] = useState('');
  const [showAbout, setShowAbout] = useState(false);
  const [showAquarium, setShowAquarium] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [saveData, setSaveData] = useState<SaveData>(loadSave());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [mistakesInSeason, setMistakesInSeason] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameRef = useRef(game);
  gameRef.current = game;
  const saveRef = useRef(saveData);
  saveRef.current = saveData;

  const engine = useGameEngine(CANVAS_W, CANVAS_H);

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
      const q = generateQuestion(newSeason, maxF);
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
          : 'با دکمه‌ها جواب بده! 🎯',
        feedbackColor: isNewSeason ? '#22c55e' : '#f8fafc',
      };
    });
    setAnswer('');
  }, [engine, checkAchievement, updateSave, mistakesInSeason]);

  const startGame = useCallback(() => {
    const tl = currentTimeLimit(1);
    const q = generateQuestion(1, 5);
    engine.spawnBackgroundFish();
    engine.setVisualSeason('spring');
    // همیشه موسیقی را شروع کن اگر روشن باشد
    startBGMusic();
    if (game.soundOn) playClickSound();

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
      timeLimit: tl,
      timeLeft: tl,
      timerRunning: true,
      coins: saveRef.current.coins,
      powerUps: loadedPowerUps,
      soundOn: game.soundOn,
      musicOn: true,
      feedbackText: 'با دکمه‌های رنگی جواب بده! 🎯',
      feedbackColor: '#f8fafc',
    });
    setAnswer('');
  }, [engine, game.soundOn, updateSave]);

  const submitAnswer = useCallback((ans: number) => {
    const g = gameRef.current;
    if (g.paused || !g.timerRunning) return;

    const responseTime = (Date.now() - questionStartTime) / 1000;

    if (ans === g.question.correct) {
      const newCombo = g.combo + 1;
      const gained = 5 + g.timeLeft + Math.min(25, newCombo * 3);
      const coinsGained = 1 + Math.floor(newCombo / 3);

      engine.confettiBurst();
      if (g.soundOn) {
        playCorrectSound();
        playCatchSound();
      }

      const fishKind = newCombo >= 8 ? 'golden' : (newCombo >= 5 ? 'rare' : 'normal');
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
          setAnswer('');
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
          timeLeft: prev.timeLimit,
          feedbackText: `${pick(CHEER_TEXTS)} 💥 ضربه زدی! (${newBossHP}/${prev.bossMaxHP})`,
          feedbackColor: '#22c55e',
          flashWhite: true,
        }));
        setTimeout(() => setGame(p => ({ ...p, flashWhite: false })), 250);
        setQuestionStartTime(Date.now());
        setAnswer('');
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
        setAnswer('');
        return;
      }
      setTimeout(() => advanceQuestion(), 1100);
    }

    setAnswer('');
  }, [engine, advanceQuestion, checkAchievement, updateSave, questionStartTime]);

  const checkAnswer = useCallback(() => {
    const g = gameRef.current;
    if (g.paused || !g.timerRunning) return;

    if (g.question.type === 'truefalse') return;
    if (g.question.type === 'multichoice') return;

    const s = answer.trim();
    if (!/^\d+$/.test(s)) {
      setGame(prev => ({
        ...prev,
        feedbackText: 'اول عدد رو با دکمه‌ها بزن! 🔢',
        feedbackColor: '#f59e0b',
      }));
      return;
    }

    submitAnswer(parseInt(s, 10));
  }, [answer, submitAnswer]);

  // === کیپد عددی برای کودکان ===
  const pressDigit = useCallback((digit: string) => {
    if (gameRef.current.paused || !gameRef.current.timerRunning) return;
    if (gameRef.current.soundOn) playClickSound();
    setAnswer(prev => {
      if (prev.length >= 4) return prev; // حداکثر ۴ رقم
      return prev + digit;
    });
  }, []);

  const pressBackspace = useCallback(() => {
    if (gameRef.current.paused || !gameRef.current.timerRunning) return;
    if (gameRef.current.soundOn) playClickSound();
    setAnswer(prev => prev.slice(0, -1));
  }, []);

  const answerTrueFalse = useCallback((isTrue: boolean) => {
    const g = gameRef.current;
    if (g.paused || !g.timerRunning || g.question.type !== 'truefalse') return;
    if (g.soundOn) playClickSound();

    const correct = g.question.isProposedCorrect === isTrue;
    if (correct) {
      submitAnswer(g.question.correct);
    } else {
      submitAnswer(-1);
    }
  }, [submitAnswer]);

  const answerMultiChoice = useCallback((choice: number) => {
    const g = gameRef.current;
    if (g.paused || !g.timerRunning || g.question.type !== 'multichoice') return;
    if (g.soundOn) playClickSound();
    setGame(prev => ({ ...prev, selectedChoice: choice }));
    submitAnswer(choice);
  }, [submitAnswer]);

  const skipQuestion = useCallback(() => {
    const g = gameRef.current;
    if (g.paused || !g.timerRunning) return;
    if (g.soundOn) playClickSound();

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

  const usePowerUp = useCallback((type: string) => {
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
          if (prev.question.type === 'multichoice' && prev.question.choices) {
            const wrongChoices = prev.question.choices.filter(c => c !== prev.question.correct);
            if (wrongChoices.length > 1) {
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
            feedbackText: '🔍 فقط در سوالات چندگزینه‌ای!',
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

  // کیبورد فیزیکی هنوز کار می‌کند (برای دسکتاپ)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (game.screen !== 'playing' && game.screen !== 'boss') return;
      if (e.key === 'Enter') {
        checkAnswer();
      } else if (e.key >= '0' && e.key <= '9') {
        pressDigit(e.key);
      } else if (e.key === 'Backspace') {
        pressBackspace();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [checkAnswer, pressDigit, pressBackspace, game.screen]);

  const livesDisplay = '❤️'.repeat(game.lives) + '🖤'.repeat(Math.max(0, INITIAL_LIVES - game.lives));
  const timerPercent = game.timeLimit > 0 ? (game.timeLeft / game.timeLimit) * 100 : 0;
  const timerColor = game.timeFrozen ? '#38bdf8' : (game.timeLeft <= 3 ? '#ef4444' : game.timeLeft <= 6 ? '#f59e0b' : '#a78bfa');
  const seasonLabel = game.visualSeason === 'spring' ? '🌸' : game.visualSeason === 'summer' ? '☀️' : game.visualSeason === 'autumn' ? '🍂' : '❄️';

  const canvasProps = {
    width: CANVAS_W,
    height: CANVAS_H,
    bubbles: engine.bubblesRef.current,
    bgFish: engine.bgFishRef.current,
    particles: engine.particlesRef.current,
    caught: engine.caughtRef.current,
    wavePhase: engine.wavePhaseRef.current,
    shark: engine.sharkRef.current,
    visualSeason: engine.visualSeasonRef.current,
    birds: engine.birdsRef.current,
    clouds: engine.cloudsRef.current,
    isBoss: game.isBoss,
    bossHP: game.bossHP,
    bossMaxHP: game.bossMaxHP,
  };

  // رنگ‌های کیپد
  const padColors = [
    'linear-gradient(135deg, #60a5fa, #2563eb)',
    'linear-gradient(135deg, #f97316, #ea580c)',
    'linear-gradient(135deg, #a78bfa, #7c3aed)',
    'linear-gradient(135deg, #22c55e, #16a34a)',
    'linear-gradient(135deg, #f43f5e, #e11d48)',
    'linear-gradient(135deg, #06b6d4, #0891b2)',
    'linear-gradient(135deg, #eab308, #ca8a04)',
    'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    'linear-gradient(135deg, #14b8a6, #0d9488)',
  ];

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-start pb-6 select-none overflow-x-hidden ${
        game.shaking ? 'animate-shake' : ''
      }`}
      style={{
        background: game.visualSeason === 'winter'
          ? 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)'
          : game.visualSeason === 'autumn'
          ? 'linear-gradient(180deg, #7c2d12 0%, #0a1628 100%)'
          : game.visualSeason === 'summer'
          ? 'linear-gradient(180deg, #0369a1 0%, #0a1628 100%)'
          : 'linear-gradient(180deg, #0b3d91 0%, #0a1628 100%)',
      }}
      dir="rtl"
    >
      {newAchievement && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
            <span className="text-3xl">{newAchievement.emoji}</span>
            <div>
              <div className="font-bold text-sm">دستاورد جدید! 🎉</div>
              <div className="text-xs opacity-90">{newAchievement.title}</div>
            </div>
          </div>
        </div>
      )}

      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowAbout(false)}>
          <div className="bg-[#1f2a44] rounded-2xl p-6 mx-4 max-w-sm text-center shadow-2xl border border-blue-500/30" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">درباره برنامه</h2>
            <p className="text-blue-200 leading-8 text-sm">
              این برنامه توسط گروه نرم افزاری:
              <br />
              <span className="text-yellow-300 font-bold">آرشا : 09160684552</span>
              <br />
              تهیه شده است
            </p>
            <button className="mt-5 px-8 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold transition-colors" onClick={() => setShowAbout(false)}>
              بستن
            </button>
          </div>
        </div>
      )}

      {showAquarium && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowAquarium(false)}>
          <div className="bg-[#0a1628] rounded-2xl p-5 mx-4 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-blue-500/30" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-2 text-center">🐟 آکواریوم شخصی</h2>
            <p className="text-blue-300 text-center text-xs mb-3">
              {saveData.aquarium.length} ماهی | 💰 {saveData.coins} سکه
              {saveData.hasSharkPet && ' | 🦈 کوسه‌خالخالی حیوان خانگی شماست!'}
            </p>
            <div className="grid grid-cols-5 gap-2">
              {saveData.aquarium.slice(-30).map((fish, i) => (
                <div key={i} className="bg-[#1f2a44] rounded-xl p-2 flex items-center justify-center" style={{ minHeight: '50px' }}>
                  <div className="text-2xl" style={{ color: fish.body }}>
                    {fish.kind === 'golden' ? '🌟' : fish.kind === 'rare' ? '💎' : '🐟'}
                  </div>
                </div>
              ))}
              {saveData.aquarium.length === 0 && (
                <div className="col-span-5 text-center text-blue-400 py-4 text-sm">
                  هنوز ماهی نگرفتی! شروع به بازی کن 🎣
                </div>
              )}
            </div>
            <button className="mt-4 w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold transition-colors" onClick={() => setShowAquarium(false)}>
              بستن
            </button>
          </div>
        </div>
      )}

      {showAchievements && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowAchievements(false)}>
          <div className="bg-[#0a1628] rounded-2xl p-5 mx-4 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-blue-500/30" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-3 text-center">🏆 دستاوردها</h2>
            <div className="space-y-2">
              {saveData.achievements.map(ach => (
                <div
                  key={ach.id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    ach.unlocked ? 'bg-[#1f2a44]' : 'bg-[#0f172a] opacity-50'
                  }`}
                >
                  <span className="text-2xl">{ach.emoji}</span>
                  <div className="flex-1">
                    <div className={`font-bold text-sm ${ach.unlocked ? 'text-white' : 'text-gray-500'}`}>
                      {ach.title}
                    </div>
                    <div className="text-xs text-blue-300">{ach.description}</div>
                  </div>
                  {ach.unlocked && <span className="text-green-400 text-lg">✅</span>}
                </div>
              ))}
            </div>
            <button className="mt-4 w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold transition-colors" onClick={() => setShowAchievements(false)}>
              بستن
            </button>
          </div>
        </div>
      )}

      {/* ============ START SCREEN ============ */}
      {game.screen === 'start' && (
        <div className="flex flex-col items-center w-full max-w-lg px-3 pt-3">
          <div className="text-6xl mb-1 animate-bounce">🎣</div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-center mb-1" style={{ color: '#fbbf24' }}>
            بازی ماهی‌گیری جدول ضرب
          </h1>
          <p className="text-blue-200 text-center text-sm mb-2">
            به سوال‌های ضرب جواب بده و ماهی‌های رنگی بگیر! 🐟
          </p>

          <div className="w-full mb-2">
            <GameCanvas {...canvasProps} flashWhite={false} />
          </div>

          <div className="w-full grid grid-cols-3 gap-2 mb-2">
            <div className="bg-[#1f2a44]/80 rounded-xl p-2 text-center">
              <div className="text-xs text-slate-400">بهترین امتیاز</div>
              <div className="text-yellow-300 font-bold">{saveData.highScore} ⭐</div>
            </div>
            <div className="bg-[#1f2a44]/80 rounded-xl p-2 text-center">
              <div className="text-xs text-slate-400">مجموع درست</div>
              <div className="text-green-300 font-bold">{saveData.totalCorrect} ✅</div>
            </div>
            <div className="bg-[#1f2a44]/80 rounded-xl p-2 text-center">
              <div className="text-xs text-slate-400">سکه‌ها</div>
              <div className="text-amber-300 font-bold">{saveData.coins} 💰</div>
            </div>
          </div>

          <div className="bg-[#1f2a44]/80 backdrop-blur rounded-2xl p-3 w-full mb-2 text-right space-y-1">
            {[
              '🐟 جواب درست بده و ماهی بگیر!',
              '🔥 کمبو بگیر تا کوسه‌خالخالی بیاد!',
              '🎯 با دکمه‌های رنگی جواب بده (کیبورد لازم نیست!)',
              '👹 آخر هر فصل با هیولا بجنگ!',
              '🦈 کوسه بامزه غافلگیرت می‌کنه!',
            ].map((tip, i) => (
              <p key={i} className="text-blue-100 text-xs">{tip}</p>
            ))}
          </div>

          <button
            className="w-full py-4 rounded-full text-white font-extrabold text-xl shadow-lg shadow-green-500/30 active:scale-95 transition-transform mb-2"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
            onClick={startGame}
          >
            🎮 شروع بازی
          </button>

          <div className="flex gap-2 w-full">
            <button
              className="flex-1 py-2 rounded-xl text-white font-bold text-sm active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg, #38bdf8, #0284c7)' }}
              onClick={() => setShowAquarium(true)}
            >
              🐟 آکواریوم
            </button>
            <button
              className="flex-1 py-2 rounded-xl text-white font-bold text-sm active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
              onClick={() => setShowAchievements(true)}
            >
              🏆 دستاوردها
            </button>
            <button
              className="py-2 px-3 rounded-xl text-white font-bold text-sm active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
              onClick={() => setShowAbout(true)}
            >
              ℹ️
            </button>
          </div>
        </div>
      )}

      {/* ============ PLAYING / BOSS SCREEN ============ */}
      {(game.screen === 'playing' || game.screen === 'boss') && (
        <div className="flex flex-col items-center w-full max-w-lg px-2 pt-1">
          {/* HUD */}
          <div className="w-full grid grid-cols-6 gap-1 mb-1">
            {[
              { label: 'امتیاز', value: String(game.score), color: '#fbbf24', emoji: '⭐' },
              { label: 'جان', value: livesDisplay, color: '#fb7185', emoji: '' },
              { label: 'فصل', value: `${seasonLabel}${game.season}-${game.episode}`, color: '#60a5fa', emoji: '' },
              { label: 'کمبو', value: String(game.combo), color: '#34d399', emoji: '🔥' },
              { label: 'سکه', value: String(game.coins), color: '#fbbf24', emoji: '💰' },
              { label: 'زمان', value: game.timeFrozen ? '❄️' : String(game.timeLeft), color: timerColor, emoji: game.timeFrozen ? '' : '⏱️' },
            ].map((item, i) => (
              <div key={i} className="bg-[#1f2a44] rounded-lg p-1 text-center">
                <div className="text-[9px] text-slate-400 leading-tight">{item.label}</div>
                <div className="text-xs font-bold truncate" style={{ color: item.color }}>
                  {item.emoji}{item.value}
                </div>
              </div>
            ))}
          </div>

          <div className="w-full h-2.5 bg-[#0b1220] rounded-full overflow-hidden mb-1">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${timerPercent}%`,
                backgroundColor: timerColor,
                boxShadow: game.timeLeft <= 3 ? '0 0 10px rgba(239,68,68,0.5)' : 'none',
              }}
            />
          </div>

          {(game.shieldActive || game.timeFrozen) && (
            <div className="flex gap-2 mb-1">
              {game.shieldActive && (
                <span className="bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full text-xs font-bold">🛡️ محافظ فعال</span>
              )}
              {game.timeFrozen && (
                <span className="bg-cyan-500/30 text-cyan-200 px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">❄️ زمان یخ‌زده</span>
              )}
            </div>
          )}

          {/* Canvas بزرگ‌تر */}
          <div className="w-full mb-1">
            <GameCanvas {...canvasProps} flashWhite={game.flashWhite} />
          </div>

          {/* Question */}
          <div className={`w-full rounded-2xl py-2.5 px-3 text-center mb-1 ${
            game.isBoss
              ? 'bg-gradient-to-r from-red-900/80 to-red-700/80 border-2 border-red-500/50'
              : 'bg-[#1f2a44]'
          }`}>
            {game.isBoss && (
              <div className="text-xs text-red-300 mb-0.5">👹 مبارزه با هیولا! ({game.bossHP}/{game.bossMaxHP})</div>
            )}
            <div className="text-2xl md:text-3xl font-extrabold text-white tracking-wide">
              {game.question.display}
            </div>
            {game.question.type === 'chain' && game.question.chainDisplay && (
              <div className="text-xl font-bold text-yellow-300 mt-0.5">
                {game.question.chainDisplay}
              </div>
            )}
            {game.question.type !== 'normal' && (
              <div className="text-xs text-blue-300 mt-0.5">
                {game.question.type === 'missing' && '🔎 عدد گمشده'}
                {game.question.type === 'multichoice' && '🎯 چندگزینه‌ای'}
                {game.question.type === 'truefalse' && '✅❌ صحیح یا غلط؟'}
                {game.question.type === 'chain' && '🔗 زنجیره‌ای'}
              </div>
            )}
          </div>

          <div className="text-center text-sm font-bold mb-1 min-h-[18px] px-2" style={{ color: game.feedbackColor }}>
            {game.feedbackText}
          </div>

          {/* === ورودی === */}

          {/* صحیح/غلط */}
          {game.question.type === 'truefalse' && (
            <div className="flex w-full gap-2 mb-2">
              <button
                className="flex-1 py-4 rounded-2xl text-white font-bold text-xl active:scale-95 transition-transform shadow-lg"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                onClick={() => answerTrueFalse(true)}
                disabled={game.paused || !game.timerRunning}
              >
                ✅ درسته
              </button>
              <button
                className="flex-1 py-4 rounded-2xl text-white font-bold text-xl active:scale-95 transition-transform shadow-lg"
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                onClick={() => answerTrueFalse(false)}
                disabled={game.paused || !game.timerRunning}
              >
                ❌ غلطه
              </button>
            </div>
          )}

          {/* چندگزینه‌ای */}
          {game.question.type === 'multichoice' && game.question.choices && (
            <div className="grid grid-cols-2 gap-2 w-full mb-2">
              {game.question.choices.map((choice, i) => (
                <button
                  key={i}
                  className={`py-4 rounded-2xl text-white font-bold text-2xl active:scale-95 transition-all shadow-lg ${
                    game.selectedChoice === choice
                      ? choice === game.question.correct
                        ? 'ring-4 ring-green-400'
                        : 'ring-4 ring-red-400'
                      : ''
                  }`}
                  style={{
                    background: padColors[i % padColors.length],
                  }}
                  onClick={() => answerMultiChoice(choice)}
                  disabled={game.paused || !game.timerRunning}
                >
                  {choice}
                </button>
              ))}
            </div>
          )}

          {/* === کیپد عددی بزرگ برای کودکان === */}
          {(game.question.type === 'normal' || game.question.type === 'missing' || game.question.type === 'chain') && (
            <div className="w-full mb-2">
              {/* نمایش جواب فعلی */}
              <div className="w-full bg-white rounded-2xl py-3 px-4 mb-2 text-center shadow-inner border-2 border-blue-300">
                <span className="text-3xl font-extrabold text-slate-800 tracking-widest">
                  {answer || '؟'}
                </span>
              </div>

              {/* دکمه‌های ۱ تا ۹ */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d, i) => (
                  <button
                    key={d}
                    className="py-3.5 rounded-2xl text-white font-extrabold text-2xl active:scale-90 transition-transform shadow-md"
                    style={{ background: padColors[i] }}
                    onClick={() => pressDigit(d)}
                    disabled={game.paused || !game.timerRunning}
                  >
                    {d}
                  </button>
                ))}
              </div>

              {/* ردیف پایین: پاک کردن | ۰ | تایید */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  className="py-3.5 rounded-2xl text-white font-bold text-xl active:scale-90 transition-transform shadow-md"
                  style={{ background: 'linear-gradient(135deg, #f43f5e, #be123c)' }}
                  onClick={pressBackspace}
                  disabled={game.paused || !game.timerRunning}
                >
                  ⌫
                </button>
                <button
                  className="py-3.5 rounded-2xl text-white font-extrabold text-2xl active:scale-90 transition-transform shadow-md"
                  style={{ background: 'linear-gradient(135deg, #64748b, #334155)' }}
                  onClick={() => pressDigit('0')}
                  disabled={game.paused || !game.timerRunning}
                >
                  0
                </button>
                <button
                  className="py-3.5 rounded-2xl text-white font-bold text-xl active:scale-90 transition-transform shadow-md"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #15803d)' }}
                  onClick={checkAnswer}
                  disabled={game.paused || !game.timerRunning}
                >
                  ✅
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-5 gap-1.5 w-full mb-1.5">
            <button
              className="py-2 rounded-xl text-white font-bold text-xs active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
              onClick={useHint}
            >
              💡 راهنما
            </button>
            <button
              className="py-2 rounded-xl text-white font-bold text-xs active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
              onClick={skipQuestion}
            >
              ⏭️ رد شو
            </button>
            <button
              className="py-2 rounded-xl text-white font-bold text-xs active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}
              onClick={togglePause}
            >
              {game.paused ? '▶️' : '⏸️'}
            </button>
            <button
              className="py-2 rounded-xl text-white font-bold text-xs active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg, #64748b, #475569)' }}
              onClick={toggleSound}
            >
              {game.soundOn ? '🔊' : '🔇'}
            </button>
            <button
              className="py-2 rounded-xl text-white font-bold text-xs active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #0369a1)' }}
              onClick={toggleMusic}
            >
              {game.musicOn ? '🎵' : '🔇'}
            </button>
          </div>

          {/* Power-ups */}
          <div className="grid grid-cols-4 gap-1.5 w-full">
            {game.powerUps.map((pu, i) => (
              <button
                key={i}
                className={`py-2 rounded-xl text-white font-bold text-xs active:scale-95 transition-transform relative ${
                  pu.count <= 0 ? 'opacity-40' : ''
                }`}
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #0369a1)' }}
                onClick={() => usePowerUp(pu.type)}
                disabled={pu.count <= 0 || game.paused || !game.timerRunning}
              >
                {pu.emoji} {pu.label}
                <span className="absolute -top-1 -left-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {pu.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ============ GAME OVER SCREEN ============ */}
      {game.screen === 'gameover' && (
        <div className="flex flex-col items-center w-full max-w-lg px-3 pt-4">
          <div className="text-6xl mb-2">{game.gameWon ? '🏆' : '🐟'}</div>
          <h1
            className="text-2xl md:text-3xl font-extrabold text-center mb-2"
            style={{ color: game.gameWon ? '#22c55e' : '#ef4444' }}
          >
            {game.gameWon ? 'آفرین! تمومش کردی! 🎉' : 'ای وای! این بار نشد! 😢'}
          </h1>

          <div className="w-full mb-2">
            <GameCanvas {...canvasProps} flashWhite={false} />
          </div>

          <div className="bg-[#1f2a44]/80 backdrop-blur rounded-2xl p-4 w-full mb-3 space-y-2">
            {[
              { label: 'امتیاز نهایی', value: `${game.score} ⭐`, color: '#fbbf24' },
              { label: 'بهترین کمبو', value: `${game.bestCombo} 🔥`, color: '#34d399' },
              { label: 'فصل رسیده', value: `${game.season} ${seasonLabel}`, color: '#60a5fa' },
              { label: 'ماهی‌ها', value: `${engine.caughtRef.current.length} 🐟`, color: '#fb7185' },
              { label: 'سکه‌ها', value: `${game.coins} 💰`, color: '#fbbf24' },
              { label: 'بهترین رکورد', value: `${saveData.highScore} ⭐`, color: '#a78bfa' },
              { label: 'کوسه دیده', value: `${saveData.sharkSeen} بار 🦈`, color: '#64748b' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-blue-200 text-sm">{item.label}</span>
                <span className="font-bold text-lg" style={{ color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>

          <button
            className="w-full py-4 rounded-full text-white font-extrabold text-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-transform mb-2"
            style={{ background: 'linear-gradient(135deg, #60a5fa, #2563eb)' }}
            onClick={() => {
              engine.spawnBackgroundFish();
              setGame(createInitialState());
              setSaveData(loadSave());
            }}
          >
            🔄 بازی دوباره
          </button>

          <div className="flex gap-2 w-full">
            <button
              className="flex-1 py-2 rounded-xl text-white font-bold text-sm active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg, #38bdf8, #0284c7)' }}
              onClick={() => setShowAquarium(true)}
            >
              🐟 آکواریوم
            </button>
            <button
              className="flex-1 py-2 rounded-xl text-white font-bold text-sm active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
              onClick={() => setShowAchievements(true)}
            >
              🏆 دستاوردها
            </button>
            <button
              className="py-2 px-3 rounded-xl text-white font-bold text-sm active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
              onClick={() => setShowAbout(true)}
            >
              ℹ️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
