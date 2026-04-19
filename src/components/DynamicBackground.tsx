import React, { useEffect, useMemo, useRef } from 'react'

const CHARS = ['宫', '商', '角', '徵', '羽']

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  char: string
  phase: number
  pulseSpeed: number
  pulseAmp: number
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

export default function DynamicBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return true
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let w = 0
    let h = 0
    let dpr = 1
    let particles: Particle[] = []

    const resize = () => {
      dpr = clamp(window.devicePixelRatio || 1, 1, 2)
      w = Math.max(1, window.innerWidth)
      h = Math.max(1, window.innerHeight)
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const targetCount = prefersReducedMotion ? 0 : Math.round((w * h) / 12000)
      particles = Array.from({ length: targetCount }).map((): Particle => {
        const speed = rand(6, 18)
        const angle = rand(0, Math.PI * 2)
        return {
          x: rand(0, w),
          y: rand(0, h),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: rand(12, 28),
          opacity: rand(0.06, 0.14),
          char: CHARS[Math.floor(Math.random() * CHARS.length)],
          phase: rand(0, Math.PI * 2),
          pulseSpeed: rand(0.35, 0.8),
          pulseAmp: rand(0.06, 0.22),
        }
      })
    }

    resize()
    window.addEventListener('resize', resize)

    let last = performance.now()

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      ctx.clearRect(0, 0, w, h)

      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = '700 18px ui-serif, serif'

      for (const p of particles) {
        p.x += p.vx * dt
        p.y += p.vy * dt

        const pad = 80
        if (p.x < -pad) p.x = w + pad
        if (p.x > w + pad) p.x = -pad
        if (p.y < -pad) p.y = h + pad
        if (p.y > h + pad) p.y = -pad

        const scale = 1 + Math.sin(now / 1000 * p.pulseSpeed + p.phase) * p.pulseAmp
        const size = p.size * scale

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = 'rgba(167, 243, 208, 1)'
        ctx.font = `700 ${size}px ui-serif, serif`
        ctx.fillText(p.char, 0, 0)
        ctx.restore()
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(raf)
    }
  }, [prefersReducedMotion])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-emerald-950/40 to-indigo-950" />
      <div className="absolute inset-0 opacity-[0.22] [background-image:radial-gradient(circle_at_1px_1px,rgba(167,243,208,0.22)_1px,transparent_0)] [background-size:18px_18px]" />
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="absolute inset-0 bg-zinc-950/35 backdrop-blur-[1px]" />
    </div>
  )
}
