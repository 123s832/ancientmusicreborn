type Note = {
  t: number
  d: number
  hz: number
  v?: number
}

type Track = {
  instrumentId: string
  synth: 'pluck' | 'bow' | 'bell' | 'flute' | 'drum'
  notes: Note[]
}

export type CompositionPlan = {
  bpm: number
  durationSec: number
  style: string
  tracks: Track[]
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function hzFromMidi(m: number) {
  return 440 * Math.pow(2, (m - 69) / 12)
}

// 五声音阶 (宫商角徵羽)
const PENTATONIC_MAJOR = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81] // C D E G A
const PENTATONIC_MINOR = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79] // A C D E G (羽调式)

// 鼓点节奏模式
const DRUM_PATTERNS = [
  [1, 0, 0, 0, 1, 0, 0, 0], // 简单四分音符
  [1, 0, 1, 0, 1, 0, 1, 0], // 八分音符
  [1, 0, 0, 1, 1, 0, 0, 1], // 切分节奏
  [1, 0, 1, 1, 1, 0, 1, 1], // 密集节奏
]

// 和弦进行模板 (五声音阶)
const CHORD_PROGRESSIONS = [
  [[60, 64, 67], [62, 65, 69], [64, 67, 72], [67, 71, 74]], // I - II - III - V
  [[60, 64, 67], [67, 71, 74], [62, 65, 69], [60, 64, 67]], // I - V - II - I
  [[64, 67, 72], [60, 64, 67], [69, 72, 76], [67, 71, 74]], // III - I - VI - V
]

// 风格关键词映射
const STYLE_KEYWORDS = {
  // 速度相关
  speed: {
    veryFast: ['极快', '飞快', '急促', '激烈', '狂热', 'aggressive', 'intense'],
    fast: ['快', '轻快', '活泼', '欢快', '跳跃', '灵动', 'upbeat', 'lively', 'fast'],
    slow: ['慢', '缓慢', '舒缓', '宁静', '安静', '悠然', '闲适', 'slow', 'calm', 'peaceful'],
    verySlow: ['极慢', '沉重', '庄严', '肃穆', '凝重', 'very slow', 'solemn']
  },
  // 情感/调式
  emotion: {
    joyful: ['欢快', '喜悦', '欢乐', '开心', '明朗', 'happy', 'joyful', 'bright'],
    sad: ['忧伤', '悲伤', '哀愁', '哀怨', '凄凉', 'sad', 'melancholic', 'mournful'],
    peaceful: ['宁静', '平和', '安详', '静谧', 'peaceful', 'tranquil', 'serene'],
    majestic: ['庄严', '雄伟', '宏大', '壮丽', 'majesty', 'grand', 'epic'],
    mysterious: ['神秘', '幽深', '空灵', '飘渺', 'mysterious', 'ethereal'],
    romantic: ['浪漫', '温柔', '柔情', '婉约', 'romantic', 'tender']
  },
  // 密度/复杂度
  density: {
    dense: ['密集', '繁复', '复杂', '华丽', '丰富', 'dense', 'complex', 'rich'],
    sparse: ['稀疏', '简约', '简单', '清淡', '空灵', 'sparse', 'simple', 'minimal'],
    moderate: ['适中', '平衡', 'moderate', 'balanced']
  },
  // 力度
  dynamics: {
    strong: ['强', '响亮', '有力', '激昂', '强劲', 'loud', 'strong', 'powerful'],
    weak: ['弱', '轻柔', '微弱', '细腻', 'soft', 'gentle', 'delicate'],
    dynamic: ['变化', '起伏', 'dynamic', 'variable']
  },
  // 特殊风格
  style: {
    traditional: ['传统', '古典', '古韵', '正统', 'traditional', 'classical'],
    modern: ['现代', '新潮', '时尚', 'modern', 'contemporary'],
    folk: ['民间', '民俗', '乡土', 'folk', 'ethnic'],
    court: ['宫廷', '雅乐', '庄重', 'court', 'ceremonial'],
    nature: ['自然', '山水', '田园', 'nature', 'pastoral']
  }
}

