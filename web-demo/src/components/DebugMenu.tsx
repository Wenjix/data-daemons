import { useDebugStore } from '../stores/debugStore';

export function DebugMenu() {
  const { visualStyle, isMenuOpen, setVisualStyle, toggleMenu } = useDebugStore();

  return (
    <div className="debug-menu">
      <button
        className="debug-menu-button"
        onClick={toggleMenu}
        aria-label="Toggle debug menu"
        aria-expanded={isMenuOpen}
      >
        <span className="debug-icon">🎨</span>
      </button>

      {isMenuOpen && (
        <div className="debug-menu-panel">
          <div className="debug-menu-header">
            <h3>Visual Style</h3>
            <button
              className="debug-close-button"
              onClick={toggleMenu}
              aria-label="Close debug menu"
            >
              ×
            </button>
          </div>

          <div className="debug-menu-content">
            <label className="debug-style-option">
              <input
                type="radio"
                name="visual-style"
                value="default"
                checked={visualStyle === 'default'}
                onChange={() => setVisualStyle('default')}
              />
              <span className="debug-style-label">
                <span className="debug-style-name">Default</span>
                <span className="debug-style-desc">Current design system</span>
              </span>
            </label>

            <label className="debug-style-option">
              <input
                type="radio"
                name="visual-style"
                value="memphis"
                checked={visualStyle === 'memphis'}
                onChange={() => setVisualStyle('memphis')}
              />
              <span className="debug-style-label">
                <span className="debug-style-name">Memphis Design</span>
                <span className="debug-style-desc">Bold colors, geometric shapes, playful patterns</span>
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
