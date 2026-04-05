/**
 * Black Market Screen
 * Fixed-price anonymous listings. Browse, buy, list, and cancel.
 * No order book; simple fixed-price only.
 */

import { useState } from 'react';
import { useEconomy } from '../lib/economyContext';
import { ITEM_DEFINITIONS } from '../lib/economyMockData';
import { fmt } from '../lib/mockData';
import { BLACK_MARKET_LISTING_FEE_RATE } from '../lib/economyEngine';
import { PageHeader, SectionPanel, InfoAlert } from '../components/layout/AppShell';
import type { BlackMarketListing, ItemCategory } from '../../../shared/economy';

const RARITY_COLOR: Record<string, string> = {
  COMMON: '#888', UNCOMMON: '#5580bb', RARE: '#cc9900', ELITE: '#cc3333',
};
const CATEGORY_LABELS: Record<ItemCategory, string> = {
  WEAPON:'Weapons', TOOL:'Tools', INTEL:'Intel', CONSUMABLE:'Consumables', GEAR:'Gear', CONTRABAND:'Contraband',
};

function ListingRow({ listing, isMine, onBuy, onCancel }: {
  listing: BlackMarketListing;
  isMine: boolean;
  onBuy: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const age = Math.floor((Date.now() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60));
  const def = ITEM_DEFINITIONS[listing.item_definition_id];

  return (
    <tr data-testid={`listing-${listing.id}`}>
      <td>
        <div style={{ fontWeight: 'bold', color: '#e0e0e0' }}>{listing.item_snapshot.name}</div>
        <div style={{ fontSize: '9px', color: RARITY_COLOR[listing.item_snapshot.rarity] }}>{listing.item_snapshot.rarity}</div>
      </td>
      <td style={{ color: '#888' }}>{CATEGORY_LABELS[listing.item_snapshot.category]}</td>
      <td style={{ color: '#888', fontStyle: 'italic' }}>
        {listing.seller_alias === 'ANONYMOUS' ? '— Anonymous —' : listing.seller_alias}
      </td>
      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{listing.quantity}</td>
      <td className="text-cash" style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(listing.price_per_unit)}</td>
      <td className="text-cash" style={{ textAlign: 'right' }}>{fmt(listing.total_price)}</td>
      <td style={{ color: '#555', fontSize: '9px' }}>{age}h ago</td>
      <td>
        {listing.status === 'ACTIVE' && !isMine && (
          <button className="btn btn-primary" style={{ fontSize: '9px' }} onClick={() => onBuy(listing.id)}
            data-testid={`buy-${listing.id}`}
          >
            Buy
          </button>
        )}
        {listing.status === 'ACTIVE' && isMine && (
          <button className="btn btn-danger" style={{ fontSize: '9px' }} onClick={() => onCancel(listing.id)}
            data-testid={`cancel-${listing.id}`}
          >
            Cancel
          </button>
        )}
        {listing.status === 'SOLD'      && <span className="badge-gray">Sold</span>}
        {listing.status === 'CANCELLED' && <span className="badge-gray">Cancelled</span>}
      </td>
    </tr>
  );
}

