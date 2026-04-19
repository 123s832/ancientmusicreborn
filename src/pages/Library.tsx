import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore, useCurrentUser } from '@/stores/useAuthStore'
import { useLibraryStore, useMyRecordings } from '@/stores/useLibraryStore'
import { useCommunityStore } from '@/stores/useCommunityStore'
import { Download, Library, LogIn, Share2, Trash2 } from 'lucide-react'

function downloadDataUrl(filename: string, dataUrl: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export default function LibraryPage() {
  const user = useCurrentUser()
  const userId = useAuthStore((s) => s.currentUserId)
  const recordings = useMyRecordings(userId)
  const remove = useLibraryStore((s) => s.removeRecording)
  const createPost = useCommunityStore((s) => s.createPost)

  const [toast, setToast] = useState<string | null>(null)

  const sorted = useMemo(() => {
    return [...recordings].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [recordings])

  if (!user) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/30 backdrop-blur-md">
        <div className="flex items-center gap-2 text-lg font-extrabold text-zinc-50">
          <Library size={20} />
          音频库
        </div>
        <p className="mt-2 text-sm text-zinc-200/70">登录后可查看录制并自动保存的音频。</p>
        <Link
          to="/login"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-extrabold text-zinc-950 shadow-lg shadow-emerald-500/10 hover:bg-emerald-400"
        >
          <LogIn size={18} />
          去登录
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-2xl font-extrabold text-zinc-50">
              <Library size={22} />
              音频库
            </div>
            <div className="mt-1 text-sm text-zinc-200/70">录制停止或编曲保存后会自动进入这里，可试听、发布或删除。</div>
          </div>

          <Link
            to="/play"
            className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-extrabold text-zinc-950 shadow-lg shadow-emerald-500/10 hover:bg-emerald-400"
          >
            去演奏录音
          </Link>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-zinc-200/70 shadow-xl shadow-black/30 backdrop-blur-md">
          还没有录音。去“文物演奏”录一段，它会自动保存到音频库。
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {sorted.map((r) => (
            <div key={r.id} className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm ring-1 ring-white/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold text-zinc-50">{r.title}</div>
                  <div className="mt-1 text-xs font-bold text-zinc-200/60">{new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      if (!userId) return
                      createPost({
                        userId,
                        title: r.title,
                        description: '来自音频库的录音发布',
                        audioDataUrl: r.dataUrl,
                      })
                      setToast('发布成功')
                      window.setTimeout(() => setToast(null), 1400)
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs font-extrabold text-zinc-100 ring-1 ring-white/10 hover:bg-white/15"
                  >
                    <Share2 size={16} />
                    发布
                  </button>

                  <button
                    onClick={() => downloadDataUrl(`${r.title}.webm`, r.dataUrl)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400/15 px-3 py-2 text-xs font-extrabold text-emerald-200 hover:bg-emerald-400/20"
                  >
                    <Download size={16} />
                    下载
                  </button>

                  <button
                    onClick={() => {
                      remove(r.id)
                      setToast('已删除')
                      window.setTimeout(() => setToast(null), 1200)
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-rose-500/10 px-3 py-2 text-xs font-extrabold text-rose-200 hover:bg-rose-500/15"
                  >
                    <Trash2 size={16} />
                    删除
                  </button>
                </div>
              </div>

              <audio className="mt-4 w-full" controls src={r.dataUrl} />
            </div>
          ))}
        </div>
      )}

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-zinc-950/85 px-4 py-2 text-sm font-bold text-zinc-100 shadow-2xl ring-1 ring-white/10 backdrop-blur">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
