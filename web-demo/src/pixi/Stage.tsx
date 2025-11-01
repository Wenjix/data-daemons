import { useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'
import { usePetStore } from '../stores/petStore'
import { useDebugStore } from '../stores/debugStore'
import { useMagicStore } from '../stores/magicStore'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { SummonerBubble } from '../components/SummonerBubble'

export function Stage() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const activeDaemonId = usePetStore((s) => s.activeDaemonId)
  const visualStyle = useDebugStore((s) => s.visualStyle)
  const agentifyState = useMagicStore((s) => s.agentifyState)
  const daemon = useQuery(api.daemons.get, activeDaemonId ? { id: activeDaemonId } : 'skip')
  const stageCode = daemon?.stage ?? 0
  const satisfaction = daemon?.satisfaction ?? 0
  const stageName = ['Egg', 'Baby', 'Teen', 'Adult'][stageCode] ?? 'Egg'

  const handleSummon = () => {
    console.log('Summoning daily report web app...')
    // TODO: Implement actual summon logic
  }

  useEffect(() => {
    if (!containerRef.current) return
    let app: PIXI.Application | undefined
    let canvas: HTMLCanvasElement | undefined
    let mounted = true

    const init = async () => {
      if (!containerRef.current || !mounted) return

      try {
        app = new PIXI.Application()

        // Get container dimensions for explicit sizing
        // This avoids the resizeTo bug in Pixi.js v8 with React StrictMode
        const container = containerRef.current
        const width = container.clientWidth || 800
        // Use fixed height to match CSS max-height constraint
        const height = 600

        await app.init({
          width,
          height,
          background: visualStyle === 'memphis' ? '#ffffff' : '#0c0f12',
          autoStart: true,
          sharedTicker: false,
          preference: 'webgl', // Use WebGL to avoid WebGPU bugs in React
          antialias: true,
        })

        // IMPORTANT: Store canvas reference immediately after init
        canvas = app.canvas

        // Check if unmounted during async init
        if (!mounted || !containerRef.current) {
          // Safe destroy: check renderer exists before destroying
          if (app && app.renderer) {
            app.destroy(true)
          }
          return
        }

        containerRef.current.appendChild(canvas)

        // Performance guardrail: cap to 60fps (spec)
        if (app.ticker) {
          app.ticker.maxFPS = 60
        }

        // Note: Summoner portrait is rendered as HTML overlay (see JSX return)
        // This avoids Pixi asset loading conflicts with React StrictMode
      } catch (err) {
        console.error('Failed to initialize Pixi stage:', err)
        mounted = false
      }
    }

    init()

    return () => {
      mounted = false

      // Remove canvas from DOM FIRST (before destroying app)
      // Use the stored canvas reference, not app.canvas
      if (canvas?.parentElement) {
        canvas.parentElement.removeChild(canvas)
      }

      // Then destroy the app
      // Multiple safety checks: renderer exists
      if (app && app.renderer) {
        try {
          app.destroy(true, {
            children: true,
            texture: true,
            textureSource: true,
          })
        } catch (err) {
          console.error('Error destroying Pixi app:', err)
        }
      }
    }
  }, [stageCode, satisfaction, stageName, visualStyle])

  return (
    <div className="pixi-stage" ref={containerRef}>
      <img src="/summoner.png" alt="Summoner" className="summoner-portrait" />
      {agentifyState && <SummonerBubble onSummon={handleSummon} />}
    </div>
  )
}