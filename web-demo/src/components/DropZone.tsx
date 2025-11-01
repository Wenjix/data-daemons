import { useCallback, useMemo, useRef, useState } from 'react'
import { eventBus } from '../lib/eventBus'
import { postAnalyze } from '../api/client'
import type { TraitKey } from '../api/types'
import { usePetStore } from '../stores/petStore'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'

type Traits = {
  Intelligence: number
  Creativity: number
  Empathy: number
  Resilience: number
  Curiosity: number
  Humor: number
  Kindness: number
  Confidence: number
  Discipline: number
  Honesty: number
  Patience: number
  Optimism: number
  Courage: number
  OpenMindedness: number
  Prudence: number
  Adaptability: number
  Gratitude: number
  Ambition: number
  Humility: number
  Playfulness: number
}

function toTraitsObject(deltaObj: Record<string, number>): Traits {
  return {
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
  }
}

const emptyTraits: Record<TraitKey, number> = {
  Intelligence: 0,
  Creativity: 0,
  Empathy: 0,
  Resilience: 0,
  Curiosity: 0,
  Humor: 0,
  Kindness: 0,
  Confidence: 0,
  Discipline: 0,
  Honesty: 0,
  Patience: 0,
  Optimism: 0,
  Courage: 0,
  OpenMindedness: 0,
  Prudence: 0,
  Adaptability: 0,
  Gratitude: 0,
  Ambition: 0,
  Humility: 0,
  Playfulness: 0,
}

