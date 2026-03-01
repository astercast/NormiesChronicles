'use client'
import { useEffect, useRef, useMemo } from 'react'
import type { StoryEntry } from '@/lib/storyGenerator'
import type { SceneType } from '@/lib/storyGenerator'
import { CHARACTERS } from '@/lib/storyGenerator'

// 80×80 canvas rendered at 5× = 400×400 display
const GW = 80, GH = 80, CELL = 5
const W = GW * CELL, H = GH * CELL

// ─── PIXEL ART SCENES ────────────────────────────────────────────────────────
// Each scene is a function that draws pixel art into an 80×80 grid.
// Returns brightness 0-1 per pixel, interpolated between bg and fg.

type PixelFn = (x: number, y: number, t: number, intensity: number) => number

// Shared helpers
const noise = (x: number, y: number, s: number) => {
  let n = ((x*1619 + y*31337 + s*6271) >>> 0)
  n = ((n ^ (n>>>16)) * 0x45d9f3b) >>> 0
  n = ((n ^ (n>>>16)) * 0x45d9f3b) >>> 0
  return (n ^ (n>>>16)) / 0xffffffff
}
const dist = (x: number, y: number, cx: number, cy: number) =>
  Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)

// CONSTRUCTION — Lyra building. Rising structures, grid lines, light from below.
const sceneConstruction: PixelFn = (x, y, t, intensity) => {
  const nx = x / GW, ny = y / GH
  const I = intensity / 100

  // Ground plane at 2/3 down
  const groundY = 52
  if (y > groundY) {
    const d = (y - groundY) / (GH - groundY)
    return 0.08 * (1 - d)
  }

  // Rising structures — 4 columns
  const cols = [12, 27, 48, 65]
  const heights = [30, 18, 24, 12].map(h => Math.round(h + Math.sin(t * 0.3) * 2 * I))
  for (let c = 0; c < cols.length; c++) {
    const cx = cols[c], topY = groundY - heights[c]
    const w = c % 2 === 0 ? 7 : 5
    if (x >= cx - w/2 && x <= cx + w/2 && y >= topY && y <= groundY) {
      // Window lights
      if ((x - cx) % 3 === 0 && (y - topY) % 4 === 0 && y < groundY - 3) return 0.9
      // Edge highlight
      if (x === Math.round(cx - w/2) || x === Math.round(cx + w/2)) return 0.55
      return 0.25 + (1 - (y - topY) / heights[c]) * 0.15
    }
  }

  // Floating grid lines — the architecture of the Grid itself
  const gridBright = (Math.abs(Math.sin(nx * 20 + t * 0.1)) > 0.96 ||
    Math.abs(Math.sin(ny * 20 + t * 0.08)) > 0.96) ? 0.12 * I : 0

  // Light from the keystone — top center glow
  const keystoneGlow = Math.exp(-(dist(x, y, GW/2, 15) ** 2) / 120) * 0.4 * I * Math.sin(t * 0.5 + 1) * 0.5 + 0.5

  return Math.min(1, gridBright + keystoneGlow)
}

// DESTRUCTION — Voss breaking. Fractures, dark energy, cracks radiating.
const sceneDestruction: PixelFn = (x, y, t, intensity) => {
  const I = intensity / 100
  const cx = GW / 2, cy = GH / 2

  // Radiating crack lines from center
  const angle = Math.atan2(y - cy, x - cx)
  const d = dist(x, y, cx, cy)
  const crackAngle = Math.round(angle / (Math.PI / 8)) * (Math.PI / 8)
  const angleError = Math.abs(angle - crackAngle)
  const onCrack = angleError < 0.08 && d > 4 && d < 38

  if (onCrack) {
    const flicker = Math.sin(t * 4 + d * 0.3) * 0.5 + 0.5
    return 0.6 + flicker * 0.4 * I
  }

  // Fragment field — broken pieces
  const fragSeed = Math.floor(x / 8) * 100 + Math.floor(y / 8)
  const fragBright = noise(x, y, fragSeed + Math.floor(t * 2)) > 0.85 ? 0.35 * I : 0

  // Vortex glow at center
  const centerGlow = Math.exp(-d * d / 80) * 0.5 * I

  // Scanline interference
  const scan = y % 3 === 0 ? 0.08 * I : 0

  return Math.min(1, fragBright + centerGlow + scan)
}

