'use client'
import { useEffect, useRef, useMemo } from 'react'
import type { StoryEntry, SceneType, CharacterKey } from '@/lib/storyGenerator'
import { CHARACTERS } from '@/lib/storyGenerator'

const GW = 80, GH = 80, CELL = 5
const W = GW * CELL, H = GH * CELL

type PixelFn = (x: number, y: number, t: number, intensity: number) => number

// ── HELPERS ───────────────────────────────────────────────────────────────────
const noise = (x: number, y: number, s: number) => {
  let n = ((x * 1619 + y * 31337 + s * 6271) >>> 0)
  n = ((n ^ (n >>> 16)) * 0x45d9f3b) >>> 0
  n = ((n ^ (n >>> 16)) * 0x45d9f3b) >>> 0
  return (n ^ (n >>> 16)) / 0xffffffff
}
const dist = (x: number, y: number, cx: number, cy: number) =>
  Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
const rect = (rx: number, ry: number, px: number, py: number, w: number, h: number) =>
  px >= rx && px < rx + w && py >= ry && py < ry + h

// Pixel-art figure silhouette. feet = y of feet. Returns brightness or 0.
const figure = (cx: number, feet: number, px: number, py: number, bright = 0.88): number => {
  const head = feet - 12
  if (dist(px, py, cx, head + 2) < 2.5) return bright
  if (px === Math.round(cx) && py >= head + 4 && py <= head + 6) return bright * 0.9
  if (Math.abs(px - cx) <= 2 && py >= head + 6 && py <= head + 10) return bright * 0.85
  if (py === head + 7 && Math.abs(px - cx) <= 4) return bright * 0.7
  if (py >= head + 11 && py <= feet) {
    if (px === Math.round(cx) - 1 || px === Math.round(cx) + 1) return bright * 0.8
  }
  return 0
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENES — 20 distinct pixel art animations, pure monochrome
// ─────────────────────────────────────────────────────────────────────────────

// LYRA — building towers, architectural city
const sceneConstruction: PixelFn = (x, y, t, intensity) => {
  const I = intensity / 100, ground = 58
  if (y > ground) return y === ground + 1 ? 0.15 : 0.04
  const towers = [
    { cx: 14, w: 6, h: 28 }, { cx: 28, w: 9, h: 20 },
    { cx: 46, w: 7, h: 32 }, { cx: 64, w: 6, h: 16 },
  ]
  for (const tw of towers) {
    const top = ground - tw.h - Math.round(Math.sin(t * 0.3 + tw.cx * 0.1) * I * 2)
    if (x >= tw.cx - tw.w / 2 && x <= tw.cx + tw.w / 2 && y >= top && y <= ground) {
      if ((x - tw.cx + 2) % 3 === 0 && (y - top) % 5 === 1 && y < ground - 2) return 0.92
      if (x === Math.round(tw.cx - tw.w / 2) || x === Math.round(tw.cx + tw.w / 2)) return 0.45
      return 0.18 + (1 - (y - top) / tw.h) * 0.1
    }
  }
  const fig = figure(46, ground, x, y, 0.95)
  if (fig > 0) return fig
  if (y === 28 && x > 14 && x < 64 && x % 6 === 0) return 0.28 * I
  const grid = (x % 10 === 0 || y % 10 === 0) ? 0.04 * I : 0
  const glow = Math.exp(-(dist(x, y, 46, ground - 32) ** 2) / 120) * 0.35 * I
  return Math.min(1, grid + glow)
}

// LYRA KEYSTONE — single massive tower, full structural moment
const sceneLyraKeystone: PixelFn = (x, y, t, intensity) => {
  const I = intensity / 100, ground = 60
  if (y > ground) return 0.05
  const top = ground - 48
  // Main tower
  if (x >= 33 && x <= 47 && y >= top && y <= ground) {
    if ((x - 33) % 4 === 0 && (y - top) % 6 === 0) return 0.95
    if (x === 33 || x === 47) return 0.55
    return 0.22
  }
  // Flanking towers
  for (const twx of [16, 64]) {
    if (Math.abs(x - twx) <= 4 && y >= ground - 22 && y <= ground) {
      if (Math.abs(x - twx) === 4) return 0.38
      if ((y - (ground - 22)) % 5 === 0) return 0.75
      return 0.14
    }
  }
  // Pinnacle glow
  const pin = Math.exp(-(dist(x, y, 40, top) ** 2) / 180) * (0.65 + Math.sin(t * 2) * 0.25) * I
  // Observers
  const fig = figure(40, ground, x, y, 1.0); if (fig > 0) return fig
  for (const fx of [10, 14, 66, 70]) {
    const wf = figure(fx, ground, x, y, 0.55); if (wf > 0) return wf
  }
  return Math.min(1, pin)
}

// FINN — fractures from center, Finn at epicenter
const sceneDestruction: PixelFn = (x, y, t, intensity) => {
  const I = intensity / 100, ground = 65
  if (y > ground) return 0.06
  const cx = GW / 2, cy = GH * 0.44
  const angle = Math.atan2(y - cy, x - cx)
  const d = dist(x, y, cx, cy)
  const crackA = Math.round(angle / (Math.PI / 6)) * (Math.PI / 6)
  if (Math.abs(angle - crackA) < 0.07 && d > 3 && d < 35)
    return 0.55 + Math.sin(t * 3.5 + d * 0.3) * 0.3 * I
  const fig = figure(cx, cy, x, y, 1.0); if (fig > 0) return fig
  const fSeed = Math.floor(x / 7) * 100 + Math.floor(y / 7)
  const frag = noise(x, y, fSeed + Math.floor(t * 1.5)) > 0.82 && d > 8 ? 0.38 * I : 0
  const ringR = ((t * 14) % 38) + 6
  const ring = Math.abs(d - ringR) < 1.8 ? 0.65 * I : 0
  return Math.min(1, frag + ring)
}

// FINN LARGE — building collapsing, Finn arms raised
const sceneFinnLarge: PixelFn = (x, y, t, intensity) => {
  const I = intensity / 100, ground = 62, cx = GW / 2
  if (y > ground) return 0.06
  const blocks = [
    { bx: 18, by: 22, vx: -0.7, vy: 1.1, s: 1 }, { bx: 33, by: 16, vx: 0.4, vy: 1.4, s: 2 },
    { bx: 50, by: 24, vx: 1.0, vy: 1.0, s: 3 }, { bx: 60, by: 17, vx: -0.4, vy: 1.7, s: 4 },
  ]
  for (const bl of blocks) {
    const bx = Math.round(bl.bx + bl.vx * t * 3) % GW
    const by = Math.min(ground - 5, Math.round(bl.by + bl.vy * t * 3))
    if (rect(bx, by, x, y, 8, 5)) return x === bx || x === bx + 7 ? 0.8 : 0.5
  }
  const fig = figure(cx, ground, x, y, 1.0); if (fig > 0) return fig
  const dust = Math.exp(-(dist(x, y, cx, ground - 12) ** 2) / 350) * 0.28 * I
  if (y === ground && Math.abs(x - cx) < 22 && Math.abs(x - cx) % 3 === 0) return 0.28
  return Math.min(1, dust)
}

// FINN BURN — dissolution, Finn scattering upward
const sceneFinnBurn: PixelFn = (x, y, t, intensity) => {
  const I = intensity / 100, cx = GW / 2, cy = GH * 0.63
  const diss = Math.min(0.85, t * 0.04)
  const fig = figure(cx, cy, x, y, 1.0)
  if (fig > 0) return fig * (noise(x, y, Math.floor(t * 4)) > diss ? 1 : 0)
  for (let i = 0; i < 5; i++) {
    const sx = cx + Math.sin(i * 1.26 + t * 0.3) * 12
    if (Math.abs(x - Math.round(sx + Math.sin(y * 0.15 + t) * 3)) < 1.5 && y < cy - 4) {
      return (0.55 + Math.sin(t * 4 + y * 0.3 + i) * 0.25) * ((cy - y) / cy) * I
    }
  }
  const scatter = noise(x, y, Math.floor(t * 2)) > 0.91 ? 0.5 * I : 0
  const ring = Math.abs(dist(x, y, cx, cy) - 9 - Math.sin(t * 2) * 3) < 1.5 ? 0.38 * I : 0
  return Math.min(1, scatter + ring)
}

// CAST — lone figure watching, perspective grid, stars
const sceneVigil: PixelFn = (x, y, t, intensity) => {
  const I = intensity / 100, horizon = GH * 0.56
  if (Math.abs(y - horizon) < 0.9) return 0.3
  const fig = figure(GW / 2, Math.floor(horizon), x, y, 0.9); if (fig > 0) return fig
  if (y > horizon) {
    const d = (y - horizon) / (GH - horizon)
    const gv = Math.abs(Math.sin((x - GW / 2) / (d * 10 + 0.5))) > 0.9 ? 0.12 * (1 - d) : 0
    const gh = y % Math.max(2, Math.round(5 / (d + 0.2))) === 0 ? 0.07 * (1 - d) : 0
    return gv + gh
  }
  const castD = dist(x, y, GW / 2, Math.floor(horizon))
  const rings = Math.sin(castD * 0.5 - t * 0.9) > 0.85 ? 0.07 * I : 0
  const stars = noise(x, y, 7) > 0.975 ? 0.55 : 0
  return rings + stars
}

// CAST RETURN — Cast walking back, columns of data to the right
const sceneCastReturn: PixelFn = (x, y, t, intensity) => {
  const I = intensity / 100, ground = 62
  if (y > ground) return 0.05
  const castX = Math.round(18 + Math.min(28, t * 5))
  const fig = figure(castX, ground, x, y, 0.95); if (fig > 0) return fig
  for (let col = 48; col < 78; col += 11) {
    for (let row = 14; row < 56; row += 4) {
      if (x === col && y === row) return 0.6
      if (x >= col + 1 && x <= col + 8 && y === row) return noise(x, row, col) > 0.35 ? 0.3 : 0
    }
    if (x === col + 9) return 0.1
  }
  const presence = noise(x, y, 2) > (0.89 - I * 0.1) && y < ground - 4 ? 0.25 * I : 0
  if (y === ground) return 0.18
  return presence
}

// CIELO — tending patches, moving through the maintained zones
const sceneTending: PixelFn = (x, y, t, intensity) => {
  const I = intensity / 100, ground = 64
  if (y > ground) return 0.05
  const pX = Math.floor(x / 12), pY = Math.floor(y / 10)
  const base = noise(pX, pY, 5) > 0.4 ? 0.2 : 0.04
  if (x % 12 === 0 || y % 10 === 0) return 0.1
  const cX = 14 + (t * 4) % 52
  const fig = figure(Math.round(cX), ground, x, y, 0.88); if (fig > 0) return fig
  const tendGlow = Math.exp(-(dist(x, y, cX - 9, ground - 14) ** 2) / 55) * 0.38 * I
  return Math.min(1, base + tendGlow)
}

// CIELO QUIET — Cielo at rest, maintained structures, warmth
const sceneCieloQuiet: PixelFn = (x, y, t, intensity) => {
  const I = intensity / 100, ground = 65
  if (y > ground) return 0.04
  const items = [
    { x: 10, y: ground - 9, w: 7, h: 9 }, { x: 26, y: ground - 6, w: 5, h: 6 },
    { x: 46, y: ground - 13, w: 9, h: 13 }, { x: 62, y: ground - 7, w: 6, h: 7 },
  ]
  for (const it of items) {
    if (rect(it.x, it.y, x, y, it.w, it.h)) {
      if (x === it.x || x === it.x + it.w - 1 || y === it.y) return 0.42
      return 0.13
    }
  }
  const fig = figure(74, ground, x, y, 0.8); if (fig > 0) return fig
  const warmth = Math.sin(x * 0.08 + t * 0.2) * Math.sin(y * 0.06 + t * 0.15) * 0.5 + 0.5
  return warmth * 0.07 * I
}

// ECHO — figure emerging from edge fog
const sceneArrival: PixelFn = (x, y, t, intensity) => {
  const I = intensity / 100, ground = 58
  const fogBound = Math.min(GW * 0.55, t * 3 + 12)
  const fog = x < fogBound ? (1 - x / fogBound) * (noise(x, y, Math.floor(t * 2)) * 0.3 + 0.1) : 0
  const echoX = Math.round(Math.min(GW * 0.38, 8 + t * 1.5))
  const fig = figure(echoX, ground, x, y, 0.95)
  if (fig > 0) return fig * (1 - Math.max(0, (fogBound - echoX) / fogBound) * 0.55)
  if (y === ground) return 0.16
  const edgeSig = x > GW * 0.84 && noise(x, y, 3) > 0.93 ? 0.58 * I : 0
  if (y === ground - 1 && x < echoX + 4) return 0.09
  return Math.min(1, fog + edgeSig)
}

// ECHO DISCOVERY — Echo examines glowing artifact in the ground
const sceneEchoDiscovery: PixelFn = (x, y, t, intensity) => {
  const I = intensity / 100, ground = 62, dX = 44, dY = ground
  const fig = figure(dX - 7, ground, x, y, 0.9); if (fig > 0) return fig
  if (y >= dY - 9 && y <= dY + 1 && Math.abs(x - dX) <= 7) {
    const g = Math.exp(-(dist(x, y, dX, dY - 4) ** 2) / 22) * (0.75 + Math.sin(t * 2) * 0.2) * I
    if (rect(dX - 5, dY - 8, x, y, 10, 8)) {
      return (x - (dX - 5)) % 3 === 0 || (y - (dY - 8)) % 2 === 0 ? Math.max(0.55, g) : g * 0.5
    }
    return g
  }
  const dD = dist(x, y, dX, dY - 2)
  const radiance = Math.exp(-dD * dD / 160) * 0.42 * I * (Math.sin(t * 1.5) * 0.3 + 0.7)
  if (y > ground) return 0.06
  if (y === ground) return 0.18
  return Math.min(1, radiance)
}

// CONVERGENCE — two figures meeting, beams joining
const sceneConvergence: PixelFn = (x, y, t, intensity) => {
  const I = intensity / 100, ground = 64
  if (y > ground) return 0.05
  const sep = Math.max(6, 30 - t * 2.5)
  const f1 = figure(GW / 2 - sep, ground, x, y, 0.9)
  const f2 = figure(GW / 2 + sep, ground, x, y, 0.9)
  if (f1 > 0 || f2 > 0) return Math.max(f1, f2)
  const mid = GW / 2, bY = ground - 9
  const b1 = Math.abs(y - (bY + (x - (mid - sep)) * 0.18)) < 1.5 && x < mid ? 0.6 * I : 0
  const b2 = Math.abs(y - (bY + (mid + sep - x) * 0.18)) < 1.5 && x > mid ? 0.6 * I : 0
  const col = Math.exp(-(dist(x, y, mid, bY) ** 2) / 38) * (0.85 + Math.sin(t * 5) * 0.15) * I
  if (y === ground) return 0.2
  return Math.min(1, b1 + b2 + col)
}

// ERA SHIFT — all five figures walking through digital rain / rewrite
const sceneReckoning: PixelFn = (x, y, t, intensity) => {
  const I = intensity / 100
  const col = Math.floor(x / 4)
  const speed = (col * 7 + 3) % 5 + 2
  const dropY = ((t * speed * 5) + col * 13) % GH
  const trail = Math.max(0, 1 - Math.abs(y - dropY) / 10)
  const scanY = (t * 20) % GH
  const onScan = Math.abs(y - scanY) < 2 ? (1 - Math.abs(y - scanY) / 2) : 0
  const grid = (x % 8 === 0 || y % 8 === 0) ? 0.07 * (1 - I * 0.4) : 0
  for (const fx of [10, 22, 40, 58, 70]) {
    const fig = figure(fx, GH - 9, x, y, 0.8 + I * 0.15); if (fig > 0) return fig
  }
  return Math.min(1, trail * 0.65 * I + onScan * 0.9 + grid)
}

// QUIET — gentle wave fields, faint city on horizon
const sceneQuiet: PixelFn = (x, y, t) => {
  const w1 = Math.sin(x / GW * 10 + t * 0.3) * Math.sin(y / GH * 8 + t * 0.2) * 0.5 + 0.5
  const w2 = Math.cos(x / GW * 7 - y / GH * 9 + t * 0.15) * 0.5 + 0.5
  const hY = GH * 0.65
  if (Math.abs(y - hY) < 1) return 0.18
  if (y > hY && y < hY + 6 && noise(Math.floor(x / 3), 0, 9) > 0.5) return 0.1
  const dots = noise(x, y, 3) > 0.97 ? 0.4 : 0
  return w1 * 0.07 + w2 * 0.05 + dots + 0.02
}

// DAWN — sun rising, single new figure on horizon
const sceneDawn: PixelFn = (x, y, t, intensity) => {
  const I = intensity / 100
  const sunY = GH - 22 + Math.sin(t * 0.15) * 2
  const d = dist(x, y, GW / 2, sunY)
  const sun = d < 9 ? (1 - d / 9) * 0.95 : 0
  const glow = Math.exp(-(d ** 2) / 900) * 0.65 * I
  const angle = Math.atan2(y - sunY, x - GW / 2)
  const rayA = Math.round(angle / (Math.PI / 8)) * (Math.PI / 8)
  const ray = Math.abs(angle - rayA) < 0.06 && d > 10 && d < 45 ? 0.14 * I : 0
  const fig = figure(GW / 2 + 16, Math.round(GH * 0.45), x, y, 0.68); if (fig > 0) return fig
  if (y > GH * 0.5) return 0.06 + glow * 0.28
  return Math.min(1, sun + glow + ray)
}

// THE READING / PULSE — giant ledger, Cast's eye scanning
const sceneReading: PixelFn = (x, y, t, intensity) => {
  const I = intensity / 100
  const colW = 14
  for (let col = 5; col < GW - 5; col += colW) {
    for (let row = 10; row < GH - 8; row += 3) {
      if (x === col && y === row) return 0.72
      if (x >= col + 1 && x <= col + colW - 4 && y === row)
        return noise(x, y, row + col) > 0.35 ? 0.32 : 0
    }
    if (x === col + colW - 3) return 0.1
  }
  const eD = dist(x, y, GW / 2, 13)
  if (eD < 9) {
    const blink = Math.sin(t * 0.5) > 0.92 ? 0 : 1 - eD / 9
    return blink * 0.92
  }
  const scanY = 22 + ((t * 9) % (GH - 32))
  if (Math.abs(y - scanY) < 1) return 0.38 * I
  return 0
}

// DEPARTURE — figure dissolving, waves radiating out
const sceneDeparture: PixelFn = (x, y, t, intensity) => {
  const I = intensity / 100, cx = GW / 2, cy = GH * 0.58
  const diss = Math.min(0.9, t * 0.04)
  const fig = figure(cx, cy, x, y, 1.0)
  if (fig > 0) return fig * (noise(x, y, Math.floor(t * 3)) > diss ? 1 : 0)
  const d = dist(x, y, cx, cy)
  for (let w = 0; w < 3; w++) {
    const wR = ((t * 16 + w * 22) % 48) + 5
    if (Math.abs(d - wR) < 1.5) return (0.55 - w * 0.12) * I
  }
  const frag = noise(x, y, Math.floor(t * 1.5)) > (0.88 + diss * 0.08) ? 0.48 * I : 0
  if (y > cy) return 0.05
  return Math.min(1, frag)
}

// LONG DARK — ghost silhouettes, empty world
const sceneLongDark: PixelFn = (x, y, t) => {
  const hY = GH * 0.6
  if (Math.abs(y - hY) < 1) return 0.22
  if (y > hY) return noise(x, y, 1) > 0.9 ? 0.14 : 0.04
  const ghost = (x % 16 === 0 || y % 16 === 0) ? 0.05 : 0
  const star = noise(x, y, 5) > 0.983 ? 0.52 : 0
  for (const fx of [14, 40, 66]) {
    const gf = figure(fx, Math.floor(hY), x, y, 0.22); if (gf > 0) return gf
  }
  return ghost + star
}

// RELIC — five figures circling ancient glowing artifact
const sceneRelic: PixelFn = (x, y, t, intensity) => {
  const I = intensity / 100, rX = GW / 2, rY = GH * 0.55
  const d = dist(x, y, rX, rY)
  if (d < 8) {
    const ang = Math.atan2(y - rY, x - rX)
    const hex = Math.cos(ang * 3) * 0.5 + 0.5
    return (hex * 0.5 + 0.4) * (Math.sin(t * 1.5) * 0.2 + 0.8)
  }
  const angs = [0, 72, 144, 216, 288].map(a => a * Math.PI / 180)
  for (const angle of angs) {
    const fx = Math.round(rX + Math.cos(angle) * 22)
    const fy = Math.round(rY + Math.sin(angle) * 16)
    const fig = figure(fx, fy, x, y, 0.75); if (fig > 0) return fig
  }
  const glow = Math.exp(-d * d / 190) * 0.48 * I
  const ground = Math.round(GH * 0.72)
  if (y > ground) return 0.05
  if (y === ground) return 0.14
  return Math.min(1, glow)
}

// GHOST TOUCH — single point, faint pulse
const sceneGhostTouch: PixelFn = (x, y, t) => {
  const cx = GW / 2, cy = GH / 2
  if (x === cx && y === cy) return 0.9
  if ((x === cx + 1 || x === cx - 1) && y === cy) return 0.42
  if ((y === cy + 1 || y === cy - 1) && x === cx) return 0.42
  const d = dist(x, y, cx, cy)
  const pulse = Math.exp(-d * d / 32) * (Math.sin(t * 2) * 0.3 + 0.22)
  return Math.min(1, pulse + ((x % 20 === 0 || y % 20 === 0) ? 0.04 : 0))
}

// VIGIL BEFORE ERA — all five waiting at horizon's edge, glow building
const sceneVigilEra: PixelFn = (x, y, t, intensity) => {
  const I = intensity / 100, ground = 66
  if (y > ground) return 0.05
  for (const fx of [10, 22, 40, 58, 70]) {
    const fig = figure(fx, ground, x, y, 0.78 + I * 0.18); if (fig > 0) return fig
  }
  const hY = GH * 0.34
  const hG = Math.exp(-((y - hY) ** 2) / 90) * (0.52 + Math.sin(t * 1.5) * 0.22) * I
  if (y === Math.floor(hY)) return 0.42 + Math.sin(t * 2) * 0.1
  if (y === ground && x % 4 === 0 && x > 4 && x < 76) return 0.22
  return hG
}

// PASSING — small quiet transfer, two figures, token between them
const scenePassing: PixelFn = (x, y, t, intensity) => {
  const I = intensity / 100, ground = 65
  if (y > ground) return 0.05
  const sep = 22
  const f1 = figure(GW / 2 - sep, ground, x, y, 0.82); if (f1 > 0) return f1
  const f2 = figure(GW / 2 + sep, ground, x, y, 0.82); if (f2 > 0) return f2
  // Token traveling between them
  const tX = Math.round(GW / 2 - sep + (Math.sin(t * 0.8) * 0.5 + 0.5) * sep * 2)
  const tD = dist(x, y, tX, ground - 6)
  const token = Math.exp(-tD * tD / 8) * 0.75 * I
  // Path
  if (y === ground - 6 && Math.abs(x - GW / 2) < sep + 2) return 0.12
  if (y === ground) return 0.16
  return Math.min(1, token)
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

const SCENES: Record<string, PixelFn> = {
  construction: sceneConstruction,
  lyra_keystone: sceneLyraKeystone,
  destruction: sceneDestruction,
  finn_large: sceneFinnLarge,
  finn_burn: sceneFinnBurn,
  sacrifice: sceneFinnBurn,
  vigil: sceneVigil,
  cast_return: sceneCastReturn,
  tending: sceneTending,
  cielo_quiet: sceneCieloQuiet,
  arrival: sceneArrival,
  echo_discovery: sceneEchoDiscovery,
  convergence: sceneConvergence,
  reckoning: sceneReckoning,
  quiet: sceneQuiet,
  dawn: sceneDawn,
  reading: sceneReading,
  departure: sceneDeparture,
  long_dark: sceneLongDark,
  relic: sceneRelic,
  ghost_touch: sceneGhostTouch,
  vigil_era: sceneVigilEra,
  passing: scenePassing,
}

const SCENE_LABELS: Record<string, string> = {
  construction: 'building', lyra_keystone: 'keystone placed',
  destruction: 'breaking', finn_large: 'total reshaping', finn_burn: 'giving to Normia',
  sacrifice: 'dissolution', vigil: 'watching', cast_return: 'cast returns',
  tending: 'tending', cielo_quiet: 'keeping still',
  arrival: 'arrival', echo_discovery: 'discovery',
  convergence: 'convergence', reckoning: 'era shift',
  quiet: 'stillness', dawn: 'first light',
  reading: 'the reading', departure: 'departure',
  long_dark: 'long dark', relic: 'relic found',
  ghost_touch: 'ghost touch', vigil_era: 'vigil before the turn',
  passing: 'passing',
}

// ─────────────────────────────────────────────────────────────────────────────
// BEAT → SCENE mapping
// ─────────────────────────────────────────────────────────────────────────────

function beatToScene(entry: StoryEntry): string {
  const beat = entry.sourceEvent.ruleApplied ?? ''
  const charKey = entry.activeCharacter

  if (beat.includes('lyra large') || beat.includes('lyra_large')) return 'lyra_keystone'
  if (beat.includes('lyra')) return 'construction'
  if (beat.includes('voss burn') || beat.includes('finn burn') || beat.includes('voss_burn')) return 'finn_burn'
  if (beat.includes('voss large') || beat.includes('finn large') || beat.includes('voss_large')) return 'finn_large'
  if (beat.includes('voss') || beat.includes('finn')) return 'destruction'
  if (beat.includes('cast return') || beat.includes('cast_return')) return 'cast_return'
  if (beat.includes('cast')) return 'vigil'
  if (beat.includes('sable quiet') || beat.includes('cielo_quiet') || beat.includes('sable_quiet')) return 'cielo_quiet'
  if (beat.includes('sable') || beat.includes('cielo')) return 'tending'
  if (beat.includes('echo discovery') || beat.includes('echo_discovery')) return 'echo_discovery'
  if (beat.includes('echo')) return 'arrival'
  if (beat.includes('convergence')) return 'convergence'
  if (beat.includes('era shift') || beat.includes('era_shift')) return 'reckoning'
  if (beat.includes('long dark') || beat.includes('long_dark')) return 'long_dark'
  if (beat.includes('quiet')) return 'quiet'
  if (beat.includes('first light') || beat.includes('first_light')) return 'dawn'
  if (beat.includes('departure')) return 'departure'
  if (beat.includes('relic')) return 'relic'
  if (beat.includes('ghost')) return 'ghost_touch'
  if (beat.includes('reading') || beat.includes('pulse')) return 'reading'
  if (beat.includes('vigil')) return 'vigil_era'
  if (beat.includes('passing')) return 'passing'

  // Fallback to charKey default scene
  if (charKey === 'LYRA') return 'construction'
  if (charKey === 'VOSS') return 'destruction'
  if (charKey === 'CAST') return 'vigil'
  if (charKey === 'SABLE') return 'tending'
  if (charKey === 'ECHO') return 'arrival'
  return 'quiet'
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
  const t = tick * 0.016
  const fn = SCENES[scene] ?? SCENES.quiet
  const buf = img.data
  const bgR = isDark ? 10 : 240, bgG = isDark ? 10 : 238, bgB = isDark ? 9 : 230
  const fgR = isDark ? 218 : 18, fgG = isDark ? 218 : 18, fgB = isDark ? 208 : 16

  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      const i4 = (y * GW + x) * 4
      let v = fn(x, y, t, intensity)
      if (y % 4 === 0) v *= 0.88
      v = Math.max(0, Math.min(1, v))
      buf[i4] = Math.round(bgR + (fgR - bgR) * v)
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
}: {
  entries: StoryEntry[]
  activeEntry?: StoryEntry | null
  isDark?: boolean
  focusChar?: CharacterKey | null
}) {
  const screenRef = useRef<HTMLCanvasElement>(null)
  const smallRef = useRef<HTMLCanvasElement | null>(null)
  const smallCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const imgRef = useRef<ImageData | null>(null)
  const tickRef = useRef(0)
  const rafRef = useRef(0)
  const dark = isDark ?? false

  const { scene, intensity, charKey, charName } = useMemo(() => {
    const dynamic = entries.filter(e => e.eventType !== 'genesis')
    let entry: StoryEntry | null | undefined = activeEntry
    if (!entry && focusChar)
      entry = [...dynamic].reverse().find(e => e.activeCharacter === focusChar) ?? null
    if (!entry) entry = dynamic[dynamic.length - 1] ?? null
    if (!entry) return { scene: 'dawn', intensity: 30, charKey: null as CharacterKey | null, charName: '' }
    const sc = beatToScene(entry)
    const ck = (entry.activeCharacter ?? null) as CharacterKey | null
    const char = ck ? CHARACTERS[ck] : null
    return { scene: sc, intensity: entry.visualState?.intensity ?? 60, charKey: ck, charName: char?.name ?? '' }
  }, [entries, activeEntry, focusChar])

  useEffect(() => {
    const sc = screenRef.current; if (!sc) return
    const sCtx = sc.getContext('2d'); if (!sCtx) return
    const sm = document.createElement('canvas'); sm.width = GW; sm.height = GH
    const smCtx = sm.getContext('2d')!
    smallRef.current = sm; smallCtxRef.current = smCtx
    imgRef.current = smCtx.createImageData(GW, GH)
    const loop = () => {
      tickRef.current++
      renderFrame(sCtx, sm, smCtx, imgRef.current!, tickRef.current, scene, intensity, dark)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [scene, intensity, dark])

  const char = charKey ? CHARACTERS[charKey] : null

  return (
    <div>
      <div className="relative overflow-hidden" style={{ background: dark ? '#0a0a09' : '#f0ede4', lineHeight: 0 }}>
        <canvas
          ref={screenRef}
          width={W}
          height={H}
          style={{ display: 'block', width: '100%', aspectRatio: '1/1', imageRendering: 'pixelated' }}
        />
        <div className="scanlines" />
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
            {SCENE_LABELS[scene] ?? scene}
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
