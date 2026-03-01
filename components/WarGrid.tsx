'use client'
import { useEffect, useRef, useMemo } from 'react'
import type { StoryEntry } from '@/lib/storyGenerator'

// 80×80 pixel canvas rendered at 5× — displayed as 400×400
const GW = 80, GH = 80, CELL = 5
const W = GW * CELL, H = GH * CELL

type Mood = 'surge'|'quiet'|'departure'|'discovery'|'wonder'|'chaos'|'normal'

interface VS {
  mood: Mood
  intensity: number     // 0-100
  eraIndex: number      // 0-7
  departureWeight: number
  dominance: number
  signalName: string
  entryCount: number
}

function deriveVS(entries: StoryEntry[]): VS {
  const dyn = entries.filter(e => e.eventType !== 'genesis')
  if (!dyn.length) return { mood:'normal', intensity:12, eraIndex:0, departureWeight:0, dominance:0, signalName:'', entryCount:0 }
  const last = dyn[dyn.length-1]
  const mood = (last.visualState?.mood as Mood) ?? 'normal'
  const intensity = last.visualState?.intensity ?? 35
  const signalName = last.visualState?.signalName ?? ''
  const ERA_NAMES = ['The First Days','The Awakening','The Gathering','Age of Claims','The Deepening','Age of Permanence','The Long Memory','The Reckoning']
  const eraIndex = Math.max(0, ERA_NAMES.indexOf(last.era ?? ''))
  const deps = dyn.filter(e => e.loreType==='DEPARTURE'||e.loreType==='TWICE_GIVEN').length
  const departureWeight = Math.min(1, deps / Math.max(1, dyn.length) * 6)
  const surges = dyn.slice(-15).filter(e => e.loreType==='SIGNAL_SURGE').length
  return { mood, intensity, eraIndex, departureWeight, dominance: Math.min(1, surges/4), signalName, entryCount: dyn.length }
}

// Deterministic noise
function h2(x: number, y: number, s: number): number {
  let n = ((x*1619 + y*31337 + s*6271) >>> 0)
  n = ((n ^ (n>>>16)) * 0x45d9f3b) >>> 0
  n = ((n ^ (n>>>16)) * 0x45d9f3b) >>> 0
  return (n ^ (n>>>16)) / 0xffffffff
}

// ─── FIELD FUNCTIONS ───────────────────────────────────────────────────────
// Each returns a 0-1 brightness value per pixel per frame.
// These are the visual identity of each story state.

type Field = (x:number, y:number, t:number, vs:VS) => number

// SURGE — radial power burst with geometric spokes. Energy radiating outward.
const fSurge: Field = (x,y,t,vs) => {
  const cx=x/GW-0.5, cy=y/GH-0.5
  const d=Math.sqrt(cx*cx+cy*cy), ang=Math.atan2(cy,cx)
  const I=vs.intensity/100
  const rings = Math.pow(Math.max(0,Math.sin(d*26-t*5)),1.5)*0.7
  const spokes = Math.pow(Math.max(0,Math.sin(ang*8+t*1.5)),3)*0.5
  const glow = Math.pow(Math.max(0,1-d*2.4),2.5)*0.9
  const grid = (Math.abs(Math.sin((x/5)*Math.PI))>0.88||Math.abs(Math.sin((y/5)*Math.PI))>0.88) ? 0.15*I : 0
  return Math.min(1, Math.pow(rings*0.35+spokes*0.3+glow*0.35+grid, 0.85) * (0.5+I*0.5))
}

// QUIET — two gentle interference fields, sparse bright dots like stars
const fQuiet: Field = (x,y,t,_vs) => {
  const nx=x/GW, ny=y/GH
  const w1 = Math.sin(nx*13+t*0.5)*Math.sin(ny*9+t*0.35)*0.5+0.5
  const w2 = Math.sin(nx*6.5-ny*8.5+t*0.25)*0.5+0.5
  const dots = h2(x,y,3)>0.97 ? 0.75 : 0
  return w1*0.12+w2*0.1+dots+0.03
}

