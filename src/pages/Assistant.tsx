import React, { useMemo } from 'react'
import { useAuthStore, useCurrentUser } from '@/stores/useAuthStore'
import { useChatStore } from '@/stores/useChatStore'
import { useCommunityStore } from '@/stores/useCommunityStore'
import { Check, LogIn, MessageCircle, UserPlus, X } from 'lucide-react'

export default function AssistantPage() {
  const user = useCurrentUser()
  const userId = useAuthStore((s) => s.currentUserId)
  const users = useAuthStore((s) => s.users)
  const posts = useCommunityStore((s) => s.posts)
  const requests = useChatStore((s) => s.requests)
  const acceptRequest = useChatStore((s) => s.acceptRequest)
  const rejectRequest = useChatStore((s) => s.rejectRequest)
  const assistantLastSeenCommentsAt = useChatStore((s) => s.assistantLastSeenCommentsAt)
  const assistantLastSeenRequestsAt = useChatStore((s) => s.assistantLastSeenRequestsAt)
  const markAssistantSeen = useChatStore((s) => s.markAssistantSeen)

  const pendingRequests = useMemo(() => {
    if (!userId) return []
    return requests
      .filter((r) => r.toUserId === userId && r.status === 'pending')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [requests, userId])

  const receivedComments = useMemo(() => {
    if (!userId) return []
    const items: Array<{ postId: string; postTitle: string; fromUserId: string; content: string; createdAt: string }> = []
    for (const p of posts) {
      if (p.userId !== userId) continue
      for (const c of p.comments) {
        if (c.userId === userId) continue
        items.push({ postId: p.id, postTitle: p.title, fromUserId: c.userId, content: c.content, createdAt: c.createdAt })
      }
    }
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [posts, userId])

  React.useEffect(() => {
    const now = new Date().toISOString()
    markAssistantSeen({ commentsAt: now, requestsAt: now })
  }, [markAssistantSeen])

  if (!user) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/30 backdrop-blur-md">
        <div className="text-2xl font-extrabold text-zinc-50">消息助手</div>
        <div className="mt-2 text-sm text-zinc-200/70">登录后可查看评论通知与好友申请。</div>
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

  const unseenRequests = assistantLastSeenRequestsAt
    ? pendingRequests.filter((r) => r.createdAt > assistantLastSeenRequestsAt)
    : pendingRequests
  const unseenComments = assistantLastSeenCommentsAt
    ? receivedComments.filter((c) => c.createdAt > assistantLastSeenCommentsAt)
    : receivedComments

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-2xl font-extrabold text-zinc-50">消息助手</div>
            <div className="mt-1 text-sm text-zinc-200/70">集中查看：收到的评论、好友申请。</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-rose-500 px-3 py-1 text-xs font-extrabold text-zinc-950">未读 {Math.min(999, unseenRequests.length + unseenComments.length)}</div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur-md">
        <div className="flex items-center gap-2 text-lg font-extrabold text-zinc-50">
          <UserPlus size={18} />
          好友申请
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-extrabold text-zinc-200 ring-1 ring-white/10">{pendingRequests.length}</span>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-200/70">暂无好友申请。</div>
        ) : (
          <div className="mt-4 space-y-2">
            {pendingRequests.map((r) => {
              const from = users.find((u) => u.id === r.fromUserId)
              const avatar = (from as any)?.avatarDataUrl as string | undefined
              return (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 ring-1 ring-white/5">
                  <div className="flex items-center gap-3">
                    {avatar ? (
                      <img src={avatar} alt={from ? from.nickname : '用户头像'} className="h-10 w-10 rounded-full object-cover ring-1 ring-white/15" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-white/10 ring-1 ring-white/10" />
                    )}
                    <div>
                      <div className="text-sm font-extrabold text-zinc-50">{from ? from.nickname : '未知用户'}</div>
                      <div className="mt-1 text-xs font-bold text-zinc-200/60">{new Date(r.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        acceptRequest(r.id, userId!)
                      }}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-extrabold text-zinc-950 hover:bg-emerald-400"
                    >
                      <Check size={16} />
                      同意
                    </button>
                    <button
                      onClick={() => {
                        rejectRequest(r.id, userId!)
                      }}
                      className="inline-flex items-center gap-2 rounded-2xl bg-rose-500/10 px-3 py-2 text-xs font-extrabold text-rose-200 hover:bg-rose-500/15"
                    >
                      <X size={16} />
                      拒绝
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur-md">
        <div className="flex items-center gap-2 text-lg font-extrabold text-zinc-50">
          <MessageCircle size={18} />
          收到的评论
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-extrabold text-zinc-200 ring-1 ring-white/10">{receivedComments.length}</span>
        </div>

        {receivedComments.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-200/70">暂无评论通知。你可以在“音频库”发布作品后，别人评论会出现在这里。</div>
        ) : (
          <div className="mt-4 space-y-2">
            {receivedComments.slice(0, 20).map((c) => {
              const from = users.find((u) => u.id === c.fromUserId)
              const avatar = (from as any)?.avatarDataUrl as string | undefined
              const unread = assistantLastSeenCommentsAt ? c.createdAt > assistantLastSeenCommentsAt : true
              return (
                <div key={`${c.postId}-${c.createdAt}`} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 ring-1 ring-white/5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {avatar ? (
                        <img src={avatar} alt={from ? from.nickname : '用户头像'} className="mt-0.5 h-10 w-10 rounded-full object-cover ring-1 ring-white/15" />
                      ) : (
                        <div className="mt-0.5 h-10 w-10 rounded-full bg-white/10 ring-1 ring-white/10" />
                      )}
                      <div>
                        <div className="text-sm font-extrabold text-zinc-50">
                          {from ? from.nickname : '匿名'}
                          {unread ? <span className="ml-2 rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-extrabold text-zinc-950">未读</span> : null}
                        </div>
                        <div className="mt-1 text-xs font-bold text-zinc-200/60">作品：{c.postTitle}</div>
                        <div className="mt-2 text-sm text-zinc-200/75">{c.content}</div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-zinc-200/60">{new Date(c.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
