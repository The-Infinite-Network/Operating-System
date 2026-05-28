import { useState } from "react";

type IePageId = "home" | "about" | "ventures" | "contact";
type FfcPageId = "home" | "services" | "clients" | "contact";

export function InfiniteEarthPublicSite() {
  const [page, setPage] = useState<IePageId>("home");

  return (
    <div className="theme-ie mt-4 space-y-4">
      <header className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-[color:var(--ie-accent)] flex items-center justify-center text-[var(--ie-bg)] font-semibold">
            IE
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-[var(--ie-muted)]">
              Infinite Earth
            </p>
            <h1 className="text-lg font-semibold text-[var(--ie-text)]">
              Holding spine for the network
            </h1>
          </div>
        </div>
        <nav className="flex flex-wrap gap-2 text-[11px]">
          {(["home", "about", "ventures", "contact"] as IePageId[]).map(
            (id) => (
              <button
                key={id}
                type="button"
                onClick={() => setPage(id)}
                className={`px-3 py-1.5 rounded-full border text-xs ${
                  page === id
                    ? "border-[var(--ie-accent)] text-[var(--ie-accent)]"
                    : "border-[var(--ie-border)] text-[var(--ie-muted)] hover:text-[var(--ie-text)] hover:border-[var(--ie-accent)]"
                }`}
              >
                {id === "home"
                  ? "Home"
                  : id === "about"
                  ? "About"
                  : id === "ventures"
                  ? "Ventures"
                  : "Contact"}
              </button>
            )
          )}
        </nav>
      </header>

      {page === "home" && <IeHome />}
      {page === "about" && <IeAbout />}
      {page === "ventures" && <IeVentures />}
      {page === "contact" && <IeContact />}
    </div>
  );
}

function IeHome() {
  return (
    <section className="card p-5 space-y-3">
      <h2 className="text-lg font-semibold text-[var(--ie-text)]">
        A small, durable holding company
      </h2>
      <p className="text-[11px] text-[var(--ie-muted)]">
        Infinite Earth Holdings, LLC is the spine for a small ecosystem of
        ventures. It focuses on clear structure, simple governance, and
        systems that let operators move quickly without losing sovereignty.
      </p>
      <div className="grid gap-3 md:grid-cols-3 text-[11px]">
        <div className="rounded-lg border border-[var(--ie-border)] bg-[color:rgba(15,30,46,0.9)] p-3">
          <h3 className="font-semibold text-[var(--ie-text)] mb-1">
            Governance
          </h3>
          <p className="text-[var(--ie-muted)]">
            Simple charters, decision paths, and agreements that fit into one
            briefing.
          </p>
        </div>
        <div className="rounded-lg border border-[var(--ie-border)] bg-[color:rgba(15,30,46,0.9)] p-3">
          <h3 className="font-semibold text-[var(--ie-text)] mb-1">
            Durability
          </h3>
          <p className="text-[var(--ie-muted)]">
            Systems and entity maps designed to withstand volatility without
            needless bureaucracy.
          </p>
        </div>
        <div className="rounded-lg border border-[var(--ie-border)] bg-[color:rgba(15,30,46,0.9)] p-3">
          <h3 className="font-semibold text-[var(--ie-text)] mb-1">
            Ventures
          </h3>
          <p className="text-[var(--ie-muted)]">
            Portfolio companies like Fulcrum Fortress Consulting and Crumb N
            Get It, each with its own operators and domain.
          </p>
        </div>
      </div>
    </section>
  );
}

function IeAbout() {
  return (
    <section className="card p-5 space-y-3">
      <h2 className="text-lg font-semibold text-[var(--ie-text)]">
        About Infinite Earth
      </h2>
      <p className="text-[11px] text-[var(--ie-muted)]">
        Infinite Earth exists to keep the map of entities, agreements, and
        responsibilities coherent. It is intentionally small: a clear cap
        table, a short stack of agreements, and governance that is legible to
        the people doing the work.
      </p>
      <p className="text-[11px] text-[var(--ie-muted)]">
        The holding company does not replace local operators. Instead, it
        provides scaffolding: structure, risk management, and long-horizon
        thinking so that individual ventures can stay focused on their craft.
      </p>
    </section>
  );
}

function IeVentures() {
  return (
    <section className="card p-5 space-y-3">
      <h2 className="text-lg font-semibold text-[var(--ie-text)]">
        Ventures
      </h2>
      <p className="text-[11px] text-[var(--ie-muted)]">
        The current ecosystem includes a small set of ventures with aligned
        principles.
      </p>
      <div className="grid gap-3 md:grid-cols-2 text-[11px]">
        <div className="rounded-lg border border-[var(--ie-border)] bg-[color:rgba(11,14,17,0.9)] p-3">
          <h3 className="font-semibold text-[var(--ie-text)] mb-1">
            Fulcrum Fortress Consulting
          </h3>
          <p className="text-[var(--ie-muted)] mb-2">
            Governance, systems, and operational diagnostics work for teams
            that want to be durable and sovereign.
          </p>
          <p className="text-[10px] text-[var(--ie-muted)]">
            Public pages: Home, Services, Clients, Contact.
          </p>
        </div>
        <div className="rounded-lg border border-[var(--ie-border)] bg-[color:rgba(11,14,17,0.9)] p-3">
          <h3 className="font-semibold text-[var(--ie-text)] mb-1">
            Crumb N Get It
          </h3>
          <p className="text-[var(--ie-muted)] mb-2">
            A bakery venture and live testbed for how the network handles
            seasonal menus, operators, and local law.
          </p>
          <p className="text-[10px] text-[var(--ie-muted)]">
            Public pages: guest menu, admin portal, and seasonal publishing.
          </p>
        </div>
      </div>
    </section>
  );
}

