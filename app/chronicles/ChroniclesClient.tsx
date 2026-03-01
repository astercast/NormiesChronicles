'use client'
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import type { StoryEntry } from '@/lib/storyGenerator'
import { WarGrid } from '@/components/WarGrid'

// ── helpers ────────────────────────────────────────────────────────────────
function groupByEra(entries: StoryEntry[]) {
  const map = new Map<string, StoryEntry[]>()
  for (const e of entries) {
    if (!map.has(e.era)) map.set(e.era, [])
    map.get(e.era)!.push(e)
  }
  return map
}

const LORE_LABELS: Record<string, string> = {
  SIGNAL_SURGE:'signal surge', MARK_MADE:'mark made', GHOST_TOUCH:'ghost touch',
  DECLARATION:'declaration', DEPARTURE:'departure', PASSING:'passing',
  TWICE_GIVEN:'twice given', RETURN:'return', FIRST_LIGHT:'first light',
  THE_ELDER:'the elder', ANCIENT_STIRS:'ancient stirs', FAR_SIGNAL:'far signal',
  CONTESTED_ZONE:'contested zone', THE_READING:'the reading', CONVERGENCE:'convergence',
  RELIC_FOUND:'relic found', THE_QUIET:'the quiet', ERA_SHIFT:'era shift',
  DOMINION:'dominion', PULSE:'pulse', DEEP_READING:'deep reading', VIGIL:'vigil',
  NEW_BLOOD:'new signal', OLD_GHOST:'old signal', WANDERER:'wanderer',
  THE_BUILDER:'the builder', CARTOGRAPHER:'survey', GONE:'gone quiet',
  STORY_TOLD:'story told', LONG_DARK:'long dark', PIVOT:'pivot',
  UNALIGNED:'unaligned', DYNASTY:'dynasty', THRESHOLD:'first crossing',
  THE_STEADY:'the steady', NIGHTWATCH:'night watch', RESONANCE:'resonance',
  ACCELERATION:'acceleration', WEIGHT:'weight', INTERVAL:'interval',
  GENESIS:'world primer',
}
const loreLabel = (t: string) => LORE_LABELS[t] ?? t.replace(/_/g,' ').toLowerCase()

const MAJOR_TYPES = new Set([
  'SIGNAL_SURGE','ERA_SHIFT','THE_READING','DEEP_READING',
  'DEPARTURE','RELIC_FOUND','CONVERGENCE','TWICE_GIVEN',
  'DYNASTY','DOMINION','LONG_DARK',
])

// ── AI summary ────────────────────────────────────────────────────────────
// ─── CHARACTER LEDGER ─────────────────────────────────────────────────────────
// Mirror the exact seeding from storyGenerator.ts so character names match

const SIGNAL_NAMES_CLIENT = [
  'the Wardens', 'the Hollow Pact', 'the Drifters',
  'the Ember Guard', 'the Old Compact', 'the Pale Sons',
  'the Breach-Born', 'the Deep Keepers', 'the Ridge Watch',
  'the Far Shore', 'the Unnamed', 'the First Circle',
]

const ZONE_NAMES_CLIENT = [
  'the Breach', 'the Pale Shore', 'the Hollow',
  'the Far Fields', 'the Black Margin', 'the Cradle',
  'the Dust Road', 'the Outer Ring', 'the Deep Well',
  'the Shatter Line', 'the Twin Peaks', 'the Old Border',
  'the Narrow Gate', 'the Salt Flats', 'the Grey Basin',
  'the High Ground', 'the Ember Fields', 'the Still Water',
  'the Last Ridge', 'the Open Grid',
]

