import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

function h(type, props, ...children) {
  const kids = children.length === 0 ? undefined : children.length === 1 ? children[0] : children;
  return { type, key: null, ref: null, props: { ...props, children: kids }, _owner: null, _store: {} };
}

// Piece colors (index 0 = empty)
const C = ['transparent','#00d8ff','#ffe000','#cc00ff','#00ffaa','#ff2040','#2979ff','#ff8c00'];
const G = ['none','rgba(0,216,255,0.5)','rgba(255,224,0,0.5)','rgba(204,0,255,0.5)','rgba(0,255,170,0.5)','rgba(255,32,64,0.5)','rgba(41,121,255,0.5)','rgba(255,140,0,0.5)'];

// Simulated board (20 rows × 10 cols). Bottom rows more filled, top rows sparser.
const BOARD = [
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,2,2,0,0,0,0,0],
  [0,0,0,2,2,0,0,0,0,0],
  [0,0,3,3,3,0,0,0,0,0],
  [0,0,0,3,0,0,4,4,0,0],
  [0,6,6,0,4,4,0,5,5,0],
  [0,6,0,0,0,5,5,0,7,0],
  [5,5,6,1,1,1,1,0,7,0],
  [0,5,0,0,2,2,0,7,7,3],
  [3,3,3,0,2,2,7,7,0,3],
  [0,3,0,1,1,1,1,0,6,6],
  [7,7,0,3,3,3,0,5,6,6],
  [7,0,7,0,3,0,5,5,0,2],
  [7,7,6,6,1,1,1,1,2,2],
  [3,3,6,6,2,2,5,5,3,3],
  [7,3,3,7,2,2,3,5,5,6],
  [6,6,3,3,6,6,7,7,5,5],
];

const CELL = 22;

export default function handler() {
  return new ImageResponse(
    h('div', {
      style: {
        background: '#04041e',
        width: '100%', height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      },
    },

    // Subtle grid background
    h('div', {
      style: {
        position: 'absolute', inset: 0,
        backgroundImage:
          'linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      },
    }),

    // Neon glow top-left (green)
    h('div', { style: { position:'absolute', top:'-100px', left:'-60px', width:'450px', height:'450px', borderRadius:'50%', background:'radial-gradient(circle, rgba(0,255,136,0.09) 0%, transparent 70%)' } }),
    // Neon glow bottom-right (yellow)
    h('div', { style: { position:'absolute', bottom:'-80px', right:'80px', width:'520px', height:'520px', borderRadius:'50%', background:'radial-gradient(circle, rgba(255,230,0,0.07) 0%, transparent 70%)' } }),

    // Main content row
    h('div', {
      style: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        padding: '60px 70px',
        gap: 70,
        position: 'relative',
      },
    },

    // LEFT: Simulated Tetris board
    h('div', {
      style: {
        display: 'flex',
        flexShrink: 0,
        border: '2px solid #00ff88',
        boxShadow: '0 0 40px rgba(0,255,136,0.45), 0 0 100px rgba(0,255,136,0.15), inset 0 0 20px rgba(0,0,0,0.9)',
        padding: 3,
        background: 'rgba(0,0,8,0.95)',
      },
    },
    h('div', {
      style: { display: 'flex', flexDirection: 'column', gap: 1 },
    },
    ...BOARD.map((row, ri) =>
      h('div', { key: ri, style: { display: 'flex', gap: 1 } },
        ...row.map((c, ci) =>
          h('div', {
            key: ci,
            style: {
              width: CELL, height: CELL,
              background: c ? C[c] : 'rgba(0,255,136,0.04)',
              boxShadow: c ? `0 0 5px ${G[c]}` : 'none',
              border: c ? 'none' : '1px solid rgba(0,255,136,0.07)',
              borderRadius: 2,
            },
          })
        )
      )
    ),
    ),
    ),

    // RIGHT: Branding panel
    h('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        justifyContent: 'center',
      },
    },

    // GLOWTRIS logo
    h('div', {
      style: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'baseline',
        letterSpacing: '-2px',
        marginBottom: 14,
      },
    },
    h('span', {
      style: {
        fontSize: 88, fontWeight: 900, fontFamily: 'monospace',
        color: '#00ff88',
        textShadow: '0 0 30px rgba(0,255,136,0.9), 0 0 70px rgba(0,255,136,0.4)',
        lineHeight: 1,
      },
    }, 'GLOW'),
    h('span', {
      style: {
        fontSize: 88, fontWeight: 900, fontFamily: 'monospace',
        color: '#ffe600',
        textShadow: '0 0 30px rgba(255,230,0,0.9), 0 0 70px rgba(255,230,0,0.4)',
        lineHeight: 1,
      },
    }, 'TRIS'),
    ),

    // Separator line
    h('div', {
      style: {
        height: 2,
        width: '80%',
        background: 'linear-gradient(90deg, #00ff88, #ffe600, rgba(0,255,136,0))',
        marginBottom: 22,
      },
    }),

    // Tagline
    h('div', {
      style: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 19, fontFamily: 'monospace',
        letterSpacing: 6,
        textTransform: 'uppercase',
        marginBottom: 38,
      },
    }, 'Free Neon Block Stacking'),

    // Feature list
    ...['Daily Challenges', 'Global Leaderboard', 'Sprint 40-Line Mode'].map((feat, i) =>
      h('div', {
        key: i,
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          marginBottom: 22,
        },
      },
      h('div', {
        style: {
          width: 10, height: 10,
          borderRadius: '50%',
          background: '#00ff88',
          boxShadow: '0 0 10px rgba(0,255,136,0.9), 0 0 20px rgba(0,255,136,0.4)',
          flexShrink: 0,
        },
      }),
      h('span', {
        style: {
          color: 'rgba(255,255,255,0.85)',
          fontSize: 26,
          fontFamily: 'monospace',
          letterSpacing: 2,
        },
      }, feat),
      )
    ),

    // URL
    h('div', {
      style: {
        marginTop: 36,
        color: '#00c8ff',
        fontSize: 22,
        fontFamily: 'monospace',
        letterSpacing: 4,
        textShadow: '0 0 15px rgba(0,200,255,0.7)',
      },
    }, 'glowtris.com'),

    ),
    ),
    ),
    { width: 1200, height: 630 }
  );
}
