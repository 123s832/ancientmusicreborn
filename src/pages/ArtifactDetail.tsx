import React, { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { INSTRUMENTS } from '@/data/instruments'
import InstrumentViewer from '@/components/InstrumentViewer'
import { useAudioEngine } from '@/hooks/useAudioEngine'

export default function ArtifactDetail() {
  const { id } = useParams()
  const audio = useAudioEngine()

  const instrument = useMemo(() => INSTRUMENTS.find((x) => x.id === id) || null, [id])

  if (!instrument) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/30 backdrop-blur-md">
        <div className="text-lg font-extrabold text-zinc-50">未找到该文物</div>
        <Link to="/artifacts" className="mt-3 inline-block font-bold text-emerald-200 hover:underline">
          返回文物列表
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/artifacts" className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-zinc-100 shadow-sm ring-1 ring-white/10 hover:bg-white/15">
          返回列表
        </Link>
        <Link to="/play" className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-extrabold text-zinc-950 shadow-lg shadow-emerald-500/10 hover:bg-emerald-400">
          去演奏并录音
        </Link>
      </div>

      <InstrumentViewer
        instrument={instrument}
        onPlaySound={(hotspot) => {
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
          void audio.playTone({ hz: hotspot.hz, synth: map[instrument.id] ?? 'pluck' })
        }}
      />
    </div>
  )
}
