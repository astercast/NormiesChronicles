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
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const BAYER: number[][] = [
  [ 0,  8,  2, 10], [12,  4, 14,  6],
  [ 3, 11,  1,  9], [15,  7, 13,  5],
]
const dither = (x: number, y: number, v: number, spread = 0.055): number =>
  clamp01(v + (BAYER[y & 3][x & 3] / 16 - 0.5) * spread)

// Pixel-art person figure
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

// Hooded cloaked figure (Cast)
const figCast = (cx: number, feet: number, px: number, py: number, bright = 0.88): number => {
  const head = feet - 13
  if (dist(px, py, cx, head + 2) < 2.8) return bright
  const bodyW = Math.min(5, 1 + Math.floor((py - head) * 0.35))
  if (py >= head + 4 && py <= feet && Math.abs(px - cx) <= bodyW)
    return bright * clamp01(0.9 - Math.abs(px - cx) * 0.07)
  if (py === feet && Math.abs(px - cx) <= 3) return bright * 0.55
  return 0
}

// City building block
const building = (bx: number, by: number, bw: number, bh: number, px: number, py: number, bright: number): number => {
  if (px < bx || px >= bx + bw || py < by || py >= by + bh) return 0
  if (px === bx || px === bx + bw - 1 || py === by) return bright * 0.7
  const wx = (px - bx - 1) % 4, wy = (py - by) % 5
  if (wx <= 1 && wy >= 1 && wy <= 3) return bright * (0.9 + Math.sin(by * 0.3) * 0.1)
  return bright * 0.15
}

// Neon scan line / HUD element
const hud = (x: number, y: number, t: number): number => {
  const line1 = Math.abs(y - 6) < 1 ? 0.18 : 0
  const line2 = Math.abs(y - GH - 7) < 1 ? 0.14 : 0
  const corner = (x < 4 || x > GW - 5) && (y < 4 || y > GH - 5) ? 0.22 : 0
  const scanH = ((t * 0.8) % GH)
  const scan = Math.abs(y - scanH) < 0.7 ? 0.04 : 0
  return line1 + line2 + corner + scan
}

// Grid overlay — Normia's pixel grid texture
const pixelGrid = (x: number, y: number, bright: number): number => {
  if (x % 8 === 0 || y % 8 === 0) return bright
  return 0
}

// ══════════════════════════════════════════════════════════════════════════════
// SCENES — one per story beat, all set in Normia
// ══════════════════════════════════════════════════════════════════════════════

// OPEN: dawn over Normia — city skyline, grid awakening, first light
const sceneOpen: PixelFn = (x, y, t, I) => {
  const v = I / 100
  const horizon = 46
  // Sky gradient
  if (y < horizon) {
    const fade = (horizon - y) / horizon
    const glow = Math.exp(-((y - horizon) ** 2) / 200) * 0.4
    if (noise(x, y, 7) > 0.978 && y < horizon - 6)
      return 0.35 + Math.sin(t * 1.5 + x * 0.4) * 0.1
    return dither(x, y, glow + fade * 0.06)
  }
  // Skyline — varied building heights
  const heights = [12, 18, 8, 22, 14, 28, 10, 20, 16, 24, 12, 18, 20, 14, 26, 10]
  const bIdx = Math.floor(x / 5)
  const bH = heights[bIdx % heights.length]
  const bTop = horizon - bH
  if (y >= bTop && y < horizon) {
    // Windows light up gradually
    const lit = noise(Math.floor(x / 5), Math.floor((y - bTop) / 3), 2) > (0.6 - v * 0.3)
    if (lit && (y - bTop) % 3 === 1 && x % 5 >= 1 && x % 5 <= 3) return 0.75 * clamp01(t * 0.008)
    return 0.1 + (y - bTop) / bH * 0.05
  }
  // Ground — pixel grid awakening
  if (y === horizon) return 0.35
  const pg = pixelGrid(x, y, 0.06 * v)
  if (y > horizon) return dither(x, y, 0.04 + pg)
  return 0
}