function IeContact() {
  return (
    <section className="card p-5 space-y-3">
      <h2 className="text-lg font-semibold text-[var(--ie-text)]">
        Contact
      </h2>
      <p className="text-[11px] text-[var(--ie-muted)]">
        Infinite Earth is deliberately low-volume. If you{"'"}re working on
        something that might fit the mandate, you can share a short brief.
      </p>
      <form
        className="space-y-2 text-[11px]"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="space-y-1">
          <label className="block text-[10px] text-[var(--ie-muted)]">
            Email
          </label>
          <input
            type="email"
            className="w-full rounded-md border border-[var(--ie-border)] bg-[color:rgba(15,30,46,0.85)] px-3 py-1.5 text-[11px] outline-none focus:border-[var(--ie-accent)]"
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] text-[var(--ie-muted)]">
            Brief
          </label>
          <textarea
            rows={3}
            className="w-full rounded-md border border-[var(--ie-border)] bg-[color:rgba(15,30,46,0.85)] px-3 py-1.5 text-[11px] outline-none focus:border-[var(--ie-accent)]"
            placeholder="One paragraph on what you're building and why you think it aligns."
            required
          />
        </div>
        <button type="submit" className="btn-primary text-xs">
          Send
        </button>
      </form>
    </section>
  );
}

export function FfcPublicSite() {
  const [page, setPage] = useState<FfcPageId>("home");

  return (
    <div className="theme-ffc mt-4 space-y-4">
      <header className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-[color:var(--ffc-accent)] flex items-center justify-center text-[var(--ffc-bg)] font-semibold">
            F
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-[var(--ffc-muted)]">
              Fulcrum Fortress Consulting
            </p>
            <h1 className="text-lg font-semibold text-[var(--ffc-text)]">
              Governance and systems for operators
            </h1>
          </div>
        </div>
        <nav className="flex flex-wrap gap-2 text-[11px]">
          {(["home", "services", "clients", "contact"] as FfcPageId[]).map(
            (id) => (
              <button
                key={id}
                type="button"
                onClick={() => setPage(id)}
                className={`px-3 py-1.5 rounded-full border text-xs ${
                  page === id
                    ? "border-[var(--ffc-accent)] text-[var(--ffc-accent)]"
                    : "border-[var(--ffc-border)] text-[var(--ffc-muted)] hover:text-[var(--ffc-text)] hover:border-[var(--ffc-accent)]"
                }`}
              >
                {id === "home"
                  ? "Home"
                  : id === "services"
                  ? "Services"
                  : id === "clients"
                  ? "Clients"
                  : "Contact"}
              </button>
            )
          )}
        </nav>
      </header>

      {page === "home" && <FfcHome />}
      {page === "services" && <FfcServices />}
      {page === "clients" && <FfcClients />}
      {page === "contact" && <FfcContact />}
    </div>
  );
}

function FfcHome() {
  return (
    <section className="card p-5 space-y-3">
      <h2 className="text-lg font-semibold text-[var(--ffc-text)]">
        A small bench for big operating problems
      </h2>
      <p className="text-[11px] text-[var(--ffc-muted)]">
        Fulcrum Fortress Consulting works with teams who want clear
        governance, durable systems, and a quiet operating partner instead of
        a loud consultancy.
      </p>
      <div className="grid gap-3 md:grid-cols-3 text-[11px]">
        <div className="rounded-lg border border-[var(--ffc-border)] bg-[color:rgba(17,24,39,0.9)] p-3">
          <h3 className="font-semibold text-[var(--ffc-text)] mb-1">
            Governance
          </h3>
          <p className="text-[var(--ffc-muted)]">
            Decision structures, charters, and cadence design that actually
            get used.
          </p>
        </div>
        <div className="rounded-lg border border-[var(--ffc-border)] bg-[color:rgba(17,24,39,0.9)] p-3">
          <h3 className="font-semibold text-[var(--ffc-text)] mb-1">
            Systems
          </h3>
          <p className="text-[var(--ffc-muted)]">
            Workflows, documentation, and dashboards that tie strategy to the
            daily board.
          </p>
        </div>
        <div className="rounded-lg border border-[var(--ffc-border)] bg-[color:rgba(17,24,39,0.9)] p-3">
          <h3 className="font-semibold text-[var(--ffc-text)] mb-1">
            Ops Partner
          </h3>
          <p className="text-[var(--ffc-muted)]">
            Long-horizon partnership for founders and teams who prefer a
            quiet, steady counterpart.
          </p>
        </div>
      </div>
    </section>
  );
}

