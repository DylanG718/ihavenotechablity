/**
 * Turf.tsx — Turf & Business Management
 * Manage family turf blocks and build businesses in slots.
 * BOSS: can purchase new blocks. CAPO+: can build businesses.
 */

import { useState } from 'react';
import { useGame } from '../lib/gameContext';
import { can } from '../lib/permissions';
import { fmt } from '../lib/mockData';
import { SectionPanel, InfoAlert, EmptySlate } from '../components/layout/AppShell';
import { MOCK_FAMILY } from '../lib/mockData';
import {
  MOCK_TURF_BLOCKS,
  AVAILABLE_TURF_BLOCKS,
  BUSINESS_BASE_INCOME,
  BUSINESS_BUILD_COST,
  BUSINESS_LABELS,
  calcDailyIncome,
  calcTurfTotalIncome,
  calcTurfTreasuryIncome,
} from '../lib/worldData';
import type { TurfBlock, FamilyBusiness, BusinessType } from '../../../shared/schema';
import { Building2, ChevronDown, ChevronUp, Plus, MapPin } from 'lucide-react';

const BUSINESS_TYPES: BusinessType[] = [
  'NUMBERS_SPOT', 'LOAN_OFFICE', 'CHOP_SHOP', 'PAWN_SHOP',
  'RESTAURANT_FRONT', 'LAUNDROMAT', 'NIGHTCLUB', 'WAREHOUSE',
];

const BIZ_TYPE_COLOR: Record<string, string> = {
  NUMBERS_SPOT:     '#ffcc33',
  LOAN_OFFICE:      '#cc9900',
  CHOP_SHOP:        '#cc3333',
  PAWN_SHOP:        '#888888',
  RESTAURANT_FRONT: '#4a9a4a',
  LAUNDROMAT:       '#6699ff',
  NIGHTCLUB:        '#cc44cc',
  WAREHOUSE:        '#886644',
};

const UPGRADE_LABEL = ['', 'Lvl 1', 'Lvl 2', 'Lvl 3'];

// ── Business Builder Modal ────────────────────

