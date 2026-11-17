"use client";

export default function EvaBottomNav() {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'space-between',
      padding: '12px 20px 16px 20px',
      background: '#0a0a12',
      borderTop: '1px solid #222',
      zIndex: 100
    }}>
      {/* LEFT UNDER - DISCOVER */}
      <button
        onClick={() => window.location.href = '/discover'}
        style={{
          background: '#1a1a2e',
          color: 'white',
          border: '1px solid #333',
          padding: '12px 28px',
          borderRadius: '25px',
          fontSize: '15px',
          fontWeight: 'bold'
        }}
      >
        Discover
      </button>

      {/* RIGHT UNDER - CHAT */}
      <button
        onClick={() => window.location.href = '/chat'}
        style={{
          background: '#7c3aed',
          color: 'white',
          border: 'none',
          padding: '12px 28px',
          borderRadius: '25px',
          fontSize: '15px',
          fontWeight: 'bold'
        }}
      >
        Chat
      </button>
    </div>
  );
}
