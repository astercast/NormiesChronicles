'use client'
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import type { StoryEntry } from '@/lib/storyGenerator'
import { WarGrid } from '@/components/WarGrid'

// ── helpers ───────────────────────────────────────────────────────────────
function groupByEra(entries: StoryEntry[]) {
  const map = new Map<string, StoryEntry[]>()
  for (const e of entries) {
    if (!map.has(e.era)) map.set(e.era, [])
    map.get(e.era)!.push(e)
  }
  return map
}

const LORE_LABELS: Record<string, string> = {
  GREAT_BATTLE:'total assault',SKIRMISH:'skirmish',BORDER_RAID:'border probe',
  FORMAL_DECLARATION:'declaration',GREAT_SACRIFICE:'sacrifice',OFFERING:'offering',
  BLOOD_OATH:'blood oath',VETERAN_RETURNS:'return',NEW_BLOOD:'new presence',
  THE_ORACLE:'oracle',ANCIENT_WAKES:'ancient stirs',FAR_REACH:'far reach',
  HOLLOW_GROUND:'contested ground',TURNING_POINT:'turning point',
  DOMINION_GROWS:'dominion',THE_SILENCE:'silence',NEW_AGE:'new era',
  CONVERGENCE:'convergence',RELIC_FOUND:'relic found',WAR_COUNCIL:'war council',
  CARTOGRAPHY:'survey',OLD_GHOST:'old ghost',THE_DESERTER:'desertion',
  TALLY:'tally',RETURNED_GHOST:'return',DEBT_PAID:'second sacrifice',
  CAMPFIRE_TALE:'field report',THE_LONG_DARK:'long dark',EDGE_SCOUTS:'edge scouts',
  SHIFTED_PLAN:'change of course',VIGIL:'vigil',NEUTRAL_GROUND:'unaligned',
  GHOST_MARK:'ghost mark',MESSENGER:'messenger',THE_LONG_COUNT:'long count',
  BETWEEN_FIRES:'quiet interval',DYNASTY:'dynasty',CROSSING:'first crossing',
  SUPPLY_ROAD:'maintenance',NIGHT_WATCH:'night watch',AFTERMATH:'aftermath',
  ESCALATION_NOTE:'escalation',SACRIFICE_TOLL:'sacrifice toll',
}
const loreLabel = (t: string) => LORE_LABELS[t] ?? t.replace(/_/g,' ').toLowerCase()

const MAJOR_TYPES = new Set([
  'GREAT_BATTLE','NEW_AGE','TURNING_POINT','THE_LONG_COUNT',
  'DOMINION_GROWS','GREAT_SACRIFICE','CONVERGENCE','BLOOD_OATH',
  'DYNASTY','RELIC_FOUND',
])

// ── AI war summary ────────────────────────────────────────────────────────
function buildDigest(entries: StoryEntry[]) {
  const total = entries.length
  if (!total) return ''
  const step = Math.max(1, Math.floor(total / 40))
  const sampled = entries.filter((_, i) => i % step === 0)
  const featured = entries.filter(e => e.featured)
  const recent = entries.slice(-20)
  const seen = new Set<string>(); const merged: StoryEntry[] = []
  for (const e of [...featured, ...sampled, ...recent]) {
    if (!seen.has(e.id)) { seen.add(e.id); merged.push(e) }
  }
  merged.sort((a, b) => entries.indexOf(a) - entries.indexOf(b))
  return merged.map(e => `[${e.era}] ${e.headline} — ${e.body.slice(0,100)}`).join('\n')
}

function useWarSummary(dynamic: StoryEntry[]) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const lastBucket = useRef(-1)

  useEffect(() => {
    if (!dynamic.length) return
    const bucket = Math.floor(dynamic.length / 5)
    if (bucket === lastBucket.current) return
    lastBucket.current = bucket
    setLoading(true); setError(false)

    const prompt = `You are the Grand Chronicler of the Normies — the living record of a war fought by ten thousand faces across twenty named territories.

${dynamic.length} entries. Current era: "${dynamic[dynamic.length-1]?.era ?? '?'}". Key moments:

${buildDigest(dynamic)}

Write exactly 2 paragraphs. First: the arc — how the war began, its defining moments, what shaped it. Second: right now — who holds what, what's unresolved, what hangs in the air. Write from inside the world. Present tense. Vivid. Use specific faction and territory names from the entries. Never mention blockchain, NFTs, wallets, or technology. Short sentences. High stakes. The voice of someone who has been watching this war for a long time.`

    fetch('/api/summary', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ prompt }),
    })
      .then(async r => { const d=await r.json(); if(d.text) setSummary(d.text); else setError(true) })
      .catch(()=>setError(true))
      .finally(()=>setLoading(false))
  }, [dynamic])

  return { summary, loading, error }
}

