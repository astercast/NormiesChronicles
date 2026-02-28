import { NavBar } from '@/components/NavBar'

export default function AboutPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen pt-12">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="mb-2">
            <span className="font-mono text-xs text-grid-accent tracking-widest">// ABOUT</span>
          </div>
          <h1 className="font-pixel text-5xl text-grid-secondary mb-12">ABOUT THE CHRONICLES</h1>

          {/* Project */}
          <section className="mb-10 border border-grid-border bg-grid-surface p-6">
            <h2 className="font-pixel text-2xl text-grid-accent mb-4">THE PROJECT</h2>
            <p className="font-mono text-xs text-grid-secondary leading-relaxed mb-4">
              The Normie Chronicles is a living world-building experiment. It takes the on-chain activity
              of the Normies NFT collection — every pixel transformation, every offering to the Grid — and
              translates it into narrative lore through a deterministic rule system.
            </p>
            <p className="font-mono text-xs text-grid-secondary leading-relaxed">
              The story grows because the world grows. Every holder who interacts with the NormiesCanvas
              contract becomes an unwitting author of the Chronicle, their on-chain actions folded into
              the expanding myth of the Grid.
            </p>
          </section>

          {/* Normies */}
          <section className="mb-10 border border-grid-border bg-grid-surface p-6">
            <h2 className="font-pixel text-2xl text-grid-accent mb-4">THE NORMIES COLLECTION</h2>
            <p className="font-mono text-xs text-grid-secondary leading-relaxed mb-4">
              Normies is a collection of 10,000 generative pixel faces fully stored on Ethereum mainnet.
              Not on IPFS. Not on a server. On-chain — forever, immutable, belonging to no single entity.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[
                ['SUPPLY', '10,000 unique faces'],
                ['BLOCKCHAIN', 'Ethereum mainnet'],
                ['STORAGE', 'Fully on-chain'],
                ['LICENSE', 'CC0 — public domain'],
                ['TRAITS', '4 types: Human, Cat, Alien, Agent'],
                ['CONTRACT', 'NormiesCanvas (pixel edit + burn system'],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="font-mono text-xs text-grid-primary tracking-widest">{label}</p>
                  <p className="font-mono text-xs text-grid-secondary mt-0.5">{val}</p>
                </div>
              ))}
            </div>
            <p className="font-mono text-xs text-grid-secondary leading-relaxed mb-4">
              Normies is CC0 — no restrictions, no royalties, no gatekeeping. The community builds freely.
              Holders can edit their Normies pixel by pixel using the NormiesCanvas contract, spending
              action points earned by holding or burning. This on-chain activity is what powers the Chronicle.
            </p>
            <a
              href="https://normies.art"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-mono text-xs text-grid-accent border border-grid-accent/40 px-4 py-2 hover:bg-grid-accent hover:text-black transition-all"
            >
              VISIT NORMIES.ART →
            </a>
          </section>

          {/* Forward-thinking */}
          <section className="mb-10 border border-grid-border bg-grid-surface p-6">
            <h2 className="font-pixel text-2xl text-grid-accent mb-4">FORWARD-THINKING</h2>
            <p className="font-mono text-xs text-grid-secondary leading-relaxed mb-4">
              Normies is one of the rare NFT projects where the infrastructure outlasts the trend.
              Fully on-chain storage means the art exists as long as Ethereum exists — no dependency
              on a company, no risk of a server going down, no off-chain metadata to be changed or deleted.
            </p>
            <p className="font-mono text-xs text-grid-secondary leading-relaxed">
              The CC0 license means the community owns the culture. Third parties — like this Chronicle —
              can build freely on Normies IP without asking permission. That's the model. That's the vision.
              The holders are building something that compounds over time.
            </p>
          </section>

          {/* Builder */}
          <section className="border border-grid-accent/20 bg-grid-surface p-6">
            <h2 className="font-pixel text-2xl text-grid-accent mb-4">BUILT BY</h2>
            <p className="font-mono text-xs text-grid-secondary leading-relaxed mb-4">
              The Normie Chronicles was designed and built by{' '}
              <a href="https://x.com/aster0x" target="_blank" rel="noopener noreferrer" className="text-grid-accent hover:underline">
                @aster0x
              </a>{' '}
              — independent developer, Normies holder, builder of things that compound.
            </p>
            <p className="font-mono text-xs text-grid-secondary leading-relaxed mb-6">
              If you have ideas, feedback, or want to contribute to the Chronicle's world-building,
              reach out on X.
            </p>
            <a
              href="https://x.com/aster0x"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-mono text-xs text-grid-accent border border-grid-accent/40 px-4 py-2 hover:bg-grid-accent hover:text-black transition-all"
            >
              @ASTER0X ON X →
            </a>
          </section>
        </div>

        <footer className="border-t border-grid-border mt-12">
          <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="font-mono text-xs text-grid-primary">NORMIE CHRONICLES · BUILT ON ETHEREUM · CC0</p>
            <p className="font-mono text-xs text-grid-primary">
              BY <a href="https://x.com/aster0x" target="_blank" rel="noopener noreferrer" className="text-grid-accent hover:underline">@ASTER0X</a>
            </p>
          </div>
        </footer>
      </main>
    </>
  )
}
