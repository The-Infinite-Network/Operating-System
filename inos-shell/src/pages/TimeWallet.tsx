import { useState } from 'react';
import {
  Wallet,
  Clock,
  TrendingUp,
  Shield,
  Layers,
  Box,
  Star,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Gift,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { mockWallet } from '../data/mockWallet';
import {
  formatTT,
  formatNTV,
  formatLifeHours,
  txTypeColor,
  txTypeSign,
  earningMethodLabel,
  MICRO_INCREMENT,
  T0,
  JOIN_GRANT_TT,
  HOURS_PER_YEAR,
} from '../services/timeCreditService';
import { TransactionType, TimeTransaction } from '../types/timeCredits';

// ─── sub-components ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-[#080808] border border-[#1a1a1a] p-5 rounded-sm flex flex-col gap-3 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full pointer-events-none opacity-40"
           style={{ background: accent }} />
      <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-widest text-[#555]">
        <span style={{ color: accent }}>{icon}</span>
        {label}
      </div>
      <div className="font-bold leading-none" style={{ fontSize: '28px', color: accent, fontFamily: "'Syne', sans-serif" }}>
        {value}
      </div>
      {sub && (
        <div className="text-[10px] font-mono text-[#555] leading-relaxed">{sub}</div>
      )}
    </div>
  );
}

function TxIcon({ type }: { type: TransactionType }) {
  const color = txTypeColor(type);
  const icons: Record<TransactionType, React.ReactNode> = {
    earn:  <ArrowUpRight size={12} />,
    spend: <ArrowDownLeft size={12} />,
    swap:  <ArrowLeftRight size={12} />,
    grant: <Gift size={12} />,
  };
  return (
    <span className="w-5 h-5 flex items-center justify-center rounded-sm border shrink-0"
          style={{ color, borderColor: `${color}30`, background: `${color}10` }}>
      {icons[type]}
    </span>
  );
}

function StatusDot({ status }: { status: TimeTransaction['status'] }) {
  const colors = { confirmed: '#00ff9d', pending: '#c9a227', disputed: '#f97316' };
  return (
    <span className="w-1.5 h-1.5 rounded-full inline-block shrink-0"
          style={{ background: colors[status] }} />
  );
}

