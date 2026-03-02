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
const sceneL1: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 60
  if (y > ground) return dither(x, y, 0.05 + (y - ground) * 0.02)
  if (y === ground) return 0.16
  const towers: [number, number, number][] = [[11,7,24],[26,9,32],[47,11,40],[64,7,18]]
  for (const [tcx, tw, th] of towers) {
    const top = ground - th + Math.round(Math.sin(t * 0.35 + tcx * 0.07) * v * 2)
    const r = tower(tcx - (tw >> 1), top, tw, ground - top, x, y, 0.84)
    if (r > 0) return dither(x, y, r)
  }
  const fig = figure(47, ground, x, y, 0.95)
  if (fig > 0) return fig
  const buildTop = ground - 40
  const glow = Math.exp(-(dist(x, y, 47, buildTop) ** 2) / 22) * 0.75 * v * (Math.sin(t * 0.24) * 0.2 + 0.8)
  return dither(x, y, Math.min(1, glow + ((x % 12 === 0 || y % 12 === 0) ? 0.04 * v : 0)))
}

// L2: Lyra keystone — single massive tower, figure at apex, observers below
const sceneL2: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 62, top = 5
  if (y > ground) return 0.04
  const r = tower(30, top, 18, ground - top, x, y, 0.9)
  if (r > 0) return dither(x, y, r * (0.7 + 0.3 * (1 - (y - top) / (ground - top))))
  for (const tx of [8, 62]) {
    const fr = tower(tx, ground - 20, 8, 20, x, y, 0.68)
    if (fr > 0) return dither(x, y, fr)
  }
  const pd = dist(x, y, 39, top)
  const pin = Math.exp(-pd * pd / 55) * (0.78 + Math.sin(t * 3) * 0.2) * v
  const fig = figure(39, top + 2, x, y, 1.0)
  if (fig > 0) return fig
  for (const fx of [5, 11, 67, 73]) {
    const wf = figure(fx, ground, x, y, 0.42); if (wf > 0) return wf
  }
  const ang = Math.atan2(y - top, x - 39)
  const rayA = Math.round(ang / (Math.PI / 8)) * (Math.PI / 8)
  const beam = Math.abs(ang - rayA) < 0.055 && pd > 12 && pd < 50 ? 0.15 * v : 0
  return dither(x, y, Math.min(1, pin + beam))
}

// L3: Lyra chain — connected build nodes, pulsing data lines across map
const sceneL3: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 66
  if (y > ground) return 0.04
  const nodes: [number, number][] = [[10,50],[23,32],[40,55],[56,26],[70,44]]
  for (const [nx, ny] of nodes) {
    const d = dist(x, y, nx, ny)
    if (d < 3) return dither(x, y, 0.92 + Math.sin(t * 2.5 + nx) * 0.06)
    if (d < 5) return dither(x, y, 0.42 * v)
  }
  for (let i = 0; i < nodes.length - 1; i++) {
    const [x1, y1] = nodes[i], [x2, y2] = nodes[i + 1]
    const dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy)
    for (let s = 0; s <= len; s += 0.65) {
      const lx = Math.round(x1 + dx * s / len), ly = Math.round(y1 + dy * s / len)
      if (x === lx && y === ly) {
        const pulse = (s / len + t * 0.55) % 1
        return dither(x, y, (0.2 + Math.sin(pulse * Math.PI * 2) * 0.18) * v)
      }
    }
  }
  const fig = figure(70, ground, x, y, 0.88)
  if (fig > 0) return fig
  if (y === ground && x % 8 === 0) return 0.1
  return 0
}

// L4: Lyra sector — top-down grid, her claimed zones glowing
const sceneL4: PixelFn = (x, y, t, I) => {
  const v = I / 100, cW = 16, cH = 14
  const sX = Math.floor(x / cW), sY = Math.floor(y / cH)
  if (x % cW === 0 || y % cH === 0) return dither(x, y, 0.14 + Math.sin(t * 0.3) * 0.03)
  const owned: [number,number][] = [[1,1],[3,2],[0,3],[2,0],[4,1],[3,3]]
  if (owned.some(([a, b]) => a === sX && b === sY)) {
    return dither(x, y, (0.35 + Math.sin(sX * 3 + sY * 5 + t * 0.12) * 0.2) * v)
  }
  if (sX === 2 && sY === 2) return dither(x, y, Math.abs(Math.sin(t * 0.32)) * 0.28 * v)
  return noise(x, y, 3) > 0.97 ? 0.22 : 0.04
}

// L5: Lyra foundation — underground structure revealed beneath the surface
const sceneL5: PixelFn = (x, y, t, I) => {
  const surface = 30, v = I / 100
  if (y > surface) {
    const depth = y - surface
    if (x % 8 === 0 || (y - surface) % 6 === 0) return dither(x, y, clamp01(0.22 - depth * 0.003))
    for (const nx of [16, 32, 48, 64]) {
      if (dist(x, y, nx, surface + 10) < 4) return dither(x, y, clamp01((0.7 - depth * 0.015) * v))
    }
    return dither(x, y, clamp01(0.08 - depth * 0.001) * v)
  }
  if (y === surface) return 0.28
  const tw = tower(30, 8, 14, surface - 8, x, y, 0.75)
  if (tw > 0) return dither(x, y, tw)
  const fig = figure(54, surface, x, y, 0.92)
  if (fig > 0) return fig
  const glow = Math.exp(-(dist(x, y, 40, surface) ** 2) / 110) * 0.32 * v * (Math.sin(t * 0.13) * 0.2 + 0.8)
  return dither(x, y, Math.min(1, glow))
}

