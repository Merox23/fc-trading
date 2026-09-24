import { useState } from 'react'

const KEY = 'fc-beta-banner-dismissed'

/** Einmaliger Hinweis, dass die App Beta ist – merkt sich pro Gerät, ob er schon weggetippt wurde */
export function BetaBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(KEY) === '1'
    } catch {
      return false
    }
  })

  if (dismissed) return null

  function dismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      /* egal, dann erscheint der Hinweis beim nächsten Mal nochmal */
    }
  }

  return (
    <div role="status" className="flex items-start gap-3 border-b border-line bg-coin/10 px-4 py-3 text-[14px] text-ink">
      <span className="mt-0.5 rounded-full bg-coin px-2 py-0.5 text-[11px] font-bold text-on-coin">BETA</span>
      <p className="flex-1 leading-relaxed">
        Diese App ist noch in der Testphase, es kann zu Fehlern kommen. Feedback, Bugs oder Ideen gerne per Discord an{' '}
        <span className="font-semibold">@_merox</span>.
      </p>
      <button
        onClick={dismiss}
        aria-label="Hinweis schließen"
        className="shrink-0 rounded-lg px-2 py-1 text-mute active:bg-raised"
      >
        &#x2715;
      </button>
    </div>
  )
}
