import React from 'react';
import { Layers, Sparkles, X } from 'lucide-react';
import {
  ASSETS_MANIFEST,
  assetManager,
  TILE_VISUAL_META,
} from '../config/assetsManifest';
import { FoxMood, ObstacleType, PropType, SpecialType, TileColor } from '../types/game';
import { FlowerFoxMascot, PropIconArt, TileCanvasPreview } from './FallbackArt';

interface AssetShowcaseModalProps {
  open: boolean;
  onClose: () => void;
}

const TILE_COLORS: TileColor[] = ['rose', 'sun', 'cyan', 'violet', 'coral', 'emerald'];

const SPECIALS: { type: Exclude<SpecialType, 'none'>; name: string; color: TileColor }[] = [
  { type: 'line_h', name: '横向星流花', color: 'rose' },
  { type: 'line_v', name: '纵向星流花', color: 'cyan' },
  { type: 'bomb', name: '花爆星核', color: 'sun' },
  { type: 'butterfly', name: '星穹琉璃蝶', color: 'violet' },
];

const OBSTACLES: { type: ObstacleType; name: string; desc: string }[] = [
  { type: 'ice_1', name: '薄霜', desc: '1 层冰' },
  { type: 'ice_2', name: '厚冰', desc: '2 层冰' },
  { type: 'vine', name: '月光藤蔓', desc: '锁定棋子' },
  { type: 'drop_item', name: '星露瓶', desc: '掉落收集' },
  { type: 'honey', name: '蔓延星蜜', desc: '回合蔓延' },
];

const PROPS: { type: PropType; name: string }[] = [
  { type: 'hammer', name: '小木锤' },
  { type: 'swap', name: '强制交换' },
  { type: 'shuffle', name: '星光重排' },
  { type: 'undo', name: '免费撤回' },
];

const FOX_MOODS: { mood: FoxMood; name: string }[] = [
  { mood: 'idle', name: '日常陪伴' },
  { mood: 'cheer', name: '递花应援' },
  { mood: 'yawn', name: '半小时提醒' },
];

export const AssetShowcaseModal: React.FC<AssetShowcaseModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  const badge = (path: string) => {
    const loaded = assetManager.getStatus(path) === 'loaded';
    return (
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
          loaded
            ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/30'
            : 'bg-starlight-700/70 text-starlight-200 border border-starlight-400/30'
        }`}
      >
        {loaded ? '自定义贴图' : '矢量降级'}
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[85vh] rounded-3xl glass-panel flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-petal-cyan" />
            <div>
              <h2 className="text-base font-display font-semibold">美术资产与矢量降级图鉴</h2>
              <p className="text-[11px] text-starlight-300/80">
                assetsManifest.ts 自动检测，无图即启用高分屏 Canvas/SVG 发光绘制
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭图鉴"
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-starlight-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="starlight-scroll p-5 space-y-6">
          {/* 6 Flower Tiles */}
          <section>
            <h3 className="text-xs font-medium text-starlight-200 mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-petal-pink" />
              基础六色发光花朵（Canvas 2D）
            </h3>
            <div className="grid grid-cols-3 gap-2.5">
              {TILE_COLORS.map((color) => (
                <div
                  key={color}
                  className="board-cell-glass rounded-2xl p-2.5 flex flex-col items-center gap-1"
                >
                  <TileCanvasPreview color={color} size={50} />
                  <span className="text-xs font-medium">{TILE_VISUAL_META[color].name}</span>
                  {badge(ASSETS_MANIFEST.tiles[color])}
                </div>
              ))}
            </div>
          </section>

          {/* 4 Animated Specials */}
          <section>
            <h3 className="text-xs font-medium text-starlight-200 mb-2.5">
              特效花朵与魔力鸟（实时动效预览）
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {SPECIALS.map((sp) => (
                <div
                  key={sp.type}
                  className="board-cell-glass rounded-2xl p-3 flex items-center gap-3"
                >
                  <TileCanvasPreview color={sp.color} special={sp.type} size={52} animated />
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{sp.name}</div>
                    <div className="mt-1">{badge(ASSETS_MANIFEST.specials[sp.type])}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 5 Obstacles */}
          <section>
            <h3 className="text-xs font-medium text-starlight-200 mb-2.5">障碍物与收集物</h3>
            <div className="grid grid-cols-3 gap-2.5">
              {OBSTACLES.map((ob) => (
                <div
                  key={ob.type}
                  className="board-cell-glass rounded-2xl p-2.5 flex flex-col items-center gap-1"
                >
                  <TileCanvasPreview color="rose" obstacle={ob.type} size={48} />
                  <span className="text-xs font-medium">{ob.name}</span>
                  <span className="text-[10px] text-starlight-300/75">{ob.desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 4 Props */}
          <section>
            <h3 className="text-xs font-medium text-starlight-200 mb-2.5">底部舒适区道具图标</h3>
            <div className="grid grid-cols-4 gap-2">
              {PROPS.map((p) => (
                <div
                  key={p.type}
                  className="board-cell-glass rounded-2xl py-2.5 px-1 flex flex-col items-center gap-1"
                >
                  <PropIconArt prop={p.type} size={30} />
                  <span className="text-[11px]">{p.name}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 3 Fox Moods */}
          <section>
            <h3 className="text-xs font-medium text-starlight-200 mb-2.5">陪伴宠物「小花狐」三态</h3>
            <div className="grid grid-cols-3 gap-2.5">
              {FOX_MOODS.map((f) => (
                <div
                  key={f.mood}
                  className="board-cell-glass rounded-2xl p-2 flex flex-col items-center gap-1"
                >
                  <FlowerFoxMascot mood={f.mood} size={64} />
                  <span className="text-[11px]">{f.name}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
