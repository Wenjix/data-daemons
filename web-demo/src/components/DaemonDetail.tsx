import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Doc, Id } from '../../../convex/_generated/dataModel'
import { usePetStore } from '../stores/petStore'
import { useUIStore } from '../stores/uiStore'
import { postAnalyze } from '../api/client'

function makeEmailAddress(daemonName: string) {
  const local = daemonName.trim().toLowerCase().replace(/\s+/g, '-')
  return `daemon-${local}@agentmail.local`
}

function HoloDiagram({ daemon }: { daemon: Doc<'daemons'> }) {
  const traits = daemon.traits || {}
  const sorted = Object.entries(traits).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 6)
  const hue = 180 // teal-ish base
  return (
    <div className="holo-diagram">
      <svg viewBox="0 0 400 300" width="100%" height="260">
        <defs>
          <radialGradient id="aura" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(111,244,255,0.35)" />
            <stop offset="100%" stopColor="rgba(6,84,94,0.05)" />
          </radialGradient>
        </defs>
        {/* Aura */}
        <ellipse cx="200" cy="150" rx="140" ry="90" fill="url(#aura)" />
        {/* Armor modules as layered rings */}
        <g stroke={`hsl(${hue},70%,50%)`} fill="none" strokeOpacity={0.6}>
          <circle cx="200" cy="150" r="60" />
          <circle cx="200" cy="150" r="85" strokeDasharray="6 6" />
          <circle cx="200" cy="150" r="110" strokeDasharray="3 6" />
        </g>
        {/* Temperament sigils */}
        <g stroke="#d94b8a" strokeOpacity={0.5}>
          <path d="M200 80 l10 18 l-20 0 z" fill="#d94b8a" fillOpacity={0.3} />
          <path d="M260 120 l10 18 l-20 0 z" fill="#d94b8a" fillOpacity={0.3} />
          <path d="M140 120 l10 18 l-20 0 z" fill="#d94b8a" fillOpacity={0.3} />
        </g>
      </svg>
      <div className="hud-chips">
        {sorted.map(([key, val]) => (
          <div className="hud-chip" key={key}>
            <span className="chip-label">{key}</span>
            <span className="chip-val">{val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RuneRingSliders({ daemonId }: { daemonId: Id<'daemons'> }) {
  const [aggression, setAggression] = useState(40)
  const [support, setSupport] = useState(60)
  const [tempo, setTempo] = useState(50)
  const [verbosity, setVerbosity] = useState(50)
  const updateTraits = useMutation(api.daemons.updateTraits)

  function computeDeltas() {
    // Map gameplay-flavored knobs to trait deltas around a neutral midpoint of 50
    const a = (aggression - 50) / 10 // [-5, 5]
    const s = (support - 50) / 10
    const t = (tempo - 50) / 10
    const v = (verbosity - 50) / 10
    const deltas: { trait: string, delta: number }[] = []
    // Aggression favors assertive traits
    deltas.push({ trait: 'Courage', delta: a })
    deltas.push({ trait: 'Confidence', delta: a })
    deltas.push({ trait: 'Ambition', delta: a / 2 })
    // Support favors cooperative traits
    deltas.push({ trait: 'Empathy', delta: s })
    deltas.push({ trait: 'Kindness', delta: s })
    deltas.push({ trait: 'Gratitude', delta: s / 2 })
    // Tempo affects adaptability vs patience
    deltas.push({ trait: 'Adaptability', delta: t })
    deltas.push({ trait: 'Creativity', delta: t / 2 })
    deltas.push({ trait: 'Patience', delta: -t / 2 })
    // Verbosity affects openness vs prudence/discipline
    deltas.push({ trait: 'OpenMindedness', delta: v })
    deltas.push({ trait: 'Humor', delta: v / 2 })
    deltas.push({ trait: 'Discipline', delta: -v / 2 })
    deltas.push({ trait: 'Prudence', delta: -v / 3 })
    return deltas
  }

  async function applyTuning() {
    try {
      await updateTraits({
        daemonId,
        traitDeltas: computeDeltas(),
      })
    } catch (e) {
      console.error('Failed to apply tuning', e)
      alert('Tuning failed to apply. See console for details.')
    }
  }

  return (
    <div className="rune-rings">
      <div className="rune-group">
        <label>Aggression</label>
        <input aria-label="Aggression tuning" type="range" min={0} max={100} value={aggression} onChange={(e) => setAggression(parseInt(e.target.value))} />
      </div>
      <div className="rune-group">
        <label>Support</label>
        <input aria-label="Support tuning" type="range" min={0} max={100} value={support} onChange={(e) => setSupport(parseInt(e.target.value))} />
      </div>
      <div className="rune-group">
        <label>Tempo</label>
        <input aria-label="Tempo tuning" type="range" min={0} max={100} value={tempo} onChange={(e) => setTempo(parseInt(e.target.value))} />
      </div>
      <div className="rune-group">
        <label>Verbosity</label>
        <input aria-label="Verbosity tuning" type="range" min={0} max={100} value={verbosity} onChange={(e) => setVerbosity(parseInt(e.target.value))} />
      </div>
      <div className="rune-apply">
        <button className="btn primary" onClick={applyTuning}>Apply Tuning</button>
      </div>
    </div>
  )
}

function InboxPanel({ daemon }: { daemon: Doc<'daemons'> }) {
  const activeDaemonId = usePetStore((s) => s.activeDaemonId)
  const setRoast = usePetStore((s) => s.setRoast)
  const feeds = useQuery(api.feeds.listByDaemon, activeDaemonId ? { daemonId: activeDaemonId } : 'skip')
  const startProcessing = useMutation(api.feeds.startProcessing)
  const complete = useMutation(api.feeds.complete)
  const errored = useMutation(api.feeds.errored)
  const email = makeEmailAddress(daemon.name)
  const latest = feeds && feeds[0]

  // Upload handler
  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !activeDaemonId) return
    const isText = ['text/plain', 'application/json'].includes(file.type)
    const feedId = (window.crypto && 'randomUUID' in window.crypto)
      ? (window.crypto.randomUUID as () => string)()
      : `feed_${Date.now()}_${Math.floor(Math.random() * 100000)}`
    try {
      await startProcessing({
        feedId,
        daemonId: activeDaemonId,
        source: 'drag-drop',
        contentSummary: isText ? (await file.text()).slice(0, 64) : 'upload',
        attachmentsMeta: isText ? null : { blobUrl: URL.createObjectURL(file) },
        now: Date.now(),
      })
      const currentTraits = { values: daemon.traits, active: [] }
      const res = isText
        ? await postAnalyze({ text: await file.text(), currentTraits })
        : await postAnalyze({ imageUrl: URL.createObjectURL(file), currentTraits })
      const deltaObj: Record<string, number> = {}
      for (const d of res.traitDeltas) deltaObj[d.trait] = d.delta
      setRoast(res.roast || '')
      await complete({ feedId, traitsDelta: {
        Intelligence: deltaObj.Intelligence || 0,
        Creativity: deltaObj.Creativity || 0,
        Empathy: deltaObj.Empathy || 0,
        Resilience: deltaObj.Resilience || 0,
        Curiosity: deltaObj.Curiosity || 0,
        Humor: deltaObj.Humor || 0,
        Kindness: deltaObj.Kindness || 0,
        Confidence: deltaObj.Confidence || 0,
        Discipline: deltaObj.Discipline || 0,
        Honesty: deltaObj.Honesty || 0,
        Patience: deltaObj.Patience || 0,
        Optimism: deltaObj.Optimism || 0,
        Courage: deltaObj.Courage || 0,
        OpenMindedness: deltaObj.OpenMindedness || 0,
        Prudence: deltaObj.Prudence || 0,
        Adaptability: deltaObj.Adaptability || 0,
        Gratitude: deltaObj.Gratitude || 0,
        Ambition: deltaObj.Ambition || 0,
        Humility: deltaObj.Humility || 0,
        Playfulness: deltaObj.Playfulness || 0,
      }, roast: res.roast || '', now: Date.now() })
    } catch (err) {
      console.error('Upload/analyze failed', err)
      await errored({ feedId, errorMessage: 'analyze failure', now: Date.now() })
    }
  }

  return (
    <div className="inbox-panel">
      <div className="email-line">
        <span>Email:</span>
        <code>{email}</code>
        <button onClick={() => navigator.clipboard.writeText(email)}>Copy</button>
      </div>
      <div className="latest-meta">
        <span>Latest:</span>
        <span>{latest ? `${latest.source} • ${latest.status} • ${latest.contentSummary}` : 'No feeds yet'}</span>
      </div>
      <div className="upload-cta">
        <label className="btn">
          Upload file
          <input type="file" style={{ display: 'none' }} onChange={onUpload} />
        </label>
      </div>
    </div>
  )
}

function TabStrip({ daemon }: { daemon: Doc<'daemons'> }) {
  const [tab, setTab] = useState<'lore' | 'abilities' | 'equipment'>('lore')
  const roast = usePetStore((s) => s.roast)
  const traits = daemon.traits || {}
  const top = Object.entries(traits).sort((a,b) => (b[1] as number) - (a[1] as number)).slice(0, 6)
  const latest = useQuery(api.feeds.listByDaemon, daemon._id ? { daemonId: daemon._id } : 'skip') || []
  const attachments = latest[0]?.attachmentsMeta
  return (
    <div className="tab-strip">
      <div className="tabs">
        <button className={tab==='lore' ? 'active' : ''} onClick={() => setTab('lore')}>Lore</button>
        <button className={tab==='abilities' ? 'active' : ''} onClick={() => setTab('abilities')}>Abilities</button>
        <button className={tab==='equipment' ? 'active' : ''} onClick={() => setTab('equipment')}>Equipment</button>
      </div>
      <div className="tab-content">
        {tab === 'lore' && (
          <div>
            <p>{roast || 'Feed the daemon to reveal narrative and personality insights.'}</p>
          </div>
        )}
        {tab === 'abilities' && (
          <div className="abilities-grid">
            {top.map(([k,v]) => (
              <div className="ability-card" key={k}>
                <div className="sigil" />
                <div className="title">{k} Affinity</div>
                <div className="desc">Unlocked level {Math.max(1, Math.floor((v as number)/5))}</div>
              </div>
            ))}
          </div>
        )}
        {tab === 'equipment' && (
          <div>
            {attachments ? (
              <div className="equipment-item">Attachment equipped: {JSON.stringify(attachments)}</div>
            ) : (
              <div className="equipment-item">No equipment yet. Upload a file to equip attachments.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function DaemonDetail() {
  const activeDaemonId = usePetStore((s) => s.activeDaemonId)
  const daemon = useQuery(api.daemons.get, activeDaemonId ? { id: activeDaemonId } : 'skip')
  const closeDetail = useUIStore((s) => s.closeDetail)
  const backBtnRef = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDetail() }
    window.addEventListener('keydown', onKey)
    // Focus the Back button when the detail opens
    setTimeout(() => backBtnRef.current?.focus(), 0)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeDetail])
  if (!daemon) return <div className="detail-root">Loading...</div>
  return (
    <div className="detail-root">
      <header className="detail-header">
        <button ref={backBtnRef} onClick={closeDetail} aria-label="Back to Summoning Hub">Back to Hub</button>
        <h2>{daemon.name} Profile</h2>
      </header>
      <main className="detail-main">
        <section className="detail-left">
          <HoloDiagram daemon={daemon as Doc<'daemons'>} />
          <InboxPanel daemon={daemon as Doc<'daemons'>} />
        </section>
        <section className="detail-right">
          <RuneRingSliders daemonId={daemon._id} />
          <TabStrip daemon={daemon as Doc<'daemons'>} />
        </section>
      </main>
    </div>
  )
}