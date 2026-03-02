'use client'
import { useEffect, useRef, useMemo } from 'react'
import type { StoryEntry, SceneType, CharacterKey } from '@/lib/storyGenerator'
import { CHARACTERS } from '@/lib/storyGenerator'

const GW = 80, GH = 80, CELL = 5
const W = GW * CELL, H = GH * CELL

type PixelFn = (x: number, y: number, t: number, intensity: number) => number

// ── HELPERS ───────────────────────────────────────────────────────────────────
const noise = (x: number, y: number, s: number): number => {
  let n = ((x * 1619 + y * 31337 + s * 6271) >>> 0)
  n = ((n ^ (n >>> 16)) * 0x45d9f3b) >>> 0
  n = ((n ^ (n >>> 16)) * 0x45d9f3b) >>> 0
  return (n ^ (n >>> 16)) / 0xffffffff
}
const dist = (x: number, y: number, cx: number, cy: number) =>
  Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
const rect = (rx: number, ry: number, px: number, py: number, w: number, h: number) =>
  px >= rx && px < rx + w && py >= ry && py < ry + h
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

// Bayer 4x4 ordered dither
const BAYER: number[][] = [
  [ 0,  8,  2, 10], [12,  4, 14,  6],
  [ 3, 11,  1,  9], [15,  7, 13,  5],
]
const dither = (x: number, y: number, v: number, spread = 0.055): number =>
  clamp01(v + (BAYER[y & 3][x & 3] / 16 - 0.5) * spread)

// Detailed pixel-art figure
const figure = (cx: number, feet: number, px: number, py: number, bright = 0.88): number => {
  const head = feet - 13
  if (dist(px, py, cx, head + 2) < 2.8) return bright
  if (px === Math.round(cx) && py === head + 5) return bright * 0.85
  if (Math.abs(px - cx) <= 1 && py >= head + 6 && py <= head + 10) return bright * 0.85
  if (py === head + 7 && Math.abs(px - cx) <= 4) return bright * 0.75
  if (py === head + 8 && Math.abs(px - cx) === 4) return bright * 0.65
  if (py >= head + 11 && py <= feet) {
    if (px === Math.round(cx) - 1 || px === Math.round(cx) + 1) return bright * 0.8
  }
  if (py === feet && Math.abs(px - cx) <= 2) return bright * 0.7
  return 0
}

// Cloaked hooded figure (Cast)
const figCast = (cx: number, feet: number, px: number, py: number, bright = 0.88): number => {
  const head = feet - 13
  if (dist(px, py, cx, head + 2) < 2.8) return bright
  const bodyW = Math.min(5, 1 + Math.floor((py - head) * 0.35))
  if (py >= head + 4 && py <= feet && Math.abs(px - cx) <= bodyW)
    return bright * clamp01(0.9 - Math.abs(px - cx) * 0.07)
  if (py === feet && Math.abs(px - cx) <= 3) return bright * 0.55
  return 0
}

// Tower with windows
const tower = (tx: number, ty: number, tw: number, th: number, px: number, py: number, bright: number): number => {
  if (px < tx || px >= tx + tw || py < ty || py >= ty + th) return 0
  if (px === tx || px === tx + tw - 1) return bright * 0.55
  if (py === ty) return bright * 0.72
  const wx = (px - tx - 1) % 4, wy = (py - ty) % 5
  if (wx === 1 && wy >= 1 && wy <= 3) return bright * 0.92
  return bright * 0.18
}

// Perspective grid floor
const perspGrid = (x: number, y: number, gy: number, t: number, spd = 1): number => {
  if (y < gy) return 0
  const d = (y - gy) / (GH - gy + 0.01)
  const spacing = Math.max(1, 8 / (d + 0.15))
  const onVert = Math.abs((x - GW / 2) % Math.max(1, spacing / (d * 2 + 0.5))) < 0.7
  const onHoriz = y % Math.max(2, Math.round(spacing)) === 0
  if (onVert || onHoriz) return dither(x, y, 0.08 + d * 0.1)
  return 0.02
}


// ═════════════════════════════════════════════════════════════════════════════
// SCENES — 38 distinct pixel-art animations
// ═════════════════════════════════════════════════════════════════════════════

