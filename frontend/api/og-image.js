import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

const WIDTH = 1200;
const HEIGHT = 630;

const COLORS = {
  bg: '#0B0D0F',
  cream: '#F5F2EC',
  muted: '#8A8F98',
  amber: '#E8B75A',
  amberDim: '#3A2F1C',
};

const SECTOR_EYEBROWS = {
  'semi-conducteurs': 'Semi-conducteurs · DRAM / HBM',
  crypto: 'Crypto · Marchés digitaux',
  ia: 'IA · Modèles & infrastructure',
  default: 'Tech Watch · Actualité',
};

const SIGNAL_PATHS = {
  'semi-conducteurs': {
    line: 'M0,200 L80,190 L140,205 L200,140 L260,160 L320,90 L380,120 L440,60 L500,95 L560,50 L620,80 L680,40 L740,70 L800,30 L860,55 L920,20 L980,45 L1040,15 L1100,35 L1200,10',
    fill: 'M0,200 L80,190 L140,205 L200,140 L260,160 L320,90 L380,120 L440,60 L500,95 L560,50 L620,80 L680,40 L740,70 L800,30 L860,55 L920,20 L980,45 L1040,15 L1100,35 L1200,10 L1200,240 L0,240 Z',
  },
  crypto: {
    line: 'M0,60 L60,80 L120,40 L180,100 L240,50 L300,130 L360,70 L420,160 L480,90 L540,180 L600,110 L660,60 L720,140 L780,80 L840,150 L900,90 L960,170 L1020,100 L1080,60 L1140,120 L1200,80',
    fill: 'M0,60 L60,80 L120,40 L180,100 L240,50 L300,130 L360,70 L420,160 L480,90 L540,180 L600,110 L660,60 L720,140 L780,80 L840,150 L900,90 L960,170 L1020,100 L1080,60 L1140,120 L1200,80 L1200,240 L0,240 Z',
  },
  ia: {
    line: 'M0,100 C150,100 150,40 300,40 C450,40 450,150 600,150 C750,150 750,60 900,60 C1050,60 1050,110 1200,110',
    fill: 'M0,100 C150,100 150,40 300,40 C450,40 450,150 600,150 C750,150 750,60 900,60 C1050,60 1050,110 1200,110 L1200,240 L0,240 Z',
  },
  default: {
    line: 'M0,140 C150,130 150,150 300,140 C450,130 450,150 600,140 C750,130 750,150 900,140 C1050,130 1050,150 1200,140',
    fill: 'M0,140 C150,130 150,150 300,140 C450,130 450,150 600,140 C750,130 750,150 900,140 C1050,130 1050,150 1200,140 L1200,240 L0,240 Z',
  },
};

let fontsPromise = null;

async function loadGoogleFont(family, weight) {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
  const css = await fetch(cssUrl, {
    headers: {
      // Older UA forces Google Fonts to serve TTF instead of WOFF2, which satori can parse.
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:2.0.1) Gecko/20100101 Firefox/4.0.1',
    },
  }).then((res) => res.text());

  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/);
  if (!match) throw new Error(`Font source not found for ${family} ${weight}`);

  const fontRes = await fetch(match[1]);
  return fontRes.arrayBuffer();
}

function loadFonts() {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      loadGoogleFont('Space+Grotesk', 500),
      loadGoogleFont('Space+Grotesk', 700),
      loadGoogleFont('DM+Mono', 400),
      loadGoogleFont('DM+Mono', 500),
    ]).then(([sg500, sg700, dm400, dm500]) => [
      { name: 'Space Grotesk', data: sg500, weight: 500, style: 'normal' },
      { name: 'Space Grotesk', data: sg700, weight: 700, style: 'normal' },
      { name: 'DM Mono', data: dm400, weight: 400, style: 'normal' },
      { name: 'DM Mono', data: dm500, weight: 500, style: 'normal' },
    ]);
  }
  return fontsPromise;
}

// Plain createElement-like helper — avoids requiring a JSX loader for this .js file.
function h(type, props, ...children) {
  const flatChildren = children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false);
  return { type, props: { ...props, children: flatChildren.length === 1 ? flatChildren[0] : flatChildren } };
}

