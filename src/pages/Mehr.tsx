import { Link } from 'react-router-dom'
import { Icon, PageTitle } from '../components/ui'
import { useAuth } from '../hooks/useAuth'

const Chevron = () => (
  <span className="text-mute">
    <Icon>
      <path d="M9 6l6 6-6 6" />
    </Icon>
  </span>
)

function Item({ to, title, sub }: { to: string; title: string; sub: string }) {
  return (
    <Link to={to} className="tile flex min-h-16 items-center justify-between gap-3 active:bg-raised">
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-[14px] text-mute">{sub}</div>
      </div>
      <Chevron />
    </Link>
  )
}

export default function Mehr() {
  const { signOut } = useAuth()
  return (
    <>
      <PageTitle>Mehr</PageTitle>
      <div className="grid gap-3 md:max-w-md">
        <Item to="/mehr/versionen" title="Kartenversionen" sub="Eigene Spezialkarten mit Farbe anlegen" />
        <Item to="/mehr/design" title="Design" sub="Akzentfarbe der App wählen" />
        <Item to="/mehr/konto" title="Konto" sub="Passwort ändern oder Konto löschen" />
        <button className="btn btn-quiet mt-3 min-h-14 text-bad" onClick={() => void signOut()}>
          Abmelden
        </button>
      </div>
    </>
  )
}
