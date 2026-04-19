export interface SampleNote {
  note: string
  frequency: number
  startTime: number
  duration: number
}

export interface InstrumentSample {
  instrumentId: string
  instrumentName: string
  audioUrl: string
  notes: SampleNote[]
}

export const INSTRUMENT_SAMPLES: Record<string, InstrumentSample> = {
  pipa: {
    instrumentId: 'pipa',
    instrumentName: '琵琶',
    audioUrl: '/琵琶.m4a',
    notes: [
      { note: 'A4', frequency: 440, startTime: 0, duration: 1.5 },
      { note: 'B4', frequency: 494, startTime: 1.5, duration: 1.5 },
      { note: 'C#5', frequency: 554, startTime: 3, duration: 1.5 },
      { note: 'D5', frequency: 587, startTime: 4.5, duration: 1.5 },
      { note: 'E5', frequency: 659, startTime: 6, duration: 1.5 },
      { note: 'F#5', frequency: 740, startTime: 7.5, duration: 1.5 },
      { note: 'G#5', frequency: 831, startTime: 9, duration: 1.5 },
      { note: 'A5', frequency: 880, startTime: 10.5, duration: 1.5 },
    ]
  },
  erhu: {
    instrumentId: 'erhu',
    instrumentName: '二胡',
    audioUrl: '/二胡.m4a',
    notes: [
      { note: 'D4', frequency: 294, startTime: 0, duration: 2 },
      { note: 'E4', frequency: 330, startTime: 2, duration: 2 },
      { note: 'F#4', frequency: 370, startTime: 4, duration: 2 },
      { note: 'G4', frequency: 392, startTime: 6, duration: 2 },
      { note: 'A4', frequency: 440, startTime: 8, duration: 2 },
      { note: 'B4', frequency: 494, startTime: 10, duration: 2 },
    ]
  },
  bianzhong: {
    instrumentId: 'bianzhong',
    instrumentName: '编钟',
    audioUrl: '/编钟.m4a',
    notes: [
      { note: 'C3', frequency: 131, startTime: 0, duration: 3 },
      { note: 'D3', frequency: 147, startTime: 3, duration: 3 },
      { note: 'E3', frequency: 165, startTime: 6, duration: 3 },
      { note: 'G3', frequency: 196, startTime: 9, duration: 3 },
      { note: 'A3', frequency: 220, startTime: 12, duration: 3 },
    ]
  },
  xiao: {
    instrumentId: 'xiao',
    instrumentName: '箫',
    audioUrl: '/箫.m4a',
    notes: [
      { note: 'D5', frequency: 587, startTime: 0, duration: 2 },
      { note: 'E5', frequency: 659, startTime: 2, duration: 2 },
      { note: 'F#5', frequency: 740, startTime: 4, duration: 2 },
      { note: 'G5', frequency: 784, startTime: 6, duration: 2 },
      { note: 'A5', frequency: 880, startTime: 8, duration: 2 },
    ]
  },
  di: {
    instrumentId: 'di',
    instrumentName: '笛子',
    audioUrl: '/笛.m4a',
    notes: [
      { note: 'G5', frequency: 784, startTime: 0, duration: 1.5 },
      { note: 'A5', frequency: 880, startTime: 1.5, duration: 1.5 },
      { note: 'B5', frequency: 988, startTime: 3, duration: 1.5 },
      { note: 'C6', frequency: 1047, startTime: 4.5, duration: 1.5 },
      { note: 'D6', frequency: 1175, startTime: 6, duration: 1.5 },
    ]
  },
  qin: {
    instrumentId: 'qin',
    instrumentName: '古琴',
    audioUrl: '/古琴.m4a',
    notes: [
      { note: 'C3', frequency: 131, startTime: 0, duration: 3 },
      { note: 'D3', frequency: 147, startTime: 3, duration: 3 },
      { note: 'E3', frequency: 165, startTime: 6, duration: 3 },
      { note: 'G3', frequency: 196, startTime: 9, duration: 3 },
      { note: 'A3', frequency: 220, startTime: 12, duration: 3 },
    ]
  },
  xun: {
    instrumentId: 'xun',
    instrumentName: '埙',
    audioUrl: '/埙.m4a',
    notes: [
      { note: 'F4', frequency: 349, startTime: 0, duration: 2.5 },
      { note: 'G4', frequency: 392, startTime: 2.5, duration: 2.5 },
      { note: 'A4', frequency: 440, startTime: 5, duration: 2.5 },
      { note: 'C5', frequency: 523, startTime: 7.5, duration: 2.5 },
    ]
  },
  sheng: {
    instrumentId: 'sheng',
    instrumentName: '笙',
    audioUrl: '/笙.m4a',
    notes: [
      { note: 'G4', frequency: 392, startTime: 0, duration: 2 },
      { note: 'A4', frequency: 440, startTime: 2, duration: 2 },
      { note: 'B4', frequency: 494, startTime: 4, duration: 2 },
      { note: 'D5', frequency: 587, startTime: 6, duration: 2 },
      { note: 'E5', frequency: 659, startTime: 8, duration: 2 },
    ]
  },
  gu: {
    instrumentId: 'gu',
    instrumentName: '鼓',
    audioUrl: '/鼓.m4a',
    notes: [
      { note: 'Kick', frequency: 60, startTime: 0, duration: 0.5 },
      { note: 'Center', frequency: 120, startTime: 0.5, duration: 0.5 },
      { note: 'Edge', frequency: 180, startTime: 1, duration: 0.5 },
      { note: 'Rim', frequency: 240, startTime: 1.5, duration: 0.5 },
      { note: 'Roll', frequency: 150, startTime: 2, duration: 1 },
    ]
  },
}

