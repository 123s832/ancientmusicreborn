import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Comment {
  id: string
  userId: string
  content: string
  createdAt: string
}

export interface Post {
  id: string
  userId: string
  title: string
  description: string
  audioDataUrl: string | null
  createdAt: string
  likes: string[]
  comments: Comment[]
}

interface CommunityState {
  posts: Post[]
  createPost: (p: { userId: string; title: string; description: string; audioDataUrl: string | null }) => void
  toggleLike: (postId: string, userId: string) => void
  addComment: (postId: string, c: { userId: string; content: string }) => void
  removePost: (postId: string, userId: string) => { ok: true } | { ok: false; error: string }
}

function uid() {
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`
}

export const useCommunityStore = create<CommunityState>()(
  persist(
    (set, get) => ({
      posts: [],
      createPost: (p) => {
        const next: Post = {
          id: uid(),
          userId: p.userId,
          title: p.title.trim() || '未命名作品',
          description: p.description.trim(),
          audioDataUrl: p.audioDataUrl,
          createdAt: new Date().toISOString(),
          likes: [],
          comments: [],
        }
        set({ posts: [next, ...get().posts] })
      },
      toggleLike: (postId, userId) => {
        set({
          posts: get().posts.map((p) => {
            if (p.id !== postId) return p
            const liked = p.likes.includes(userId)
            return { ...p, likes: liked ? p.likes.filter((x) => x !== userId) : [...p.likes, userId] }
          }),
        })
      },
      addComment: (postId, c) => {
        const content = c.content.trim()
        if (!content) return
        set({
          posts: get().posts.map((p) => {
            if (p.id !== postId) return p
            return {
              ...p,
              comments: [
                ...p.comments,
                { id: uid(), userId: c.userId, content, createdAt: new Date().toISOString() },
              ],
            }
          }),
        })
      },
      removePost: (postId, userId) => {
        const p = get().posts.find((x) => x.id === postId)
        if (!p) return { ok: false, error: '作品不存在' }
        if (p.userId !== userId) return { ok: false, error: '无权限删除' }
        set({ posts: get().posts.filter((x) => x.id !== postId) })
        return { ok: true }
      },
    }),
    { name: 'wwyy-community-v1' },
  ),
)
