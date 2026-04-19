export interface Hotspot {
  id: string;
  name: string;
  x: number; // percentage
  y: number; // percentage
  radius: number; // percentage
  hz: number;
}

export interface Instrument {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  hotspots: Hotspot[];
}

const IMAGES: Record<string, string> = {
  pipa: new URL('../assets/instruments/pipa.svg', import.meta.url).toString(),
  erhu: new URL('../assets/instruments/erhu.svg', import.meta.url).toString(),
  bianzhong: new URL('../assets/instruments/bianzhong.svg', import.meta.url).toString(),
  xiao: new URL('../assets/instruments/xiao.svg', import.meta.url).toString(),
  di: new URL('../assets/instruments/di.svg', import.meta.url).toString(),
  se: new URL('../assets/instruments/se.svg', import.meta.url).toString(),
  qin: new URL('../assets/instruments/qin.svg', import.meta.url).toString(),
  xun: new URL('../assets/instruments/xun.svg', import.meta.url).toString(),
  sheng: new URL('../assets/instruments/sheng.svg', import.meta.url).toString(),
  gu: new URL('../assets/instruments/gu.svg', import.meta.url).toString(),
}

export const INSTRUMENTS: Instrument[] = [
  {
    id: 'pipa',
    name: '琵琶',
    description: '中国传统拨弦乐器，已有两千多年历史，音色明亮多变。',
    imageUrl: IMAGES.pipa,
    hotspots: [
      { id: 'pipa-1', name: '弦 1', x: 50, y: 30, radius: 4, hz: 880 },
      { id: 'pipa-2', name: '弦 2', x: 50, y: 38, radius: 4, hz: 784 },
      { id: 'pipa-3', name: '弦 3', x: 50, y: 46, radius: 4, hz: 659 },
      { id: 'pipa-4', name: '弦 4', x: 50, y: 54, radius: 4, hz: 587 },
      { id: 'pipa-5', name: '弦 5', x: 50, y: 62, radius: 4, hz: 523 },
      { id: 'pipa-6', name: '弦 6', x: 50, y: 70, radius: 4, hz: 440 },
      { id: 'pipa-7', name: '面板·上', x: 44, y: 50, radius: 5, hz: 494 },
      { id: 'pipa-8', name: '面板·下', x: 56, y: 64, radius: 5, hz: 392 },
    ]
  },
  {
    id: 'erhu',
    name: '二胡',
    description: '中国传统拉弦乐器，音色婉转哀怨，极具表现力。',
    imageUrl: IMAGES.erhu,
    hotspots: [
      { id: 'erhu-1', name: '弦·上', x: 50, y: 18, radius: 4.5, hz: 784 },
      { id: 'erhu-2', name: '弦·中', x: 50, y: 30, radius: 4.5, hz: 659 },
      { id: 'erhu-3', name: '弦·下', x: 50, y: 42, radius: 4.5, hz: 523 },
      { id: 'erhu-4', name: '弓弦区', x: 50, y: 50, radius: 5, hz: 440 },
      { id: 'erhu-5', name: '琴筒·上', x: 50, y: 74, radius: 6, hz: 392 },
      { id: 'erhu-6', name: '琴筒·下', x: 50, y: 84, radius: 6, hz: 330 },
    ]
  },
  {
    id: 'bianzhong',
    name: '编钟',
    description: '中国古代大型打击乐器，由大小不同的青铜钟编排而成，声音宏亮。',
    imageUrl: IMAGES.bianzhong,
    hotspots: [
      { id: 'bz-1a', name: '钟 1·正音', x: 34, y: 34, radius: 6, hz: 196 },
      { id: 'bz-1b', name: '钟 1·偏音', x: 34, y: 52, radius: 6, hz: 220 },
      { id: 'bz-2a', name: '钟 2·正音', x: 45, y: 36, radius: 5.5, hz: 247 },
      { id: 'bz-2b', name: '钟 2·偏音', x: 45, y: 54, radius: 5.5, hz: 277 },
      { id: 'bz-3a', name: '钟 3·正音', x: 56, y: 38, radius: 5, hz: 294 },
      { id: 'bz-3b', name: '钟 3·偏音', x: 56, y: 56, radius: 5, hz: 330 },
      { id: 'bz-4a', name: '钟 4·正音', x: 66, y: 40, radius: 4.8, hz: 349 },
      { id: 'bz-4b', name: '钟 4·偏音', x: 66, y: 58, radius: 4.8, hz: 392 },
    ]
  },
  {
    id: 'xiao',
    name: '箫',
    description: '中国传统竹管乐器，音色清幽悠远。',
    imageUrl: IMAGES.xiao,
    hotspots: [
      { id: 'xiao-1', name: '孔 1', x: 50, y: 33, radius: 5, hz: 784 },
      { id: 'xiao-2', name: '孔 2', x: 50, y: 42, radius: 5, hz: 698 },
      { id: 'xiao-3', name: '孔 3', x: 50, y: 51, radius: 5, hz: 659 },
      { id: 'xiao-4', name: '孔 4', x: 50, y: 60, radius: 5, hz: 587 },
      { id: 'xiao-5', name: '孔 5', x: 50, y: 69, radius: 5, hz: 523 },
      { id: 'xiao-6', name: '孔 6', x: 50, y: 78, radius: 5, hz: 440 },
    ],
  },
  {
    id: 'di',
    name: '笛',
    description: '中国传统横吹竹笛，音色明亮清脆。',
    imageUrl: IMAGES.di,
    hotspots: [
      { id: 'di-1', name: '孔 1', x: 33, y: 50, radius: 5, hz: 784 },
      { id: 'di-2', name: '孔 2', x: 42, y: 50, radius: 5, hz: 698 },
      { id: 'di-3', name: '孔 3', x: 50, y: 50, radius: 5, hz: 659 },
      { id: 'di-4', name: '孔 4', x: 58, y: 50, radius: 5, hz: 587 },
      { id: 'di-5', name: '孔 5', x: 67, y: 50, radius: 5, hz: 523 },
      { id: 'di-6', name: '孔 6', x: 75, y: 50, radius: 5, hz: 440 },
    ],
  },
  {
    id: 'se',
    name: '瑟',
    description: '中国古代大型拨弦乐器，音色浑厚雅致。',
    imageUrl: IMAGES.se,
    hotspots: [
      { id: 'se-1', name: '弦 1', x: 26, y: 44, radius: 4.8, hz: 784 },
      { id: 'se-2', name: '弦 2', x: 34, y: 48, radius: 4.8, hz: 698 },
      { id: 'se-3', name: '弦 3', x: 42, y: 52, radius: 4.8, hz: 659 },
      { id: 'se-4', name: '弦 4', x: 50, y: 56, radius: 4.8, hz: 587 },
      { id: 'se-5', name: '弦 5', x: 58, y: 60, radius: 4.8, hz: 523 },
      { id: 'se-6', name: '弦 6', x: 66, y: 64, radius: 4.8, hz: 494 },
      { id: 'se-7', name: '弦 7', x: 74, y: 68, radius: 4.8, hz: 440 },
    ],
  },
  {
    id: 'qin',
    name: '琴',
    description: '古琴，七弦弹拨乐器，气韵深远，讲究意境。',
    imageUrl: IMAGES.qin,
    hotspots: [
      { id: 'qin-1', name: '弦 1', x: 32, y: 42, radius: 4.5, hz: 784 },
      { id: 'qin-2', name: '弦 2', x: 40, y: 44, radius: 4.5, hz: 698 },
      { id: 'qin-3', name: '弦 3', x: 48, y: 46, radius: 4.5, hz: 659 },
      { id: 'qin-4', name: '弦 4', x: 56, y: 48, radius: 4.5, hz: 587 },
      { id: 'qin-5', name: '弦 5', x: 64, y: 50, radius: 4.5, hz: 523 },
      { id: 'qin-6', name: '弦 6', x: 72, y: 52, radius: 4.5, hz: 494 },
      { id: 'qin-7', name: '弦 7', x: 80, y: 54, radius: 4.5, hz: 440 },
    ],
  },
  {
    id: 'xun',
    name: '埙',
    description: '陶制吹奏乐器，音色古朴沉稳。',
    imageUrl: IMAGES.xun,
    hotspots: [
      { id: 'xun-1', name: '吹孔', x: 50, y: 30, radius: 6, hz: 587 },
      { id: 'xun-2', name: '孔 1', x: 41, y: 42, radius: 5.2, hz: 523 },
      { id: 'xun-3', name: '孔 2', x: 59, y: 42, radius: 5.2, hz: 494 },
      { id: 'xun-4', name: '孔 3', x: 46, y: 54, radius: 5.2, hz: 440 },
      { id: 'xun-5', name: '孔 4', x: 54, y: 54, radius: 5.2, hz: 392 },
      { id: 'xun-6', name: '孔 5', x: 50, y: 64, radius: 5.6, hz: 349 },
    ],
  },
  {
    id: 'sheng',
    name: '笙',
    description: '多管簧管乐器，音色清亮和谐，善于和声。',
    imageUrl: IMAGES.sheng,
    hotspots: [
      { id: 'sheng-1', name: '管 1', x: 30, y: 26, radius: 5.2, hz: 784 },
      { id: 'sheng-2', name: '管 2', x: 38, y: 22, radius: 5.2, hz: 698 },
      { id: 'sheng-3', name: '管 3', x: 46, y: 18, radius: 5.2, hz: 659 },
      { id: 'sheng-4', name: '管 4', x: 54, y: 18, radius: 5.2, hz: 587 },
      { id: 'sheng-5', name: '管 5', x: 62, y: 22, radius: 5.2, hz: 523 },
      { id: 'sheng-6', name: '管 6', x: 70, y: 26, radius: 5.2, hz: 494 },
      { id: 'sheng-7', name: '簧座·左', x: 46, y: 68, radius: 6, hz: 440 },
      { id: 'sheng-8', name: '簧座·右', x: 54, y: 68, radius: 6, hz: 392 },
    ],
  },
  {
    id: 'gu',
    name: '鼓',
    description: '中国传统打击乐器，节奏强烈，常用于礼乐与戏曲。',
    imageUrl: IMAGES.gu,
    hotspots: [
      { id: 'gu-1', name: '鼓心', x: 50, y: 39, radius: 7, hz: 196 },
      { id: 'gu-2', name: '鼓面·左', x: 40, y: 40, radius: 6.5, hz: 220 },
      { id: 'gu-3', name: '鼓面·右', x: 60, y: 40, radius: 6.5, hz: 247 },
      { id: 'gu-4', name: '鼓面·下', x: 50, y: 48, radius: 6.5, hz: 175 },
      { id: 'gu-5', name: '鼓边', x: 74, y: 39, radius: 6.5, hz: 262 },
    ],
  },
];
