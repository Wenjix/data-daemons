import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useUIStore } from '../stores/uiStore'

export function DaemonChat() {
  const chatOpen = useUIStore((s) => s.chatOpen)
  const activeChatDaemonId = useUIStore((s) => s.activeChatDaemonId)
  const closeChat = useUIStore((s) => s.closeChat)
  const daemon = useQuery(
    api.daemons.get,
    activeChatDaemonId ? { id: activeChatDaemonId } : 'skip'
  )

  if (!chatOpen || !daemon) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop"
        onClick={closeChat}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
        }}
      />

      {/* Modal */}
      <div
        className="daemon-chat-modal"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh',
          background: 'rgba(12, 15, 18, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(111, 244, 255, 0.3)',
          borderRadius: 'var(--radii-panel)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: 'var(--space-3) var(--space-4)',
            borderBottom: '1px solid #2a2f3a',
            background: 'radial-gradient(600px 200px at 50% -10%, rgba(111,244,255,0.08), transparent)',
          }}
        >
          <img
            src={`/daemon-${daemon.name.toLowerCase()}.png`}
            alt={daemon.name}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid rgba(111,244,255,0.3)',
            }}
          />
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '18px', letterSpacing: '0.4px' }}>
              Chat with {daemon.name}
            </h2>
            <p style={{ margin: '2px 0 0', color: '#9aa3b2', fontSize: '12px' }}>
              Stage {daemon.stage ?? 0} • Satisfaction {daemon.satisfaction ?? 0}/5
            </p>
          </div>
          <button
            onClick={closeChat}
            style={{
              width: '32px',
              height: '32px',
              padding: 0,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#c5cedd',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close chat"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            padding: 'var(--space-4)',
            overflowY: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              color: '#9aa3b2',
              maxWidth: '400px',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <h3 style={{ margin: '0 0 8px', color: '#c5cedd' }}>
              Chat Interface Coming Soon
            </h3>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
              This feature will allow you to communicate directly with {daemon.name}.
              Stay tuned for updates!
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