function BusinessBuilderModal({
  slotNumber,
  blockId,
  onClose,
  onBuild,
}: {
  slotNumber: number;
  blockId: string;
  onClose: () => void;
  onBuild: (type: BusinessType) => void;
}) {
  const [selected, setSelected] = useState<BusinessType | null>(null);

  const buildCost = selected ? BUSINESS_BUILD_COST[selected] : 0;
  const baseIncome = selected ? BUSINESS_BASE_INCOME[selected] : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="panel w-full max-w-md" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="panel-header">
          <span className="panel-title">Build Business — Slot {slotNumber}</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          <p className="text-xs text-muted-foreground mb-3">Select a business type to build in this slot.</p>
          {BUSINESS_TYPES.map(type => {
            const cost = BUSINESS_BUILD_COST[type];
            const income = BUSINESS_BASE_INCOME[type];
            const isSelected = selected === type;
            return (
              <div
                key={type}
                onClick={() => setSelected(type)}
                className={`panel p-3 cursor-pointer transition-colors ${isSelected ? 'border-primary/60' : 'hover:border-border/60'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold" style={{ color: BIZ_TYPE_COLOR[type] }}>
                    {BUSINESS_LABELS[type]}
                  </span>
                  <span className="text-xs text-cash font-bold">{fmt(cost)}</span>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Base income: <strong className="text-cash">{fmt(income)}/day</strong></span>
                  <span>Family cut: 30%</span>
                </div>
              </div>
            );
          })}
        </div>

        {selected && (
          <div className="border-t border-border p-4 bg-muted/20">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="text-muted-foreground">Build cost:</span>
              <span className="text-cash font-bold">{fmt(buildCost)}</span>
            </div>
            <div className="flex items-center justify-between mb-4 text-xs">
              <span className="text-muted-foreground">Starting daily income:</span>
              <span className="text-cash">{fmt(baseIncome)}/day</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => onBuild(selected)}
                className="btn btn-primary flex-1"
              >
                Build {BUSINESS_LABELS[selected]}
              </button>
              <button onClick={onClose} className="btn btn-ghost px-4">Cancel</button>
            </div>
          </div>
        )}
        {!selected && (
          <div className="border-t border-border p-4">
            <button onClick={onClose} className="btn btn-ghost w-full">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Buy Turf Modal ────────────────────────────

function BuyTurfModal({ onClose, onBuy }: { onClose: () => void; onBuy: (blockId: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="panel w-full max-w-md">
        <div className="panel-header">
          <span className="panel-title">Purchase New Turf Block</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-4 space-y-3">
          <InfoAlert variant="warn">
            Purchasing a turf block commits family treasury funds permanently. The block becomes operational immediately.
          </InfoAlert>
          {AVAILABLE_TURF_BLOCKS.map(block => (
            <div
              key={block.id}
              onClick={() => setSelected(block.id)}
              className={`panel p-3 cursor-pointer transition-colors ${selected === block.id ? 'border-primary/60' : 'hover:border-border/60'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-foreground">{block.name}</span>
                <span className="text-xs text-cash font-bold">{fmt(block.cost)}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin size={9} />
                <span>{block.location}</span>
                <span>· 16 empty slots · Ready to build</span>
              </div>
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => selected && onBuy(selected)}
              disabled={!selected}
              className={`btn flex-1 ${selected ? 'btn-primary' : 'btn-ghost opacity-40'}`}
            >
              Purchase Block
            </button>
            <button onClick={onClose} className="btn btn-ghost px-4">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Business Slot Grid ─────────────────────────

function SlotGrid({
  block,
  canBuild,
  onBuildSlot,
}: {
  block: TurfBlock;
  canBuild: boolean;
  onBuildSlot: (blockId: string, slotNumber: number) => void;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', padding: '12px' }}>
      {block.slots.map(slot => {
        const biz = slot.business;
        if (biz) {
          const income = calcDailyIncome(biz.daily_income_base, biz.upgrade_level);
          const color = BIZ_TYPE_COLOR[biz.type] ?? '#888';
          return (
            <div
              key={slot.slot_number}
              className="panel p-2"
              style={{ borderColor: color + '44', background: color + '11', minHeight: '72px' }}
              title={`${BUSINESS_LABELS[biz.type]} — Slot ${slot.slot_number}`}
            >
              <div className="text-xs font-semibold mb-0.5 truncate" style={{ color, fontSize: '9px' }}>
                {BUSINESS_LABELS[biz.type]}
              </div>
              <div style={{ fontSize: '8px', color: '#666', marginBottom: '2px' }}>
                {UPGRADE_LABEL[biz.upgrade_level]} · Slot {slot.slot_number}
              </div>
              <div style={{ fontSize: '9px', color: '#4a9a4a', fontWeight: 'bold' }}>
                {fmt(income)}/day
              </div>
              <div style={{ fontSize: '8px', color: '#666' }}>
                +{biz.heat_per_day} heat
              </div>
            </div>
          );
        }
        return (
          <div
            key={slot.slot_number}
            className="panel flex flex-col items-center justify-center cursor-pointer hover:border-border/60 transition-colors"
            style={{ minHeight: '72px', opacity: canBuild ? 1 : 0.4 }}
            onClick={() => canBuild && onBuildSlot(block.id, slot.slot_number)}
            title={canBuild ? `Build in slot ${slot.slot_number}` : 'CAPO+ required to build'}
          >
            <Plus size={14} className="text-muted-foreground mb-1" />
            <span style={{ fontSize: '8px', color: '#555' }}>Slot {slot.slot_number}</span>
            {canBuild && <span style={{ fontSize: '8px', color: '#4a9a4a' }}>Build</span>}
          </div>
        );
      })}
    </div>
  );
}

// ── Turf Block Card ───────────────────────────

function TurfBlockCard({
  block,
  canBuild,
  onBuildSlot,
}: {
  block: TurfBlock;
  canBuild: boolean;
  onBuildSlot: (blockId: string, slotNumber: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const businessCount = block.slots.filter(s => s.business !== null).length;
  const totalIncome   = block.slots.reduce((sum, s) => {
    if (!s.business) return sum;
    return sum + calcDailyIncome(s.business.daily_income_base, s.business.upgrade_level);
  }, 0);
  const treasuryCut  = Math.floor(totalIncome * 0.3);

  return (
    <div className="panel mb-4 overflow-hidden">
      {/* Block header */}
      <div
        className="panel-header cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded(v => !v)}
        style={{ flexWrap: 'wrap', gap: '4px' }}
      >
        <div className="flex items-center gap-2 min-w-0" style={{ flex: '1 1 160px' }}>
          <Building2 size={13} className="text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <div className="panel-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{block.name}</div>
            <div className="text-muted-foreground" style={{ fontSize: '10px' }}>{block.location}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs shrink-0">
          <span className="text-cash font-bold">{fmt(totalIncome)}/day</span>
          <span className="text-muted-foreground">{businessCount}/16</span>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      </div>

      {expanded && (
        <>
          {/* Block meta */}
          <div className="px-4 py-2 border-b border-border flex gap-6 text-xs text-muted-foreground" style={{ background: '#0a0a0a' }}>
            <span>Purchased: {new Date(block.purchased_at).toLocaleDateString()}</span>
            <span>Cost: {fmt(block.purchase_cost)}</span>
            <span>{16 - businessCount} empty slots</span>
          </div>

          {/* Slot grid */}
          <SlotGrid block={block} canBuild={canBuild} onBuildSlot={onBuildSlot} />
        </>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────

export default function Turf() {
  const { gameRole } = useGame();

  const isBoss     = gameRole === 'BOSS';
  const isCapoPlus = can(gameRole, 'MANAGE_OPERATIONS');

  // Local state for blocks (mock state updates)
  const [blocks, setBlocks] = useState<TurfBlock[]>(MOCK_TURF_BLOCKS);
  const [buildTarget, setBuildTarget] = useState<{ blockId: string; slotNumber: number } | null>(null);
  const [showBuyTurf, setShowBuyTurf] = useState(false);
  const [buySuccess, setBuySuccess] = useState<string | null>(null);
  const [buildSuccess, setBuildSuccess] = useState<string | null>(null);

  const totalIncome    = calcTurfTotalIncome(blocks);
  const treasuryIncome = calcTurfTreasuryIncome(blocks);
  const totalBusiness  = blocks.reduce((sum, b) => sum + b.slots.filter(s => s.business).length, 0);

  function handleBuild(type: BusinessType) {
    if (!buildTarget) return;
    const { blockId, slotNumber } = buildTarget;
    const newBiz: FamilyBusiness = {
      id: `biz-new-${Date.now()}`,
      type,
      owner_player_id: 'p-boss',
      turf_block_id: blockId,
      slot_number: slotNumber,
      upgrade_level: 1,
      daily_income_base: BUSINESS_BASE_INCOME[type],
      family_cut_pct: 0.3,
      heat_per_day: Math.ceil(BUSINESS_BASE_INCOME[type] / 500),
      built_at: new Date().toISOString(),
    };
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      return {
        ...b,
        slots: b.slots.map(s =>
          s.slot_number === slotNumber ? { ...s, business: newBiz } : s
        ),
      };
    }));
    setBuildTarget(null);
    setBuildSuccess(`${BUSINESS_LABELS[type]} built in slot ${slotNumber}.`);
    setTimeout(() => setBuildSuccess(null), 3000);
  }

  function handleBuyTurf(blockId: string) {
    const avail = AVAILABLE_TURF_BLOCKS.find(b => b.id === blockId);
    if (!avail) return;
    const newBlock: TurfBlock = {
      id: avail.id,
      family_id: 'fam-1',
      name: avail.name,
      location: avail.location,
      purchase_cost: avail.cost,
      purchased_at: new Date().toISOString(),
      slots: Array.from({ length: 16 }, (_, i) => ({ slot_number: i + 1, business: null })),
    };
    setBlocks(prev => [...prev, newBlock]);
    setShowBuyTurf(false);
    setBuySuccess(`${avail.name} purchased. 16 slots now available.`);
    setTimeout(() => setBuySuccess(null), 4000);
  }

  return (
    <div className="page-stack">

      {/* ── Hero / identity card ── */}
      <div className="hero-card">
        <div className="hero-card__top">
          <div>
            <div className="hero-card__name">{MOCK_FAMILY.name}</div>
            <div className="hero-card__sub">Turf &amp; Businesses · {blocks.length} blocks · {totalBusiness} businesses</div>
          </div>
          {isBoss && (
            <button className="btn btn-primary" style={{ fontSize: '11px' }} onClick={() => setShowBuyTurf(true)}>
              <MapPin size={11} style={{ display: 'inline', marginRight: '4px' }} />
              Purchase Block
            </button>
          )}
        </div>

        {/* Summary bar */}
        <div className="summary-bar">
          <div className="summary-bar__item">
            <span className="label-caps">Blocks</span>
            <span className="stat-val">{blocks.length}</span>
          </div>
          <div className="summary-bar__item">
            <span className="label-caps">Businesses</span>
            <span className="stat-val">{totalBusiness}</span>
          </div>
          <div className="summary-bar__item">
            <span className="label-caps">Daily Income</span>
            <span className="stat-val text-cash">{fmt(totalIncome)}</span>
          </div>
          <div className="summary-bar__item">
            <span className="label-caps">Treasury Cut</span>
            <span className="stat-val text-cash">{fmt(treasuryIncome)}</span>
          </div>
        </div>
      </div>

      {/* Permission note */}
      {!isCapoPlus && (
        <InfoAlert variant="warn">
          You need Capo rank or above to build businesses. Bosses can also purchase new turf blocks.
        </InfoAlert>
      )}

      {/* Success messages */}
      {buildSuccess && <InfoAlert>{buildSuccess}</InfoAlert>}
      {buySuccess && <InfoAlert>{buySuccess}</InfoAlert>}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs text-muted-foreground">
        <span className="label-caps">Business types:</span>
        {BUSINESS_TYPES.map(t => (
          <span key={t} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ background: BIZ_TYPE_COLOR[t] }} />
            {BUSINESS_LABELS[t]}
          </span>
        ))}
      </div>

      {/* Turf blocks */}
      {blocks.length === 0 ? (
        <EmptySlate msg="No turf blocks owned." sub="Purchase a block to start building businesses." />
      ) : (
        blocks.map(block => (
          <TurfBlockCard
            key={block.id}
            block={block}
            canBuild={isCapoPlus}
            onBuildSlot={(blockId, slotNumber) => setBuildTarget({ blockId, slotNumber })}
          />
        ))
      )}

      {/* Income breakdown note */}
      <div className="panel p-4 mt-2">
        <span className="label-caps block mb-2">Income Distribution</span>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>30% of each business's daily income goes to the family treasury.</p>
          <p>70% goes to the business owner (the player who built it).</p>
          <p>Upgrade levels: Lvl 1 = base · Lvl 2 = 1.6× · Lvl 3 = 2.5× income.</p>
          <p>Heat accumulates daily — monitor it to avoid law enforcement risk.</p>
        </div>
      </div>

      {/* Modals */}
      {buildTarget && (
        <BusinessBuilderModal
          slotNumber={buildTarget.slotNumber}
          blockId={buildTarget.blockId}
          onClose={() => setBuildTarget(null)}
          onBuild={handleBuild}
        />
      )}
      {showBuyTurf && (
        <BuyTurfModal
          onClose={() => setShowBuyTurf(false)}
          onBuy={handleBuyTurf}
        />
      )}
    </div>
  );
}
