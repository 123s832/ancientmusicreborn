import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface FriendEdge {
  id: string
  userId: string
  friendId: string
  createdAt: string
}

export interface FriendRequest {
  id: string
  fromUserId: string
  toUserId: string
  createdAt: string
  status: 'pending' | 'accepted' | 'rejected'
}

export interface ChatMessage {
  id: string
  fromUserId: string
  toUserId: string
  kind?: 'text' | 'audio'
  content: string
  audioTitle?: string
  audioDataUrl?: string
  createdAt: string
  read?: boolean
}

interface ChatState {
  friends: FriendEdge[]
  requests: FriendRequest[]
  messages: ChatMessage[]
  requestFriend: (args: { fromUserId: string; toUsername: string; users: Array<{ id: string; nickname: string }> }) => { ok: true } | { ok: false; error: string }
  acceptRequest: (requestId: string, userId: string) => void
  rejectRequest: (requestId: string, userId: string) => void
  sendText: (m: { fromUserId: string; toUserId: string; content: string }) => void
  sendAudio: (m: { fromUserId: string; toUserId: string; audioTitle: string; audioDataUrl: string }) => void
  markConversationRead: (args: { userId: string; friendId: string }) => void
  assistantLastSeenCommentsAt: string | null
  assistantLastSeenRequestsAt: string | null
  markAssistantSeen: (args: { commentsAt?: string; requestsAt?: string }) => void
}

function uid() {
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      friends: [],
      requests: [],
      messages: [],
      assistantLastSeenCommentsAt: null,
      assistantLastSeenRequestsAt: null,
      requestFriend: ({ fromUserId, toUsername, users }) => {
        const name = toUsername.trim()
        if (!name) return { ok: false, error: '请输入用户名' }
        const target = users.find((u) => u.nickname.toLowerCase() === name.toLowerCase())
        if (!target) return { ok: false, error: '未找到该用户' }
        if (target.id === fromUserId) return { ok: false, error: '不能添加自己' }

        const alreadyFriends = get().friends.some((f) => f.userId === fromUserId && f.friendId === target.id)
        if (alreadyFriends) return { ok: false, error: '已是好友' }

        const pending = get().requests.some(
          (r) =>
            r.status === 'pending' &&
            ((r.fromUserId === fromUserId && r.toUserId === target.id) || (r.fromUserId === target.id && r.toUserId === fromUserId)),
        )
        if (pending) return { ok: false, error: '已发送过申请' }

        const now = new Date().toISOString()
        const req: FriendRequest = { id: uid(), fromUserId, toUserId: target.id, createdAt: now, status: 'pending' }
        set({ requests: [...get().requests, req] })
        return { ok: true }
      },
      acceptRequest: (requestId, userId) => {
        const req = get().requests.find((r) => r.id === requestId)
        if (!req) return
        if (req.toUserId !== userId) return
        if (req.status !== 'pending') return
        const now = new Date().toISOString()
        const a: FriendEdge = { id: uid(), userId: req.toUserId, friendId: req.fromUserId, createdAt: now }
        const b: FriendEdge = { id: uid(), userId: req.fromUserId, friendId: req.toUserId, createdAt: now }
        set({
          friends: [...get().friends, a, b],
          requests: get().requests.map((r) => (r.id === requestId ? { ...r, status: 'accepted' } : r)),
        })
      },
      rejectRequest: (requestId, userId) => {
        const req = get().requests.find((r) => r.id === requestId)
        if (!req) return
        if (req.toUserId !== userId) return
        if (req.status !== 'pending') return
        set({ requests: get().requests.map((r) => (r.id === requestId ? { ...r, status: 'rejected' } : r)) })
      },
      sendText: (m) => {
        const content = m.content.trim()
        if (!content) return
        const msg: ChatMessage = {
          id: uid(),
          fromUserId: m.fromUserId,
          toUserId: m.toUserId,
          kind: 'text',
          content,
          createdAt: new Date().toISOString(),
          read: false,
        }
        set({ messages: [...get().messages, msg] })
      },
      sendAudio: (m) => {
        const title = m.audioTitle.trim() || '音频'
        const msg: ChatMessage = {
          id: uid(),
          fromUserId: m.fromUserId,
          toUserId: m.toUserId,
          kind: 'audio',
          content: '发送了一段音频',
          audioTitle: title,
          audioDataUrl: m.audioDataUrl,
          createdAt: new Date().toISOString(),
          read: false,
        }
        set({ messages: [...get().messages, msg] })
      },
      markConversationRead: ({ userId, friendId }) => {
        set({
          messages: get().messages.map((m) => {
            if (m.toUserId !== userId) return m
            if (m.fromUserId !== friendId) return m
            if (m.read === true) return m
            return { ...m, read: true }
          }),
        })
      },
      markAssistantSeen: ({ commentsAt, requestsAt }) => {
        set({
          assistantLastSeenCommentsAt: commentsAt ?? get().assistantLastSeenCommentsAt,
          assistantLastSeenRequestsAt: requestsAt ?? get().assistantLastSeenRequestsAt,
        })
      },
    }),
    { name: 'wwyy-chat-v1' },
  ),
)