function FfcServices() {
  return (
    <section className="card p-5 space-y-3">
      <h2 className="text-lg font-semibold text-[var(--ffc-text)]">
        Services
      </h2>
      <div className="grid gap-3 md:grid-cols-2 text-[11px]">
        <div className="rounded-lg border border-[var(--ffc-border)] bg-[color:rgba(17,24,39,0.9)] p-3">
          <h3 className="font-semibold text-[var(--ffc-text)] mb-1">
            Governance playbooks
          </h3>
          <p className="text-[var(--ffc-muted)]">
            Lightweight, customized governance frameworks with clear roles,
            decision paths, and escalation routes.
          </p>
        </div>
        <div className="rounded-lg border border-[var(--ffc-border)] bg-[color:rgba(17,24,39,0.9)] p-3">
          <h3 className="font-semibold text-[var(--ffc-text)] mb-1">
            Systems &amp; documentation
          </h3>
          <p className="text-[var(--ffc-muted)]">
            Process mapping, critical-path documentation, and operating
            dashboards tuned to your context.
          </p>
        </div>
        <div className="rounded-lg border border-[var(--ffc-border)] bg-[color:rgba(17,24,39,0.9)] p-3">
          <h3 className="font-semibold text-[var(--ffc-text)] mb-1">
            Operational diagnostics
          </h3>
          <p className="text-[var(--ffc-muted)]">
            Short, focused engagements to identify where your system is
            fragile and how to harden it.
          </p>
        </div>
        <div className="rounded-lg border border-[var(--ffc-border)] bg-[color:rgba(17,24,39,0.9)] p-3">
          <h3 className="font-semibold text-[var(--ffc-text)] mb-1">
            Embedded ops partner
          </h3>
          <p className="text-[var(--ffc-muted)]">
            Ongoing, low-volume partnership for complex or high-stakes
            environments.
          </p>
        </div>
      </div>
    </section>
  );
}

function FfcClients() {
  return (
    <section className="card p-5 space-y-3">
      <h2 className="text-lg font-semibold text-[var(--ffc-text)]">
        Clients &amp; people helped
      </h2>
      <p className="text-[11px] text-[var(--ffc-muted)]">
        Work is quiet and often sensitive. The vignettes below are anonymized
        but representative.
      </p>
      <ul className="space-y-2 text-[11px]">
        <li className="rounded-lg border border-[var(--ffc-border)] bg-[color:rgba(17,24,39,0.9)] p-3">
          <h3 className="font-semibold text-[var(--ffc-text)] mb-1">
            Distributed technical collective
          </h3>
          <p className="text-[var(--ffc-muted)]">
            Designed charters, decision cadence, and escalation paths for a
            remote-first engineering group.
          </p>
        </li>
        <li className="rounded-lg border border-[var(--ffc-border)] bg-[color:rgba(17,24,39,0.9)] p-3">
          <h3 className="font-semibold text-[var(--ffc-text)] mb-1">
            Family-operated venture studio
          </h3>
          <p className="text-[var(--ffc-muted)]">
            Structured entities, agreements, and systems across services and
            physical ventures.
          </p>
        </li>
        <li className="rounded-lg border border-[var(--ffc-border)] bg-[color:rgba(17,24,39,0.9)] p-3">
          <h3 className="font-semibold text-[var(--ffc-text)] mb-1">
            Early-stage founder
          </h3>
          <p className="text-[var(--ffc-muted)]">
            Provided live operating support through a critical pivot,
            including reworking governance and sprints.
          </p>
        </li>
      </ul>
    </section>
  );
}

function FfcContact() {
  return (
    <section className="card p-5 space-y-3">
      <h2 className="text-lg font-semibold text-[var(--ffc-text)]">
        Contact
      </h2>
      <p className="text-[11px] text-[var(--ffc-muted)]">
        If your situation sounds close to this mandate and you want help
        thinking through governance or operating changes, you can share a
        brief.
      </p>
      <form
        className="space-y-2 text-[11px]"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="space-y-1">
          <label className="block text-[10px] text-[var(--ffc-muted)]">
            Email
          </label>
          <input
            type="email"
            className="w-full rounded-md border border-[var(--ffc-border)] bg-[color:rgba(17,24,39,0.9)] px-3 py-1.5 text-[11px] outline-none focus:border-[var(--ffc-accent)]"
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] text-[var(--ffc-muted)]">
            Context
          </label>
          <textarea
            rows={3}
            className="w-full rounded-md border border-[var(--ffc-border)] bg-[color:rgba(17,24,39,0.9)] px-3 py-1.5 text-[11px] outline-none focus:border-[var(--ffc-accent)]"
            placeholder="What you're responsible for, where things feel fragile, and what success would look like."
            required
          />
        </div>
        <button type="submit" className="btn-primary text-xs">
          Send
        </button>
      </form>
    </section>
  );
}

