import { esc, c, pill, charImg, flowerImg, pageShell } from '../render/components.js';
import { starfield, planet, moon, sparkle, stemFlower, comet } from '../art/flora.js';

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
`;

export function cover(ctx) {
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