// F1: Finn clearing — 8 fracture lines radiating from impact, shockwave ring
const sceneF1: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 64, cx = 40, cy = 40
  if (y > ground) return 0.05
  const ang = Math.atan2(y - cy, x - cx)
  const d = dist(x, y, cx, cy)
  for (let i = 0; i < 8; i++) {
    const crA = (i / 8) * Math.PI * 2
    const diff = Math.abs(((ang - crA + Math.PI * 3) % (Math.PI * 2)) - Math.PI)
    if (diff < 0.04 + d * 0.003 && d > 4 && d < 36)
      return dither(x, y, (0.65 + Math.sin(t * 3 + d * 0.4) * 0.28) * v)
  }
  const fig = figure(cx, cy, x, y, 1.0)
  if (fig > 0) return fig
  const ring = ((t * 3.5) % 42) + 3
  if (Math.abs(d - ring) < 2) return dither(x, y, 0.55 * v)
  const debris = noise(x, y, Math.floor(t * 0.12) + 1) > 0.87 && d > 10 ? 0.34 * v : 0
  if (y === ground) return 0.16
  return dither(x, y, debris)
}

// F2: Finn large collapse — building mid-fall, blocks airborne, Finn at center
const sceneF2: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 64, cx = 40
  if (y > ground) return 0.05
  const blocks: [number,number,number,number][] = [
    [14,18,-1.2,0.9],[30,12,0.6,1.3],[47,22,1.4,0.7],[58,14,-0.3,1.8],[22,30,-0.8,1.1],[54,28,0.9,1.0]
  ]
  for (const [bx0, by0, vx, vy] of blocks) {
    const bx = Math.round(bx0 + vx * t * 3.5) % GW
    const by = Math.min(ground - 4, Math.round(by0 + vy * t * 3.5))
    if (rect(bx, by, x, y, 9, 6)) return (x === bx || x === bx + 8 || y === by) ? 0.82 : dither(x, y, 0.45)
  }
  const fig = figure(cx, ground, x, y, 1.0)
  if (fig > 0) return fig
  const dust = Math.exp(-(dist(x, y, cx, ground - 16) ** 2) / 420) * 0.28 * v
  if (y === ground && Math.abs(x - cx) < 28 && x % 4 !== 0) return 0.18
  return dither(x, y, dust)
}

// F3: Finn burn — figure dissolving into rising particle streams
const sceneF3: PixelFn = (x, y, t, I) => {
  const v = I / 100, cx = 40, cy = 50
  const diss = clamp01(t * 0.007)
  const fig = figure(cx, cy, x, y, 1.0)
  if (fig > 0 && noise(x, y, Math.floor(t * 0.4)) > diss) return fig
  for (let i = 0; i < 7; i++) {
    const sx = cx + Math.sin(i * 0.9 + t * 0.25) * 14 + Math.sin(i * 2.1) * 4
    if (Math.abs(x - Math.round(sx + Math.sin(y * 0.12 + t) * 2.5)) < 1.5 && y < cy - 4)
      return dither(x, y, (0.6 + Math.sin(t * 5 + y * 0.25 + i) * 0.28) * ((cy - y) / cy) * v)
  }
  const scatter = noise(x, y, Math.floor(t * 0.2)) > 0.91 ? 0.48 * v : 0
  const cd = dist(x, y, cx, cy)
  const ring = Math.abs(cd - 10 - Math.sin(t * 2.2) * 4) < 1.5 ? 0.4 * v : 0
  return dither(x, y, Math.min(1, scatter + ring))
}

// F4: Finn contested — cracking apart Lyra's zone, fractures visible
const sceneF4: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 62, cx = 40, cy = 46
  if (y > ground) return 0.04
  const towerDefs: [number,number][] = [[14,22],[30,34],[58,26],[70,16]]
  for (const [tcx, th] of towerDefs) {
    const top = ground - th
    if (Math.abs(x - tcx) <= 4 && y >= top && y <= ground) {
      const damage = clamp01(1 - dist(x, y, cx, cy) / 28)
      if (noise(x, y, Math.floor(t) + 2) > 0.85 - damage * 0.3) return dither(x, y, 0.05)
      if (x === tcx - 4 || x === tcx + 4) return clamp01(0.5 - damage * 0.3)
      if ((x - tcx + 2) % 3 === 0 && (y - top) % 5 === 1) return 0.88
      return dither(x, y, 0.17)
    }
  }
  const fig = figure(cx - 4, Math.round(cy), x, y, 0.95)
  if (fig > 0) return fig
  const d = dist(x, y, cx, cy)
  const ang = Math.atan2(y - cy, x - cx)
  const crA = Math.round(ang / (Math.PI / 5)) * (Math.PI / 5)
  if (Math.abs(ang - crA) < 0.05 && d > 3 && d < 22)
    return dither(x, y, (0.5 + Math.sin(t * 4 + d * 0.5) * 0.3) * v)
  if (y === ground) return 0.14
  return 0
}

// F5: Finn aftermath — rubble, empty space, Finn walking away
const sceneF5: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 64
  if (y > ground) return 0.04
  if (y === ground) return 0.15
  if (y === ground - 1 && noise(x, ground - 1, 7) > 0.68) return dither(x, y, 0.42)
  if (y === ground - 2 && noise(x, ground - 2, 9) > 0.82) return 0.28
  if (Math.abs(x - 24) <= 3 && y >= ground - 9) {
    if (y === ground - 9 && noise(x, y, 3) > 0.4) return 0.6
    return (x === 21 || x === 27) ? 0.38 : 0.1
  }
  const walkX = Math.round(52 + Math.min(18, t * 2.5))
  const fig = figure(walkX, ground, x, y, 0.68)
  if (fig > 0) return fig
  const dust = Math.exp(-(dist(x, y, 40, ground - 10) ** 2) / (200 + t * 30)) * 0.22 * v * clamp01(1 - t * 0.04)
  return dither(x, y, Math.min(1, dust))
}

