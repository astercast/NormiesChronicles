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

          {/* project */}
          <section className="mb-10">
            <p className="font-mono text-2xs uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>the project</p>
            <p className="font-mono text-xs leading-relaxed mb-3" style={{ color: 'var(--text)' }}>
              Normies Chronicles is a living world-building experiment. It reads on-chain activity
              from the Normies NFT collection — every pixel transformation, every burn — and translates
              it into narrative lore through a deterministic rule system.
            </p>
            <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--text)' }}>
              Every holder who interacts with the NormiesCanvas contract becomes an author of the
              Chronicle. Their actions fold into the expanding myth of the Grid — a world that grows
              because the community does.
            </p>
          </section>

          <div className="border-t mb-10" style={{ borderColor: 'var(--border)' }} />

          {/* normies collection */}
          <section className="mb-10">
            <p className="font-mono text-2xs uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>the normies collection</p>
            <p className="font-mono text-xs leading-relaxed mb-4" style={{ color: 'var(--text)' }}>
              Normies is a collection of 10,000 generative pixel faces fully stored on Ethereum mainnet.
              Not on IPFS. Not on a server. On-chain — the art lives in the contract itself, encoded
              as 200 bytes per Normie (1 bit per pixel, 1,600 pixels, 40×40 grid). No company
              controls it. No server can take it down. It exists as long as Ethereum exists.
            </p>
            <p className="font-mono text-xs leading-relaxed mb-4" style={{ color: 'var(--text)' }}>
              Each face is generated from 8 trait categories — Type, Gender, Age, Hair Style,
              Facial Feature, Eyes, Expression, and Accessory — producing a monochrome portrait
              that is simple by design and impossible to replicate. Four Types anchor the collection:
              Human, Cat, Alien, and Agent. Everything else varies within those archetypes.
            </p>
            <p className="font-mono text-xs leading-relaxed mb-4" style={{ color: 'var(--text)' }}>
              A significant number of Normies have been burned — sacrificed by holders to
              transfer their action points to another Normie. Burning is not destruction: the
              burned token is sent to a dead address, permanently out of circulation, its action
              points absorbed into the recipient. The surviving Normie levels up. The burned one
              becomes part of the Chronicle — a sacrifice the record keeps forever. Every burn
              the Chronicle tracks is one fewer Normie in existence, and one more story in the Grid.
            </p>
            <p className="font-mono text-xs leading-relaxed mb-5" style={{ color: 'var(--text)' }}>
              Action points power the NormiesCanvas — the system that lets holders edit their
              Normie pixel by pixel, directly on-chain. Each edit is a PixelsTransformed event,
              permanent and public. The original face is preserved in storage; the canvas layer
              sits on top of it as an XOR transform. Both exist simultaneously: what a Normie was
              and what it has become are both true, both on-chain, both part of the record.
            </p>

            <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-5">
              {[
                ['original supply', '10,000 unique faces'],
                ['blockchain', 'ethereum mainnet'],
                ['storage', 'fully on-chain · 200 bytes each'],
                ['standard', 'ERC-721C'],
                ['license', 'cc0 — public domain'],
                ['canvas', '40×40 pixel grid per face'],
                ['types', 'Human · Cat · Alien · Agent'],
                ['trait categories', '8 categories per face'],
                ['mechanics', 'burn-to-earn action points'],
                ['canvas contract', 'NormiesCanvas'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="font-mono text-2xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{k}</p>
                  <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--text)' }}>{v}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <a href="https://normies.art" target="_blank" rel="noopener noreferrer"
                className="font-mono text-xs underline underline-offset-4 transition-opacity hover:opacity-60"
                style={{ color: 'var(--text)' }}>
                normies.art →
              </a>
              <a href="https://api.normies.art" target="_blank" rel="noopener noreferrer"
                className="font-mono text-xs underline underline-offset-4 transition-opacity hover:opacity-60"
                style={{ color: 'var(--muted)' }}>
                api.normies.art →
              </a>
            </div>
          </section>

          <div className="border-t mb-10" style={{ borderColor: 'var(--border)' }} />

          {/* forward thinking */}
          <section className="mb-10">
            <p className="font-mono text-2xs uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>forward-thinking</p>
            <p className="font-mono text-xs leading-relaxed mb-3" style={{ color: 'var(--text)' }}>
              normies.art is exactly what it should be — clean, fast, and completely out of the
              way. No bloat, no marketing copy, no roadmap theater. You arrive, you see the faces,
              you understand immediately what this is. That simplicity is a design decision as
              deliberate as any in the contracts themselves. A project confident enough in its
              infrastructure to let the work speak for itself doesn't need a landing page full
              of promises. It just needs one that works. normies.art works.
            </p>
            <p className="font-mono text-xs leading-relaxed mb-3" style={{ color: 'var(--text)' }}>
              The accessibility is real too — not just visual simplicity, but structural
              openness. The API is public and documented. The contracts are verified and readable.
              The pixel data is available for any token, any time, with a single GET request.
              A developer can build something on top of Normies in an afternoon without asking
              anyone's permission. That's unusual. Most projects create dependency; Normies
              creates capability.
            </p>
            <p className="font-mono text-xs leading-relaxed mb-3" style={{ color: 'var(--text)' }}>
              What follows from that design is a community of builders. Every day, someone is
              shipping something new — pixel history trackers, rarity dashboards, trait explorers,
              live canvas feeds, generative tools built on top of the faces, games that use the
              on-chain data as game state. None of it was assigned. None of it was promised in
              a whitepaper. It happens because the infrastructure invites it and the license
              permits it, and because the people who hold Normies are the kind of people who
              build things when they see infrastructure worth building on.
            </p>
            <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--text)' }}>
              This Chronicle is part of that pattern. It exists because the collection was
              built to make tools like this not just possible but easy — public events, public
              data, no gatekeeping, no permissions required. The community is the product roadmap.
              It always has been.
            </p>
          </section>

          <div className="border-t mb-10" style={{ borderColor: 'var(--border)' }} />

          {/* built by */}
          <section className="mb-10">
            <p className="font-mono text-2xs uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>built by</p>
            <p className="font-mono text-xs leading-relaxed mb-4" style={{ color: 'var(--text)' }}>
              <a href="https://x.com/aster0x" target="_blank" rel="noopener noreferrer"
                className="underline underline-offset-4 transition-opacity hover:opacity-60">
                @aster0x
              </a>
              {' '}is an independent developer and Normies holder who builds tools for the collection.
              Normies Chronicles is one of them.
            </p>
            <p className="font-mono text-xs leading-relaxed mb-4" style={{ color: 'var(--text)' }}>
              @aster0x also built the{' '}
              <a href="https://normiesarchive.vercel.app" target="_blank" rel="noopener noreferrer"
                className="underline underline-offset-4 transition-opacity hover:opacity-60">
                Normies Pixel Archive
              </a>
              {' '}— the complete on-chain pixel history of all 10,000 Normies. Leaderboards for
              most pixels transformed, spotlight on the most dramatic upgrades, the full record of
              every transformation ever made, and the Latest Works feed showing the newest edits
              in real time. Both tools are open, free, and built because the collection makes
              building worthwhile.
            </p>
          </section>

        </div>
        <Footer />
      </main>
    </>
  )
}
