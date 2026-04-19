import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useMemo } from 'react'

export interface Recording {
  id: string
  userId: string
  title: string
  instrumentId: string
  createdAt: string
  dataUrl: string
}

export interface AiComposition {
  id: string
  userId: string
  title: string
  style: string
  durationSec: number
  createdAt: string
  dataUrl: string
}

interface LibraryState {
  recordings: Recording[]
  compositions: AiComposition[]
  addRecording: (rec: Omit<Recording, 'id' | 'createdAt'>) => void
  removeRecording: (id: string) => void
  addComposition: (c: Omit<AiComposition, 'id' | 'createdAt'>) => void
  removeComposition: (id: string) => void
}

function uid() {
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      recordings: [],
      compositions: [],
      addRecording: (rec) => {
        const next: Recording = { id: uid(), createdAt: new Date().toISOString(), ...rec }
        set({ recordings: [next, ...get().recordings] })
      },
      removeRecording: (id) => set({ recordings: get().recordings.filter((r) => r.id !== id) }),
      addComposition: (c) => {
        const next: AiComposition = { id: uid(), createdAt: new Date().toISOString(), ...c }
        set({ compositions: [next, ...get().compositions] })
      },
      removeComposition: (id) => set({ compositions: get().compositions.filter((c) => c.id !== id) }),
    }),
    { name: 'wwyy-library-v1' },
  ),
)

export function useMyRecordings(userId: string | null) {
  const recordings = useLibraryStore((s) => s.recordings)
  return useMemo(() => (userId ? recordings.filter((r) => r.userId === userId) : []), [recordings, userId])
}

export function useMyCompositions(userId: string | null) {
  const compositions = useLibraryStore((s) => s.compositions)
  return useMemo(() => (userId ? compositions.filter((c) => c.userId === userId) : []), [compositions, userId])
}