// F6: Finn shockwave — pure radial energy rings expanding outward
const sceneF6: PixelFn = (x, y, t, I) => {
  const v = I / 100, cx = 40, cy = 40
  const d = dist(x, y, cx, cy)
  let total = 0
  for (let w = 0; w < 4; w++) {
    const r = ((t * 5 + w * 14) % 56) + 2
    total += Math.exp(-((d - r) ** 2) / 2.5) * (0.8 - w * 0.15) * v
  }
  const flash = d < 5 ? (1 - d / 5) * Math.abs(Math.sin(t * 0.6)) * v : 0
  if ((x === 40 || y === 40) && d < 18) total += 0.14 * v * (1 - d / 18)
  return dither(x, y, Math.min(1, total + flash))
}

// C1: Cast watching — cloaked at horizon, vast grid below
const sceneC1: PixelFn = (x, y, t, I) => {
  const v = I / 100, horizon = 48
  if (Math.abs(y - horizon) < 1) return 0.28 + Math.sin(x * 0.08 + t * 0.2) * 0.06
  const fig = figCast(40, horizon, x, y, 0.92)
  if (fig > 0) return fig
  if (y > horizon) return perspGrid(x, y, horizon, t, 0.6)
  const stars = noise(x, y, 11) > 0.976 ? 0.55 + Math.sin(t * 2 + x) * 0.1 : 0
  const rings = Math.sin(dist(x, y, 40, horizon) * 0.45 - t * 0.7) > 0.88 ? 0.07 * v : 0
  return dither(x, y, stars + rings)
}

// C2: Cast return — walks back in from left, data columns on right
const sceneC2: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 62
  if (y > ground) return 0.04
  if (y === ground) return 0.14
  const castX = Math.min(40, Math.round(6 + t * 0.8))
  const fig = figCast(castX, ground, x, y, 0.9)
  if (fig > 0) return fig
  for (let col = 52; col <= 76; col += 10) {
    if (x === col) {
      const row = ((y + Math.floor(t * 0.6) + col * 7) + GH * 10) % GH
      return noise(row, col, col) > 0.44 ? 0.55 : 0.1
    }
    if (x >= col + 1 && x <= col + 7 && (y + col) % 4 === 0)
      return dither(x, y, noise(x, y, col) > 0.45 ? 0.28 : 0.07)
    if (x === col + 8) return 0.1
  }
  return 0
}

// C3: Cast night watch — darkness, rotating scanner beam, stars
const sceneC3: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 62
  if (y > ground) return 0.03
  if (y === ground) return 0.13
  const fig = figCast(40, ground, x, y, 0.76)
  if (fig > 0) return fig
  const ang = t * 0.18
  for (let s = 6; s < 38; s += 0.8) {
    const bx = Math.round(40 + Math.cos(ang) * s)
    const by = Math.round(ground - 3 + Math.sin(ang) * s * 0.35)
    if (x === bx && y === by && y < ground)
      return dither(x, y, (1 - s / 38) * 0.45 * (Math.sin(t * 0.38) * 0.2 + 0.8) * v)
  }
  const hv = (x * 13 + y * 7) % 97
  if (hv < 5) return 0.18 + Math.sin(t * 1.5 + hv) * 0.12
  return 0
}

// C4: Cast panorama — elevated above all five figures, sees everything
const sceneC4: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 68
  if (y > ground) return 0.04
  if (y === ground) return 0.17
  for (const fx of [8, 22, 40, 58, 72]) {
    const wf = figure(fx, ground, x, y, 0.58); if (wf > 0) return wf
  }
  const fig = figCast(40, ground - 22, x, y, 0.88)
  if (fig > 0) return fig
  const hY = ground - 20
  if (Math.abs(y - hY) < 1) return 0.18
  if (y < hY) return Math.sin(y * 0.15 + t * 0.1) > 0.75 ? dither(x, y, 0.06 * v) : 0
  return perspGrid(x, y, hY, t, 0.4) * v
}

// C5: Cast ledger — the record as giant document, eye scanning it
const sceneC5: PixelFn = (x, y, t, I) => {
  const v = I / 100, colW = 16
  for (let col = 6; col < GW - 6; col += colW) {
    if (x === col) return dither(x, y, 0.65)
    if (x === col + colW - 2) return 0.1
    for (let row = 6; row < GH - 6; row += 4) {
      if (y === row && x >= col + 1 && x <= col + colW - 4)
        return dither(x, y, noise(x, y, row * 5 + col) > 0.35 ? 0.4 : 0.08)
    }
  }
  const eD = dist(x, y, 40, 9)
  if (eD < 8) return Math.sin(t * 0.5) > 0.93 ? 0 : (1 - eD / 8) * 0.9
  const scanY = 14 + ((t * 1.5) % (GH - 24))
  if (Math.abs(y - scanY) < 1.2) return 0.43 * v
  return 0
}

// Ci1: Cielo tending — patchwork terrain, she moves across maintaining
const sceneCi1: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 65
  if (y > ground) return 0.04
  const pBase = noise(Math.floor(x / 13), Math.floor(y / 10), 5) > 0.4 ? 0.18 : 0.05
  if (x % 13 === 0 || y % 10 === 0) return 0.1
  const cX = 12 + ((t * 3.5) % 56)
  const fig = figure(Math.round(cX), ground, x, y, 0.85)
  if (fig > 0) return fig
  const glow = Math.exp(-(dist(x, y, cX - 8, ground - 12) ** 2) / 60) * 0.4 * v
  return dither(x, y, Math.min(1, pBase + glow))
}

