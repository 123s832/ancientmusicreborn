import { CompositionPlan, makeLocalPlan } from './aiPlan.js'

// 乐器音频文件信息
export const INSTRUMENT_AUDIO_FILES: Record<string, {
  file: string
  name: string
  sizeKB: number
  useMode: 'texture' | 'percussion' | 'reference' | 'none'
  description: string
}> = {
  pipa: {
    file: '琵琶.m4a',
    name: '琵琶',
    sizeKB: 1008,
    useMode: 'texture',
    description: '可作为弹拨乐器的纹理层'
  },
  erhu: {
    file: '二胡.m4a',
    name: '二胡',
    sizeKB: 7202,
    useMode: 'texture',
    description: '可作为弦乐的背景纹理'
  },
  bianzhong: {
    file: '编钟.m4a',
    name: '编钟',
    sizeKB: 65925,
    useMode: 'texture',
    description: '大型编钟录音，适合作为钟声氛围'
  },
  xiao: {
    file: '箫.m4a',
    name: '箫',
    sizeKB: 6022,
    useMode: 'texture',
    description: '箫的声音纹理'
  },
  di: {
    file: '笛.m4a',
    name: '笛子',
    sizeKB: 2175,
    useMode: 'texture',
    description: '笛子的声音纹理'
  },
  qin: {
    file: '古琴.m4a',
    name: '古琴',
    sizeKB: 4903,
    useMode: 'texture',
    description: '古琴的声音纹理'
  },
  xun: {
    file: '埙.m4a',
    name: '埙',
    sizeKB: 2264,
    useMode: 'texture',
    description: '埙的声音纹理'
  },
  sheng: {
    file: '笙.m4a',
    name: '笙',
    sizeKB: 7122,
    useMode: 'texture',
    description: '笙的声音纹理'
  },
  gu: {
    file: '鼓.m4a',
    name: '鼓',
    sizeKB: 888,
    useMode: 'percussion',
    description: '鼓点采样，可尝试提取打击点'
  },
}

// 生成混合模式的编曲计划
export function makeHybridPlan(args: {
  instruments: string[]
  style: string
  durationSec: number
}): CompositionPlan & {
  useRealAudio: boolean
  audioLayers: Array<{
    instrumentId: string
    audioUrl: string
    volume: number
    useMode: string
  }>
  synthesisTracks: CompositionPlan['tracks']
} {
  const { instruments, style, durationSec } = args

  // 检查哪些乐器有音频文件
  const availableAudio = instruments.filter(id => INSTRUMENT_AUDIO_FILES[id])

  // 生成基础合成音轨（使用 Web Audio API 合成）
  const basePlan = makeLocalPlan({
    instruments: instruments.length > 0 ? instruments : ['qin'],
    style,
    durationSec
  })

  // 创建音频层配置
  const audioLayers = availableAudio.map((id, index) => {
    const info = INSTRUMENT_AUDIO_FILES[id]
    // 根据文件大小调整音量 - 大文件作为背景，小文件可以更突出
    const volume = info.sizeKB > 5000 ? 0.15 : 0.25

    return {
      instrumentId: id,
      audioUrl: `/${info.file}`,
      volume: volume * (1 - index * 0.1), // 多个音频时递减音量
      useMode: info.useMode
    }
  })

  return {
    ...basePlan,
    useRealAudio: availableAudio.length > 0,
    audioLayers,
    synthesisTracks: basePlan.tracks
  }
}

// 获取音频使用建议
export function getAudioUsageAdvice(instrumentId: string): string {
  const info = INSTRUMENT_AUDIO_FILES[instrumentId]
  if (!info) return '无可用音频'

  switch (info.useMode) {
    case 'texture':
      return `${info.name}: 建议作为背景纹理层使用，音量 ${info.sizeKB > 5000 ? '15%' : '25%'}`
    case 'percussion':
      return `${info.name}: 可尝试提取打击点作为节奏层`
    case 'reference':
      return `${info.name}: 仅作为音色参考`
    default:
      return `${info.name}: 不建议使用`
  }
}

// 列出可用的音频
export function listAvailableAudio(): Array<{ id: string; name: string; mode: string }> {
  return Object.entries(INSTRUMENT_AUDIO_FILES).map(([id, info]) => ({
    id,
    name: info.name,
    mode: info.useMode
  }))
}
