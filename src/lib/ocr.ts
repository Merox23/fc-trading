/**
 * Texterkennung im Browser (Tesseract.js), kostenlos und ohne eigenen Server.
 * Die Bibliothek und die Sprachdaten (~10 MB) werden erst beim ersten Import geladen.
 */

/** Zielbreite fürs Vergrößern: Futbin-Screenshots vom PC sind oft nur ~450 px breit, zu klein für die Erkennung */
const TARGET_WIDTH = 1400

/**
 * Bild für die Erkennung aufbereiten: kleine Screenshots vergrößern, in Graustufen umwandeln und
 * helle Schrift auf dunklem Grund (Futbin Dark Mode) umkehren. Ohne das erkennt Tesseract dort fast nichts.
 */
async function prepare(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(4, Math.max(1, TARGET_WIDTH / bitmap.width))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const px = img.data
  let sum = 0
  for (let i = 0; i < px.length; i += 4) {
    const l = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]
    px[i] = l
    sum += l
  }
  const dark = sum / (px.length / 4) < 128
  for (let i = 0; i < px.length; i += 4) {
    const l = dark ? 255 - px[i] : px[i]
    px[i] = px[i + 1] = px[i + 2] = l
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}

export async function recognizeImages(files: File[], onProgress: (p: number) => void): Promise<string> {
  const { createWorker } = await import('tesseract.js')
  let current = 0
  const worker = await createWorker(['eng', 'deu'], 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') onProgress((current + m.progress) / files.length)
    },
  })
  try {
    const texts: string[] = []
    for (const [i, f] of files.entries()) {
      current = i
      const { data } = await worker.recognize(await prepare(f))
      texts.push(data.text)
    }
    onProgress(1)
    return texts.join('\n')
  } finally {
    await worker.terminate()
  }
}
