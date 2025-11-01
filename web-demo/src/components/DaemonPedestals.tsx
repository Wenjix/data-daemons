import { useEffect, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Doc, Id } from '../../../convex/_generated/dataModel'
import { usePetStore } from '../stores/petStore'
import { DaemonEgg } from './DaemonEgg'
import { useUIStore } from '../stores/uiStore'
import { SpeechBubble } from './SpeechBubble'
import { AgentifyBubble } from './AgentifyBubble'
import { useMagicStore } from '../stores/magicStore'
import { useIdleMusingsForDaemon } from '../hooks/useIdleMusings'

// Activity suggestions for each daemon
const DAEMON_ACTIVITIES: Record<string, string> = {
  Nova: "I can help you analyze your inbox patterns and surface insights from your communications",
  Pixel: "Let me craft a visual dashboard to track your creative projects and inspiration sources",
  Echo: "I'll synthesize your meeting notes into actionable summaries and track follow-ups"
}

interface DaemonPedestalProps {
  daemon: Doc<'daemons'>
  index: number
  position: string
  isActive: boolean
  hasError: boolean
  isCopied: boolean
  onChat: (daemon: Doc<'daemons'>) => void
  onStats: (daemonId: Id<'daemons'>) => void
  onEmail: (daemon: Doc<'daemons'>) => void
  onSelect: (daemonId: Id<'daemons'>) => void
}

function DaemonPedestal({
  daemon,
  index,
  position,
  isActive,
  hasError,
  isCopied,
  onChat,
  onStats,
  onEmail,
  onSelect,
}: DaemonPedestalProps) {
  // Initialize idle musings for this daemon
  useIdleMusingsForDaemon(daemon._id as Id<'daemons'>, index)

  const idleMusings = usePetStore((s) => s.idleMusings)
  const clearIdleMusing = usePetStore((s) => s.clearIdleMusing)
  const daemonMusing = idleMusings[daemon._id]
  const agentifyState = useMagicStore((s) => s.agentifyState)

  const classes = [
    'pedestal',
    position,
    isActive ? 'active' : 'inactive',
    isActive && hasError ? 'errored' : '',
  ].join(' ')

  const activityMessage = DAEMON_ACTIVITIES[daemon.name] || "I can help you with various tasks"

  return (
    <div className={classes} key={daemon._id} onClick={() => onSelect(daemon._id as Id<'daemons'>)}>
      {/* Action buttons - revealed on hover */}
      <div className="action-buttons">
        <button
          className="action-btn"
          onClick={(e) => {
            e.stopPropagation()
            onChat(daemon)
          }}
          title="Chat with daemon"
          aria-label="Chat with daemon"
        >
          ⚡
        </button>
        <button
          className="action-btn"
          onClick={(e) => {
            e.stopPropagation()
            onStats(daemon._id as Id<'daemons'>)
          }}
          title="View stats"
          aria-label="View daemon stats"
        >
          📊
        </button>
        <button
          className="action-btn"
          onClick={(e) => {
            e.stopPropagation()
            onEmail(daemon)
          }}
          title="Copy email address"
          aria-label="Copy daemon email address"
        >
          {isCopied ? '✓' : '✉️'}
        </button>
      </div>

      {/* Daemon egg display */}
      <DaemonEgg daemon={daemon} badgeContent={isCopied ? 'copied' : undefined} />

      {/* Speech bubbles - conditional based on agentifyState */}
      {agentifyState ? (
        <AgentifyBubble message={activityMessage} daemonName={daemon.name} />
      ) : (
        daemonMusing && (
          <SpeechBubble message={daemonMusing.message} onDismiss={() => clearIdleMusing(daemon._id)} />
        )
      )}

      {/* Nameplate */}
      <div className={`nameplate nameplate-${daemon.name.toLowerCase()}`}>{daemon.name}</div>
    </div>
  )
}

export function DaemonPedestals() {
  const daemons = useQuery(api.daemons.all)
  const activeDaemonId = usePetStore((s) => s.activeDaemonId)
  const setActiveDaemonId = usePetStore((s) => s.setActiveDaemonId)
  const feeds = useQuery(api.feeds.listByDaemon, activeDaemonId ? { daemonId: activeDaemonId } : 'skip')
  const openDetail = useUIStore((s) => s.openDetail)
  const openChat = useUIStore((s) => s.openChat)

  useEffect(() => {
    if (daemons && !activeDaemonId && daemons[0]) {
      setActiveDaemonId(daemons[0]._id)
    }
  }, [daemons, activeDaemonId, setActiveDaemonId])

  const [copiedDaemonId, setCopiedDaemonId] = useState<Id<'daemons'> | null>(null)

  const positions = ['pos-a', 'pos-b', 'pos-c']

  const makeEmailAddress = (daemonName: string) => {
    const local = daemonName.trim().toLowerCase().replace(/\s+/g, '-')
    return `${local}-pet@agentmail.to`
  }

  const handleChat = (daemon: Doc<'daemons'>) => {
    openChat(daemon._id as Id<'daemons'>)
  }

  const handleStats = (daemonId: Id<'daemons'>) => {
    setActiveDaemonId(daemonId)
    openDetail()
  }

  const handleEmail = async (daemon: Doc<'daemons'>) => {
    try {
      const email = makeEmailAddress(daemon.name)
      await navigator.clipboard.writeText(email)
      setCopiedDaemonId(daemon._id as Id<'daemons'>)
      setTimeout(() => setCopiedDaemonId(null), 1200)
    } catch {
      // noop
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!daemons || daemons.length === 0) return
    const idx = daemons.findIndex((d: Doc<'daemons'>) => d._id === activeDaemonId)
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      const next = daemons[(idx + 1) % daemons.length]
      setActiveDaemonId(next._id as Id<'daemons'>)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      const prev = daemons[(idx - 1 + daemons.length) % daemons.length]
      setActiveDaemonId(prev._id as Id<'daemons'>)
    } else if (e.key === 'Enter') {
      // Open detail view for active daemon
      if (activeDaemonId) {
        openDetail()
      }
    }
  }

  return (
    <div className="pedestals" role="group" aria-label="Daemon pedestals" tabIndex={0} onKeyDown={onKeyDown}>
      {daemons &&
        daemons.slice(0, 3).map((d: Doc<'daemons'>, i: number) => {
          const isActive = d._id === activeDaemonId
          const hasError = !!(isActive && feeds && feeds.some((f: Doc<'feeds'>) => f.status === 'errored'))
          const isCopied = copiedDaemonId === d._id

          return (
            <DaemonPedestal
              key={d._id}
              daemon={d}
              index={i}
              position={positions[i] || 'pos-a'}
              isActive={isActive}
              hasError={hasError}
              isCopied={isCopied}
              onChat={handleChat}
              onStats={handleStats}
              onEmail={handleEmail}
              onSelect={setActiveDaemonId}
            />
          )
        })}
    </div>
  )
}