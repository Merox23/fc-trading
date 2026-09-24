import { useEffect, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useData } from '../hooks/useData'
import { BetaBanner } from './BetaBanner'
import { Footer, Icon } from './ui'

const TABS: { to: string; label: string; end?: boolean; icon: ReactNode }[] = [
  {
    to: '/',
    label: 'Eintragen',
    end: true,
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
  },
  {
    to: '/angebote',
    label: 'Angebote',
    icon: (
      <>
        <path d="M3.5 12.5V4.5h8l9 9-8 8z" />
        <circle cx="7.8" cy="8.8" r="1.1" />
      </>
    ),
  },
  {
    to: '/verkaeufe',
    label: 'Verkäufe',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12.5l2.8 2.8L16.2 9.6" />
      </>
    ),
  },
  { to: '/statistik', label: 'Statistik', icon: <path d="M5 20V11M12 20V4M19 20v-6" /> },
  {
    to: '/mehr',
    label: 'Mehr',
    icon: (
      <>
        <circle cx="5.5" cy="12" r="1.4" />
        <circle cx="12" cy="12" r="1.4" />
        <circle cx="18.5" cy="12" r="1.4" />
      </>
    ),
  },
]

/** Menü links, ab Tablet-Breite (md) sichtbar statt der Tab-Leiste unten */
function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-card px-3 py-6 md:flex">
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <img src="/icon-192.png" alt="" className="size-9 rounded-xl" />
        <span className="font-display text-lg font-bold text-coin">FC Trading</span>
        <span className="rounded-full bg-raised px-2 py-0.5 text-[10px] font-bold text-mute">BETA</span>
      </div>
      <nav aria-label="Hauptnavigation" className="grid gap-1">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition ${
                isActive ? 'bg-raised text-coin' : 'text-mute hover:bg-raised/60 hover:text-ink'
              }`
            }
          >
            <Icon>{t.icon}</Icon>
            {t.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

/** Tab-Leiste unten, nur unterhalb der Tablet-Breite sichtbar */
function MobileTabBar() {
  return (
    <nav
      aria-label="Hauptnavigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="mx-auto grid h-16 max-w-xl grid-cols-5">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 text-[12px] font-medium ${
                isActive ? 'text-coin' : 'text-mute'
              }`
            }
          >
            <Icon>{t.icon}</Icon>
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export function Shell() {
  const { offline, loading } = useData()
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-dvh md:flex">
      <Sidebar />
      <div className="flex min-h-dvh flex-1 flex-col pt-[env(safe-area-inset-top)] md:pt-0">
        <BetaBanner />
        {offline && (
          <div role="status" className="bg-coin/15 px-4 py-2 text-center text-sm font-medium text-coin">
            Offline: zuletzt geladener Stand
          </div>
        )}
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-5 md:max-w-6xl md:px-10 md:pb-12 md:pt-10">
          <div className="flex-1">{loading ? <p className="py-20 text-center text-mute">Lädt …</p> : <Outlet />}</div>
          <Footer />
        </main>
        <MobileTabBar />
      </div>
    </div>
  )
}