function NewListingForm({ onClose, onList, inventory, walletCash }: {
  onClose: () => void;
  onList: (itemDefId: string, qty: number, pricePerUnit: number, anon: boolean) => void;
  inventory: any[];
  walletCash: number;
}) {
  const [itemDefId, setItemDefId] = useState('');
  const [qty, setQty]             = useState(1);
  const [price, setPrice]         = useState(0);
  const [anon, setAnon]           = useState(true);

  const tradable = inventory.filter(i => {
    const def = ITEM_DEFINITIONS[i.item_definition_id];
    return def?.tradable && !i.equipped;
  });
  const selectedItem = tradable.find(i => i.item_definition_id === itemDefId);
  const maxQty = selectedItem?.quantity ?? 1;
  const fee = Math.floor(price * qty * BLACK_MARKET_LISTING_FEE_RATE);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="panel" style={{ width: '100%', maxWidth: '420px', fontFamily: 'Verdana, sans-serif' }}>
        <div className="panel-header">
          <span className="panel-title">List Item for Sale</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ background: '#181818', border: '1px solid #2a2a2a', padding: '6px 8px', fontSize: '10px', color: '#888' }}>
            Listing fee: {Math.round(BLACK_MARKET_LISTING_FEE_RATE * 100)}% of total value — paid upfront from wallet.
            Anonymous listings hide your identity. Items transfer immediately on sale.
          </div>

          <div>
            <div className="label-caps" style={{ marginBottom: '4px' }}>Item</div>
            <select value={itemDefId} onChange={e => setItemDefId(e.target.value)} className="game-input" data-testid="list-item-select">
              <option value="">— Select item —</option>
              {tradable.map(i => {
                const def = ITEM_DEFINITIONS[i.item_definition_id];
                return <option key={i.id} value={i.item_definition_id}>{def?.name} (×{i.quantity})</option>;
              })}
            </select>
          </div>

          <div className="ml-grid-2" style={{ gap: '8px' }}>
            <div>
              <div className="label-caps" style={{ marginBottom: '4px' }}>Quantity</div>
              <input type="number" min={1} max={maxQty} value={qty} onChange={e => setQty(Math.min(maxQty, parseInt(e.target.value)||1))} className="game-input" />
            </div>
            <div>
              <div className="label-caps" style={{ marginBottom: '4px' }}>Price per Unit</div>
              <input type="number" min={1} value={price || ''} onChange={e => setPrice(parseInt(e.target.value)||0)} className="game-input" data-testid="list-price-input" />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: '#aaa' }}>
            <input type="checkbox" id="anon-check" checked={anon} onChange={e => setAnon(e.target.checked)} />
            <label htmlFor="anon-check">List anonymously</label>
          </div>

          {price > 0 && qty > 0 && (
            <div style={{ fontSize: '10px', color: '#888', borderTop: '1px solid #2a2a2a', paddingTop: '8px' }}>
              Total: <strong className="text-cash">{fmt(price * qty)}</strong>
              {' · '}Fee: <strong style={{ color: '#cc9900' }}>{fmt(fee)}</strong>
              {' · '}Wallet after fee: <strong>{fmt(walletCash - fee)}</strong>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn ${itemDefId && price > 0 ? 'btn-primary' : 'btn-ghost'}`}
              disabled={!itemDefId || price <= 0 || walletCash < fee}
              onClick={() => onList(itemDefId, qty, price, anon)}
              style={{ flex: 1, padding: '7px' }}
              data-testid="confirm-listing"
            >
              Post Listing
            </button>
            <button onClick={onClose} className="btn btn-ghost" style={{ padding: '7px 14px' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BlackMarketScreen() {
  const { listings, setListings, walletCash, inventory } = useEconomy();
  const [tab, setTab]           = useState<'BROWSE' | 'MY_LISTINGS'>('BROWSE');
  const [catFilter, setCatFilter] = useState<ItemCategory | 'ALL'>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast]       = useState<string | null>(null);

  const MY_PLAYER_ID = 'p-boss'; // TODO: replace with real player ID from auth

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2500); }

  const activeListings = listings.filter(l => l.status === 'ACTIVE');
  const myListings     = listings.filter(l => l.seller_player_id === MY_PLAYER_ID);
  const displayList    = (tab === 'MY_LISTINGS' ? myListings : activeListings).filter(l => {
    if (catFilter === 'ALL') return true;
    return l.item_snapshot.category === catFilter;
  });

  function handleBuy(listingId: string) {
    const listing = listings.find(l => l.id === listingId);
    if (!listing) return;
    if (walletCash < listing.total_price) { showToast(`Insufficient funds. Need ${fmt(listing.total_price)}.`); return; }
    setListings(listings.map(l => l.id === listingId ? { ...l, status: 'SOLD' } : l));
    showToast(`Purchased ${listing.item_snapshot.name} for ${fmt(listing.total_price)}.`);
  }

  function handleCancel(listingId: string) {
    setListings(listings.map(l => l.id === listingId ? { ...l, status: 'CANCELLED' } : l));
    showToast('Listing cancelled.');
  }

  function handleList(itemDefId: string, qty: number, pricePerUnit: number, anon: boolean) {
    const def = ITEM_DEFINITIONS[itemDefId];
    if (!def) return;
    const total = pricePerUnit * qty;
    const fee   = Math.floor(total * BLACK_MARKET_LISTING_FEE_RATE);
    const now   = new Date();
    const newListing: BlackMarketListing = {
      id: `listing-${Date.now()}`,
      seller_player_id: MY_PLAYER_ID,
      seller_alias: anon ? 'ANONYMOUS' : 'Don Corrado',
      item_definition_id: itemDefId,
      item_snapshot: { name: def.name, category: def.category, rarity: def.rarity, description: def.description },
      quantity: qty,
      price_per_unit: pricePerUnit,
      total_price: total,
      status: 'ACTIVE',
      listing_fee_paid: fee,
      created_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    };
    setListings([newListing, ...listings]);
    setShowForm(false);
    showToast(`${def.name} listed for ${fmt(total)}. Fee: ${fmt(fee)}.`);
  }

  return (
    <div>
      <PageHeader
        title="Black Market"
        sub="Anonymous fixed-price listings. No order book. Simple buy/sell."
        action={<button className="btn btn-primary" onClick={() => setShowForm(true)} data-testid="new-listing-btn">+ List Item</button>}
      />

      {toast && (
        <div style={{ position: 'fixed', top: '48px', right: '16px', zIndex: 80, background: '#1a3a1a', border: '1px solid #2a6a2a', color: '#4a9a4a', padding: '6px 12px', fontSize: '10px', fontFamily: 'Verdana, sans-serif' }}>
          {toast}
        </div>
      )}

      <InfoAlert>
        All listings are anonymous by default. Listing fee: {Math.round(BLACK_MARKET_LISTING_FEE_RATE * 100)}% of sale price — paid upfront. Listings expire in 3 days.
        Family tax may apply to sales (proposed: future system).
      </InfoAlert>

      {/* Stats */}
      <div className="ml-grid-3" style={{ marginBottom: '10px' }}>
        <div className="panel" style={{ padding: '8px 10px' }}><div className="label-caps">Active Listings</div><div className="stat-val">{activeListings.length}</div></div>
        <div className="panel" style={{ padding: '8px 10px' }}><div className="label-caps">My Listings</div><div className="stat-val">{myListings.filter(l => l.status === 'ACTIVE').length}</div></div>
        <div className="panel" style={{ padding: '8px 10px' }}><div className="label-caps">Wallet</div><div className="stat-val text-cash">{fmt(walletCash)}</div></div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
        {(['BROWSE','MY_LISTINGS'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`btn ${tab === t ? 'btn-primary' : 'btn-ghost'}`}>
            {t === 'BROWSE' ? 'Browse Market' : 'My Listings'}
          </button>
        ))}
      </div>

      {/* Category filters */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', overflowX: 'auto', paddingBottom: '2px' }}>
        {(['ALL','WEAPON','TOOL','INTEL','CONSUMABLE','GEAR','CONTRABAND'] as const).map(c => (
          <button key={c} onClick={() => setCatFilter(c)} className={`btn ${catFilter === c ? 'btn-primary' : 'btn-ghost'}`} style={{ flexShrink: 0, fontSize: '9px' }}>
            {c === 'ALL' ? 'All' : CATEGORY_LABELS[c as ItemCategory]}
          </button>
        ))}
      </div>

      <SectionPanel title={tab === 'BROWSE' ? 'Active Listings' : 'My Listings'} right={`${displayList.length} shown`}>
        <div className="ml-table-scroll">
          <table className="data-table">
            <thead>
              <tr><th>Item</th><th>Category</th><th>Seller</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Per Unit</th><th style={{ textAlign: 'right' }}>Total</th><th>Posted</th><th>Action</th></tr>
            </thead>
            <tbody>
              {displayList.map(l => (
                <ListingRow
                  key={l.id}
                  listing={l}
                  isMine={l.seller_player_id === MY_PLAYER_ID}
                  onBuy={handleBuy}
                  onCancel={handleCancel}
                />
              ))}
              {displayList.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#555', padding: '20px' }}>
                  {tab === 'MY_LISTINGS' ? 'You have no active listings.' : 'No listings in this category.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionPanel>

      {showForm && (
        <NewListingForm
          onClose={() => setShowForm(false)}
          onList={handleList}
          inventory={inventory}
          walletCash={walletCash}
        />
      )}
    </div>
  );
}
