import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore, useCurrentUser } from '@/stores/useAuthStore'
import { useLibraryStore, useMyRecordings } from '@/stores/useLibraryStore'
import { useCommunityStore } from '@/stores/useCommunityStore'
import { useChatStore } from '@/stores/useChatStore'
import { getRandomInstrumentAvatarDataUrl } from '@/utils/defaultAvatar'
import { Trash2, Download, Music2, LogIn, Share2, MessageCircle, Library } from 'lucide-react'

function downloadDataUrl(filename: string, dataUrl: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export default function Profile() {
  const user = useCurrentUser()
  const userId = useAuthStore((s) => s.currentUserId)
  const users = useAuthStore((s) => s.users)
  const updateAvatar = useAuthStore((s) => s.updateAvatar)
  const remove = useLibraryStore((s) => s.removeRecording)
  const recordings = useMyRecordings(userId)
  const posts = useCommunityStore((s) => s.posts)
  const removePost = useCommunityStore((s) => s.removePost)
  const createPost = useCommunityStore((s) => s.createPost)
  const chatMessages = useChatStore((s) => s.messages)

  const myPosts = useMemo(() => (userId ? posts.filter((p) => p.userId === userId) : []), [posts, userId])

  const unreadCount = useMemo(() => {
    if (!userId) return 0
    return chatMessages.reduce((acc, m) => {
      if (m.toUserId !== userId) return acc
      if (m.read === true) return acc
      return acc + 1
    }, 0)
  }, [chatMessages, userId])

  const [libraryMsg, setLibraryMsg] = useState<string | null>(null)
  const [avatarMsg, setAvatarMsg] = useState<string | null>(null)

  if (!user) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/30 backdrop-blur-md">
        <h1 className="text-2xl font-extrabold text-zinc-50">个人主页</h1>
        <p className="mt-2 text-sm text-zinc-200/70">登录后即可查看你的音频库与作品。</p>
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

  const avatar = user.avatarDataUrl || getRandomInstrumentAvatarDataUrl(user.id)

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-50">{user.nickname}</h1>
            <div className="mt-1 text-sm text-zinc-200/70">欢迎回来，管理你的录音与作品。</div>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-zinc-200 ring-1 ring-white/10">
            录音数量：{recordings.length}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4">
          {avatar ? <img src={avatar} alt="头像" className="h-16 w-16 rounded-full object-cover ring-1 ring-white/20" /> : <div className="h-16 w-16 rounded-full bg-white/10 ring-1 ring-white/15" />}
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-extrabold text-zinc-100 ring-1 ring-white/10 hover:bg-white/15">
              更换头像
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f || !userId) return
                  try {
                    const { fileToCircularAvatarDataUrl } = await import('@/utils/avatar')
                    const url = await fileToCircularAvatarDataUrl(f, 256)
                    updateAvatar({ userId, avatarDataUrl: url })
                    setAvatarMsg('头像已更新')
                    window.setTimeout(() => setAvatarMsg(null), 1400)
                  } catch (err) {
                    setAvatarMsg(err instanceof Error ? err.message : '更新头像失败')
                    window.setTimeout(() => setAvatarMsg(null), 1600)
                  }
                }}
              />
            </label>
            {user.avatarDataUrl ? (
              <button
                onClick={() => {
                  if (!userId) return
                  updateAvatar({ userId, avatarDataUrl: null })
                  setAvatarMsg('头像已清除')
                  window.setTimeout(() => setAvatarMsg(null), 1400)
                }}
                className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm font-extrabold text-rose-200 hover:bg-rose-500/15"
              >
                清除头像
              </button>
            ) : null}
            {avatarMsg ? <div className="text-sm font-bold text-zinc-200/80">{avatarMsg}</div> : null}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <a
            href="#/library"
            className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-sm ring-1 ring-white/5 hover:bg-white/8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-extrabold text-zinc-50">
                <Library size={18} />
                音频库
              </div>
              <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-extrabold text-emerald-200">{recordings.length}</div>
            </div>
            <div className="mt-2 text-xs font-bold text-zinc-200/60">试听 / 发布 / 删除</div>
          </a>

          <a
            href="#/profile"
            onClick={(e) => {
              e.preventDefault()
              location.hash = '#/profile'
              window.setTimeout(() => document.getElementById('my-posts')?.scrollIntoView({ behavior: 'smooth' }), 0)
            }}
            className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-sm ring-1 ring-white/5 hover:bg-white/8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-extrabold text-zinc-50">
                <Share2 size={18} />
                我发布的作品
              </div>
              <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-extrabold text-emerald-200">{myPosts.length}</div>
            </div>
            <div className="mt-2 text-xs font-bold text-zinc-200/60">社区作品列表</div>
          </a>

          <a
            href="#/messages"
            className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-sm ring-1 ring-white/5 hover:bg-white/8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-extrabold text-zinc-50">
                <MessageCircle size={18} />
                消息
              </div>
              {unreadCount > 0 ? (
                <div className="rounded-full bg-rose-500 px-3 py-1 text-xs font-extrabold text-zinc-950">未读 {unreadCount > 99 ? '99+' : unreadCount}</div>
              ) : (
                <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-zinc-200/70">无未读</div>
              )}
            </div>
            <div className="mt-2 text-xs font-bold text-zinc-200/60">聊天 / 提醒</div>
          </a>
        </div>

      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-zinc-50">我的音频库</h2>
          <div className="flex items-center gap-2">
            <Link to="/library" className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-extrabold text-zinc-100 ring-1 ring-white/10 hover:bg-white/15">
              打开音频库
            </Link>
            <Link to="/play" className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-extrabold text-zinc-950 shadow-lg shadow-emerald-500/10 hover:bg-emerald-400">
              去录音
            </Link>
          </div>
        </div>

        {recordings.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-200/70">
            你还没有录音，去“文物演奏”录制一段吧。
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {recordings.map((r) => (
              <div key={r.id} className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm ring-1 ring-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-extrabold text-zinc-50">
                      <Music2 size={18} />
                      {r.title}
                    </div>
                    <div className="mt-1 text-xs font-bold text-zinc-200/60">{new Date(r.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (!userId) return
                        createPost({
                          userId,
                          title: r.title,
                          description: '来自音频库的录音发布',
                          audioDataUrl: r.dataUrl,
                        })
                        setLibraryMsg('已发布到社区')
                        window.setTimeout(() => setLibraryMsg(null), 1400)
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
                      onClick={() => remove(r.id)}
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

        {libraryMsg ? <div className="mt-4 text-sm font-bold text-zinc-200/80">{libraryMsg}</div> : null}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur-md" id="my-posts">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-zinc-50">我发布的作品</h2>
          <a href="#/library" className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-extrabold text-zinc-100 ring-1 ring-white/10 hover:bg-white/15">
            去音频库发布
          </a>
        </div>

        {myPosts.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-200/70">你还没有发布社区作品。</div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {myPosts.map((p) => (
              <div key={p.id} className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm ring-1 ring-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-extrabold text-zinc-50">{p.title}</div>
                    <div className="mt-1 text-xs font-bold text-zinc-200/60">{new Date(p.createdAt).toLocaleString()} · 点赞 {p.likes.length} · 评论 {p.comments.length}</div>
                    {p.description ? <div className="mt-2 text-sm text-zinc-200/75">{p.description}</div> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="#/library"
                      className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs font-extrabold text-zinc-100 ring-1 ring-white/10 hover:bg-white/15"
                    >
                      <Share2 size={16} />
                      查看
                    </a>
                    <button
                      onClick={() => {
                        if (!userId) return
                        removePost(p.id, userId)
                      }}
                      className="inline-flex items-center gap-2 rounded-2xl bg-rose-500/10 px-3 py-2 text-xs font-extrabold text-rose-200 hover:bg-rose-500/15"
                    >
                      <Trash2 size={16} />
                      删除
                    </button>
                  </div>
                </div>
                {p.audioDataUrl ? <audio className="mt-4 w-full" controls src={p.audioDataUrl} /> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
