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
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      },
    },

    // Subtle grid
    h('div', {
      style: {
        position: 'absolute', inset: 0,
        backgroundImage:
          'linear-gradient(rgba(0,200,255,0.04) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(0,200,255,0.04) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      },
    }),

    // Nebula glows
    h('div', { style: { position:'absolute', top:'-100px', left:'-50px', width:'500px', height:'500px', borderRadius:'50%', background:'radial-gradient(circle, rgba(0,200,255,0.07) 0%, transparent 70%)' } }),
    h('div', { style: { position:'absolute', bottom:'-80px', right:'-50px', width:'600px', height:'600px', borderRadius:'50%', background:'radial-gradient(circle, rgba(160,0,255,0.06) 0%, transparent 70%)' } }),
    h('div', { style: { position:'absolute', top:'115px', left:'200px', width:'800px', height:'400px', borderRadius:'50%', background:'radial-gradient(circle, rgba(255,0,128,0.04) 0%, transparent 70%)' } }),

    // GLOWTRIS logo
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
        fontSize: 148,
        fontWeight: 900,
        fontFamily: 'Orbitron',
        letterSpacing: '22px',
        color: '#00c8ff',
        textShadow: '0 0 40px rgba(0,200,255,0.9), 0 0 80px rgba(0,200,255,0.4)',
      },
    }, 'GLOW'),
    h('span', {
      style: {
        fontSize: 148,
        fontWeight: 900,
        fontFamily: 'Orbitron',
        letterSpacing: '22px',
        color: '#a000ff',
        textShadow: '0 0 40px rgba(160,0,255,0.9), 0 0 80px rgba(160,0,255,0.4)',
      },
    }, 'TRIS'),
    ),

    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Orbitron', data: fontData, weight: 900, style: 'normal' }],
    }
  );
}
