import { ChapterConfig, LevelConfig, LevelGoal, LevelTag, ObstacleType, TileColor } from '../types/game';

export const CHAPTERS: ChapterConfig[] = [
  {
    id: 1,
    name: '晨露花谷',
    subtitle: '初遇星光，四色繁花轻舞',
    levelRange: [1, 10],
    accentFrom: '#ff85c0',
    accentTo: '#b37feb',
    glowColor: 'rgba(255, 133, 192, 0.45)',
    postcardId: 1,
  },
  {
    id: 2,
    name: '琉璃星河',
    subtitle: '薄霜微凝，星流蝶影初现',
    levelRange: [11, 20],
    accentFrom: '#5cdbd3',
    accentTo: '#b37feb',
    glowColor: 'rgba(92, 219, 211, 0.45)',
    postcardId: 2,
  },
  {
    id: 3,
    name: '月光藤境',
    subtitle: '月藤缠枝，轻拾星露晶瓶',
    levelRange: [21, 30],
    accentFrom: '#73d13d',
    accentTo: '#5cdbd3',
    glowColor: 'rgba(115, 209, 61, 0.42)',
    postcardId: 3,
  },
  {
    id: 4,
    name: '蜜语星原',
    subtitle: '星蜜漫野，繁花流光协奏',
    levelRange: [31, 40],
    accentFrom: '#ffd666',
    accentTo: '#ff85c0',
    glowColor: 'rgba(255, 214, 102, 0.45)',
    postcardId: 4,
  },
  {
    id: 5,
    name: '琼华苍穹',
    subtitle: '群星共鸣，星海终章绽放',
    levelRange: [41, 50],
    accentFrom: '#ffd666',
    accentTo: '#b37feb',
    glowColor: 'rgba(179, 127, 235, 0.5)',
    postcardId: 5,
  },
];

const FOUR_COLORS: TileColor[] = ['rose', 'sun', 'cyan', 'violet'];
const FIVE_COLORS: TileColor[] = ['rose', 'sun', 'cyan', 'violet', 'coral'];
const SIX_COLORS: TileColor[] = ['rose', 'sun', 'cyan', 'violet', 'coral', 'emerald'];

const LEVEL_POETIC_TITLES: string[] = [
  '初见花海', '星露微光', '流光初现', '花爆星核', '晨谷试炼',
  '薄霜轻覆', '幽谷镂星', '双花映月', '寒霜渐融', '花谷终章',
  '星河解压', '琉璃初醒', '银波微澜', '霜翼轻舞', '星河小考',
  '厚冰晶镜', '月藤初绕', '冰藤交错', '寒星破晓', '琉璃终章',
  '林间解压', '星露初降', '青藤秘语', '晶瓶渡河', '藤境小考',
  '双冰护露', '月影穿林', '繁藤星瀑', '露满银阶', '藤境终章',
  '星原解压', '蜜语初甜', '金蜜微漫', '霜蜜共舞', '星原小考',
  '六色流华', '蜜藤迷阵', '星露甜原', '流光破蜜', '星原终章',
  '苍穹解压', '星辉云阶', '冰藤星露', '繁花共鸣', '苍穹试炼',
  '极光织梦', '琉璃万象', '星海交响', '黎明前夜', '琼华星海',
];