// ERA: era shift — cascading data rewrite, all five silhouettes below
const sceneEra: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = GH - 8
  // Data rain — columns of descending characters
  const col = Math.floor(x / 3)
  const spd = ((col * 7 + 5) % 9) + 2
  const dropY = ((t * spd * 4) + col * 23) % GH
  const trail = Math.max(0, 1 - Math.abs(y - dropY) / 12) * 0.72 * v
  // Horizontal scan bar
  const scanY = (t * 4) % GH
  const scan = Math.abs(y - scanY) < 1.5 ? 0.75 * v : 0
  // Five resistance figures standing below watching
  for (const fx of [8, 20, 40, 60, 72]) {
    const f = figure(fx, ground, x, y, 0.85); if (f > 0) return f
  }
  if (y === ground) return 0.2
  // Grid lines
  if (x % 8 === 0 && y % 8 === 0) return 0.12 * v
  return dither(x, y, Math.min(1, trail + scan))
}

// LONG_QUIET: quiet stretch — empty Normia street, dust, no Cartel yet
const sceneQuiet: PixelFn = (x, y, t) => {
  const hY = 50
  // Horizon
  if (Math.abs(y - hY) < 1) return dither(x, y, 0.22 + Math.sin(x * 0.04 + t * 0.06) * 0.04)
  // Empty street
  if (y > hY) {
    if (y === hY + 1) return dither(x, y, 0.12 + noise(x, y, 1) * 0.08)
    if (x % 20 === 0 && y > hY + 2 && y < hY + 12) return 0.08 // lane marking
    return dither(x, y, 0.03 + noise(x, y, 3) * 0.04)
  }
  // City buildings — dark, no windows lit
  const heights = [14, 20, 9, 16, 24, 11, 19, 15, 22]
  const bIdx = Math.floor(x / 9)
  const bH = heights[bIdx % heights.length]
  const bTop = hY - bH
  if (y >= bTop && y < hY) {
    if (x === Math.floor(bIdx * 9) || x === Math.floor(bIdx * 9) + 8) return 0.14
    if (y === bTop) return 0.14
    return noise(x, y, 4) > 0.93 ? 0.08 : 0.04
  }
  // One lone figure far in the distance
  const g = figure(40, hY, x, y, 0.22 + Math.sin(t * 0.18) * 0.04)
  if (g > 0) return g
  // Sparse stars
  if (noise(x, y, 5) > 0.977) return 0.3 + Math.sin(t * 1.2 + x) * 0.08
  return 0
}

// SIMULTANEOUS: two at once — split screen, two figures, grid flash
const sceneSimultaneous: PixelFn = (x, y, t, I) => {
  const v = I / 100, mid = 40, ground = 58
  // Split line
  if (Math.abs(x - mid) < 1) return 0.55 + Math.sin(t * 4) * 0.3
  if (y === ground) return 0.15
  // Two figures, two sides
  const f1 = figure(20, ground, x, y, 0.9); if (f1 > 0 && x < mid) return f1
  const f2 = figure(60, ground, x, y, 0.9); if (f2 > 0 && x > mid) return f2
  // Grid on left, city on right
  if (x < mid) return pixelGrid(x, y, 0.12 * v)
  // Right: building silhouette
  const bH = 20, bTop = ground - bH
  if (y >= bTop && y < ground && x >= 48 && x <= 68) return 0.18
  // Pulse from center
  const pD = dist(x, y, mid, ground - 10)
  return dither(x, y, Math.exp(-pD * pD / 60) * 0.5 * v * Math.abs(Math.sin(t * 0.25)))
}

// LYRA_DESIGNS: Lyra working — code / blueprints on screen, focused figure
const sceneLyraDesigns: PixelFn = (x, y, t, I) => {
  const v = I / 100
  // Screen glow — her workstation
  const screenX = 22, screenY = 14, screenW = 36, screenH = 28
  if (x >= screenX && x < screenX + screenW && y >= screenY && y < screenY + screenH) {
    if (x === screenX || x === screenX + screenW - 1 || y === screenY || y === screenY + screenH - 1) return 0.7
    // Code lines scrolling
    const lineY = (y - screenY - 1)
    const scroll = Math.floor(t * 0.15)
    const lineActive = ((lineY + scroll) % 3 === 0)
    if (lineActive) {
      const lineLen = 12 + Math.floor(noise(lineY + scroll, 0, 4) * 20)
      return x - screenX - 1 < lineLen ? dither(x, y, 0.6 + Math.sin(t * 0.3 + lineY) * 0.2) : 0.08
    }
    return dither(x, y, 0.07 + noise(x, y, 5) * 0.05)
  }
  // Screen reflection glow
  const glowD = dist(x, y, screenX + screenW / 2, screenY + screenH)
  const glow = Math.exp(-glowD * glowD / 200) * 0.22 * v
  // Lyra figure hunched at screen
  const fig = figure(40, 58, x, y, 0.9); if (fig > 0) return fig
  // Grid pattern Lyra is designing — nodes on right side
  for (let i = 0; i < 5; i++) {
    const nx = 62 + (i % 2) * 6, ny = 24 + i * 9
    if (dist(x, y, nx, ny) < 2) return dither(x, y, (0.6 + Math.sin(t * 2 + i) * 0.3) * v)
    if (i < 4 && dist(x, y, (nx + 62 + ((i + 1) % 2) * 6) / 2, (ny + 24 + (i + 1) * 9) / 2) < 0.8)
      return 0.25 * v
  }
  if (y === 58) return 0.12
  if (y > 58) return 0.03
  return dither(x, y, glow)
}