// Ci2: Cielo repair — patching broken wall section
const sceneCi2: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 65, wallY = ground - 12
  if (y === wallY && x >= 10 && x < 70) {
    if (x < 36) return dither(x, y, 0.75)
    const gap = x - 36
    if (gap % 6 < 3) return dither(x, y, 0.25 * (Math.sin(t * 0.16 + x) * 0.3 + 0.7))
  }
  if (y > wallY && y < wallY + 5 && x >= 10 && x < 36)
    return (x === 10 || x === 35) ? 0.48 : dither(x, y, 0.18)
  const cX = Math.round(36 + (Math.sin(t * 0.35) * 0.5 + 0.5) * 30)
  const fig = figure(cX, ground, x, y, 0.88)
  if (fig > 0) return fig
  const rg = Math.exp(-(dist(x, y, cX, wallY) ** 2) / 22) * 0.55 * v * (Math.sin(t * 0.28) * 0.28 + 0.72)
  if (y === ground) return 0.1
  if (y > ground) return 0.04
  return dither(x, y, Math.min(1, rg))
}

// Ci3: Cielo quiet — maintained structures, warmth, stillness
const sceneCi3: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 65
  if (y > ground) return 0.04
  const structs: [number,number,number,number][] = [
    [8,ground-10,8,10],[24,ground-7,6,7],[44,ground-14,10,14],[60,ground-8,7,8]
  ]
  for (const [sx, sy, sw, sh] of structs) {
    if (rect(sx, sy, x, y, sw, sh)) {
      if (x === sx || x === sx + sw - 1 || y === sy) return 0.44
      const wx = (x - sx - 1) % 3, wy = (y - sy) % 4
      if (wx === 1 && wy >= 1 && wy <= 2) return 0.72 * v
      return 0.13
    }
  }
  const fig = figure(76, ground, x, y, 0.7)
  if (fig > 0) return fig
  const warmth = (Math.sin(x * 0.07 + t * 0.18) * Math.sin(y * 0.05 + t * 0.13) * 0.5 + 0.5)
  if (y === ground) return 0.14
  return dither(x, y, warmth * 0.07 * v)
}

// Ci4: Cielo keeper — atop a hill, surveys all she holds
const sceneCi4: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 70
  const hillY = Math.round(46 + Math.sin(x * 0.07) * 7 + Math.sin(x * 0.17 + 1) * 3)
  if (y > hillY && y <= ground) return dither(x, y, 0.08 + (y - hillY) * 0.005)
  if (y === hillY) return dither(x, y, 0.22)
  if (y > ground) return 0.05
  const hillTop = Math.round(46 + Math.sin(40 * 0.07) * 7 + Math.sin(40 * 0.17 + 1) * 3)
  const fig = figure(40, hillTop, x, y, 0.88)
  if (fig > 0) return fig
  for (const bx of [14, 62]) {
    const tw = tower(bx - 3, hillY - 14, 7, 14, x, y, 0.58)
    if (tw > 0) return dither(x, y, tw)
  }
  return dither(x, y, (Math.sin(y * 0.1 + t * 0.06) * 0.5 + 0.5) * 0.06 * v)
}

// Ci5: Cielo edge — patching fraying zone margins
const sceneCi5: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 65
  if (y > ground) return 0.04
  if (x < 12) {
    const fray = noise(x, y, 6) > (0.6 + x * 0.04)
    return fray ? dither(x, y, 0.35 * (Math.sin(t * 0.16 + y * 0.3) * 0.3 + 0.7)) : 0.04
  }
  if (x > 68) {
    const fray2 = noise(x, y, 7) > (0.6 + (80 - x) * 0.04)
    return fray2 ? dither(x, y, 0.35 * (Math.sin(t * 0.16 + y * 0.3 + 1) * 0.3 + 0.7)) : 0.04
  }
  if (x % 14 === 0 || y % 11 === 0) return 0.1
  const base = noise(Math.floor(x / 14), Math.floor(y / 11), 5) > 0.4 ? 0.16 : 0.05
  const cX = Math.round(8 + Math.sin(t * 0.3) * 4)
  const fig = figure(cX, ground, x, y, 0.88)
  if (fig > 0) return fig
  if (y === ground) return 0.11
  return dither(x, y, base)
}

// E1: Echo arrival — emerging from fog at left edge
const sceneE1: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 60
  const echoX = Math.min(30, Math.round(5 + t * 0.35))
  const fogBound = echoX + 14 + Math.sin(t * 0.3) * 4
  const fog = x < fogBound ? (1 - x / fogBound) * (noise(x, y, Math.floor(t * 1.5)) * 0.35 + 0.12) : 0
  const fig = figure(echoX, ground, x, y, 0.95)
  if (fig > 0) return fig * (1 - Math.max(0, (fogBound - echoX - 6) / 16) * 0.6)
  if (y === ground) return 0.13
  const edgePing = x > 68 && noise(x, y, 4) > 0.92 ? 0.55 * v : 0
  if (y === ground - 1 && x < echoX + 6 && x % 3 === 0) return 0.1
  if (y > ground) return 0.04
  return dither(x, y, fog + edgePing)
}

// E2: Echo discovery — kneels examining glowing artifact
const sceneE2: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 64, dX = 46, dY = ground
  const fig = figure(dX - 9, ground - 3, x, y, 0.88)
  if (fig > 0) return fig
  if (y >= dY - 10 && y <= dY && Math.abs(x - dX) <= 9) {
    const g = Math.exp(-(dist(x, y, dX, dY - 5) ** 2) / 28) * (0.8 + Math.sin(t * 2.2) * 0.18) * v
    if (rect(dX - 7, dY - 9, x, y, 14, 9)) {
      return dither(x, y, (x - dX + 7) % 3 === 0 || (y - (dY - 9)) % 2 === 0 ? Math.max(0.6, g) : g * 0.5)
    }
    return dither(x, y, g)
  }
  const rad = Math.exp(-(dist(x, y, dX, dY - 4) ** 2) / 200) * 0.36 * v * (Math.sin(t * 0.12) * 0.3 + 0.7)
  if (y > ground) return 0.05
  if (y === ground) return 0.15
  return dither(x, y, rad)
}

