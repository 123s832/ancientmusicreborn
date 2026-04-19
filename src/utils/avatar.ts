export async function fileToCircularAvatarDataUrl(file: File, size = 256) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('读取图片失败'))
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = () => reject(new Error('加载图片失败'))
    i.src = dataUrl
  })

  const s = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height)
  const sx = Math.max(0, Math.floor(((img.naturalWidth || img.width) - s) / 2))
  const sy = Math.max(0, Math.floor(((img.naturalHeight || img.height) - s) / 2))

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布')

  ctx.clearRect(0, 0, size, size)
  ctx.save()
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size)
  ctx.restore()

  return canvas.toDataURL('image/png')
}