// 计算关键词匹配分数
function matchScore(style: string, keywords: string[]): number {
  const lowerStyle = style.toLowerCase()
  let score = 0
  for (const keyword of keywords) {
    if (lowerStyle.includes(keyword.toLowerCase())) {
      score += 1
    }
  }
  return score
}

// 根据风格解析参数
function parseStyle(style: string) {
  const lowerStyle = style.toLowerCase()

  // 速度判定（加权）
  let bpm = 85 // 默认中速
  const speedScores = {
    veryFast: matchScore(style, STYLE_KEYWORDS.speed.veryFast) * 140,
    fast: matchScore(style, STYLE_KEYWORDS.speed.fast) * 110,
    slow: matchScore(style, STYLE_KEYWORDS.speed.slow) * 65,
    verySlow: matchScore(style, STYLE_KEYWORDS.speed.verySlow) * 50
  }

  // 选择得分最高的速度
  const maxSpeedCategory = Object.entries(speedScores).reduce((a, b) => a[1] > b[1] ? a : b)
  if (maxSpeedCategory[1] > 0) {
    const speedMap: Record<string, number> = {
      veryFast: 130,
      fast: 105,
      slow: 70,
      verySlow: 55
    }
    bpm = speedMap[maxSpeedCategory[0]] || 85
  }

  // 调式和音阶选择
  let scale = PENTATONIC_MAJOR
  let isMinor = false

  const emotionScores = {
    sad: matchScore(style, STYLE_KEYWORDS.emotion.sad),
    peaceful: matchScore(style, STYLE_KEYWORDS.emotion.peaceful),
    mysterious: matchScore(style, STYLE_KEYWORDS.emotion.mysterious),
    joyful: matchScore(style, STYLE_KEYWORDS.emotion.joyful),
    majestic: matchScore(style, STYLE_KEYWORDS.emotion.majestic),
    romantic: matchScore(style, STYLE_KEYWORDS.emotion.romantic)
  }

  const maxEmotion = Object.entries(emotionScores).reduce((a, b) => a[1] > b[1] ? a : b)

  if (maxEmotion[1] > 0) {
    switch (maxEmotion[0]) {
      case 'sad':
      case 'mysterious':
        scale = PENTATONIC_MINOR
        isMinor = true
        break
      case 'peaceful':
        scale = Math.random() > 0.5 ? PENTATONIC_MAJOR : PENTATONIC_MINOR
        break
      case 'joyful':
      case 'majestic':
      default:
        scale = PENTATONIC_MAJOR
        isMinor = false
    }
  }

  // 密度判定
  let density = 0.6
  const densityScores = {
    dense: matchScore(style, STYLE_KEYWORDS.density.dense),
    sparse: matchScore(style, STYLE_KEYWORDS.density.sparse)
  }

  if (densityScores.dense > densityScores.sparse) {
    density = 0.75 + Math.min(densityScores.dense * 0.05, 0.15)
  } else if (densityScores.sparse > densityScores.dense) {
    density = 0.4 - Math.min(densityScores.sparse * 0.05, 0.15)
  }
  density = Math.max(0.2, Math.min(0.9, density))

  // 音量/力度判定
  let volume = 0.6
  const dynamicsScores = {
    strong: matchScore(style, STYLE_KEYWORDS.dynamics.strong),
    weak: matchScore(style, STYLE_KEYWORDS.dynamics.weak)
  }

  if (dynamicsScores.strong > dynamicsScores.weak) {
    volume = 0.75 + Math.min(dynamicsScores.strong * 0.03, 0.15)
  } else if (dynamicsScores.weak > dynamicsScores.strong) {
    volume = 0.5 - Math.min(dynamicsScores.weak * 0.03, 0.15)
  }
  volume = Math.max(0.3, Math.min(0.9, volume))

  // 特殊风格调整
  const styleScores = {
    traditional: matchScore(style, STYLE_KEYWORDS.style.traditional),
    court: matchScore(style, STYLE_KEYWORDS.style.court),
    nature: matchScore(style, STYLE_KEYWORDS.style.nature)
  }

  // 宫廷风格：更慢、更庄重
  if (styleScores.court > 0) {
    bpm = Math.min(bpm, 70)
    volume = Math.max(volume, 0.7)
  }

  // 自然/田园风格：更舒缓
  if (styleScores.nature > 0) {
    bpm = Math.min(bpm, 80)
    density = Math.min(density, 0.6)
  }

  return { bpm, scale, isMinor, density, volume, dominantEmotion: maxEmotion[0] }
}

