'use client'
import { useEffect, useRef, useMemo, useState } from 'react'
import type { StoryEntry } from '@/lib/storyGenerator'

// ── constants ──────────────────────────────────────────────────────────────
const GW = 80
const GH = 80
const CELL = 5

// 12 factions → distinct gray shades
const FACTION_SHADE: Record<string, number> = {
  'the Wardens':      230,
  'the Hollow Pact':   45,
  'the Drifters':     155,
  'the Ember Guard':  255,
  'the Old Compact':   95,
  'the Pale Sons':    200,
  'the Breach-Born':   30,
  'the Deep Keepers': 130,
  'the Ridge Watch':  175,
  'the Far Shore':     80,
  'the Unnamed':      245,
  'the First Circle': 115,
}

// 20 regions → [x, y, w, h] in grid cells
const REGION_RECT: Record<string, [number,number,number,number]> = {
  'the Breach':        [ 0,  0, 16, 16],
  'the Pale Shore':    [16,  0, 16, 16],
  'the Hollow':        [32,  0, 16, 16],
  'the Far Fields':    [48,  0, 16, 16],
  'the Black Margin':  [64,  0, 16, 16],
  'the Cradle':        [ 0, 16, 16, 16],
  'the Dust Road':     [16, 16, 16, 16],
  'the Outer Ring':    [32, 16, 16, 16],
  'the Deep Well':     [48, 16, 16, 16],
  'the Shatter Line':  [64, 16, 16, 16],
  'the Twin Peaks':    [ 0, 32, 16, 16],
  'the Old Border':    [16, 32, 16, 16],
  'the Narrow Gate':   [32, 32, 16, 16],
  'the Salt Flats':    [48, 32, 16, 16],
  'the Grey Basin':    [64, 32, 16, 16],
  'the High Ground':   [ 0, 48, 16, 32],
  'the Ember Fields':  [16, 48, 16, 32],
  'the Still Water':   [32, 48, 16, 32],
  'the Last Ridge':    [48, 48, 16, 32],
  'the Open Grid':     [64, 48, 16, 32],
}

const REGION_NAMES = Object.keys(REGION_RECT)
const FACTION_NAMES = Object.keys(FACTION_SHADE)

// Coverage by lore type — how much of a region gets painted
function coverage(loreType: string): number {
  const map: Record<string,number> = {
    GREAT_BATTLE: 0.94, HOLLOW_GROUND: 0.90, DOMINION_GROWS: 0.82,
    FORMAL_DECLARATION: 0.76, SKIRMISH: 0.48, WAR_COUNCIL: 0.42,
    SHIFTED_PLAN: 0.36, VETERAN_RETURNS: 0.30, RETURNED_GHOST: 0.26,
    CROSSING: 0.20, BORDER_RAID: 0.09, GHOST_MARK: 0.03,
    GREAT_SACRIFICE: 0.16, BLOOD_OATH: 0.20, THE_ORACLE: 0.12,
    ANCIENT_WAKES: 0.14, NEW_BLOOD: 0.07, OFFERING: 0.10,
    CARTOGRAPHY: 0.25, DYNASTY: 0.35,
  }
  return map[loreType] ?? 0.15
}

function seeded(n: number, salt = 0): number {
  return (((n * 1664525 + salt * 1013904223) >>> 0) / 4294967295)
}

function findRegion(text: string): string | null {
  for (const r of REGION_NAMES) if (text.includes(r)) return r
  return null
}
function findFaction(text: string): string | null {
  for (const f of FACTION_NAMES) if (text.includes(f)) return f
  return null
}

// ── grid cell ─────────────────────────────────────────────────────────────
interface Cell {
  shade: number   // 0-255
  alpha: number   // 0-1 current
  tAlpha: number  // target alpha
  contested: boolean
  regionIdx: number
}

