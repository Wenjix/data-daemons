import './App.css'
import { useEffect } from 'react'
import { Stage } from './pixi/Stage'
import { TraitPanel } from './components/TraitPanel'
import { DropZone } from './components/DropZone'
import { DaemonSwitcher } from './components/DaemonSwitcher'
import { FeedTimeline } from './components/FeedTimeline'
import { DaemonPedestals } from './components/DaemonPedestals'
import { DaemonDetail } from './components/DaemonDetail'
import { DebugMenu } from './components/DebugMenu'
import { useUIStore } from './stores/uiStore'
import { useDebugStore } from './stores/debugStore'

export default function App() {
  const detailOpen = useUIStore((s) => s.detailOpen)
  const visualStyle = useDebugStore((s) => s.visualStyle)

  const rootClassName = visualStyle === 'memphis' ? 'app-root memphis-design' : 'app-root'

  // Apply Memphis Design to body element for full-viewport background
  useEffect(() => {
    if (visualStyle === 'memphis') {
      document.body.classList.add('memphis-design')
    } else {
      document.body.classList.remove('memphis-design')
    }

    return () => {
      document.body.classList.remove('memphis-design')
    }
  }, [visualStyle])

  return (
    <div className={rootClassName}>
      <DebugMenu />
      {!detailOpen ? (
        <>
          <header className="app-header">
            <h1>Data Daemons • Summoning Hub</h1>
            <p className="subtitle">React + PixiJS + FastAPI • AgentMail-first • event-driven</p>
            <DaemonSwitcher />
          </header>
          <main className="app-main">
            <section className="left-rail">
              <DropZone />
              <FeedTimeline />
            </section>
            <section className="canvas-zone">
              <Stage />
              <DaemonPedestals />
            </section>
            <section className="right-panel">
              <TraitPanel />
            </section>
          </main>
        </>
      ) : (
        <DaemonDetail />
      )}
      <footer className="app-footer">
        <span>MVP • drag text or an image to feed the pet • evolution thresholds: Egg 5, Baby 8, Teen 12</span>
      </footer>
    </div>
  )
}