// LYRA_DAILY: Lyra's ordinary day — market, street scene, normal life
const sceneLyraDaily: PixelFn = (x, y, t, I) => {
  const ground = 58
  if (y === ground) return 0.18
  if (y > ground) return dither(x, y, 0.03 + noise(x, y, 1) * 0.03)
  // Market stalls
  for (const [sx, sw] of [[8, 14], [30, 12], [54, 14]] as [number, number][]) {
    if (y === ground - 6 && x >= sx && x < sx + sw) return 0.6 // awning
    if (y === ground - 5 && x === sx && x === sx + sw - 1) return 0.4 // pole
    if (y >= ground - 4 && y < ground && x >= sx + 1 && x < sx + sw - 1)
      return noise(x, y, sx) > 0.6 ? 0.35 : 0.12 // goods
  }
  // Lyra figure browsing
  const fig = figure(26, ground, x, y, 0.88); if (fig > 0) return fig
  // Another person at another stall
  const fig2 = figure(52, ground, x, y, 0.55); if (fig2 > 0) return fig2
  // Sky
  if (noise(x, y, 7) > 0.981) return 0.28
  return 0
}

// LYRA_RESPONDS: Lyra responds to Cartel push — urgent, late night, blueprints
const sceneLyraResponds: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 62
  // Dark room, urgent glow from screen
  const scrX = 24, scrY = 12, scrW = 32, scrH = 22
  if (x >= scrX && x < scrX + scrW && y >= scrY && y < scrY + scrH) {
    if (x === scrX || x === scrX + scrW - 1 || y === scrY || y === scrY + scrH - 1)
      return 0.8 + Math.sin(t * 5) * 0.15
    // Warning indicators
    if (y === scrY + 2 && x >= scrX + 1 && x < scrX + scrW - 1) return 0.7 * v
    // Rapid work — lines appearing fast
    const scroll = Math.floor(t * 0.5)
    const lineY = y - scrY - 3
    if (lineY >= 0 && (lineY + scroll) % 2 === 0 && lineY < scrH - 4) {
      const len = 8 + Math.floor(noise(lineY, scroll, 3) * 22)
      return x - scrX - 1 < len ? dither(x, y, 0.72) : 0.05
    }
    return 0.06
  }
  // Glow
  const glow = Math.exp(-(dist(x, y, scrX + scrW / 2, scrY + scrH) ** 2) / 120) * 0.35 * v
  // Lyra figure — tense, leaning forward
  const fig = figure(42, ground, x, y, 0.92); if (fig > 0) return fig
  // Text message — Echo's alert
  if (y >= 44 && y <= 48 && x >= 52 && x <= 74) {
    if (x === 52 || x === 74 || y === 44 || y === 48) return 0.4
    if (y === 46) return 0.55 * v // message line
    return 0.06
  }
  if (y === ground) return 0.1
  if (y > ground) return 0.02
  return dither(x, y, glow)
}