function makeGrid(): Cell[] {
  return Array.from({ length: GW * GH }, (_, i) => {
    // determine which region this pixel belongs to (for bg tint)
    const x = i % GW, y = Math.floor(i / GW)
    let rIdx = -1
    for (let r = 0; r < REGION_NAMES.length; r++) {
      const [rx, ry, rw, rh] = REGION_RECT[REGION_NAMES[r]]
      if (x >= rx && x < rx+rw && y >= ry && y < ry+rh) { rIdx = r; break }
    }
    return { shade: 128, alpha: 0, tAlpha: 0, contested: false, regionIdx: rIdx }
  })
}

function buildGrid(entries: StoryEntry[]): Cell[] {
  const grid = makeGrid()
  const owner: Record<string, string> = {}

  for (const e of entries) {
    if (e.eventType === 'genesis') continue
    const text = e.headline + ' ' + e.body
    const region = findRegion(text)
    const faction = findFaction(text)
    if (!region || !faction) continue

    const [rx, ry, rw, rh] = REGION_RECT[region]
    const shade = FACTION_SHADE[faction] ?? 128
    const prev = owner[region]
    const contested = !!(prev && prev !== faction)
    owner[region] = faction

    const cov = coverage(e.loreType)
    const tok = parseInt(e.sourceEvent.tokenId) || 0

    for (let dy = 0; dy < rh; dy++) {
      for (let dx = 0; dx < rw; dx++) {
        const px = rx + dx, py = ry + dy
        const idx = py * GW + px
        const r = seeded(px * 97 + py + tok * 13, tok)
        if (r < cov) {
          const cell = grid[idx]
          cell.shade = shade
          cell.tAlpha = 0.5 + seeded(idx, tok) * 0.5
          cell.contested = contested
        }
      }
    }
  }
  return grid
}

// ── canvas renderer ────────────────────────────────────────────────────────
function render(
  ctx: CanvasRenderingContext2D,
  grid: Cell[],
  scan: number,
  glitch: Set<number>,
  tick: number,
  highlightRegion: string | null,
  isDark: boolean,
) {
  const bg = isDark ? 10 : 240
  ctx.fillStyle = isDark ? '#0a0a08' : '#f0efe9'
  ctx.fillRect(0, 0, GW * CELL, GH * CELL)

  const hlRect = highlightRegion ? REGION_RECT[highlightRegion] : null

  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      const idx = y * GW + x
      const cell = grid[idx]

      // Lerp toward target
      const da = cell.tAlpha - cell.alpha
      if (Math.abs(da) > 0.002) cell.alpha += da * 0.06
      else cell.alpha = cell.tAlpha

      // Highlight region effect
      const inHL = hlRect && x >= hlRect[0] && x < hlRect[0]+hlRect[2] && y >= hlRect[1] && y < hlRect[1]+hlRect[3]

      if (cell.alpha < 0.02) {
        // Empty — faint grid dot
        if ((x % 4 === 0 && y % 4 === 0)) {
          const dotA = inHL ? 0.25 : (isDark ? 0.08 : 0.12)
          ctx.fillStyle = isDark ? `rgba(255,255,255,${dotA})` : `rgba(0,0,0,${dotA})`
          ctx.fillRect(x * CELL + 2, y * CELL + 2, 1, 1)
        }
        continue
      }

      // Glitch pixel
      if (glitch.has(idx)) {
        const gv = isDark ? 255 : 0
        ctx.fillStyle = `rgba(${gv},${gv},${gv},${Math.random() * 0.9 + 0.1})`
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL)
        continue
      }

      let alpha = cell.alpha
      const s = cell.shade

      // Dim non-highlighted when something is highlighted
      if (hlRect && !inHL) alpha *= 0.25

      // Scanline boost
      const scanDist = Math.abs(y - scan)
      if (scanDist < 2) alpha = Math.min(1, alpha + 0.12 * (1 - scanDist / 2))

      // Contested flicker
      if (cell.contested && tick % 50 < 6) alpha *= 0.3

      ctx.fillStyle = `rgba(${s},${s},${s},${alpha})`
      ctx.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1)

      // Contested highlight edge
      if (cell.contested && inHL) {
        ctx.strokeStyle = `rgba(255,255,255,0.2)`
        ctx.lineWidth = 0.5
        ctx.strokeRect(x * CELL + 0.25, y * CELL + 0.25, CELL - 1.5, CELL - 1.5)
      }
    }
  }

  // Region grid lines
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'
  ctx.lineWidth = 0.5
  for (const [rx, ry, rw, rh] of Object.values(REGION_RECT)) {
    ctx.strokeRect(rx * CELL + 0.5, ry * CELL + 0.5, rw * CELL - 1, rh * CELL - 1)
  }

  // Highlight region border
  if (hlRect) {
    const [rx, ry, rw, rh] = hlRect
    const pulse = 0.4 + 0.4 * Math.sin(tick * 0.12)
    ctx.strokeStyle = `rgba(255,255,255,${pulse})`
    ctx.lineWidth = 1
    ctx.strokeRect(rx * CELL + 0.5, ry * CELL + 0.5, rw * CELL - 1, rh * CELL - 1)
  }

  // Scanline
  const scanY = Math.floor(scan) * CELL
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.02)'
  ctx.fillRect(0, scanY, GW * CELL, CELL)
}

