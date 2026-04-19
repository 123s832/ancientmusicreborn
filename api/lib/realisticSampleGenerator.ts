import { CompositionPlan, makeLocalPlan } from './aiPlan.js'

// 真实的乐器音频文件信息
// 由于我们不知道每个M4A文件内部的具体内容，采用更保守的策略：
// 1. 将整个M4A作为该乐器的"音色样本"
// 2. 不尝试从中截取特定音符（因为我们不知道里面有什么）
// 3. 使用时直接播放，或者通过音高变换生成不同音高

export const INSTRUMENT_AUDIO_FILES: Record<string, {
  file: string
  name: string
  estimatedDuration: number // 估计时长（秒）
  baseNote: string // 估计的基准音
  baseFrequency: number
  category: 'plucked' | 'bowed' | 'percussion' | 'wind' | 'bell'
}> = {
  pipa: {
    file: '琵琶.m4a',
    name: '琵琶',
    estimatedDuration: 30,
    baseNote: 'A4',
    baseFrequency: 440,
    category: 'plucked'
  },
  erhu: {
    file: '二胡.m4a',
    name: '二胡',
    estimatedDuration: 60,
    baseNote: 'D4',
    baseFrequency: 294,
    category: 'bowed'
  },
  bianzhong: {
    file: '编钟.m4a',
    name: '编钟',
    estimatedDuration: 300,
    baseNote: 'C3',
    baseFrequency: 131,
    category: 'bell'
  },
  xiao: {
    file: '箫.m4a',
    name: '箫',
    estimatedDuration: 120,
    baseNote: 'D5',
    baseFrequency: 587,
    category: 'wind'
  },
  di: {
    file: '笛.m4a',
    name: '笛子',
    estimatedDuration: 60,
    baseNote: 'G5',
    baseFrequency: 784,
    category: 'wind'
  },
  qin: {
    file: '古琴.m4a',
    name: '古琴',
    estimatedDuration: 120,
    baseNote: 'C3',
    baseFrequency: 131,
    category: 'plucked'
  },
  xun: {
    file: '埙.m4a',
    name: '埙',
    estimatedDuration: 60,
    baseNote: 'F4',
    baseFrequency: 349,
    category: 'wind'
  },
  sheng: {
    file: '笙.m4a',
    name: '笙',
    estimatedDuration: 120,
    baseNote: 'G4',
    baseFrequency: 392,
    category: 'wind'
  },
  gu: {
    file: '鼓.m4a',
    name: '鼓',
    estimatedDuration: 20,
    baseNote: 'C2',
    baseFrequency: 65,
    category: 'percussion'
  },
}

// 音高到频率的映射（十二平均律）
const NOTE_FREQUENCIES: Record<string, number> = {
  'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
  'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51,
}

// 计算音高变换的播放速率
// 为了避免过度变速导致音色失真，限制变换范围
export function calculatePlaybackRate(
  targetFrequency: number,
  baseFrequency: number,
  maxSemitones: number = 12 // 最大允许变换半音数
): number {
  // 计算半音差
  const semitones = 12 * Math.log2(targetFrequency / baseFrequency)
  
  // 限制变换范围
  const clampedSemitones = Math.max(-maxSemitones, Math.min(maxSemitones, semitones))
  
  // 计算播放速率
  return Math.pow(2, clampedSemitones / 12)
}

// 为音符分配乐器和音高
export function assignInstrumentsToNotes(
  notes: Array<{ t: number; d: number; hz: number; v?: number }>,
  availableInstruments: string[]
): Array<{
  t: number
  d: number
  hz: number
  v?: number
  instrumentId: string
  playbackRate: number
  useSample: boolean
}> {
  if (availableInstruments.length === 0) {
    // 没有可用乐器，返回原始音符
    return notes.map(n => ({
      ...n,
      instrumentId: 'qin',
      playbackRate: 1,
      useSample: false
    }))
  }

  return notes.map(note => {
    // 根据音高选择最合适的乐器
    let bestInstrument = availableInstruments[0]
    let bestPlaybackRate = 1
    let minDetune = Infinity

    for (const instId of availableInstruments) {
      const inst = INSTRUMENT_AUDIO_FILES[instId]
      if (!inst) continue

      const playbackRate = calculatePlaybackRate(note.hz, inst.baseFrequency)
      const semitones = 12 * Math.log2(playbackRate)
      const detune = Math.abs(semitones)

      // 优先选择需要变换较少的乐器
      if (detune < minDetune) {
        minDetune = detune
        bestInstrument = instId
        bestPlaybackRate = playbackRate
      }
    }

    // 如果变换太大，就不使用采样，改用合成
    const useSample = minDetune <= 12

    return {
      ...note,
      instrumentId: bestInstrument,
      playbackRate: bestPlaybackRate,
      useSample
    }
  })
}

// 生成基于真实采样的编曲计划
export function makeRealisticSamplePlan(args: {
  instruments: string[]
  style: string
  durationSec: number
}): CompositionPlan & {
  useRealSamples: boolean
  sampleMapping: Record<string, string>
  sampleInfo: Record<string, typeof INSTRUMENT_AUDIO_FILES[string]>
} {
  const { instruments, style, durationSec } = args

  // 过滤出有音频文件的乐器
  const availableInstruments = instruments.filter(id => INSTRUMENT_AUDIO_FILES[id])
  const useRealSamples = availableInstruments.length > 0

  // 创建采样映射
  const sampleMapping: Record<string, string> = {}
  const sampleInfo: Record<string, typeof INSTRUMENT_AUDIO_FILES[string]> = {}
  
  availableInstruments.forEach(id => {
    sampleMapping[id] = `/${INSTRUMENT_AUDIO_FILES[id].file}`
    sampleInfo[id] = INSTRUMENT_AUDIO_FILES[id]
  })

  // 使用原有的生成逻辑生成基础计划
  const basePlan = makeLocalPlan({
    instruments: availableInstruments.length > 0 ? availableInstruments : ['qin'],
    style,
    durationSec
  })

  // 为每个音轨的音符添加采样信息
  const enrichedTracks = basePlan.tracks.map(track => {
    const instId = track.instrumentId
    const inst = INSTRUMENT_AUDIO_FILES[instId]
    
    if (!inst) return track

    const enrichedNotes = track.notes.map(note => {
      const playbackRate = calculatePlaybackRate(note.hz, inst.baseFrequency)
      const semitones = 12 * Math.log2(playbackRate)
      const useSample = Math.abs(semitones) <= 12

      return {
        ...note,
        sample: useSample ? {
          audioUrl: `/${inst.file}`,
          baseFrequency: inst.baseFrequency,
          playbackRate,
          // 根据播放速率调整时长（变速会改变时长）
          originalDuration: note.d,
          adjustedDuration: note.d / playbackRate
        } : undefined
      }
    })

    return {
      ...track,
      notes: enrichedNotes
    }
  })

  return {
    ...basePlan,
    tracks: enrichedTracks,
    useRealSamples,
    sampleMapping,
    sampleInfo
  }
}

// 获取音频文件信息
export function getAudioFileInfo(instrumentId: string): typeof INSTRUMENT_AUDIO_FILES[string] | null {
  return INSTRUMENT_AUDIO_FILES[instrumentId] || null
}

// 列出所有可用的乐器采样
export function listAvailableSamples(): string[] {
  return Object.keys(INSTRUMENT_AUDIO_FILES)
}