// L1: Lyra building — layered city skyline, she works at base of main tower

// ═════════════════════════════════════════════════════════════════════════════
// SCENES — 15 pixel-art animations, one per story beat
// Each scene is designed around its narrative moment.
// ═════════════════════════════════════════════════════════════════════════════

// ── OPEN: first light — empty horizon, single figure appearing at dawn ──────
const sceneOpen: PixelFn = (x, y, t, I) => {
  const v = I / 100
  const hY = Math.round(GH * 0.55)
  // Horizon glow
  const glow = Math.exp(-((y - hY) ** 2) / 140) * (0.55 + Math.sin(t * 1.2) * 0.18) * v
  if (y === hY) return 0.28 + Math.sin(x * 0.06 + t * 0.15) * 0.06
  // Ground
  if (y > hY) return dither(x, y, 0.05 + (y - hY) * 0.004)
  // Sky gradient
  const skyD = (hY - y) / hY
  // Single figure appearing — slow fade in
  const figX = 40, figFeet = hY
  const figBright = clamp01(t * 0.012)
  const fig = figure(figX, figFeet, x, y, figBright)
  if (fig > 0) return fig
  // Sparse stars
  const star = noise(x, y, 3) > (0.975 - v * 0.01)
  if (star && y < hY - 4) return 0.4 + Math.sin(t * 2 + x * 0.5) * 0.12
  // Sun disk just below horizon
  const sunD = dist(x, y, 40, hY + 6)
  const sun = sunD < 9 ? (1 - sunD / 9) * 0.85 * v : 0
  return dither(x, y, Math.min(1, glow + sun + skyD * 0.03))
}

// ── ERA: era shift — digital rain falls, all five stand below watching ───────
const sceneEra: PixelFn = (x, y, t, I) => {
  const v = I / 100
  const ground = GH - 8
  const col = Math.floor(x / 3)
  const speed = (col * 5 + 3) % 7 + 2
  const dropY = ((t * speed * 5) + col * 19) % GH
  const trail = Math.max(0, 1 - Math.abs(y - dropY) / 14) * 0.68 * v
  const scanY = (t * 5) % GH
  const scan = Math.abs(y - scanY) < 1.5 ? 0.82 : 0
  // Five figures at base
  for (const fx of [8, 20, 40, 60, 72]) {
    const f = figure(fx, ground, x, y, 0.9); if (f > 0) return f
  }
  if (y === ground) return 0.14
  return dither(x, y, Math.min(1, trail + scan * v + ((x % 8 === 0 && y % 8 === 0) ? 0.06 : 0)))
}

// ── SILENCE: long dark — ghost city, faded silhouettes, sparse stars ─────────
const sceneSilence: PixelFn = (x, y, t) => {
  const hY = 52
  if (Math.abs(y - hY) < 1) return dither(x, y, 0.16 + Math.sin(x * 0.05 + t * 0.08) * 0.04)
  if (y > hY) return noise(x, y, 1) > 0.9 ? 0.1 : 0.03
  // Ghost structures
  const skylineH = [3, 5, 3, 6, 4, 2, 7, 5, 3, 4, 6, 3]
  const sh = skylineH[Math.floor(x / 7) % skylineH.length]
  if (y > hY - sh && y < hY && x % 7 >= 1 && x % 7 <= 5) return 0.07
  // Three faded ghost figures
  for (const fx of [14, 40, 66]) {
    const gf = figure(fx, hY, x, y, 0.14 + Math.sin(t * 0.3 + fx) * 0.04); if (gf > 0) return gf
  }
  // Stars — more than usual, the absence is the point
  if (noise(x, y, 5) > 0.974) return 0.42 + Math.sin(t * 2 + x) * 0.1
  // Grid lines fading
  if ((x % 20 === 0 || y % 20 === 0) && y < hY - 3) return 0.04
  return 0
}

