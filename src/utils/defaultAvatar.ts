import { INSTRUMENTS } from '@/data/instruments'

export function getRandomInstrumentAvatarDataUrl(seed: string) {
  const id = seed.trim() || 'seed'
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const idx = Math.abs(h) % Math.max(1, INSTRUMENTS.length)
  const it = INSTRUMENTS[idx]
  return it?.imageUrl || ''
}

