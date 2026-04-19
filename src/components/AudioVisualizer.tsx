import React, { useEffect, useRef, useState } from 'react'
import { Activity, BarChart3, Music } from 'lucide-react'

interface AudioVisualizerProps {
  isPlaying: boolean
  frequency: number
  instrumentId: string
}

// 将频率转换为音高名称
function frequencyToNote(frequency: number): string {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const A4 = 440
  const semitones = Math.round(12 * Math.log2(frequency / A4))
  const octave = Math.floor((semitones + 9) / 12) + 4
  const noteIndex = ((semitones % 12) + 12) % 12
  return `${notes[noteIndex]}${octave}`
}

// 波形图组件
function WaveformVisualizer({ isPlaying, frequency }: { isPlaying: boolean; frequency: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const phaseRef = useRef(0)
  const frequencyRef = useRef(frequency)
  const smoothedFreqRef = useRef(frequency)
  const waveformDataRef = useRef<number[]>([])

  // 更新频率引用
  useEffect(() => {
    frequencyRef.current = frequency
  }, [frequency])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      // 重新初始化波形数据
      const width = canvas.offsetWidth
      waveformDataRef.current = new Array(Math.ceil(width / 2)).fill(0)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const width = canvas.offsetWidth
      const height = canvas.offsetHeight

      // 平滑频率变化
      smoothedFreqRef.current += (frequencyRef.current - smoothedFreqRef.current) * 0.1

      ctx.clearRect(0, 0, width, height)

      // 绘制背景网格
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
      ctx.lineWidth = 1
      for (let i = 0; i < width; i += 20) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, height)
        ctx.stroke()
      }
      for (let i = 0; i < height; i += 20) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(width, i)
        ctx.stroke()
      }

      const amplitude = isPlaying ? height * 0.3 : height * 0.03
      const centerY = height / 2

      // 根据频率计算波长
      const baseFreq = 440
      const currentFreq = smoothedFreqRef.current
      const cycles = (currentFreq / baseFreq) * 3

      // 生成波形数据点（更密集的采样）
      const points: number[] = []
      const step = 1 // 每像素一个点

      for (let x = 0; x < width; x += step) {
        const t = (x / width) * Math.PI * 2 * cycles + phaseRef.current

        // 使用更多谐波和包络使波形更自然
        const envelope = Math.sin((x / width) * Math.PI) * 0.3 + 0.7 // 两端衰减

        // 基础波形
        const fundamental = Math.sin(t) * amplitude * envelope

        // 添加更多谐波
        const harmonic2 = Math.sin(t * 2 + 0.5) * amplitude * 0.25 * envelope
        const harmonic3 = Math.sin(t * 3 + 1.2) * amplitude * 0.12 * envelope
        const harmonic4 = Math.sin(t * 4 + 0.8) * amplitude * 0.06 * envelope
        const harmonic5 = Math.sin(t * 5 + 1.5) * amplitude * 0.03 * envelope

        // 添加一些随机变化模拟自然振动
        const noise = (Math.random() - 0.5) * amplitude * 0.02

        const y = centerY + fundamental + harmonic2 + harmonic3 + harmonic4 + harmonic5 + noise
        points.push(y)
      }

      // 使用平滑曲线绘制
      ctx.strokeStyle = '#10b981'
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()

      // 使用贝塞尔曲线使波形更平滑
      if (points.length > 0) {
        ctx.moveTo(0, points[0])

        for (let i = 0; i < points.length - 1; i++) {
          const x = i * step
          const nextX = (i + 1) * step
          const y = points[i]
          const nextY = points[i + 1]

          // 使用二次贝塞尔曲线
          const cpX = (x + nextX) / 2
          const cpY = (y + nextY) / 2
          ctx.quadraticCurveTo(x, y, cpX, cpY)
        }

        // 连接最后一个点
        ctx.lineTo((points.length - 1) * step, points[points.length - 1])
      }
      ctx.stroke()

      // 添加发光效果
      ctx.shadowColor = '#10b981'
      ctx.shadowBlur = 10
      ctx.stroke()
      ctx.shadowBlur = 0

      // 更新相位 - 使用更平滑的增量
      if (isPlaying) {
        phaseRef.current += 0.08 * (currentFreq / baseFreq)
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying])

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Activity size={18} className="text-emerald-400" />
        <span className="text-sm font-bold text-zinc-200">波形图</span>
        <span className="ml-auto text-xs text-zinc-500">{frequency.toFixed(0)} Hz | {frequencyToNote(frequency)}</span>
      </div>
      <canvas
        ref={canvasRef}
        className="h-32 w-full rounded-xl bg-black/20"
        style={{ imageRendering: 'crisp-edges' }}
      />
      <div className="mt-2 flex justify-between text-xs text-zinc-500">
        <span>时间 →</span>
        <span>频率越高，波形越密集</span>
      </div>
    </div>
  )
}