function EmptySlot({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 border border-dashed border-[#1a1a1a] rounded-sm text-center gap-2">
      <span className="text-[9px] font-mono uppercase tracking-widest text-[#333]">{label}</span>
    </div>
  );
}

// ─── tx filter tabs ──────────────────────────────────────────────────────────

type TxFilter = 'all' | 'earn' | 'spend' | 'swap' | 'grant';

const TX_FILTERS: { key: TxFilter; label: string }[] = [
  { key: 'all',   label: 'All' },
  { key: 'grant', label: 'Grants' },
  { key: 'earn',  label: 'Earned' },
  { key: 'spend', label: 'Spent' },
  { key: 'swap',  label: 'Swapped' },
];

// ─── main page ───────────────────────────────────────────────────────────────

export default function TimeWallet() {
  const wallet = mockWallet;
  const [txFilter, setTxFilter] = useState<TxFilter>('all');

  const filteredTx = txFilter === 'all'
    ? wallet.transactions
    : wallet.transactions.filter(t => t.type === txFilter);

  const totalEarned = wallet.transactions
    .filter(t => t.type === 'earn' || t.type === 'grant')
    .reduce((s, t) => s + t.amount, 0);

  const totalSpent = wallet.transactions
    .filter(t => t.type === 'spend')
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-8">

      {/* ── SAMPLE DATA NOTICE ── */}
      <div className="text-[10px] font-mono text-[#555] border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2 rounded-sm flex items-center gap-2">
        <span className="text-[#c9a227]/70">◆</span>
        Spec preview — sample data only. Time Wallet is not wired to a live backend.
      </div>

      {/* ── WALLET HEADER ── */}
      <div className="bg-[#080808] border border-[#1a1a1a] rounded-sm p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20"
             style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(201,162,39,0.06) 28px, rgba(201,162,39,0.06) 29px)' }} />
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="text-[9px] font-mono tracking-[0.25em] text-[#555] uppercase mb-3">
              IN-TC-SPEC-001 · {wallet.epoch} · MEMBER {wallet.memberId}
            </div>
            <h1 className="text-2xl font-bold uppercase tracking-widest flex items-center gap-3"
                style={{ color: '#c9a227', fontFamily: "'Syne', sans-serif" }}>
              <span className="p-2 rounded"
                    style={{ background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.2)' }}>
                <Wallet size={18} style={{ color: '#c9a227' }} />
              </span>
              Time Wallet
            </h1>
            <p className="text-[11px] font-mono text-[#555] mt-2 uppercase tracking-widest">
              {wallet.displayName} · Joined {new Date(wallet.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-[9px] font-mono px-2 py-1 rounded-sm uppercase tracking-widest"
                  style={{ color: '#c9a227', border: '1px solid rgba(201,162,39,0.3)', background: 'rgba(201,162,39,0.08)' }}>
              LOCKED v1.0
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-sm uppercase tracking-widest text-[#555] border border-[#1a1a1a]">
              TimeLine · Epoch 0
            </span>
          </div>
        </div>

        {/* quick track summary */}
        <div className="flex gap-6 mt-5 pt-5 border-t border-[#1a1a1a] relative z-10">
          {[
            { label: 'Total Earned',       val: `+${formatTT(totalEarned)} TT`,   color: '#00ff9d' },
            { label: 'Total Spent',        val: `−${formatTT(totalSpent)} TT`,    color: '#f97316' },
            { label: 'Transactions',       val: wallet.totalTransactions.toString(), color: '#00f0ff' },
            { label: 'IC Balance',         val: `${wallet.icBalance} IC`,          color: '#c9a227' },
          ].map(item => (
            <div key={item.label} className="flex flex-col gap-1">
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#555]">{item.label}</span>
              <span className="text-sm font-bold font-mono" style={{ color: item.color }}>{item.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Spendable Balance"
          value={`${formatTT(wallet.spendableBalance)} TT`}
          sub={`Join grant: ${JOIN_GRANT_TT.toLocaleString()} TT — earned only, never purchased`}
          accent="#c9a227"
          icon={<Wallet size={10} />}
        />
        <StatCard
          label="Life Ledger"
          value={formatLifeHours(wallet.lifeHours)}
          sub={`Age ${wallet.age} × ${HOURS_PER_YEAR.toLocaleString()} hrs — identity only, not spendable`}
          accent="#6366f1"
          icon={<Clock size={10} />}
        />
        <StatCard
          label="Time Score"
          value={wallet.timeScore.toString()}
          sub={`Skills ${wallet.scoreBreakdown.skills} · Deeds ${wallet.scoreBreakdown.deeds} · Achievements ${wallet.scoreBreakdown.achievements}`}
          accent="#00ff9d"
          icon={<Star size={10} />}
        />
        <StatCard
          label="Current NTV"
          value={formatNTV(wallet.currentNTV)}
          sub={`T0 = ${T0} · Grows with each transaction`}
          accent="#00f0ff"
          icon={<TrendingUp size={10} />}
        />
      </div>

      {/* ── NTV FORMULA + GOVERNANCE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">

        {/* NTV Formula box */}
        <div className="bg-[#080808] border border-[#1a1a1a] rounded-sm overflow-hidden">
          <div className="border-b-2 border-[#c9a227] px-5 py-3">
            <div className="text-[9px] font-mono uppercase tracking-widest text-[#c9a227]">
              Canon · Value Formula — IN-TC-SPEC-001 §04
            </div>
          </div>
          <div className="p-5 font-mono text-sm leading-8 bg-[#0a0a0a]">
            <div style={{ color: '#c9a227' }}>NTV = (T1 + {MICRO_INCREMENT}) × C</div>
            <div className="text-[#555] text-[11px]">// NTV = New Time Value after transaction</div>
            <div className="text-[#555] text-[11px]">// T1  = Current value before transaction</div>
            <div className="text-[#555] text-[11px]">// C   = Coins exchanged in transaction</div>
            <div className="text-[#555] text-[11px]">// {MICRO_INCREMENT} = micro-increment per transaction</div>
            <br />
            <div style={{ color: '#00f0ff' }}>T0 = {T0}</div>
            <div className="text-[#555] text-[11px]">// Starting value · Epoch 0</div>
            <br />
            <div style={{ color: '#777' }}>Current NTV = <span style={{ color: '#c9a227' }}>{formatNTV(wallet.currentNTV)}</span></div>
            <div className="text-[#555] text-[11px]">// Earned tokens do NOT increase NTV</div>
            <div className="text-[#555] text-[11px]">// Only work-for-payment transactions drive NTV</div>
          </div>
          <div className="px-5 py-3 border-t border-[#1a1a1a] flex gap-6">
            {[
              { label: 'Total Tx Count', val: wallet.totalTransactions, color: '#00f0ff' },
              { label: 'NTV Δ per Tx', val: `+${MICRO_INCREMENT}`, color: '#c9a227' },
            ].map(item => (
              <div key={item.label} className="flex flex-col gap-1">
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#555]">{item.label}</span>
                <span className="text-sm font-bold font-mono" style={{ color: item.color }}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Governance / Supply Rationale */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#080808] border border-[#1a1a1a] rounded-sm p-5 flex-1">
            <div className="text-[9px] font-mono uppercase tracking-widest text-[#555] mb-3 flex items-center gap-2">
              <Shield size={10} /> Life Ledger — Why It's Non-Spendable
            </div>
            <p className="text-[11px] font-mono text-[#777] leading-relaxed">
              If age × 8,760 were spendable, a US launch at avg. age 38 across 330M people =
              <span className="text-[#f97316]"> ~109 trillion TT</span> in unearned supply.
              This breaks the non-inflation axiom.
            </p>
            <p className="text-[11px] font-mono text-[#777] leading-relaxed mt-3">
              The Life Ledger honors your time without distorting supply.
              <span style={{ color: '#c9a227' }}> Your life has always had value.</span>
            </p>
          </div>

          <div className="bg-[#080808] border border-[#1a1a1a] rounded-sm p-5">
            <div className="text-[9px] font-mono uppercase tracking-widest text-[#555] mb-3 flex items-center gap-2">
              <AlertTriangle size={10} className="text-amber-500" /> Wallet Privacy
            </div>
            <p className="text-[11px] font-mono text-[#777] leading-relaxed">
              All transactions are logged on the <span style={{ color: '#00f0ff' }}>TimeLine blockchain</span>.
              Traceable for audit. Private by default. Not accessible by external authorities.
              This wallet acts as a personal LLC.
            </p>
          </div>
        </div>
      </div>

      {/* ── TIME TRACKS ── */}
      <div className="bg-[#080808] border border-[#1a1a1a] rounded-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
          <div className="text-xs font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: '#c9a227' }}>
            <Layers size={14} /> Time Tracks — Transaction Ledger
          </div>
          <div className="flex gap-1">
            {TX_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setTxFilter(f.key)}
                className="px-3 py-1 text-[9px] font-mono uppercase tracking-widest rounded-sm transition-all"
                style={
                  txFilter === f.key
                    ? { color: '#c9a227', border: '1px solid rgba(201,162,39,0.3)', background: 'rgba(201,162,39,0.08)' }
                    : { color: '#555', border: '1px solid transparent' }
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* table header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-2 border-b border-[#111]">
          {['Type', 'Description', 'Method', 'Amount', 'NTV at Time'].map(h => (
            <div key={h} className="text-[9px] font-mono uppercase tracking-widest text-[#444]">{h}</div>
          ))}
        </div>

        {/* rows */}
        <div className="divide-y divide-[#0f0f0f]">
          {filteredTx.length === 0 ? (
            <div className="px-5 py-10 text-center text-[#333] text-[11px] font-mono uppercase tracking-widest">
              No transactions in this view
            </div>
          ) : (
            filteredTx.map(tx => {
              const color = txTypeColor(tx.type);
              return (
                <div
                  key={tx.id}
                  className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-3 items-center hover:bg-[#0d0d0d] transition-colors group"
                >
                  <TxIcon type={tx.type} />

                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#e5e5e5] truncate">{tx.description}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusDot status={tx.status} />
                      <span className="text-[9px] font-mono text-[#555]">
                        {tx.id} · {new Date(tx.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono px-2 py-0.5 rounded-sm text-[#777] border border-[#1a1a1a] bg-[#0d0d0d] whitespace-nowrap">
                    {tx.method ? earningMethodLabel(tx.method) : tx.category ?? '—'}
                  </div>

                  <div className="font-bold font-mono text-sm whitespace-nowrap" style={{ color }}>
                    {txTypeSign(tx.type)}{formatTT(tx.amount)} TT
                  </div>

                  <div className="text-[10px] font-mono text-[#555] text-right whitespace-nowrap">
                    {formatNTV(tx.ntvAtTime)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-5 py-3 border-t border-[#111] flex justify-between items-center">
          <span className="text-[9px] font-mono text-[#333] uppercase tracking-widest">
            {filteredTx.length} record{filteredTx.length !== 1 ? 's' : ''} · TimeLine · Epoch 0
          </span>
          <button className="text-[9px] font-mono text-[#555] hover:text-[#c9a227] flex items-center gap-1 transition-colors uppercase tracking-widest">
            Export Ledger <ChevronRight size={10} />
          </button>
        </div>
      </div>

      {/* ── ASSET REGISTRY + GUILD / SKILLS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Asset Registry */}
        <div className="bg-[#080808] border border-[#1a1a1a] rounded-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1a1a1a] flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: '#c9a227' }}>
              <Box size={14} /> Asset Registry
            </div>
            <button className="text-[9px] font-mono text-[#555] hover:text-[#c9a227] transition-colors uppercase tracking-widest flex items-center gap-1">
              Register Asset <ChevronRight size={10} />
            </button>
          </div>
          <div className="p-5">
            {wallet.assets.length === 0 ? (
              <EmptySlot label="No assets registered · Upload living space, transport, or food assets to earn TT passively" />
            ) : (
              <div className="divide-y divide-[#111]">
                {wallet.assets.map(asset => (
                  <div key={asset.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold">{asset.name}</div>
                      <div className="text-[10px] font-mono text-[#555] mt-0.5">
                        {asset.type.replace('_', ' ')} · {asset.activeHours}hrs contributed
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono" style={{ color: '#00ff9d' }}>
                        +{formatTT(asset.totalEarned)} TT
                      </div>
                      <div className="text-[10px] font-mono text-[#555]">{asset.earningRateTT} TT/hr</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* earning rate reference */}
          <div className="px-5 pb-5">
            <div className="text-[9px] font-mono uppercase tracking-widest text-[#444] mb-2">Canonical Rates</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'Living Space',  rate: '1 TT / hr used' },
                { type: 'Transport',     rate: '0.25 TT / hr used' },
                { type: 'Food',          rate: 'Pending formula' },
                { type: 'Clothing',      rate: 'Pending formula' },
              ].map(r => (
                <div key={r.type} className="px-3 py-2 border border-[#1a1a1a] bg-[#0a0a0a] rounded-sm">
                  <div className="text-[9px] font-mono text-[#555] uppercase">{r.type}</div>
                  <div className="text-[10px] font-mono mt-0.5" style={{ color: '#c9a227' }}>{r.rate}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Guild & Skills */}
        <div className="flex flex-col gap-4">

          {/* Guild Memberships */}
          <div className="bg-[#080808] border border-[#1a1a1a] rounded-sm overflow-hidden flex-1">
            <div className="px-5 py-4 border-b border-[#1a1a1a] flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#00f0ff]">
                <Shield size={14} /> Guild Memberships
              </div>
              <button className="text-[9px] font-mono text-[#555] hover:text-[#00f0ff] transition-colors uppercase tracking-widest flex items-center gap-1">
                Find Guild <ChevronRight size={10} />
              </button>
            </div>
            <div className="p-5">
              {wallet.guilds.length === 0 ? (
                <EmptySlot label="No guild memberships · Guild work earns TT at guild-set rates with floor & cap pricing" />
              ) : (
                wallet.guilds.map(g => (
                  <div key={g.guildId} className="flex items-center justify-between py-3 border-b border-[#111] last:border-0">
                    <div>
                      <div className="text-xs font-bold">{g.guildName}</div>
                      <div className="text-[10px] font-mono text-[#555]">{g.rank} · Joined {g.joinDate}</div>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-sm uppercase"
                          style={{ color: '#00ff9d', border: '1px solid rgba(0,255,157,0.3)', background: 'rgba(0,255,157,0.05)' }}>
                      {g.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Skill Tree Badges */}
          <div className="bg-[#080808] border border-[#1a1a1a] rounded-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1a1a1a]">
              <div className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#00ff9d]">
                <Star size={14} /> Skill Tree · NFT Badges
              </div>
            </div>
            <div className="p-5">
              {wallet.skills.length === 0 ? (
                <EmptySlot label="No badges earned · Skill advancement mints an NFT badge on the TimeLine" />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {wallet.skills.map(s => (
                    <div key={s.id} className="px-3 py-2 border border-[#1a1a1a] bg-[#0d0d0d] rounded-sm">
                      <div className="text-[10px] font-bold" style={{ color: '#00ff9d' }}>{s.name}</div>
                      <div className="text-[9px] font-mono text-[#555]">Tier {s.tier}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── OPEN GAPS ── */}
      <div className="bg-[#080808] border border-[#1a1a1a] rounded-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1a1a1a]">
          <div className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#f97316]">
            <AlertTriangle size={14} /> Open Gaps — Pending Resolution
          </div>
        </div>
        <div className="divide-y divide-[#0f0f0f]">
          {[
            { id: 'G1', gap: 'Guild payout % reconciliation (raw notes sum > 100%)',   agent: 'BANK',           status: 'Next' },
            { id: 'G2', gap: 'Food & Clothing asset earning rate formula',              agent: 'FOOD + BANK',    status: 'Next' },
            { id: 'G3', gap: 'Anniversary grant mechanism — smart contract design',     agent: 'BUILD + NANO',   status: 'Open' },
            { id: 'G4', gap: 'Crypto conversion rate-setting mechanism & governance trigger', agent: 'BANK + LAW', status: 'Open' },
            { id: 'G5', gap: 'Loan-to-earn protocol — structure, default rules, collateral', agent: 'LAW + BANK', status: 'Open' },
            { id: 'G6', gap: 'PoLE automation + AI verification assistance design',     agent: 'NANO + AIR',     status: 'Open' },
          ].map(g => (
            <div key={g.id} className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-3 items-center hover:bg-[#0d0d0d] transition-colors">
              <span className="text-[9px] font-mono text-[#555]">{g.id}</span>
              <span className="text-xs text-[#e5e5e5]">{g.gap}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm border border-[#1a1a1a] text-[#555] bg-[#0d0d0d]">{g.agent}</span>
              <span
                className="text-[9px] font-mono px-2 py-0.5 rounded-sm uppercase tracking-widest"
                style={
                  g.status === 'Next'
                    ? { color: '#f97316', border: '1px solid rgba(249,115,22,0.3)', background: 'rgba(249,115,22,0.08)' }
                    : { color: '#555', border: '1px solid #1a1a1a' }
                }
              >
                {g.status}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
