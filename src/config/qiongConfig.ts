/**
 * 给“琼”的专属人文关怀配置文件
 * 开发者可随时在此修改欢迎语、夸夸词库、明信片祝福语、现实兑换券与护眼提醒文案。
 */

export interface PostcardConfig {
  id: number;
  unlockLevel: number;
  chapterName: string;
  title: string;
  subtitle: string;
  dateLabel: string;
  blessing: string;
  voucherTitle: string;
  voucherDetail: string;
  palette: [string, string, string];
}

export const QIONG_CONFIG = {
  playerName: '琼',
  gameTitle: '琼华星海',
  gameSubtitle: '星光落满花海，每一朵都为你绽放',

  /** 首次进入的专属欢迎语 */
  welcomeMessage: {
    title: '欢迎来到琼华星海',
    body: '琼，这里是专属于你的星光花海。没有体力限制，也没有广告打扰，随时来摘一束发光的花吧。',
    buttonText: '收下星光，出发',
  },

  /** 连击（Combo ≥ 2）随机掉落的夸夸语录 */
  comboPraises: [
    '琼好厉害！星海都在为你鼓掌 ✨',
    '哇哦，这波连击像流星雨一样漂亮！',
    '不愧是琼，眼光又准又温柔 🌸',
    '星光倾泻而出，太解压啦！',
    '绝妙一击！小花狐开心得转圈圈啦 🦊',
    '繁花连绽，今天也是闪闪发光的琼！',
    '这一步走得太灵巧了，满分星光！',
    '花海为你点亮，继续保持这份好心情~',
  ],

  /** 夜间（22:00 ~ 06:00）护眼模式提示 */
  nightCarePrompt: {
    text: '夜深啦，要切换星夜护眼模式吗？',
    confirmText: '切换星夜模式',
    dismissText: '保持当前',
  },

  /** 连续游玩满 30 分钟的温柔提醒（仅结算界面由小花狐打哈欠触发，不强制锁屏） */
  playtimeReminder: {
    thresholdMinutes: 30,
    message: '琼，已经玩了半小时啦，闭眼放松一下、喝口温水再继续吧~',
    buttonText: '好呀，我知道啦',
  },

  /** 动态怜悯机制：步数耗尽时小花狐递花应援文案 */
  pityCheer: {
    title: '小花狐为你递来一束星光花',
    message: '差一点点就成功啦！收下这份专属应援，免费续 5 步继续绽放吧~',
    buttonText: '专属应援：免费续 5 步',
    extraMoves: 5,
  },

  /** 每通 10 关解锁一张的星海纪念明信片（支持翻转查看背面祝福与现实兑换券） */
  postcards: [
    {
      id: 1,
      unlockLevel: 10,
      chapterName: '第一章 · 晨露花谷',
      title: '晨露初绽之约',
      subtitle: '星光与朝露落满山谷的清晨',
      dateLabel: '星海纪事 · 拾',
      blessing: '亲爱的琼：愿你每一个清晨都像这片晨露花谷一样清新舒展，所有小烦恼都会在三消的叮咚声里轻轻化开。',
      voucherTitle: '现实兑换券 · 暖心奶茶/咖啡',
      voucherDetail: '凭此明信片可随时兑换「任意想喝的奶茶或咖啡一杯」，全糖半糖冰热随你挑~',
      palette: ['#ff85c0', '#b37feb', '#1d1246'],
    },
    {
      id: 2,
      unlockLevel: 20,
      chapterName: '第二章 · 琉璃星河',
      title: '琉璃蝶舞星河',
      subtitle: '五彩琉璃蝶掠过静谧的银河',
      dateLabel: '星海纪事 · 贰拾',
      blessing: '亲爱的琼：穿过二十重星光，你已经点亮了整条琉璃星河。无论世界多喧嚣，这里永远有为你留着的一片安静夜空。',
      voucherTitle: '现实兑换券 · 专属肩颈放松',
      voucherDetail: '凭此明信片可随时兑换「15 分钟专属温柔按摩 / 放空休息权一次」，即刻生效！',
      palette: ['#5cdbd3', '#722ed1', '#121038'],
    },
    {
      id: 3,
      unlockLevel: 30,
      chapterName: '第三章 · 月光藤境',
      title: '月下青藤与星露',
      subtitle: '银白月色里悄悄盛开的林间秘境',
      dateLabel: '星海纪事 · 叁拾',
      blessing: '亲爱的琼：解开月光藤蔓、收集满满的星露瓶，你总是这么细心又从容。愿你生活里也有源源不断的小确幸落进掌心。',
      voucherTitle: '现实兑换券 · 想吃的一顿大餐',
      voucherDetail: '凭此明信片可指定任意一家心仪餐厅或外卖，由我全权负责点单与陪伴~',
      palette: ['#73d13d', '#5cdbd3', '#13243b'],
    },
    {
      id: 4,
      unlockLevel: 40,
      chapterName: '第四章 · 蜜语星原',
      title: '星蜜甜梦原野',
      subtitle: '金色星蜜与晚风交织的温柔原野',
      dateLabel: '星海纪事 · 肆拾',
      blessing: '亲爱的琼：走过四十关的星原，连晚风都带着淡淡的甜味。谢谢你一路点亮这些花朵，也谢谢你点亮我的日常。',
      voucherTitle: '现实兑换券 · 浪漫电影/散步之夜',
      voucherDetail: '凭此明信片可随时兑换「任选电影一场 + 宵夜小甜品」或「无目的地牵手夜游」。',
      palette: ['#ffd666', '#ff85c0', '#2b1640'],
    },
    {
      id: 5,
      unlockLevel: 50,
      chapterName: '第五章 · 琼华苍穹',
      title: '琼华星海 · 永恒花冠',
      subtitle: '群星与万千繁花共同加冕的穹顶',
      dateLabel: '星海纪事 · 伍拾',
      blessing: '亲爱的琼：恭喜通关全部五十重星海！但属于我们的花海永不落幕——只要你愿意，每一天都可以是新的璀璨星夜。',
      voucherTitle: '现实兑换券 · 终极心愿直通卡',
      voucherDetail: '凭此明信片可实现「一个你说了算的专属小愿望」，不设有效期，随时可兑！',
      palette: ['#ffd666', '#b37feb', '#1a0e3d'],
    },
  ] as PostcardConfig[],
} as const;
