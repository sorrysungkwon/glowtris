import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

function h(type, props, ...children) {
  const kids = children.length === 0 ? undefined : children.length === 1 ? children[0] : children;
  return { type, key: null, ref: null, props: { ...props, children: kids }, _owner: null, _store: {} };
}

export default async function handler() {
  // Load Orbitron 900 from Google Fonts
  let fontData = null;
  try {
    const css = await fetch(
      'https://fonts.googleapis.com/css2?family=Orbitron:wght@900&display=swap',
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' } }
    ).then(r => r.text());
    const fontUrl = css.match(/src: url\(([^)]+)\) format\('woff2'\)/)?.[1];
    if (fontUrl) fontData = await fetch(fontUrl).then(r => r.arrayBuffer());
  } catch (_) {}

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
    h('div', { style: { position:'absolute', top:'50%', left:'50%', width:'800px', height:'400px', borderRadius:'50%', background:'radial-gradient(circle, rgba(255,0,128,0.04) 0%, transparent 70%)', transform:'translate(-50%,-50%)' } }),

    // GLOWTRIS logo — centered, Orbitron 900, gradient text
    h('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: 'scaleX(1.18)',
      },
    },
    h('span', {
      style: {
        fontSize: 148,
        fontWeight: 900,
        fontFamily: fontData ? 'Orbitron, monospace' : 'monospace',
        letterSpacing: '18px',
        background: 'linear-gradient(90deg, #00c8ff 0%, #a000ff 40%, #ff0080 70%, #00c8ff 100%)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        filter: 'drop-shadow(0 0 40px rgba(0,200,255,0.55)) drop-shadow(0 0 15px rgba(160,0,255,0.4))',
      },
    }, 'GLOWTRIS'),
    ),

    ),
    {
      width: 1200,
      height: 630,
      fonts: fontData ? [{ name: 'Orbitron', data: fontData, weight: 900, style: 'normal' }] : [],
    }
  );
}
