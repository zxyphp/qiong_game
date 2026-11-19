# 基础棋子与特效图标目录

放入以下同名 PNG/WebP 图片后，`src/config/assetsManifest.ts` 会自动优先加载，未放入时自动启用 Canvas 2D 矢量发光花朵降级渲染：

## 6 张基础花朵（必配核心图）
- `tile_rose.png` — 琼樱粉花（玫瑰粉）
- `tile_sun.png` — 晨曦金花（暖星金）
- `tile_cyan.png` — 碧落青莲（星海青）
- `tile_violet.png` — 紫藤幻花（星云紫）
- `tile_coral.png` — 珊瑚绯花（霞光红）
- `tile_emerald.png` — 翠羽灵叶（翡翠绿）

## 可选独立特效图
- `special_butterfly.png` — 星穹琉璃蝶（5 连魔力鸟，未放入时自动矢量绘制）

> 注：4 连星流花（横/竖）与 T/L 5 连花爆星核均直接在 6 张基础花朵图片之上由 Canvas 2D 动态叠加旋转星环、流光光带与呼吸星芒，无需单独准备底图。
