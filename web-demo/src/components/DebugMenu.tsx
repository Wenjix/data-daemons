import { useDebugStore } from '../stores/debugStore';
import { useSettingsStore } from '../stores/settingsStore';
import axios from 'axios';
import { useState } from 'react';

export function DebugMenu() {
  const { visualStyle, isMenuOpen, setVisualStyle, toggleMenu } = useDebugStore();
  const apiBaseUrl = useSettingsStore((state) => state.apiBaseUrl);
  const [webhookStatus, setWebhookStatus] = useState<string>('');

  const sendTestWebhook = async (daemon: 'nova' | 'pixel' | 'echo') => {
    setWebhookStatus(`Sending ${daemon}...`);

    const testPayloads = {
      nova: {
        to: ["nova-pet@agentmail.to"],
        subject: "Test Feed for Nova Daemon",
        text: "This message is specifically routed to Nova using the dedicated nova-pet@agentmail.to mailbox. Nova should process this feed and update its traits accordingly.",
        message_id: `test-nova-routing-${Date.now()}`
      },
      pixel: {
        to: ["pixel-pet@agentmail.to"],
        subject: "Test Feed for Pixel Daemon",
        text: "This message is specifically routed to Pixel using the dedicated pixel-pet@agentmail.to mailbox. Pixel should process this feed and update its traits independently from Nova and Echo.",
        message_id: `test-pixel-routing-${Date.now()}`
      },
      echo: {
        to: ["echo-pet@agentmail.to"],
        subject: "Test Feed for Echo Daemon",
        text: "This message is specifically routed to Echo using the dedicated echo-pet@agentmail.to mailbox. Echo should process this feed and update its traits independently from Nova and Pixel.",
        message_id: `test-echo-routing-${Date.now()}`
      }
    };

    try {
      const response = await axios.post(`${apiBaseUrl}/feed-by-email`, testPayloads[daemon]);
      setWebhookStatus(`✅ ${daemon.toUpperCase()} success`);
      console.log(`${daemon} webhook response:`, response.data);
      setTimeout(() => setWebhookStatus(''), 3000);
    } catch (error) {
      setWebhookStatus(`❌ ${daemon.toUpperCase()} failed`);
      console.error(`${daemon} webhook error:`, error);
      setTimeout(() => setWebhookStatus(''), 3000);
    }
  };

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

            <div className="debug-divider" style={{ margin: '1rem 0', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}></div>

            <h4 style={{ margin: '0.5rem 0', fontSize: '0.9rem', opacity: 0.8 }}>Test Webhooks</h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                onClick={() => sendTestWebhook('nova')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.5)',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.2)';
                }}
              >
                Test Nova Webhook
              </button>

              <button
                onClick={() => sendTestWebhook('pixel')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(236, 72, 153, 0.2)',
                  border: '1px solid rgba(236, 72, 153, 0.5)',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(236, 72, 153, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(236, 72, 153, 0.2)';
                }}
              >
                Test Pixel Webhook
              </button>

              <button
                onClick={() => sendTestWebhook('echo')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                  border: '1px solid rgba(34, 197, 94, 0.5)',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
                }}
              >
                Test Echo Webhook
              </button>

              {webhookStatus && (
                <div style={{
                  padding: '0.5rem',
                  marginTop: '0.5rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  textAlign: 'center'
                }}>
                  {webhookStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