// ── entry modal ───────────────────────────────────────────────────────────
function EntryModal({ entry, onClose }: { entry: StoryEntry; onClose: () => void }) {
  useEffect(() => {
    const h=(e:KeyboardEvent)=>{ if(e.key==='Escape') onClose() }
    document.addEventListener('keydown',h)
    document.body.style.overflow='hidden'
    return ()=>{ document.removeEventListener('keydown',h); document.body.style.overflow='' }
  },[onClose])

  const isMajor = MAJOR_TYPES.has(entry.loreType)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{background:'rgba(0,0,0,0.75)',backdropFilter:'blur(3px)'}} onClick={onClose}>
      <div className="w-full max-w-lg overflow-y-auto fade-up"
        style={{background:'var(--bg)',border:'1px solid var(--border)',maxHeight:'90vh',
          boxShadow:'0 40px 100px rgba(0,0,0,0.5)'}}
        onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{borderBottom:'1px solid var(--border)',padding:'1rem 1.25rem'}}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.2em',marginBottom:'0.2rem'}}>
                {entry.era}
              </div>
              <div className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.15em'}}>
                {loreLabel(entry.loreType)}
                {isMajor && <span style={{marginLeft:'0.6rem',opacity:0.5}}>· major event</span>}
              </div>
            </div>
            <button onClick={onClose} className="text-2xs hover:opacity-40 transition-opacity"
              style={{color:'var(--muted)',marginLeft:'1rem',flexShrink:0}}>× close</button>
          </div>
        </div>

        {/* Content */}
        <div style={{padding:'1.5rem 1.25rem'}}>
          <div style={{fontSize:'1.75rem',lineHeight:1,marginBottom:'1rem'}}>{entry.icon}</div>
          <h2 className="font-bold" style={{color:'var(--text)',fontSize:'1.05rem',lineHeight:1.45,marginBottom:'1.5rem'}}>
            {entry.headline}
          </h2>
          <p style={{color:'var(--text)',fontSize:'0.8rem',lineHeight:'2.15',letterSpacing:'0.01em'}}>
            {entry.body}
          </p>
        </div>

        {/* Source */}
        {entry.eventType !== 'genesis' && (
          <div style={{borderTop:'1px solid var(--border)',padding:'1rem 1.25rem'}}>
            <div className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.2em',marginBottom:'0.75rem',opacity:0.6}}>
              on-chain source
            </div>
            {([
              ['event', entry.sourceEvent.type],
              ['token', `#${entry.sourceEvent.tokenId}`],
              ['block', entry.sourceEvent.blockNumber],
              ['rule', entry.sourceEvent.ruleApplied],
            ] as [string,string][]).map(([k,v]) => (
              <div key={k} className="flex gap-4 mb-1.5">
                <span className="text-2xs" style={{color:'var(--muted)',opacity:0.5,width:'2.5rem',flexShrink:0}}>{k}</span>
                <span className="text-2xs" style={{color:'var(--text)'}}>{v}</span>
              </div>
            ))}
            <div className="flex gap-4 mb-3">
              <span className="text-2xs" style={{color:'var(--muted)',opacity:0.5,width:'2.5rem',flexShrink:0}}>tx</span>
              <a href={`https://etherscan.io/tx/${entry.sourceEvent.txHash}`} target="_blank" rel="noopener noreferrer"
                className="text-2xs hover:opacity-50 underline underline-offset-2" style={{color:'var(--muted)'}}>
                {entry.sourceEvent.txHash.slice(0,10)}…{entry.sourceEvent.txHash.slice(-6)}
              </a>
            </div>
            <p className="text-2xs" style={{color:'var(--muted)',opacity:0.45,lineHeight:'1.8',fontStyle:'italic'}}>
              {entry.sourceEvent.ruleExplanation}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── NowView ───────────────────────────────────────────────────────────────
function NowView({ entries, meta, onSelect, onReadAll, selected, isDark }: {
  entries: StoryEntry[]; meta: {totalEvents:number;dynamicEntries:number;lastUpdated:string}|null
  onSelect: (e:StoryEntry)=>void; onReadAll: ()=>void
  selected: StoryEntry|null; isDark: boolean
}) {
  const dynamic = entries.filter(e=>e.eventType!=='genesis')
  const { summary, loading:sl, error:se } = useWarSummary(dynamic)
  const latest = dynamic[dynamic.length-1]
  const recent = dynamic.slice(-6,-1).reverse()
  const featured = dynamic.filter(e=>e.featured||MAJOR_TYPES.has(e.loreType)).slice(-8).reverse()
  const byEra = groupByEra(dynamic)
  const eras = Array.from(byEra.keys())
  const currentEra = latest?.era ?? '—'
  const maxCount = Math.max(...eras.map(e=>byEra.get(e)!.length), 1)

  return (
    <div>

      {/* ══ GRID ══════════════════════════════════════════════════ */}
      <div style={{border:'1px solid var(--border)',marginBottom:'3rem'}}>
        <div className="flex items-center justify-between"
          style={{padding:'0.6rem 1rem',borderBottom:'1px solid var(--border)'}}>
          <div className="flex items-center gap-3">
            <span className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.22em'}}>the grid</span>
            <span style={{color:'var(--dim)',fontSize:'0.45rem'}}>·</span>
            <span className="text-2xs" style={{color:'var(--muted)',opacity:0.55,letterSpacing:'0.12em'}}>
              live territory · 80×80
            </span>
          </div>
          <span className="text-2xs" style={{color:'var(--muted)',opacity:0.4}}>
            {dynamic.length} entries mapped
          </span>
        </div>
        <WarGrid entries={entries} activeEntry={selected} isDark={isDark} />
      </div>

      {/* ══ MASTHEAD / AI DISPATCH ════════════════════════════════ */}
      <div style={{marginBottom:'3rem',paddingBottom:'3rem',borderBottom:'3px double var(--border)'}}>

        {/* Title row */}
        <div className="flex items-start justify-between gap-4" style={{marginBottom:'1.5rem'}}>
          <div>
            <div className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.25em',marginBottom:'0.3rem'}}>
              war dispatch
            </div>
            <div className="text-2xs" style={{color:'var(--muted)'}}>
              era: <strong style={{color:'var(--text)',fontWeight:700}}>{currentEra}</strong>
            </div>
          </div>
          <div style={{textAlign:'right'}}>
            <div className="text-2xs" style={{color:'var(--muted)'}}>
              {meta?.totalEvents.toLocaleString() ?? '—'} events indexed
            </div>
            <div className="text-2xs" style={{color:'var(--muted)'}}>
              {dynamic.length} entries · {eras.length} era{eras.length!==1?'s':''}
            </div>
          </div>
        </div>

        {/* Summary */}
        {sl && (
          <div>
            {[92,78,85,64,88,71].map((w,i)=>(
              <div key={i} style={{height:'0.6rem',background:'var(--border)',borderRadius:'1px',
                marginBottom:'0.5rem',width:`${w}%`,
                animation:`shimmer 1.6s ease-in-out ${i*0.1}s infinite`}} />
            ))}
            <p className="text-2xs" style={{color:'var(--muted)',fontStyle:'italic',marginTop:'0.75rem'}}>
              the chronicler writes…
            </p>
          </div>
        )}
        {!sl && summary && (
          <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
            {summary.split('\n\n').filter(p=>p.trim()).slice(0,2).map((para,i)=>(
              <p key={i} style={{color:'var(--text)',fontSize:'0.82rem',lineHeight:'2.1'}}>
                {i===0 ? (
                  <>
                    <span style={{float:'left',fontSize:'3.4rem',lineHeight:0.82,
                      fontWeight:700,marginRight:'0.08em',marginBottom:'-0.04em'}}>
                      {para.trim()[0]}
                    </span>
                    {para.trim().slice(1)}
                  </>
                ) : para.trim()}
              </p>
            ))}
          </div>
        )}
        {!sl && !summary && !se && (
          <p style={{color:'var(--muted)',fontSize:'0.8rem',fontStyle:'italic'}}>
            The war is young. The chronicle is being written.
          </p>
        )}
        {!sl && se && (
          <p className="text-2xs" style={{color:'var(--muted)',opacity:0.4}}>
            dispatch unavailable — add ANTHROPIC_API_KEY to enable
          </p>
        )}
      </div>

      {/* ══ LATEST + RECENT ═══════════════════════════════════════ */}
      {latest && (
        <div style={{marginBottom:'3rem',paddingBottom:'3rem',borderBottom:'1px solid var(--border)'}}>
          <div className="flex flex-col sm:flex-row gap-0">

            {/* Hero */}
            <div className="flex-1" style={{paddingRight:'2rem',borderRight:'1px solid var(--border)'}}>
              <div className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.22em',
                marginBottom:'1.25rem',paddingBottom:'0.6rem',borderBottom:'1px solid var(--border)'}}>
                latest from the front
              </div>
              <button className="w-full text-left group" onClick={()=>onSelect(latest)}>
                <div className="flex items-center gap-2" style={{marginBottom:'1rem'}}>
                  <span style={{fontSize:'1.25rem',lineHeight:1}}>{latest.icon}</span>
                  <span className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.14em'}}>
                    {loreLabel(latest.loreType)}
                  </span>
                </div>
                <h2 className="font-bold group-hover:opacity-55 transition-opacity"
                  style={{color:'var(--text)',fontSize:'clamp(0.95rem,2.5vw,1.15rem)',
                    lineHeight:1.45,marginBottom:'1rem'}}>
                  {latest.headline}
                </h2>
                <p className="group-hover:opacity-55 transition-opacity"
                  style={{color:'var(--text)',fontSize:'0.78rem',lineHeight:'2.1'}}>
                  {latest.body.slice(0,320)}{latest.body.length>320&&
                    <span style={{color:'var(--muted)'}}>…</span>}
                </p>
                <p className="text-2xs" style={{color:'var(--muted)',marginTop:'0.75rem',letterSpacing:'0.1em'}}>
                  read full entry →
                </p>
              </button>
            </div>

            {/* Recent */}
            <div style={{width:'12rem',flexShrink:0,paddingLeft:'2rem'}}>
              <div className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.22em',
                marginBottom:'1.25rem',paddingBottom:'0.6rem',borderBottom:'1px solid var(--border)'}}>
                recent
              </div>
              {recent.map(e=>(
                <button key={e.id} onClick={()=>onSelect(e)} className="w-full text-left hover:opacity-55 transition-opacity"
                  style={{paddingBottom:'0.85rem',marginBottom:'0.85rem',borderBottom:'1px solid var(--border)'}}>
                  <div className="flex gap-2 items-start">
                    <span style={{fontSize:'0.85rem',lineHeight:1,marginTop:'0.12rem',flexShrink:0}}>{e.icon}</span>
                    <div style={{minWidth:0}}>
                      <p className="font-bold text-2xs" style={{color:'var(--text)',lineHeight:1.5,marginBottom:'0.2rem'}}>
                        {e.headline.length>52?e.headline.slice(0,52)+'…':e.headline}
                      </p>
                      <p className="text-2xs" style={{color:'var(--muted)',letterSpacing:'0.08em'}}>
                        {loreLabel(e.loreType)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ MAJOR EVENTS + ERA MAP ════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row gap-0" style={{marginBottom:'3rem'}}>

        {/* Major events */}
        {featured.length>0 && (
          <div className="flex-1" style={{paddingRight:'2rem',borderRight:'1px solid var(--border)'}}>
            <div className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.22em',
              marginBottom:'1.25rem',paddingBottom:'0.6rem',borderBottom:'1px solid var(--border)'}}>
              major events
            </div>
            {featured.slice(0,6).map(e=>(
              <button key={e.id} onClick={()=>onSelect(e)} className="w-full text-left hover:opacity-55 transition-opacity flex gap-3"
                style={{paddingBottom:'0.85rem',marginBottom:'0.85rem',borderBottom:'1px solid var(--border)'}}>
                <span style={{fontSize:'0.9rem',lineHeight:1.4,paddingTop:'0.1rem',flexShrink:0}}>{e.icon}</span>
                <div style={{minWidth:0}}>
                  <p className="font-bold" style={{color:'var(--text)',fontSize:'0.76rem',lineHeight:1.5,marginBottom:'0.2rem'}}>
                    {e.headline}
                  </p>
                  <p className="text-2xs" style={{color:'var(--muted)',letterSpacing:'0.08em'}}>
                    {e.era} · {loreLabel(e.loreType)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Era map */}
        <div style={{width:'11rem',flexShrink:0,paddingLeft:'2rem'}}>
          <div className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.22em',
            marginBottom:'1.25rem',paddingBottom:'0.6rem',borderBottom:'1px solid var(--border)'}}>
            eras of the war
          </div>
          {eras.map((era,i)=>{
            const isLatest=i===eras.length-1
            const count=byEra.get(era)!.length
            const pct=Math.max(8,Math.round((count/maxCount)*100))
            return (
              <div key={era} style={{paddingBottom:'0.65rem',marginBottom:'0.65rem',borderBottom:'1px solid var(--border)'}}>
                <div className="flex items-center gap-2" style={{marginBottom:'0.4rem'}}>
                  <div style={{width:5,height:5,flexShrink:0,
                    background:isLatest?'var(--text)':'var(--border)'}} />
                  <p className="text-2xs flex-1" style={{
                    color:isLatest?'var(--text)':'var(--muted)',
                    fontWeight:isLatest?700:400,lineHeight:1.3}}>
                    {era}{isLatest&&<span style={{opacity:0.4,fontWeight:400}}> ←</span>}
                  </p>
                  <p className="text-2xs" style={{color:'var(--muted)',opacity:0.5,flexShrink:0}}>{count}</p>
                </div>
                <div style={{height:1,background:'var(--border)',marginLeft:'1.1rem'}}>
                  <div style={{height:'100%',width:`${pct}%`,
                    background:isLatest?'var(--text)':'var(--muted)',
                    opacity:isLatest?0.65:0.28,transition:'width 0.8s ease'}} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ══ READ ALL CTA ══════════════════════════════════════════ */}
      <button onClick={onReadAll} className="w-full flex items-center justify-between hover:opacity-55 transition-opacity"
        style={{border:'1px solid var(--text)',padding:'1rem 1.25rem'}}>
        <div>
          <span className="font-bold" style={{color:'var(--text)',fontSize:'0.8rem'}}>
            read the full chronicle
          </span>
          <span className="text-2xs" style={{color:'var(--muted)',marginLeft:'0.75rem'}}>
            — {dynamic.length} entries across {eras.length} era{eras.length!==1?'s':''}
          </span>
        </div>
        <span style={{color:'var(--text)',fontSize:'0.85rem'}}>→</span>
      </button>
    </div>
  )
}

// ── chronicle entries ─────────────────────────────────────────────────────
function ChronicleEntry({ entry, onSelect, prev }: {
  entry: StoryEntry; onSelect:(e:StoryEntry)=>void; prev?: StoryEntry
}) {
  if (entry.eventType === 'genesis') {
    return (
      <div style={{marginBottom:'2.5rem',paddingBottom:'2.5rem',borderBottom:'1px solid var(--border)'}}>
        <div className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.2em',marginBottom:'0.75rem',opacity:0.7}}>
          world primer · {entry.era}
        </div>
        <h2 className="font-bold" style={{color:'var(--text)',fontSize:'0.95rem',marginBottom:'1rem',lineHeight:1.45}}>
          {entry.headline}
        </h2>
        <p style={{color:'var(--muted)',fontSize:'0.78rem',lineHeight:'2.05'}}>{entry.body}</p>
      </div>
    )
  }

  // Determine visual weight
  const isMajor = MAJOR_TYPES.has(entry.loreType) || entry.featured
  const isMinor = ['GHOST_MARK','NIGHT_WATCH','SUPPLY_ROAD','BETWEEN_FIRES',
                   'BORDER_RAID','EDGE_SCOUTS'].includes(entry.loreType)

  // Show connector if there's a thematic/tonal shift from previous
  const showBreak = prev && prev.era !== entry.era

  if (isMajor) {
    return (
      <>
        {showBreak && <div style={{height:'1px',background:'var(--border)',margin:'0.75rem 0'}} />}
        <div style={{marginBottom:'2.5rem',paddingBottom:'2.5rem',borderBottom:'1px solid var(--border)'}}>
          <div className="flex items-center gap-2" style={{marginBottom:'0.75rem'}}>
            <span style={{fontSize:'0.95rem',lineHeight:1}}>{entry.icon}</span>
            <span className="font-bold text-2xs uppercase" style={{color:'var(--text)',letterSpacing:'0.15em'}}>
              {loreLabel(entry.loreType)}
            </span>
            <span style={{color:'var(--border)',fontSize:'0.5rem'}}>·</span>
            <span className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.12em'}}>{entry.era}</span>
          </div>
          <button className="w-full text-left" onClick={()=>onSelect(entry)}>
            <h2 className="font-bold hover:opacity-55 transition-opacity"
              style={{color:'var(--text)',fontSize:'clamp(0.9rem,2vw,1.05rem)',lineHeight:1.45,marginBottom:'0.9rem'}}>
              {entry.headline}
            </h2>
          </button>
          <p style={{color:'var(--text)',fontSize:'0.78rem',lineHeight:'2.05'}}>
            {entry.body.slice(0,380)}
            {entry.body.length>380 && (
              <button onClick={()=>onSelect(entry)}
                className="underline underline-offset-2 hover:opacity-50 ml-1"
                style={{color:'var(--muted)'}}>more →</button>
            )}
          </p>
        </div>
      </>
    )
  }

  if (isMinor) {
    // Very compact — just the headline as a note
    return (
      <div style={{marginBottom:'0.6rem',paddingBottom:'0.6rem',borderBottom:'1px solid var(--dim)',opacity:0.7}}>
        <button className="w-full text-left hover:opacity-55 transition-opacity" onClick={()=>onSelect(entry)}>
          <div className="flex items-baseline gap-2">
            <span style={{color:'var(--muted)',fontSize:'0.6rem',flexShrink:0}}>{entry.icon}</span>
            <p className="text-2xs" style={{color:'var(--muted)'}}>
              <span style={{fontStyle:'italic'}}>{loreLabel(entry.loreType)}</span>
              {' — '}
              {entry.headline.length > 80 ? entry.headline.slice(0,80)+'…' : entry.headline}
            </p>
          </div>
        </button>
      </div>
    )
  }

  // Standard entry
  return (
    <>
      {showBreak && <div style={{height:'1px',background:'var(--border)',margin:'0.75rem 0'}} />}
      <div style={{marginBottom:'1.5rem',paddingBottom:'1.5rem',borderBottom:'1px solid var(--border)'}}>
        <button className="w-full text-left hover:opacity-55 transition-opacity" onClick={()=>onSelect(entry)}>
          <div className="flex items-baseline gap-2" style={{marginBottom:'0.3rem'}}>
            <span style={{color:'var(--muted)',fontSize:'0.75rem',flexShrink:0}}>{entry.icon}</span>
            <span className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.12em',opacity:0.8}}>
              {loreLabel(entry.loreType)}
            </span>
          </div>
          <p style={{color:'var(--text)',fontSize:'0.77rem',lineHeight:'1.95'}}>
            <strong>{entry.headline}.</strong>{' '}
            <span style={{color:'var(--muted)'}}>
              {entry.body.slice(0,170)}{entry.body.length>170?'…':''}
            </span>
          </p>
        </button>
      </div>
    </>
  )
}

function EraSection({ era, entries, onSelect, defaultOpen }: {
  era:string; entries:StoryEntry[]; onSelect:(e:StoryEntry)=>void; defaultOpen:boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const majorCount = entries.filter(e=>MAJOR_TYPES.has(e.loreType)||e.featured).length

  return (
    <div style={{marginBottom:'0.25rem'}}>
      <button className="w-full text-left flex items-center gap-3 group"
        style={{paddingTop:'0.875rem',paddingBottom:'0.875rem',borderTop:'1px solid var(--border)'}}
        onClick={()=>setOpen(o=>!o)}>
        <span className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.2em',opacity:0.7,flexShrink:0}}>era</span>
        <span className="font-bold flex-1 text-left" style={{color:'var(--text)',fontSize:'0.8rem'}}>{era}</span>
        {majorCount>0 && (
          <span className="text-2xs hidden sm:inline" style={{color:'var(--muted)',opacity:0.5}}>
            {majorCount} major ·
          </span>
        )}
        <span className="text-2xs" style={{color:'var(--muted)',opacity:0.5}}>
          {entries.length} {entries.length===1?'entry':'entries'}
        </span>
        <span className="text-2xs group-hover:opacity-40 transition-opacity" style={{color:'var(--muted)',width:'0.75rem',textAlign:'right'}}>
          {open?'↑':'↓'}
        </span>
      </button>
      {open && (
        <div style={{paddingTop:'1.5rem',paddingBottom:'0.5rem'}}>
          {entries.map((e,i)=>(
            <ChronicleEntry key={e.id} entry={e} onSelect={onSelect} prev={entries[i-1]} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── loading ───────────────────────────────────────────────────────────────
function LoadingState({ status }: { status:string }) {
  return (
    <div style={{paddingTop:'7rem',paddingBottom:'7rem',textAlign:'center',display:'flex',
      flexDirection:'column',alignItems:'center',gap:'1.5rem'}}>
      <div style={{position:'relative',width:'9rem',height:'1px',background:'var(--border)'}}>
        <div className="scan-bar" style={{position:'absolute',inset:0,width:'3rem',background:'var(--text)'}} />
      </div>
      <div>
        <p className="font-bold" style={{color:'var(--text)',fontSize:'0.875rem',marginBottom:'0.5rem'}}>
          scanning the grid
          <span className="dot-1 inline-block">.</span>
          <span className="dot-2 inline-block">.</span>
          <span className="dot-3 inline-block">.</span>
        </p>
        <p className="text-2xs" style={{color:'var(--muted)',marginBottom:'0.25rem'}}>{status}</p>
        <p className="text-2xs" style={{color:'var(--muted)',opacity:0.5}}>
          reading ethereum mainnet — first load takes a moment
        </p>
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
    return dynamic.filter(e=>
      e.headline.toLowerCase().includes(q)||e.body.toLowerCase().includes(q)||
      e.era.toLowerCase().includes(q)||e.loreType.toLowerCase().includes(q))
  },[dynamic,search])

  const byEraFiltered = useMemo(()=>groupByEra(filtered),[filtered])
  const erasFiltered = Array.from(byEraFiltered.keys())
  const totalPages = Math.ceil(filtered.length/PAGE_SIZE)
  const pageEntries = filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE)
  const isLoading = loadStatus==='loading'||(loadStatus==='indexing'&&entries.length===0)

  const handleSelect = useCallback((e: StoryEntry) => {
    setSelected(prev => prev?.id === e.id ? null : e)
  }, [])

  return (
    <>
      {selected && <EntryModal entry={selected} onClose={()=>setSelected(null)} />}

      <main style={{minHeight:'100vh',paddingTop:'2.75rem'}}>

        {/* Sub-header */}
        <div style={{borderBottom:'1px solid var(--border)'}}>
          <div style={{maxWidth:'42rem',margin:'0 auto',padding:'0 1.5rem 0',height:'2.2rem',display:'flex',alignItems:'center'}}>
            <p className="text-2xs" style={{color:'var(--muted)',letterSpacing:'0.1em'}}>
              10,000 normies · ethereum mainnet · fully on-chain · cc0
            </p>
          </div>
        </div>

        {/* Title */}
        <div style={{maxWidth:'42rem',margin:'0 auto',padding:'0 1.5rem'}}>
          <div style={{paddingTop:'2.25rem',paddingBottom:'1.5rem'}}>
            <h1 className="font-bold" style={{
              fontSize:'clamp(3rem,9vw,5.5rem)',color:'var(--text)',
              letterSpacing:'-0.025em',lineHeight:0.9,marginBottom:'1rem'}}>
              normies<br/>chronicles
            </h1>
            <p className="text-2xs" style={{color:'var(--muted)',maxWidth:'26rem',lineHeight:'1.9',letterSpacing:'0.04em'}}>
              a living war record — every on-chain event becomes a moment in the conflict.
              fiction forged from real decisions.
            </p>
          </div>
        </div>

        {/* Sticky nav */}
        <div className="sticky" style={{top:'2.75rem',zIndex:40,borderTop:'1px solid var(--border)',
          borderBottom:'1px solid var(--border)',background:'var(--bg)'}}>
          <div style={{maxWidth:'42rem',margin:'0 auto',padding:'0 1.5rem',display:'flex',alignItems:'center',height:'2.5rem'}}>
            <div className="flex items-center shrink-0 h-full" style={{borderRight:'1px solid var(--border)'}}>
              <button onClick={()=>setView('now')} style={{
                fontFamily:'inherit',fontSize:'0.75rem',paddingRight:'1rem',height:'100%',cursor:'pointer',
                background:'none',border:'none',color:view==='now'?'var(--text)':'var(--muted)',
                fontWeight:view==='now'?700:400}}>now</button>
              <button onClick={()=>setView('chronicle')} style={{
                fontFamily:'inherit',fontSize:'0.75rem',paddingLeft:'0.75rem',paddingRight:'1rem',height:'100%',cursor:'pointer',
                background:'none',border:'none',color:view==='chronicle'?'var(--text)':'var(--muted)',
                fontWeight:view==='chronicle'?700:400}}>full chronicle</button>
            </div>
            {view==='chronicle' ? (
              <div className="flex-1 flex items-center" style={{paddingLeft:'1rem',height:'100%'}}>
                <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="search the war record…" disabled={isLoading}
                  style={{width:'100%',background:'transparent',fontFamily:'inherit',fontSize:'0.75rem',
                    color:'var(--text)',border:'none',outline:'none',opacity:isLoading?0.4:1}} />
                {search && (
                  <button onClick={()=>setSearch('')} style={{
                    fontFamily:'inherit',fontSize:'0.62rem',color:'var(--muted)',
                    background:'none',border:'none',cursor:'pointer',marginLeft:'0.5rem'}}>×</button>
                )}
              </div>
            ) : (
              <p className="flex-1 text-right text-2xs" style={{color:'var(--muted)',opacity:0.6}}>
                {!isLoading&&dynamic.length>0?`${dynamic.length} entries · ${eras.length} era${eras.length!==1?'s':''}`:''}</p>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{maxWidth:'42rem',margin:'0 auto',padding:'2.5rem 1.5rem 0'}}>

          {isLoading && <LoadingState status={indexStatus} />}

          {loadStatus==='error' && (
            <div style={{padding:'6rem 0',textAlign:'center'}}>
              <p className="font-bold" style={{color:'var(--text)',fontSize:'0.875rem',marginBottom:'0.5rem'}}>the grid is silent</p>
              <p className="text-2xs" style={{color:'var(--muted)',marginBottom:'1.5rem'}}>could not connect to the chronicle</p>
              <button onClick={()=>{setLoadStatus('loading');fetchStory()}}
                style={{fontFamily:'inherit',fontSize:'0.75rem',color:'var(--text)',background:'none',
                  border:'none',cursor:'pointer',textDecoration:'underline',textUnderlineOffset:'4px'}}>retry →</button>
            </div>
          )}

          {!isLoading && loadStatus!=='error' && (
            <>
              {view==='now' && (
                <NowView entries={entries} meta={meta} onSelect={handleSelect}
                  onReadAll={()=>setView('chronicle')} selected={selected} isDark={isDark} />
              )}

              {view==='chronicle' && (
                <>
                  {/* Grid in chronicle view */}
                  <div style={{border:'1px solid var(--border)',marginBottom:'2.5rem'}}>
                    <div className="flex items-center justify-between"
                      style={{padding:'0.6rem 1rem',borderBottom:'1px solid var(--border)'}}>
                      <span className="text-2xs uppercase" style={{color:'var(--muted)',letterSpacing:'0.22em'}}>
                        the grid · territory
                      </span>
                      <span className="text-2xs" style={{color:'var(--muted)',opacity:0.4}}>
                        tap entry to highlight zone
                      </span>
                    </div>
                    <WarGrid entries={entries} activeEntry={selected} isDark={isDark} />
                  </div>

                  {!search && genesis.map(e=><ChronicleEntry key={e.id} entry={e} onSelect={handleSelect} />)}

                  {search ? (
                    <div>
                      <p className="text-2xs" style={{color:'var(--muted)',marginBottom:'1.5rem'}}>
                        {filtered.length} result{filtered.length!==1?'s':''} for &quot;{search}&quot;
                      </p>
                      {pageEntries.map((e,i)=>(
                        <ChronicleEntry key={e.id} entry={e} onSelect={handleSelect} prev={pageEntries[i-1]} />
                      ))}
                      {pageEntries.length===0 && (
                        <div style={{padding:'4rem 0',textAlign:'center'}}>
                          <p className="font-bold" style={{color:'var(--text)',marginBottom:'0.5rem'}}>no records match</p>
                          <p className="text-2xs" style={{color:'var(--muted)'}}>try a different search</p>
                        </div>
                      )}
                      {totalPages>1 && (
                        <div className="flex items-center justify-between"
                          style={{paddingTop:'2rem',marginTop:'1rem',borderTop:'1px solid var(--border)'}}>
                          <button disabled={page===0} onClick={()=>{setPage(p=>p-1);window.scrollTo(0,0)}}
                            style={{fontFamily:'inherit',fontSize:'0.75rem',color:'var(--text)',
                              background:'none',border:'none',cursor:'pointer',opacity:page===0?0.2:1}}>← earlier</button>
                          <span className="text-2xs" style={{color:'var(--muted)'}}>{page+1} / {totalPages}</span>
                          <button disabled={page===totalPages-1} onClick={()=>{setPage(p=>p+1);window.scrollTo(0,0)}}
                            style={{fontFamily:'inherit',fontSize:'0.75rem',color:'var(--text)',
                              background:'none',border:'none',cursor:'pointer',
                              opacity:page===totalPages-1?0.2:1}}>later →</button>
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

        {/* Footer */}
        <div style={{borderTop:'1px solid var(--border)',marginTop:'5rem'}}>
          <div style={{maxWidth:'42rem',margin:'0 auto',padding:'1rem 1.5rem',
            display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <p className="text-2xs" style={{color:'var(--muted)'}}>normies chronicles · ethereum · cc0</p>
            <a href="https://x.com/aster0x" target="_blank" rel="noopener noreferrer"
              className="text-2xs hover:opacity-50 transition-opacity" style={{color:'var(--muted)'}}>@aster0x</a>
          </div>
        </div>
      </main>
    </>
  )
}
