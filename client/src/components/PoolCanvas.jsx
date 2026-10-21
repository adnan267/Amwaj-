import { useEffect, useRef } from 'react';

/**
 * A pool seen from above: mosaic tiles, drifting caustic light, and a ripple
 * simulation that reacts to the pointer. Pure 2D canvas, no WebGL.
 */

const CS = 256; // caustic texture size (tileable)

function buildCaustics() {
  const out = new Float32Array(CS * CS);
  const TAU = Math.PI * 2;
  for (let y = 0; y < CS; y++) {
    for (let x = 0; x < CS; x++) {
      const u = x / CS, v = y / CS;
      // integer frequencies keep the pattern tileable
      const wx = 0.35 * Math.sin(TAU * (2 * v + 1 * u));
      const wy = 0.35 * Math.sin(TAU * (3 * u - 1 * v));
      const s =
        Math.sin(TAU * (3 * u + 2 * v) + wx * 6) +
        Math.sin(TAU * (-2 * u + 3 * v) + wy * 6) +
        Math.sin(TAU * (4 * u - 1 * v) + (wx + wy) * 4);
      const d = Math.min(1, Math.abs(s) / 1.1);
      out[y * CS + x] = Math.pow(1 - d, 5);
    }
  }
  return out;
}

function buildTexture(W, H, tile, lanes, seed = 7) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  let r = seed;
  const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
  for (let y = 0; y < H; y += tile) {
    for (let x = 0; x < W; x += tile) {
      const depth = 0.55 + 0.45 * (y / H); // deeper (darker) further down
      const l = (36 + rnd() * 7) * (1.05 - depth * 0.35);
      g.fillStyle = `hsl(${197 + rnd() * 7}, ${70 + rnd() * 10}%, ${l}%)`;
      g.fillRect(x, y, tile, tile);
    }
  }
  // grout lines
  g.fillStyle = 'rgba(220,245,255,0.16)';
  for (let x = 0; x < W; x += tile) g.fillRect(x, 0, 1, H);
  for (let y = 0; y < H; y += tile) g.fillRect(0, y, W, 1);
  // lane markers: dark tile stripes with a T at the wall end
  if (lanes) {
    g.fillStyle = 'rgba(4,14,52,0.5)';
    const lw = tile;
    // vertical lanes on the right, away from the headline (which sits bottom-left)
    const xs = W > H ? [0.64, 0.86] : [0.84];
    for (const fx of xs) {
      const x = Math.round((W * fx) / tile) * tile;
      g.fillRect(x, tile * 4, lw, H - tile * 8);
      g.fillRect(x - tile, tile * 4, lw + tile * 2, lw);
      g.fillRect(x - tile, H - tile * 4 - lw, lw + tile * 2, lw);
    }
  }
  return g.getImageData(0, 0, W, H).data;
}

