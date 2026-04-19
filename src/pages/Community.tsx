import React, { useMemo, useState } from 'react'
import { useAuthStore, useCurrentUser } from '@/stores/useAuthStore'
import { useCommunityStore } from '@/stores/useCommunityStore'
import { Heart, LogIn, MessageCircle } from 'lucide-react'

export default function Community() {
  const user = useCurrentUser()
  const userId = useAuthStore((s) => s.currentUserId)
  const users = useAuthStore((s) => s.users)
  const posts = useCommunityStore((s) => s.posts)
  const toggleLike = useCommunityStore((s) => s.toggleLike)
  const addComment = useCommunityStore((s) => s.addComment)

  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({})
  const [showCommentInput, setShowCommentInput] = useState<Record<string, boolean>>({})

  const sorted = useMemo(() => [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [posts])

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-50">社区作品</h1>
            <p className="mt-2 text-sm text-zinc-200/70">作品从“音频库”发布后会出现在这里，支持点赞和评论。</p>
          </div>
          {!user ? (
            <a
              href="#/login"
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-extrabold text-zinc-950 shadow-lg shadow-emerald-500/10 hover:bg-emerald-400"
            >
              <LogIn size={18} />
              登录互动
            </a>
          ) : null}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-zinc-200/70 shadow-xl shadow-black/30 backdrop-blur-md">
          暂无作品。去“音频库”选择一条音频点击“发布”，这里就会显示。
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((p) => {
            const author = users.find((u) => u.id === p.userId) as any
            const avatar = author?.avatarDataUrl as string | undefined
            const liked = userId ? p.likes.includes(userId) : false

            return (
              <div key={p.id} className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-xl shadow-black/30 backdrop-blur-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {avatar ? (
                      <img src={avatar} alt={author ? author.nickname : '用户头像'} className="h-10 w-10 rounded-full object-cover ring-1 ring-white/20" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-white/10 ring-1 ring-white/15" />
                    )}
                    <div>
                      <div className="text-sm font-extrabold text-zinc-50 line-clamp-1">{p.title}</div>
                      <div className="mt-1 text-[11px] font-bold text-zinc-200/60 line-clamp-1">
                        {author ? author.nickname : '未知用户'} · {new Date(p.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {p.description ? <div className="mt-3 text-sm text-zinc-200/75 line-clamp-3">{p.description}</div> : null}

                {p.audioDataUrl ? <audio className="mt-3 w-full" controls src={p.audioDataUrl} /> : null}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    disabled={!userId}
                    onClick={() => {
                      if (!userId) return
                      toggleLike(p.id, userId)
                    }}
                    className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-extrabold ring-1 ring-white/10 ${liked ? 'bg-rose-500 text-zinc-950 hover:bg-rose-400' : 'bg-white/10 text-zinc-100 hover:bg-white/15'
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <Heart size={16} />
                    {p.likes.length}
                  </button>

                  <button
                    disabled={!userId}
                    onClick={() => {
                      if (!userId) return
                      setShowCommentInput({ ...showCommentInput, [p.id]: !showCommentInput[p.id] })
                    }}
                    className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-extrabold ring-1 ring-white/10 ${showCommentInput[p.id] ? 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400' : 'bg-white/10 text-zinc-100 hover:bg-white/15'} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <MessageCircle size={16} />
                    {p.comments.length}
                  </button>
                </div>

                <div className="mt-3 space-y-3">
                  {p.comments.length ? (
                    <div className="space-y-2 rounded-2xl bg-white/6 p-4 ring-1 ring-white/10">
                      {p.comments.slice(-3).map((c) => {
                        const cu = users.find((u) => u.id === c.userId) as any
                        const cAvatar = cu?.avatarDataUrl as string | undefined
                        return (
                          <div key={c.id} className="flex items-start gap-2">
                            {cAvatar ? (
                              <img src={cAvatar} alt={cu ? cu.nickname : '用户头像'} className="mt-0.5 h-7 w-7 rounded-full object-cover ring-1 ring-white/15" />
                            ) : (
                              <div className="mt-0.5 h-7 w-7 rounded-full bg-white/10 ring-1 ring-white/10" />
                            )}
                            <div className="text-sm">
                              <span className="font-extrabold text-zinc-50">{cu ? cu.nickname : '匿名'}</span>
                              <span className="ml-2 text-zinc-200/75">{c.content}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : null}

                  {showCommentInput[p.id] ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={commentDraft[p.id] || ''}
                        onChange={(e) => setCommentDraft({ ...commentDraft, [p.id]: e.target.value })}
                        className="flex-1 rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-black outline-none placeholder:text-zinc-500 focus:border-emerald-400"
                        placeholder={userId ? '写下评论…' : '登录后才能评论'}
                        disabled={!userId}
                        autoFocus
                      />
                      <button
                        disabled={!userId}
                        onClick={() => {
                          if (!userId) return
                          addComment(p.id, { userId, content: commentDraft[p.id] || '' })
                          setCommentDraft({ ...commentDraft, [p.id]: '' })
                          setShowCommentInput({ ...showCommentInput, [p.id]: false })
                        }}
                        className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-extrabold text-zinc-950 shadow-lg shadow-emerald-500/10 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        发送
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

