export type TileColor = 'rose' | 'sun' | 'cyan' | 'violet' | 'coral' | 'emerald';

export type SpecialType = 'none' | 'line_h' | 'line_v' | 'bomb' | 'butterfly';

export type ObstacleType = 'ice_1' | 'ice_2' | 'vine' | 'drop_item' | 'honey';

export type PropType = 'hammer' | 'swap' | 'shuffle' | 'undo';

export type FoxMood = 'idle' | 'cheer' | 'yawn';

export type ThemeMode = 'day' | 'night';

export type LevelTag = 'normal' | 'tutorial' | 'challenge' | 'relief';

export interface LevelGoal {
  type: 'score' | 'tile' | 'ice' | 'vine' | 'drop_item' | 'honey';
  color?: TileColor;
  target: number;
  label: string;
}

export interface ChapterConfig {
  id: number;
  name: string;
  subtitle: string;
  levelRange: [number, number];
  accentFrom: string;
  accentTo: string;
  glowColor: string;
  postcardId: number;
}

export interface LevelConfig {
  id: number;
  chapterId: number;
  name: string;
  tag: LevelTag;
  rows: number;
  cols: number;
  colors: TileColor[];
  moves: number;
  starThresholds: [number, number, number];
  goals: LevelGoal[];
  obstacles: ObstacleType[];
  /** 1 = playable cell, 0 = cutout hole (filled in Phase 3 for all 50 levels) */
  mask?: number[][];
  description: string;
}

export interface LevelProgressRecord {
  stars: number;
  bestScore: number;
  cleared: boolean;
  consecutiveFails: number;
}

export interface UserSettings {
  theme: ThemeMode;
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  vibrateEnabled: boolean;
  hasSeenWelcome: boolean;
}

export interface PlayerSaveData {
  highestUnlockedLevel: number;
  levels: Record<number, LevelProgressRecord>;
  unlockedPostcards: number[];
  totalPlaySeconds: number;
  settings: UserSettings;
}
