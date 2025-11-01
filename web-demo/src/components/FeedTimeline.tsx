import { useEffect, useRef } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Doc } from '../../../convex/_generated/dataModel'
import { usePetStore } from '../stores/petStore'

export function FeedTimeline() {
  const activeDaemonId = usePetStore((s) => s.activeDaemonId)
  const feeds = useQuery(api.feeds.listByDaemon, activeDaemonId ? { daemonId: activeDaemonId } : 'skip')
  const daemon = useQuery(api.daemons.get, activeDaemonId ? { id: activeDaemonId } : 'skip')
  const liveRegionRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!feeds || feeds.length === 0) return
    if (liveRegionRef.current && daemon?.name) {
      liveRegionRef.current.textContent = `New mail ingested for ${daemon.name}`
    }
  }, [feeds, daemon])

  if (!feeds) {
    return <div className="feed-timeline">Loading feed...</div>
  }

  return (
    <div className="feed-timeline">
      <div className="sr-only" aria-live="polite" ref={liveRegionRef} />
      {feeds.map((f: Doc<'feeds'>) => (
        <div className="feed-card" key={f._id}>
          <div className="meta">
            <span className={`feed-badge ${f.source}`}>{f.source === 'email' ? 'AgentMail' : 'Drag'}</span>
            <span className={`feed-status ${f.status}`}>{f.status}</span>
            <span>{new Date(f.createdAt).toLocaleTimeString()}</span>
          </div>
          <div>{f.contentSummary}</div>
        </div>
      ))}
    </div>
  )
}