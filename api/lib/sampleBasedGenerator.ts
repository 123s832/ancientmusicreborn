import { CompositionPlan, makeLocalPlan } from './aiPlan.js'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 乐器音频文件映射
export const INSTRUMENT_AUDIO_FILES: Record<string, { file: string; name: string }> = {
  pipa: { file: '琵琶.m4a', name: '琵琶' },
  erhu: { file: '二胡.m4a', name: '二胡' },
  bianzhong: { file: '编钟.m4a', name: '编钟' },
  xiao: { file: '箫.m4a', name: '箫' },
  di: { file: '笛.m4a', name: '笛子' },
  qin: { file: '古琴.m4a', name: '古琴' },
  xun: { file: '埙.m4a', name: '埙' },
  sheng: { file: '笙.m4a', name: '笙' },
  gu: { file: '鼓.m4a', name: '鼓' },
}

// 音频片段定义（模拟从M4A中提取的片段）
export interface AudioSegment {
  instrumentId: string
  startTime: number // 在源文件中的开始时间（秒）
  duration: number // 片段时长（秒）
  baseFrequency: number // 基准频率（Hz）
  note: string // 音符名称
}

// 为每个乐器定义可用的音频片段
export const INSTRUMENT_SEGMENTS: Record<string, AudioSegment[]> = {
  pipa: [
    { instrumentId: 'pipa', startTime: 0, duration: 1.5, baseFrequency: 440, note: 'A4' },
    { instrumentId: 'pipa', startTime: 1.5, duration: 1.5, baseFrequency: 494, note: 'B4' },
    { instrumentId: 'pipa', startTime: 3, duration: 1.5, baseFrequency: 554, note: 'C#5' },
    { instrumentId: 'pipa', startTime: 4.5, duration: 1.5, baseFrequency: 587, note: 'D5' },
    { instrumentId: 'pipa', startTime: 6, duration: 1.5, baseFrequency: 659, note: 'E5' },
    { instrumentId: 'pipa', startTime: 7.5, duration: 1.5, baseFrequency: 740, note: 'F#5' },
    { instrumentId: 'pipa', startTime: 9, duration: 1.5, baseFrequency: 831, note: 'G#5' },
    { instrumentId: 'pipa', startTime: 10.5, duration: 1.5, baseFrequency: 880, note: 'A5' },
  ],
  erhu: [
    { instrumentId: 'erhu', startTime: 0, duration: 2, baseFrequency: 294, note: 'D4' },
    { instrumentId: 'erhu', startTime: 2, duration: 2, baseFrequency: 330, note: 'E4' },
    { instrumentId: 'erhu', startTime: 4, duration: 2, baseFrequency: 370, note: 'F#4' },
    { instrumentId: 'erhu', startTime: 6, duration: 2, baseFrequency: 392, note: 'G4' },
    { instrumentId: 'erhu', startTime: 8, duration: 2, baseFrequency: 440, note: 'A4' },
    { instrumentId: 'erhu', startTime: 10, duration: 2, baseFrequency: 494, note: 'B4' },
  ],
  bianzhong: [
    { instrumentId: 'bianzhong', startTime: 0, duration: 3, baseFrequency: 131, note: 'C3' },
    { instrumentId: 'bianzhong', startTime: 3, duration: 3, baseFrequency: 147, note: 'D3' },
    { instrumentId: 'bianzhong', startTime: 6, duration: 3, baseFrequency: 165, note: 'E3' },
    { instrumentId: 'bianzhong', startTime: 9, duration: 3, baseFrequency: 196, note: 'G3' },
    { instrumentId: 'bianzhong', startTime: 12, duration: 3, baseFrequency: 220, note: 'A3' },
  ],
  xiao: [
    { instrumentId: 'xiao', startTime: 0, duration: 2, baseFrequency: 587, note: 'D5' },
    { instrumentId: 'xiao', startTime: 2, duration: 2, baseFrequency: 659, note: 'E5' },
    { instrumentId: 'xiao', startTime: 4, duration: 2, baseFrequency: 740, note: 'F#5' },
    { instrumentId: 'xiao', startTime: 6, duration: 2, baseFrequency: 784, note: 'G5' },
    { instrumentId: 'xiao', startTime: 8, duration: 2, baseFrequency: 880, note: 'A5' },
  ],
  di: [
    { instrumentId: 'di', startTime: 0, duration: 1.5, baseFrequency: 784, note: 'G5' },
    { instrumentId: 'di', startTime: 1.5, duration: 1.5, baseFrequency: 880, note: 'A5' },
    { instrumentId: 'di', startTime: 3, duration: 1.5, baseFrequency: 988, note: 'B5' },
    { instrumentId: 'di', startTime: 4.5, duration: 1.5, baseFrequency: 1047, note: 'C6' },
    { instrumentId: 'di', startTime: 6, duration: 1.5, baseFrequency: 1175, note: 'D6' },
  ],
  qin: [
    { instrumentId: 'qin', startTime: 0, duration: 3, baseFrequency: 131, note: 'C3' },
    { instrumentId: 'qin', startTime: 3, duration: 3, baseFrequency: 147, note: 'D3' },
    { instrumentId: 'qin', startTime: 6, duration: 3, baseFrequency: 165, note: 'E3' },
    { instrumentId: 'qin', startTime: 9, duration: 3, baseFrequency: 196, note: 'G3' },
    { instrumentId: 'qin', startTime: 12, duration: 3, baseFrequency: 220, note: 'A3' },
  ],
  xun: [
    { instrumentId: 'xun', startTime: 0, duration: 2.5, baseFrequency: 349, note: 'F4' },
    { instrumentId: 'xun', startTime: 2.5, duration: 2.5, baseFrequency: 392, note: 'G4' },
    { instrumentId: 'xun', startTime: 5, duration: 2.5, baseFrequency: 440, note: 'A4' },
    { instrumentId: 'xun', startTime: 7.5, duration: 2.5, baseFrequency: 523, note: 'C5' },
  ],
  sheng: [
    { instrumentId: 'sheng', startTime: 0, duration: 2, baseFrequency: 392, note: 'G4' },
    { instrumentId: 'sheng', startTime: 2, duration: 2, baseFrequency: 440, note: 'A4' },
    { instrumentId: 'sheng', startTime: 4, duration: 2, baseFrequency: 494, note: 'B4' },
    { instrumentId: 'sheng', startTime: 6, duration: 2, baseFrequency: 587, note: 'D5' },
    { instrumentId: 'sheng', startTime: 8, duration: 2, baseFrequency: 659, note: 'E5' },
  ],
  gu: [
    { instrumentId: 'gu', startTime: 0, duration: 0.5, baseFrequency: 60, note: 'Kick' },
    { instrumentId: 'gu', startTime: 0.5, duration: 0.5, baseFrequency: 120, note: 'Center' },
    { instrumentId: 'gu', startTime: 1, duration: 0.5, baseFrequency: 180, note: 'Edge' },
    { instrumentId: 'gu', startTime: 1.5, duration: 0.5, baseFrequency: 240, note: 'Rim' },
    { instrumentId: 'gu', startTime: 2, duration: 1, baseFrequency: 150, note: 'Roll' },
  ],
}