// 根据风格特征调整旋律
interface MelodyStyle {
  dominantEmotion?: string
  noteLengthBias: 'short' | 'medium' | 'long'  // 音符长度偏好
  articulation: 'legato' | 'staccato' | 'normal'  // 连奏/断奏
  useOrnament: boolean  // 是否使用装饰音
  range: 'narrow' | 'medium' | 'wide'  // 音域范围
}

// 生成旋律线
function generateMelody(args: {
  durationSec: number
  bpm: number
  scale: number[]
  density: number
  volume: number
  synth: Track['synth']
  style?: MelodyStyle
}): Note[] {
  const { durationSec, bpm, scale, density, volume, synth, style } = args
  const beat = 60 / bpm
  const notes: Note[] = []

  // 根据密度和风格决定音符间隔
  let stepSize: number
  if (style?.noteLengthBias === 'short') {
    stepSize = beat / 4  // 短音符：十六分音符
  } else if (style?.noteLengthBias === 'long') {
    stepSize = beat  // 长音符：四分音符
  } else {
    stepSize = density > 0.7 ? beat / 4 : density > 0.5 ? beat / 2 : beat
  }

  const steps = Math.floor(durationSec / stepSize)

  // 根据风格选择和弦进行
  let progression = pick(CHORD_PROGRESSIONS)

  // 忧伤/神秘风格：使用更简单的和弦进行
  if (style?.dominantEmotion === 'sad' || style?.dominantEmotion === 'mysterious') {
    progression = [[[60, 64, 67], [62, 65, 69], [60, 64, 67], [62, 65, 69]]][0]
  }

  const chordsPerBar = 2
  const stepsPerChord = Math.floor((beat * 2) / stepSize) * chordsPerBar

  let lastNote: number | null = null
  let noteCount = 0

  for (let i = 0; i < steps; i++) {
    const t = i * stepSize
    const chordIndex = Math.floor(i / stepsPerChord) % progression.length
    const currentChord = progression[chordIndex]

    // 根据密度决定是否添加音符
    if (Math.random() > density) continue

    // 优先选择和弦内音
    let midi: number
    const chordToneProbability = style?.articulation === 'legato' ? 0.8 : 0.7
    if (Math.random() < chordToneProbability && currentChord) {
      midi = pick(currentChord)
    } else {
      midi = pick(scale)
    }

    // 根据音域范围限制音符选择
    if (style?.range === 'narrow') {
      // 窄音域：限制在中音区
      midi = clamp(midi, 60, 72)
    } else if (style?.range === 'wide') {
      // 宽音域：允许更大跳跃
      if (lastNote && Math.random() < 0.3) {
        const jump = Math.random() > 0.5 ? 7 : -7
        midi = clamp(lastNote + jump, Math.min(...scale), Math.max(...scale))
      }
    }

    // 避免重复音过多
    if (lastNote === midi && Math.random() < 0.5) {
      const availableNotes = scale.filter(n => n !== lastNote)
      if (availableNotes.length > 0) {
        midi = pick(availableNotes)
      }
    }
    lastNote = midi
    noteCount++

    // 根据位置和风格调整时长
    let dur: number
    const posInBeat = (t % beat) / beat

    if (style?.noteLengthBias === 'long') {
      // 长音符偏好
      dur = posInBeat < 0.1 ? beat * 2 : beat
    } else if (style?.noteLengthBias === 'short') {
      // 短音符偏好
      dur = posInBeat < 0.1 ? beat : beat / 2
    } else {
      // 默认逻辑
      if (posInBeat < 0.1) {
        dur = Math.random() < 0.5 ? beat : beat * 1.5
      } else {
        dur = Math.random() < 0.6 ? beat / 2 : beat
      }
    }

    // 连奏风格：延长音符
    if (style?.articulation === 'legato') {
      dur *= 1.3
    }
    // 断奏风格：缩短音符
    if (style?.articulation === 'staccato') {
      dur *= 0.6
    }

    // 确保不超过总时长
    dur = Math.min(dur, durationSec - t)
    if (dur <= 0) continue

    // 根据乐器类型和风格调整音量和时长
    let v = volume
    if (synth === 'bell') {
      v *= 0.85
      dur *= 0.8
    } else if (synth === 'bow') {
      v *= 0.9
      dur *= style?.articulation === 'legato' ? 1.4 : 1.2
    } else if (synth === 'flute') {
      v *= 0.8
      if (style?.articulation === 'legato') {
        v *= 1.1  // 长笛连奏更柔和
      }
    }

    // 装饰音处理
    if (style?.useOrnament && Math.random() < 0.15 && noteCount > 1) {
      // 添加前倚音
      const ornamentNote = clamp(midi + (Math.random() > 0.5 ? 2 : -2), Math.min(...scale), Math.max(...scale))
      notes.push({
        t,
        d: Math.min(dur * 0.15, 0.1),
        hz: hzFromMidi(ornamentNote),
        v: clamp(v * 0.7, 0.1, 1)
      })
    }

    notes.push({ t, d: dur, hz: hzFromMidi(midi), v: clamp(v, 0.1, 1) })
  }

  return notes
}

