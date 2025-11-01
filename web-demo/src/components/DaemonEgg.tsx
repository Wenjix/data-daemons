import type { Doc } from '../../../convex/_generated/dataModel'

type Props = {
  daemon: Doc<'daemons'>
  badgeContent?: string | number
}

export function DaemonEgg({ daemon, badgeContent }: Props) {
  return (
    <div className="daemon-egg">
      <img
        src={`/daemon-${daemon.name.toLowerCase()}.png`}
        alt={daemon.name}
        className="daemon-portrait"
      />
      {badgeContent !== undefined && (
        <div className="badge">{badgeContent}</div>
      )}
    </div>
  )
}