// DEPARTURE — spiral vortex, energy unwinding and dispersing outward
const fDeparture: Field = (x,y,t,vs) => {
  const cx=x/GW-0.5, cy=y/GH-0.5
  const d=Math.sqrt(cx*cx+cy*cy), ang=Math.atan2(cy,cx)
  const spiral = Math.abs(Math.sin(ang*3-d*18+t*2))*0.6
  const envelope = Math.sin(d*Math.PI*1.7)*0.8
  const frag = h2(x,y,Math.floor(t*2))>(1-vs.departureWeight*0.35) ? 0.45 : 0
  const ring = Math.abs(d-0.3)<0.035 ? 0.65 : 0
  return Math.max(0,Math.min(1, spiral*envelope*0.5+ring*0.3+frag*0.2))
}

// DISCOVERY — hexagonal crystal lattice, expanding rings from center
const fDiscovery: Field = (x,y,t,_vs) => {
  const nx=x/GW, ny=y/GH
  const hx=nx*11, hy=ny*11, row=Math.floor(hy), off=row%2===0?0:0.5
  const dx=(hx-off)-Math.round(hx-off), dy=hy-Math.round(hy)
  const hexD=Math.sqrt(dx*dx*0.75+dy*dy)
  const cell=Math.exp(-hexD*hexD*20)*0.8
  const d=Math.sqrt((nx-0.5)**2+(ny-0.5)**2)
  const rings=Math.max(0,Math.sin(d*32-t*1.5))*0.4
  const shimmer=h2(x,y,Math.floor(t*3))>0.987 ? 0.9 : 0
  return Math.min(1, cell+rings*0.35+shimmer)
}

// WONDER — 12-fold mandala with radial symmetry
const fWonder: Field = (x,y,t,vs) => {
  const cx=x/GW-0.5, cy=y/GH-0.5
  const d=Math.sqrt(cx*cx+cy*cy), ang=Math.atan2(cy,cx)
  const ec=vs.eraIndex/7
  const s12=Math.abs(Math.sin(ang*12+t*0.28))*0.55
  const s6=Math.abs(Math.sin(ang*6-t*0.18))*0.4
  const rad=Math.pow(Math.abs(Math.sin(d*20+t)),2)*0.55
  const fil=ec>0.3 ? Math.abs(Math.sin(ang*24+t*0.65))*ec*0.3 : 0
  const ctr=Math.exp(-d*d*18)*0.7
  return Math.pow(Math.min(1,s12*0.25+s6*0.2+rad*0.28+ctr*0.27+fil),1.15)
}

// CHAOS — high-frequency interference with sharp scan lines and static
const fChaos: Field = (x,y,t,vs) => {
  const nx=x/GW, ny=y/GH, I=vs.intensity/100
  const f1=Math.sin(nx*49+t*9), f2=Math.sin(ny*53-t*7.5)
  const f3=Math.sin((nx+ny)*33+t*11)
  const interference=(f1*f2*f3)*0.5+0.5
  const scan=Math.floor(y*2+t*8)%3===0 ? 0.55 : 0
  const noise=h2(x,y,Math.floor(t*6))>(0.86-I*0.18) ? 0.75 : 0
  return Math.min(1, interference*0.45*I+scan*0.2+noise*0.35)
}

// NORMAL — two overlapping flow fields, subtle grid structure. Alive, breathing.
const fNormal: Field = (x,y,t,vs) => {
  const nx=x/GW, ny=y/GH
  const ec=1+vs.eraIndex*0.14
  const f1=Math.sin(nx*10*ec+ny*7+t*0.85)*0.5+0.5
  const f2=Math.cos(nx*6-ny*9*ec+t*0.55)*0.5+0.5
  const gx=Math.abs(Math.sin(nx*Math.PI*10))>0.95 ? 0.1 : 0
  const gy=Math.abs(Math.sin(ny*Math.PI*10))>0.95 ? 0.1 : 0
  return (f1*0.5+f2*0.5)*0.62+(gx+gy)*0.5+0.07
}

