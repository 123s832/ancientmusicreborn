import { useMemo } from 'react'

function getAudioContext(): AudioContext {
  const w = window as unknown as { __wwyyAudioCtx?: AudioContext }
  if (!w.__wwyyAudioCtx) {
    w.__wwyyAudioCtx = new AudioContext()
  }
  return w.__wwyyAudioCtx
}

export function useAudioEngine() {
  return useMemo(() => {
    const ctx = getAudioContext()

    async function ensureRunning() {
      if (ctx.state !== 'running') {
        await ctx.resume()
      }
    }

    type Synth = 'pluck' | 'bow' | 'bell' | 'flute' | 'drum'

    function clamp(n: number, min: number, max: number) {
      return Math.max(min, Math.min(max, n))
    }

    function playSynthTone(args: { hz: number; durationMs?: number; gain?: number; synth?: Synth; destination?: AudioNode }) {
      const durationMs = args.durationMs ?? 350
      const g0 = args.gain ?? 0.18
      const synth = args.synth ?? 'pluck'
      const hz = clamp(args.hz, 90, 1400)
      const dest = args.destination ?? ctx.destination

      const now = ctx.currentTime
      const dur = durationMs / 1000

      const out = ctx.createGain()
      out.gain.setValueAtTime(0.0001, now)

      if (synth === 'bow') {
        out.gain.linearRampToValueAtTime(g0, now + 0.04)
        out.gain.linearRampToValueAtTime(g0 * 0.8, now + dur)
      } else {
        out.gain.exponentialRampToValueAtTime(g0, now + 0.02)
        out.gain.exponentialRampToValueAtTime(0.0001, now + dur)
      }

      if (synth === 'drum') {
        const bufferLen = Math.floor(ctx.sampleRate * dur)
        const noise = ctx.createBuffer(1, Math.max(1, bufferLen), ctx.sampleRate)
        const data = noise.getChannelData(0)
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.9
        const src = ctx.createBufferSource()
        src.buffer = noise
        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(1400, now)
        filter.frequency.exponentialRampToValueAtTime(180, now + dur)
        src.connect(filter)
        filter.connect(out)
        out.connect(dest)
        src.start(now)
        src.stop(now + dur)
        return
      }

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(synth === 'flute' ? 1800 : 2400, now)

      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      osc1.frequency.setValueAtTime(hz, now)
      osc2.frequency.setValueAtTime(hz * (synth === 'bell' ? 2.02 : 2), now)

      if (synth === 'pluck') {
        osc1.type = 'triangle'
        osc2.type = 'sine'
      } else if (synth === 'bow') {
        osc1.type = 'sawtooth'
        osc2.type = 'triangle'
      } else if (synth === 'bell') {
        osc1.type = 'sine'
        osc2.type = 'sine'
      } else {
        osc1.type = 'sine'
        osc2.type = 'sine'
      }

      const osc2Gain = ctx.createGain()
      osc2Gain.gain.value = synth === 'bell' ? 0.45 : 0.18

      const vibrato = ctx.createOscillator()
      vibrato.type = 'sine'
      vibrato.frequency.value = synth === 'bow' ? 5.5 : 0
      const vibratoGain = ctx.createGain()
      vibratoGain.gain.value = synth === 'bow' ? 6.5 : 0
      vibrato.connect(vibratoGain)
      vibratoGain.connect(osc1.frequency)
      vibrato.start(now)
      vibrato.stop(now + dur)

      osc1.connect(filter)
      osc2.connect(osc2Gain)
      osc2Gain.connect(filter)
      filter.connect(out)
      out.connect(dest)

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + dur + 0.02)
      osc2.stop(now + dur + 0.02)
    }

    async function playTone(opts: { hz: number; durationMs?: number; gain?: number; synth?: Synth }) {
      await ensureRunning()
      playSynthTone({ hz: opts.hz, durationMs: opts.durationMs, gain: opts.gain, synth: opts.synth })
    }

    function createRecorder() {
      const dest = ctx.createMediaStreamDestination()
      const gain = ctx.createGain()
      gain.gain.value = 1
      gain.connect(dest)
      gain.connect(ctx.destination)

      function playToneToDest(opts: { hz: number; durationMs?: number; gain?: number; synth?: Synth }) {
        playSynthTone({ hz: opts.hz, durationMs: opts.durationMs, gain: opts.gain, synth: opts.synth, destination: gain })
      }

      return { stream: dest.stream, playToneToDest }
    }

    return { playTone, createRecorder, ensureRunning }
  }, [])
}
