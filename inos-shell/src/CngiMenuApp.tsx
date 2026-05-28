import React, { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  appendChangeLog,
  getCurrentUser,
  loadCngiState,
  saveCngiState,
  setCurrentUser,
  type CngiRole,
  type CngiState,
  type CngiUser,
  type MenuItem,
  type MenuSeason,
} from "./cngiState";

type AdminTab = "seasons" | "items" | "log";

function formatMoneyParts(cents: number): { amount: string; unit: string } {
  const dollars = (cents / 100).toFixed(2);
  return { amount: `$${dollars}`, unit: "" };
}

function hasRole(user: CngiUser | null, role: CngiRole): boolean {
  if (!user) return false;
  const ladder: CngiRole[] = ["VIEWER", "EDITOR", "ADMIN"];
  return ladder.indexOf(user.role) >= ladder.indexOf(role);
}

function activeSeason(state: CngiState): MenuSeason | null {
  return state.seasons.find((s) => s.active && s.status === "Published") || null;
}

export function CngiMenuShell() {
  const [state, setState] = useState<CngiState>(() => loadCngiState());
  const [user, setUser] = useState<CngiUser | null>(() => getCurrentUser());
  const [adminTab, setAdminTab] = useState<AdminTab>("seasons");
  const [loginEmail, setLoginEmail] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedAdminItemIds, setSelectedAdminItemIds] = useState<string[]>([]);

  useEffect(() => {
    saveCngiState(state);
  }, [state]);

  const season = useMemo(() => activeSeason(state), [state]);

  useEffect(() => {
    if (!selectedCategoryId && state.categories.length) {
      const first = [...state.categories].sort(
        (a, b) => a.sortOrder - b.sortOrder
      )[0];
      setSelectedCategoryId(first?.id || null);
    }
  }, [state.categories, selectedCategoryId]);

  const guestItems = useMemo(() => {
    if (!season) return [];
    return state.items
      .filter(
        (item) =>
          item.seasonId === season.id && item.status === "Published"
      )
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [state.items, season]);

  const guestCategories = useMemo(() => {
    if (!season) return [];
    const used = new Set(guestItems.map((i) => i.categoryId));
    return state.categories
      .filter((c) => used.has(c.id))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [guestItems, state.categories, season]);

  const selectedItem: MenuItem | undefined = state.items.find(
    (i) => i.id === selectedItemId
  );

  const priceLabelFor = (item: MenuItem | undefined) => {
    if (!item) return null;
    const { amount } = formatMoneyParts(item.priceCents);
    const unit =
      item.tags?.find((t) => t.startsWith("/")) || "";
    return { amount, unit };
  };

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    const email = loginEmail.trim().toLowerCase();
    if (!email) return;

    setState((prev) => {
      let existing = prev.users.find(
        (u) => u.email.toLowerCase() === email
      );
      let next = prev;
      if (!existing) {
        existing = {
          id: `user_${crypto.randomUUID()}`,
          email,
          role: email === "admin@cngi.test" ? "ADMIN" : "VIEWER",
          createdAt: new Date().toISOString(),
        };
        next = { ...prev, users: [...prev.users, existing] };
      }

      setUser(existing);
      setCurrentUser(existing);
      setLoginEmail("");
      return next;
    });
  };

  const setActiveSeasonId = (id: string) => {
    setState((prev) => {
      const seasons = prev.seasons.map((s) => ({
        ...s,
        active: s.id === id && s.status === "Published",
      }));
      const updated = { ...prev, seasons };
      return appendChangeLog(updated, {
        actorUserId: user?.id || null,
        entityType: "MenuSeason",
        entityId: id,
        action: "Set active season",
        diffJson: { activeSeasonId: id },
      });
    });
  };

  const upsertSeason = (partial: Partial<MenuSeason>) => {
    setState((prev) => {
      const found = partial.id
        ? prev.seasons.find((s) => s.id === partial.id)
        : undefined;
      let seasons: MenuSeason[];
      if (found) {
        seasons = prev.seasons.map((s) =>
          s.id === found.id ? { ...found, ...partial } : s
        );
      } else {
        const created: MenuSeason = {
          id: `season_${crypto.randomUUID()}`,
          name: partial.name || "Untitled Season",
          status: partial.status || "Draft",
          active: false,
          startsAt: partial.startsAt || null,
          endsAt: partial.endsAt || null,
          createdAt: new Date().toISOString(),
        };
        seasons = [...prev.seasons, created];
      }
      const updated = { ...prev, seasons };
      return appendChangeLog(updated, {
        actorUserId: user?.id || null,
        entityType: "MenuSeason",
        entityId:
          partial.id || seasons[seasons.length - 1]?.id || "unknown",
        action: found ? "Update season" : "Create season",
        diffJson: partial,
      });
    });
  };

  const upsertItem = (partial: Partial<MenuItem>) => {
    setState((prev) => {
      if (!partial.name || !partial.seasonId || !partial.categoryId) {
        return prev;
      }
      const found = partial.id
        ? prev.items.find((i) => i.id === partial.id)
        : undefined;
      let items: MenuItem[];
      if (found) {
        const next: MenuItem = {
          ...found,
          ...partial,
          updatedAt: new Date().toISOString(),
        };
        items = prev.items.map((i) => (i.id === found.id ? next : i));
      } else {
        const countInBucket = prev.items.filter(
          (i) =>
            i.seasonId === partial.seasonId &&
            i.categoryId === partial.categoryId
        ).length;
        const created: MenuItem = {
          id: `item_${crypto.randomUUID()}`,
          seasonId: partial.seasonId,
          categoryId: partial.categoryId,
          name: partial.name,
          description: partial.description || "",
          priceCents: partial.priceCents ?? 0,
          status: partial.status || "Draft",
          sortOrder: countInBucket + 1,
          imageUrl: partial.imageUrl || null,
          tags: partial.tags || [],
          allergens: partial.allergens || [],
          availabilityNote: partial.availabilityNote || null,
          updatedAt: new Date().toISOString(),
        };
        items = [...prev.items, created];
      }
      const updated = { ...prev, items };
      return appendChangeLog(updated, {
        actorUserId: user?.id || null,
        entityType: "MenuItem",
        entityId:
          partial.id || updated.items[updated.items.length - 1]?.id,
        action: found ? "Update item" : "Create item",
        diffJson: partial,
      });
    });
  };

  const bulkUpdateItems = (payload: {
    itemIds: string[];
    status?: MenuItem["status"];
    moveToSeasonId?: string;
  }) => {
    if (!payload.itemIds.length) return;
    setState((prev) => {
      const items = prev.items.map((item) => {
        if (!payload.itemIds.includes(item.id)) return item;
        let next = { ...item };
        if (payload.status) next.status = payload.status;
        if (payload.moveToSeasonId) next.seasonId = payload.moveToSeasonId;
        return next;
      });
      const updated = { ...prev, items };
      return appendChangeLog(updated, {
        actorUserId: user?.id || null,
        entityType: "MenuItem",
        entityId: payload.itemIds[0],
        action: "Bulk update items",
        diffJson: payload,
      });
    });
  };

  const toggleAdminSelection = (id: string) => {
    setSelectedAdminItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="theme-cngi mt-4 space-y-4">
      <header className="card p-6 flex flex-wrap items-center justify-between gap-4 border-b-0 rounded-b-none bg-gradient-to-r from-[var(--cngi-surface)] to-[var(--cngi-bg)]">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-[color:var(--cngi-accent)] shadow-lg flex items-center justify-center text-[var(--cngi-text)] font-bold text-xl ring-4 ring-[var(--cngi-accent)]/10">
            C
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--cngi-muted)] opacity-80">
              Crumb N Get It
            </p>
            <h1 className="text-2xl font-bold text-[var(--cngi-text)] tracking-tight">
              Seasonal Guest Menu
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {season && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--cngi-accent)]/30 bg-[var(--cngi-accent)]/10">
              <span className="h-2 w-2 rounded-full bg-[var(--cngi-accent)] animate-pulse" />
              <span className="text-[11px] font-bold text-[var(--cngi-accent)] uppercase tracking-wider">
                {season.name}  -  LIVE
              </span>
            </div>
          )}
          {!season && (
            <div className="pill border-dashed opacity-50">No active season</div>
          )}
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1fr,350px]">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sticky top-[72px] z-20 bg-[var(--cngi-bg)]/80 backdrop-blur-md py-4 -mt-4">
            <div className="flex items-center justify-between border-b border-[var(--cngi-border)]/50 pb-2">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--cngi-muted)]">
                Categories
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {guestCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`tab-pill whitespace-nowrap ${selectedCategoryId === cat.id ? "active" : ""}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {guestItems
              .filter(
                (item) =>
                  !selectedCategoryId ||
                  item.categoryId === selectedCategoryId
              )
              .map((item) => {
                const price = priceLabelFor(item);
                const isValentine = item.tags?.includes("Valentine");
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItemId(item.id)}
                    className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-[var(--cngi-surface)] to-[var(--cngi-bg)] p-5 text-left transition-all hover:border-[var(--cngi-accent)] hover:shadow-2xl hover:-translate-y-1 ${item.id === selectedItemId ? "border-[var(--cngi-accent)] ring-2 ring-[var(--cngi-accent)]/20 shadow-lg" : "border-[var(--cngi-border)]"
                      }`}
                  >
                    {isValentine && (
                      <div className="absolute right-0 top-0 px-2.5 py-1 bg-[var(--cngi-accent)] text-[8px] font-black uppercase tracking-tighter text-white rounded-bl-lg shadow-md z-10 flex items-center gap-1">
                        <span> - </span> Valentine
                      </div>
                    )}
                    {item.tags?.includes("Winter") && !isValentine && (
                      <div className="absolute right-0 top-0 px-2.5 py-1 bg-blue-500 text-[8px] font-black uppercase tracking-tighter text-white rounded-bl-lg shadow-md z-10"> -  Winter
                      </div>
                    )}

                    <div className="flex flex-col h-full justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--cngi-muted)]">
                            {state.categories.find(c => c.id === item.categoryId)?.name || "Item"}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[var(--cngi-text)] leading-tight group-hover:text-[var(--cngi-accent-2)] transition-colors pr-12">
                          {item.name}
                        </h3>
                        <p className="text-[11px] text-[var(--cngi-muted)] line-clamp-2 leading-relaxed opacity-80">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-[var(--cngi-border)]/30">
                        {price && (
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-[var(--cngi-accent-2)] tracking-tight">
                              {price.amount}
                            </span>
                            {price.unit && <span className="text-[9px] font-bold uppercase opacity-50 text-[var(--cngi-muted)]">{price.unit.replace('/', '').trim()}</span>}
                          </div>
                        )}
                        <div className="text-[9px] font-bold text-[var(--cngi-accent)] opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all uppercase tracking-widest">
                          View Details &rarr;
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            {!guestItems.length && (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-[var(--cngi-border)] rounded-2xl">
                <p className="text-sm text-[var(--cngi-muted)]">
                  No published items for the active season yet.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card bg-black/20 p-6 space-y-4 sticky top-4">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--cngi-muted)] border-b border-[var(--cngi-border)] pb-2">
              Item Detail
            </h3>
            {selectedItem ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-[var(--cngi-text)] leading-tight">
                      {selectedItem.name}
                    </h3>
                    <p className="text-xs text-[var(--cngi-muted)] leading-relaxed">
                      {selectedItem.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between py-3 border-y border-[var(--cngi-border)]/50">
                    <span className="text-xs font-semibold text-[var(--cngi-muted)]">Starting Price</span>
                    {(() => {
                      const price = priceLabelFor(selectedItem);
                      if (!price) return null;
                      return (
                        <span className="text-lg font-bold text-[var(--cngi-accent-2)]">
                          {price.amount}
                          {price.unit && <span className="text-xs ml-0.5 opacity-70">{price.unit}</span>}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="space-y-3">
                    {selectedItem.allergens && selectedItem.allergens.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.allergens.map(a => (
                          <span key={a} className="px-2 py-0.5 rounded bg-red-900/20 border border-red-900/30 text-[9px] font-bold text-red-300 uppercase tracking-tighter">
                            {a}
                          </span>
                        ))}
                      </div>
                    )}
                    {selectedItem.availabilityNote && (
                      <p className="text-[10px] italic text-[var(--cngi-muted)] opacity-80">
                        {selectedItem.availabilityNote}
                      </p>
                    )}
                  </div>

                  <button type="button" className="btn-primary w-full py-4 text-base font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all ring-4 ring-[var(--cngi-accent)]/10">
                    Add to order
                  </button>
                  <p className="text-[10px] text-center text-[var(--cngi-muted)] font-medium opacity-60">
                    Pricing and availability accurate for local pickup.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="text-4xl mb-4 opacity-20">-</div>
                <p className="text-xs text-[var(--cngi-muted)] px-4">
                  Select a delicious item from the menu to see full details and start your order.
                </p>
              </div>
            )}
          </div>

          <div className="card bg-[var(--cngi-accent)]/5 p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--cngi-accent)]">
              Heartline &amp; Birthday Club
            </h3>
            <p className="text-xs text-[var(--cngi-muted)] leading-relaxed">
              Don{"'"}t miss our next seasonal drop. Join the Heartline for early pre-order access and special Valentine previews.
            </p>
            <form
              className="space-y-3"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                className="w-full rounded-xl border border-[var(--cngi-border)] bg-black/40 px-4 py-2.5 text-sm text-[var(--cngi-text)] outline-none focus:border-[var(--cngi-accent)] transition-all"
                placeholder="you@example.com"
                required
              />
              <button type="submit" className="btn-secondary w-full py-2.5 hover:bg-[var(--cngi-accent)] hover:text-white hover:border-[var(--cngi-accent)]">
                Join Heartline
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-[var(--cngi-muted)]">
              Admin Portal
            </p>
            <h3 className="text-sm font-black text-[var(--cngi-text)] flex items-center gap-2">
              Management Dashboard
              {season && (
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${season.status === 'Published' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                  {season.name}  -  {season.status}
                </span>
              )}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            {user ? (
              <>
                <span className="pill">
                  {user.email}  -  {user.role}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setUser(null);
                    setCurrentUser(null);
                  }}
                  className="rounded-full border border-[var(--cngi-border)] px-3 py-1 text-[11px] text-[var(--cngi-muted)] hover:border-[var(--cngi-accent)] hover:text-[var(--cngi-accent)]"
                >
                  Sign out
                </button>
              </>
            ) : (
              <form
                onSubmit={handleLogin}
                className="flex flex-wrap items-center gap-2"
              >
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@cngi.test"
                  className="rounded-full border border-[var(--cngi-border)] bg-[color:rgba(0,0,0,0.45)] px-3 py-1.5 text-[11px] outline-none focus:border-[var(--cngi-accent)]"
                  required
                />
                <button type="submit" className="btn-primary text-xs">
                  Sign in
                </button>
              </form>
            )}
          </div>
        </div>

        {user && hasRole(user, "EDITOR") ? (
          <>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setAdminTab("seasons")}
                className={`px-3 py-1.5 rounded-full border ${adminTab === "seasons"
                  ? "border-[var(--cngi-accent)] text-[var(--cngi-accent)]"
                  : "border-[var(--cngi-border)] text-[var(--cngi-muted)] hover:text-[var(--cngi-text)] hover:border-[var(--cngi-accent)]"
                  }`}
              >
                Seasons
              </button>
              <button
                type="button"
                onClick={() => setAdminTab("items")}
                className={`px-3 py-1.5 rounded-full border ${adminTab === "items"
                  ? "border-[var(--cngi-accent)] text-[var(--cngi-accent)]"
                  : "border-[var(--cngi-border)] text-[var(--cngi-muted)] hover:text-[var(--cngi-text)] hover:border-[var(--cngi-accent)]"
                  }`}
              >
                Menu items
              </button>
              <button
                type="button"
                onClick={() => setAdminTab("log")}
                className={`px-3 py-1.5 rounded-full border ${adminTab === "log"
                  ? "border-[var(--cngi-accent)] text-[var(--cngi-accent)]"
                  : "border-[var(--cngi-border)] text-[var(--cngi-muted)] hover:text-[var(--cngi-text)] hover:border-[var(--cngi-accent)]"
                  }`}
              >
                Change log
              </button>
            </div>

            {adminTab === "seasons" && (
              <CngiSeasonsAdmin
                state={state}
                user={user}
                setActiveSeasonId={setActiveSeasonId}
                upsertSeason={upsertSeason}
              />
            )}
            {adminTab === "items" && (
              <CngiItemsAdmin
                state={state}
                user={user}
                selectedIds={selectedAdminItemIds}
                toggleSelected={toggleAdminSelection}
                upsertItem={upsertItem}
                bulkUpdateItems={bulkUpdateItems}
              />
            )}
            {adminTab === "log" && (
              <CngiChangeLog state={state} />
            )}
          </>
        ) : (
          <p className="text-[11px] text-[var(--cngi-muted)]">
            Sign in as{" "}
            <span className="font-mono">admin@cngi.test</span> to access season
            and item management with an ADMIN role. Other emails are VIEWER
            only.
          </p>
        )}
      </section>
    </div>
  );
}