export function DropZone() {
  const [hover, setHover] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const setRoast = usePetStore((s) => s.setRoast)
  const activeDaemonId = usePetStore((s) => s.activeDaemonId)
  const setLastFeedTime = usePetStore((s) => s.setLastFeedTime)
  const daemon = useQuery(api.daemons.get, activeDaemonId ? { id: activeDaemonId } : 'skip')
  const startProcessing = useMutation(api.feeds.startProcessing)
  const complete = useMutation(api.feeds.complete)
  const errored = useMutation(api.feeds.errored)

  const makeFeedId = () => {
    const g = (window.crypto && 'randomUUID' in window.crypto)
      ? (window.crypto as any).randomUUID()
      : `feed_${Date.now()}_${Math.floor(Math.random() * 100000)}`
    return g
  }

  const currentTraits = useMemo(
    () => daemon
      ? { values: daemon.traits, active: [] }
      : { values: emptyTraits, active: [] },
    [daemon]
  )

  const onDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setHover(false)
    if (!activeDaemonId) {
      alert('Select a daemon first.')
      return
    }
    const file = e.dataTransfer.files?.[0]
    if (file) {
      const textTypes = ['text/plain', 'application/json']
      if (textTypes.includes(file.type)) {
        const txt = await file.text()
        try {
          const feedId = makeFeedId()
          await startProcessing({
            feedId,
            daemonId: activeDaemonId,
            source: 'drag-drop',
            contentSummary: txt.slice(0, 64),
            attachmentsMeta: null,
            now: Date.now(),
          })
          const res = await postAnalyze({ text: txt, currentTraits, currentArchetypeId: daemon?.archetypeId })
          setRoast(res.roast)
          eventBus.emit('analyzeResult', res)
          const deltaObj: Record<string, number> = {}
          for (const d of res.traitDeltas) deltaObj[d.trait] = d.delta
          await complete({
            feedId,
            traitsDelta: toTraitsObject(deltaObj),
            roast: res.roast || '',
            now: Date.now(),
            newArchetypeId: res.newArchetypeId,
            topTraits: res.topTraits,
          })
          if (activeDaemonId) setLastFeedTime(activeDaemonId, Date.now())
        } catch (err) {
          console.error('Analysis failed:', err)
          const res = { caption: txt.slice(0, 64), tags: ['text', 'mock'], roast: 'Local mock: witty', traitDeltas: [] }
          setRoast(res.roast)
          eventBus.emit('analyzeResult', res)
          try {
            const feedId = makeFeedId()
            await startProcessing({
              feedId,
              daemonId: activeDaemonId,
              source: 'drag-drop',
              contentSummary: txt.slice(0, 64),
              attachmentsMeta: null,
              now: Date.now(),
            })
            await complete({ feedId, traitsDelta: toTraitsObject({}), roast: res.roast || '', now: Date.now() })
          } catch (e) {
            console.error('Failed to record feed completion:', e)
            const feedId = makeFeedId()
            await errored({ feedId, errorMessage: 'analyze failure', now: Date.now() })
          }
        }
        return
      }
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file)
        try {
          const feedId = makeFeedId()
          await startProcessing({
            feedId,
            daemonId: activeDaemonId,
            source: 'drag-drop',
            contentSummary: 'image',
            attachmentsMeta: { blobUrl: url },
            now: Date.now(),
          })
          const res = await postAnalyze({ imageUrl: url, currentTraits })
          setRoast(res.roast)
          eventBus.emit('analyzeResult', res)
          const deltaObj: Record<string, number> = {}
          for (const d of res.traitDeltas) deltaObj[d.trait] = d.delta
          await complete({ feedId, traitsDelta: toTraitsObject(deltaObj), roast: res.roast || '', now: Date.now() })
          if (activeDaemonId) setLastFeedTime(activeDaemonId, Date.now())
        } catch (err) {
          console.error('Analysis failed:', err)
          const res = { caption: 'Image mock', tags: ['image', 'mock'], roast: 'Local mock: nice pic', traitDeltas: [] }
          setRoast(res.roast)
          eventBus.emit('analyzeResult', res)
          try {
            const feedId = makeFeedId()
            await startProcessing({
              feedId,
              daemonId: activeDaemonId,
              source: 'drag-drop',
              contentSummary: 'image',
              attachmentsMeta: { blobUrl: url },
              now: Date.now(),
            })
            await complete({ feedId, traitsDelta: toTraitsObject({}), roast: res.roast || '', now: Date.now() })
          } catch (e) {
            console.error('Failed to record feed completion:', e)
            const feedId = makeFeedId()
            await errored({ feedId, errorMessage: 'analyze failure', now: Date.now() })
          }
        }
        return
      }
    }
  }, [activeDaemonId, currentTraits, setRoast, startProcessing, complete, errored, daemon, setLastFeedTime])

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setHover(true)
  }

  const onDragLeave = () => setHover(false)

  const onPaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const txt = e.clipboardData.getData('text')
    if (txt) {
      if (!activeDaemonId) {
        alert('Select a daemon first.')
        return
      }
      try {
        const feedId = makeFeedId()
        await startProcessing({
          feedId,
          daemonId: activeDaemonId,
          source: 'drag-drop',
          contentSummary: txt.slice(0, 64),
          attachmentsMeta: null,
          now: Date.now(),
        })
        const res = await postAnalyze({ text: txt, currentTraits })
        setRoast(res.roast)
        eventBus.emit('analyzeResult', res)
        const deltaObj: Record<string, number> = {}
        for (const d of res.traitDeltas) deltaObj[d.trait] = d.delta
        await complete({ feedId, traitsDelta: toTraitsObject(deltaObj), roast: res.roast || '', now: Date.now() })
        if (activeDaemonId) setLastFeedTime(activeDaemonId, Date.now())
      } catch (err) {
        console.error('Analysis failed:', err)
        const res = { caption: txt.slice(0, 64), tags: ['text', 'mock'], roast: 'Local mock: paste', traitDeltas: [] }
        setRoast(res.roast)
        eventBus.emit('analyzeResult', res)
      }
    }
  }

  const onManualText = async () => {
    const txt = prompt('Enter text to feed the pet:')
    if (txt) {
      if (!activeDaemonId) {
        alert('Select a daemon first.')
        return
      }
      try {
        const feedId = makeFeedId()
        await startProcessing({
          feedId,
          daemonId: activeDaemonId,
          source: 'drag-drop',
          contentSummary: txt.slice(0, 64),
          attachmentsMeta: null,
          now: Date.now(),
        })
        const res = await postAnalyze({ text: txt, currentTraits })
        setRoast(res.roast)
        eventBus.emit('analyzeResult', res)
        const deltaObj: Record<string, number> = {}
        for (const d of res.traitDeltas) deltaObj[d.trait] = d.delta
        await complete({ feedId, traitsDelta: toTraitsObject(deltaObj), roast: res.roast || '', now: Date.now() })
        if (activeDaemonId) setLastFeedTime(activeDaemonId, Date.now())
      } catch (err) {
        console.error('Analysis failed:', err)
        const res = { caption: txt.slice(0, 64), tags: ['text', 'mock'], roast: 'Local mock: typed', traitDeltas: [] }
        setRoast(res.roast)
        eventBus.emit('analyzeResult', res)
      }
    }
  }

  return (
    <div
      className={`drop-zone ${hover ? 'hover' : ''}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onPaste={onPaste}
      role="region"
      aria-label="Feed drop zone"
      tabIndex={0}
    >
      <div className="drop-content">
        <span>Drag & drop text or image here • or paste • or </span>
        <button className="btn" onClick={onManualText}>type text</button>
        <input ref={inputRef} type="file" hidden />
      </div>
    </div>
  )
}