// 音符到频率的映射
const NOTE_FREQUENCIES: Record<string, number> = {
  'C3': 131, 'D3': 147, 'E3': 165, 'F3': 175, 'G3': 196, 'A3': 220, 'B3': 247,
  'C4': 262, 'D4': 294, 'E4': 330, 'F4': 349, 'G4': 392, 'A4': 440, 'B4': 494,
  'C5': 523, 'C#5': 554, 'D5': 587, 'D#5': 622, 'E5': 659, 'F5': 698, 'F#5': 740,
  'G5': 784, 'G#5': 831, 'A5': 880, 'A#5': 932, 'B5': 988, 'C6': 1047, 'D6': 1175,
}

// 找到最接近目标频率的音频片段
export function findClosestSegment(instrumentId: string, targetFrequency: number): AudioSegment | null {
  const segments = INSTRUMENT_SEGMENTS[instrumentId]
  if (!segments || segments.length === 0) return null

  let closestSegment = segments[0]
  let minDiff = Math.abs(targetFrequency - closestSegment.baseFrequency)

  for (const segment of segments) {
    const diff = Math.abs(targetFrequency - segment.baseFrequency)
    if (diff < minDiff) {
      minDiff = diff
      closestSegment = segment
    }
  }

  return closestSegment
}

// 生成基于真实采样的音乐计划
export function makeSampleBasedPlan(args: {
  instruments: string[]
  style: string
  durationSec: number
}): CompositionPlan & { useRealSamples: boolean; sampleMapping: Record<string, string> } {
  const { instruments, style, durationSec } = args

  // 检查哪些乐器有真实采样
  const availableInstruments = instruments.filter(id => INSTRUMENT_AUDIO_FILES[id])
  const useRealSamples = availableInstruments.length > 0

  // 创建采样映射
  const sampleMapping: Record<string, string> = {}
  availableInstruments.forEach(id => {
    sampleMapping[id] = `/${INSTRUMENT_AUDIO_FILES[id].file}`
  })

  // 使用原有的生成逻辑
  const basePlan = makeLocalPlan(args)

  return {
    ...basePlan,
    useRealSamples,
    sampleMapping,
  }
}

// 检查音频文件是否存在
export function checkAudioFiles(): Record<string, boolean> {
  const publicDir = path.resolve(__dirname, '../../public')
  const result: Record<string, boolean> = {}

  Object.entries(INSTRUMENT_AUDIO_FILES).forEach(([id, info]) => {
    const filePath = path.join(publicDir, info.file)
    result[id] = fs.existsSync(filePath)
  })

  return result
}