type SeasonsAdminProps = {
  state: CngiState;
  user: CngiUser;
  setActiveSeasonId: (id: string) => void;
  upsertSeason: (partial: Partial<MenuSeason>) => void;
};

function CngiSeasonsAdmin({
  state,
  user,
  setActiveSeasonId,
  upsertSeason,
}: SeasonsAdminProps) {
  const [editing, setEditing] = useState<MenuSeason | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const name = (data.get("name") as string)?.trim();
    const status = data.get("status") as MenuSeason["status"];
    const startsAt = (data.get("startsAt") as string) || null;
    const endsAt = (data.get("endsAt") as string) || null;
    if (!name) return;
    upsertSeason({
      id: editing?.id,
      name,
      status,
      startsAt,
      endsAt,
    });
    setEditing(null);
    form.reset();
  };

  return (
    <div className="mt-3 grid gap-4 md:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)] text-[11px]">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-[var(--cngi-text)]">
            Seasons
          </h4>
          <span className="text-[10px] text-[var(--cngi-muted)]">
            Role: {user.role}
          </span>
        </div>
        <div className="max-h-56 overflow-y-auto border border-[var(--cngi-border)] rounded-xl bg-[color:rgba(0,0,0,0.45)]">
          <table className="min-w-full text-left">
            <thead className="sticky top-0 bg-[color:rgba(0,0,0,0.7)] text-[var(--cngi-muted)] text-[10px] uppercase tracking-[0.16em]">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Active</th>
                <th className="px-3 py-2">Dates</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {state.seasons.map((s) => (
                <tr
                  key={s.id}
                  className="border-t border-[color:rgba(217,181,140,0.4)] hover:bg-[color:rgba(0,0,0,0.45)]"
                >
                  <td className="px-3 py-2 text-[var(--cngi-text)]">
                    {s.name}
                  </td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 rounded-full border border-[var(--cngi-border)] text-[10px] text-[var(--cngi-text)]">
                      {s.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {s.active && s.status === "Published" ? (
                      <span className="px-2 py-0.5 rounded-full bg-[color:rgba(74,222,128,0.2)] text-[10px] text-[var(--cngi-success)]">
                        Active
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={s.status !== "Published"}
                        onClick={() => setActiveSeasonId(s.id)}
                        className="px-2 py-0.5 rounded-full border border-[var(--cngi-border)] text-[10px] text-[var(--cngi-muted)] disabled:opacity-50 disabled:cursor-not-allowed hover:border-[var(--cngi-accent)] hover:text-[var(--cngi-accent)]"
                      >
                        Set active
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2 text-[var(--cngi-muted)]">
                    
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setEditing(s)}
                      className="text-[10px] text-[var(--cngi-muted)] hover:text-[var(--cngi-accent)]"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {!state.seasons.length && (
                <tr>
                  <td
                    className="px-3 py-3 text-[var(--cngi-muted)]"
                    colSpan={5}
                  >
                    No seasons defined yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="glass-panel p-6 space-y-4 h-fit sticky top-4"
      >
        <h4 className="text-sm font-bold text-[var(--cngi-text)] uppercase tracking-wider">
          {editing ? "Edit season" : "Setup new season"}
        </h4>
        <div className="space-y-1.5">
          <label htmlFor="season-name" className="block text-[10px] font-bold uppercase tracking-tight text-[var(--cngi-muted)]">
            Season Name
          </label>
          <input
            id="season-name"
            name="name"
            defaultValue={editing?.name || ""}
            placeholder="e.g. Valentine's Day 2025"
            className="w-full rounded-xl border border-[var(--cngi-border)] bg-black/40 px-3 py-2 text-xs text-[var(--cngi-text)] outline-none focus:border-[var(--cngi-accent)] transition-all"
            required
            title="Season Name"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="season-status" className="block text-[10px] font-bold uppercase tracking-tight text-[var(--cngi-muted)]">
              Status
            </label>
            <select
              id="season-status"
              name="status"
              defaultValue={editing?.status || "Draft"}
              className="w-full rounded-xl border border-[var(--cngi-border)] bg-black/40 px-3 py-2 text-xs text-[var(--cngi-text)] outline-none focus:border-[var(--cngi-accent)] transition-all"
              title="Season Status"
            >
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="season-starts" className="block text-[10px] font-bold uppercase tracking-tight text-[var(--cngi-muted)]">
              Starts at
            </label>
            <input
              id="season-starts"
              name="startsAt"
              type="date"
              defaultValue={editing?.startsAt || ""}
              className="w-full rounded-xl border border-[var(--cngi-border)] bg-black/40 px-3 py-2 text-xs text-[var(--cngi-text)] outline-none focus:border-[var(--cngi-accent)] transition-all"
              title="Start Date"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="season-ends" className="block text-[10px] font-bold uppercase tracking-tight text-[var(--cngi-muted)]">
              Ends at
            </label>
            <input
              id="season-ends"
              name="endsAt"
              type="date"
              defaultValue={editing?.endsAt || ""}
              className="w-full rounded-xl border border-[var(--cngi-border)] bg-black/40 px-3 py-2 text-xs text-[var(--cngi-text)] outline-none focus:border-[var(--cngi-accent)] transition-all"
              title="End Date"
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 pt-2">
          <button type="submit" className="btn-primary flex-1 py-2">
            {editing ? "Save Changes" : "Create Season"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="btn-secondary py-2 flex-1"
            >
              Cancel
            </button>
          )}
        </div>
        <p className="text-[9px] text-[var(--cngi-muted)] italic opacity-60">
          * Only one season can be active at a time. Activating a season updates the public menu immediately.
        </p>
      </form>
    </div>
  );
}


interface ItemsAdminProps {
  state: CngiState;
  user: CngiUser;
  selectedIds: string[];
  toggleSelected: (id: string) => void;
  upsertItem: (partial: Partial<MenuItem>) => void;
  bulkUpdateItems: (payload: { itemIds: string[]; status?: MenuItem["status"]; moveToSeasonId?: string; }) => void;
}

function CngiItemsAdmin({
  state,
  user,
  selectedIds,
  toggleSelected,
  upsertItem,
  bulkUpdateItems,
}: ItemsAdminProps) {
  const [seasonId, setSeasonId] = useState<string>(state.seasons[0]?.id || "");
  const [editing, setEditing] = useState<MenuItem | null>(null);

  const visibleItems = useMemo(
    () =>
      state.items
        .filter((i) => !seasonId || i.seasonId === seasonId)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [state.items, seasonId]
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    if (!form) return;
    const data = new FormData(form);
    const name = (data.get("name") as string)?.trim();
    const categoryId = data.get("categoryId") as string;
    const itemSeasonId = (data.get("seasonId") as string) || seasonId;

    if (!name || !categoryId || !itemSeasonId) return;

    const priceRaw = data.get("price") as string;
    const priceValue = parseFloat(priceRaw || "0");
    const tags = (data.get("tags") as string || "").split(",").map(t => t.trim()).filter(Boolean);
    const allergens = (data.get("allergens") as string || "").split(",").map(t => t.trim()).filter(Boolean);

    upsertItem({
      id: editing?.id,
      seasonId: itemSeasonId,
      categoryId,
      name,
      description: (data.get("description") as string)?.trim(),
      priceCents: Math.round(priceValue * 100),
      status: data.get("status") as MenuItem["status"],
      tags,
      allergens,
      availabilityNote: (data.get("availability") as string)?.trim() || null,
    });

    setEditing(null);
    form.reset();
  };

  const hasSelection = selectedIds.length > 0;

  return (
    <div className="mt-4 grid gap-6 md:grid-cols-[1fr,360px]">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label htmlFor="filter-season" className="text-[10px] font-bold uppercase tracking-tight text-[var(--cngi-muted)]">
              Viewing Season
            </label>
            <select
              id="filter-season"
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              className="rounded-xl border border-[var(--cngi-border)] bg-black/40 px-3 py-1.5 text-xs text-[var(--cngi-text)] outline-none focus:border-[var(--cngi-accent)] transition-all"
              title="Filter by Season"
            >
              {state.seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status})
                </option>
              ))}
            </select>
          </div>
          <div className="text-[10px] text-[var(--cngi-muted)] font-mono uppercase tracking-widest opacity-60">
            {user.role} ACCESS
          </div>
        </div>

        <div className="max-h-[500px] overflow-y-auto rounded-2xl border border-[var(--cngi-border)] bg-black/20 shadow-inner">
          <table className="min-w-full text-left text-xs text-[var(--cngi-text)] border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-black/80 backdrop-blur-md text-[var(--cngi-muted)] font-bold uppercase tracking-widest text-[10px]">
              <tr>
                <th className="px-4 py-3 w-8 border-b border-[var(--cngi-border)]/50">
                  <span className="sr-only">Select</span>
                </th>
                <th className="px-4 py-3 border-b border-[var(--cngi-border)]/50">Item</th>
                <th className="px-4 py-3 border-b border-[var(--cngi-border)]/50">Category</th>
                <th className="px-4 py-3 border-b border-[var(--cngi-border)]/50">Status</th>
                <th className="px-4 py-3 text-right border-b border-[var(--cngi-border)]/50">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--cngi-border)]/20">
              {visibleItems.map((item) => {
                const selected = selectedIds.includes(item.id);
                const category = state.categories.find(c => c.id === item.categoryId);
                const price = formatMoneyParts(item.priceCents);
                return (
                  <tr
                    key={item.id}
                    className={`group cursor-pointer transition-colors ${selected ? "bg-[var(--cngi-accent)]/10" : "hover:bg-white/5"}`}
                    onClick={() => setEditing(item)}
                  >
                    <td className="px-4 py-4" onClick={(e) => { e.stopPropagation(); toggleSelected(item.id); }}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelected(item.id)}
                        className="h-4 w-4 rounded border-[var(--cngi-border)] bg-black/60 text-[var(--cngi-accent)] focus:ring-offset-0 focus:ring-1 focus:ring-[var(--cngi-accent)]"
                        title={`Select ${item.name}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-[var(--cngi-text)] group-hover:text-[var(--cngi-accent)] transition-colors">{item.name}</div>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {item.tags.map(t => (
                            <span key={t} className="text-[8px] px-1.5 py-0.5 bg-white/5 rounded-md text-[var(--cngi-muted)] border border-white/5">{t}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 opacity-70">
                      {category?.name || "Uncategorized"}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${item.status === "Published" ? "border-green-500/50 text-green-400 bg-green-500/10" :
                        "border-gray-500/50 text-gray-400 bg-gray-500/10"
                        }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-bold tabular-nums">
                      {price.amount}
                      {price.unit && <span className="text-[10px] ml-0.5 opacity-60 font-medium">{price.unit}</span>}
                    </td>
                  </tr>
                );
              })}
              {!visibleItems.length && (
                <tr>
                  <td className="px-4 py-12 text-center" colSpan={5}>
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <span className="text-2xl">-</span>
                      <p className="text-[var(--cngi-muted)] italic">No items found for this season.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {hasSelection && hasRole(user, "EDITOR") && (
          <div className="flex items-center gap-2 p-4 rounded-2xl bg-[var(--cngi-accent)]/5 border border-[var(--cngi-accent)]/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <span className="text-[10px] font-bold text-[var(--cngi-muted)] uppercase tracking-wider mr-2">Bulk Action ({selectedIds.length}):</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => bulkUpdateItems({ itemIds: selectedIds, status: "Published" })}
                className="px-4 py-1.5 rounded-xl bg-[var(--cngi-accent)] text-[var(--cngi-text)] text-[10px] font-bold hover:brightness-110 shadow-lg transition-all"
                title="Publish' selected items"
              >
                PUBLISH
              </button>
              <button
                type="button"
                onClick={() => bulkUpdateItems({ itemIds: selectedIds, status: "Draft" })}
                className="px-4 py-1.5 rounded-xl border border-[var(--cngi-border)] text-[var(--cngi-muted)] text-[10px] font-bold hover:bg-white/5 transition-all"
                title="Mark selected items as draft"
              >
                DRAFT
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetName = prompt("Move items to which season?");
                  if (!targetName) return;
                  const target = state.seasons.find(s => s.name.toLowerCase() === targetName.trim().toLowerCase());
                  if (target) bulkUpdateItems({ itemIds: selectedIds, moveToSeasonId: target.id });
                  else alert("Season not found.");
                }}
                className="px-4 py-1.5 rounded-xl border border-[var(--cngi-border)] text-[var(--cngi-muted)] text-[10px] font-bold hover:bg-white/5 transition-all"
                title="Move selected items to another season"
              >
                MOVE...
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel p-6 space-y-5 h-fit sticky top-4 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--cngi-border)]/50 pb-3">
            <h4 className="text-sm font-bold text-[var(--cngi-text)] uppercase tracking-[0.2em]">
              {editing ? "Update Item" : "New Item"}
            </h4>
            {editing && (
              <button type="button" onClick={() => setEditing(null)} className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase">
                Reset
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="itm-season" className="block text-[10px] font-bold uppercase tracking-tight text-[var(--cngi-muted)]">Season</label>
              <select
                id="itm-season"
                name="seasonId"
                key={editing ? `edit-s-${editing.id}` : `new-s-${seasonId}`}
                defaultValue={editing?.seasonId || seasonId}
                className="w-full rounded-xl border border-[var(--cngi-border)] bg-black/40 px-3 py-2.5 text-xs text-[var(--cngi-text)] outline-none focus:border-[var(--cngi-accent)] transition-all"
                title="Season"
              >
                {state.seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="itm-cat" className="block text-[10px] font-bold uppercase tracking-tight text-[var(--cngi-muted)]">Category</label>
              <select
                id="itm-cat"
                name="categoryId"
                key={editing ? `edit-c-${editing.id}` : 'new-c'}
                defaultValue={editing?.categoryId || state.categories[0]?.id}
                className="w-full rounded-xl border border-[var(--cngi-border)] bg-black/40 px-3 py-2.5 text-xs text-[var(--cngi-text)] outline-none focus:border-[var(--cngi-accent)] transition-all"
                required
                title="Category"
              >
                {state.categories.slice().sort((a, b) => a.sortOrder - b.sortOrder).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="itm-name" className="block text-[10px] font-bold uppercase tracking-tight text-[var(--cngi-muted)]">Item Name</label>
            <input
              id="itm-name"
              name="name"
              key={editing ? `edit-n-${editing.id}` : 'new-n'}
              defaultValue={editing?.name || ""}
              placeholder="e.g. Red Velvet Cookie"
              className="w-full rounded-xl border border-[var(--cngi-border)] bg-black/40 px-4 py-2.5 text-xs text-[var(--cngi-text)] outline-none focus:border-[var(--cngi-accent)] transition-all"
              required
              title="Name"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="itm-desc" className="block text-[10px] font-bold uppercase tracking-tight text-[var(--cngi-muted)]">Description</label>
            <textarea
              id="itm-desc"
              name="description"
              key={editing ? `edit-d-${editing.id}` : 'new-d'}
              defaultValue={editing?.description || ""}
              rows={3}
              placeholder="Provide a delicious description..."
              className="w-full rounded-xl border border-[var(--cngi-border)] bg-black/40 px-4 py-2.5 text-xs text-[var(--cngi-text)] outline-none focus:border-[var(--cngi-accent)] transition-all resize-none"
              title="Description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="itm-price" className="block text-[10px] font-bold uppercase tracking-tight text-[var(--cngi-muted)]">Price (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cngi-muted)] text-[10px] font-bold">$</span>
                <input
                  id="itm-price"
                  name="price"
                  key={editing ? `edit-p-${editing.id}` : 'new-p'}
                  type="number"
                  step="0.01"
                  defaultValue={editing ? (editing.priceCents / 100).toFixed(2) : ""}
                  className="w-full rounded-xl border border-[var(--cngi-border)] bg-black/40 pl-7 pr-3 py-2.5 text-xs text-[var(--cngi-text)] outline-none focus:border-[var(--cngi-accent)] transition-all"
                  title="Price"
                  placeholder="3.50"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="itm-status" className="block text-[10px] font-bold uppercase tracking-tight text-[var(--cngi-muted)]">Status</label>
              <select
                id="itm-status"
                name="status"
                key={editing ? `edit-st-${editing.id}` : 'new-st'}
                defaultValue={editing?.status || "Draft"}
                className="w-full rounded-xl border border-[var(--cngi-border)] bg-black/40 px-3 py-2.5 text-xs text-[var(--cngi-text)] outline-none focus:border-[var(--cngi-accent)] transition-all font-bold"
                title="Status"
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="itm-tags" className="block text-[10px] font-bold uppercase tracking-tight text-[var(--cngi-muted)]">Tags</label>
              <input
                id="itm-tags"
                name="tags"
                key={editing ? `edit-t-${editing.id}` : 'new-t'}
                defaultValue={editing?.tags?.join(", ") || ""}
                placeholder="Valentine, Seasonal"
                className="w-full rounded-xl border border-[var(--cngi-border)] bg-black/40 px-4 py-2.5 text-xs text-[var(--cngi-text)] outline-none focus:border-[var(--cngi-accent)] transition-all"
                title="Tags"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="itm-allergens" className="block text-[10px] font-bold uppercase tracking-tight text-[var(--cngi-muted)]">Allergens</label>
              <input
                id="itm-allergens"
                name="allergens"
                key={editing ? `edit-a-${editing.id}` : 'new-a'}
                defaultValue={editing?.allergens?.join(", ") || ""}
                placeholder="Dairy, Nuts"
                className="w-full rounded-xl border border-[var(--cngi-border)] bg-black/40 px-4 py-2.5 text-xs text-[var(--cngi-text)] outline-none focus:border-[var(--cngi-accent)] transition-all"
                title="Allergens"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1 py-3 text-sm">{editing ? "Update Entry" : "Create Item"}</button>
            {editing && (
              <button type="button" onClick={() => setEditing(null)} className="btn-secondary flex-1 py-3 text-sm">
                Cancel
              </button>
            )}
          </div>
        </form>
        <div className="pt-4 border-t border-[var(--cngi-border)]/30">
          <p className="text-[10px] text-[var(--cngi-muted)] leading-relaxed flex items-start gap-2">
            <span className="text-[var(--cngi-accent)]"> - </span>
            <span>Publishing makes items immediately visible to guests if the associated season is currently marked as <strong className="text-[var(--cngi-success)]">ACTIVE</strong>.</span>
          </p>
        </div>
      </div>
    </div>
  );
}

type ChangeLogProps = {
  state: CngiState;
};

function CngiChangeLog({ state }: ChangeLogProps) {
  return (
    <div className="mt-3 max-h-64 overflow-y-auto border border-[var(--cngi-border)] rounded-xl bg-[color:rgba(0,0,0,0.45)] text-[11px]">
      <table className="min-w-full text-left">
        <thead className="sticky top-0 bg-[color:rgba(0,0,0,0.7)] text-[var(--cngi-muted)] text-[10px] uppercase tracking-[0.16em]">
          <tr>
            <th className="px-3 py-2">When</th>
            <th className="px-3 py-2">Actor</th>
            <th className="px-3 py-2">Entity</th>
            <th className="px-3 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {state.changeLog.map((entry) => (
            <tr
              key={entry.id}
              className="border-t border-[color:rgba(217,181,140,0.4)]"
            >
              <td className="px-3 py-2 text-[var(--cngi-muted)]">
                {new Date(entry.timestamp).toLocaleString()}
              </td>
              <td className="px-3 py-2 text-[var(--cngi-text)]">
                {entry.actorUserId || "System"}
              </td>
              <td className="px-3 py-2 text-[var(--cngi-muted)]">
                {entry.entityType}
              </td>
              <td className="px-3 py-2 text-[var(--cngi-text)]">
                {entry.action}
              </td>
            </tr>
          ))}
          {!state.changeLog.length && (
            <tr>
              <td
                className="px-3 py-3 text-[var(--cngi-muted)]"
                colSpan={4}
              >
                Change log will record who changed what and when as seasons and
                items are updated.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}






