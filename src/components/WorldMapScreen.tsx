import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookHeart,
  Crown,
  Gift,
  Lock,
  Moon,
  Navigation,
  Settings,
  Sparkles,
  Star,
  Sun,
  X,
} from 'lucide-react';
import { CHAPTERS, getChapterForLevel, LEVELS } from '../config/levels';
import { QIONG_CONFIG } from '../config/qiongConfig';
import { LevelConfig, PlayerSaveData } from '../types/game';
import { TileCanvasPreview } from './FallbackArt';

interface WorldMapScreenProps {
  save: PlayerSaveData;
  onBackHome: () => void;
  onOpenSettings: () => void;
  onOpenGallery: () => void;
  onToggleTheme: () => void;
}

const NODE_X_PERCENT = [50, 72, 80, 66, 40, 22, 26, 52, 76, 50];
const ROW_STEP_PX = 94;

export const WorldMapScreen: React.FC<WorldMapScreenProps> = ({
  save,
  onBackHome,
  onOpenSettings,
  onOpenGallery,
  onToggleTheme,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<LevelConfig | null>(null);
  const currentNodeRef = useRef<HTMLButtonElement | null>(null);
  const isNight = save.settings.theme === 'night';

  const totalStars = useMemo(
    () => Object.values(save.levels).reduce((acc, r) => acc + r.stars, 0),
    [save.levels]
  );

  const scrollToCurrent = () => {
    currentNodeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="relative z-10 h-full w-full max-w-md mx-auto flex flex-col">
      {/* Top Sticky Glass Header */}
      <header className="px-4 pt-safe pb-3 shrink-0">
        <div
          className={`flex items-center justify-between px-3 py-2.5 rounded-2xl ${
            isNight ? 'glass-panel' : 'glass-panel-day'
          }`}
        >
          <button
            type="button"
            onClick={onBackHome}
            aria-label="返回主界面"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/15 flex items-center justify-center text-white active:scale-95 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="text-center">
            <div className="font-display text-sm font-semibold tracking-wider text-white">
              星光路径大地图
            </div>
            <div className="text-[11px] text-starlight-200/80 flex items-center justify-center gap-1">
              <Star className="w-3 h-3 text-petal-gold fill-petal-gold" />
              <span>{totalStars} / 150</span>
              <span className="opacity-50">·</span>
              <span>第 {save.highestUnlockedLevel} / 50 关</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="切换日夜主题"
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/15 flex items-center justify-center text-starlight-200 active:scale-95 transition"
            >
              {isNight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-petal-gold" />}
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
      </header>

      {/* Scrollable 5-Chapter Starlight Constellation Path */}
      <div className="starlight-scroll flex-1 px-4 pb-24">
        <div className="space-y-8 pt-2">
          {CHAPTERS.map((chapter) => {
            const chapterLevels = LEVELS.filter((l) => l.chapterId === chapter.id);
            const containerHeight = chapterLevels.length * ROW_STEP_PX + 24;
            const postcard = QIONG_CONFIG.postcards.find((p) => p.id === chapter.postcardId);
            const postcardUnlocked = save.unlockedPostcards.includes(chapter.postcardId);

            // Build smooth cubic bezier SVG path in 0..100 x-space, pixel y-space
            const points = chapterLevels.map((_, idx) => ({
              x: NODE_X_PERCENT[idx % NODE_X_PERCENT.length],
              y: idx * ROW_STEP_PX + 42,
            }));

            const pathD = points.reduce((acc, pt, idx) => {
              if (idx === 0) return `M ${pt.x} ${pt.y}`;
              const prev = points[idx - 1];
              const midY = (prev.y + pt.y) / 2;
              return `${acc} C ${prev.x} ${midY}, ${pt.x} ${midY}, ${pt.x} ${pt.y}`;
            }, '');

            return (
              <section key={chapter.id} className="relative">
                {/* Chapter Banner */}
                <div
                  className="rounded-3xl p-4 mb-4 border border-white/15 relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${chapter.accentFrom}30, rgba(22,16,48,0.68) 65%, ${chapter.accentTo}25)`,
                    boxShadow: `0 8px 28px ${chapter.glowColor}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-widest text-starlight-200/80">
                        Chapter 0{chapter.id} · Lv.{chapter.levelRange[0]}–{chapter.levelRange[1]}
                      </div>
                      <h2 className="font-display text-lg font-bold text-white mt-0.5">
                        {chapter.name}
                      </h2>
                      <p className="text-xs text-starlight-200/80 mt-0.5">{chapter.subtitle}</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-petal-gold" />
                    </div>
                  </div>
                </div>

                {/* Constellation Path & Nodes */}
                <div className="relative w-full" style={{ height: containerHeight }}>
                  <svg
                    viewBox={`0 0 100 ${containerHeight}`}
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id={`path-grad-${chapter.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={chapter.accentFrom} stopOpacity="0.9" />
                        <stop offset="100%" stopColor={chapter.accentTo} stopOpacity="0.9" />
                      </linearGradient>
                    </defs>
                    {/* Outer soft glow */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={chapter.accentFrom}
                      strokeOpacity="0.22"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                    {/* Dotted starlight trail */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={`url(#path-grad-${chapter.id})`}
                      strokeWidth="1.2"
                      strokeDasharray="2.5 3.5"
                      strokeLinecap="round"
                    />
                  </svg>

                  {chapterLevels.map((level, idx) => {
                    const pt = points[idx];
                    const progress = save.levels[level.id];
                    const isUnlocked = level.id <= save.highestUnlockedLevel;
                    const isCurrent = level.id === save.highestUnlockedLevel;
                    const stars = progress?.stars ?? 0;

                    return (
                      <div
                        key={level.id}
                        style={{
                          left: `${pt.x}%`,
                          top: `${pt.y}px`,
                        }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                      >
                        <button
                          ref={isCurrent ? currentNodeRef : undefined}
                          type="button"
                          onClick={() => setSelectedLevel(level)}
                          className={`relative w-14 h-14 rounded-full flex flex-col items-center justify-center transition active:scale-95 ${
                            isCurrent
                              ? 'bg-gradient-to-br from-petal-pink via-petal-violet to-petal-cyan text-white shadow-glow-pink ring-4 ring-petal-pink/35'
                              : isUnlocked
                                ? 'bg-starlight-800/90 border-2 border-starlight-300/70 text-white shadow-glow'
                                : 'bg-starlight-950/80 border border-white/15 text-starlight-300/65 hover:border-starlight-400/50'
                          }`}
                        >
                          {level.tag === 'challenge' && (
                            <span className="absolute -top-2 -right-1 w-5 h-5 rounded-full bg-amber-400 text-starlight-950 flex items-center justify-center shadow">
                              <Crown className="w-3 h-3" />
                            </span>
                          )}
                          {level.tag === 'relief' && (
                            <span className="absolute -top-2 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-400 text-starlight-950 text-[9px] font-bold shadow flex items-center gap-0.5">
                              <Gift className="w-2.5 h-2.5" />
                              福利
                            </span>
                          )}

                          <span className="text-base font-bold leading-none">{level.id}</span>
                          {!isUnlocked && <Lock className="w-2.5 h-2.5 mt-0.5 opacity-60" />}
                        </button>

                        {/* 3-Star Indicator */}
                        <div className="flex items-center gap-0.5 mt-1">
                          {[1, 2, 3].map((s) => (
                            <Star
                              key={s}
                              className={`w-2.5 h-2.5 ${
                                s <= stars
                                  ? 'text-petal-gold fill-petal-gold'
                                  : 'text-white/20'
                              }`}
                            />
                          ))}
                        </div>

                        <span className="text-[10px] text-starlight-200/75 mt-0.5 whitespace-nowrap">
                          {level.name}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Milestone Postcard Card Every 10 Levels */}
                {postcard && (
                  <button
                    type="button"
                    onClick={onOpenGallery}
                    className={`w-full mt-2 rounded-2xl px-4 py-3 flex items-center justify-between border transition active:scale-[0.99] ${
                      postcardUnlocked
                        ? 'glass-panel border-petal-gold/45 text-white'
                        : 'bg-starlight-900/50 border-white/10 text-starlight-300/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-xl bg-petal-pink/20 border border-petal-pink/35 flex items-center justify-center text-petal-pink">
                        <BookHeart className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold">
                          纪念明信片 · {postcard.title}
                        </div>
                        <div className="text-[11px] opacity-75">
                          {postcardUnlocked
                            ? '已解锁！点击前往星海画册翻转查看祝福与兑换券'
                            : `通关第 ${postcard.unlockLevel} 关解锁专属明信片`}
                        </div>
                      </div>
                    </div>
                    <Sparkles className="w-4 h-4 text-petal-gold shrink-0" />
                  </button>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {/* Floating Bottom Quick-Jump Pill */}
      <div className="fixed bottom-0 left-0 right-0 z-20 pointer-events-none flex justify-center pb-safe px-4">
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={scrollToCurrent}
            className="px-4 py-2.5 rounded-full glass-panel text-xs font-medium text-white flex items-center gap-1.5 shadow-glow active:scale-95 transition"
          >
            <Navigation className="w-3.5 h-3.5 text-petal-cyan" />
            <span>定位当前第 {save.highestUnlockedLevel} 关</span>
          </button>
          <button
            type="button"
            onClick={onOpenGallery}
            className="px-4 py-2.5 rounded-full glass-panel text-xs font-medium text-white flex items-center gap-1.5 active:scale-95 transition"
          >
            <BookHeart className="w-3.5 h-3.5 text-petal-pink" />
            <span>画册 ({save.unlockedPostcards.length}/5)</span>
          </button>
        </div>
      </div>

      {/* Level Preview Modal */}
      {selectedLevel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/65 backdrop-blur-sm"
          onClick={() => setSelectedLevel(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl glass-panel p-6 text-white relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedLevel(null)}
              aria-label="关闭关卡预览"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-starlight-200"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-xs text-starlight-300 mb-1">
              {getChapterForLevel(selectedLevel.id).name} · 第 {selectedLevel.id} 关
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-xl font-bold">{selectedLevel.name}</h3>
              {selectedLevel.tag === 'challenge' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/40">
                  小挑战关
                </span>
              )}
              {selectedLevel.tag === 'relief' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/40">
                  四色解压福利
                </span>
              )}
            </div>
            <p className="text-xs text-starlight-200/80 mt-2 leading-relaxed">
              {selectedLevel.description}
            </p>

            {/* Frosted Glass Board Preview (3x3 sample of this level's flowers) */}
            <div className="mt-4 p-3 rounded-2xl bg-starlight-950/60 border border-white/10">
              <div className="flex items-center justify-between text-[11px] text-starlight-300 mb-2">
                <span>棋盘规格：{selectedLevel.rows} × {selectedLevel.cols}</span>
                <span>步数：{selectedLevel.moves} 步</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: 5 }, (_, idx) => {
                  const color = selectedLevel.colors[idx % selectedLevel.colors.length];
                  const obs = selectedLevel.obstacles[idx];
                  return (
                    <div
                      key={idx}
                      className="board-cell-glass rounded-xl aspect-square flex items-center justify-center"
                    >
                      <TileCanvasPreview color={color} obstacle={obs} size={42} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Goals */}
            <div className="mt-4 space-y-1.5">
              {selectedLevel.goals.map((g, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 text-xs"
                >
                  <span className="text-starlight-200">{g.label}</span>
                  <span className="font-semibold text-petal-gold">目标 {g.target}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-starlight-700/45 border border-starlight-400/30 px-4 py-3 text-center text-xs text-starlight-200">
              Phase 1 架构与星光大地图验收中 · 核心三消棋盘引擎将在 Phase 2 实装上线 ✨
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
