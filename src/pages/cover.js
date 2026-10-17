import { esc, c, pill, charImg, flowerImg, pageShell } from '../render/components.js';
import { starfield, planet, moon, sparkle, stemFlower, comet } from '../art/flora.js';
import { rng } from '../art/color.js';

export const css = `
.cover { position: absolute; inset: 0; border-radius: 1.6rem; overflow: hidden;
  background: linear-gradient(172deg, var(--night) 0%, #5a4290 38%, #b98ad8 70%, #ffc6dc 100%); }
.cover > svg.sky { position: absolute; inset: 0; width: 100%; height: 100%; }
.cover .ct { position: absolute; left: 0; right: 0; top: 9%; text-align: center; color: #fff; }
.cover .ct .yr { font: 700 2.3rem/1 var(--script); color: var(--yellow); }
.cover .ct .tt { font: 700 5.6rem/.95 var(--display); letter-spacing: -.01em; margin: .2rem 0 .4rem;
  color: #fff; -webkit-text-stroke: .14rem var(--night); paint-order: stroke fill; }
.cover .ct .st { display: inline-block; font: 600 1.25rem/1 var(--display); letter-spacing: .32em; text-transform: uppercase;
  padding: .55rem 1.1rem .55rem 1.42rem; border-radius: .9rem; background: rgba(255,255,255,.18); border: 1.4px solid rgba(255,255,255,.55); }
.cover .ct .tl { font: 600 1.7rem/1.1 var(--script); margin-top: .8rem; color: #fff7fb; }
.cover .ct .go { margin-top: 1rem; }
.cover .owner { position: absolute; left: 12%; right: 12%; bottom: 3.2%; display: flex; align-items: flex-end; gap: .6rem;
  padding: .7rem 1.2rem; border-radius: 1rem; background: rgba(255,255,255,.82); font: 600 .95rem/1 var(--display); color: var(--ink); }
.cover .owner span { flex: 1; border-bottom: 1.4px solid color-mix(in srgb, rgb(var(--ink-rgb)) 35%, #fff); min-height: 1.2rem; font: 600 1.4rem/1 var(--script); }
.cover img.char { position: absolute; }

/* ---- galactic-cute ---- */
.gcover { position: absolute; inset: 0; border-radius: 1.6rem; overflow: hidden; background-color: #120a33; background-position: center; background-size: cover; }
.gcover > svg.ground { position: absolute; inset: 0; width: 100%; height: 100%; }
.gcover img.char { position: absolute; }
.gcover .ct { position: absolute; left: 0; right: 0; top: 5.5%; text-align: center; color: #fff; }
.gcover .orn { display: flex; align-items: center; justify-content: center; gap: .7rem; color: #fff; }
.gcover .orn i { width: 7.5rem; border-top: 1.2px solid rgba(255,255,255,.75); }
.gcover .orn svg { width: 1.3rem; height: 1.3rem; }
.gcover .tt { font: 600 7.2rem/.9 "Cormorant Garamond", Georgia, serif; letter-spacing: -.005em; margin: .5rem 0 .7rem; color: #fffaff; }
.gcover .tt.one { font-size: 5.8rem; }
.gcover .st { font: 500 1.75rem/1 "Cormorant Garamond", Georgia, serif; letter-spacing: .55em; text-transform: uppercase; margin: .7rem 0 .45rem .55em; }
.gcover .yr { font: 600 2.4rem/1 "Cormorant Garamond", Georgia, serif; letter-spacing: .08em; display: flex; align-items: center; justify-content: center; gap: .8rem; }
.gcover .yr i { width: 3.2rem; border-top: 1.2px solid rgba(255,255,255,.7); }
.gcover .tl { font: 600 1.65rem/1.1 var(--script); margin-top: .7rem; color: #ffc9ea; }
.gcover .go { margin-top: .9rem; }
.gcover .go .pill { background: rgba(255,255,255,.14); border: 1.3px solid rgba(255,255,255,.6); color: #fff; }
.gcover .owner { position: absolute; left: 14%; right: 14%; bottom: 3%; display: flex; align-items: flex-end; gap: .7rem;
  padding: .7rem 1.3rem; border-radius: 1rem; background: rgba(14,8,40,.55); border: 1.2px solid rgba(255,255,255,.35);
  font: 600 1.15rem/1 "Cormorant Garamond", Georgia, serif; letter-spacing: .06em; color: #fff; }
.gcover .owner span { flex: 1; border-bottom: 1.2px solid rgba(255,255,255,.55); min-height: 1.3rem; font: 600 1.4rem/1 var(--script); }
`;

