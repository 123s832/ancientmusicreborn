import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { INSTRUMENTS } from '@/data/instruments'
import { useAuthStore, useCurrentUser } from '@/stores/useAuthStore'
import { useLibraryStore, useMyRecordings } from '@/stores/useLibraryStore'
import { arrayBufferToDataUrl, encodeWavFromAudioBuffer } from '@/utils/wav'
import { Save, Sparkles, LogIn } from 'lucide-react'

export default function Compose() {
  const user = useCurrentUser()
  const userId = useAuthStore((s) => s.currentUserId)
  const myRecordings = useMyRecordings(userId)
  const addRecording = useLibraryStore((s) => s.addRecording)

  const [selectedInstrumentIds, setSelectedInstrumentIds] = useState<string[]>(['pipa'])
  const [selectedRecordingIds, setSelectedRecordingIds] = useState<string[]>([])
  const [style, setStyle] = useState('轻快、明亮、古风')
  const [durationSec, setDurationSec] = useState(30)
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [canSave, setCanSave] = useState(false)
  const [saved, setSaved] = useState(false)

  type SampleInfo = {
    audioUrl: string
    startTime: number
    duration: number
    baseFrequency: number
    playbackRate: number
  }
  type Note = { t: number; d: number; hz: number; v?: number; sample?: SampleInfo }
  type Track = {
    instrumentId: string
    synth: 'pluck' | 'bow' | 'bell' | 'flute' | 'drum'
    notes: Note[]
  }
  type Plan = { bpm: number; durationSec: number; style: string; tracks: Track[] }

  const selectedRecordings = useMemo(() => {
    const set = new Set(selectedRecordingIds)
    return myRecordings.filter((r) => set.has(r.id))
  }, [myRecordings, selectedRecordingIds])

  function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
  }

  function instrumentSynthHint(instrumentId: string): Track['synth'] {
    const map: Record<string, Track['synth']> = {
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
    return map[instrumentId] ?? 'pluck'
  }

  // 缓存已加载的音频文件（作为背景纹理）
  const textureCache = new Map<string, AudioBuffer>()

  async function loadTexture(offline: OfflineAudioContext, url: string): Promise<AudioBuffer | null> {
    if (textureCache.has(url)) {
      return textureCache.get(url)!
    }
    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await offline.decodeAudioData(arrayBuffer)
      textureCache.set(url, audioBuffer)
      return audioBuffer
    } catch (error) {
      console.error('Failed to load texture:', url, error)
      return null
    }
  }

  async function renderPlanToWav(plan: Plan & { audioLayers?: Array<{ instrumentId: string; audioUrl: string; volume: number }> }) {
    const duration = clamp(plan.durationSec, 5, 120)
    const sampleRate = 44100
    const offline = new OfflineAudioContext(2, Math.floor(sampleRate * duration), sampleRate)
    const master = offline.createGain()
    master.gain.value = 0.9
    master.connect(offline.destination)

    // 创建两个总线：一个用于合成音色，一个用于真实音频纹理
    const synthBus = offline.createGain()
    synthBus.gain.value = 0.85
    synthBus.connect(master)

    const textureBus = offline.createGain()
    textureBus.gain.value = 0.4 // 纹理层音量较低
    textureBus.connect(master)

    const decodeOrNull = async (dataUrl: string) => {
      try {
        const ab = await fetch(dataUrl).then((r) => r.arrayBuffer())
        return await offline.decodeAudioData(ab)
      } catch {
        return null
      }
    }

    // 加载用户录音
    const recordingBuffers = await Promise.all(selectedRecordings.map((r) => decodeOrNull(r.dataUrl)))
    for (let i = 0; i < recordingBuffers.length; i++) {
      const b = recordingBuffers[i]
      if (!b) continue
      const src = offline.createBufferSource()
      src.buffer = b
      const g = offline.createGain()
      g.gain.value = 0.22
      src.connect(g)
      g.connect(synthBus)
      src.start(0)
    }

    // 加载真实音频纹理层
    const audioLayers = plan.audioLayers || []
    for (const layer of audioLayers) {
      const buffer = await loadTexture(offline, layer.audioUrl)
      if (!buffer) continue

      const src = offline.createBufferSource()
      src.buffer = buffer
      src.loop = true // 循环播放
      src.playbackRate.value = 1.0 // 不变速

      const g = offline.createGain()
      g.gain.value = layer.volume

      // 添加低通滤波，让纹理更柔和
      const filter = offline.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 2000

      src.connect(filter)
      filter.connect(g)
      g.connect(textureBus)

      // 在整个乐曲期间播放
      src.start(0)
      src.stop(duration)
    }

    const scheduleTone = (args: { t: number; d: number; hz: number; v: number; synth: Track['synth'] }) => {
      const t = clamp(args.t, 0, duration)
      const d = clamp(args.d, 0.03, 6)
      const hz = clamp(args.hz, 90, 1400)
      const v = clamp(args.v, 0.06, 1)

      if (args.synth === 'drum') {
        const bufferLen = Math.floor(sampleRate * d)
        const noise = offline.createBuffer(1, bufferLen, sampleRate)
        const data = noise.getChannelData(0)
        for (let i = 0; i < bufferLen; i++) data[i] = (Math.random() * 2 - 1) * 0.9
        const src = offline.createBufferSource()
        src.buffer = noise
        const filter = offline.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(1400, t)
        filter.frequency.exponentialRampToValueAtTime(180, t + d)

        const g = offline.createGain()
        g.gain.setValueAtTime(0.0001, t)
        g.gain.exponentialRampToValueAtTime(0.65 * v, t + 0.01)
        g.gain.exponentialRampToValueAtTime(0.0001, t + d)

        src.connect(filter)
        filter.connect(g)
        g.connect(synthBus)
        src.start(t)
        src.stop(t + d)
        return
      }

      const g = offline.createGain()
      g.gain.setValueAtTime(0.0001, t)

      if (args.synth === 'bow') {
        g.gain.linearRampToValueAtTime(0.18 * v, t + 0.05)
        g.gain.linearRampToValueAtTime(0.12 * v, t + d)
      } else {
        g.gain.exponentialRampToValueAtTime(0.22 * v, t + 0.02)
        g.gain.exponentialRampToValueAtTime(0.0001, t + d)
      }

      const filter = offline.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(args.synth === 'flute' ? 1800 : 2400, t)

      const osc1 = offline.createOscillator()
      const osc2 = offline.createOscillator()
      osc1.frequency.setValueAtTime(hz, t)
      osc2.frequency.setValueAtTime(hz * (args.synth === 'bell' ? 2.02 : 2), t)

      if (args.synth === 'pluck') {
        osc1.type = 'triangle'
        osc2.type = 'sine'
      } else if (args.synth === 'bow') {
        osc1.type = 'sawtooth'
        osc2.type = 'triangle'
      } else if (args.synth === 'bell') {
        osc1.type = 'sine'
        osc2.type = 'sine'
      } else {
        osc1.type = 'sine'
        osc2.type = 'sine'
      }

      const osc2Gain = offline.createGain()
      osc2Gain.gain.value = args.synth === 'bell' ? 0.45 : 0.18

      const vibrato = offline.createOscillator()
      vibrato.type = 'sine'
      vibrato.frequency.value = args.synth === 'bow' ? 5.5 : 0
      const vibratoGain = offline.createGain()
      vibratoGain.gain.value = args.synth === 'bow' ? 6.5 : 0
      vibrato.connect(vibratoGain)
      vibratoGain.connect(osc1.frequency)
      vibrato.start(t)
      vibrato.stop(t + d)

      osc1.connect(filter)
      osc2.connect(osc2Gain)
      osc2Gain.connect(filter)
      filter.connect(g)
      g.connect(synthBus)

      osc1.start(t)
      osc2.start(t)
      osc1.stop(t + d)
      osc2.stop(t + d)
    }

    for (const track of plan.tracks || []) {
      const synth = track.synth || instrumentSynthHint(track.instrumentId)
      for (const n of track.notes || []) {
        // 使用合成音色生成音符
        scheduleTone({ t: n.t, d: n.d, hz: n.hz, v: n.v ?? 0.7, synth })
      }
    }

    const buffer = await offline.startRendering()
    const wav = encodeWavFromAudioBuffer(buffer)
    return await arrayBufferToDataUrl(wav, 'audio/wav')
  }

  async function generate() {
    setError(null)
    setStatus('正在生成智能编曲…')
    setResultUrl(null)
    setCanSave(false)
    setSaved(false)

    const clipped = Math.max(5, Math.min(120, durationSec))

    try {
      console.log('开始调用API:', { instruments: selectedInstrumentIds, style, durationSec: clipped })
      const resp = await fetch('/api/ai/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruments: selectedInstrumentIds,
          recordingIds: selectedRecordingIds,
          style,
          durationSec: clipped,
        }),
      })
      console.log('API响应状态:', resp.status, resp.statusText)

      if (!resp.ok) {
        throw new Error(`HTTP错误: ${resp.status} ${resp.statusText}`)
      }

      const j = (await resp.json().catch((e) => {
        console.error('JSON解析错误:', e)
        return null
      })) as null | {
        success?: boolean
        used?: 'doubao' | 'local'
        message?: string
        plan?: Plan
      }

      console.log('API返回数据:', j)

      if (!j?.plan) {
        throw new Error('API返回数据格式错误')
      }

      const plan: Plan = {
        bpm: Number(j.plan.bpm) || 92,
        durationSec: clipped,
        style: typeof j.plan.style === 'string' ? j.plan.style : style,
        tracks: Array.isArray(j.plan.tracks) ? j.plan.tracks : [],
      }

      setStatus(j?.message || '编曲计划已生成')

      const dataUrl = await renderPlanToWav(plan)
      setResultUrl(dataUrl)
      setCanSave(true)
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '生成失败'
      console.error('生成错误详情:', e)
      setError(`生成失败: ${errorMsg}`)
      setStatus(null)
    }
  }

  return (
    <div className="space-y-6">
      {!user ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur-md">
          <div className="text-sm text-zinc-200/70">未登录：你仍可生成并下载，但保存到个人主页/发布到社区需要登录。</div>
          <Link
            to="/login"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-extrabold text-zinc-950 shadow-lg shadow-emerald-500/10 hover:bg-emerald-400"
          >
            <LogIn size={18} />
            去登录
          </Link>
        </div>
      ) : null}

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur-md">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <label className="block">
            <div className="text-sm font-bold text-zinc-100">作品标题（可选）</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-zinc-50 outline-none placeholder:text-zinc-400 focus:border-emerald-400"
              placeholder="例如：古风轻快小调"
            />
          </label>

          <label className="block">
            <div className="text-sm font-bold text-zinc-100">风格描述</div>
            <input
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-zinc-50 outline-none placeholder:text-zinc-400 focus:border-emerald-400"
              placeholder="例如：明亮、轻快、节奏感强、古风"
            />
          </label>

          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <div className="text-sm font-extrabold text-zinc-50">选择乐器（可多选）</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {INSTRUMENTS.map((it) => {
                const checked = selectedInstrumentIds.includes(it.id)
                return (
                  <label key={it.id} className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-sm font-bold text-zinc-100 ring-1 ring-white/10">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedInstrumentIds((prev) => (checked ? prev.filter((x) => x !== it.id) : [...prev, it.id]))
                      }}
                    />
                    {it.name}
                  </label>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <div className="text-sm font-extrabold text-zinc-50">选择你的录音（可多选）</div>
            <div className="mt-3 space-y-2">
              {myRecordings.length === 0 ? (
                <div className="text-sm text-zinc-200/70">暂无录音，可去“文物演奏”录制后再来选择。</div>
              ) : null}
              {myRecordings.map((r) => {
                const checked = selectedRecordingIds.includes(r.id)
                return (
                  <label key={r.id} className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-sm font-bold text-zinc-100 ring-1 ring-white/10">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedRecordingIds((prev) => (checked ? prev.filter((x) => x !== r.id) : [...prev, r.id]))
                      }}
                    />
                    <span className="line-clamp-1">{r.title}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <label className="block lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-zinc-100">时长（秒，最长 120 秒）</div>
              <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-extrabold text-emerald-200">{durationSec}s</div>
            </div>
            <input
              type="range"
              min={5}
              max={120}
              step={5}
              value={durationSec}
              onChange={(e) => setDurationSec(Number(e.target.value))}
              className="mt-3 w-full"
            />
          </label>

          <div className="lg:col-span-2">
            <button
              onClick={() => void generate()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-4 text-sm font-extrabold text-zinc-950 shadow-lg shadow-emerald-500/10 hover:bg-emerald-400"
            >
              <Sparkles size={18} />
              生成
            </button>
          </div>
        </div>

        {status ? (
          <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{status}</div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur-md">
        <h2 className="text-lg font-extrabold text-zinc-50">生成结果</h2>
        {resultUrl ? (
          <div className="mt-4 space-y-3">
            <audio controls className="w-full" src={resultUrl} />
            <button
              disabled={!userId || !canSave || saved}
              onClick={() => {
                if (!userId || !resultUrl) return
                addRecording({
                  userId,
                  instrumentId: 'ai',
                  title: title.trim() || `AI编曲 ${new Date().toLocaleString()}`,
                  dataUrl: resultUrl,
                })
                setSaved(true)
                setStatus('已保存到音频库')
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-4 text-sm font-extrabold text-zinc-950 shadow-lg shadow-emerald-500/10 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={18} />
              保存到音频库
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-200/70">点击“生成”后会在这里出现音频与保存按钮。</div>
        )}
      </div>
    </div>
  )
}