// ── TOGETHER: convergence — two figures, beams meeting at midpoint ────────────
const sceneTogether: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 64, mid = 40
  if (y > ground) return 0.04
  const sep = Math.max(6, 32 - t * 2.5)
  const f1 = figure(Math.round(mid - sep), ground, x, y, 0.88)
  const f2 = figure(Math.round(mid + sep), ground, x, y, 0.88)
  if (f1 > 0 || f2 > 0) return Math.max(f1, f2)
  // Converging beams
  const bY = ground - 12
  const b1 = Math.abs(y - (bY + (x - (mid - sep)) * 0.2)) < 1.2 && x < mid ? 0.6 * v : 0
  const b2 = Math.abs(y - (bY + (mid + sep - x) * 0.2)) < 1.2 && x > mid ? 0.6 * v : 0
  // Collision bloom at meeting point
  const col = Math.exp(-(dist(x, y, mid, bY) ** 2) / 28) * (0.92 + Math.sin(t * 5) * 0.08) * v
  if (y === ground) return 0.15
  return dither(x, y, Math.min(1, b1 + b2 + col))
}

// ── LYRA_BUILD: Lyra building — figure at tower base, signal nodes connecting ─
const sceneLyraBuild: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 62
  if (y > ground) return dither(x, y, 0.04 + (y - ground) * 0.01)
  if (y === ground) return 0.15
  // Main tower growing — height pulses slightly with intensity
  const tH = 28 + Math.round(v * 12)
  const tTop = ground - tH
  const tw = tower(32, tTop, 16, tH, x, y, 0.84)
  if (tw > 0) return dither(x, y, tw)
  // Two smaller flanking towers
  for (const [tx, th] of [[10, 14], [58, 18]] as [number, number][]) {
    const ft = tower(tx, ground - th, 10, th, x, y, 0.62)
    if (ft > 0) return dither(x, y, ft)
  }
  // Lyra figure at the base working
  const fig = figure(40, ground, x, y, 0.95)
  if (fig > 0) return fig
  // Signal nodes floating up
  for (let i = 0; i < 4; i++) {
    const nx = 28 + i * 8
    const ny = Math.round(tTop + 4 + Math.sin(t * 0.8 + i * 1.5) * 4)
    if (x === nx && y === ny) return dither(x, y, (0.7 + Math.sin(t * 3 + i) * 0.28) * v)
    if (dist(x, y, nx, ny) < 2) return dither(x, y, 0.35 * v)
  }
  // Construction glow at top
  const glow = Math.exp(-(dist(x, y, 40, tTop) ** 2) / 30) * 0.55 * v * (Math.sin(t * 0.22) * 0.2 + 0.8)
  return dither(x, y, Math.min(1, glow))
}

// ── LYRA_RETURN: Lyra rebuilds — figure standing in burned ground, signal rising
const sceneReturns: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 64
  if (y > ground) return dither(x, y, 0.04)
  if (y === ground) return 0.13
  // Scorched ground — ash texture on the left
  if (y === ground - 1 && x < 50) return noise(x, y, 4) > 0.6 ? dither(x, y, 0.28) : 0.06
  if (y === ground - 2 && x < 50) return noise(x, y, 5) > 0.8 ? 0.18 : 0
  // Ruined remnants left side — broken tower stumps
  if (Math.abs(x - 18) <= 3 && y >= ground - 8 && y <= ground - 1) {
    if (noise(x, y, 6) > 0.5) return dither(x, y, 0.35)
    return 0.08
  }
  // Lyra figure standing in the middle of it
  const fig = figure(40, ground, x, y, 0.95)
  if (fig > 0) return fig
  // New signal rising from ash — pulsing upward streams on the right
  const rise = clamp01(t * 0.006)
  for (let i = 0; i < 5; i++) {
    const sx = 44 + i * 6
    const sH = Math.round(rise * (14 + i * 4))
    const sy = ground - Math.round((y - (ground - sH)) / sH * sH)
    if (x === sx && y >= ground - sH && y <= ground - 1) {
      const pulse = ((y * 0.2 + t * 0.6 + i) % 1)
      return dither(x, y, (0.25 + Math.sin(pulse * Math.PI * 2) * 0.35) * v * rise)
    }
  }
  return 0
}

