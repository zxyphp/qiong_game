import React from 'react';
import {
  BookHeart,
  Layers,
  Moon,
  Settings,
  Sparkles,
  Star,
  Sun,
} from 'lucide-react';
import { QIONG_CONFIG } from '../config/qiongConfig';
import { PlayerSaveData } from '../types/game';
import { FlowerFoxMascot, TileCanvasPreview } from './FallbackArt';

interface HomeScreenProps {
  save: PlayerSaveData;
  onEnterMap: () => void;
  onOpenSettings: () => void;
  onOpenGallery: () => void;
  onOpenShowcase: () => void;
  onToggleTheme: () => void;
  onDismissWelcome: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  save,
  onEnterMap,
  onOpenSettings,
  onOpenGallery,
  onOpenShowcase,
  onToggleTheme,
  onDismissWelcome,
}) => {
  const isNight = save.settings.theme === 'night';
  const totalStars = Object.values(save.levels).reduce((acc, item) => acc + item.stars, 0);

  return (
    <div className="relative z-10 h-full w-full max-w-md mx-auto flex flex-col justify-between px-5 pt-safe pb-safe">
      {/* Top Bar */}
      <header className="flex items-center justify-between pt-2">
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
            isNight ? 'glass-panel' : 'glass-panel-day'
          }`}
        >
          <Star className="w-3.5 h-3.5 text-petal-gold fill-petal-gold" />
          <span>{totalStars} / 150</span>
          <span className="text-starlight-300/60 mx-0.5">·</span>
          <span className="text-starlight-200">Lv.{save.highestUnlockedLevel}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="切换日夜主题"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition active:scale-95 ${
              isNight ? 'glass-panel text-starlight-200' : 'glass-panel-day text-petal-gold'
            }`}
          >
            {isNight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="打开设置"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition active:scale-95 ${
              isNight ? 'glass-panel text-starlight-200' : 'glass-panel-day text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Center Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center my-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] text-starlight-200 mb-4 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-petal-gold" />
          <span>零体力 · 零广告 · 献给{QIONG_CONFIG.playerName}的星光花海</span>
        </div>

        <h1 className="font-display text-5xl font-bold tracking-[0.14em] text-transparent bg-clip-text bg-gradient-to-b from-white via-starlight-200 to-petal-pink text-glow">
          {QIONG_CONFIG.gameTitle}
        </h1>
        <p className="mt-2.5 text-sm text-starlight-200/85 tracking-wide">
          {QIONG_CONFIG.gameSubtitle}
        </p>

        {/* Flower Fox + Orbiting Luminous Flowers */}
        <div className="relative mt-6 mb-4 w-64 h-52 flex items-center justify-center">
          <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-petal-pink/20 via-petal-violet/20 to-petal-cyan/20 blur-2xl" />

          <div className="absolute top-1 left-6 animate-float-slow">
            <TileCanvasPreview color="rose" size={44} />
          </div>
          <div
            className="absolute top-3 right-5 animate-float-slow"
            style={{ animationDelay: '0.8s' }}
          >
            <TileCanvasPreview color="cyan" special="butterfly" size={46} animated />
          </div>
          <div
            className="absolute bottom-4 left-3 animate-float-slow"
            style={{ animationDelay: '1.4s' }}
          >
            <TileCanvasPreview color="sun" size={40} />
          </div>
          <div
            className="absolute bottom-3 right-6 animate-float-slow"
            style={{ animationDelay: '2.1s' }}
          >
            <TileCanvasPreview color="violet" size={42} />
          </div>

          <div className="relative z-10 animate-float-slow" style={{ animationDuration: '5s' }}>
            <FlowerFoxMascot mood="idle" size={148} />
          </div>
        </div>
      </main>

      {/* Bottom Thumb-Zone Actions */}
      <footer className="space-y-3 pb-2">
        <button
          type="button"
          onClick={onEnterMap}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-petal-pink via-petal-violet to-petal-cyan text-white font-display text-lg font-semibold tracking-[0.12em] shadow-glow-pink active:scale-[0.98] transition relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" />
            踏入星光花海
          </span>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onOpenGallery}
            className={`py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium active:scale-[0.98] transition ${
              isNight ? 'glass-panel text-starlight-100' : 'glass-panel-day text-white'
            }`}
          >
            <BookHeart className="w-4 h-4 text-petal-pink" />
            <span>{QIONG_CONFIG.playerName}的星海画册</span>
          </button>

          <button
            type="button"
            onClick={onOpenShowcase}
            className={`py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium active:scale-[0.98] transition ${
              isNight ? 'glass-panel text-starlight-100' : 'glass-panel-day text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-petal-cyan" />
            <span>矢量资产图鉴</span>
          </button>
        </div>
      </footer>

      {/* First-Time Welcome Modal */}
      {!save.settings.hasSeenWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/65 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl glass-panel p-6 text-center text-white">
            <div className="flex justify-center -mt-2 mb-2">
              <FlowerFoxMascot mood="cheer" size={104} />
            </div>
            <h2 className="font-display text-xl font-semibold text-glow">
              {QIONG_CONFIG.welcomeMessage.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-starlight-200/90">
              {QIONG_CONFIG.welcomeMessage.body}
            </p>
            <button
              type="button"
              onClick={onDismissWelcome}
              className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-petal-pink to-petal-violet font-medium text-white shadow-glow-pink active:scale-[0.98] transition"
            >
              {QIONG_CONFIG.welcomeMessage.buttonText}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
