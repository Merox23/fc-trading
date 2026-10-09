/**
 * Texterkennung im Browser (Tesseract.js), kostenlos und ohne eigenen Server.
 * Die Bibliothek und die Sprachdaten (~10 MB) werden erst beim ersten Import geladen.
 */
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
      const { data } = await worker.recognize(f)
      texts.push(data.text)
    }
    onProgress(1)
    return texts.join('\n')
  } finally {
    await worker.terminate()
  }
}