/** Picks the cover for the configured style (see src/styles.js). */
export function cover(ctx) {
  return ctx.cfg.styleDef?.cover === 'galactic' ? galacticCover(ctx) : softCover(ctx);
}

// ---------------------------------------------------------------- soft (default)
// The original soft pastel Cosmic Bloom cover.
export function softCover(ctx) {
  const { cfg, model, art } = ctx;
  const P = cfg.colors;
  const ink = P.ink;
  const ch = (id) => art.characters.find((x) => x.id === id) ?? art.characters[0];
  const fl = art.flowers;

  // 600x800 design box, sliced to fit any page ratio
  const sky = `<svg class="sky" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice">` +
    starfield(600, 520, 90, P, { seed: 11, bright: true }) +
    planet(528, 74, 30, P.lavender, P.pink, { ink }) +
    moon(70, 92, 26, '#fff1b8', { ink }) +
    comet(200, 52, 40, P.yellow, { ink }) +
    sparkle(560, 300, 9, '#fff', { ink }) + sparkle(40, 330, 7, P.yellow, { ink }) +
    `<ellipse cx="300" cy="905" rx="520" ry="300" fill="${P.mint}" stroke="${ink}" stroke-width="2.5"/>` +
    `<ellipse cx="300" cy="930" rx="470" ry="290" fill="#c9f5dc"/>` +
    stemFlower('starBloom', 40, 690, 120, 24, P.pink, { ink, lean: 0.1 }) +
    stemFlower('cosmos', 560, 680, 130, 24, P.yellow, { ink, lean: -0.12, leafSide: -1 }) +
    stemFlower('tulip', 520, 700, 80, 18, P.lavender, { ink, lean: 0.2 }) +
    stemFlower('planetBloom', 80, 710, 70, 16, P.teal, { ink, lean: -0.2, leafSide: -1 }) +
    `</svg>`;

  const owner = cfg.owner ? esc(cfg.owner) : '';
  const body = `<div class="cover">${sky}
    <div class="ct">
      <div class="yr">${esc(cfg.yearLabel.replace('-', ' – '))}${model.variant === 'undated' ? ' &middot; undated' : ''}</div>
      <div class="tt">${esc(cfg.title)}</div>
      <div class="st">${esc(cfg.subtitle)}</div>
      <div class="tl">${esc(cfg.tagline)}</div>
      <div class="go">${pill(model.sectionHref.home, 'Open my planner &#8250;', 'yellow', 'solid')}</div>
    </div>
    ${charImg(ch('sky'), { height: '15%', style: 'left:4%;top:38%;transform:rotate(-8deg)' })}
    ${charImg(ch('blossom'), { height: '30%', style: 'left:4%;bottom:7%' })}
    ${charImg(ch('peach'), { height: '27%', style: 'left:35%;bottom:6.5%' })}
    ${charImg(ch('starlight'), { height: '29%', style: 'right:5%;bottom:7%' })}
    ${fl[0] ? flowerImg(fl[0], { height: '7%', style: 'left:28%;bottom:9%' }) : ''}
    ${fl[9] ? flowerImg(fl[9], { height: '6%', style: 'right:32%;bottom:8.5%' }) : ''}
    ${fl[5] ? flowerImg(fl[5], { height: '6%', style: 'right:7%;top:30%' }) : ''}
    <div class="owner">This planner belongs to <span>${owner}</span></div>
  </div>`;
  return pageShell(ctx, body, { nebula: false });
}

// ---------------------------------------------------------------- galactic-cute
// Dense nebula sky (src/art/galactic.js) + the same cute crew standing on a dark,
// flowery hill. Reference art: assets/covers/galactic-cute/.
function glowFlowers(seed, n) {
  const rand = rng(seed);
  const cols = ['#ff9ecb', '#ffc2e6', '#c3b1ff', '#ffdf7e', '#9fd2ff', '#ffffff'];
  let s = '';
  for (let i = 0; i < n; i++) {
    // scatter on and below the hill surface (ellipse cx 300, cy 905, rx 520, ry 300)
    const x = rand() * 600;
    const dx = (x - 300) / 520;
    const top = 905 - 300 * Math.sqrt(Math.max(0, 1 - dx * dx));
    const y = top + 6 + Math.pow(rand(), 1.6) * 190;
    const r = 0.9 + Math.pow(rand(), 1.8) * 3.2;
    const col = cols[Math.floor(rand() * cols.length)];
    if (r > 2.6) {
      let petals = '';
      for (let k = 0; k < 5; k++) {
        const a = (k * 72 - 90) * (Math.PI / 180);
        petals += `<circle cx="${(x + Math.cos(a) * r).toFixed(1)}" cy="${(y + Math.sin(a) * r).toFixed(1)}" r="${(r * 0.62).toFixed(2)}" fill="${col}" fill-opacity=".9"/>`;
      }
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * 2.6).toFixed(1)}" fill="url(#gfGlow)"/>${petals}<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * 0.45).toFixed(2)}" fill="#fff6c8"/>`;
    } else {
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${col}" fill-opacity="${(0.35 + rand() * 0.4).toFixed(2)}"/>`;
    }
  }
  return s;
}

