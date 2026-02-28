import { NavBar } from '@/components/NavBar'

function Footer() {
  return (
    <footer className="border-t mt-16" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
        <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>normies chronicles · ethereum · cc0</p>
        <a href="https://x.com/aster0x" target="_blank" rel="noopener noreferrer"
          className="font-mono text-xs transition-opacity hover:opacity-60" style={{ color: 'var(--muted)' }}>
          @aster0x
        </a>
      </div>
    </footer>
  )
}

export default function AboutPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen pt-11">
        <div className="max-w-2xl mx-auto px-6 pt-10 pb-16">

          <h1 className="font-mono font-bold leading-none mb-10"
            style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)', color: 'var(--text)' }}>
            normies<br />chronicles
          </h1>

          <section className="mb-10">
            <p className="font-mono text-2xs uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>the project</p>
            <p className="font-mono text-xs leading-relaxed mb-3" style={{ color: 'var(--text)' }}>
              Normies Chronicles is a living world-building experiment. It reads on-chain activity
              from the Normies NFT collection — every pixel transformation, every burn — and translates
              it into narrative lore through a deterministic rule system.
            </p>
            <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--text)' }}>
              Every holder who interacts with the NormiesCanvas contract becomes an author of the
              Chronicle. Their actions fold into the expanding myth of the Grid.
            </p>
          </section>

          <div className="border-t mb-10" style={{ borderColor: 'var(--border)' }} />

          <section className="mb-10">
            <p className="font-mono text-2xs uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>the normies collection</p>
            <p className="font-mono text-xs leading-relaxed mb-4" style={{ color: 'var(--text)' }}>
              Normies is a collection of 10,000 generative pixel faces fully stored on Ethereum mainnet.
              Not on IPFS. Not on a server. On-chain — forever, immutable, belonging to no entity.
              CC0 — no restrictions, no royalties, no gatekeeping.
            </p>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-5">
              {[
                ['supply', '10,000 unique faces'],
                ['blockchain', 'ethereum mainnet'],
                ['storage', 'fully on-chain'],
                ['license', 'cc0 — public domain'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="font-mono text-2xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{k}</p>
                  <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--text)' }}>{v}</p>
                </div>
              ))}
            </div>
            <a href="https://normies.art" target="_blank" rel="noopener noreferrer"
              className="font-mono text-xs underline underline-offset-4 transition-opacity hover:opacity-60"
              style={{ color: 'var(--text)' }}>
              normies.art →
            </a>
          </section>

          <div className="border-t mb-10" style={{ borderColor: 'var(--border)' }} />

          <section className="mb-10">
            <p className="font-mono text-2xs uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>built by</p>
            <p className="font-mono text-xs leading-relaxed mb-4" style={{ color: 'var(--text)' }}>
              Normies Chronicles was designed and built by{' '}
              <a href="https://x.com/aster0x" target="_blank" rel="noopener noreferrer"
                className="underline underline-offset-4 transition-opacity hover:opacity-60">
                @aster0x
              </a>
              {' '}— independent developer and Normies holder.
            </p>
            <p className="font-mono text-xs leading-relaxed mb-5" style={{ color: 'var(--text)' }}>
              @aster0x also built the{' '}
              <a href="https://normiesarchive.vercel.app" target="_blank" rel="noopener noreferrer"
                className="underline underline-offset-4 transition-opacity hover:opacity-60">
                Normies Pixel Archive
              </a>
              {' '}— the complete on-chain pixel history of all 10,000 Normies, with leaderboards,
              upgrade spotlights, and the full record of every transformation ever made.
            </p>
            <div className="flex flex-col gap-2">
              <a href="https://x.com/aster0x" target="_blank" rel="noopener noreferrer"
                className="font-mono text-xs underline underline-offset-4 transition-opacity hover:opacity-60"
                style={{ color: 'var(--muted)' }}>
                @aster0x on x →
              </a>
              <a href="https://normiesarchive.vercel.app" target="_blank" rel="noopener noreferrer"
                className="font-mono text-xs underline underline-offset-4 transition-opacity hover:opacity-60"
                style={{ color: 'var(--muted)' }}>
                normies pixel archive →
              </a>
            </div>
          </section>

        </div>
        <Footer />
      </main>
    </>
  )
}
