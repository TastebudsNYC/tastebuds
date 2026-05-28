import { Button } from '@/components/app/Button'
import { SiteFooter } from '@/components/app/SiteFooter'
import { TastebudsLogo } from '@/components/TastebudsLogo'

export default function Home() {
  return (
    <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <header className="sticky top-0 z-40 border-b border-[color:var(--nav-border)] bg-[color:var(--nav-bg)] text-white shadow-[0_18px_42px_rgba(0,20,38,0.22)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 lg:px-8">
          <TastebudsLogo size="sm" theme="dark" />
          <nav className="hidden items-center gap-8 text-sm font-medium text-[#d8e2ec] lg:flex">
            <a href="#how-it-works">How it works</a>
            <a href="#restaurant-match">Restaurants</a>
            <a href="#hosted-table">Events</a>
            <a href="#for-venues">For venues</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button
              className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              href="/login"
              variant="ghost"
            >
              Sign in
            </Button>
            <Button href="/signup">Start your taste profile</Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
          <div className="rounded-[2rem] border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-8 shadow-[0_24px_60px_rgba(74,31,20,0.08)] lg:p-10">
            <TastebudsLogo showTagline size="sm" theme="light" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-strong)]">
              Taste-led dinners
            </p>
            <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)] sm:text-6xl">
              Find the table you&apos;d actually say yes to.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[color:var(--text-secondary)]">
              Tastebuds recommends restaurants around your taste, budget and social vibe - then shows you small venue-hosted tables when they open.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/signup">Start your taste profile</Button>
              <Button href="#how-it-works" variant="secondary">
                See how it works
              </Button>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                'Matched venues, not random listings.',
                'Hosted tables, not user-created meetups.',
                'Small groups, not massive socials.',
              ].map((item) => (
                <div
                  className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] p-4 text-sm leading-6 text-[color:var(--text-secondary)]"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[2rem] border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-5 shadow-[0_18px_44px_rgba(74,31,20,0.07)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--accent-strong)]">
                    Matched venue
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">Banter NYC</h2>
                  <p className="mt-2 text-sm text-[color:var(--text-secondary)]">88/100 match</p>
                </div>
                <span className="rounded-full bg-[color:var(--status-bg)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--status-text)]">
                  Watching
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-[color:var(--text-secondary)]">
                Bright, casual and social - useful when you want the night to feel easy.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['Italian', '$$', 'Casual', 'Social'].map((tag) => (
                  <span
                    className="rounded-full border border-[color:var(--accent-border)] bg-[color:var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-[color:var(--accent-strong)]"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-5">
                <Button href="/signup" size="sm">
                  Save venue
                </Button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-5 shadow-[0_18px_44px_rgba(74,31,20,0.07)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--accent-strong)]">
                    Hosted table
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">Curry Night</h2>
                  <p className="mt-2 text-sm font-medium text-[color:var(--foreground)]">Paisley / Midtown</p>
                  <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Fri, May 15 / Table for 6</p>
                </div>
                <span className="rounded-full bg-[color:var(--status-bg)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--status-text)]">
                  Open table
                </span>
              </div>
              <p className="mt-4 text-sm text-[color:var(--text-secondary)]">75/100 match</p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--text-secondary)]">
                Not your usual cuisine, but the relaxed table setup fits your social, sit-down style.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <div className="rounded-2xl bg-[color:var(--surface-soft)] px-4 py-3 text-sm text-[color:var(--text-secondary)]">6 seats available</div>
                <div className="rounded-2xl bg-[color:var(--surface-soft)] px-4 py-3 text-sm text-[color:var(--text-secondary)]">Hosted by Paisley</div>
              </div>
              <div className="mt-5">
                <Button href="/signup" size="sm">
                  Join table
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.75rem] border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] p-5 shadow-[0_18px_44px_rgba(74,31,20,0.05)]">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--accent-strong)]">Taste chips</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Chill', 'Moderate spend', 'Midtown', 'Restaurant', 'Easy conversation'].map((tag) => (
                    <span
                      className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface)] px-3 py-1.5 text-xs font-semibold text-[color:var(--foreground)]"
                      key={tag}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-[1.75rem] border border-[color:var(--nav-bg)] bg-[color:var(--nav-bg)] p-5 text-white shadow-[0_18px_44px_rgba(0,20,38,0.18)]">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--accent)]">Watchlist</p>
                <p className="mt-3 text-lg font-semibold text-white">Save the venues you&apos;d go to.</p>
                <p className="mt-2 text-sm leading-6 text-[#d8e2ec]">
                  We&apos;ll show you tables when they open.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-2 lg:px-8" id="how-it-works">
        <div className="rounded-[2rem] border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-8 shadow-[0_18px_44px_rgba(74,31,20,0.07)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-strong)]">How it works</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]">How it works</h2>
          <div className="mt-6 space-y-5">
            <div>
              <p className="text-sm font-semibold text-[color:var(--foreground)]">1. Tell us your taste</p>
              <p className="mt-1 text-sm leading-6 text-[color:var(--text-secondary)]">Cuisine, budget, vibe, location and the kind of night you&apos;re after.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[color:var(--foreground)]">2. Save places you&apos;d actually attend</p>
              <p className="mt-1 text-sm leading-6 text-[color:var(--text-secondary)]">Your saved venues become your watchlist.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[color:var(--foreground)]">3. Join tables when they open</p>
              <p className="mt-1 text-sm leading-6 text-[color:var(--text-secondary)]">Venue-hosted dinners appear when they fit your profile.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] p-8 shadow-[0_18px_44px_rgba(74,31,20,0.05)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-strong)]">Not another restaurant list</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]">Not another restaurant list.</h2>
          <p className="mt-5 text-base leading-8 text-[color:var(--text-secondary)]">
            Tastebuds starts with what you&apos;d actually say yes to. No endless scrolling, no awkward group chat, no user-created event admin.
          </p>
          <div className="mt-6 grid gap-3">
            {[
              'Matched venues, not random listings.',
              'Hosted tables, not user-created meetups.',
              'Small groups, not massive socials.',
            ].map((item) => (
              <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] px-4 py-4 text-sm text-[color:var(--text-secondary)]" key={item}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-2 lg:px-8">
        <div className="rounded-[2rem] border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-8 shadow-[0_18px_44px_rgba(74,31,20,0.07)]" id="restaurant-match">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-strong)]">Example restaurant match</p>
          <h2 className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">Banter NYC</h2>
          <p className="mt-2 text-sm text-[color:var(--text-secondary)]">88/100 match</p>
          <p className="mt-4 text-sm leading-7 text-[color:var(--text-secondary)]">
            Bright, casual and social - useful when you want the night to feel easy.
          </p>
          <div className="mt-5">
            <Button href="/signup" size="sm">
              Save venue
            </Button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-8 shadow-[0_18px_44px_rgba(74,31,20,0.07)]" id="hosted-table">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-strong)]">Example hosted table</p>
          <h2 className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">Curry Night</h2>
          <p className="mt-2 text-sm font-medium text-[color:var(--foreground)]">Paisley / Midtown</p>
          <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Fri, May 15 / Table for 6</p>
          <p className="mt-3 text-sm text-[color:var(--text-secondary)]">75/100 match</p>
          <p className="mt-4 text-sm leading-7 text-[color:var(--text-secondary)]">
            Not your usual cuisine, but the relaxed table setup fits your social, sit-down style.
          </p>
          <div className="mt-5">
            <Button href="/signup" size="sm">
              Join table
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
        <div className="rounded-[2rem] border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] p-8 shadow-[0_18px_44px_rgba(74,31,20,0.05)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-strong)]">Built for low-pressure plans</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]">Built for low-pressure plans.</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              'Venue-hosted tables',
              'Small groups',
              'Clear details before joining',
              'No pressure to join every match',
            ].map((item) => (
              <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] px-4 py-4 text-sm text-[color:var(--text-secondary)]" key={item}>
                {item}
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm leading-7 text-[color:var(--text-secondary)]">
            You choose the venues you&apos;d actually attend. We only surface tables that fit.
          </p>
        </div>

        <div className="rounded-[2rem] border border-[color:var(--nav-bg)] bg-[color:var(--nav-bg)] p-8 text-white shadow-[0_18px_44px_rgba(0,20,38,0.18)]" id="for-venues">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">For venues</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">For venues</h2>
          <p className="mt-4 text-sm leading-7 text-[#d8e2ec]">
            Host small tables for matched diners who already want to be there.
          </p>
          <div className="mt-6">
            <Button href="/signup">Partner with Tastebuds</Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        <div className="rounded-[2rem] border border-[color:var(--border-soft)] bg-[color:var(--surface)] px-8 py-10 shadow-[0_18px_44px_rgba(74,31,20,0.07)]">
          <h2 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]">
            Start with the places you&apos;d actually go.
          </h2>
          <div className="mt-6">
            <Button href="/signup">Create your taste profile</Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
