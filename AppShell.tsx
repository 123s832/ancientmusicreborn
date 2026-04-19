import React from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Landmark, PlayCircle, Sparkles, Share2, MessageCircle, User, LogIn, LogOut } from 'lucide-react'
import DynamicBackground from '@/components/DynamicBackground'
import { useAuthStore, useCurrentUser } from '@/stores/useAuthStore'
import { useChatStore } from '@/stores/useChatStore'
import { useCommunityStore } from '@/stores/useCommunityStore'

const navItems = [
  { to: '/artifacts', label: '古乐欣赏', icon: Landmark },
  { to: '/play', label: '古乐演奏', icon: PlayCircle },
  { to: '/compose', label: 'AI编曲', icon: Sparkles },
  { to: '/community', label: '社区作品', icon: Share2 },
  { to: '/messages', label: '消息', icon: MessageCircle },
  { to: '/profile', label: '我的', icon: User },
]

function TopNav() {
  const user = useCurrentUser()
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const location = useLocation()
  const userId = useAuthStore((s) => s.currentUserId)
  const messages = useChatStore((s) => s.messages)
  const requests = useChatStore((s) => s.requests)
  const assistantLastSeenCommentsAt = useChatStore((s) => s.assistantLastSeenCommentsAt)
  const assistantLastSeenRequestsAt = useChatStore((s) => s.assistantLastSeenRequestsAt)
  const posts = useCommunityStore((s) => s.posts)

  const unreadCount = React.useMemo(() => {
    if (!userId) return 0
    const unreadMessages = messages.reduce((acc, m) => {
      if (m.toUserId !== userId) return acc
      if (m.read === true) return acc
      return acc + 1
    }, 0)

    const reqSeenAt = assistantLastSeenRequestsAt
    const pendingRequests = requests.filter((r) => r.toUserId === userId && r.status === 'pending')
    const unreadRequests = reqSeenAt ? pendingRequests.filter((r) => r.createdAt > reqSeenAt).length : pendingRequests.length

    const cSeenAt = assistantLastSeenCommentsAt
    let unreadComments = 0
    for (const p of posts) {
      if (p.userId !== userId) continue
      for (const c of p.comments) {
        if (c.userId === userId) continue
        if (!cSeenAt || c.createdAt > cSeenAt) unreadComments++
      }
    }

    return unreadMessages + unreadRequests + unreadComments
  }, [assistantLastSeenCommentsAt, assistantLastSeenRequestsAt, messages, posts, requests, userId])

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/60 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
        <Link to="/" className="flex items-center gap-3">
          <img src="./logo.jpg" alt="古乐数生" className="h-12 w-12 rounded-xl object-cover shadow-lg shadow-emerald-500/10" />
          <div className="text-xl font-extrabold tracking-tight text-zinc-100">古乐数生</div>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex" aria-label="主导航">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to
            const isMessages = item.to === '/messages'
            return (
              <a
                key={item.to}
                href={`#${item.to}`}
                className={`rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${isActive ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-200 hover:bg-white/10'
                  }`}
              >
                <span className="inline-flex items-center gap-2">
                  <item.icon size={18} />
                  {item.label}
                  {isMessages && unreadCount > 0 ? (
                    <span className="min-w-[18px] rounded-full bg-rose-500 px-2 py-0.5 text-center text-[11px] font-extrabold text-zinc-950">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  ) : null}
                </span>
              </a>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <button
              onClick={() => {
                logout()
                navigate('/')
              }}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm font-bold text-zinc-100 shadow-sm ring-1 ring-white/10 hover:bg-white/15"
            >
              <span className="hidden sm:inline">{user.nickname}</span>
              <LogOut size={20} />
            </button>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/10 hover:bg-emerald-400"
            >
              登录
              <LogIn size={20} />
            </Link>
          )}
        </div>
      </div>

      <nav className="mx-auto grid max-w-6xl grid-cols-6 gap-1 px-4 pb-3 lg:hidden" aria-label="主导航(移动端)">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to
          const isMessages = item.to === '/messages'
          return (
            <a
              key={item.to}
              href={`#${item.to}`}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-xs font-bold transition-colors ${isActive ? 'bg-emerald-500 text-zinc-950' : 'bg-white/5 text-zinc-200 hover:bg-white/10'
                }`}
            >
              <div className="relative">
                <item.icon size={18} />
                {isMessages && unreadCount > 0 ? (
                  <span className="absolute -right-2 -top-1 h-2 w-2 rounded-full bg-rose-500" />
                ) : null}
              </div>
              <span className="relative">
                {item.label}
                {isMessages && unreadCount > 0 ? (
                  <span className="ml-1 inline-flex min-w-[18px] rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[10px] font-extrabold text-zinc-950">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                ) : null}
              </span>
            </a>
          )
        })}
      </nav>
    </header>
  )
}

export default function AppShell() {
  return (
    <div className="relative min-h-screen text-zinc-50">
      <DynamicBackground />
      <div className="relative z-10">
        <TopNav />
        <main className="mx-auto w-full max-w-6xl px-4 py-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
