import { NavBar } from '@/components/NavBar'

export default function AboutPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen pt-11">
        <div className="max-w-2xl mx-auto px-4 py-12">

          <p className="font-mono text-xs text-muted mb-3">about</p>
          <h1 className="font-pixel text-6xl text-bright mb-10">normies chronicles</h1>

          {/* project */}
          <section className="mb-10">
            <h2 className="font-mono text-xs text-muted uppercase tracking-widest mb-4">the project</h2>
            <p className="font-mono text-xs text-primary leading-relaxed mb-3">
              Normies Chronicles is a living world-building experiment. It takes the on-chain activity
              of the Normies NFT collection — every pixel transformation, every burn — and
              translates it into narrative lore through a deterministic rule system.
            </p>
            <p className="font-mono text-xs text-primary leading-relaxed">
              Every holder who interacts with the NormiesCanvas contract becomes an author of the
              Chronicle. Their actions are folded into the expanding myth of the Grid.
            </p>
          </section>

          <div className="border-t border-border mb-10" />

          {/* normies */}
          <section className="mb-10">
            <h2 className="font-mono text-xs text-muted uppercase tracking-widest mb-4">the normies collection</h2>
            <p className="font-mono text-xs text-primary leading-relaxed mb-4">
              Normies is a collection of 10,000 generative pixel faces fully stored on Ethereum mainnet.
              Not on IPFS. Not on a server. On-chain — forever, immutable, belonging to no single entity.
              CC0 — no restrictions, no royalties, no gatekeeping.
            </p>
            <div className="grid grid-cols-2 gap-y-3 gap-x-8 mb-5">
              {[
                ['supply', '10,000 unique faces'],
                ['blockchain', 'ethereum mainnet'],
                ['storage', 'fully on-chain'],
                ['license', 'cc0 — public domain'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="font-mono text-xs text-muted">{k}</p>
                  <p className="font-mono text-xs text-primary mt-0.5">{v}</p>
                </div>
              ))}
            </div>
            <a
              href="https://normies.art"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-accent hover:underline"
            >
              normies.art →
            </a>
          </section>

          <div className="border-t border-border mb-10" />

          {/* built by */}
          <section className="mb-10">
            <h2 className="font-mono text-xs text-muted uppercase tracking-widest mb-4">built by</h2>
            <p className="font-mono text-xs text-primary leading-relaxed mb-4">
              Normies Chronicles was designed and built by{' '}
              <a href="https://x.com/aster0x" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                @aster0x
              </a>
              {' '}— independent developer and Normies holder.
            </p>
            <p className="font-mono text-xs text-primary leading-relaxed mb-6">
              @aster0x also built the{' '}
              <a href="https://normiesarchive.vercel.app" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                Normies Pixel Archive
              </a>
              {' '}— a full on-chain pixel history of every Normie: leaderboards,
              spotlight upgrades, and the complete record of 10k faces over time.
            </p>
            <div className="flex gap-4">
              <a
                href="https://x.com/aster0x"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-muted hover:text-primary transition-colors"
              >
                @aster0x on x →
              </a>
              <a
                href="https://normiesarchive.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-muted hover:text-primary transition-colors"
              >
                normies pixel archive →
              </a>
            </div>
          </section>

        </div>

        <footer className="border-t border-border">
          <div className="max-w-2xl mx-auto px-4 py-5 flex items-center justify-between">
            <p className="font-mono text-xs text-dim">normies chronicles · ethereum · cc0</p>
            <a href="https://x.com/aster0x" target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-muted hover:text-primary transition-colors">
              @aster0x
            </a>
          </div>
        </footer>
      </main>
    </>
  )
}
