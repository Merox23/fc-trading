/** Bricht ein Promise nach `ms` mit einer verständlichen Fehlermeldung ab, statt endlos zu warten. */
export function withTimeout<T>(p: PromiseLike<T>, ms = 20000, msg = 'Keine Antwort vom Server.'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error(msg)), ms)
    p.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      },
    )
  })
}
