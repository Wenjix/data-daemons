import { useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'
import { usePetStore } from '../stores/petStore'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

export function Stage() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const activeDaemonId = usePetStore((s) => s.activeDaemonId)
  const daemon = useQuery(api.daemons.get, activeDaemonId ? { id: activeDaemonId } : 'skip')
  const stageCode = daemon?.stage ?? 0
  const satisfaction = daemon?.satisfaction ?? 0
  const stageName = ['Egg', 'Baby', 'Teen', 'Adult'][stageCode] ?? 'Egg'

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
        const height = container.clientHeight || 600

        await app.init({
          width,
          height,
          background: '#0c0f12',
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

        // Simple placeholder graphics for Egg stage
        const graphics = new PIXI.Graphics()
        graphics.circle(200, 200, 80)
        graphics.fill(0xffffcc)
        app.stage.addChild(graphics)

        const text = new PIXI.Text({
          text: `${stageName} • satisfaction ${satisfaction}/5`,
          style: { fill: 0xffffff, fontSize: 18 },
        })
        text.x = 20
        text.y = 20
        app.stage.addChild(text)

        // Offload heavy effects to shader cache placeholder: pre-create a simple filter
        // In future, heavier effects should be preloaded and reused.
        const blurFilter = new PIXI.BlurFilter({ strength: 0 })
        graphics.filters = [blurFilter]
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
      // Multiple safety checks: renderer exists and not already destroyed
      if (app && app.renderer && !app._destroyed) {
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
  }, [stageCode, satisfaction, stageName])

  return <div className="pixi-stage" ref={containerRef} />
}