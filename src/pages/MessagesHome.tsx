import React, { useMemo, useState } from 'react'
import { useAuthStore, useCurrentUser } from '@/stores/useAuthStore'
import { useChatStore } from '@/stores/useChatStore'
import { useCommunityStore } from '@/stores/useCommunityStore'
import { LogIn, MessageCircle, Search, UserPlus } from 'lucide-react'

type Row =
  | {
      kind: 'assistant'
      id: 'assistant'
      title: string
      subtitle: string
      unread: number
    }
  | {
      kind: 'friend'
      id: string
      title: string
      subtitle: string
      unread: number
      avatar?: string
      lastAt: string
    }

export default function MessagesHome() {
  const user = useCurrentUser()
  const userId = useAuthStore((s) => s.currentUserId)
  const users = useAuthStore((s) => s.users)

  const friends = useChatStore((s) => s.friends)
  const requests = useChatStore((s) => s.requests)
  const messages = useChatStore((s) => s.messages)
  const requestFriend = useChatStore((s) => s.requestFriend)
  const assistantLastSeenCommentsAt = useChatStore((s) => s.assistantLastSeenCommentsAt)
  const assistantLastSeenRequestsAt = useChatStore((s) => s.assistantLastSeenRequestsAt)

  const posts = useCommunityStore((s) => s.posts)

  const [search, setSearch] = useState('')
  const [searchMsg, setSearchMsg] = useState<string | null>(null)

  const pendingRequestsCount = useMemo(() => {
    if (!userId) return 0
    return requests.filter((r) => r.toUserId === userId && r.status === 'pending').length
  }, [requests, userId])

  const receivedCommentsCount = useMemo(() => {
    if (!userId) return 0
    let count = 0
    for (const p of posts) {
      if (p.userId !== userId) continue
      for (const c of p.comments) {
        if (c.userId === userId) continue
        const seenAt = assistantLastSeenCommentsAt
        if (!seenAt || c.createdAt > seenAt) count++
      }
    }
    return count
  }, [assistantLastSeenCommentsAt, posts, userId])

  const pendingRequestsUnseen = useMemo(() => {
    if (!userId) return 0
    const seenAt = assistantLastSeenRequestsAt
    const list = requests.filter((r) => r.toUserId === userId && r.status === 'pending')
    if (!seenAt) return list.length
    return list.filter((r) => r.createdAt > seenAt).length
  }, [assistantLastSeenRequestsAt, requests, userId])

  const assistantUnread = pendingRequestsUnseen + receivedCommentsCount

  const acceptedFriends = useMemo(() => {
    if (!userId) return []
    return friends.filter((f) => f.userId === userId)
  }, [friends, userId])

  const unreadByFriend = useMemo(() => {
    const map = new Map<string, number>()
    if (!userId) return map
    for (const m of messages) {
      if (m.toUserId !== userId) continue
      if (m.read === true) continue
      map.set(m.fromUserId, (map.get(m.fromUserId) || 0) + 1)
    }
    return map
  }, [messages, userId])

  const lastMessageByFriend = useMemo(() => {
    const map = new Map<string, { content: string; createdAt: string }>()
    if (!userId) return map
    for (const m of messages) {
      const other = m.fromUserId === userId ? m.toUserId : m.fromUserId
      const prev = map.get(other)
      if (!prev || m.createdAt > prev.createdAt) {
        map.set(other, { content: m.kind === 'audio' ? `音频：${m.audioTitle || '音频'}` : m.content, createdAt: m.createdAt })
      }
    }
    return map
  }, [messages, userId])

  const rows = useMemo(() => {
    const list: Row[] = []

    list.push({
      kind: 'assistant',
      id: 'assistant',
      title: '消息助手',
      subtitle: pendingRequestsCount > 0 ? `好友申请 ${pendingRequestsCount} 条` : '评论与好友申请通知',
      unread: assistantUnread,
    })

    for (const f of acceptedFriends) {
      const u = users.find((x) => x.id === f.friendId)
      const last = lastMessageByFriend.get(f.friendId)
      list.push({
        kind: 'friend',
        id: f.friendId,
        title: u ? u.nickname : '未知用户',
        subtitle: last ? last.content : '还没有消息',
        unread: unreadByFriend.get(f.friendId) || 0,
        avatar: (u as any)?.avatarDataUrl as string | undefined,
        lastAt: last ? last.createdAt : f.createdAt,
      })
    }

    return list.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'assistant' ? -1 : 1
      if (a.kind === 'assistant' || b.kind === 'assistant') return 0
      return b.lastAt.localeCompare(a.lastAt)
    })
  }, [acceptedFriends, assistantUnread, lastMessageByFriend, pendingRequestsCount, unreadByFriend, users])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q || !userId) return []
    return users
      .filter((u) => u.id !== userId)
      .filter((u) => u.nickname.toLowerCase().includes(q) || u.account.includes(q))
      .slice(0, 6)
  }, [search, userId, users])

  if (!user) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/30 backdrop-blur-md">
        <h1 className="text-2xl font-extrabold text-zinc-50">消息</h1>
        <p className="mt-2 text-sm text-zinc-200/70">登录后可查看消息列表与消息助手。</p>
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
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-200/60" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setSearchMsg(null)
              }}
              className="w-full rounded-2xl border border-white/10 bg-white/10 py-3 pl-11 pr-4 text-sm text-zinc-50 outline-none placeholder:text-zinc-400 focus:border-emerald-400"
              placeholder="搜索用户名 / 添加好友"
            />
          </div>
        </div>

        {searchMsg ? <div className="mt-3 text-sm font-bold text-zinc-200/80">{searchMsg}</div> : null}

        {filteredUsers.length ? (
          <div className="mt-3 space-y-2">
            {filteredUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 ring-1 ring-white/5">
                <div className="flex items-center gap-3">
                  {(u as any)?.avatarDataUrl ? (
                    <img src={(u as any).avatarDataUrl} alt={u.nickname} className="h-9 w-9 rounded-full object-cover ring-1 ring-white/15" />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-white/10 ring-1 ring-white/10" />
                  )}
                  <div className="text-sm font-extrabold text-zinc-50">{u.nickname}</div>
                </div>
                <button
                  onClick={() => {
                    if (!userId) return
                    const res = requestFriend({ fromUserId: userId, toUsername: u.nickname, users })
                    setSearchMsg(res.ok ? '已发送好友申请' : 'error' in res ? res.error : '发送失败')
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-extrabold text-zinc-950 hover:bg-emerald-400"
                >
                  <UserPlus size={16} />
                  加好友
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-3 shadow-xl shadow-black/30 backdrop-blur-md">
        {rows.map((r) => {
          const href = r.kind === 'assistant' ? '#/assistant' : `#/messages/${r.id}`
          return (
            <a key={`${r.kind}-${r.id}`} href={href} className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 hover:bg-white/8">
              <div className="flex items-center gap-3">
                {r.kind === 'assistant' ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/15 ring-1 ring-white/10">
                    <MessageCircle size={18} className="text-emerald-200" />
                  </div>
                ) : r.avatar ? (
                  <img src={r.avatar} alt={r.title} className="h-10 w-10 rounded-full object-cover ring-1 ring-white/15" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-white/10 ring-1 ring-white/10" />
                )}

                <div>
                  <div className="text-sm font-extrabold text-zinc-50">{r.title}</div>
                  <div className="mt-1 line-clamp-1 text-xs font-bold text-zinc-200/60">{r.subtitle}</div>
                </div>
              </div>

              {r.unread > 0 ? (
                <div className="min-w-[22px] rounded-full bg-rose-500 px-2 py-0.5 text-center text-[11px] font-extrabold text-zinc-950">
                  {r.unread > 99 ? '99+' : r.unread}
                </div>
              ) : null}
            </a>
          )
        })}
      </div>
    </div>
  )
}
