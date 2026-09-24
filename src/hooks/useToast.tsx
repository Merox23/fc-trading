import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { errMsg } from '../lib/errors'

type Kind = 'ok' | 'error'
const ToastCtx = createContext<(msg: string, kind?: Kind) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ msg: string; kind: Kind; id: number } | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const show = useCallback((msg: string, kind: Kind = 'ok') => {
    window.clearTimeout(timer.current)
    setToast({ msg, kind, id: Date.now() })
    timer.current = window.setTimeout(() => setToast(null), kind === 'error' ? 4500 : 2200)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <ToastCtx.Provider value={show}>
      {children}
      {toast && (
        <div
          key={toast.id}
          role="status"
          className="fade-anim pointer-events-none fixed inset-0 z-[60] flex items-center justify-center px-4"
        >
          <div
            className={`max-w-md rounded-xl px-4 py-3 text-[15px] font-semibold shadow-lg ${
              toast.kind === 'error' ? 'bg-bad text-[#2a0a10]' : 'bg-ink text-[#0b1020]'
            }`}
          >
            {toast.msg}
          </div>
        </div>
      )}
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)

/** Führt eine Aktion aus, zeigt Erfolg/Fehler als Meldung und liefert true/false zurück. */
export function useRun() {
  const show = useToast()
  return useCallback(
    async (fn: () => Promise<unknown>, okMsg?: string): Promise<boolean> => {
      try {
        await fn()
        if (okMsg) show(okMsg)
        return true
      } catch (e) {
        show(errMsg(e), 'error')
        return false
      }
    },
    [show],
  )
}
