import https from 'https'
import { URL } from 'url'

export async function postJson<TResponse>(args: {
  url: string
  headers?: Record<string, string>
  body: unknown
  timeoutMs?: number
}): Promise<{ status: number; json: TResponse }>

export async function postJson<TResponse>({
  url,
  headers,
  body,
  timeoutMs,
}: {
  url: string
  headers?: Record<string, string>
  body: unknown
  timeoutMs?: number
}): Promise<{ status: number; json: TResponse }> {
  const u = new URL(url)
  const payload = JSON.stringify(body)

  return await new Promise((resolve, reject) => {
    const req = https.request(
      {
        method: 'POST',
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port,
        path: `${u.pathname}${u.search}`,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload).toString(),
          ...(headers ?? {}),
        },
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (d) => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)))
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf-8')
          const status = res.statusCode ?? 0
          try {
            resolve({ status, json: JSON.parse(raw) as TResponse })
          } catch (e) {
            reject(new Error(`Invalid JSON response (status ${status}): ${raw.slice(0, 500)}`))
          }
        })
      },
    )

    req.on('error', reject)

    if (timeoutMs && timeoutMs > 0) {
      req.setTimeout(timeoutMs, () => {
        req.destroy(new Error('Request timeout'))
      })
    }

    req.write(payload)
    req.end()
  })
}