export function galacticCover(ctx) {
  const { cfg, model, art } = ctx;
  const ch = (id) => art.characters.find((x) => x.id === id) ?? art.characters[0];
  const fl = art.flowers;
  const star4 = '<svg viewBox="0 0 20 20"><path d="M10 0 Q11 9 20 10 Q11 11 10 20 Q9 11 0 10 Q9 9 10 0Z" fill="#fff"/></svg>';

  // the hill, anchored to the bottom of the panel
  const ground = `<svg class="ground" viewBox="0 0 600 800" preserveAspectRatio="xMidYMax slice">
    <defs>
      <linearGradient id="gHill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22184f"/><stop offset=".2" stop-color="#170f3c"/><stop offset="1" stop-color="#0a0620"/></linearGradient>
      <radialGradient id="gfGlow"><stop offset="0" stop-color="#ffd6f0" stop-opacity=".55"/><stop offset="1" stop-color="#ffd6f0" stop-opacity="0"/></radialGradient>
      <radialGradient id="gRim" cx=".5" cy="0" r=".7"><stop offset="0" stop-color="#ff9ecb" stop-opacity=".28"/><stop offset="1" stop-color="#ff9ecb" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse cx="300" cy="632" rx="360" ry="46" fill="url(#gRim)"/>
    <path d="M-10 690 C40 640 70 650 95 662 L118 648 C130 660 140 668 150 676 L-10 700Z" fill="#170f3d"/>
    <path d="M610 680 C560 640 530 646 506 660 L486 650 C474 662 462 670 450 678 L610 700Z" fill="#170f3d"/>
    <ellipse cx="300" cy="905" rx="520" ry="300" fill="url(#gHill)"/>
    <path d="M-220 905 A520 300 0 0 1 820 905" fill="none" stroke="#ffb3e0" stroke-opacity=".35" stroke-width="2.4"/>
    ${glowFlowers(23, 120)}
  </svg>`;

  const words = String(cfg.title).trim().split(/\s+/);
  const title = words.length === 2 ? `<div class="tt">${esc(words[0])}<br>${esc(words[1])}</div>` : `<div class="tt one">${esc(cfg.title)}</div>`;
  const year = `${esc(cfg.yearLabel.replace('-', ' – '))}${model.variant === 'undated' ? ' &middot; undated' : ''}`;
  const owner = cfg.owner ? esc(cfg.owner) : '';
  const body = `<div class="gcover" style="background-image:url(${art.coverSky})">${ground}
    <div class="ct">
      <div class="orn">${star4}</div>
      ${title}
      <div class="orn"><i></i>${star4}<i></i></div>
      <div class="st">${esc(cfg.subtitle)}</div>
      <div class="yr"><i></i>${year}<i></i></div>
      <div class="tl">${esc(cfg.tagline)}</div>
      <div class="go">${pill(model.sectionHref.home, 'Open my planner &#8250;', 'lavender')}</div>
    </div>
    ${charImg(ch('sky'), { height: '14%', style: 'left:5%;top:42%;transform:rotate(-10deg)' })}
    ${fl[2] ? flowerImg(fl[2], { height: '10%', style: 'left:0;bottom:12%' }) : ''}
    ${fl[10] ? flowerImg(fl[10], { height: '11%', style: 'right:0;bottom:11%' }) : ''}
    ${charImg(ch('blossom'), { height: '27%', style: 'left:3%;bottom:8.5%' })}
    ${charImg(ch('mint'), { height: '24%', style: 'left:26%;bottom:10%' })}
    ${charImg(ch('peach'), { height: '25.5%', style: 'left:49%;bottom:9%' })}
    ${charImg(ch('starlight'), { height: '27%', style: 'right:2%;bottom:8.5%' })}
    ${fl[6] ? flowerImg(fl[6], { height: '6.5%', style: 'left:21%;bottom:7%' }) : ''}
    ${fl[0] ? flowerImg(fl[0], { height: '5%', style: 'right:24%;bottom:7.5%' }) : ''}
    <div class="owner">This planner belongs to <span>${owner}</span></div>
  </div>`;
  return pageShell(ctx, body, { nebula: false });
}