// ── component ──────────────────────────────────────────────────────────────
export function WarGrid({ entries, activeEntry, isDark }: {
  entries: StoryEntry[]
  activeEntry?: StoryEntry | null
  isDark?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gridRef = useRef<Cell[]>(makeGrid())
  const scanRef = useRef(0)
  const tickRef = useRef(0)
  const glitchRef = useRef<Set<number>>(new Set())
  const glitchFrames = useRef(0)
  const rafRef = useRef(0)

  // Compute target grid from entries
  const targetGrid = useMemo(() => {
    if (!entries.length) return makeGrid()
    return buildGrid(entries.filter(e => e.eventType !== 'genesis'))
  }, [entries])

  // Sync target alphas into gridRef (positions/shades update immediately, alphas lerp in render)
  useEffect(() => {
    const tgt = targetGrid
    const cur = gridRef.current
    for (let i = 0; i < cur.length; i++) {
      if (Math.abs(tgt[i].tAlpha - cur[i].tAlpha) > 0.05) {
        cur[i].tAlpha = tgt[i].tAlpha
        cur[i].shade = tgt[i].shade
        cur[i].contested = tgt[i].contested
      }
    }
    // Glitch changed cells briefly
    const changed = new Set<number>()
    for (let i = 0; i < cur.length; i++) {
      if (Math.abs(tgt[i].tAlpha - cur[i].alpha) > 0.4 && Math.random() < 0.3) changed.add(i)
    }
    if (changed.size > 0) { glitchRef.current = changed; glitchFrames.current = 6 }
  }, [targetGrid])

  // Active entry → region highlight + glitch burst
  const activeText = activeEntry ? activeEntry.headline + ' ' + activeEntry.body : ''
  const activeRegion = activeEntry ? findRegion(activeText) : null

  useEffect(() => {
    if (!activeRegion) return
    const [rx, ry, rw, rh] = REGION_RECT[activeRegion]
    const burst = new Set<number>()
    for (let y = ry; y < ry+rh; y++)
      for (let x = rx; x < rx+rw; x++)
        if (Math.random() < 0.45) burst.add(y * GW + x)
    glitchRef.current = burst
    glitchFrames.current = 14
  }, [activeRegion, activeEntry])

  // Dark mode from prop
  const dark = isDark ?? false

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const loop = () => {
      tickRef.current++
      scanRef.current = (scanRef.current + 0.25) % GH
      if (glitchFrames.current > 0) {
        glitchFrames.current--
        if (glitchFrames.current === 0) glitchRef.current = new Set()
      }
      render(ctx, gridRef.current, scanRef.current, glitchRef.current, tickRef.current, activeRegion, dark)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [activeRegion, dark])

  // Faction stats
  const factionCounts = useMemo(() => {
    const c: Record<string,number> = {}
    for (const e of entries) {
      if (e.eventType === 'genesis') continue
      const f = findFaction(e.headline + ' ' + e.body)
      if (f) c[f] = (c[f] ?? 0) + 1
    }
    return Object.entries(c).sort((a,b) => b[1]-a[1]).slice(0,6)
  }, [entries])

  const activeFaction = activeEntry ? findFaction(activeText) : null

  return (
    <div>
      {/* Canvas wrapper */}
      <div className="relative" style={{ background: dark ? '#0a0a08' : '#f0efe9' }}>
        <canvas
          ref={canvasRef}
          width={GW * CELL}
          height={GH * CELL}
          className="war-grid-canvas"
        />
        {/* Scanlines overlay */}
        <div className="scanlines" />

        {/* Region label on active zone */}
        {activeRegion && (() => {
          const [rx, ry, rw, rh] = REGION_RECT[activeRegion]
          const px = ((rx + rw/2) / GW * 100)
          const py = ((ry + rh/2) / GH * 100)
          return (
            <div className="absolute pointer-events-none fade-in" style={{ left:`${px}%`, top:`${py}%`, transform:'translate(-50%,-50%)', zIndex:10 }}>
              <div style={{
                fontFamily:'Space Mono,monospace',
                fontSize:'0.42rem',
                letterSpacing:'0.18em',
                textTransform:'uppercase',
                background: dark ? 'rgba(0,0,0,0.9)' : 'rgba(240,239,233,0.92)',
                color: dark ? 'rgba(255,255,255,0.9)' : 'rgba(26,26,23,0.9)',
                border: `1px solid ${dark ? 'rgba(255,255,255,0.3)' : 'rgba(26,26,23,0.25)'}`,
                padding:'0.2rem 0.5rem',
                whiteSpace:'nowrap',
              }}>
                {activeRegion}
              </div>
            </div>
          )
        })()}
      </div>

      {/* Legend bar */}
      <div style={{ borderTop: `1px solid ${dark ? '#252520' : '#c8c7be'}`, background: dark ? '#0e0e0c' : '#f0efe9', padding:'0.5rem 0.75rem' }}>
        <div className="flex items-center justify-between gap-4">
          {/* Active zone info */}
          <div style={{ minWidth: 0, flex: 1 }}>
            {activeEntry ? (
              <div className="fade-in">
                <div style={{ fontSize:'0.45rem', letterSpacing:'0.18em', textTransform:'uppercase', color: dark ? '#545450' : '#7a7970', marginBottom:'0.2rem' }}>
                  active zone
                </div>
                <div style={{ fontSize:'0.52rem', letterSpacing:'0.12em', textTransform:'uppercase', color: dark ? '#d8d8cc' : '#1a1a17', fontWeight:700 }}>
                  {activeRegion ?? '—'}
                  {activeFaction ? <span style={{ fontWeight:400, color: dark ? '#545450' : '#7a7970' }}> · {activeFaction}</span> : ''}
                </div>
              </div>
            ) : (
              <div style={{ fontSize:'0.45rem', letterSpacing:'0.15em', textTransform:'uppercase', color: dark ? '#3a3a34' : '#b0afa6' }}>
                tap entry to highlight zone
              </div>
            )}
          </div>

          {/* Faction legend */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
            {factionCounts.map(([name, count]) => {
              const s = FACTION_SHADE[name] ?? 128
              return (
                <div key={name} className="flex items-center gap-1">
                  <div style={{ width:5, height:5, background:`rgb(${s},${s},${s})`, flexShrink:0 }} />
                  <span style={{ fontSize:'0.42rem', letterSpacing:'0.1em', textTransform:'uppercase', color: dark ? '#545450' : '#7a7970' }}>
                    {name.replace('the ','')} ·{count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