// ── FINN_BURN: burn — 8 fracture lines from impact, shockwave ring, ash ──────
const sceneFinnBurn: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 64, cx = 40, cy = 42
  if (y > ground) return 0.05
  if (y === ground) return 0.14
  // Figure at center
  const fig = figure(cx, cy, x, y, 1.0)
  if (fig > 0) return fig
  // 8 fracture lines radiating out
  const ang = Math.atan2(y - cy, x - cx)
  const d = dist(x, y, cx, cy)
  for (let i = 0; i < 8; i++) {
    const crA = (i / 8) * Math.PI * 2
    const diff = Math.abs(((ang - crA + Math.PI * 3) % (Math.PI * 2)) - Math.PI)
    if (diff < 0.042 + d * 0.002 && d > 4 && d < 34)
      return dither(x, y, (0.62 + Math.sin(t * 3 + d * 0.4) * 0.3) * v)
  }
  // Expanding shockwave ring
  const ring = ((t * 3.8) % 44) + 3
  if (Math.abs(d - ring) < 1.8) return dither(x, y, 0.52 * v)
  // Debris scatter
  const debris = noise(x, y, Math.floor(t * 0.1) + 2) > 0.88 && d > 10 ? 0.28 * v : 0
  return dither(x, y, debris)
}

// ── FINN_LYRA: Finn burns Lyra's work — cracking tower, two figures visible ──
const sceneFinnLyra: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 64, cx = 42, cy = 48
  if (y > ground) return 0.04
  // Cracking towers — Lyra's structures under damage
  const towers: [number, number, number][] = [[14, 20, 10], [32, 34, 14], [58, 24, 9]]
  for (const [tcx, th, tw] of towers) {
    const top = ground - th
    if (Math.abs(x - tcx) <= tw / 2 && y >= top && y <= ground) {
      const damage = clamp01(1 - dist(x, y, cx, cy) / 30)
      if (noise(x, y, Math.floor(t) + 2) > 0.82 - damage * 0.28) return 0.05
      if (x === tcx - Math.floor(tw / 2) || x === tcx + Math.floor(tw / 2)) return 0.5 - damage * 0.3
      if ((y - top) % 5 === 1) return 0.82
      return dither(x, y, 0.18)
    }
  }
  // Finn figure — dominant
  const finn = figure(cx, cy, x, y, 1.0); if (finn > 0) return finn
  // Lyra figure — smaller, further back, seeing it happen
  const lyra = figure(14, ground, x, y, 0.58); if (lyra > 0) return lyra
  // Crack lines from Finn's position
  const d = dist(x, y, cx, cy)
  const ang = Math.atan2(y - cy, x - cx)
  const crA = Math.round(ang / (Math.PI / 5)) * (Math.PI / 5)
  if (Math.abs(ang - crA) < 0.045 && d > 3 && d < 24)
    return dither(x, y, (0.52 + Math.sin(t * 4 + d * 0.5) * 0.3) * v)
  if (y === ground) return 0.13
  return 0
}

// ── FINN_AGAIN: burn streak — three expanding rings, figure walking through ───
const sceneFinnAgain: PixelFn = (x, y, t, I) => {
  const v = I / 100, cx = 40, cy = 40
  // Three overlapping burn rings at different phases
  let total = 0
  for (let w = 0; w < 3; w++) {
    const r = ((t * 4.5 + w * 16) % 52) + 3
    const d = dist(x, y, cx + (w - 1) * 6, cy + (w - 1) * 3)
    total += Math.exp(-((d - r) ** 2) / 3) * (0.82 - w * 0.18) * v
  }
  // Figure walking forward through the rings
  const walkX = Math.round(10 + (t * 2.2) % 60)
  const fig = figure(walkX, cy + 12, x, y, 0.95)
  if (fig > 0) return fig
  // Central flash
  const cD = dist(x, y, cx, cy)
  if (cD < 5) total += (1 - cD / 5) * Math.abs(Math.sin(t * 0.5)) * v
  return dither(x, y, Math.min(1, total))
}

