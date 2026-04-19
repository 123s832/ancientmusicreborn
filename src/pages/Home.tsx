import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Landmark, PlayCircle, MessageCircle, Share2, Sparkles, User } from 'lucide-react'
import { useCurrentUser } from '@/stores/useAuthStore'

const FeatureCard = ({
  icon: Icon,
  title,
  description,
  to,
  color,
}: {
  icon: React.ComponentType<{ size?: number | string }>
  title: string
  description: string
  to: string
  color: string
}) => (
  <Link to={to} className="h-full">
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="group h-full rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur-md transition-all duration-300 hover:bg-white/8 hover:shadow-2xl flex flex-col"
    >
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${color} text-white flex-shrink-0`}>
        <Icon size={24} />
      </div>
      <h3 className="mb-2 text-xl font-bold text-zinc-50 flex-shrink-0">{title}</h3>
      <p className="text-sm leading-relaxed text-zinc-200/80 flex-grow">{description}</p>
    </motion.div>
  </Link>
)

export default function Home() {
  const user = useCurrentUser()
  return (
    <div className="container mx-auto px-4 py-12 lg:py-20">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1 rounded-full bg-emerald-400/15 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-4">
            传承华夏之音 · 创新传统文化
          </span>
          <h1 className="text-5xl lg:text-7xl font-extrabold text-zinc-50 mb-6 leading-tight">
            古代乐器<span className="text-emerald-300">音乐创作平台</span>
          </h1>
          <p className="text-xl text-zinc-200/80 leading-relaxed mb-8">
            在这里，你可以欣赏珍贵乐器文物，聆听穿越千年的声音，使用 AI 赋予传统文化全新的生命力。
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
        <FeatureCard
          icon={Landmark}
          title="古乐欣赏"
          description="浏览高清 2D 乐器模型，点击不同位置聆听真实的乐器发声，了解背后的历史故事。"
          to="/artifacts"
          color="bg-amber-500"
        />
        <FeatureCard
          icon={PlayCircle}
          title="古乐演奏"
          description="亲自演奏传统乐器：琵琶、二胡、编钟等。录制你的作品并保存到个人音频库。"
          to="/play"
          color="bg-emerald-500"
        />
        <FeatureCard
          icon={Sparkles}
          title="AI 编曲"
          description="结合你的录音或乐器音色，输入风格，开启智能音乐创作之旅。"
          to="/compose"
          color="bg-indigo-500"
        />
        <FeatureCard
          icon={Share2}
          title="社区作品"
          description="从音频库发布你的作品，在这里浏览、点赞和评论。"
          to="/community"
          color="bg-rose-500"
        />
        <FeatureCard
          icon={MessageCircle}
          title="消息中心"
          description="与志同道合的创作者交流，通过社区加好友，实时在线聊天，分享创作心得。"
          to="/messages"
          color="bg-sky-500"
        />
        <FeatureCard
          icon={User}
          title="个人主页"
          description="管理你的录音作品、AI 编曲以及收藏的文物，定制你的专属个人文化主页。"
          to="/profile"
          color="bg-violet-500"
        />
      </div>

      {!user ? (
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-sm shadow-xl shadow-black/30">
          <h2 className="mb-4 text-3xl font-bold text-zinc-50">开启你的音乐旅程</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3 bg-emerald-500 text-zinc-950 rounded-full font-bold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/10"
            >
              立即注册
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 bg-white/10 text-emerald-200 rounded-full font-bold border border-white/15 hover:bg-white/15 transition-colors"
            >
              登录账号
            </Link>
          </div>
        </motion.div>
      ) : null}
    </div>
  )
}
