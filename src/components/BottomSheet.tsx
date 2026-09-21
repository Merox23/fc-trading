import { useEffect, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function BottomSheet({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="fade-anim absolute inset-0 bg-black/65" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="sheet-anim relative max-h-[92dvh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-t-[28px] border-t border-line bg-card px-4 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
        {title && <h2 className="mb-4 font-display text-xl font-bold">{title}</h2>}
        {children}
      </div>
    </div>
  )
}

interface ConfirmProps {
  open: boolean
  title: string
  text?: string
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void | Promise<void>
  onClose: () => void
}

export function ConfirmSheet({ open, title, text, confirmLabel, danger, onConfirm, onClose }: ConfirmProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      {text && <p className="mb-5 text-[15px] leading-relaxed text-mute">{text}</p>}
      <div className="grid gap-3">
        <button className={`btn min-h-14 ${danger ? 'btn-danger' : 'btn-coin'}`} onClick={() => void onConfirm()}>
          {confirmLabel}
        </button>
        <button className="btn btn-quiet min-h-14" onClick={onClose}>
          Abbrechen
        </button>
      </div>
    </BottomSheet>
  )
}
