import { useData } from '../hooks/useData'
import { useRun } from '../hooks/useToast'
import type { Trade } from '../types'
import { BottomSheet } from './BottomSheet'
import { TradeForm } from './TradeForm'

/** Direkt denselben Spieler neu einkaufen (Name/Version/Rating vorausgefüllt), unabhängig vom Verkaufs-Dialog */
export function RebuySheet({ trade, onClose }: { trade: Trade | null; onClose: () => void }) {
  const { addTrade } = useData()
  const run = useRun()

  if (!trade) return null

  return (
    <BottomSheet open onClose={onClose} title={`${trade.player_name} neu einkaufen`}>
      <TradeForm
        submitLabel="Neu einkaufen"
        prefill={{ player_name: trade.player_name, card_version_id: trade.card_version_id, rating: trade.rating }}
        onSubmit={async (v) => {
          const ok = await run(() => addTrade(v), 'Neu eingekauft')
          if (ok) onClose()
          return ok
        }}
      />
    </BottomSheet>
  )
}
