import React, { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuthStore, useCurrentUser } from '@/stores/useAuthStore'
import { useChatStore } from '@/stores/useChatStore'
import { useMyRecordings } from '@/stores/useLibraryStore'
import { ArrowLeft, LogIn, Music2, Send } from 'lucide-react'

export default function ChatPage() {
  const params = useParams()
  const friendId = params.friendId || ''

  const user = useCurrentUser()
  const userId = useAuthStore((s) => s.currentUserId)
  const users = useAuthStore((s) => s.users)
  const friends = useChatStore((s) => s.friends)
  const messages = useChatStore((s) => s.messages)
  const sendText = useChatStore((s) => s.sendText)
  const sendAudio = useChatStore((s) => s.sendAudio)
  const markConversationRead = useChatStore((s) => s.markConversationRead)

  const myRecordings = useMyRecordings(userId)
  const [draft, setDraft] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)

  const friend = users.find((u) => u.id === friendId)
  const avatar = (friend as any)?.avatarDataUrl as string | undefined

  const isFriend = useMemo(() => {
    if (!userId) return false
    return friends.some((f) => f.userId === userId && f.friendId === friendId)
  }, [friendId, friends, userId])

  const convo = useMemo(() => {
    if (!userId || !friendId) return []
    return messages
      .filter((m) => (m.fromUserId === userId && m.toUserId === friendId) || (m.fromUserId === friendId && m.toUserId === userId))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }, [friendId, messages, userId])

  React.useEffect(() => {
    if (!userId || !friendId) return
    markConversationRead({ userId, friendId })
  }, [friendId, markConversationRead, userId])

  if (!user) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/30 backdrop-blur-md">
        <div className="text-2xl font-extrabold text-zinc-50">聊天</div>
        <div className="mt-2 text-sm text-zinc-200/70">登录后可聊天。</div>
        <a
          href="#/login"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-extrabold text-zinc-950 shadow-lg shadow-emerald-500/10 hover:bg-emerald-400"
        >
          <LogIn size={18} />
          去登录
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/30 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <a href="#/messages" className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-sm font-extrabold text-zinc-100 ring-1 ring-white/10 hover:bg-white/15">
              <ArrowLeft size={18} />
              返回
            </a>
            {avatar ? <img src={avatar} alt={friend ? friend.nickname : '好友'} className="h-10 w-10 rounded-full object-cover ring-1 ring-white/15" /> : <div className="h-10 w-10 rounded-full bg-white/10 ring-1 ring-white/10" />}
            <div>
              <div className="text-lg font-extrabold text-zinc-50">{friend ? friend.nickname : '未知用户'}</div>
              <div className="mt-1 text-xs font-bold text-zinc-200/60">仅支持发送文字与音频库音频</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-black/30 backdrop-blur-md">
        {!isFriend ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">未成为好友，无法聊天。</div>
        ) : null}

        <div className="mt-3 h-[420px] overflow-auto rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          {convo.length === 0 ? <div className="text-sm text-zinc-200/70">还没有消息。</div> : null}
          <div className="space-y-3">
            {convo.map((m) => {
              const mine = m.fromUserId === userId
              if ((m.kind || 'text') === 'audio' && m.audioDataUrl) {
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${mine ? 'bg-emerald-500 text-zinc-950' : 'bg-white/10 text-zinc-100 ring-1 ring-white/10'} shadow-sm`}>
                      <div className="text-sm font-extrabold">音频：{m.audioTitle || '音频'}</div>
                      <audio className="mt-2 w-full" controls src={m.audioDataUrl} />
                      <div className={`mt-2 text-[11px] font-bold ${mine ? 'text-zinc-950/70' : 'text-zinc-200/60'}`}>{new Date(m.createdAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                )
              }
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${mine ? 'bg-emerald-500 text-zinc-950' : 'bg-white/10 text-zinc-100 ring-1 ring-white/10'} shadow-sm`}>
                    {m.content}
                    <div className={`mt-1 text-[11px] font-bold ${mine ? 'text-zinc-950/70' : 'text-zinc-200/60'}`}>{new Date(m.createdAt).toLocaleTimeString()}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!isFriend}
            onClick={() => setPickerOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-extrabold text-zinc-100 ring-1 ring-white/10 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Music2 size={18} />
            发送音频
          </button>

          <form
            className="flex flex-1 gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!userId || !friendId || !isFriend) return
              sendText({ fromUserId: userId, toUserId: friendId, content: draft })
              markConversationRead({ userId, friendId })
              setDraft('')
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-zinc-50 outline-none placeholder:text-zinc-400 focus:border-emerald-400"
              placeholder={isFriend ? '输入消息…' : '未成为好友'}
              disabled={!isFriend}
            />
            <button
              type="submit"
              disabled={!isFriend}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-extrabold text-zinc-950 shadow-lg shadow-emerald-500/10 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={18} />
              发送
            </button>
          </form>
        </div>

        {pickerOpen ? (
          <div className="mt-3 rounded-3xl border border-white/10 bg-white/5 p-4 ring-1 ring-white/5">
            <div className="text-sm font-extrabold text-zinc-50">从音频库选择要发送的音频</div>
            {myRecordings.length === 0 ? <div className="mt-2 text-sm text-zinc-200/70">暂无音频，可去演奏或编曲保存后再来发送。</div> : null}
            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
              {myRecordings.slice(0, 12).map((r) => (
                <div key={r.id} className="rounded-2xl border border-white/10 bg-white/5 p-3 ring-1 ring-white/5">
                  <div className="text-sm font-extrabold text-zinc-50 line-clamp-1">{r.title}</div>
                  <audio className="mt-2 w-full" controls src={r.dataUrl} />
                  <button
                    onClick={() => {
                      if (!userId || !friendId || !isFriend) return
                      sendAudio({ fromUserId: userId, toUserId: friendId, audioTitle: r.title, audioDataUrl: r.dataUrl })
                      markConversationRead({ userId, friendId })
                      setPickerOpen(false)
                    }}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-extrabold text-zinc-950 hover:bg-emerald-400"
                  >
                    发送该音频
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