// ── CAST_WATCH: Cast watching — elevated hooded figure, perspective grid below
const sceneCastWatch: PixelFn = (x, y, t, I) => {
  const v = I / 100, horizon = 46
  if (Math.abs(y - horizon) < 1) return 0.26 + Math.sin(x * 0.07 + t * 0.18) * 0.06
  // Cast figure elevated, cloaked
  const fig = figCast(40, horizon, x, y, 0.9)
  if (fig > 0) return fig
  // Perspective grid below — the whole grid spread out
  if (y > horizon) return perspGrid(x, y, horizon, t, 0.5)
  // Stars above
  const star = noise(x, y, 11) > 0.977 ? 0.52 + Math.sin(t * 1.8 + x) * 0.1 : 0
  // Slow rotating scanner beam from Cast
  const ang = t * 0.14
  for (let s = 6; s < 36; s += 0.8) {
    const bx = Math.round(40 + Math.cos(ang) * s), by = Math.round(horizon - 2 + Math.sin(ang) * s * 0.3)
    if (x === bx && y === by && y < horizon) return dither(x, y, (1 - s / 36) * 0.4 * v)
  }
  return dither(x, y, star)
}

// ── CAST_SEES: Cast sees the pattern — giant scrolling ledger, scanning eye ───
const sceneCastSees: PixelFn = (x, y, t, I) => {
  const v = I / 100, colW = 15
  // Document columns — the record
  for (let col = 5; col < GW - 5; col += colW) {
    if (x === col || x === col + colW - 2) return dither(x, y, 0.6)
    for (let row = 4; row < GH - 4; row += 4) {
      if (y === row && x >= col + 1 && x <= col + colW - 4) {
        return dither(x, y, noise(x, y, row * 7 + col) > (0.32 + (row / GH) * 0.2) ? 0.44 : 0.07)
      }
    }
  }
  // Scanning eye at top center
  const eD = dist(x, y, 40, 8)
  if (eD < 9) return Math.sin(t * 0.45) > 0.92 ? 0.08 : (1 - eD / 9) * 0.88
  // Scan line moving down
  const scanY = 14 + ((t * 1.6) % (GH - 22))
  if (Math.abs(y - scanY) < 1.4) return 0.46 * v
  // Highlighted entry — something the Cast just noticed
  const hiRow = 14 + Math.floor(scanY / 4) * 4
  if (y === hiRow && x >= 5 && x <= GW - 7) return dither(x, y, 0.3 * v)
  return 0
}

// ── CIELO_TEND: Cielo tending — figure moving through patchwork, leaving glow ─
const sceneCieloTend: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 65
  if (y > ground) return 0.04
  if (y === ground) return 0.12
  // Patchwork terrain — varied zones in different states
  const pBase = noise(Math.floor(x / 13), Math.floor(y / 10), 5) > 0.4 ? 0.16 : 0.04
  if (x % 13 === 0 || y % 10 === 0) return 0.09
  // Cielo moving across the terrain
  const cX = 8 + ((t * 3.2) % 58)
  const fig = figure(Math.round(cX), ground, x, y, 0.88)
  if (fig > 0) return fig
  // Glow trail behind her — the work done, stabilized
  const trailX = cX - 12
  if (trailX > 0) {
    const tG = Math.exp(-(dist(x, y, trailX, ground - 8) ** 2) / 80) * 0.38 * v
    if (tG > 0.06) return dither(x, y, Math.min(1, tG + pBase))
  }
  return dither(x, y, pBase)
}

// ── CIELO_AFTER: Cielo after burn — scorched left, stable right, figure at edge
const sceneCieloAfter: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 65
  if (y > ground) return 0.04
  if (y === ground) return 0.12
  // Left half: burned zone — rubble, ash, damage
  if (x < 38) {
    if (y === ground - 1) return noise(x, y, 4) > 0.5 ? dither(x, y, 0.3) : 0.06
    if (y === ground - 2) return noise(x, y, 5) > 0.75 ? 0.18 : 0
    if (Math.abs(x - 16) <= 4 && y >= ground - 11) {
      if (noise(x, y, 7) > 0.52) return dither(x, y, 0.28)
      return 0.06
    }
    return noise(x, y, 3) > 0.92 ? 0.2 : 0
  }
  // Right half: maintained zone — intact structures
  if (x > 50) {
    const stY = ground - 14
    if (Math.abs(x - 62) <= 5 && y >= stY && y <= ground) {
      if (x === 57 || x === 67) return 0.44
      if (y === stY) return 0.44
      if ((x - 58) % 3 === 1 && (y - stY) % 4 >= 1 && (y - stY) % 4 <= 2) return 0.72 * v
      return 0.12
    }
  }
  // Cielo figure at the boundary — at the edge of the burned zone
  const fig = figure(38, ground, x, y, 0.9)
  if (fig > 0) return fig
  // Her glow reaching into the burned side
  const healG = Math.exp(-(dist(x, y, 28, ground - 6) ** 2) / 55) * 0.32 * v * (Math.sin(t * 0.2) * 0.25 + 0.75)
  return dither(x, y, Math.min(1, healG))
}

