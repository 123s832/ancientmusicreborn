import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  account: string
  nickname: string
  password: string
  bio?: string
  avatarDataUrl?: string
  createdAt: string
}

interface AuthState {
  users: User[]
  currentUserId: string | null
  register: (account: string, password: string) => { ok: true } | { ok: false; error: string }
  login: (account: string, password: string) => { ok: true } | { ok: false; error: string }
  logout: () => void
  updateNickname: (args: { userId: string; nickname: string }) => { ok: true } | { ok: false; error: string }
  updateBio: (args: { userId: string; bio: string }) => void
  updateAvatar: (args: { userId: string; avatarDataUrl: string | null }) => void
}

function normalizeAccount(v: string) {
  return v.trim().toLowerCase()
}

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

function isPhone(v: string) {
  return /^1\d{10}$/.test(v)
}

function isValidAccount(v: string) {
  const a = normalizeAccount(v)
  return isEmail(a) || isPhone(a)
}

function uid() {
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      users: [],
      currentUserId: null,
      register: (account, password) => {
        const a = normalizeAccount(account)
        if (!a) return { ok: false, error: '请输入手机号或邮箱' }
        if (!isValidAccount(a)) return { ok: false, error: '请输入正确的手机号或邮箱' }
        if (password.length < 6) return { ok: false, error: '密码至少 6 位' }
        const exists = get().users.some((x) => x.account === a)
        if (exists) return { ok: false, error: '该账号已注册' }
        const newUser: User = {
          id: uid(),
          account: a,
          nickname: isPhone(a) ? `用户${a.slice(-4)}` : a.split('@')[0].slice(0, 12) || '用户',
          password,
          createdAt: new Date().toISOString(),
        }
        set({ users: [...get().users, newUser] })
        return { ok: true }
      },
      login: (account, password) => {
        const a = normalizeAccount(account)
        if (!a) return { ok: false, error: '请输入手机号或邮箱' }
        const found = get().users.find((x) => x.account === a)
        if (!found) return { ok: false, error: '账号不存在，请先注册' }
        if (found.password !== password) return { ok: false, error: '密码错误' }
        set({ currentUserId: found.id })
        return { ok: true }
      },
      logout: () => set({ currentUserId: null }),
      updateNickname: ({ userId, nickname }) => {
        const n = nickname.trim()
        if (!n) return { ok: false, error: '昵称不能为空' }
        set({ users: get().users.map((x) => (x.id === userId ? { ...x, nickname: n.slice(0, 18) } : x)) })
        return { ok: true }
      },
      updateBio: ({ userId, bio }) => {
        set({ users: get().users.map((x) => (x.id === userId ? { ...x, bio: bio.trim().slice(0, 160) } : x)) })
      },
      updateAvatar: ({ userId, avatarDataUrl }) => {
        set({
          users: get().users.map((x) => (x.id === userId ? { ...x, avatarDataUrl: avatarDataUrl || undefined } : x)),
        })
      },
    }),
    {
      name: 'wwyy-auth-v1',
      version: 2,
      migrate: (persisted: any, version) => {
        if (!persisted || typeof persisted !== 'object') return persisted
        if (version === 2) return persisted

        const users = Array.isArray(persisted.users) ? persisted.users : []
        const migratedUsers: User[] = users.map((u: any) => {
          const id = String(u.id || uid())
          const legacyUsername = String(u.username || u.nickname || '')
          const accountCandidate = String(u.account || u.username || '').trim().toLowerCase()
          const account = isValidAccount(accountCandidate) ? accountCandidate : `${id}@local.invalid`
          const nickname = String(u.nickname || legacyUsername || (isPhone(account) ? `用户${account.slice(-4)}` : account.split('@')[0] || '用户')).slice(0, 18)
          return {
            id,
            account,
            nickname,
            password: String(u.password || ''),
            bio: typeof u.bio === 'string' ? u.bio : undefined,
            avatarDataUrl: typeof u.avatarDataUrl === 'string' ? u.avatarDataUrl : undefined,
            createdAt: typeof u.createdAt === 'string' ? u.createdAt : new Date().toISOString(),
          }
        })

        return {
          ...persisted,
          users: migratedUsers,
        }
      },
    },
  ),
)

export function useCurrentUser() {
  return useAuthStore((s) => s.users.find((u) => u.id === s.currentUserId) || null)
}
