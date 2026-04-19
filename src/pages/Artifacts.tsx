import React from 'react'
import { Link } from 'react-router-dom'
import { INSTRUMENTS } from '@/data/instruments'

export default function Artifacts() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur-md">
        <h1 className="text-2xl font-extrabold text-zinc-50">文物欣赏</h1>
        <p className="mt-2 text-sm text-zinc-200/70">选择一种古代乐器文物，进入详情后点击不同位置即可发声并查看介绍。</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {INSTRUMENTS.map((it) => (
          <Link
            key={it.id}
            to={`/artifacts/${it.id}`}
            className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/30 backdrop-blur-md transition hover:bg-white/8 hover:shadow-2xl"
          >
            <div className="aspect-square bg-white/5">
              <img src={it.imageUrl} alt={it.name} className="h-full w-full object-contain p-6 transition-transform duration-300 group-hover:scale-[1.03]" />
            </div>
            <div className="p-5">
              <div className="text-lg font-extrabold text-zinc-50">{it.name}</div>
              <div className="mt-2 line-clamp-2 text-sm text-zinc-200/70">{it.description}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
