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

    const run = async () => {
      app = new PIXI.Application()
      await app.init({ resizeTo: containerRef.current!, background: '#1b1e24' })
      containerRef.current!.appendChild(app.canvas)

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

      const onResize = () => {
        // future: adjust scene layout if needed
      }
      window.addEventListener('resize', onResize)

      return () => {
        window.removeEventListener('resize', onResize)
        if (app) {
          app.destroy(true)
          if (app.canvas && app.canvas.parentElement) {
            app.canvas.parentElement.removeChild(app.canvas)
          }
        }
      }
    }

    let cleanup: (() => void) | undefined
    run().then((c) => {
      cleanup = c
    })

    return () => {
      if (cleanup) cleanup()
    }
  }, [stageCode, satisfaction, stageName])

  return <div className="pixi-stage" ref={containerRef} />
}