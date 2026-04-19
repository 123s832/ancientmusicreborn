import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'

export default function Register() {
  const register = useAuthStore((s) => s.register)
  const navigate = useNavigate()
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-white/20 bg-white/80 p-8 shadow-2xl shadow-black/40 backdrop-blur-md text-zinc-900">
      <h1 className="text-2xl font-extrabold text-zinc-900">注册</h1>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          const res = register(account, password)
          if (!res.ok) {
            setError('error' in res ? res.error : '注册失败')
            setSuccess(null)
            return
          }
          setError(null)
          setSuccess('注册成功，请重新登录')
          window.setTimeout(() => {
            navigate('/login')
          }, 900)
        }}
      >
        <label className="block">
          <div className="text-sm font-bold text-zinc-800">手机号或邮箱</div>
          <input
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-zinc-900/10 bg-white/70 px-4 py-3 text-sm text-zinc-900 outline-none ring-0 placeholder:text-zinc-500 focus:border-emerald-500"
            placeholder="请输入手机号或邮箱"
            autoComplete="username"
          />
        </label>

        <label className="block">
          <div className="text-sm font-bold text-zinc-800">密码</div>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="mt-2 w-full rounded-2xl border border-zinc-900/10 bg-white/70 px-4 py-3 text-sm text-zinc-900 outline-none ring-0 placeholder:text-zinc-500 focus:border-emerald-500"
            placeholder="至少 6 位"
            autoComplete="new-password"
          />
        </label>

        {error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}
        {success ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-800">{success}</div>
        ) : null}

        <button
          type="submit"
          className="w-full rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/10 hover:bg-emerald-600"
        >
          注册
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-zinc-700">
        已有账号？{' '}
        <Link to="/login" className="font-bold text-emerald-800 hover:underline">
          去登录
        </Link>
      </div>
    </div>
  )
}