// ── ECHO_ARRIVE: Echo arrives — figure from fog at left, scanning rays, beacon ─
const sceneEchoArrive: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 62
  const echoX = Math.min(28, Math.round(4 + t * 0.32))
  // Fog from the left edge
  const fogBound = echoX + 18 + Math.sin(t * 0.28) * 5
  const fog = x < fogBound ? (1 - x / fogBound) * (noise(x, y, Math.floor(t * 1.4)) * 0.32 + 0.1) : 0
  const fig = figure(echoX, ground, x, y, 0.94)
  if (fig > 0) return fig * (1 - Math.max(0, (fogBound - echoX - 8) / 18) * 0.5)
  // Scanning rays from Echo's position fanning right
  for (let ray = 0; ray < 5; ray++) {
    const rayA = (ray - 2) * 0.16
    for (let s = 8; s < 32 + ray * 6; s += 1) {
      const rx = Math.round(echoX + Math.cos(rayA) * s)
      const ry = Math.round(ground - 5 + Math.sin(rayA) * s)
      if (x === rx && y === ry && y < ground)
        return dither(x, y, (1 - s / 38) * 0.5 * (Math.sin(t * 0.15 + s * 0.2) * 0.3 + 0.7) * v)
    }
  }
  // Distant beacon at right — something Echo is moving toward
  const bD = dist(x, y, 68, ground - 14)
  const beacon = Math.exp(-bD * bD / 28) * 0.72 * (Math.sin(t * 0.18) * 0.28 + 0.72) * v
  if (y === ground) return x % 5 === 0 ? 0.16 : 0.07
  if (y > ground) return 0.04
  return dither(x, y, Math.min(1, fog + beacon))
}

// ── ECHO_FIND: Echo discovers — kneeling at glowing artifact, structure rises ─
const sceneEchoFind: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 64, surface = 36
  // Rising buried structure — old, geometric, not from this era
  const rise = clamp01(t * 0.005)
  const structTop = surface + Math.round((1 - rise) * 20)
  if (x >= 30 && x <= 52 && y >= structTop && y <= surface) {
    if (x === 30 || x === 52 || y === structTop) return dither(x, y, 0.74 * rise)
    const ix = x - 30, iy = y - structTop
    if (ix % 7 === 0 || iy % 5 === 0) return dither(x, y, 0.5 * rise)
    return dither(x, y, 0.2 * rise)
  }
  // Echo figure — kneeling, examining
  const fig = figure(22, surface + 2, x, y, 0.9)
  if (fig > 0) return fig
  // Radiating glow from discovery
  const glowD = dist(x, y, 41, surface)
  const glow = Math.exp(-glowD * glowD / 180) * 0.5 * v * (Math.sin(t * 0.14) * 0.3 + 0.7)
  if (y === surface) return 0.22
  if (y > surface) return dither(x, y, 0.04 + (y - surface) * 0.003)
  return dither(x, y, Math.min(1, glow))
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE REGISTRY — 15 scenes, one per beat
// ─────────────────────────────────────────────────────────────────────────────

const SCENES: Record<string, PixelFn> = {
  open:        sceneOpen,
  era:         sceneEra,
  silence:     sceneSilence,
  together:    sceneTogether,
  lyra_build:  sceneLyraBuild,
  lyra_return: sceneReturns,
  finn_burn:   sceneFinnBurn,
  finn_lyra:   sceneFinnLyra,
  finn_again:  sceneFinnAgain,
  cast_watch:  sceneCastWatch,
  cast_sees:   sceneCastSees,
  cielo_tend:  sceneCieloTend,
  cielo_after: sceneCieloAfter,
  echo_arrive: sceneEchoArrive,
  echo_find:   sceneEchoFind,
}

