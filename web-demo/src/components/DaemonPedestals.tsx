import { useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Doc, Id } from '../../../convex/_generated/dataModel'
import { usePetStore } from '../stores/petStore'
import { InboxGlyph } from './InboxGlyph'
import { useUIStore } from '../stores/uiStore'

export function DaemonPedestals() {
  const daemons = useQuery(api.daemons.all)
  const activeDaemonId = usePetStore((s) => s.activeDaemonId)
  const setActiveDaemonId = usePetStore((s) => s.setActiveDaemonId)
  const feeds = useQuery(api.feeds.listByDaemon, activeDaemonId ? { daemonId: activeDaemonId } : 'skip')
  const openDetail = useUIStore((s) => s.openDetail)

  useEffect(() => {
    if (daemons && !activeDaemonId && daemons[0]) {
      setActiveDaemonId(daemons[0]._id)
    }
  }, [daemons, activeDaemonId, setActiveDaemonId])

  const positions = ['pos-a', 'pos-b', 'pos-c']

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!daemons || daemons.length === 0) return
    const idx = daemons.findIndex((d: Doc<'daemons'>) => d._id === activeDaemonId)
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      const next = daemons[(idx + 1) % daemons.length]
      setActiveDaemonId(next._id as Id<'daemons'>)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      const prev = daemons[(idx - 1 + daemons.length) % daemons.length]
      setActiveDaemonId(prev._id as Id<'daemons'>)
    } else if (!e.shiftKey && e.key === 'Enter') {
      openDetail()
    } else if (e.shiftKey && e.key === 'Enter') {
      // Focus AgentMail copy CTA (InboxGlyph) for active daemon
      const container = e.currentTarget as HTMLDivElement
      const active = container.querySelector('.pedestal.active .inbox-egg') as HTMLDivElement | null
      active?.focus()
    }
  }

  return (
    <div className="pedestals" role="group" aria-label="Daemon pedestals" tabIndex={0} onKeyDown={onKeyDown}>
      {daemons && daemons.slice(0, 3).map((d: Doc<'daemons'>, i: number) => {
        const isActive = d._id === activeDaemonId
        const hasError = !!(feeds && feeds.some((f: Doc<'feeds'>) => f.status === 'errored'))
        const classes = ['pedestal', positions[i] || 'pos-a', isActive ? 'active' : 'inactive', isActive && hasError ? 'errored' : ''].join(' ')
        return (
          <div className={classes} key={d._id} onClick={() => { setActiveDaemonId(d._id as Id<'daemons'>); openDetail(); }}>
            <InboxGlyph daemon={d as Doc<'daemons'>} badgeContent={isActive && feeds ? feeds.length : undefined} />
            <div className="name">{d.name}</div>
          </div>
        )
      })}
    </div>
  )
}