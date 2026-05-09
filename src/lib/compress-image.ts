/**
 * Compress an image file using canvas API — no external dependencies.
 * Resizes to max 1200px on the longest edge and encodes as JPEG.
 */
export async function compressImage(file: File, maxKB = 300): Promise<Blob> {
  const MAX_DIM = 1200
  const img = await loadImage(file)

  let { width, height } = img
  if (width > MAX_DIM || height > MAX_DIM) {
    if (width > height) {
      height = Math.round((height / width) * MAX_DIM)
      width = MAX_DIM
    } else {
      width = Math.round((width / height) * MAX_DIM)
      height = MAX_DIM
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, width, height)

  // Try decreasing quality until under maxKB
  let quality = 0.82
  let blob: Blob | null = null
  while (quality >= 0.4) {
    blob = await canvasToBlob(canvas, 'image/jpeg', quality)
    if (blob.size <= maxKB * 1024) break
    quality -= 0.1
  }
  return blob ?? await canvasToBlob(canvas, 'image/jpeg', 0.4)
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = reject
    img.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('Canvas toBlob failed')), type, quality)
  })
}
