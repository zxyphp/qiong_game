import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Settings,
  Shuffle,
  Sparkles,
  Star,
} from 'lucide-react';
import { getChapterForLevel } from '../config/levels';
import { QIONG_CONFIG } from '../config/qiongConfig';
import { BoardHudSnapshot, BoardStateMachine } from '../engine/BoardStateMachine';
import { LevelConfig, ThemeMode } from '../types/game';
import { FlowerFoxMascot, PropIconArt, TileCanvasPreview } from './FallbackArt';
import { Match3BoardCanvas } from './Match3BoardCanvas';

interface GameScreenProps {
  level: LevelConfig;
  theme: ThemeMode;
  onBackToMap: () => void;
  onOpenSettings: () => void;
  onLevelCleared: (levelId: number, stars: number, score: number) => void;
  onNextLevel: (nextLevelId: number) => void;
}

interface FloatingBanner {
  id: number;
  title: string;
  subtitle?: string;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  level,
  theme,
  onBackToMap,
  onOpenSettings,
  onLevelCleared,
  onNextLevel,
}) => {
  const [runKey, setRunKey] = useState(0);
  const [hud, setHud] = useState<BoardHudSnapshot>(() => ({
    phase: 'IDLE',
    score: 0,
    movesLeft: level.moves,
    stars: 0,
    combo: 0,
    goals: level.goals.map((goal) => ({ goal, current: 0 })),
  }));
  const [banner, setBanner] = useState<FloatingBanner | null>(null);
  const [shuffleNotice, setShuffleNotice] = useState(false);

  const clearedNotifiedRef = useRef(false);
  const bannerTimerRef = useRef<number | null>(null);
  const shuffleTimerRef = useRef<number | null>(null);

  const chapter = getChapterForLevel(level.id);
  const isNight = theme === 'night';

  const engine = useMemo(() => {
    clearedNotifiedRef.current = false;
    return new BoardStateMachine(level, {
      onSnapshot: (snap) => {
        setHud(snap);
        if (snap.phase === 'VICTORY' && !clearedNotifiedRef.current) {
          clearedNotifiedRef.current = true;
          onLevelCleared(level.id, Math.max(1, snap.stars), snap.score);
        }
      },
      onCombo: (combo, specialLabel) => {
        const praise =
          QIONG_CONFIG.comboPraises[
            Math.floor(Math.random() * QIONG_CONFIG.comboPraises.length)
          ];
        setBanner({
          id: Date.now(),
          title: specialLabel ?? `Combo ×${combo}`,
          subtitle: combo >= 2 ? praise : undefined,
        });
        if (bannerTimerRef.current) window.clearTimeout(bannerTimerRef.current);
        bannerTimerRef.current = window.setTimeout(() => setBanner(null), 1350);
      },
      onShuffle: () => {
        setShuffleNotice(true);
        if (shuffleTimerRef.current) window.clearTimeout(shuffleTimerRef.current);
        shuffleTimerRef.current = window.setTimeout(() => setShuffleNotice(false), 1200);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.id, runKey]);

  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) window.clearTimeout(bannerTimerRef.current);
      if (shuffleTimerRef.current) window.clearTimeout(shuffleTimerRef.current);
    };
  }, []);

  const starMax = level.starThresholds[2];
  const scorePercent = Math.min(100, Math.round((hud.score / starMax) * 100));

  const restartLevel = () => {
    setBanner(null);
    setShuffleNotice(false);
    setRunKey((k) => k + 1);
  };

  return (
    <div className="relative z-10 h-full w-full max-w-md mx-auto flex flex-col justify-between px-3.5 pt-safe pb-safe">
      {/* Top HUD */}
      <header className="shrink-0 space-y-2.5 pt-1">
        <div
          className={`flex items-center justify-between px-3 py-2 rounded-2xl ${
            isNight ? 'glass-panel' : 'glass-panel-day'
          }`}
        >
          <button
            type="button"
            onClick={onBackToMap}
            aria-label="返回星光大地图"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/15 flex items-center justify-center text-white active:scale-95 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="text-center">
            <div className="text-[11px] text-starlight-200/80">
              {chapter.name} · 第 {level.id} 关
            </div>
            <div className="font-display text-sm font-semibold text-white tracking-wide">
              {level.name}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={restartLevel}
              aria-label="重新开始本关"
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/15 flex items-center justify-center text-starlight-200 active:scale-95 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="打开设置"
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/15 flex items-center justify-center text-starlight-200 active:scale-95 transition"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Moves + Goals + Score Bar */}
        <div
          className={`rounded-2xl px-3.5 py-2.5 flex items-center gap-3 ${
            isNight ? 'glass-panel' : 'glass-panel-day'
          }`}
        >
          {/* Remaining Moves */}
          <div className="w-16 shrink-0 rounded-xl bg-gradient-to-b from-petal-pink/30 to-petal-violet/25 border border-petal-pink/35 py-1.5 text-center">
            <div className="text-[10px] text-starlight-200/85">剩余步数</div>
            <div
              className={`text-2xl font-bold leading-tight ${
                hud.movesLeft <= 5 ? 'text-petal-coral animate-pulse' : 'text-white'
              }`}
            >
              {hud.movesLeft}
            </div>
          </div>

          {/* Goals & 3-Star Progress */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center flex-wrap gap-2">
              {hud.goals.map((gp, i) => {
                const done = gp.current >= gp.goal.target;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border ${
                      done
                        ? 'bg-emerald-500/25 border-emerald-400/45 text-emerald-100'
                        : 'bg-white/10 border-white/15 text-white'
                    }`}
                  >
                    {gp.goal.type === 'tile' && gp.goal.color && (
                      <TileCanvasPreview color={gp.goal.color} size={18} />
                    )}
                    <span className="truncate max-w-[100px]">{gp.goal.label}</span>
                    <span className="font-semibold text-petal-gold">
                      {gp.current}/{gp.goal.target}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-petal-pink via-petal-gold to-petal-cyan transition-all duration-300"
                  style={{ width: `${scorePercent}%` }}
                />
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 transition ${
                      s <= hud.stars
                        ? 'text-petal-gold fill-petal-gold scale-110'
                        : 'text-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Center Canvas 2D Match-3 Board */}
      <main className="relative flex-1 min-h-0 my-2 flex items-center justify-center">
        <div className="w-full h-full max-h-[500px] aspect-square max-w-full rounded-3xl p-1.5 bg-starlight-950/35 border border-starlight-300/15 shadow-glass">
          <Match3BoardCanvas engine={engine} />
        </div>

        {/* Center Glassmorphism Combo Art-Text Banner */}
        {banner && (
          <div
            key={banner.id}
            className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 flex flex-col items-center z-20 animate-bounce"
            style={{ animationDuration: '0.9s' }}
          >
            <div className="px-5 py-2.5 rounded-2xl glass-panel border-petal-gold/50 shadow-glow-pink text-center">
              <div className="font-display text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-petal-gold via-white to-petal-pink text-glow-gold">
                {banner.title}
              </div>
              {banner.subtitle && (
                <div className="text-xs text-starlight-100 mt-0.5">{banner.subtitle}</div>
              )}
            </div>
          </div>
        )}

        {/* Auto-Shuffle Vortex Toast */}
        {shuffleNotice && (
          <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full glass-panel border-petal-cyan/50 text-xs text-petal-cyan flex items-center gap-1.5 shadow-glow">
            <Shuffle className="w-3.5 h-3.5 animate-spin" />
            <span>星光漩涡自动重排中…</span>
          </div>
        )}
      </main>

      {/* Bottom Thumb-Zone Prop Bar */}
      <footer className="shrink-0 pb-1">
        <div
          className={`rounded-2xl px-3 py-2 grid grid-cols-4 gap-2 ${
            isNight ? 'glass-panel' : 'glass-panel-day'
          }`}
        >
          <button
            type="button"
            disabled
            className="flex flex-col items-center gap-0.5 py-1.5 rounded-xl bg-white/5 opacity-55"
            title="Phase 4 实装"
          >
            <PropIconArt prop="hammer" size={26} />
            <span className="text-[10px] text-starlight-200">小木锤</span>
          </button>

          <button
            type="button"
            disabled
            className="flex flex-col items-center gap-0.5 py-1.5 rounded-xl bg-white/5 opacity-55"
            title="Phase 4 实装"
          >
            <PropIconArt prop="swap" size={26} />
            <span className="text-[10px] text-starlight-200">强制交换</span>
          </button>

          <button
            type="button"
            onClick={() => engine.triggerManualShuffle()}
            className="flex flex-col items-center gap-0.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 transition"
          >
            <PropIconArt prop="shuffle" size={26} />
            <span className="text-[10px] text-white">星光重排</span>
          </button>

          <button
            type="button"
            disabled
            className="flex flex-col items-center gap-0.5 py-1.5 rounded-xl bg-white/5 opacity-55"
            title="Phase 4 实装免费撤回"
          >
            <PropIconArt prop="undo" size={26} />
            <span className="text-[10px] text-starlight-200">免费撤回</span>
          </button>
        </div>
      </footer>

      {/* Victory Modal */}
      {hud.phase === 'VICTORY' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/65 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl glass-panel p-6 text-center text-white">
            <div className="flex justify-center -mt-2 mb-1">
              <FlowerFoxMascot mood="cheer" size={108} />
            </div>
            <div className="flex items-center justify-center gap-1.5 mb-2">
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  className={`w-7 h-7 ${
                    s <= Math.max(1, hud.stars)
                      ? 'text-petal-gold fill-petal-gold drop-shadow-[0_0_12px_rgba(255,214,102,0.7)]'
                      : 'text-white/20'
                  }`}
                />
              ))}
            </div>
            <h2 className="font-display text-2xl font-bold text-glow">
              第 {level.id} 关 · 繁花绽放！
            </h2>
            <p className="text-sm text-starlight-200 mt-1">本关得分：{hud.score}</p>

            <div className="mt-6 space-y-2.5">
              {level.id < 50 && (
                <button
                  type="button"
                  onClick={() => onNextLevel(level.id + 1)}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-petal-pink via-petal-violet to-petal-cyan font-semibold text-white shadow-glow-pink flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>前往第 {level.id + 1} 关</span>
                </button>
              )}
              <button
                type="button"
                onClick={onBackToMap}
                className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-sm text-starlight-100 active:scale-[0.98] transition"
              >
                返回星光路径大地图
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Out of Moves Modal */}
      {hud.phase === 'OUT_OF_MOVES' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/65 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl glass-panel p-6 text-center text-white">
            <div className="flex justify-center -mt-2 mb-2">
              <FlowerFoxMascot mood="idle" size={102} />
            </div>
            <h2 className="font-display text-xl font-bold">步数用完啦</h2>
            <p className="text-xs text-starlight-200/85 mt-2 leading-relaxed">
              别急哦，零体力随时可以再来一局！（Phase 4 还将上线小花狐免费续 5 步应援~）
            </p>
            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={restartLevel}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-petal-pink to-petal-violet font-semibold text-white shadow-glow-pink active:scale-[0.98] transition"
              >
                再来一局
              </button>
              <button
                type="button"
                onClick={onBackToMap}
                className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-sm text-starlight-100 active:scale-[0.98] transition"
              >
                返回星光大地图
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
