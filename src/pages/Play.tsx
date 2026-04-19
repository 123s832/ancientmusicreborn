import React, { useMemo, useRef, useState } from 'react'
import { INSTRUMENTS } from '@/data/instruments'
import InstrumentViewer from '@/components/InstrumentViewer'
import AudioVisualizer from '@/components/AudioVisualizer'
import { useAudioEngine } from '@/hooks/useAudioEngine'
import { useAuthStore, useCurrentUser } from '@/stores/useAuthStore'
import { useLibraryStore } from '@/stores/useLibraryStore'
import { Mic, Square, Save, Library } from 'lucide-react'
import { Link } from 'react-router-dom'

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('读取录音失败'))
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(blob)
  })
}

export default function Play() {
  const user = useCurrentUser()
  const userId = useAuthStore((s) => s.currentUserId)
  const addRecording = useLibraryStore((s) => s.addRecording)
  const audio = useAudioEngine()

  const [instrumentId, setInstrumentId] = useState(INSTRUMENTS[0]?.id ?? 'pipa')
  const instrument = useMemo(() => INSTRUMENTS.find((x) => x.id === instrumentId) || INSTRUMENTS[0], [instrumentId])

  // 音频可视化状态
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFrequency, setCurrentFrequency] = useState(440)
  const playTimeoutRef = useRef<NodeJS.Timeout>()

  const synth = useMemo(() => {
    const map: Record<string, 'pluck' | 'bow' | 'bell' | 'flute' | 'drum'> = {
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
    return map[instrument.id] ?? 'pluck'
  }, [instrument.id])

  const [isRecording, setIsRecording] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const recorderRef = useRef<MediaRecorder | null>(null)
  const recorderEngineRef = useRef<ReturnType<ReturnType<typeof useAudioEngine>['createRecorder']> | null>(null)

  async function start() {
    if (!userId) {
      setError('请先登录后再录音')
      return
    }
    setError(null)
    await audio.ensureRunning()
    const engine = audio.createRecorder()
    recorderEngineRef.current = engine

    const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm']
    const preferred = preferredTypes.find((t) => (window as any).MediaRecorder?.isTypeSupported?.(t))
    const mr = new MediaRecorder(engine.stream, preferred ? { mimeType: preferred } : undefined)
    recorderRef.current = mr
    chunksRef.current = []
    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
    }
    mr.onstop = async () => {
      try {
        setIsSaving(true)
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' })
        const dataUrl = await blobToDataUrl(blob)
        addRecording({
          userId,
          instrumentId: instrument.id,
          title: `${instrument.name} 录音 ${new Date().toLocaleString()}`,
          dataUrl,
        })

        try {
          engine.stream.getTracks().forEach((t) => t.stop())
        } catch {
          // ignore
        }

        setToast('已保存到音频库')
        window.setTimeout(() => setToast(null), 1400)
      } catch (e) {
        setError(e instanceof Error ? e.message : '保存失败')
      } finally {
        setIsSaving(false)
      }
    }
    mr.start(250)
    setIsRecording(true)
  }

  function stop() {
    setError(null)
    const mr = recorderRef.current
    if (mr && mr.state !== 'inactive') {
      mr.stop()
    }
    setIsRecording(false)
  }

  // 处理乐器发声并更新可视化
  const handlePlaySound = (hotspot: { hz: number }) => {
    // 更新频率和播放状态
    setCurrentFrequency(hotspot.hz)
    setIsPlaying(true)

    // 清除之前的超时
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current)
    }

    // 1.5秒后停止可视化
    playTimeoutRef.current = setTimeout(() => {
      setIsPlaying(false)
    }, 1500)

    // 播放声音
    if (isRecording && recorderEngineRef.current) {
      recorderEngineRef.current.playToneToDest({ hz: hotspot.hz, synth })
      return
    }
    void audio.playTone({ hz: hotspot.hz, synth })
  }

  return (
    <div className="space-y-6">
      {/* 顶部控制栏 */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur-md">
        <h1 className="text-2xl font-extrabold text-zinc-50">古乐演奏</h1>
        <p className="mt-2 text-sm text-zinc-200/70">点击乐器发声点发声；开启录制后，将你的演奏保存到个人音频库。</p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <select
            value={instrumentId}
            onChange={(e) => setInstrumentId(e.target.value)}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-zinc-100 outline-none focus:border-emerald-400"
          >
            {INSTRUMENTS.map((it) => (
              <option key={it.id} value={it.id}>
                {it.name}
              </option>
            ))}
          </select>

          {isRecording ? (
            <button
              onClick={stop}
              className="inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-extrabold text-zinc-950 shadow-lg shadow-rose-500/10 hover:bg-rose-400"
              disabled={isSaving}
            >
              <Square size={18} />
              停止录制
            </button>
          ) : (
            <button
              onClick={() => void start()}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-extrabold text-zinc-950 shadow-lg shadow-emerald-500/10 hover:bg-emerald-400"
              disabled={isSaving}
            >
              <Mic size={18} />
              开始录制
            </button>
          )}

          <Link
            to="/library"
            className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-extrabold text-zinc-100 shadow-sm ring-1 ring-white/10 hover:bg-white/15"
          >
            <Library size={18} />
            查看音频库
          </Link>

          {isSaving ? (
            <div className="inline-flex items-center gap-2 rounded-2xl bg-amber-400/15 px-4 py-3 text-sm font-bold text-amber-200">
              <Save size={18} />
              正在保存…
            </div>
          ) : null}
        </div>

        {user ? (
          <div className="mt-3 text-xs font-bold text-zinc-200/70">当前登录：{user.nickname}</div>
        ) : (
          <div className="mt-3 text-xs font-bold text-rose-200">未登录：录音保存功能不可用</div>
        )}

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>
        ) : null}
      </div>

      {/* 主内容区：左侧乐器演奏，右侧可视化 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：乐器演奏 */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-bold text-zinc-200 mb-3">乐器演奏</h3>
            <InstrumentViewer
              instrument={instrument}
              onPlaySound={handlePlaySound}
            />
          </div>
        </div>

        {/* 右侧：音频可视化 */}
        <div>
          <AudioVisualizer
            isPlaying={isPlaying}
            frequency={currentFrequency}
            instrumentId={instrumentId}
          />
        </div>
      </div>

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-zinc-950/85 px-4 py-2 text-sm font-bold text-zinc-100 shadow-2xl ring-1 ring-white/10 backdrop-blur">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