// FINN_RECLAIMS: Finn reclaiming territory at night — service corridor, grid restore
const sceneFinnReclaims: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 65
  // Dark corridor
  if (y > ground) return 0.03
  if (y === ground) return 0.18
  // Corridor walls
  if (x < 6 || x > GW - 7) return dither(x, y, 0.08 + noise(x, y, 2) * 0.06)
  // Ceiling pipes / conduits
  if (y < 10) {
    if (y === 4 || y === 8) return 0.22
    if (x % 16 === 8 && y >= 4 && y <= 8) return 0.18
    return 0.04
  }
  // Cartel lock panel — being bypassed
  if (x >= 58 && x <= 70 && y >= 20 && y <= 38) {
    if (x === 58 || x === 70 || y === 20 || y === 38) return 0.55
    // Lock state — being cracked
    const cracked = clamp01(t * 0.012)
    const lockLine = y - 21
    if (lockLine % 4 === 0) return cracked > noise(lockLine / 4, 0, 1) ? 0.75 * v : 0.12
    return 0.08
  }
  // Finn figure moving through
  const finnX = Math.round(14 + ((t * 2.8) % 44))
  const fig = figure(finnX, ground, x, y, 0.95); if (fig > 0) return fig
  // Grid being restored — lit pixels spreading behind him
  if (x < finnX - 4) {
    const restored = pixelGrid(x, y, 0.15 * v)
    return dither(x, y, 0.04 + restored)
  }
  // Dark ahead
  return dither(x, y, 0.02 + noise(x, y, 3) * 0.03)
}

// FINN_DAILY: Finn's ordinary day — café, sitting, watching the grid
const sceneFinnDaily: PixelFn = (x, y, t, I) => {
  const ground = 60
  if (y === ground) return 0.18
  if (y > ground) return dither(x, y, 0.04)
  // Café interior — table, window
  // Window looking out — city glimpse
  if (x >= 4 && x <= 22 && y >= 10 && y <= 40) {
    if (x === 4 || x === 22 || y === 10 || y === 40) return 0.45
    // City outside, distant
    const bH = 8 + (x % 4) * 3
    if (y >= 40 - bH && y < 40) return 0.15
    return 0.05
  }
  // Table
  if (y === ground - 6 && x >= 30 && x <= 58) return 0.4
  if (y >= ground - 5 && y < ground && (x === 30 || x === 58)) return 0.22 // table legs
  // Cup on table
  if (y >= ground - 10 && y < ground - 6 && x >= 38 && x <= 42) return 0.55
  // Finn sitting at table
  const fig = figure(44, ground, x, y, 0.88); if (fig > 0) return fig
  // Grid traffic display on wall — he's watching it
  if (x >= 62 && x <= 76 && y >= 14 && y <= 28) {
    if (x === 62 || x === 76 || y === 14 || y === 28) return 0.35
    const scanY = 16 + (Math.floor(t * 0.5) % 13)
    return y === scanY ? 0.6 : dither(x, y, 0.1 + noise(x, y, 4) * 0.12)
  }
  return 0
}

// FINN_STREAK: Finn on a run — motion blur, three zones, unstoppable
const sceneFinnStreak: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 62
  if (y === ground) return 0.18
  if (y > ground) return 0.03
  // Three sequential zone markers — restored
  for (let zone = 0; zone < 3; zone++) {
    const zx = 12 + zone * 26
    const zH = 16 + zone * 4
    if (x >= zx && x < zx + 16 && y >= ground - zH && y < ground) {
      if (x === zx || x === zx + 15) return 0.35
      if (y === ground - zH) return 0.35
      const lit = noise(Math.floor(x - zx), Math.floor(y - (ground - zH)), zone + 1) > 0.55
      if (lit && (y - (ground - zH)) % 3 === 1) return (0.6 + zone * 0.15) * v
      return 0.1
    }
  }
  // Finn — motion, blur trail
  const finnX = 8 + ((t * 4.5) % 68)
  const fig = figure(Math.round(finnX), ground, x, y, 0.98); if (fig > 0) return fig
  // Speed trail
  for (let trail = 1; trail < 8; trail++) {
    const tx = Math.round(finnX - trail * 2.2)
    if (tx >= 0 && dist(x, y, tx, ground - 5) < 1.5) return 0.5 * (1 - trail / 8) * v
  }
  // Grid flash when passing a zone
  const nearby = Math.abs(x - finnX) < 16
  if (nearby) return pixelGrid(x, y, 0.1 * v)
  return 0
}

