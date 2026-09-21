import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { DataProvider } from './hooks/useData'
import { ToastProvider } from './hooks/useToast'
import { configured } from './lib/supabase'
import { Shell } from './components/Shell'
import Login, { NotConfigured, Recovery } from './pages/Login'
import Eintragen from './pages/Eintragen'
import Angebote from './pages/Angebote'
import Verkaeufe from './pages/Verkaeufe'
import Statistik from './pages/Statistik'
import Mehr from './pages/Mehr'
import Kartenversionen from './pages/Kartenversionen'
import Konto from './pages/Konto'
import { Datenschutz, Impressum } from './pages/Legal'

function Splash() {
  return <div className="grid min-h-dvh place-items-center text-mute">Lädt …</div>
}

function Gate() {
  const { session, recovery } = useAuth()

  if (session === undefined) return <Splash />

  // Rechtstexte müssen auch ohne Login erreichbar sein
  const legal = (
    <>
      <Route path="/impressum" element={<Impressum />} />
      <Route path="/datenschutz" element={<Datenschutz />} />
    </>
  )

  if (!session) {
    return (
      <Routes>
        {legal}
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  if (recovery) return <Recovery />

  return (
    <DataProvider userId={session.user.id}>
      <Routes>
        {legal}
        <Route element={<Shell />}>
          <Route index element={<Eintragen />} />
          <Route path="angebote" element={<Angebote />} />
          <Route path="verkaeufe" element={<Verkaeufe />} />
          <Route path="statistik" element={<Statistik />} />
          <Route path="mehr" element={<Mehr />} />
          <Route path="mehr/versionen" element={<Kartenversionen />} />
          <Route path="mehr/konto" element={<Konto />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </DataProvider>
  )
}

export default function App() {
  if (!configured) return <NotConfigured />
  return (
    <ToastProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </ToastProvider>
  )
}