const FIELDS: Record<Mood,Field> = {
  surge:fSurge, quiet:fQuiet, departure:fDeparture,
  discovery:fDiscovery, wonder:fWonder, chaos:fChaos, normal:fNormal,
}

// ─── RENDERER ─────────────────────────────────────────────────────────────

interface RS { tick:number; vs:VS; glitch:Uint8Array }
function makeRS(): RS { return { tick:0, vs:{ mood:'normal',intensity:12,eraIndex:0,departureWeight:0,dominance:0,signalName:'',entryCount:0 }, glitch:new Uint8Array(GW*GH) } }

function renderFrame(
  screenCtx: CanvasRenderingContext2D,
  small: HTMLCanvasElement,
  smallCtx: CanvasRenderingContext2D,
  img: ImageData,
  rs: RS,
  isDark: boolean,
) {
  const { vs, tick, glitch } = rs
  const t = tick * 0.016
  const field = FIELDS[vs.mood] ?? FIELDS.normal
  const buf = img.data

  const bgR=isDark?8:242, bgG=isDark?8:241, bgB=isDark?7:235
  const fgR=isDark?248:16, fgG=isDark?248:16, fgB=isDark?244:13

  for (let y=0; y<GH; y++) {
    for (let x=0; x<GW; x++) {
      const i4=(y*GW+x)*4
      const gi=y*GW+x

      if (glitch[gi]>0) {
        const gv=glitch[gi]/255
        glitch[gi]=Math.max(0,glitch[gi]-15)
        const gb=isDark ? Math.round(gv*255) : Math.round((1-gv)*20)
        buf[i4]=gb; buf[i4+1]=gb; buf[i4+2]=gb; buf[i4+3]=255
        continue
      }

      let v=field(x,y,t,vs)
      if (y%4===0) v*=0.86
      v=Math.max(0,Math.min(1,v))

      buf[i4]  =Math.round(bgR+(fgR-bgR)*v)
      buf[i4+1]=Math.round(bgG+(fgG-bgG)*v)
      buf[i4+2]=Math.round(bgB+(fgB-bgB)*v)
      buf[i4+3]=255
    }
  }

  smallCtx.putImageData(img,0,0)
  screenCtx.imageSmoothingEnabled=false
  screenCtx.drawImage(small,0,0,W,H)

  // Vignette for later eras
  if (vs.eraIndex>=2) {
    const vig=(vs.eraIndex/7)*0.4
    const g=screenCtx.createRadialGradient(W/2,H/2,H*0.22,W/2,H/2,H*0.78)
    g.addColorStop(0,'transparent')
    g.addColorStop(1,isDark?`rgba(0,0,0,${vig})`:`rgba(255,255,255,${vig*0.65})`)
    screenCtx.fillStyle=g
    screenCtx.fillRect(0,0,W,H)
  }
}

// ─── COMPONENT ────────────────────────────────────────────────────────────