// CAST_LOGS: Cast logging — ledger, witness presence, omniscient vantage
const sceneCastLogs: PixelFn = (x, y, t, I) => {
  const v = I / 100, colW = 14
  // Ledger columns — the record being written
  for (let col = 4; col < GW - 4; col += colW) {
    if (x === col || x === col + colW - 2) return dither(x, y, 0.55)
    for (let row = 6; row < GH - 6; row += 4) {
      if (y === row && x >= col + 1 && x <= col + colW - 4) {
        return dither(x, y, noise(x, y, row * 5 + col) > (0.3 + row / GH * 0.22) ? 0.42 : 0.07)
      }
    }
  }
  // Scan bar — Cast's gaze moving through the record
  const scanY = 10 + ((t * 1.4) % (GH - 18))
  if (Math.abs(y - scanY) < 1.4) return 0.5 * v
  // Highlighted row — something notable
  const hiRow = 10 + Math.floor(scanY / 4) * 4
  if (y === hiRow) return dither(x, y, 0.26 * v)
  // Cast figure at top — cloaked, watching
  const fig = figCast(40, 12, x, y, 0.82); if (fig > 0 && y < 14) return fig
  return 0
}

// CAST_READS: Cast reads the whole situation — map overview, all five plotted
const sceneCastReads: PixelFn = (x, y, t, I) => {
  const v = I / 100
  // City map grid
  const mapGrid = (x % 10 === 0 || y % 10 === 0) ? 0.08 : 0
  // Normia district blocks
  for (const [bx, by, bw, bh] of [
    [5,5,28,20], [38,5,36,20], [5,30,18,26], [28,30,20,14],
    [52,30,24,26], [28,48,20,10]
  ] as [number,number,number,number][]) {
    if (x >= bx && x < bx+bw && y >= by && y < by+bh) {
      if (x===bx||x===bx+bw-1||y===by||y===by+bh-1) return 0.38
      return dither(x,y,0.08 + noise(x,y,3)*0.06)
    }
  }
  // The five positions marked — pulsing dots
  for (const [px, py, i] of [[14,14,0],[60,14,1],[40,40,2],[14,44,3],[62,44,4]] as [number,number,number][]) {
    const d = dist(x, y, px, py)
    if (d < 2.5) return (0.7 + Math.sin(t * 2.5 + i) * 0.3) * v
    if (d < 5) return Math.exp(-d*d/8) * 0.25 * v
  }
  // Cartel territory — cross-hatched darker zones
  if (x >= 28 && x <= 48 && y >= 30 && y <= 44) {
    if ((x + y) % 4 === 0) return 0.35
    return 0.12
  }
  // Cast scanning lines
  const ang = t * 0.12
  for (let s = 4; s < 44; s += 0.6) {
    const sx = Math.round(40 + Math.cos(ang) * s), sy = Math.round(40 + Math.sin(ang) * s * 0.6)
    if (x === sx && y === sy) return dither(x, y, (1 - s/44) * 0.38 * v)
  }
  return dither(x, y, mapGrid)
}

// CIELO_RUNS: Cielo's safehouse network — interior, people, supplies
const sceneCieloRuns: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 65
  if (y === ground) return 0.2
  if (y > ground) return 0.03
  // Interior room — walls
  if (x < 4 || x > GW - 5) return 0.22
  if (y < 4) return 0.22
  // Shelves of supplies
  for (const sy of [16, 28]) {
    if (y === sy && x >= 6 && x <= 22) return 0.45
    if (y > sy && y <= sy + 8 && x >= 8 && x <= 20) {
      return noise(x, y, sy) > 0.55 ? 0.32 : 0.14
    }
  }
  // Table with supplies being counted
  if (y === ground - 10 && x >= 24 && x <= 48) return 0.4
  // Cielo figure
  const fig = figure(36, ground, x, y, 0.92); if (fig > 0) return fig
  // Two other people in the safehouse
  const p2 = figure(56, ground, x, y, 0.6); if (p2 > 0) return p2
  const p3 = figure(66, ground, x, y, 0.5); if (p3 > 0) return p3
  // Grid access terminal — active, valid tokens shown
  if (x >= 54 && x <= 76 && y >= 18 && y <= 32) {
    if (x === 54 || x === 76 || y === 18 || y === 32) return 0.5
    const line = ((y - 19) + Math.floor(t * 0.2)) % 5
    return line === 0 ? 0.7 * v : dither(x, y, 0.1)
  }
  return dither(x, y, 0.04 + noise(x, y, 6) * 0.03)
}