// E3: Echo edge scan — far margin, rays fanning inward, distant beacon
const sceneE3: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 65, eX = 7
  const fig = figure(eX, ground, x, y, 0.9)
  if (fig > 0) return fig
  for (let ray = 0; ray < 5; ray++) {
    const rayAng = (ray - 2) * 0.18, rayLen = 28 + ray * 7
    for (let s = 8; s < rayLen; s += 1) {
      const rx = Math.round(eX + Math.cos(rayAng) * s)
      const ry = Math.round(ground - 5 + Math.sin(rayAng) * s)
      if (x === rx && y === ry)
        return dither(x, y, (1 - s / rayLen) * 0.55 * (Math.sin(t * 0.16 + s * 0.18) * 0.35 + 0.65) * v)
    }
  }
  const bD = dist(x, y, 66, ground - 12)
  const beacon = Math.exp(-bD * bD / 35) * 0.7 * (Math.sin(t * 0.16) * 0.25 + 0.75) * v
  if (y === ground) return x % 5 === 0 ? 0.17 : 0.08
  if (y > ground) return 0.04
  return dither(x, y, Math.min(1, beacon))
}

// E4: Echo outer zones — crossing the desolate far sector
const sceneE4: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 65
  if (y > ground) return 0.03
  if (y === ground) return dither(x, y, 0.12 + noise(x, 0, 3) * 0.06)
  if (Math.abs(x - 18) <= 5 && y >= ground - 14) {
    if (x === 13 || x === 23) return noise(y, x, 2) > 0.4 ? 0.42 : 0
    if (y === ground - 14) return noise(x, y, 4) > 0.3 ? 0.35 : 0
    return 0.08
  }
  const walkX = 28 + (t * 2.5) % 36
  const fig = figure(Math.round(walkX), ground, x, y, 0.88)
  if (fig > 0) return fig
  const pings: [number,number][] = [[72,20],[75,44],[70,58]]
  for (const [px, py] of pings) {
    const pd = dist(x, y, px, py)
    const pingVal = Math.exp(-pd * pd / 18) * 0.55 * (Math.sin(t * 0.24 + px) * 0.3 + 0.7) * v
    if (pingVal > 0.05) return dither(x, y, pingVal)
  }
  return noise(x, y, 9) > 0.984 ? 0.38 : 0
}

// E5: Echo surfacing — buried structure rising from data layer
const sceneE5: PixelFn = (x, y, t, I) => {
  const v = I / 100, surface = 38
  const rise = clamp01(t * 0.006)
  const structTop = surface + Math.round((1 - rise) * 22)
  if (x >= 28 && x <= 52 && y >= structTop && y <= surface) {
    if (x === 28 || x === 52 || y === structTop) return dither(x, y, 0.78 * rise)
    const ix = x - 28, iy = y - structTop
    if (ix % 8 === 0 || iy % 6 === 0) return dither(x, y, 0.52 * rise)
    return dither(x, y, 0.22 * rise)
  }
  const fig = figure(20, surface + 2, x, y, 0.88)
  if (fig > 0) return fig
  if (y === surface) return 0.24
  if (y > surface) return dither(x, y, 0.04 + (y - surface) * 0.003)
  return dither(x, y, Math.min(1, Math.exp(-(dist(x, y, 40, structTop) ** 2) / 180) * 0.38 * v))
}

// S1: Convergence — two figures closing, beams meeting at midpoint
const sceneS1: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 64, mid = 40
  if (y > ground) return 0.04
  const sep = Math.max(5, 34 - t * 2.8)
  const f1 = figure(Math.round(mid - sep), ground, x, y, 0.9)
  const f2 = figure(Math.round(mid + sep), ground, x, y, 0.9)
  if (f1 > 0 || f2 > 0) return Math.max(f1, f2)
  const bY = ground - 11
  const b1 = Math.abs(y - (bY + (x - (mid - sep)) * 0.22)) < 1.4 && x < mid ? 0.65 * v : 0
  const b2 = Math.abs(y - (bY + (mid + sep - x) * 0.22)) < 1.4 && x > mid ? 0.65 * v : 0
  const col = Math.exp(-(dist(x, y, mid, bY) ** 2) / 32) * (0.9 + Math.sin(t * 6) * 0.1) * v
  if (y === ground) return 0.16
  return dither(x, y, Math.min(1, b1 + b2 + col))
}

// S2: Era shift — digital rain rewrites the world, all five figures below
const sceneS2: PixelFn = (x, y, t, I) => {
  const v = I / 100
  const col = Math.floor(x / 3)
  const speed = (col * 5 + 3) % 6 + 2
  const dropY = ((t * speed * 6) + col * 17) % GH
  const trail = Math.max(0, 1 - Math.abs(y - dropY) / 12) * 0.72 * v
  const scanY = (t * 6) % GH
  const scan = Math.abs(y - scanY) < 1.5 ? (1 - Math.abs(y - scanY) / 1.5) * 0.85 : 0
  const ground = GH - 7
  for (const fx of [8, 20, 40, 60, 72]) {
    const wf = figure(fx, ground, x, y, 0.82 + v * 0.15); if (wf > 0) return wf
  }
  return dither(x, y, Math.min(1, trail + scan + ((x % 8 === 0 && y % 8 === 0) ? 0.09 * (1 - v * 0.5) : 0)))
}