function buildLevel(id: number): LevelConfig {
  const chapterId = Math.ceil(id / 10);
  const isChallenge = id % 5 === 0;
  const isRelief = id === 11 || id === 21 || id === 31 || id === 41;
  const isTutorial = id <= 5;

  let tag: LevelTag = 'normal';
  if (isRelief) tag = 'relief';
  else if (isChallenge) tag = 'challenge';
  else if (isTutorial) tag = 'tutorial';

  let colors: TileColor[];
  if (id <= 5 || isRelief) {
    colors = FOUR_COLORS;
  } else if (id <= 35) {
    colors = FIVE_COLORS;
  } else {
    colors = id % 2 === 0 || isChallenge ? SIX_COLORS : FIVE_COLORS;
  }

  const obstacles: ObstacleType[] = [];
  const goals: LevelGoal[] = [];

  if (id <= 5) {
    goals.push({
      type: 'tile',
      color: FOUR_COLORS[(id - 1) % 4],
      target: 14 + id * 3,
      label: '收集发光花朵',
    });
  } else if (id <= 15) {
    if (!isRelief) {
      obstacles.push('ice_1');
      goals.push({ type: 'ice', target: 8 + (id - 5) * 2, label: '融化薄霜' });
    } else {
      goals.push({ type: 'score', target: 4500, label: '畅享高连击得分' });
    }
  } else if (id <= 30) {
    if (isRelief) {
      goals.push({ type: 'score', target: 6000, label: '四色连击狂欢' });
    } else {
      if (id >= 16) obstacles.push('ice_2');
      if (id >= 17) obstacles.push('vine');
      if (id >= 22) obstacles.push('drop_item');

      if (obstacles.includes('drop_item')) {
        goals.push({ type: 'drop_item', target: isChallenge ? 4 : 2 + (id % 2), label: '收集星露瓶' });
      }
      if (obstacles.includes('vine')) {
        goals.push({ type: 'vine', target: 6 + (id % 5) * 2, label: '解救月光藤蔓' });
      } else {
        goals.push({ type: 'ice', target: 14 + (id % 6) * 2, label: '击碎厚冰' });
      }
    }
  } else {
    if (isRelief) {
      goals.push({ type: 'score', target: 8000, label: '四色解压福利' });
    } else {
      obstacles.push('honey');
      if (id >= 34) obstacles.push('ice_2');
      if (id >= 37) obstacles.push('vine');
      if (id >= 38 && id % 2 === 0) obstacles.push('drop_item');

      goals.push({ type: 'honey', target: 10 + (id % 6) * 2, label: '清除蔓延星蜜' });
      if (obstacles.includes('drop_item')) {
        goals.push({ type: 'drop_item', target: isChallenge ? 4 : 3, label: '收集星露瓶' });
      } else if (obstacles.includes('vine')) {
        goals.push({ type: 'vine', target: 8 + (id % 4) * 2, label: '解救月光藤蔓' });
      }
    }
  }

  const baseMoves = isRelief ? 26 : isChallenge ? 24 : Math.max(20, 25 - Math.floor(id / 18));
  const baseScore = 2400 + id * 220;

  let description = '轻划指尖，让星光花朵连成璀璨弧线。';
  if (isTutorial) {
    description = '四色花海轻松上手，试试凑出 4 连星流花与 5 连琉璃蝶吧！';
  } else if (isRelief) {
    description = '专属四色解压福利关！极易触发连续星爆与夸夸连击~';
  } else if (isChallenge) {
    description = '章节小挑战关：巧用双特效组合，一举点亮整片星海！';
  } else if (obstacles.includes('honey')) {
    description = '注意每回合消除星蜜，防止它们向四周温柔蔓延。';
  } else if (obstacles.includes('drop_item')) {
    description = '引导星露瓶顺着花海滑落至棋盘底部出口即可收集。';
  } else if (obstacles.includes('vine')) {
    description = '通过匹配被月光藤蔓锁住的花朵，将它们轻柔解救出来。';
  } else if (obstacles.includes('ice_1') || obstacles.includes('ice_2')) {
    description = '在冰霜上消除花朵，用星光温度融化层层晶霜。';
  }

  return {
    id,
    chapterId,
    name: LEVEL_POETIC_TITLES[id - 1] ?? `星海第 ${id} 关`,
    tag,
    rows: id <= 3 ? 7 : id <= 12 ? 8 : 9,
    cols: id <= 3 ? 7 : id <= 12 ? 8 : 9,
    colors,
    moves: baseMoves,
    starThresholds: [baseScore, Math.round(baseScore * 1.55), Math.round(baseScore * 2.2)],
    goals,
    obstacles,
    description,
  };
}

export const LEVELS: LevelConfig[] = Array.from({ length: 50 }, (_, idx) => buildLevel(idx + 1));

export function getLevelConfig(levelId: number): LevelConfig {
  return LEVELS[Math.min(Math.max(1, levelId), LEVELS.length) - 1];
}

export function getChapterForLevel(levelId: number): ChapterConfig {
  const chapterId = Math.ceil(levelId / 10);
  return CHAPTERS[Math.min(Math.max(1, chapterId), CHAPTERS.length) - 1];
}
