import './App.css'
import { Stage } from './pixi/Stage'
import { TraitPanel } from './components/TraitPanel'
import { DropZone } from './components/DropZone'
import { DaemonSwitcher } from './components/DaemonSwitcher'

export default function App() {
  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Datagotchi Web Demo</h1>
        <p className="subtitle">React + PixiJS + FastAPI (mock mode)</p>
        <DaemonSwitcher />
      </header>
      <main className="app-main">
        <section className="left">
          <DropZone />
          <Stage />
        </section>
        <section className="right">
          <TraitPanel />
        </section>
      </main>
      <footer className="app-footer">
        <span>MVP • drag text or an image to feed the pet • evolution thresholds: Egg 5, Baby 8, Teen 12</span>
      </footer>
    </div>
  )
}