function entrySignal(e: StoryEntry): string {
  const raw = e.sourceEvent?.tokenId ?? ''
  const m = raw.match(/#(\d+)/)
  if (!m) return 'the Unnamed'
  const t = parseInt(m[1])
  const n = SIGNAL_NAMES_CLIENT.length
  return SIGNAL_NAMES_CLIENT[((t * 7 + 3) % n + n) % n]
}

function entryZone(e: StoryEntry): string {
  const raw = e.sourceEvent?.tokenId ?? ''
  const m = raw.match(/#(\d+)/)
  if (!m) return 'the Open Grid'
  const t = parseInt(m[1])
  return ZONE_NAMES_CLIENT[t % ZONE_NAMES_CLIENT.length]
}

interface SignalProfile {
  name: string
  count: number
  surges: number
  departures: number
  firstEra: string
  lastEra: string
  dominantZone: string
  zones: Map<string, number>
  activeInEras: Set<string>
}

function buildCharacterLedger(entries: StoryEntry[]): SignalProfile[] {
  const profiles = new Map<string, SignalProfile>()
  for (const e of entries) {
    if (e.eventType === 'genesis') continue
    const sig = entrySignal(e)
    const zone = entryZone(e)
    if (!profiles.has(sig)) {
      profiles.set(sig, {
        name: sig, count: 0, surges: 0, departures: 0,
        firstEra: e.era, lastEra: e.era,
        dominantZone: zone, zones: new Map(), activeInEras: new Set(),
      })
    }
    const p = profiles.get(sig)!
    p.count++
    p.lastEra = e.era
    p.activeInEras.add(e.era)
    p.zones.set(zone, (p.zones.get(zone) ?? 0) + 1)
    if (e.loreType === 'SIGNAL_SURGE') p.surges++
    if (e.loreType === 'DEPARTURE' || e.loreType === 'TWICE_GIVEN') p.departures++
  }
  for (const p of profiles.values()) {
    let max = 0
    for (const [z, c] of p.zones) { if (c > max) { max = c; p.dominantZone = z } }
  }
  return Array.from(profiles.values()).sort((a, b) => b.count - a.count)
}

// ─── NARRATIVE SKELETON ───────────────────────────────────────────────────────
// Find the actual turning points — the entries that changed something real.

interface TurningPoint {
  era: string
  type: string
  signal: string
  zone: string
  headline: string
  why: string  // why this mattered
}

function buildNarrativeSkeleton(entries: StoryEntry[]): TurningPoint[] {
  const points: TurningPoint[] = []
  const dyn = entries.filter(e => e.eventType !== 'genesis')

  for (const e of dyn) {
    let why = ''
    if (e.loreType === 'SIGNAL_SURGE') {
      why = 'zone completely reshaped — shifted what others could do here'
    } else if (e.loreType === 'ERA_SHIFT') {
      why = `world crossed into ${e.era} — the story changed character`
    } else if (e.loreType === 'DEPARTURE' || e.loreType === 'TWICE_GIVEN') {
      why = 'energy passed forward — redistributed what was possible'
    } else if (e.loreType === 'CONVERGENCE') {
      why = 'two signals moved at the same moment — rare simultaneity'
    } else if (e.loreType === 'RELIC_FOUND') {
      why = 'artifact surfaced — changed the weight of the zone'
    } else if (e.loreType === 'DOMINION') {
      why = 'one signal reached dominant position across the Grid'
    } else if (e.loreType === 'LONG_DARK') {
      why = 'extended silence — the Grid held still for a long stretch'
    } else {
      continue  // only include genuine turning points
    }

    const sigMatch = e.headline.match(/(the [A-Z][a-z]+(?: [A-Z][a-z]+)*)/)
    const zoneMatch = e.body?.match(/(the [A-Z][a-z]+(?: [A-Z][a-z]+)*)/)

    points.push({
      era: e.era,
      type: e.loreType,
      signal: sigMatch?.[1] ?? 'unknown signal',
      zone: zoneMatch?.[1] ?? 'the Grid',
      headline: e.headline,
      why,
    })
  }

  // Keep at most 12 turning points — the real skeleton
  return points.slice(0, 12)
}

// ─── DIGEST (era-structured chapter summaries) ────────────────────────────────

function buildDigest(entries: StoryEntry[]): string {
  const dyn = entries.filter(e => e.eventType !== 'genesis')
  if (!dyn.length) return ''

  const lines: string[] = []

  // 1. Character ledger — who has been doing what
  const ledger = buildCharacterLedger(dyn)
  if (ledger.length > 0) {
    lines.push('=== SIGNAL GROUPS (persistent characters) ===')
    for (const p of ledger.slice(0, 6)) {
      const eras = Array.from(p.activeInEras).join(', ')
      const detail = [
        `${p.count} entries`,
        p.surges > 0 ? `${p.surges} major reshaping${p.surges > 1 ? 's' : ''}` : null,
        p.departures > 0 ? `${p.departures} departure${p.departures > 1 ? 's' : ''}` : null,
        `most present at ${p.dominantZone}`,
        `active in: ${eras}`,
      ].filter(Boolean).join(', ')
      lines.push(`${p.name}: ${detail}`)
    }
  }

  // 2. Turning points — actual events that mattered
  const skeleton = buildNarrativeSkeleton(dyn)
  if (skeleton.length > 0) {
    lines.push('\n=== TURNING POINTS (events that changed things) ===')
    for (const tp of skeleton) {
      lines.push(`[${tp.era}] ${tp.type}: "${tp.headline}"`)
      lines.push(`  ↳ ${tp.why}`)
    }
  }

  // 3. Recent entries — what is happening right now
  const recent = dyn.slice(-8)
  lines.push('\n=== RIGHT NOW (last 8 entries) ===')
  for (const e of recent) {
    const sigM = e.headline.match(/(the [A-Z][a-z]+(?: [A-Z][a-z]+)*)/)
    lines.push(`${e.loreType} [${e.era}]: ${e.headline}`)
    if (e.body) lines.push(`  ${e.body.slice(0, 100)}`)
  }

  return lines.join('\n')
}

// ─── COMPUTED SUMMARY ────────────────────────────────────────────────────────
// Built directly from data — no AI, no hallucination, no word salad.
// The story is in the numbers. We just have to read them out.

function computeSummary(dynamic: StoryEntry[]): string {
  const dyn = dynamic.filter(e => e.eventType !== 'genesis')
  if (dyn.length < 3) return ''

  const ledger = buildCharacterLedger(dyn)
  if (ledger.length < 2) return ''

  const top = ledger[0]
  const second = ledger[1]
  const third = ledger.length > 2 ? ledger[2] : null

  const eras = [...new Set(dyn.map(e => e.era))]
  const currentEra = eras[eras.length - 1]
  const totalEntries = dyn.length

  // Find key turning points
  const surges = dyn.filter(e => e.loreType === 'SIGNAL_SURGE')
  const departures = dyn.filter(e => e.loreType === 'DEPARTURE' || e.loreType === 'TWICE_GIVEN')
  const erashifts = dyn.filter(e => e.loreType === 'ERA_SHIFT')
  const recentEntries = dyn.slice(-6)

  // Who is active right now?
  const recentLedger = buildCharacterLedger(recentEntries)
  const recentTop = recentLedger[0]
  const recentSecond = recentLedger.length > 1 ? recentLedger[1] : null

  // Build paragraph 1 — the arc
  const gap = top.count - second.count
  const isClose = gap <= Math.max(3, Math.round(top.count * 0.1))
  const dominanceWord = top.count > totalEntries * 0.25
    ? 'has defined this chronicle'
    : top.count > totalEntries * 0.15
    ? 'has led throughout'
    : 'has been the most present force'

  let p1 = `${top.name} ${dominanceWord} — ${top.count} entries across ${Array.from(top.activeInEras).join(', ')}, centered on ${top.dominantZone}.`

  if (isClose) {
    p1 += ` ${second.name} has matched that presence step for step: ${second.count} entries, most often at ${second.dominantZone}. The two have been contesting the same chronicle in parallel, neither pulling decisively ahead.`
  } else {
    p1 += ` ${second.name} has been the primary counterforce, with ${second.count} entries at ${second.dominantZone}.`
    if (gap > 10) {
      p1 += ` The gap between them — ${gap} entries — has widened across ${eras.length > 2 ? 'multiple eras' : currentEra}.`
    }
  }

  if (top.surges > 0) {
    p1 += ` ${top.name} executed ${top.surges === 1 ? 'one major reshaping' : `${top.surges} major reshapings`} — the moments where a zone changed completely.`
  } else if (second.surges > 0) {
    p1 += ` ${second.name} executed ${second.surges === 1 ? 'one major reshaping' : `${second.surges} major reshapings`}, the decisive moves that shifted ground.`
  }

  if (departures.length > 0) {
    p1 += ` ${departures.length === 1 ? 'One signal dissolved' : `${departures.length} signals dissolved`} across the chronicle, passing energy forward — each departure shifting what the remaining signals could do.`
  }

  if (third) {
    p1 += ` ${third.name} has been a consistent third presence, with ${third.count} entries mostly at ${third.dominantZone}.`
  }

  // Build paragraph 2 — right now
  let p2 = ''
  if (recentTop) {
    const recentZones = [...recentTop.zones.entries()].sort((a,b) => b[1]-a[1])
    const zone1 = recentZones[0]?.[0] ?? recentTop.dominantZone
    p2 += `Right now, ${recentTop.name} is the most active presence — ${recentTop.count} of the last ${recentEntries.length} entries, concentrated at ${zone1}.`
  }
  if (recentSecond) {
    p2 += ` ${recentSecond.name} is active alongside them at ${recentSecond.dominantZone}.`
  }

  // Is the current leader the same as the overall leader?
  if (recentTop && recentTop.name !== top.name) {
    p2 += ` Notably, ${recentTop.name} has been more active recently than ${top.name}, who dominated the earlier record — the dynamic is shifting.`
  } else if (recentTop && recentTop.name === top.name) {
    p2 += ` ${top.name}'s lead in the current era continues what they built across the whole chronicle.`
  }

  // Any recent major events?
  const recentSurge = recentEntries.find(e => e.loreType === 'SIGNAL_SURGE')
  const recentDeparture = recentEntries.find(e => e.loreType === 'DEPARTURE')
  if (recentSurge) {
    const rSig = entrySignal(recentSurge)
    const rZone = entryZone(recentSurge)
    p2 += ` ${rSig} recently executed a full reshaping at ${rZone} — the kind of move that changes what others can do near there.`
  }
  if (recentDeparture) {
    const dSig = entrySignal(recentDeparture)
    p2 += ` ${dSig} recently dissolved and passed their energy forward, opening ground that others are still deciding what to do with.`
  }

  p2 += ` The chronicle is in ${currentEra}. ${isClose ? 'The outcome is still open.' : `${top.name} leads, but the record keeps moving.`}`

  return p1 + '\n\n' + p2
}

function useGridSummary(dynamic: StoryEntry[]) {
  // Computed directly — no async, no AI call, no waiting, no hallucination
  const summary = useMemo(() => computeSummary(dynamic), [dynamic])
  return { summary: summary || null, loading: false, error: false }
}

// ── entry modal ───────────────────────────────────────────────────────────
function EntryModal({ entry, onClose }: { entry: StoryEntry; onClose: ()=>void }) {
  useEffect(() => {
    const h=(e:KeyboardEvent)=>{ if(e.key==='Escape') onClose() }
    document.addEventListener('keydown',h)
    document.body.style.overflow='hidden'
    return ()=>{ document.removeEventListener('keydown',h); document.body.style.overflow='' }
  },[onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{background:'rgba(0,0,0,0.72)',backdropFilter:'blur(4px)'}} onClick={onClose}>
      <div className="w-full max-w-lg overflow-y-auto fade-up"
        style={{background:'var(--bg)',border:'1px solid var(--border)',maxHeight:'88vh',
          boxShadow:'0 32px 80px rgba(0,0,0,0.45)'}}
        onClick={e=>e.stopPropagation()}>

        <div style={{borderBottom:'1px solid var(--border)',padding:'0.9rem 1.2rem',display:'flex',alignItems:'start',justifyContent:'space-between'}}>
          <div>
            <div className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.2em',marginBottom:'0.2rem'}}>{entry.era}</div>
            <div className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.15em'}}>{loreLabel(entry.loreType)}</div>
          </div>
          <button onClick={onClose} style={{color:'var(--muted)',background:'none',border:'none',cursor:'pointer',fontSize:'0.7rem',marginLeft:'1rem'}}>× close</button>
        </div>

        <div style={{padding:'1.5rem 1.2rem'}}>
          <div style={{fontSize:'1.6rem',lineHeight:1,marginBottom:'0.9rem'}}>{entry.icon}</div>
          <h2 className="font-bold" style={{color:'var(--text)',fontSize:'1rem',lineHeight:1.5,marginBottom:'1.25rem'}}>{entry.headline}</h2>
          <p style={{color:'var(--text)',fontSize:'0.78rem',lineHeight:'2.1'}}>{entry.body}</p>
        </div>

        {entry.eventType !== 'genesis' && (
          <div style={{borderTop:'1px solid var(--border)',padding:'1rem 1.2rem'}}>
            <div className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.2em',marginBottom:'0.75rem',opacity:0.55}}>on-chain source</div>
            {([['event',entry.sourceEvent.type],['token',`#${entry.sourceEvent.tokenId}`],['block',entry.sourceEvent.blockNumber],['rule',entry.sourceEvent.ruleApplied]] as [string,string][]).map(([k,v])=>(
              <div key={k} className="flex gap-4 mb-1.5">
                <span className="text-2xs" style={{color:'var(--muted)',opacity:0.45,width:'2.5rem',flexShrink:0}}>{k}</span>
                <span className="text-2xs" style={{color:'var(--text)'}}>{v}</span>
              </div>
            ))}
            <div className="flex gap-4 mb-3">
              <span className="text-2xs" style={{color:'var(--muted)',opacity:0.45,width:'2.5rem',flexShrink:0}}>tx</span>
              <a href={`https://etherscan.io/tx/${entry.sourceEvent.txHash}`} target="_blank" rel="noopener noreferrer"
                className="text-2xs hover:opacity-50 underline underline-offset-2" style={{color:'var(--muted)'}}>
                {entry.sourceEvent.txHash.slice(0,10)}…{entry.sourceEvent.txHash.slice(-6)}
              </a>
            </div>
            <p className="text-2xs" style={{color:'var(--muted)',opacity:0.4,lineHeight:'1.8',fontStyle:'italic'}}>{entry.sourceEvent.ruleExplanation}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Now view ──────────────────────────────────────────────────────────────
function NowView({ entries, meta, onSelect, onReadAll, selected, isDark }: {
  entries: StoryEntry[]
  meta: {totalEvents:number;dynamicEntries:number;lastUpdated:string}|null
  onSelect:(e:StoryEntry)=>void
  onReadAll:()=>void
  selected:StoryEntry|null
  isDark:boolean
}) {
  const dynamic = entries.filter(e=>e.eventType!=='genesis')
  const { summary, loading, error } = useGridSummary(dynamic)
  const latest = dynamic[dynamic.length-1]
  const recent = dynamic.slice(-5,-1).reverse()
  const byEra = groupByEra(dynamic)
  const eras = Array.from(byEra.keys())
  const maxCount = Math.max(...eras.map(e=>byEra.get(e)!.length),1)

  return (
    <div style={{paddingBottom:'5rem'}}>

      {/* ── GRID ────────────────────────────────────────────── */}
      <div style={{border:'1px solid var(--border)',marginBottom:'3rem'}}>
        <div style={{padding:'0.55rem 1rem',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.22em'}}>the grid</span>
          <span className="text-2xs" style={{color:'var(--muted)',opacity:0.45}}>{dynamic.length} entries</span>
        </div>
        <WarGrid entries={entries} activeEntry={selected} isDark={isDark} />
      </div>

      {/* ── DISPATCH ────────────────────────────────────────── */}
      <div style={{marginBottom:'3rem',paddingBottom:'3rem',borderBottom:'3px double var(--border)'}}>
        <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:'1.5rem'}}>
          <div>
            <div className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.25em',marginBottom:'0.25rem'}}>chronicler's dispatch</div>
            <div className="text-2xs" style={{color:'var(--muted)'}}>era: <strong style={{color:'var(--text)'}}>{latest?.era ?? '—'}</strong></div>
          </div>
          <div className="text-2xs" style={{color:'var(--muted)',textAlign:'right',opacity:0.6}}>
            {meta?.totalEvents.toLocaleString() ?? '—'} events<br/>
            {dynamic.length} entries
          </div>
        </div>

        {loading && (
          <div>
            {[88,72,80,60].map((w,i)=>(
              <div key={i} style={{height:'0.55rem',background:'var(--border)',marginBottom:'0.5rem',width:`${w}%`,
                animation:`shimmer 1.6s ease-in-out ${i*0.12}s infinite`}} />
            ))}
            <p className="text-2xs" style={{color:'var(--muted)',fontStyle:'italic',marginTop:'0.75rem',opacity:0.6}}>the chronicler writes…</p>
          </div>
        )}
        {!loading && summary && (
          <div style={{display:'flex',flexDirection:'column',gap:'1.1rem'}}>
            {summary.split('\n\n').filter(p=>p.trim()).slice(0,2).map((para,i)=>(
              <p key={i} style={{color:'var(--text)',fontSize:'0.8rem',lineHeight:'2.1'}}>
                {i===0 ? (
                  <><span style={{float:'left',fontSize:'3.2rem',lineHeight:0.85,fontWeight:700,marginRight:'0.07em',marginBottom:'-0.04em'}}>{para.trim()[0]}</span>{para.trim().slice(1)}</>
                ) : para.trim()}
              </p>
            ))}
          </div>
        )}
        {!loading && !summary && !error && (
          <p style={{color:'var(--muted)',fontSize:'0.78rem',fontStyle:'italic'}}>The Grid is young. The record is being written.</p>
        )}
        {!loading && error && (
          <p className="text-2xs" style={{color:'var(--muted)',opacity:0.35}}>add ANTHROPIC_API_KEY to enable the chronicler</p>
        )}
      </div>

      {/* ── LATEST ──────────────────────────────────────────── */}
      {latest && (
        <div style={{marginBottom:'3rem',paddingBottom:'3rem',borderBottom:'1px solid var(--border)'}}>
          <div className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.22em',marginBottom:'1.25rem',paddingBottom:'0.6rem',borderBottom:'1px solid var(--border)'}}>
            latest entry
          </div>
          <div className="flex gap-0">
            {/* Hero entry */}
            <div style={{flex:1,paddingRight:'2rem',borderRight:'1px solid var(--border)'}}>
              <button className="w-full text-left group" onClick={()=>onSelect(latest)}>
                <div className="flex items-center gap-2" style={{marginBottom:'0.85rem'}}>
                  <span style={{fontSize:'1.1rem',lineHeight:1}}>{latest.icon}</span>
                  <span className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.14em'}}>{loreLabel(latest.loreType)}</span>
                </div>
                <h2 className="font-bold group-hover:opacity-55 transition-opacity"
                  style={{color:'var(--text)',fontSize:'clamp(0.9rem,2.5vw,1.1rem)',lineHeight:1.5,marginBottom:'0.85rem'}}>
                  {latest.headline}
                </h2>
                <p className="group-hover:opacity-55 transition-opacity"
                  style={{color:'var(--text)',fontSize:'0.77rem',lineHeight:'2.05'}}>
                  {latest.body.slice(0,300)}{latest.body.length>300&&<span style={{color:'var(--muted)'}}>…</span>}
                </p>
                <p className="text-2xs" style={{color:'var(--muted)',marginTop:'0.65rem'}}>read full entry →</p>
              </button>
            </div>

            {/* Recent sidebar */}
            <div style={{width:'11rem',flexShrink:0,paddingLeft:'2rem'}}>
              <div className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.2em',marginBottom:'1.25rem',paddingBottom:'0.6rem',borderBottom:'1px solid var(--border)'}}>
                recent
              </div>
              {recent.map(e=>(
                <button key={e.id} onClick={()=>onSelect(e)} className="w-full text-left hover:opacity-55 transition-opacity"
                  style={{paddingBottom:'0.8rem',marginBottom:'0.8rem',borderBottom:'1px solid var(--border)'}}>
                  <div className="flex gap-2 items-start">
                    <span style={{fontSize:'0.8rem',lineHeight:1,marginTop:'0.1rem',flexShrink:0}}>{e.icon}</span>
                    <div>
                      <p className="font-bold text-2xs" style={{color:'var(--text)',lineHeight:1.5,marginBottom:'0.18rem'}}>
                        {e.headline.length>50?e.headline.slice(0,50)+'…':e.headline}
                      </p>
                      <p className="text-2xs" style={{color:'var(--muted)',letterSpacing:'0.08em'}}>{loreLabel(e.loreType)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ERAS ────────────────────────────────────────────── */}
      <div style={{marginBottom:'3rem'}}>
        <div className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.22em',marginBottom:'1.25rem',paddingBottom:'0.6rem',borderBottom:'1px solid var(--border)'}}>
          eras
        </div>
        {eras.map((era,i)=>{
          const isLatest=i===eras.length-1
          const count=byEra.get(era)!.length
          const pct=Math.max(6,Math.round((count/maxCount)*100))
          return (
            <div key={era} style={{paddingBottom:'0.6rem',marginBottom:'0.6rem',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:'0.85rem'}}>
              <div style={{width:4,height:4,flexShrink:0,background:isLatest?'var(--text)':'var(--border)'}} />
              <p className="text-2xs flex-1" style={{color:isLatest?'var(--text)':'var(--muted)',fontWeight:isLatest?700:400}}>
                {era}{isLatest&&<span style={{opacity:0.35,fontWeight:400}}> ←</span>}
              </p>
              <div style={{width:'5rem',height:1,background:'var(--border)',flexShrink:0}}>
                <div style={{height:'100%',width:`${pct}%`,background:isLatest?'var(--text)':'var(--muted)',opacity:isLatest?0.6:0.3,transition:'width 0.8s ease'}} />
              </div>
              <p className="text-2xs" style={{color:'var(--muted)',opacity:0.5,width:'2rem',textAlign:'right',flexShrink:0}}>{count}</p>
            </div>
          )
        })}
      </div>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <button onClick={onReadAll} className="w-full flex items-center justify-between hover:opacity-55 transition-opacity"
        style={{border:'1px solid var(--border)',padding:'0.9rem 1.1rem'}}>
        <div>
          <span className="font-bold" style={{color:'var(--text)',fontSize:'0.78rem'}}>read the full chronicle</span>
          <span className="text-2xs" style={{color:'var(--muted)',marginLeft:'0.6rem'}}>— {dynamic.length} entries</span>
        </div>
        <span style={{color:'var(--text)'}}>→</span>
      </button>
    </div>
  )
}

// ── chronicle entry components ─────────────────────────────────────────────
function ChronicleEntry({ entry, onSelect, prev }: { entry:StoryEntry; onSelect:(e:StoryEntry)=>void; prev?:StoryEntry }) {
  if (entry.eventType==='genesis') {
    return (
      <div style={{marginBottom:'2.5rem',paddingBottom:'2.5rem',borderBottom:'1px solid var(--border)'}}>
        <div className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.2em',marginBottom:'0.65rem',opacity:0.6}}>world primer · {entry.era}</div>
        <h2 className="font-bold" style={{color:'var(--text)',fontSize:'0.95rem',marginBottom:'0.85rem',lineHeight:1.45}}>{entry.headline}</h2>
        <p style={{color:'var(--muted)',fontSize:'0.77rem',lineHeight:'2.0'}}>{entry.body}</p>
      </div>
    )
  }

  const isMajor = MAJOR_TYPES.has(entry.loreType)||entry.featured
  const isMinor = ['GHOST_TOUCH','NIGHTWATCH','THE_STEADY','INTERVAL'].includes(entry.loreType)
  const showBreak = prev && prev.era!==entry.era

  if (isMajor) return (
    <>
      {showBreak&&<div style={{height:'1px',background:'var(--border)',margin:'0.75rem 0'}} />}
      <div style={{marginBottom:'2.5rem',paddingBottom:'2.5rem',borderBottom:'1px solid var(--border)'}}>
        <div className="flex items-center gap-2" style={{marginBottom:'0.7rem'}}>
          <span style={{fontSize:'0.9rem'}}>{entry.icon}</span>
          <span className="font-bold text-2xs uppercase" style={{color:'var(--text)',letterSpacing:'0.15em'}}>{loreLabel(entry.loreType)}</span>
          <span style={{color:'var(--border)',fontSize:'0.4rem'}}>·</span>
          <span className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.1em'}}>{entry.era}</span>
        </div>
        <button className="w-full text-left" onClick={()=>onSelect(entry)}>
          <h2 className="font-bold hover:opacity-55 transition-opacity"
            style={{color:'var(--text)',fontSize:'clamp(0.88rem,2vw,1.02rem)',lineHeight:1.5,marginBottom:'0.85rem'}}>
            {entry.headline}
          </h2>
        </button>
        <p style={{color:'var(--text)',fontSize:'0.77rem',lineHeight:'2.0'}}>
          {entry.body.slice(0,380)}{entry.body.length>380&&(
            <button onClick={()=>onSelect(entry)} className="underline underline-offset-2 hover:opacity-50 ml-1"
              style={{color:'var(--muted)'}}>more →</button>
          )}
        </p>
      </div>
    </>
  )

  if (isMinor) return (
    <div style={{marginBottom:'0.5rem',paddingBottom:'0.5rem',borderBottom:'1px solid var(--dim)',opacity:0.65}}>
      <button className="w-full text-left hover:opacity-55 transition-opacity" onClick={()=>onSelect(entry)}>
        <div className="flex items-baseline gap-2">
          <span style={{color:'var(--muted)',fontSize:'0.55rem',flexShrink:0}}>{entry.icon}</span>
          <p className="text-2xs" style={{color:'var(--muted)'}}>
            <span style={{fontStyle:'italic'}}>{loreLabel(entry.loreType)}</span>
            {' — '}{entry.headline.length>78?entry.headline.slice(0,78)+'…':entry.headline}
          </p>
        </div>
      </button>
    </div>
  )

  return (
    <>
      {showBreak&&<div style={{height:'1px',background:'var(--border)',margin:'0.75rem 0'}} />}
      <div style={{marginBottom:'1.4rem',paddingBottom:'1.4rem',borderBottom:'1px solid var(--border)'}}>
        <button className="w-full text-left hover:opacity-55 transition-opacity" onClick={()=>onSelect(entry)}>
          <div className="flex items-baseline gap-2" style={{marginBottom:'0.28rem'}}>
            <span style={{color:'var(--muted)',fontSize:'0.72rem',flexShrink:0}}>{entry.icon}</span>
            <span className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.12em',opacity:0.75}}>{loreLabel(entry.loreType)}</span>
          </div>
          <p style={{color:'var(--text)',fontSize:'0.76rem',lineHeight:'1.9'}}>
            <strong>{entry.headline}.</strong>{' '}
            <span style={{color:'var(--muted)'}}>{entry.body.slice(0,160)}{entry.body.length>160?'…':''}</span>
          </p>
        </button>
      </div>
    </>
  )
}

function EraSection({ era, entries, onSelect, defaultOpen }: {
  era:string; entries:StoryEntry[]; onSelect:(e:StoryEntry)=>void; defaultOpen:boolean
}) {
  const [open,setOpen]=useState(defaultOpen)
  const major=entries.filter(e=>MAJOR_TYPES.has(e.loreType)||e.featured).length
  return (
    <div style={{marginBottom:'0.2rem'}}>
      <button className="w-full text-left flex items-center gap-3 group"
        style={{paddingTop:'0.8rem',paddingBottom:'0.8rem',borderTop:'1px solid var(--border)'}}
        onClick={()=>setOpen(o=>!o)}>
        <span className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.2em',opacity:0.6,flexShrink:0}}>era</span>
        <span className="font-bold flex-1 text-left" style={{color:'var(--text)',fontSize:'0.78rem'}}>{era}</span>
        {major>0&&<span className="text-2xs hidden sm:inline" style={{color:'var(--muted)',opacity:0.45}}>{major} major ·</span>}
        <span className="text-2xs" style={{color:'var(--muted)',opacity:0.45}}>{entries.length}</span>
        <span className="text-2xs group-hover:opacity-40 transition-opacity" style={{color:'var(--muted)',width:'0.75rem',textAlign:'right'}}>{open?'↑':'↓'}</span>
      </button>
      {open&&(
        <div style={{paddingTop:'1.5rem',paddingBottom:'0.5rem'}}>
          {entries.map((e,i)=><ChronicleEntry key={e.id} entry={e} onSelect={onSelect} prev={entries[i-1]} />)}
        </div>
      )}
    </div>
  )
}

// ── loading ────────────────────────────────────────────────────────────────
function LoadingState({ status }: { status:string }) {
  return (
    <div style={{paddingTop:'6rem',paddingBottom:'6rem',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:'1.5rem'}}>
      <div style={{position:'relative',width:'8rem',height:'1px',background:'var(--border)'}}>
        <div className="scan-bar" style={{position:'absolute',inset:0,width:'3rem',background:'var(--text)'}} />
      </div>
      <div>
        <p className="font-bold" style={{color:'var(--text)',fontSize:'0.85rem',marginBottom:'0.4rem'}}>
          scanning the grid<span className="dot-1 inline-block">.</span><span className="dot-2 inline-block">.</span><span className="dot-3 inline-block">.</span>
        </p>
        <p className="text-2xs" style={{color:'var(--muted)',marginBottom:'0.2rem'}}>{status}</p>
        <p className="text-2xs" style={{color:'var(--muted)',opacity:0.4}}>first load may take a moment</p>
      </div>
    </div>
  )
}

// ── root ──────────────────────────────────────────────────────────────────
export function ChroniclesClient() {
  const router = useRouter()
  const sp = useSearchParams()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(()=>setMounted(true),[])
  const isDark = mounted && resolvedTheme==='dark'

  const view = sp.get('view')==='chronicle'?'chronicle':'now'
  const [entries, setEntries] = useState<StoryEntry[]>([])
  const [meta, setMeta] = useState<{totalEvents:number;dynamicEntries:number;lastUpdated:string}|null>(null)
  const [loadStatus, setLoadStatus] = useState<'loading'|'indexing'|'done'|'error'>('loading')
  const [indexStatus, setIndexStatus] = useState('scanning ethereum mainnet…')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<StoryEntry|null>(null)

  const indexingRef = useRef(false)
  const pollRef = useRef<ReturnType<typeof setTimeout>|null>(null)
  const mountedRef = useRef(true)
  const PAGE_SIZE = 30

  const setView = useCallback((v:'now'|'chronicle')=>{
    const p=new URLSearchParams(sp.toString())
    if(v==='now') p.delete('view'); else p.set('view',v)
    router.push(`/chronicles?${p.toString()}`,{scroll:false})
  },[router,sp])

  const triggerIndex = useCallback(async ()=>{
    if(indexingRef.current) return; indexingRef.current=true
    try {
      const res=await fetch('/api/index',{method:'POST'})
      if(res.ok){const d=await res.json();if(mountedRef.current) setIndexStatus(`indexed ${(d.events??0).toLocaleString()} events`)}
    } catch {} finally { indexingRef.current=false }
  },[])

  const fetchStory = useCallback(async ()=>{
    try {
      const res=await fetch('/api/story',{cache:'no-store'})
      if(!res.ok) throw new Error()
      const d=await res.json()
      if(!mountedRef.current) return false
      if((d.meta?.totalEvents??0)>0){setEntries(d.entries??[]);setMeta(d.meta);setLoadStatus('done');return true}
      setLoadStatus('indexing'); triggerIndex(); return false
    } catch { if(mountedRef.current) setLoadStatus('error'); return true }
  },[triggerIndex])

  useEffect(()=>{
    mountedRef.current=true; let cancelled=false
    const poll=async()=>{ if(cancelled) return; const done=await fetchStory(); if(!done&&!cancelled) pollRef.current=setTimeout(poll,8000) }
    poll()
    return ()=>{ cancelled=true; mountedRef.current=false; if(pollRef.current) clearTimeout(pollRef.current) }
  },[fetchStory])

  useEffect(()=>setPage(0),[search,view])

  const dynamic = useMemo(()=>entries.filter(e=>e.eventType!=='genesis'),[entries])
  const genesis = useMemo(()=>entries.filter(e=>e.eventType==='genesis'),[entries])
  const eras = useMemo(()=>Array.from(groupByEra(dynamic).keys()),[dynamic])

  const filtered = useMemo(()=>{
    if(!search.trim()) return dynamic
    const q=search.toLowerCase()
    return dynamic.filter(e=>e.headline.toLowerCase().includes(q)||e.body.toLowerCase().includes(q)||e.era.toLowerCase().includes(q)||e.loreType.toLowerCase().includes(q))
  },[dynamic,search])

  const byEraFiltered = useMemo(()=>groupByEra(filtered),[filtered])
  const erasFiltered = Array.from(byEraFiltered.keys())
  const totalPages = Math.ceil(filtered.length/PAGE_SIZE)
  const pageEntries = filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE)
  const isLoading = loadStatus==='loading'||(loadStatus==='indexing'&&entries.length===0)

  const handleSelect = useCallback((e:StoryEntry)=>{ setSelected(prev=>prev?.id===e.id?null:e) },[])

  return (
    <>
      {selected&&<EntryModal entry={selected} onClose={()=>setSelected(null)} />}
      <main style={{minHeight:'100vh',paddingTop:'2.75rem'}}>

        {/* info strip */}
        <div style={{borderBottom:'1px solid var(--border)'}}>
          <div style={{maxWidth:'42rem',margin:'0 auto',padding:'0 1.5rem',height:'2.1rem',display:'flex',alignItems:'center'}}>
            <p className="text-2xs" style={{color:'var(--muted)',letterSpacing:'0.1em',opacity:0.7}}>
              10,000 normies · ethereum mainnet · cc0
            </p>
          </div>
        </div>

        {/* masthead */}
        <div style={{maxWidth:'42rem',margin:'0 auto',padding:'0 1.5rem'}}>
          <div style={{paddingTop:'2rem',paddingBottom:'1.5rem'}}>
            <h1 className="font-bold" style={{fontSize:'clamp(2.8rem,8vw,5rem)',color:'var(--text)',letterSpacing:'-0.025em',lineHeight:0.9,marginBottom:'0.9rem'}}>
              normies<br/>chronicles
            </h1>
            <p className="text-2xs" style={{color:'var(--muted)',maxWidth:'24rem',lineHeight:'1.85',letterSpacing:'0.04em'}}>
              a living record — every on-chain event becomes a moment in the Grid's story.
            </p>
          </div>
        </div>

        {/* sticky nav */}
        <div className="sticky" style={{top:'2.75rem',zIndex:40,borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)',background:'var(--bg)'}}>
          <div style={{maxWidth:'42rem',margin:'0 auto',padding:'0 1.5rem',display:'flex',alignItems:'center',height:'2.4rem'}}>
            <div className="flex items-center shrink-0 h-full" style={{borderRight:'1px solid var(--border)'}}>
              <button onClick={()=>setView('now')} style={{fontFamily:'inherit',fontSize:'0.73rem',paddingRight:'1rem',height:'100%',cursor:'pointer',background:'none',border:'none',color:view==='now'?'var(--text)':'var(--muted)',fontWeight:view==='now'?700:400}}>now</button>
              <button onClick={()=>setView('chronicle')} style={{fontFamily:'inherit',fontSize:'0.73rem',paddingLeft:'0.75rem',paddingRight:'1rem',height:'100%',cursor:'pointer',background:'none',border:'none',color:view==='chronicle'?'var(--text)':'var(--muted)',fontWeight:view==='chronicle'?700:400}}>full chronicle</button>
            </div>
            {view==='chronicle' ? (
              <div className="flex-1 flex items-center" style={{paddingLeft:'1rem',height:'100%'}}>
                <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="search…" disabled={isLoading}
                  style={{width:'100%',background:'transparent',fontFamily:'inherit',fontSize:'0.73rem',color:'var(--text)',border:'none',outline:'none',opacity:isLoading?0.4:1}} />
                {search&&<button onClick={()=>setSearch('')} style={{fontFamily:'inherit',fontSize:'0.6rem',color:'var(--muted)',background:'none',border:'none',cursor:'pointer',marginLeft:'0.5rem'}}>×</button>}
              </div>
            ) : (
              <p className="flex-1 text-right text-2xs" style={{color:'var(--muted)',opacity:0.5}}>
                {!isLoading&&dynamic.length>0?`${dynamic.length} entries · ${eras.length} era${eras.length!==1?'s':''}`:''}</p>
            )}
          </div>
        </div>

        {/* content */}
        <div style={{maxWidth:'42rem',margin:'0 auto',padding:'2.5rem 1.5rem 0'}}>

          {isLoading&&<LoadingState status={indexStatus} />}

          {loadStatus==='error'&&(
            <div style={{padding:'5rem 0',textAlign:'center'}}>
              <p className="font-bold" style={{color:'var(--text)',fontSize:'0.85rem',marginBottom:'0.5rem'}}>the grid is silent</p>
              <p className="text-2xs" style={{color:'var(--muted)',marginBottom:'1.5rem'}}>could not connect to the chronicle</p>
              <button onClick={()=>{setLoadStatus('loading');fetchStory()}}
                style={{fontFamily:'inherit',fontSize:'0.73rem',color:'var(--text)',background:'none',border:'none',cursor:'pointer',textDecoration:'underline',textUnderlineOffset:'4px'}}>retry →</button>
            </div>
          )}

          {!isLoading&&loadStatus!=='error'&&(
            <>
              {view==='now'&&(
                <NowView entries={entries} meta={meta} onSelect={handleSelect}
                  onReadAll={()=>setView('chronicle')} selected={selected} isDark={isDark} />
              )}

              {view==='chronicle'&&(
                <>
                  <div style={{border:'1px solid var(--border)',marginBottom:'2.5rem'}}>
                    <div style={{padding:'0.55rem 1rem',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <span className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.22em'}}>the grid</span>
                      <span className="text-2xs" style={{color:'var(--muted)',opacity:0.4}}>select entry to reflect state</span>
                    </div>
                    <WarGrid entries={entries} activeEntry={selected} isDark={isDark} />
                  </div>

                  {!search&&genesis.map(e=><ChronicleEntry key={e.id} entry={e} onSelect={handleSelect} />)}

                  {search ? (
                    <div>
                      <p className="text-2xs" style={{color:'var(--muted)',marginBottom:'1.5rem'}}>
                        {filtered.length} result{filtered.length!==1?'s':''} for &quot;{search}&quot;
                      </p>
                      {pageEntries.map((e,i)=><ChronicleEntry key={e.id} entry={e} onSelect={handleSelect} prev={pageEntries[i-1]} />)}
                      {pageEntries.length===0&&(
                        <div style={{padding:'4rem 0',textAlign:'center'}}>
                          <p className="font-bold" style={{color:'var(--text)',marginBottom:'0.5rem'}}>no records match</p>
                          <p className="text-2xs" style={{color:'var(--muted)'}}>try different search terms</p>
                        </div>
                      )}
                      {totalPages>1&&(
                        <div className="flex items-center justify-between"
                          style={{paddingTop:'2rem',marginTop:'1rem',borderTop:'1px solid var(--border)'}}>
                          <button disabled={page===0} onClick={()=>{setPage(p=>p-1);window.scrollTo(0,0)}}
                            style={{fontFamily:'inherit',fontSize:'0.73rem',color:'var(--text)',background:'none',border:'none',cursor:'pointer',opacity:page===0?0.2:1}}>← earlier</button>
                          <span className="text-2xs" style={{color:'var(--muted)'}}>{page+1} / {totalPages}</span>
                          <button disabled={page===totalPages-1} onClick={()=>{setPage(p=>p+1);window.scrollTo(0,0)}}
                            style={{fontFamily:'inherit',fontSize:'0.73rem',color:'var(--text)',background:'none',border:'none',cursor:'pointer',opacity:page===totalPages-1?0.2:1}}>later →</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{borderBottom:'1px solid var(--border)'}}>
                      {erasFiltered.map((era,i)=>(
                        <EraSection key={era} era={era} entries={byEraFiltered.get(era)!}
                          onSelect={handleSelect} defaultOpen={i===erasFiltered.length-1} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* footer */}
        <div style={{borderTop:'1px solid var(--border)',marginTop:'5rem'}}>
          <div style={{maxWidth:'42rem',margin:'0 auto',padding:'1rem 1.5rem',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <p className="text-2xs" style={{color:'var(--muted)',opacity:0.6}}>normies chronicles · ethereum · cc0</p>
            <div className="flex items-center gap-4">
              <a href="/how-it-works" className="text-2xs hover:opacity-50 transition-opacity" style={{color:'var(--muted)'}}>how it works</a>
              <a href="https://x.com/aster0x" target="_blank" rel="noopener noreferrer"
                className="text-2xs hover:opacity-50 transition-opacity" style={{color:'var(--muted)'}}>@aster0x</a>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