// SACRIFICE — burn event. Dissolution, particles scattering upward.
const sceneSacrifice: PixelFn = (x, y, t, intensity) => {
  const I = intensity / 100
  const cx = GW / 2, cy = GH * 0.65

  // Particle stream rising
  const particleX = cx + Math.sin(y * 0.3 + t) * 8
  const onStream = Math.abs(x - particleX) < 3 && y < cy
  if (onStream) {
    const fade = (cy - y) / cy
    return (0.4 + Math.sin(t * 3 + y * 0.5) * 0.3) * fade * I
  }

  // Dissolving figure at center-bottom
  const figD = dist(x, y, cx, cy)
  if (figD < 12) {
    const dissolve = noise(x, y, Math.floor(t * 3)) > (0.5 - I * 0.3) ? 0 : 1
    return dissolve * (1 - figD / 12) * 0.7
  }

  // Scattered light
  const scatter = noise(x, y, Math.floor(t * 2)) > 0.93 ? 0.5 * I : 0

  return Math.min(1, scatter)
}

// VIGIL — Cast watching. One still figure, vast space, faint horizon glow.
const sceneVigil: PixelFn = (x, y, t, intensity) => {
  const I = intensity / 100

  // Horizon line
  const horizonY = GH * 0.55
  if (Math.abs(y - horizonY) < 1) return 0.3

  // Figure — small, center, standing
  const figX = GW / 2, figTopY = horizonY - 14
  if (x >= figX - 2 && x <= figX + 2 && y >= figTopY && y <= horizonY) {
    if (y === Math.floor(figTopY) && x === figX) return 0.9 // head
    if (y > figTopY + 2 && y < horizonY - 2) return 0.7 // body
    if (y >= horizonY - 2) return 0.5 // legs
    return 0
  }

  // Faint grid ground plane below horizon
  if (y > horizonY) {
    const perspective = (y - horizonY) / (GH - horizonY)
    const gridV = Math.abs(Math.sin((x - GW/2) / (perspective * 8 + 0.1) * 0.5)) > 0.85 ? 0.12 : 0
    const gridH = y % Math.max(2, Math.round(4 / (perspective + 0.1))) === 0 ? 0.08 : 0
    return (gridV + gridH) * (1 - perspective * 0.7)
  }

  // Sky — distant grid pattern, very faint
  const starField = noise(x, y, 7) > 0.97 ? 0.4 : 0
  const gridFar = (x % 10 === 0 || y % 10 === 0) ? 0.04 * I : 0
  return starField + gridFar
}

// TENDING — Sable keeping. Small careful work, patch by patch.
const sceneTending: PixelFn = (x, y, t, intensity) => {
  const I = intensity / 100

  // Patchwork of zones — some bright (kept), some dim (neglected)
  const patchX = Math.floor(x / 10), patchY = Math.floor(y / 10)
  const patchSeed = patchX * 17 + patchY * 31
  const kept = noise(patchX, patchY, 5) > 0.45
  const base = kept ? 0.25 : 0.04

  // Active tending — a small bright cursor moving
  const tendX = 15 + ((t * 6) % 50), tendY = 15 + Math.sin(t * 0.4) * 30
  const isTending = dist(x, y, tendX, tendY) < 4
  if (isTending) return 0.75 * I * (Math.sin(t * 4) * 0.3 + 0.7)

  // Grid overlay
  const gridLine = (x % 8 === 0 || y % 8 === 0) ? 0.06 : 0

  return Math.min(1, base + gridLine)
}

// ARRIVAL — Echo appearing. Figure at edge, fog, the margin.
const sceneArrival: PixelFn = (x, y, t, intensity) => {
  const I = intensity / 100

  // Fog — denser on left, clears right
  const fogDensity = Math.max(0, 1 - x / (GW * 0.7))
  const fog = fogDensity * (noise(x, y, Math.floor(t * 1.5)) * 0.3 + 0.1)

  // Figure emerging from fog at 1/3 from left
  const figX = Math.round(GW * 0.3 + Math.sin(t * 0.2) * 2)
  const figY = Math.round(GH * 0.55)
  if (x >= figX - 3 && x <= figX + 3 && y >= figY - 14 && y <= figY) {
    const figFog = Math.max(0, 1 - (x - (figX - 10)) / 20)
    return (0.85 - figFog * 0.5) * (1 - dist(x, y, figX, figY - 7) / 12)
  }

  // Ground line
  if (y === Math.floor(GH * 0.56)) return 0.2

  // Distant signals — dots of light at the far margin
  const marginSignal = x > GW * 0.8 && noise(x, y, 3) > 0.94 ? 0.6 * I : 0

  return Math.min(1, fog + marginSignal)
}