// 频谱图组件
function SpectrumVisualizer({ isPlaying, frequency }: { isPlaying: boolean; frequency: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const barsRef = useRef<number[]>(Array(64).fill(0))
  const targetBarsRef = useRef<number[]>(Array(64).fill(0))
  const frequencyRef = useRef(frequency)

  // 更新频率引用
  useEffect(() => {
    frequencyRef.current = frequency
  }, [frequency])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    // 计算频谱目标值
    const calculateSpectrum = () => {
      const barCount = 64
      const currentFreq = frequencyRef.current

      // 将频率映射到频谱位置 (20Hz - 8000Hz 范围)
      const minFreq = 20
      const maxFreq = 8000
      const freqPosition = Math.log2(currentFreq / minFreq) / Math.log2(maxFreq / minFreq)
      const peakIndex = Math.floor(freqPosition * barCount)

      targetBarsRef.current = targetBarsRef.current.map((_, i) => {
        if (!isPlaying) {
          return Math.random() * 0.05 // 静音时的噪声底
        }

        // 计算与峰值频率的距离
        const distance = Math.abs(i - peakIndex)

        // 基频峰值
        let energy = 0
        if (distance === 0) {
          energy = 0.9 + Math.random() * 0.1 // 基频峰值
        } else if (distance <= 3) {
          energy = 0.6 - distance * 0.15 + Math.random() * 0.1 // 附近频段
        }

        // 添加谐波
        const harmonic2Index = Math.floor(peakIndex * 2)
        const harmonic3Index = Math.floor(peakIndex * 3)
        const harmonic4Index = Math.floor(peakIndex * 4)

        if (Math.abs(i - harmonic2Index) <= 1) {
          energy = Math.max(energy, 0.4 + Math.random() * 0.2) // 二次谐波
        }
        if (Math.abs(i - harmonic3Index) <= 1) {
          energy = Math.max(energy, 0.25 + Math.random() * 0.15) // 三次谐波
        }
        if (Math.abs(i - harmonic4Index) <= 1) {
          energy = Math.max(energy, 0.15 + Math.random() * 0.1) // 四次谐波
        }

        // 添加一些随机噪声
        energy += Math.random() * 0.05

        return Math.min(energy, 1)
      })
    }

    const draw = () => {
      const width = canvas.offsetWidth
      const height = canvas.offsetHeight

      ctx.clearRect(0, 0, width, height)

      // 更新频谱数据
      calculateSpectrum()

      // 平滑过渡
      barsRef.current = barsRef.current.map((current, i) => {
        const target = targetBarsRef.current[i]
        return current * 0.6 + target * 0.4
      })

      const barCount = 64
      const gap = 1
      const barWidth = (width - (barCount - 1) * gap) / barCount

      // 绘制频谱条
      barsRef.current.forEach((energy, i) => {
        const x = i * (barWidth + gap)
        const barHeight = energy * height * 0.95
        const y = height - barHeight

        // 根据频率位置选择颜色
        const hue = 140 + (i / barCount) * 60 // 从绿色到青色
        const saturation = 70 + energy * 30
        const lightness = 40 + energy * 30

        // 渐变色
        const gradient = ctx.createLinearGradient(0, height, 0, y)
        gradient.addColorStop(0, `hsl(${hue}, ${saturation}%, ${lightness}%)`)
        gradient.addColorStop(1, `hsl(${hue}, ${saturation}%, ${lightness + 20}%)`)

        ctx.fillStyle = gradient
        ctx.fillRect(x, y, barWidth, barHeight)

        // 顶部高光
        if (energy > 0.3) {
          ctx.fillStyle = `hsla(${hue}, 100%, 80%, 0.8)`
          ctx.fillRect(x, y, barWidth, 2)
        }
      })

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying])

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <BarChart3 size={18} className="text-indigo-400" />
        <span className="text-sm font-bold text-zinc-200">频谱图</span>
        <span className="ml-auto text-xs text-zinc-500">频率能量分布</span>
      </div>
      <canvas
        ref={canvasRef}
        className="h-32 w-full rounded-xl bg-black/20"
        style={{ imageRendering: 'crisp-edges' }}
      />
      <div className="mt-2 flex justify-between text-xs text-zinc-500">
        <span>20Hz</span>
        <span>1kHz</span>
        <span>8kHz</span>
      </div>
    </div>
  )
}