export function WarGrid({ entries, activeEntry, isDark }: {
  entries: StoryEntry[]
  activeEntry?: StoryEntry|null
  isDark?: boolean
}) {
  const screenRef = useRef<HTMLCanvasElement>(null)
  const smallRef = useRef<HTMLCanvasElement|null>(null)
  const smallCtxRef = useRef<CanvasRenderingContext2D|null>(null)
  const imgRef = useRef<ImageData|null>(null)
  const rsRef = useRef<RS>(makeRS())
  const rafRef = useRef(0)
  const prevMood = useRef('')
  const dark = isDark ?? false

  const vs = useMemo(() => deriveVS(entries), [entries])

  useEffect(() => {
    rsRef.current.vs = vs
    if (prevMood.current && prevMood.current !== vs.mood) {
      const g=rsRef.current.glitch, n=vs.mood==='surge'?180:vs.mood==='departure'?100:50
      for (let i=0;i<n;i++) g[Math.floor(Math.random()*GW*GH)]=160+Math.floor(Math.random()*95)
    }
    prevMood.current=vs.mood
  }, [vs])

  useEffect(() => {
    if (!activeEntry) return
    const g=rsRef.current.glitch
    for (let i=0;i<60;i++) g[Math.floor(Math.random()*GW*GH)]=100+Math.floor(Math.random()*155)
  }, [activeEntry])

  useEffect(() => {
    const sc=screenRef.current; if (!sc) return
    const sCtx=sc.getContext('2d'); if (!sCtx) return
    const sm=document.createElement('canvas'); sm.width=GW; sm.height=GH
    const smCtx=sm.getContext('2d')!
    smallRef.current=sm; smallCtxRef.current=smCtx
    imgRef.current=smCtx.createImageData(GW,GH)
    const loop=()=>{
      rsRef.current.tick++
      renderFrame(sCtx,sm,smCtx,imgRef.current!,rsRef.current,dark)
      rafRef.current=requestAnimationFrame(loop)
    }
    rafRef.current=requestAnimationFrame(loop)
    return ()=>cancelAnimationFrame(rafRef.current)
  }, [dark])

  const MOOD_LABEL: Record<string,string> = {
    surge:'signal surge', quiet:'stillness', departure:'passage',
    discovery:'discovery', wonder:'wonder', chaos:'interference', normal:'active',
  }

  const dyn=entries.filter(e=>e.eventType!=='genesis')
  const recentMoods=dyn.slice(-10).map(e=>e.visualState?.mood).filter(Boolean) as string[]

  return (
    <div>
      <div className="relative overflow-hidden" style={{ background:dark?'#080807':'#f2f1eb', lineHeight:0 }}>
        <canvas ref={screenRef} width={W} height={H}
          style={{ display:'block', width:'100%', aspectRatio:'1/1', imageRendering:'pixelated' }} />
        <div className="scanlines" />
      </div>

      <div style={{
        borderTop:`1px solid ${dark?'#1e1e1c':'#c4c3bb'}`,
        background:dark?'#0c0c0a':'#eceae4',
        padding:'0.5rem 0.85rem',
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem',
      }}>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:'0.4rem', letterSpacing:'0.2em', textTransform:'uppercase', color:dark?'#383830':'#9a9990', marginBottom:'0.18rem' }}>
            grid state
          </div>
          <div style={{ fontSize:'0.52rem', letterSpacing:'0.1em', textTransform:'uppercase', color:dark?'#b0b0a8':'#181815', fontWeight:700, lineHeight:1 }}>
            {vs.signalName && <span style={{ fontWeight:400, color:dark?'#484840':'#7a7970', marginRight:'0.4rem' }}>{vs.signalName} ·</span>}
            {MOOD_LABEL[vs.mood]??'active'}
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'3px', flexShrink:0 }}>
          {recentMoods.map((m,i) => {
            const age=(i+1)/recentMoods.length
            const big=m==='surge'||m==='chaos'
            return <div key={i} title={m} style={{ width:big?5:3, height:big?5:3, background:dark?`rgba(255,255,255,${age*0.5})`:`rgba(0,0,0,${age*0.45})`, flexShrink:0 }} />
          })}
        </div>

        <div style={{ width:'3.5rem', flexShrink:0 }}>
          <div style={{ fontSize:'0.38rem', letterSpacing:'0.14em', textTransform:'uppercase', color:dark?'#383830':'#9a9990', marginBottom:'0.22rem' }}>intensity</div>
          <div style={{ height:2, background:dark?'#1e1e1c':'#d4d3cb' }}>
            <div style={{ height:'100%', width:`${vs.intensity}%`, background:dark?'rgba(255,255,255,0.6)':'rgba(0,0,0,0.5)', transition:'width 1.8s ease' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