// 生成鼓点
function generateDrums(durationSec: number, bpm: number): Note[] {
  const beat = 60 / bpm
  const notes: Note[] = []
  const pattern = pick(DRUM_PATTERNS)
  const stepsPerBar = pattern.length
  const stepSize = (beat * 2) / stepsPerBar // 假设每小节2拍

  const totalSteps = Math.floor(durationSec / stepSize)

  for (let i = 0; i < totalSteps; i++) {
    const patternIndex = i % stepsPerBar
    if (pattern[patternIndex]) {
      const t = i * stepSize
      const drumNote = pick([48, 50, 52, 55])
      notes.push({
        t,
        d: beat / 6,
        hz: hzFromMidi(drumNote),
        v: patternIndex === 0 ? 0.95 : 0.7 // 强拍音量更大
      })
    }
  }

  return notes
}

// 生成低音/和弦伴奏
function generateBassLine(args: {
  durationSec: number
  bpm: number
  scale: number[]
  volume: number
}): Note[] {
  const { durationSec, bpm, scale, volume } = args
  const beat = 60 / bpm
  const notes: Note[] = []

  // 每两拍一个低音
  const stepSize = beat * 2
  const steps = Math.floor(durationSec / stepSize)

  const progression = pick(CHORD_PROGRESSIONS)

  for (let i = 0; i < steps; i++) {
    const t = i * stepSize
    const chordIndex = i % progression.length
    const chord = progression[chordIndex]
    const root = chord[0] - 12 // 低八度根音

    notes.push({
      t,
      d: beat * 1.8,
      hz: hzFromMidi(root),
      v: volume * 0.7
    })
  }

  return notes
}