// 声学原理组件
function AcousticPrinciples({ instrumentId, frequency }: { instrumentId: string; frequency: number }) {
  // 乐器声学原理数据
  const principles: Record<string, {
    title: string
    principle: string
    characteristics: string[]
    frequencyRange: string
  }> = {
    pipa: {
      title: '琵琶声学原理',
      principle: '琵琶是弹拨乐器，通过手指或拨片拨动琴弦产生振动。琴弦的振动通过琴码传递到面板，引起共鸣箱内空气振动，从而放大声音。',
      characteristics: ['四弦定音：A-d-e-a', '面板采用梧桐木，共鸣效果好', '品位按音改变有效弦长', '音色清脆明亮，穿透力强'],
      frequencyRange: '80Hz - 4000Hz'
    },
    erhu: {
      title: '二胡声学原理',
      principle: '二胡是拉弦乐器，琴弓摩擦琴弦产生振动。蟒皮振动箱作为共鸣体，将弦的振动转化为声波。没有指板，通过按弦改变音高。',
      characteristics: ['两根琴弦：内弦D，外弦A', '蟒皮共鸣，音色独特', '无指板设计，滑音丰富', '音色接近人声，表现力强'],
      frequencyRange: '200Hz - 3000Hz'
    },
    qin: {
      title: '古琴声学原理',
      principle: '古琴是中国最古老的弹拨乐器之一，采用丝弦或钢弦。琴身即为共鸣箱，通过十三个徽位按音，泛音丰富。',
      characteristics: ['七弦十三徽', '散音、按音、泛音三种音色', '琴身长而窄，共鸣深沉', '音色古朴典雅，余音悠长'],
      frequencyRange: '65Hz - 2500Hz'
    },
    guzheng: {
      title: '古筝声学原理',
      principle: '古筝是多弦弹拨乐器，每弦一音。琴弦通过琴码传递到面板振动，共鸣箱放大声音。现代古筝多为21弦。',
      characteristics: ['21弦，D大调定弦', '雁柱支撑，可移动调音', '音色优美，音域宽广', '表现力丰富，可模拟流水'],
      frequencyRange: '80Hz - 4000Hz'
    },
    bianzhong: {
      title: '编钟声学原理',
      principle: '编钟是打击乐器，由青铜铸造。每个钟有两个音（正鼓音和侧鼓音），通过敲击不同部位产生不同音高。',
      characteristics: ['一钟双音：正鼓音+侧鼓音', '合瓦形结构，振动模式独特', '音色庄严浑厚，余音绵长', '音准精确，可演奏旋律'],
      frequencyRange: '100Hz - 3000Hz'
    },
    xiao: {
      title: '箫声学原理',
      principle: '箫是边棱气鸣乐器，气流通过吹口边缘形成涡旋，激发管内空气柱振动。通过按孔改变管长，从而改变音高。',
      characteristics: ['六孔或八孔设计', '竖吹，音色清幽', '管身较长，音域较低', '音色空灵，适合独奏'],
      frequencyRange: '200Hz - 2500Hz'
    },
    di: {
      title: '笛子声学原理',
      principle: '笛子是横吹边棱气鸣乐器，气流通过膜孔激发笛膜振动，与管内空气柱共鸣。笛膜使音色更加明亮。',
      characteristics: ['贴笛膜，音色独特', '六孔设计，转调方便', '音域较宽，技巧丰富', '音色清脆，穿透力强'],
      frequencyRange: '300Hz - 3500Hz'
    },
    sheng: {
      title: '笙声学原理',
      principle: '笙是簧管乐器，由多根装有簧片的竹管组成。吹吸皆可发声，簧片振动引起管内空气柱共鸣。',
      characteristics: ['和声乐器，多音同时发声', '簧片振动，音色独特', '三十六簧或二十一簧', '可演奏和声与复调'],
      frequencyRange: '150Hz - 3000Hz'
    },
    xun: {
      title: '埙声学原理',
      principle: '埙是闭口吹奏乐器，通过吹口边缘激发腔内空气振动。腔体形状和大小决定音高和音色。',
      characteristics: ['梨形或球形腔体', '音色古朴苍凉', '八孔或十孔设计', '中国最古老乐器之一'],
      frequencyRange: '200Hz - 1500Hz'
    },
    gu: {
      title: '鼓声学原理',
      principle: '鼓是膜鸣乐器，敲击鼓面使膜振动，通过鼓腔共鸣放大声音。鼓面张力和大小决定音高。',
      characteristics: ['膜振动产生声音', '鼓腔共鸣放大', '可演奏节奏和音色变化', '音量宏大，气势雄壮'],
      frequencyRange: '60Hz - 800Hz'
    },
    se: {
      title: '瑟声学原理',
      principle: '瑟是古代弹拨乐器，与琴相似但弦数更多。每弦一音，通过拨弦发声，共鸣箱放大音量。',
      characteristics: ['二十五弦或二十三弦', '每弦一音，音域宽广', '音色浑厚，适合伴奏', '古代重要的伴奏乐器'],
      frequencyRange: '80Hz - 2500Hz'
    }
  }

  const data = principles[instrumentId] || principles.pipa

  // 将频率转换为音高名称
  const noteName = frequencyToNote(frequency)

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Music size={18} className="text-amber-400" />
        <span className="text-sm font-bold text-zinc-200">声学原理</span>
        <span className="ml-auto text-xs text-zinc-500">古乐知识可视化</span>
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-xs font-bold text-emerald-400 mb-1">{data.title}</h4>
          <p className="text-xs text-zinc-300 leading-relaxed">{data.principle}</p>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <h5 className="text-xs font-bold text-zinc-400 mb-2">乐器特性</h5>
          <ul className="space-y-1">
            {data.characteristics.map((char, i) => (
              <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                {char}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-emerald-400/10 px-3 py-2">
          <span className="text-xs text-zinc-400">频率范围</span>
          <span className="text-xs font-bold text-emerald-400">{data.frequencyRange}</span>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-indigo-400/10 px-3 py-2">
          <span className="text-xs text-zinc-400">当前音高</span>
          <span className="text-xs font-bold text-indigo-400">{noteName} ({frequency.toFixed(0)} Hz)</span>
        </div>
      </div>
    </div>
  )
}

// 主组件
export default function AudioVisualizer({ isPlaying, frequency, instrumentId }: AudioVisualizerProps) {
  return (
    <div className="space-y-4">
      <WaveformVisualizer isPlaying={isPlaying} frequency={frequency} />
      <SpectrumVisualizer isPlaying={isPlaying} frequency={frequency} />
      <AcousticPrinciples instrumentId={instrumentId} frequency={frequency} />
    </div>
  )
}
