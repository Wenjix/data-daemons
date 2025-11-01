import { useState, useRef } from 'react'
import type { Doc } from '../../../convex/_generated/dataModel'

type Props = {
  daemon: Doc<'daemons'>
  badgeContent?: string | number
}

function makeEmailAddress(daemonName: string) {
  const local = daemonName.trim().toLowerCase().replace(/\s+/g, '-')
  return `daemon-${local}@agentmail.local` // placeholder domain for demo
}

export function InboxGlyph({ daemon, badgeContent }: Props) {
  const [showTip, setShowTip] = useState(false)
  const [copied, setCopied] = useState(false)
  const btnRef = useRef<HTMLDivElement | null>(null)
  const email = makeEmailAddress(daemon.name)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // noop
    }
  }

  return (
    <div
      className="inbox-egg"
      role="button"
      aria-label={`Email ${daemon.name} - press Enter to copy address`}
      tabIndex={0}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
      onFocus={() => setShowTip(true)}
      onBlur={() => setShowTip(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onCopy()
      }}
      onClick={onCopy}
      ref={btnRef}
    >
      <img
        src={`/daemon-${daemon.name.toLowerCase()}.png`}
        alt={daemon.name}
        className="daemon-portrait"
      />
      {/* Badge shows unread or recent count when provided; also show transient copied state */}
      {copied ? (
        <div className="badge">copied</div>
      ) : badgeContent !== undefined ? (
        <div className="badge">{badgeContent}</div>
      ) : null}
      {showTip && (
        <div className="tooltip">Send to {email}</div>
      )}
    </div>
  )
}