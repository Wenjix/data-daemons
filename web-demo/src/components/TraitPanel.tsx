import { useMemo } from 'react'
import { usePetStore } from '../stores/petStore'
import type { TraitKey } from '../stores/petStore'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { RoastDisplay } from './RoastDisplay'
import { useMagicStore } from '../stores/magicStore'

export function TraitPanel() {
  const activeDaemonId = usePetStore((s) => s.activeDaemonId)
  const roast = usePetStore((s) => s.roast)
  const daemon = useQuery(api.daemons.get, activeDaemonId ? { id: activeDaemonId } : 'skip')
  const contextState = useMagicStore((s) => s.contextState)
  const memoryState = useMagicStore((s) => s.memoryState)
  const toggleContext = useMagicStore((s) => s.toggleContext)
  const toggleMemory = useMagicStore((s) => s.toggleMemory)

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
      <div className="magic-indicators">
        <div className={`magic-indicator ${contextState === 'loaded' ? 'active' : 'inactive'}`}>
          <span className="indicator-label">Context:</span>
          <span className="indicator-value">{contextState === 'loaded' ? 'Loaded' : 'Cleared'}</span>
        </div>
        <div className={`magic-indicator ${memoryState === 'contextual' ? 'active' : 'inactive recalled'}`}>
          <span className="indicator-label">Memory:</span>
          <span className="indicator-value">{memoryState === 'contextual' ? 'Contextual' : 'Recalled'}</span>
        </div>
      </div>
      <div className="roast">
        <h3>Roast</h3>
        <RoastDisplay roast={roast} fallbackMessage="Feed the pet to get a roast..." />
      </div>
      <div className="spell-controls">
        <button
          className="spell-btn purple"
          onClick={toggleContext}
          title="Toggle Context State"
        >
          Cast Hypospell
        </button>
        <button
          className="spell-btn purple"
          onClick={toggleMemory}
          title="Toggle Memory State"
        >
          Cast Hyperspell
        </button>
      </div>
    </div>
  )
}