// CIELO_DAILY: Cielo's kitchen — cooking, conversation, slow morning
const sceneCieloDaily: PixelFn = (x, y, t, I) => {
  const ground = 64
  if (y === ground) return 0.18
  if (y > ground) return 0.03
  // Kitchen counter
  if (y === ground - 8 && x >= 4 && x <= 44) return 0.42
  if (y >= ground - 7 && y < ground && (x === 4 || x === 44)) return 0.22 // cabinet sides
  // Pot on counter — steam rising
  if (y >= ground - 14 && y <= ground - 8 && x >= 18 && x <= 28) return 0.48
  for (let s = 0; s < 3; s++) {
    const sX = 20 + s * 3, sY = Math.round(ground - 15 - ((t * 0.4 + s * 2.1) % 8))
    if (x === sX && y === sY) return 0.2
    if (x === sX && y === sY - 1) return 0.12
  }
  // Cielo figure cooking
  const fig = figure(22, ground, x, y, 0.9); if (fig > 0) return fig
  // Another person sitting at a table
  if (y === ground - 6 && x >= 52 && x <= 72) return 0.35 // small table
  const p2 = figure(58, ground, x, y, 0.65); if (p2 > 0) return p2
  // Window — daylight
  if (x >= 58 && x <= 76 && y >= 10 && y <= 38) {
    if (x === 58 || x === 76 || y === 10 || y === 38) return 0.5
    return dither(x, y, 0.18 + Math.sin(t * 0.1 + x * 0.1) * 0.05)
  }
  return dither(x, y, 0.04)
}

// CIELO_CRISIS: Cielo managing a crisis — shortage, close call, urgent
const sceneCielosCrisis: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 64
  if (y === ground) return 0.16
  if (y > ground) return 0.02
  // Dark corridor — something is wrong
  if (x < 4 || x > GW - 5) return 0.08
  // Nearly empty shelves — shortage
  if (y === 20 && x >= 6 && x <= 36) return 0.4
  if (y >= 22 && y <= 30 && x >= 8 && x <= 34) {
    // Mostly empty
    return noise(x, y, 1) > 0.82 ? 0.28 : 0.04
  }
  // Cielo on her phone/comms device
  const fig = figure(22, ground, x, y, 0.9); if (fig > 0) return fig
  // Comms device in hand — bright screen
  if (dist(x, y, 27, ground - 7) < 3) return (0.8 + Math.sin(t * 6) * 0.15) * v
  // Alert indicator — flashing
  const alert = y >= 8 && y <= 14 && x >= 44 && x <= 76
  if (alert) {
    if (x === 44 || x === 76 || y === 8 || y === 14) return 0.45
    return Math.sin(t * 4) > 0 ? 0.65 * v : 0.08
  }
  // Distant patrol light — something outside
  const patX = Math.round(60 + Math.sin(t * 0.15) * 12)
  const patG = Math.exp(-(dist(x, y, patX, 45) ** 2) / 30) * 0.4 * v
  return dither(x, y, patG + 0.02)
}

// ECHO_SCOUTS: Echo mapping — in the field, scanning, alone in margins
const sceneEchoScouts: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 62
  // Outer zone — rough terrain, edge of Cartel coverage
  if (y > ground) return dither(x, y, 0.04 + noise(x, y, 1) * 0.06)
  if (y === ground) return dither(x, y, 0.15 + noise(x, y, 2) * 0.06)
  // Cartel coverage edge — crosshatch on right
  if (x > 55) {
    if ((x + y) % 5 === 0) return dither(x, y, 0.28 * v)
    return 0.07
  }
  // Gap in coverage — what Echo is looking for
  if (x >= 44 && x <= 56 && y >= 30 && y <= 50) {
    // Unmapped zone — faint, unknown
    if (x % 4 === 0 || y % 4 === 0) return dither(x, y, 0.06)
    if (dist(x, y, 50, 40) < 4) return dither(x, y, 0.25 * v * Math.abs(Math.sin(t * 0.2)))
    return 0
  }
  // Echo figure — cautious, low, scanning
  const echoX = Math.round(18 + Math.sin(t * 0.06) * 4)
  const fig = figure(echoX, ground, x, y, 0.92); if (fig > 0) return fig
  // Scan rays from Echo
  for (let ray = -2; ray <= 2; ray++) {
    const angle = ray * 0.22
    for (let s = 6; s < 36; s += 1) {
      const rx = Math.round(echoX + Math.cos(angle) * s)
      const ry = Math.round(ground - 5 + Math.sin(angle) * s * 0.4)
      if (x === rx && y === ry && y < ground)
        return dither(x, y, (1 - s / 36) * 0.45 * (Math.sin(t * 0.2 + s * 0.15) * 0.3 + 0.7) * v)
    }
  }
  // Background: faint building outlines — he's in the margins of the city
  const bH = 12, bTop = 20
  if (y >= bTop && y < bTop + bH && x >= 60 && x <= 78) return 0.1
  return dither(x, y, noise(x, y, 3) * 0.05)
}