// CONVERGENCE — two presences meeting. Mirror symmetry, central flash.
const sceneConvergence: PixelFn = (x, y, t, intensity) => {
  const I = intensity / 100
  const cx = GW / 2, cy = GH / 2

  // Two approaching beams from left and right
  const beam1 = Math.exp(-((y - (cy + Math.sin(x / 6) * 8)) * (y - (cy + Math.sin(x / 6) * 8))) / 8) * (x < cx ? 1 : 0) * 0.6
  const beam2 = Math.exp(-((y - (cy + Math.sin((GW - x) / 6) * 8)) * (y - (cy + Math.sin((GW - x) / 6) * 8))) / 8) * (x > cx ? 1 : 0) * 0.6

  // Central collision glow
  const collide = Math.exp(-(dist(x, y, cx, cy) ** 2) / 60) * (Math.sin(t * 6) * 0.4 + 0.6) * I

  // Grid shimmer at intersection
  const shimmer = dist(x, y, cx, cy) < 20 && (x + y) % 2 === 0 ? 0.1 : 0

  return Math.min(1, beam1 + beam2 + collide + shimmer)
}

// RECKONING — era shift. The world rewriting itself.
const sceneReckoning: PixelFn = (x, y, t, intensity) => {
  const I = intensity / 100
  const nx = x / GW, ny = y / GH

  // Digital rain effect — columns of falling code
  const col = Math.floor(x / 4)
  const speed = (col * 7 + 3) % 5 + 1
  const dropY = ((Math.floor(t * speed) + col * 13) % GH)
  const onDrop = Math.abs(y - dropY) < 8
  const trailFade = onDrop ? Math.max(0, 1 - Math.abs(y - dropY) / 8) : 0

  // Horizontal scan across the world — the rewrite
  const scanY = (t * 15) % GH
  const onScan = Math.abs(y - scanY) < 2 ? (1 - Math.abs(y - scanY) / 2) : 0

  // Background grid dissolving
  const grid = ((x % 6 === 0) || (y % 6 === 0)) ? 0.08 * (1 - I * 0.5) : 0

  return Math.min(1, trailFade * 0.7 * I + onScan * 0.9 + grid)
}

// QUIET — stillness. Empty landscape, faint breathing.
const sceneQuiet: PixelFn = (x, y, t, _intensity) => {
  // Gentle interference waves, very dim
  const nx = x / GW, ny = y / GH
  const w1 = Math.sin(nx * 8 + t * 0.3) * Math.sin(ny * 6 + t * 0.2) * 0.5 + 0.5
  const w2 = Math.cos(nx * 5 - ny * 7 + t * 0.15) * 0.5 + 0.5
  const dots = noise(x, y, 3) > 0.97 ? 0.4 : 0
  return w1 * 0.08 + w2 * 0.06 + dots + 0.02
}

// DAWN — first light / opening.
const sceneDawn: PixelFn = (x, y, t, intensity) => {
  const I = intensity / 100
  // Sun rising from bottom center
  const sunY = GH - 20 + Math.sin(t * 0.1) * 3
  const sunR = 10
  const d = dist(x, y, GW / 2, sunY)
  const sun = d < sunR ? (1 - d / sunR) * 0.9 : 0
  const glow = Math.exp(-((d ** 2)) / 800) * 0.5 * I
  // Grid lines fading in from glow
  const grid = (x % 8 === 0 || y % 8 === 0) ? 0.05 * I * Math.max(0, 1 - d / 50) : 0
  return Math.min(1, sun + glow + grid)
}

const SCENES: Record<SceneType, PixelFn> = {
  construction: sceneConstruction,
  destruction: sceneDestruction,
  sacrifice: sceneSacrifice,
  vigil: sceneVigil,
  tending: sceneTending,
  arrival: sceneArrival,
  convergence: sceneConvergence,
  reckoning: sceneReckoning,
  quiet: sceneQuiet,
  dawn: sceneDawn,
}

// ─── RENDERER ─────────────────────────────────────────────────────────────────

