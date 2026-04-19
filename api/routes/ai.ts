import express, { type Request, type Response } from 'express'
import { postJson } from '../lib/http.js'
import { extractFirstJsonObject, makeLocalPlan, type CompositionPlan } from '../lib/aiPlan.js'
import { makeHybridPlan, INSTRUMENT_AUDIO_FILES, listAvailableAudio } from '../lib/hybridAudioGenerator.js'

const router = express.Router()

router.post('/compose', async (req: Request, res: Response) => {
  const { instruments, style, durationSec, useRealAudio } = req.body || {}

  const apiKey = process.env.AI_GATEWAY_API_KEY || ''
  const baseUrl = process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/coding/v3'
  const model = process.env.DOUBAO_MODEL || 'doubao-seed-2.0-lite'

  const safeDurationSec = Math.max(5, Math.min(120, Number(durationSec) || 30))
  const safeInstruments = Array.isArray(instruments) ? instruments.filter(Boolean).slice(0, 10) : []
  const safeStyle = typeof style === 'string' ? style.slice(0, 220) : '古风、五声音阶、清冷而灵动'
  const shouldUseAudio = useRealAudio !== false // 默认使用真实音频

  // 检查哪些选中的乐器有真实音频文件
  const availableAudio = safeInstruments.filter(id => INSTRUMENT_AUDIO_FILES[id])
  const hasRealAudio = availableAudio.length > 0

  // 如果没有配置API密钥，或者用户要求使用真实音频且有所选乐器的音频
  if (!apiKey || (shouldUseAudio && hasRealAudio)) {
    // 使用混合模式生成（合成 + 真实音频纹理）
    const plan = makeHybridPlan({
      instruments: safeInstruments,
      style: safeStyle,
      durationSec: safeDurationSec
    })

    res.status(200).json({
      success: true,
      used: 'local-hybrid',
      message: shouldUseAudio && hasRealAudio
        ? `已使用混合模式生成编曲。合成音色为主，叠加 ${availableAudio.length} 种乐器的真实录音作为背景纹理。`
        : '未配置 AI_GATEWAY_API_KEY，已使用本地规则生成编曲计划。',
      plan: plan,
      audioLayers: plan.audioLayers,
    })
    return
  }

  const prompt = {
    role: 'user',
    content:
      `你是音乐编曲助手。请为古代中国乐器编写一个“可合成的编曲计划”。\n` +
      `要求：\n` +
      `- 只输出 JSON（不要代码块、不要解释）。\n` +
      `- durationSec 必须等于 ${safeDurationSec}，最大不超过120。\n` +
      `- 乐器列表 instruments=${JSON.stringify(safeInstruments)}（可为空）。\n` +
      `- 使用五声音阶/古风为主，风格描述：${safeStyle}\n` +
      `- 结构：{ bpm:number, durationSec:number, style:string, tracks:[{ instrumentId:string, synth:"pluck"|"bow"|"bell"|"flute"|"drum", notes:[{t:number,d:number,hz:number,v?:number}] }] }\n` +
      `- t/d 单位为秒，t>=0，d>0，t+d<=durationSec；每个 track 的 notes 不超过 140 条。\n` +
      `- hz 取值在 90~1400。\n` +
      `- 如果 instruments 为空，请默认用 "qin" 作为 instrumentId。\n`,
  }

  try {
    const { status, json } = await postJson<{
      choices?: Array<{ message?: { content?: string } }>
      error?: unknown
    }>({
      url: `${baseUrl.replace(/\/$/, '')}/chat/completions`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      timeoutMs: 45_000,
      body: {
        model,
        temperature: 0.8,
        messages: [prompt],
      },
    })

    const content = json?.choices?.[0]?.message?.content || ''
    const parsed = extractFirstJsonObject(content) as CompositionPlan | null
    if (!parsed || !parsed.tracks || !Array.isArray(parsed.tracks)) {
      const fallback = makeLocalPlan({ instruments: safeInstruments, style: safeStyle, durationSec: safeDurationSec })
      res.status(200).json({
        success: true,
        used: 'local',
        message: `豆包返回无法解析（HTTP ${status}），已降级为本地规则编曲计划。`,
        plan: fallback,
      })
      return
    }

    parsed.durationSec = safeDurationSec
    res.status(200).json({
      success: true,
      used: 'doubao',
      message: '已通过豆包生成编曲计划。',
      plan: parsed,
    })
  } catch (e) {
    const fallback = makeLocalPlan({ instruments: safeInstruments, style: safeStyle, durationSec: safeDurationSec })
    res.status(200).json({
      success: true,
      used: 'local',
      message: e instanceof Error ? `豆包调用失败，已降级：${e.message}` : '豆包调用失败，已降级为本地规则编曲计划。',
      plan: fallback,
    })
  }
})

export default router