// ECHO_FINDS: Echo discovers something — kneeling, artifact glowing, awe
const sceneEchoFinds: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 65, findY = 42
  if (y > ground) return 0.03
  if (y === ground) return 0.14
  // The find — an old access terminal or pre-Cartel structure
  const rise = clamp01(t * 0.006)
  const structTop = findY - Math.round(rise * 12)
  if (x >= 34 && x <= 50 && y >= structTop && y <= findY) {
    if (x === 34 || x === 50 || y === structTop) return dither(x, y, 0.75 * rise)
    const ix = (x - 34) % 5, iy = (y - structTop) % 4
    if (ix === 0 || iy === 0) return dither(x, y, 0.5 * rise)
    // Active? Lit?
    return noise(x, y, 9) > 0.6 ? dither(x, y, 0.7 * v * rise) : dither(x, y, 0.18 * rise)
  }
  // Echo figure — kneeling, closer
  const fig = figure(26, findY + 2, x, y, 0.92); if (fig > 0) return fig
  // Radiant glow from find
  const gD = dist(x, y, 42, findY)
  const glow = Math.exp(-gD * gD / 120) * 0.55 * v * (Math.sin(t * 0.18) * 0.25 + 0.75)
  // He's texting someone — device glow
  const devG = dist(x, y, 22, findY - 8)
  const dev = Math.exp(-devG * devG / 12) * 0.4 * v
  return dither(x, y, Math.min(1, glow + dev))
}

// CARTEL_PUSH: Cartel takes Lyra's zone — takeover, grid going dark
const sceneCartelPush: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 62
  if (y > ground) return 0.02
  if (y === ground) return 0.08
  // Lyra's grid pattern on left — being overwritten
  const cartelFront = Math.round(20 + (1 - clamp01(t * 0.008)) * 40)
  if (x < cartelFront) {
    // Cartel template — flat, uniform, erasing
    if (x % 6 === 0 || y % 6 === 0) return 0.32
    return 0.12
  }
  if (Math.abs(x - cartelFront) < 3) {
    // Transition — crackling edge
    return dither(x, y, (0.6 + Math.sin(t * 8 + y * 0.3) * 0.35) * v)
  }
  // Lyra's work — still alive on right, rich grid pattern
  if (x > cartelFront + 3) {
    const pg = pixelGrid(x, y, 0.2 * v)
    const nodes = dist(x, y, 60, ground - 14) < 4 ? 0.5 * v : 0
    return dither(x, y, 0.05 + pg + nodes)
  }
  return 0
}

// CARTEL_ADVANCE: Cartel moves on open territory — grey zone, displacement
const sceneCartelAdvance: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 60
  if (y > ground) return 0.04
  if (y === ground) return 0.12
  // Street — people moving out
  // Cartel enforcement figures — rigid, uniform
  for (const ex of [52, 62, 72]) {
    const ef = figure(ex, ground, x, y, 0.7); if (ef > 0) return ef * 0.9
  }
  // Fleeing figure
  const fleeX = Math.round(38 - (t * 1.8) % 36)
  if (fleeX > 2) {
    const ff = figure(fleeX, ground, x, y, 0.88); if (ff > 0) return ff
  }
  // Cartel grid template spreading left
  const cFront = Math.round(78 - ((t * 1.5) % 50))
  if (x > cFront) {
    if (x % 6 === 0 || y % 6 === 0) return 0.3
    return 0.1
  }
  if (Math.abs(x - cFront) < 2) return dither(x, y, (0.55 + Math.sin(t * 6 + y * 0.2) * 0.3) * v)
  // Old pixel art being erased — ghost patterns
  if (noise(x, y, 4) > 0.8 && x < cFront - 5) return dither(x, y, 0.08)
  // Buildings going dark
  const bH = 18, bTop = ground - bH
  if (y >= bTop && y < ground && x >= 10 && x <= 36) {
    if (x === 10 || x === 36 || y === bTop) return 0.25
    // Windows going dark — one by one
    const wx = (x - 11) % 4, wy = (y - bTop) % 5
    const litChance = 0.8 - clamp01(t * 0.01) * 0.75
    if (wx <= 1 && wy >= 1 && wy <= 3) return noise(x, y, Math.floor(t * 0.05)) > litChance ? 0.6 : 0.06
    return 0.1
  }
  return 0
}