function renderFrame(
  screenCtx: CanvasRenderingContext2D,
  small: HTMLCanvasElement,
  smallCtx: CanvasRenderingContext2D,
  img: ImageData,
  tick: number,
  scene: SceneType,
  intensity: number,
  isDark: boolean,
) {
  const t = tick * 0.016
  const fn = SCENES[scene] ?? SCENES.quiet
  const buf = img.data

  const bgR = isDark ? 8  : 240, bgG = isDark ? 8  : 238, bgB = isDark ? 7  : 230
  const fgR = isDark ? 220: 20,  fgG = isDark ? 220: 20,  fgB = isDark ? 210: 18

  // Accent color per scene
  let acR = fgR, acG = fgG, acB = fgB
  if (scene === 'construction') { acR = isDark ? 180 : 40; acG = isDark ? 220 : 100; acB = isDark ? 255 : 200 }
  if (scene === 'destruction')  { acR = isDark ? 255 : 180; acG = isDark ? 80  : 20; acB = isDark ? 60  : 10  }
  if (scene === 'sacrifice')    { acR = isDark ? 180 : 60;  acG = isDark ? 100 : 20; acB = isDark ? 255 : 180 }
  if (scene === 'arrival')      { acR = isDark ? 100 : 20;  acG = isDark ? 220 : 80; acB = isDark ? 180 : 60  }
  if (scene === 'reckoning')    { acR = isDark ? 80  : 20;  acG = isDark ? 220 : 100; acB = isDark ? 80 : 20  }

  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      const i4 = (y * GW + x) * 4
      let v = fn(x, y, t, intensity)
      // Scanline dimming
      if (y % 4 === 0) v *= 0.88
      v = Math.max(0, Math.min(1, v))

      buf[i4]   = Math.round(bgR + (acR - bgR) * v)
      buf[i4+1] = Math.round(bgG + (acG - bgG) * v)
      buf[i4+2] = Math.round(bgB + (acB - bgB) * v)
      buf[i4+3] = 255
    }
  }

  smallCtx.putImageData(img, 0, 0)
  screenCtx.imageSmoothingEnabled = false
  screenCtx.drawImage(small, 0, 0, W, H)
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export function WarGrid({ entries, activeEntry, isDark }: {
  entries: StoryEntry[]
  activeEntry?: StoryEntry | null
  isDark?: boolean
}) {
  const screenRef = useRef<HTMLCanvasElement>(null)
  const smallRef = useRef<HTMLCanvasElement | null>(null)
  const smallCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const imgRef = useRef<ImageData | null>(null)
  const tickRef = useRef(0)
  const rafRef = useRef(0)
  const dark = isDark ?? false

  // Derive scene from the active or latest entry
  const { scene, intensity, charKey, charName } = useMemo(() => {
    const entry = activeEntry ?? entries.filter(e => e.eventType !== 'genesis').slice(-1)[0]
    if (!entry?.visualState) return { scene: 'dawn' as SceneType, intensity: 30, charKey: 'CAST', charName: '' }
    return {
      scene: (entry.visualState as any).scene as SceneType ?? 'quiet',
      intensity: entry.visualState.intensity,
      charKey: (entry.visualState as any).charKey ?? 'CAST',
      charName: entry.visualState.signalName,
    }
  }, [entries, activeEntry])

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

  const SCENE_LABELS: Record<SceneType, string> = {
    construction: 'construction', destruction: 'breaking',
    sacrifice: 'dissolution', vigil: 'watching',
    tending: 'tending', arrival: 'arrival',
    convergence: 'convergence', reckoning: 'era shift',
    quiet: 'stillness', dawn: 'first light',
  }

  const char = charKey ? CHARACTERS[charKey as keyof typeof CHARACTERS] : null

  return (
    <div>
      <div className="relative overflow-hidden" style={{ background: dark ? '#080807' : '#f0ede4', lineHeight: 0 }}>
        <canvas ref={screenRef} width={W} height={H}
          style={{ display: 'block', width: '100%', aspectRatio: '1/1', imageRendering: 'pixelated' }} />
        <div className="scanlines" />
      </div>

      <div style={{
        borderTop: `1px solid ${dark ? '#1e1e1c' : '#c4c3bb'}`,
        background: dark ? '#0c0c0a' : '#e8e5dc',
        padding: '0.5rem 0.85rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.38rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: dark ? '#383830' : '#9a9990', marginBottom: '0.18rem' }}>
            scene
          </div>
          <div style={{ fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: dark ? '#b0b0a8' : '#181815', fontWeight: 700, lineHeight: 1 }}>
            {charName && <span style={{ fontWeight: 400, color: dark ? '#484840' : '#7a7970', marginRight: '0.4rem' }}>{charName} ·</span>}
            {SCENE_LABELS[scene] ?? 'active'}
          </div>
        </div>
        {char && (
          <div style={{ fontSize: '0.38rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: dark ? '#484840' : '#9a9990', textAlign: 'right' }}>
            {char.title}
          </div>
        )}
      </div>
    </div>
  )
}