// S3: Long dark — ghost silhouettes, empty world, sparse stars
const sceneS3: PixelFn = (x, y, t) => {
  const hY = 52
  if (Math.abs(y - hY) < 1) return dither(x, y, 0.18 + Math.sin(x * 0.06 + t * 0.1) * 0.04)
  if (y > hY) return noise(x, y, 1) > 0.88 ? 0.12 : 0.03
  for (const fx of [12, 38, 66]) {
    const gf = figure(fx, Math.floor(hY), x, y, 0.18); if (gf > 0) return gf
  }
  if ((x % 18 === 0 || y % 18 === 0) && y < hY - 4) return 0.04
  return noise(x, y, 5) > 0.985 ? 0.45 + Math.sin(t * 2 + x) * 0.1 : 0
}

// S4: Departure — figure dissolving into expanding waves
const sceneS4: PixelFn = (x, y, t, I) => {
  const v = I / 100, cx = 40, cy = 52
  const diss = clamp01(t * 0.008)
  const fig = figure(cx, cy, x, y, 1.0)
  if (fig > 0 && noise(x, y, Math.floor(t * 0.28)) > diss) return fig
  const d = dist(x, y, cx, cy)
  for (let w = 0; w < 3; w++) {
    const wR = ((t * 4 + w * 24) % 52) + 4
    if (Math.abs(d - wR) < 1.8) return dither(x, y, (0.6 - w * 0.14) * v)
  }
  const frag = noise(x, y, Math.floor(t * 0.15)) > (0.87 + diss * 0.09) ? 0.52 * v : 0
  if (y > cy + 8) return dither(x, y, 0.04)
  return dither(x, y, Math.min(1, frag))
}

// S5: Relic found — five figures circling ancient glowing artifact
const sceneS5: PixelFn = (x, y, t, I) => {
  const v = I / 100, rX = 40, rY = 46
  const d = dist(x, y, rX, rY)
  if (d < 9) {
    const ang = Math.atan2(y - rY, x - rX)
    return dither(x, y, (Math.cos(ang * 3) * 0.55 + 0.38) * (Math.sin(t * 0.15) * 0.22 + 0.78))
  }
  for (const angle of [0, 72, 144, 216, 288].map(a => a * Math.PI / 180)) {
    const fx = Math.round(rX + Math.cos(angle + t * 0.12) * 20)
    const fy = Math.round(rY + Math.sin(angle + t * 0.12) * 14)
    const fig = figure(fx, fy, x, y, 0.72); if (fig > 0) return fig
  }
  const ground = Math.round(GH * 0.78)
  if (y > ground) return 0.04
  if (y === ground) return 0.13
  return dither(x, y, Math.min(1, Math.exp(-d * d / 200) * 0.48 * v))
}

// S6: Dual zone event — two sectors lit simultaneously, overhead view
const sceneS6: PixelFn = (x, y, t, I) => {
  const v = I / 100, cW = 20, cH = 16
  if (x % cW === 0 || y % cH === 0) return dither(x, y, 0.13 + Math.sin(t * 0.5 + x * 0.1) * 0.04)
  const sX = Math.floor(x / cW), sY = Math.floor(y / cH)
  const cX = sX * cW + cW / 2, cY = sY * cH + cH / 2
  const d = dist(x, y, cX, cY)
  if ((sX === 1 && sY === 1) || (sX === 3 && sY === 3))
    return dither(x, y, Math.min(1, Math.exp(-d * d / 22) * (0.85 + Math.sin(t * 5) * 0.14) * v))
  return dither(x, y, Math.exp(-d * d / 30) * 0.22 * v)
}

// S7: Vigil — all five waiting at threshold, horizon glow building
const sceneS7: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 67
  if (y > ground) return 0.04
  for (const fx of [8, 20, 40, 60, 72]) {
    const fig = figure(fx, ground, x, y, 0.75 + v * 0.2); if (fig > 0) return fig
  }
  const hY = Math.round(GH * 0.32)
  const hG = Math.exp(-((y - hY) ** 2) / 110) * (0.55 + Math.sin(t * 1.8) * 0.26) * v
  if (y === hY) return 0.42 + Math.sin(t * 2.2) * 0.12
  if (y === ground && x % 5 === 0 && x > 4 && x < 76) return 0.2
  return dither(x, y, hG)
}

// S8: Quiet — wave interference, minimal city silhouette on horizon
const sceneS8: PixelFn = (x, y, t) => {
  const hY = GH * 0.68
  const skylineH = [4, 6, 4, 7, 5, 3, 8, 6, 4, 5]
  const sH = skylineH[Math.floor(x / 8) % skylineH.length]
  if (y > hY - sH && y <= hY && x % 8 >= 1 && x % 8 <= 6) return 0.08
  if (Math.abs(y - hY) < 1) return dither(x, y, 0.15 + Math.sin(x * 0.05 + t * 0.15) * 0.03)
  if (y > hY) return noise(x, y, 1) > 0.92 ? 0.1 : 0.03
  const w1 = Math.sin(x / 22 + t * 0.28) * Math.sin(y / 18 + t * 0.19) * 0.5 + 0.5
  const w2 = Math.cos(x / 16 - y / 20 + t * 0.14) * 0.5 + 0.5
  return dither(x, y, w1 * 0.06 + w2 * 0.04 + (noise(x, y, 4) > 0.975 ? 0.38 : 0) + 0.02)
}

