import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

/** Ab dieser Ziehstrecke (px) gilt das Sheet als "weggewischt" */
const DISMISS_THRESHOLD = 90

export function BottomSheet({ open, onClose, title, children }: Props) {
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startY = useRef<number | null>(null)

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

  useEffect(() => {
    if (open) {
      setDragY(0)
      startY.current = null
    }
  }, [open])

  if (!open) return null

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    startY.current = e.clientY
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (startY.current === null) return
    const delta = e.clientY - startY.current
    if (delta > 0) setDragY(delta)
  }
  function onPointerUp() {
    setDragging(false)
    startY.current = null
    if (dragY > DISMISS_THRESHOLD) onClose()
    else setDragY(0)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="fade-anim absolute inset-0 bg-black/65" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`${dragging ? '' : 'sheet-anim'} relative max-h-[92dvh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-t-[28px] border-t border-line bg-card px-4 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]`}
        style={dragY ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
      >
        {/* Griff zum Herunterziehen/Schließen, wie man es aus anderen Apps kennt */}
        <div
          className={`-mx-4 -mt-3 cursor-grab touch-none px-4 pb-3 pt-3 active:cursor-grabbing ${title ? '' : 'mb-1'}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="mx-auto h-1.5 w-10 rounded-full bg-line" />
          {title && <h2 className="mb-1 mt-4 font-display text-xl font-bold">{title}</h2>}
        </div>
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
