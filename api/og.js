import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

function h(type, props, ...children) {
  const kids = children.length === 0 ? undefined : children.length === 1 ? children[0] : children;
  return { type, key: null, ref: null, props: { ...props, children: kids }, _owner: null, _store: {} };
}

export default async function handler() {
  const fontData = await fetch(
    new URL('./Orbitron-GLOWTRIS.ttf', import.meta.url)
  ).then(r => r.arrayBuffer());

  return new ImageResponse(
    h('div', {
      style: {
        background: '#04041e',
        width: '100%', height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      },
    },

    // Full-page grid
    h('div', {
      style: {
        position: 'absolute', inset: 0,
        backgroundImage:
          'linear-gradient(rgba(0,200,255,0.055) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(0,200,255,0.055) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      },
    }),

    // Ambient glow — cyan top-left
    h('div', { style: { position:'absolute', top:'-60px', left:'180px', width:'420px', height:'420px', borderRadius:'50%', background:'radial-gradient(circle, rgba(0,200,255,0.11) 0%, transparent 65%)' } }),
    // Ambient glow — purple bottom-right
    h('div', { style: { position:'absolute', bottom:'-60px', right:'140px', width:'420px', height:'420px', borderRadius:'50%', background:'radial-gradient(circle, rgba(160,0,255,0.09) 0%, transparent 65%)' } }),

    // Card
    h('div', {
      style: {
        position: 'relative',
        width: 880,
        height: 330,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px dashed rgba(0,200,255,0.3)',
        borderRadius: 16,
        background: 'rgba(0,0,12,0.45)',
        overflow: 'hidden',
        marginBottom: 30,
      },
    },

    // Grid inside card
    h('div', {
      style: {
        position: 'absolute', inset: 0,
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      },
    }),

    // I-piece (cyan) — top left
    h('div', { style: { position:'absolute', top:30, left:50, width:74, height:18, borderRadius:3, background:'rgba(0,240,240,0.09)', border:'1px solid rgba(0,240,240,0.7)', boxShadow:'0 0 12px rgba(0,240,240,0.45)', opacity:0.75 } }),

    // O-piece (yellow) — bottom right
    h('div', { style: { position:'absolute', bottom:34, right:58, width:32, height:32, borderRadius:3, background:'rgba(240,210,0,0.08)', border:'1px solid rgba(240,210,0,0.7)', boxShadow:'0 0 12px rgba(240,210,0,0.4)', opacity:0.7 } }),

    // S-piece (green) — bottom left
    h('div', { style: { position:'absolute', bottom:38, left:64, width:42, height:18, borderRadius:3, background:'rgba(0,255,120,0.07)', border:'1px solid rgba(0,255,120,0.6)', boxShadow:'0 0 10px rgba(0,255,120,0.4)', opacity:0.65 } }),

    // L-piece (orange) — top right
    h('div', { style: { position:'absolute', top:30, right:52, width:18, height:54, borderRadius:3, background:'rgba(255,140,0,0.07)', border:'1px solid rgba(255,140,0,0.6)', boxShadow:'0 0 10px rgba(255,140,0,0.4)', opacity:0.65 } }),

    // GLOWTRIS
    h('div', {
      style: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      },
    },
    h('span', {
      style: {
        fontSize: 104,
        fontWeight: 900,
        fontFamily: 'Orbitron',
        letterSpacing: '16px',
        color: '#00c8ff',
        textShadow: '0 2px 18px rgba(0,200,255,0.65), 0 0 44px rgba(0,200,255,0.2)',
      },
    }, 'GLOW'),
    h('span', {
      style: {
        fontSize: 104,
        fontWeight: 900,
        fontFamily: 'Orbitron',
        letterSpacing: '16px',
        color: '#a000ff',
        textShadow: '0 2px 18px rgba(160,0,255,0.65), 0 0 44px rgba(160,0,255,0.2)',
      },
    }, 'TRIS'),
    ),

    ), // end card

    // URL
    h('div', {
      style: {
        fontSize: 20,
        fontFamily: 'monospace',
        letterSpacing: '6px',
        color: 'rgba(255,255,255,0.28)',
      },
    }, 'glowtris.com'),

    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Orbitron', data: fontData, weight: 900, style: 'normal' }],
    }
  );
}