// ═════════════════════════════════════════════════════════════════════════════
// SCENE REGISTRY
// ═════════════════════════════════════════════════════════════════════════════

const SCENES: Record<string, PixelFn> = {
  open:              sceneOpen,
  era:               sceneEra,
  quiet:             sceneQuiet,
  simultaneous:      sceneSimultaneous,
  lyra_designs:      sceneLyraDesigns,
  lyra_daily:        sceneLyraDaily,
  lyra_responds:     sceneLyraResponds,
  finn_reclaims:     sceneFinnReclaims,
  finn_daily:        sceneFinnDaily,
  finn_streak:       sceneFinnStreak,
  cast_logs:         sceneCastLogs,
  cast_reads:        sceneCastReads,
  cielo_runs:        sceneCieloRuns,
  cielo_daily:       sceneCieloDaily,
  cielo_crisis:      sceneCielosCrisis,
  echo_scouts:       sceneEchoScouts,
  echo_finds:        sceneEchoFinds,
  cartel_push:       sceneCartelPush,
  cartel_advance:    sceneCartelAdvance,
}

const SCENE_LABELS: Record<string, string> = {
  open:              'the record opens',
  era:               'the world turns',
  quiet:             'a pause in the record',
  simultaneous:      'two at once',
  lyra_designs:      'Lyra, working',
  lyra_daily:        'Lyra\'s ordinary day',
  lyra_responds:     'Lyra responds',
  finn_reclaims:     'Finn, last night',
  finn_daily:        'a day between operations',
  finn_streak:       'Finn, still going',
  cast_logs:         'the Cast records',
  cast_reads:        'the Cast reads the situation',
  cielo_runs:        'Cielo\'s network',
  cielo_daily:       'Cielo, this morning',
  cielo_crisis:      'something is wrong',
  echo_scouts:       'Echo in the margins',
  echo_finds:        'Echo found something',
  cartel_push:       'a zone falls',
  cartel_advance:    'the Cartel advances',
}

function beatToScene(entry: StoryEntry): string {
  const rule = (entry.sourceEvent?.ruleApplied ?? '').toLowerCase()
  const ck = entry.activeCharacter

  if (entry.loreType === 'FIRST_LIGHT') return 'open'
  if (entry.loreType === 'ERA_SHIFT') return 'era'
  if (entry.loreType === 'LONG_DARK') return 'quiet'
  if (entry.loreType === 'CONVERGENCE') return 'simultaneous'

  if (rule.includes('cartel push') || rule.includes('cartel_push')) return 'cartel_push'
  if (rule.includes('cartel advance') || rule.includes('cartel_advance')) return 'cartel_advance'

  if (rule.includes('lyra responds') || rule.includes('lyra_responds')) return 'lyra_responds'
  if (rule.includes('lyra daily') || rule.includes('lyra_daily')) return 'lyra_daily'
  if (ck === 'LYRA') return 'lyra_designs'

  if (rule.includes('finn streak') || rule.includes('finn_streak')) return 'finn_streak'
  if (rule.includes('finn daily') || rule.includes('finn_daily')) return 'finn_daily'
  if (ck === 'VOSS') return 'finn_reclaims'

  if (rule.includes('cast reads') || rule.includes('cast_reads')) return 'cast_reads'
  if (ck === 'CAST') return 'cast_logs'

  if (rule.includes('cielo crisis') || rule.includes('cielo_crisis')) return 'cielo_crisis'
  if (rule.includes('cielo daily') || rule.includes('cielo_daily')) return 'cielo_daily'
  if (ck === 'SABLE') return 'cielo_runs'

  if (rule.includes('echo finds') || rule.includes('echo_finds')) return 'echo_finds'
  if (ck === 'ECHO') return 'echo_scouts'

  return 'cast_logs'
}

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
  const fn = SCENES[scene] ?? SCENES.cast_logs
  const buf = img.data
  const bgR = isDark ? 9  : 238, bgG = isDark ? 9  : 236, bgB = isDark ? 8  : 228
  const fgR = isDark ? 220 : 16,  fgG = isDark ? 218 : 16,  fgB = isDark ? 210 : 14

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