export class AudioSampler {
  private audioContext: AudioContext
  private sampleBuffers: Map<string, AudioBuffer> = new Map()

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext
  }

  async loadSample(instrumentId: string): Promise<AudioBuffer | null> {
    const sample = INSTRUMENT_SAMPLES[instrumentId]
    if (!sample) return null

    if (this.sampleBuffers.has(instrumentId)) {
      return this.sampleBuffers.get(instrumentId)!
    }

    try {
      const response = await fetch(sample.audioUrl)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
      this.sampleBuffers.set(instrumentId, audioBuffer)
      return audioBuffer
    } catch (error) {
      console.error(`Failed to load sample for ${instrumentId}:`, error)
      return null
    }
  }

  async playNote(
    instrumentId: string,
    targetFrequency: number,
    duration: number,
    destination: AudioNode = this.audioContext.destination
  ): Promise<void> {
    const sample = INSTRUMENT_SAMPLES[instrumentId]
    if (!sample) return

    const buffer = await this.loadSample(instrumentId)
    if (!buffer) return

    const source = this.audioContext.createBufferSource()
    source.buffer = buffer

    const playbackRate = targetFrequency / sample.notes[0].frequency
    source.playbackRate.value = playbackRate

    const gainNode = this.audioContext.createGain()
    gainNode.gain.setValueAtTime(0.7, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)

    source.connect(gainNode)
    gainNode.connect(destination)

    source.start(this.audioContext.currentTime)
    source.stop(this.audioContext.currentTime + duration)
  }

  findClosestNote(instrumentId: string, targetFrequency: number): SampleNote | null {
    const sample = INSTRUMENT_SAMPLES[instrumentId]
    if (!sample) return null

    let closestNote = sample.notes[0]
    let minDiff = Math.abs(targetFrequency - closestNote.frequency)

    for (const note of sample.notes) {
      const diff = Math.abs(targetFrequency - note.frequency)
      if (diff < minDiff) {
        minDiff = diff
        closestNote = note
      }
    }

    return closestNote
  }
}

export async function generateMusicWithSamples(
  audioContext: AudioContext,
  instrumentIds: string[],
  notes: Array<{ frequency: number; duration: number; time: number }>,
  tempo: number = 120
): Promise<AudioBuffer> {
  const sampler = new AudioSampler(audioContext)
  const beatDuration = 60 / tempo

  const offlineContext = new OfflineAudioContext(
    2,
    audioContext.sampleRate * 30,
    audioContext.sampleRate
  )

  for (const note of notes) {
    const instrumentId = instrumentIds[Math.floor(Math.random() * instrumentIds.length)]
    const sample = INSTRUMENT_SAMPLES[instrumentId]
    if (!sample) continue

    const buffer = await sampler.loadSample(instrumentId)
    if (!buffer) continue

    const source = offlineContext.createBufferSource()
    source.buffer = buffer

    const sampleNote = sampler.findClosestNote(instrumentId, note.frequency)
    if (sampleNote) {
      const playbackRate = note.frequency / sampleNote.frequency
      source.playbackRate.value = playbackRate
    }

    const gainNode = offlineContext.createGain()
    gainNode.gain.setValueAtTime(0.5, note.time * beatDuration)
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      note.time * beatDuration + note.duration * beatDuration
    )

    source.connect(gainNode)
    gainNode.connect(offlineContext.destination)

    source.start(note.time * beatDuration)
    source.stop(note.time * beatDuration + note.duration * beatDuration)
  }

  return offlineContext.startRendering()
}