const SCENE_LABELS: Record<string, string> = {
  open:        'the record opens',
  era:         'the world turns',
  silence:     'nothing for a long time',
  together:    'two at once',
  lyra_build:  'Lyra builds',
  lyra_return: 'she came back',
  finn_burn:   'Finn burns',
  finn_lyra:   'it was hers',
  finn_again:  'burning again',
  cast_watch:  'the Cast watches',
  cast_sees:   'the Cast sees the pattern',
  cielo_tend:  'Cielo tends',
  cielo_after: 'after the burn',
  echo_arrive: 'Echo at the margin',
  echo_find:   'he found something',
}

// ─────────────────────────────────────────────────────────────────────────────
// BEAT → SCENE mapping — reads the sourceEvent.ruleApplied from new Beat names
// ─────────────────────────────────────────────────────────────────────────────

function beatToScene(entry: StoryEntry): string {
  const rule = (entry.sourceEvent?.ruleApplied ?? '').toLowerCase()
  const charKey = entry.activeCharacter

  // System beats — match beat name directly
  if (rule.includes('open') || entry.loreType === 'FIRST_LIGHT') return 'open'
  if (rule.includes('era') || entry.loreType === 'ERA_SHIFT') return 'era'
  if (rule.includes('silence') || entry.loreType === 'LONG_DARK') return 'silence'
  if (rule.includes('together') || entry.loreType === 'CONVERGENCE') return 'together'

  // Lyra beats
  if (rule.includes('lyra return') || rule.includes('lyra_return')) return 'lyra_return'
  if (rule.includes('lyra') || charKey === 'LYRA') return 'lyra_build'

  // Finn beats
  if (rule.includes('finn again') || rule.includes('finn_again')) return 'finn_again'
  if (rule.includes('finn lyra') || rule.includes('finn_lyra')) return 'finn_lyra'
  if (rule.includes('finn') || charKey === 'VOSS') return 'finn_burn'

  // Cast beats
  if (rule.includes('cast sees') || rule.includes('cast_sees')) return 'cast_sees'
  if (rule.includes('cast') || charKey === 'CAST') return 'cast_watch'

  // Cielo beats
  if (rule.includes('cielo after') || rule.includes('cielo_after')) return 'cielo_after'
  if (rule.includes('cielo') || charKey === 'SABLE') return 'cielo_tend'

  // Echo beats
  if (rule.includes('echo find') || rule.includes('echo_find')) return 'echo_find'
  if (rule.includes('echo') || charKey === 'ECHO') return 'echo_arrive'

  // Fallback
  return 'cast_watch'
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDERER
// ─────────────────────────────────────────────────────────────────────────────

function renderFrame(
  screenCtx: CanvasRenderingContext2D,
  small: HTMLCanvasElement,
  smallCtx: CanvasRenderingContext2D,
  img: ImageData,
  tick: number,
  scene: string,
  intensity: number,
  isDark: boolean,
) {
  const t = tick * 0.042
  const fn = SCENES[scene] ?? SCENES.cast_watch
  const buf = img.data
  const bgR = isDark ? 9  : 238, bgG = isDark ? 9  : 236, bgB = isDark ? 8  : 228
  const fgR = isDark ? 220: 16,  fgG = isDark ? 218: 16,  fgB = isDark ? 210: 14

  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      const i4 = (y * GW + x) * 4
      const v = clamp01(fn(x, y, t, intensity))
      buf[i4]     = Math.round(bgR + (fgR - bgR) * v)
      buf[i4 + 1] = Math.round(bgG + (fgG - bgG) * v)
      buf[i4 + 2] = Math.round(bgB + (fgB - bgB) * v)
      buf[i4 + 3] = 255
    }
  }
  smallCtx.putImageData(img, 0, 0)
  screenCtx.imageSmoothingEnabled = false
  screenCtx.drawImage(small, 0, 0, W, H)
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function WarGrid({
  entries,
  activeEntry,
  isDark,
  focusChar,
  onEntryClick,
}: {
  entries: StoryEntry[]
  activeEntry?: StoryEntry | null
  isDark?: boolean
  focusChar?: CharacterKey | null
  onEntryClick?: (entry: StoryEntry) => void
}) {
  const screenRef = useRef<HTMLCanvasElement>(null)
  const smallRef = useRef<HTMLCanvasElement | null>(null)
  const smallCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const imgRef = useRef<ImageData | null>(null)
  const tickRef = useRef(0)
  const rafRef = useRef(0)
  const dark = isDark ?? false

  const { scene, intensity, charKey, charName, resolvedEntry } = useMemo(() => {
    const dynamic = entries.filter(e => e.eventType !== 'genesis')
    let entry: StoryEntry | null | undefined = activeEntry
    if (!entry && focusChar)
      entry = [...dynamic].reverse().find(e => e.activeCharacter === focusChar) ?? null
    if (!entry) entry = dynamic[dynamic.length - 1] ?? null
    if (!entry) return { scene: 'open', intensity: 30, charKey: null as CharacterKey | null, charName: '', resolvedEntry: null }
    const sc = beatToScene(entry)
    const ck = (entry.activeCharacter ?? null) as CharacterKey | null
    const char = ck ? CHARACTERS[ck] : null
    return { scene: sc, intensity: entry.visualState?.intensity ?? 60, charKey: ck, charName: char?.name ?? '', resolvedEntry: entry }
  }, [entries, activeEntry, focusChar])

  useEffect(() => {
    const sc = screenRef.current; if (!sc) return
    const sCtx = sc.getContext('2d'); if (!sCtx) return
    const sm = document.createElement('canvas'); sm.width = GW; sm.height = GH
    const smCtx = sm.getContext('2d')!
    smallRef.current = sm; smallCtxRef.current = smCtx
    imgRef.current = smCtx.createImageData(GW, GH)
    const FRAME_MS = 1000 / 24
    let lastTime = 0
    const loop = (now: number) => {
      if (now - lastTime >= FRAME_MS) {
        lastTime = now
        tickRef.current++
        renderFrame(sCtx, sm, smCtx, imgRef.current!, tickRef.current, scene, intensity, dark)
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [scene, intensity, dark])

  const char = charKey ? CHARACTERS[charKey] : null

  return (
    <div>
      <div className="relative overflow-hidden" style={{ background: dark ? '#090908' : '#eeecd4', lineHeight: 0 }}>
        <canvas
          ref={screenRef}
          width={W}
          height={H}
          style={{ display: 'block', width: '100%', aspectRatio: '1/1', imageRendering: 'pixelated' }}
        />
      </div>
      <div style={{
        borderTop: `1px solid ${dark ? '#1e1e1c' : '#c4c3bb'}`,
        background: dark ? '#0c0c0a' : '#e8e5dc',
        padding: '0.5rem 0.85rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: '0.38rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: dark ? '#383830' : '#9a9990', marginBottom: '0.18rem' }}>
            {focusChar ? 'last seen' : 'live scene'}
          </div>
          <div style={{ fontSize: '0.52rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: dark ? '#b0b0a8' : '#181815', fontWeight: 700, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {charName && <span style={{ fontWeight: 400, color: dark ? '#484840' : '#7a7970', marginRight: '0.4rem' }}>{charName} ·</span>}
            {resolvedEntry && onEntryClick ? (
              <button
                onClick={() => onEntryClick(resolvedEntry)}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit',
                  textTransform: 'inherit', fontWeight: 'inherit', lineHeight: 'inherit',
                  color: dark ? '#b0b0a8' : '#181815',
                  textDecoration: 'underline', textUnderlineOffset: '3px',
                  textDecorationColor: dark ? '#383830' : '#c4c3bb',
                }}
                title="Go to this entry in the chronicle"
              >
                {SCENE_LABELS[scene] ?? scene}
              </button>
            ) : (
              <span>{SCENE_LABELS[scene] ?? scene}</span>
            )}
          </div>
        </div>
        {char && (
          <div style={{ fontSize: '0.38rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: dark ? '#484840' : '#9a9990', textAlign: 'right', flexShrink: 0 }}>
            {char.title}
          </div>
        )}
      </div>
    </div>
  )
}