// S9: First light — sunrise over horizon, single new figure
const sceneS9: PixelFn = (x, y, t, I) => {
  const v = I / 100, sY = GH * 0.52
  const sD = dist(x, y, 40, sY)
  const sun = sD < 10 ? (1 - sD / 10) * 0.96 : 0
  const glow = Math.exp(-sD * sD / 950) * 0.7 * v
  const ang = Math.atan2(y - sY, x - 40)
  const rayA = Math.round(ang / (Math.PI / 8)) * (Math.PI / 8)
  const ray = Math.abs(ang - rayA) < 0.05 && sD > 11 && sD < 48 ? 0.15 * v : 0
  const hY = Math.round(GH * 0.58)
  const fig = figure(42, hY, x, y, 0.62)
  if (fig > 0) return fig
  if (Math.abs(y - hY) < 1) return 0.16
  if (y > hY) return 0.05 + glow * 0.22
  return dither(x, y, Math.min(1, sun + glow + ray))
}

// S10: Reading — massive ledger, Cast eye scanning entries
const sceneS10: PixelFn = (x, y, t, I) => {
  const v = I / 100, colW = 16
  for (let col = 6; col < GW - 6; col += colW) {
    if (x === col) return dither(x, y, 0.65)
    if (x === col + colW - 2) return 0.1
    for (let row = 6; row < GH - 6; row += 4) {
      if (y === row && x >= col + 1 && x <= col + colW - 4)
        return dither(x, y, noise(x, y, row * 5 + col) > (0.35 + (row / GH) * 0.2) ? 0.42 : 0.08)
    }
  }
  const eD = dist(x, y, 40, 9)
  if (eD < 8) return Math.sin(t * 0.5) > 0.93 ? 0 : (1 - eD / 8) * 0.9
  const scanY = 14 + ((t * 1.5) % (GH - 24))
  if (Math.abs(y - scanY) < 1.2) return 0.44 * v
  return 0
}

// S11: Ghost touch — single pulsing point, minimal presence
const sceneS11: PixelFn = (x, y, t) => {
  const cx = 40, cy = 40
  if (x === cx && y === cy) return 0.92
  if ((Math.abs(x - cx) === 1 && y === cy) || (Math.abs(y - cy) === 1 && x === cx)) return 0.45
  const d = dist(x, y, cx, cy)
  return dither(x, y, Math.min(1, Math.exp(-d * d / 28) * (Math.sin(t * 0.18) * 0.28 + 0.2) + ((x % 20 === 0 || y % 20 === 0) ? 0.04 : 0)))
}

// S12: Passing — token arcing between two figures
const sceneS12: PixelFn = (x, y, t, I) => {
  const v = I / 100, ground = 66, sep = 24
  const f1 = figure(40 - sep, ground, x, y, 0.8)
  const f2 = figure(40 + sep, ground, x, y, 0.8)
  if (f1 > 0 || f2 > 0) return Math.max(f1, f2)
  const p = (Math.sin(t * 0.75) * 0.5 + 0.5)
  const tX = Math.round((40 - sep) + p * sep * 2)
  const tY = Math.round(ground - 7 - 12 * Math.sin(p * Math.PI))
  const tD = dist(x, y, tX, tY)
  if (y === ground) return 0.15
  if (y > ground) return 0.04
  return dither(x, y, Math.min(1, Math.exp(-tD * tD / 7) * 0.82 * v))
}

