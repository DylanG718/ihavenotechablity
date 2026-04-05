/**
 * Economy Context
 * Holds all economy state for the current player session.
 * Replace with API-backed queries when backend is ready.
 */

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { BankAccount, Stash, InventoryItem, BlackMarketListing, Transaction, FamilyTreasury } from '../../../shared/economy';
import {
  MOCK_BANK, MOCK_STASH, MOCK_INVENTORY, MOCK_BM_LISTINGS,
  MOCK_TRANSACTIONS, MOCK_FAMILY_TREASURY,
  MOCK_HITMAN_BANK, MOCK_HITMAN_STASH, MOCK_HITMAN_INVENTORY,
} from './economyMockData';
import { depositToBank, withdrawFromBank, moveToStash, moveFromStash } from './economyEngine';
import { useGame } from './gameContext';

interface EconomyCtx {
  // Player wallet (on-hand cash) — mirrors stats.cash
  walletCash: number;
  bank: BankAccount;
  stash: Stash;
  inventory: InventoryItem[];
  transactions: Transaction[];
  familyTreasury: FamilyTreasury;
  listings: BlackMarketListing[];

  // Actions
  depositToBank: (amount: number) => { ok: boolean; error?: string; fee?: number };
  withdrawFromBank: (amount: number) => { ok: boolean; error?: string; fee?: number };
  moveToStash: (amount: number) => { ok: boolean; error?: string };
  moveFromStash: (amount: number) => { ok: boolean; error?: string };
  setListings: (listings: BlackMarketListing[]) => void;
  addTransaction: (tx: Transaction) => void;
}

const Ctx = createContext<EconomyCtx | null>(null);

export function EconomyProvider({ children }: { children: ReactNode }) {
  const { player } = useGame();
  const isHitman = player.archetype === 'HITMAN';

  const initialBank  = isHitman ? MOCK_HITMAN_BANK  : MOCK_BANK;
  const initialStash = isHitman ? MOCK_HITMAN_STASH : MOCK_STASH;
  const initialInv   = isHitman ? MOCK_HITMAN_INVENTORY : MOCK_INVENTORY;

  const [walletCash, setWallet]        = useState(player.stats.cash);
  const [bank, setBank]                = useState<BankAccount>(initialBank);
  const [stash, setStash]              = useState<Stash>(initialStash);
  const [inventory]                    = useState<InventoryItem[]>(initialInv);
  const [transactions, setTransactions]= useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [listings, setListings]        = useState<BlackMarketListing[]>(MOCK_BM_LISTINGS);
  const [treasury]                     = useState<FamilyTreasury>(MOCK_FAMILY_TREASURY);

  function doDeposit(amount: number) {
    const r = depositToBank(bank, walletCash, amount);
    if (r.ok) { setBank(r.account); setWallet(w => w + r.walletDelta); }
    return r.ok ? { ok: true, fee: r.fee } : { ok: false, error: (r as any).error };
  }

  function doWithdraw(amount: number) {
    const r = withdrawFromBank(bank, amount);
    if (r.ok) { setBank(r.account); setWallet(w => w + r.walletDelta); }
    return r.ok ? { ok: true, fee: r.fee } : { ok: false, error: (r as any).error };
  }

  function doMoveToStash(amount: number) {
    const r = moveToStash(stash, walletCash, amount);
    if (r.ok) { setStash(r.stash); setWallet(w => w + r.walletDelta); }
    return r.ok ? { ok: true } : { ok: false, error: (r as any).error };
  }

  function doMoveFromStash(amount: number) {
    const r = moveFromStash(stash, amount);
    if (r.ok) { setStash(r.stash); setWallet(w => w + r.walletDelta); }
    return r.ok ? { ok: true } : { ok: false, error: (r as any).error };
  }

  function addTransaction(tx: Transaction) {
    setTransactions(prev => [tx, ...prev].slice(0, 50));
  }

  return (
    <Ctx.Provider value={{
      walletCash, bank, stash, inventory, transactions,
      familyTreasury: treasury, listings,
      depositToBank: doDeposit, withdrawFromBank: doWithdraw,
      moveToStash: doMoveToStash, moveFromStash: doMoveFromStash,
      setListings, addTransaction,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useEconomy() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useEconomy outside EconomyProvider');
  return c;
}