export default function PoolCanvas({ className = '', interactive = true, lanes = true, splash = true, intensity = 1 }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const caus = buildCaustics();
    let W = 0, H = 0, S = 2, tex, cur, prev, img, raf = 0, t = 0, visible = true, lastDrop = 0, px = -1, py = -1;

    function setup() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      S = 2;
      W = Math.ceil(rect.width / S); H = Math.ceil(rect.height / S);
      while (W * H > 300000) { S += 0.5; W = Math.ceil(rect.width / S); H = Math.ceil(rect.height / S); }
      canvas.width = W; canvas.height = H;
      tex = buildTexture(W, H, Math.max(6, Math.round(22 / S)), lanes);
      cur = new Float32Array(W * H);
      prev = new Float32Array(W * H);
      img = ctx.createImageData(W, H);
      return true;
    }

    function drop(x, y, radius, strength) {
      x |= 0; y |= 0;
      for (let j = -radius; j <= radius; j++) {
        for (let i = -radius; i <= radius; i++) {
          const xx = x + i, yy = y + j;
          if (xx < 1 || yy < 1 || xx >= W - 1 || yy >= H - 1) continue;
          const d = Math.sqrt(i * i + j * j) / radius;
          if (d <= 1) cur[yy * W + xx] += strength * (0.5 + 0.5 * Math.cos(d * Math.PI));
        }
      }
    }

    function step() {
      // ripple propagation (two-buffer wave equation)
      for (let y = 1; y < H - 1; y++) {
        let i = y * W + 1;
        for (let x = 1; x < W - 1; x++, i++) {
          const v = (cur[i - 1] + cur[i + 1] + cur[i - W] + cur[i + W]) * 0.5 - prev[i];
          prev[i] = v * 0.982;
        }
      }
      const tmp = cur; cur = prev; prev = tmp;
    }

    function render() {
      const d = img.data;
      const o1x = t * 9, o1y = t * 5, o2x = -t * 6, o2y = t * 8;
      const k = 0.78 * intensity;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = y * W + x;
          let dx = 0, dy = 0;
          if (x > 0 && x < W - 1 && y > 0 && y < H - 1) { dx = cur[i - 1] - cur[i + 1]; dy = cur[i - W] - cur[i + W]; }
          let sx = (x + dx * 0.09) | 0, sy = (y + dy * 0.09) | 0;
          if (sx < 0) sx = 0; else if (sx >= W) sx = W - 1;
          if (sy < 0) sy = 0; else if (sy >= H) sy = H - 1;
          const j = (sy * W + sx) * 4;
          const cx = (x * 0.8 + o1x + dx * 0.05) | 0, cy = (y * 0.8 + o1y + dy * 0.05) | 0;
          const ex = (x * 0.55 + o2x) | 0, ey = (y * 0.55 + o2y) | 0;
          const c1 = caus[(cy & 255) * CS + (cx & 255)];
          const c2 = caus[(ey & 255) * CS + (ex & 255)];
          let L = (c1 * 62 + c2 * 44 + c1 * c2 * 90) * k + dx * 0.16;
          if (L > 140) L = 140; else if (L < -60) L = -60;
          const o = i * 4;
          d[o] = tex[j] + L * 0.55;
          d[o + 1] = tex[j + 1] + L * 0.88;
          d[o + 2] = tex[j + 2] + L;
          d[o + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    }

    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      t += 0.06;
      if (now - lastDrop > 650) {
        lastDrop = now;
        drop(Math.random() * W, Math.random() * H, 2 + Math.random() * 2, 90 + Math.random() * 140);
      }
      step();
      render();
    }

    function onMove(e) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / S, y = (e.clientY - rect.top) / S;
      if (x < 0 || y < 0 || x > W || y > H) return;
      if (px >= 0 && Math.hypot(x - px, y - py) < 3) return;
      px = x; py = y;
      drop(x, y, 3, e.pointerType === 'touch' ? 260 : 170);
    }
    function onDown(e) {
      const rect = canvas.getBoundingClientRect();
      drop((e.clientX - rect.left) / S, (e.clientY - rect.top) / S, 6, 700);
    }

    if (!setup()) return;
    if (reduce) { render(); return; }

    if (splash) {
      // one entrance moment: a few drops land on the right side of the pool
      [[0.72, 0.42, 7, 900, 350], [0.78, 0.5, 4, 500, 650], [0.66, 0.55, 3, 400, 900]].forEach(([fx, fy, r, s, delay]) =>
        setTimeout(() => drop(W * fx, H * fy, r, s), delay)
      );
    }
    raf = requestAnimationFrame(loop);

    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { threshold: 0 });
    io.observe(canvas);
    let rt;
    const ro = new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(setup, 150); });
    ro.observe(canvas);
    const host = canvas.parentElement;
    if (interactive) {
      host.addEventListener('pointermove', onMove, { passive: true });
      host.addEventListener('pointerdown', onDown, { passive: true });
    }
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect(); clearTimeout(rt);
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerdown', onDown);
    };
  }, [interactive, lanes, splash, intensity]);

  return <canvas ref={ref} aria-hidden="true" className={`block h-full w-full ${className}`} style={{ imageRendering: 'auto' }} />;
}
