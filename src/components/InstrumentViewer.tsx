import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Instrument, Hotspot } from '../data/instruments'
import { Play, Info } from 'lucide-react'

interface InstrumentViewerProps {
  instrument: Instrument;
  onPlaySound?: (hotspot: Hotspot) => void;
}

const InstrumentViewer: React.FC<InstrumentViewerProps> = ({ instrument, onPlaySound }) => {
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null)
  const [showInfo, setShowInfo] = useState(false)

  const handleHotspotClick = (hotspot: Hotspot) => {
    setActiveHotspot(hotspot)
    onPlaySound?.(hotspot)
    window.setTimeout(() => setActiveHotspot(null), 450)
  }

  return (
    <div className="relative mx-auto w-full max-w-2xl aspect-square rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur-md">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-3xl font-extrabold text-zinc-50">{instrument.name}</h2>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="rounded-full bg-white/10 p-2 text-emerald-200 transition-colors hover:bg-white/15"
        >
          <Info size={24} />
        </button>
      </div>

      <div className="group relative w-full aspect-square overflow-hidden rounded-2xl bg-white/5">
        <img
          src={instrument.imageUrl}
          alt={instrument.name}
          className="w-full h-full object-contain"
        />

        {/* Hotspots */}
        {instrument.hotspots.map((hotspot) => (
          <button
            key={hotspot.id}
            className="group/hotspot absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${hotspot.x}%`,
              top: `${hotspot.y}%`,
              width: `clamp(34px, ${Math.max(4, hotspot.radius) * 2}%, 72px)`,
              height: `clamp(34px, ${Math.max(4, hotspot.radius) * 2}%, 72px)`,
            }}
            onClick={() => handleHotspotClick(hotspot)}
          >
            <div className={`
              relative h-full w-full flex items-center justify-center
              rounded-full border-2 border-emerald-500/50
              hover:bg-emerald-400/10 transition-all duration-300
              ${activeHotspot?.id === hotspot.id ? 'scale-150 border-emerald-400 bg-emerald-400/15' : ''}
            `}>
              <Play size={16} className="text-emerald-200 opacity-0 group-hover/hotspot:opacity-100 transition-opacity" />

              <div className="absolute inset-0 rounded-full border border-emerald-400/30 opacity-0 group-hover/hotspot:opacity-100" />
            </div>
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-zinc-950/80 text-zinc-100 text-xs rounded opacity-0 group-hover/hotspot:opacity-100 transition-opacity whitespace-nowrap ring-1 ring-white/10">
              {hotspot.name}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 z-20 bg-zinc-950/85 backdrop-blur-md rounded-3xl p-8 flex flex-col items-center justify-center text-center ring-1 ring-white/10"
          >
            <h3 className="text-2xl font-bold text-zinc-50 mb-4">{instrument.name} 简介</h3>
            <p className="text-zinc-200/75 leading-relaxed mb-8">
              {instrument.description}
            </p>
            <button
              onClick={() => setShowInfo(false)}
              className="px-6 py-2 bg-emerald-500 text-zinc-950 rounded-full font-bold hover:bg-emerald-400 transition-colors"
            >
              返回体验
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 text-center text-sm italic text-zinc-200/60">
        点击乐器上的发光点聆听千年的回响
      </div>
    </div>
  )
}

export default InstrumentViewer