export function makeLocalPlan(args: {
  instruments: string[]
  style: string
  durationSec: number
}): CompositionPlan {
  const durationSec = clamp(Number(args.durationSec) || 30, 5, 120)
  const styleParams = parseStyle(args.style || '古风、五声音阶、清冷而灵动')
  const bpm = clamp(styleParams.bpm + Math.round((Math.random() - 0.5) * 10), 60, 130)

  const instruments = (Array.isArray(args.instruments) ? args.instruments : []).filter(Boolean)
  const chosen = instruments.length ? instruments : ['qin']

  const synthByInstrument: Record<string, Track['synth']> = {
    pipa: 'pluck',
    qin: 'pluck',
    se: 'pluck',
    erhu: 'bow',
    bianzhong: 'bell',
    xiao: 'flute',
    di: 'flute',
    sheng: 'flute',
    xun: 'flute',
    gu: 'drum',
  }

  // 根据主导情感确定旋律风格特征
  const melodyStyle: MelodyStyle = {
    dominantEmotion: styleParams.dominantEmotion,
    noteLengthBias: 'medium',
    articulation: 'normal',
    useOrnament: false,
    range: 'medium'
  }

  // 根据情感调整风格特征
  switch (styleParams.dominantEmotion) {
    case 'sad':
    case 'mysterious':
      melodyStyle.noteLengthBias = 'long'
      melodyStyle.articulation = 'legato'
      melodyStyle.useOrnament = true
      melodyStyle.range = 'narrow'
      break
    case 'joyful':
      melodyStyle.noteLengthBias = 'short'
      melodyStyle.articulation = 'staccato'
      melodyStyle.useOrnament = true
      melodyStyle.range = 'wide'
      break
    case 'peaceful':
      melodyStyle.noteLengthBias = 'long'
      melodyStyle.articulation = 'legato'
      melodyStyle.useOrnament = false
      melodyStyle.range = 'medium'
      break
    case 'majestic':
      melodyStyle.noteLengthBias = 'long'
      melodyStyle.articulation = 'normal'
      melodyStyle.useOrnament = false
      melodyStyle.range = 'wide'
      break
    case 'romantic':
      melodyStyle.noteLengthBias = 'medium'
      melodyStyle.articulation = 'legato'
      melodyStyle.useOrnament = true
      melodyStyle.range = 'medium'
      break
  }

  const tracks: Track[] = []

  // 为每个选中的乐器生成音轨
  chosen.forEach((id, index) => {
    const synth = synthByInstrument[id] ?? 'pluck'

    if (synth === 'drum') {
      // 鼓点 - 根据风格调整
      const drumNotes = generateDrums(durationSec, bpm)
      // 忧伤/宁静风格减少鼓点
      if (styleParams.dominantEmotion === 'sad' || styleParams.dominantEmotion === 'peaceful') {
        drumNotes.forEach(n => n.v *= 0.6)
      }
      tracks.push({
        instrumentId: id,
        synth,
        notes: drumNotes
      })
    } else if (index === 0) {
      // 主旋律 - 应用完整风格
      tracks.push({
        instrumentId: id,
        synth,
        notes: generateMelody({
          durationSec,
          bpm,
          scale: styleParams.scale,
          density: styleParams.density,
          volume: styleParams.volume,
          synth,
          style: melodyStyle
        })
      })
    } else if (index === 1 && chosen.length >= 3) {
      // 第二乐器作为低音/和弦伴奏 - 简化风格
      tracks.push({
        instrumentId: id,
        synth,
        notes: generateBassLine({
          durationSec,
          bpm,
          scale: styleParams.scale,
          volume: styleParams.volume * 0.6
        })
      })
    } else {
      // 其他乐器作为装饰音 - 应用简化风格
      const decorativeStyle: MelodyStyle = {
        ...melodyStyle,
        noteLengthBias: 'short',
        useOrnament: false
      }
      tracks.push({
        instrumentId: id,
        synth,
        notes: generateMelody({
          durationSec,
          bpm,
          scale: styleParams.scale,
          density: styleParams.density * 0.4, // 更稀疏
          volume: styleParams.volume * 0.4,
          synth,
          style: decorativeStyle
        })
      })
    }
  })

  return {
    bpm,
    durationSec,
    style: args.style || '古风、五声音阶、清冷而灵动',
    tracks,
  }
}

export function extractFirstJsonObject(text: string) {
  const start = text.indexOf('{')
  if (start < 0) return null
  let depth = 0
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (ch === '{') depth++
    if (ch === '}') depth--
    if (depth === 0) {
      try {
        return JSON.parse(text.slice(start, i + 1))
      } catch {
        return null
      }
    }
  }
  return null
}
