import { Link } from 'react-router-dom'
import { PageTitle } from '../components/ui'
import { useTheme } from '../hooks/useTheme'
import { THEMES } from '../lib/themes'

export default function Design() {
  const { themeId, setThemeId } = useTheme()

  return (
    <>
      <Link to="/mehr" className="mb-2 inline-flex min-h-12 items-center text-[15px] text-mute">
        &#x2039; Zurück
      </Link>
      <PageTitle sub="Wirkt sich nur auf dieses Gerät aus">Design</PageTitle>

      <div className="grid grid-cols-4 gap-4 sm:grid-cols-5 md:max-w-md">
        {THEMES.map((t) => {
          const active = t.id === themeId
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setThemeId(t.id)}
              className="flex flex-col items-center gap-2"
              aria-pressed={active}
            >
              <span
                className="flex size-14 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-night"
                style={{ background: t.accent, ['--tw-ring-color' as string]: active ? t.accent : 'transparent' }}
              >
                {active && (
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={t.onAccent} strokeWidth="3">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="text-[13px] text-mute">{t.label}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}