// S13: Pulse — sector map, all zones pulsing in rhythm
const sceneS13: PixelFn = (x, y, t, I) => {
  const v = I / 100, cW = 16, cH = 14
  const sX = Math.floor(x / cW), sY = Math.floor(y / cH)
  const cX = sX * cW + cW / 2, cY = sY * cH + cH / 2
  if (x % cW === 0 || y % cH === 0) return dither(x, y, 0.12)
  const d = dist(x, y, cX, cY)
  const phase = (sX * 2 + sY * 5) % 11
  return dither(x, y, Math.exp(-d * d / 40) * 0.6 * (Math.sin(t * 1.4 + phase * 0.58) * 0.4 + 0.6) * v)
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

const SCENES: Record<string, PixelFn> = {
  l1_build: sceneL1, l2_keystone: sceneL2, l3_chain: sceneL3,
  l4_sector: sceneL4, l5_foundation: sceneL5,
  f1_clear: sceneF1, f2_collapse: sceneF2, f3_burn: sceneF3,
  f4_contested: sceneF4, f5_aftermath: sceneF5, f6_shockwave: sceneF6,
  c1_watch: sceneC1, c2_return: sceneC2, c3_night: sceneC3,
  c4_panorama: sceneC4, c5_ledger: sceneC5,
  ci1_tend: sceneCi1, ci2_repair: sceneCi2, ci3_quiet: sceneCi3,
  ci4_keeper: sceneCi4, ci5_edge: sceneCi5,
  e1_arrive: sceneE1, e2_discover: sceneE2, e3_scan: sceneE3,
  e4_outer: sceneE4, e5_surface: sceneE5,
  s1_convergence: sceneS1, s2_era_shift: sceneS2, s3_long_dark: sceneS3,
  s4_departure: sceneS4, s5_relic: sceneS5, s6_dual_zones: sceneS6,
  s7_vigil: sceneS7, s8_quiet: sceneS8, s9_dawn: sceneS9,
  s10_reading: sceneS10, s11_ghost: sceneS11, s12_passing: sceneS12,
  s13_pulse: sceneS13,
}

const SCENE_LABELS: Record<string, string> = {
  l1_build: 'Lyra builds', l2_keystone: 'major build placed',
  l3_chain: 'build chain extended', l4_sector: 'sector marked', l5_foundation: 'foundation laid',
  f1_clear: 'Finn burns', f2_collapse: 'signal dissolved', f3_burn: 'permanent removal',
  f4_contested: 'Lyra\'s zone burned', f5_aftermath: 'the scar', f6_shockwave: 'burn shockwave',
  c1_watch: 'the Cast watches', c2_return: 'Cast returns to the chain', c3_night: 'night watch',
  c4_panorama: 'the full record', c5_ledger: 'the record',
  ci1_tend: 'Cielo tends', ci2_repair: 'edge repaired', ci3_quiet: 'holding still',
  ci4_keeper: 'zones held', ci5_edge: 'after the burn',
  e1_arrive: 'Echo arrives', e2_discover: 'discovery at the margin', e3_scan: 'outer grid scan',
  e4_outer: 'far sectors', e5_surface: 'old signal surfaces',
  s1_convergence: 'simultaneous acts', s2_era_shift: 'era shift', s3_long_dark: 'long silence',
  s4_departure: 'signal removed', s5_relic: 'buried signal found', s6_dual_zones: 'two zones, same block',
  s7_vigil: 'vigil before the turn', s8_quiet: 'stillness in the chain', s9_dawn: 'first light',
  s10_reading: 'Cast reads the grid', s11_ghost: 'minimal signal', s12_passing: 'signal passed',
  s13_pulse: 'grid checkpoint',
}

// ─────────────────────────────────────────────────────────────────────────────
// BEAT → SCENE mapping
// ─────────────────────────────────────────────────────────────────────────────

function beatToScene(entry: StoryEntry): string {
  const beat = (entry.sourceEvent?.ruleApplied ?? '').toLowerCase()
  const charKey = entry.activeCharacter
  const idH = entry.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const v2 = idH % 2, v3 = idH % 3, v4 = idH % 4

  // ── LYRA ────────────────────────────────────────────────────────────────────
  // lyra returns = the comeback, use keystone scene to signal significance
  if (beat.includes('lyra returns') || beat.includes('lyra_returns'))
    return v2 === 0 ? 'l2_keystone' : 'l4_sector'
  // lyra major = architectural moment
  if (beat.includes('lyra major') || beat.includes('lyra_major'))
    return v2 === 0 ? 'l2_keystone' : 'l3_chain'
  // lyra builds = steady work
  if (beat.includes('lyra builds') || beat.includes('lyra_builds') || beat.includes('lyra'))
    return ['l1_build', 'l3_chain', 'l5_foundation', 'l4_sector'][v4]

  // ── FINN ────────────────────────────────────────────────────────────────────
  // finn burns lyra = the central conflict — contested/cracking scene
  if (beat.includes('finn burns lyra') || beat.includes('finn_burns_lyra'))
    return v2 === 0 ? 'f4_contested' : 'f3_burn'
  // finn burns = all burns, use burn/shockwave/aftermath scenes
  if (beat.includes('finn burns') || beat.includes('finn_burns') || beat.includes('finn') || beat.includes('voss'))
    return ['f1_clear', 'f3_burn', 'f5_aftermath', 'f6_shockwave'][v4]

  // ── CAST ────────────────────────────────────────────────────────────────────
  if (beat.includes('cast returns') || beat.includes('cast_returns'))
    return v2 === 0 ? 'c2_return' : 'c4_panorama'
  if (beat.includes('cast witnesses') || beat.includes('cast_witnesses') || beat.includes('cast'))
    return ['c1_watch', 'c3_night', 'c5_ledger', 'c4_panorama'][v4]

  // ── CIELO ───────────────────────────────────────────────────────────────────
  // cielo after finn = tending burned territory
  if (beat.includes('cielo after finn') || beat.includes('cielo_after_finn'))
    return v2 === 0 ? 'ci5_edge' : 'ci3_quiet'
  if (beat.includes('cielo tends') || beat.includes('cielo_tends') || beat.includes('cielo') || beat.includes('sable'))
    return ['ci1_tend', 'ci2_repair', 'ci3_quiet', 'ci4_keeper'][v4]

  // ── ECHO ────────────────────────────────────────────────────────────────────
  if (beat.includes('echo finds') || beat.includes('echo_finds'))
    return v2 === 0 ? 'e2_discover' : 'e5_surface'
  if (beat.includes('echo arrives') || beat.includes('echo_arrives') || beat.includes('echo'))
    return ['e1_arrive', 'e3_scan', 'e4_outer', 'e5_surface'][v4]

  // ── SYSTEM BEATS ────────────────────────────────────────────────────────────
  if (beat.includes('convergence')) return v2 === 0 ? 's1_convergence' : 's6_dual_zones'
  if (beat.includes('era shift') || beat.includes('era_shift')) return 's2_era_shift'
  if (beat.includes('long dark') || beat.includes('long_dark')) return 's3_long_dark'
  if (beat.includes('vigil')) return 's7_vigil'
  if (beat.includes('checkpoint')) return v2 === 0 ? 's10_reading' : 's13_pulse'
  if (beat.includes('first light') || beat.includes('first_light')) return 's9_dawn'

  // ── FALLBACK BY CHARACTER ───────────────────────────────────────────────────
  if (charKey === 'LYRA') return ['l1_build', 'l3_chain', 'l5_foundation'][v3]
  if (charKey === 'VOSS') return ['f1_clear', 'f3_burn', 'f5_aftermath'][v3]
  if (charKey === 'CAST') return ['c1_watch', 'c3_night', 'c4_panorama'][v3]
  if (charKey === 'SABLE') return ['ci1_tend', 'ci2_repair', 'ci5_edge'][v3]
  if (charKey === 'ECHO') return ['e1_arrive', 'e3_scan', 'e4_outer'][v3]
  return v2 === 0 ? 's8_quiet' : 's11_ghost'
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
  // slow, cinematic time — ~0.4 units/sec at 24fps, no strobe
  const t = tick * 0.042
  const fn = SCENES[scene] ?? SCENES.s8_quiet
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
    if (!entry) return { scene: 's9_dawn', intensity: 30, charKey: null as CharacterKey | null, charName: '', resolvedEntry: null }
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
    const FRAME_MS = 1000 / 24 // 24fps — smooth, not stroby
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
