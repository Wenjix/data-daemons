import { useMemo } from 'react'
import { usePetStore } from '../stores/petStore'
import type { TraitKey } from '../stores/petStore'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { RoastDisplay } from './RoastDisplay'

export function TraitPanel() {
  const activeDaemonId = usePetStore((s) => s.activeDaemonId)
  const roast = usePetStore((s) => s.roast)
  const daemon = useQuery(api.daemons.get, activeDaemonId ? { id: activeDaemonId } : 'skip')

  const sorted = useMemo(() => {
    const values = daemon?.traits ?? {}
    return Object.entries(values)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 6) as [TraitKey, number][]
  }, [daemon])

  return (
    <div className="trait-panel">
      <h2>Traits</h2>
      <ul>
        {sorted.map(([key, val]) => (
          <li key={key}>
            <span className="trait-name">{key}</span>
            <span className="trait-val">{val}</span>
          </li>
        ))}
      </ul>
      <div className="roast">
        <h3>Roast</h3>
        <RoastDisplay roast={roast} fallbackMessage="Feed the pet to get a roast..." />
      </div>
    </div>
  )
}