function buildImage({ title, sector, tickers }) {
  const eyebrow = SECTOR_EYEBROWS[sector];
  const { line, fill } = SIGNAL_PATHS[sector];

  return h(
    'div',
    {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '78px 84px',
        background: COLORS.bg,
        position: 'relative',
        fontFamily: 'Space Grotesk',
      },
    },
    h(
      'svg',
      {
        width: WIDTH,
        height: Math.round(HEIGHT * 0.38),
        viewBox: '0 0 1200 240',
        preserveAspectRatio: 'none',
        style: { position: 'absolute', left: 0, bottom: 0 },
      },
      h('path', { d: fill, fill: COLORS.amber, opacity: 0.12 }),
      h('path', { d: line, fill: 'none', stroke: COLORS.amber, strokeWidth: 2, opacity: 0.55 })
    ),
    h(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: 26, position: 'relative', zIndex: 2 } },
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontFamily: 'DM Mono',
            fontWeight: 500,
            fontSize: 24,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: COLORS.amber,
          },
        },
        h('div', {
          style: {
            display: 'flex',
            width: 12,
            height: 12,
            borderRadius: 6,
            background: COLORS.amber,
            boxShadow: `0 0 0 5px ${COLORS.amberDim}`,
          },
        }),
        eyebrow
      ),
      h(
        'div',
        {
          style: {
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
            fontSize: 62,
            fontWeight: 700,
            color: COLORS.cream,
            lineHeight: 1.18,
            letterSpacing: -0.6,
            maxWidth: '80%',
          },
        },
        title
      )
    ),
    h(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: 34, position: 'relative', zIndex: 2 } },
      h(
        'div',
        { style: { display: 'flex', gap: 10 } },
        ...tickers.map((t) =>
          h(
            'div',
            {
              style: {
                display: 'flex',
                fontFamily: 'DM Mono',
                fontWeight: 400,
                fontSize: 22,
                color: COLORS.cream,
                border: '1px solid rgba(232,183,90,.35)',
                background: 'rgba(232,183,90,.07)',
                padding: '8px 19px',
                borderRadius: 38,
                letterSpacing: 0.5,
              },
            },
            t
          )
        )
      ),
      h(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' } },
        h(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: 14 } },
          h(
            'div',
            { style: { display: 'flex', position: 'relative', width: 30, height: 30 } },
            h('div', {
              style: {
                display: 'flex',
                position: 'absolute',
                top: 12,
                left: 0,
                width: 30,
                height: 6,
                background: COLORS.amber,
                borderRadius: 2,
              },
            }),
            h('div', {
              style: {
                display: 'flex',
                position: 'absolute',
                top: 0,
                left: 12,
                width: 6,
                height: 30,
                background: COLORS.amber,
                opacity: 0.4,
                borderRadius: 2,
              },
            })
          ),
          h(
            'div',
            {
              style: {
                display: 'flex',
                fontFamily: 'DM Mono',
                fontWeight: 500,
                fontSize: 24,
                letterSpacing: 3,
                color: COLORS.cream,
                textTransform: 'uppercase',
              },
            },
            'Tech',
            h('span', { style: { color: COLORS.amber } }, 'Watch')
          )
        ),
        h(
          'div',
          {
            style: {
              display: 'flex',
              fontFamily: 'DM Mono',
              fontWeight: 400,
              fontSize: 20,
              color: COLORS.muted,
              letterSpacing: 1,
            },
          },
          'techwatch.fr'
        )
      )
    )
  );
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);

  const title = (searchParams.get('title') || 'Tech Watch').slice(0, 180);

  const sectorParam = (searchParams.get('sector') || 'default').toLowerCase();
  const sector = SECTOR_EYEBROWS[sectorParam] ? sectorParam : 'default';

  const tickers = (searchParams.get('tickers') || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 4);

  try {
    const fonts = await loadFonts();

    return new ImageResponse(buildImage({ title, sector, tickers }), {
      width: WIDTH,
      height: HEIGHT,
      fonts,
      headers: {
        'Cache-Control': 's-maxage=86400, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error('og-image error:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
