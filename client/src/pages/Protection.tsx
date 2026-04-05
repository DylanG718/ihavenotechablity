/**
 * Protection.tsx — Sleep Mode & Vacation Mode
 * Manage player protection from attacks.
 * Sleep: 8h max, 1 per 24h
 * Vacation: 7 days max, 1 per 30 days, not during war
 */

import { useState } from 'react';
import { useGame } from '../lib/gameContext';
import { PageHeader, InfoAlert, EmptySlate } from '../components/layout/AppShell';
import { MOCK_PROTECTION } from '../lib/worldData';
import { MOCK_FAMILY } from '../lib/mockData';
import type { PlayerProtection, ProtectionMode } from '../../../shared/schema';
import { Moon, Palmtree, Shield, X, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

// ── Helpers ───────────────────────────────────

function msToHours(ms: number): number {
  return ms / 3600000;
}

function formatTimeRemaining(expires_at: string | null): string {
  if (!expires_at) return '';
  const diff = new Date(expires_at).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / 3600000);
  const mins  = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const h    = hours % 24;
    return `${days}d ${h}h remaining`;
  }
  return `${hours}h ${mins}m remaining`;
}

function formatCooldownRemaining(lastAt: string | null, cooldownHours: number): string | null {
  if (!lastAt) return null;
  const diff = Date.now() - new Date(lastAt).getTime();
  const cooldownMs = cooldownHours * 3600000;
  const remaining = cooldownMs - diff;
  if (remaining <= 0) return null;
  const hours = Math.floor(remaining / 3600000);
  const mins  = Math.floor((remaining % 3600000) / 60000);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h cooldown remaining`;
  }
  return `${hours}h ${mins}m cooldown remaining`;
}

// ── Confirm Modal ─────────────────────────────

function ConfirmModal({
  mode,
  onConfirm,
  onCancel,
}: {
  mode: ProtectionMode;
  onConfirm: (hours: number) => void;
  onCancel: () => void;
}) {
  const isSleep    = mode === 'SLEEP';
  const maxHours   = isSleep ? 8 : 168;  // 7 days = 168h
  const [hours, setHours] = useState(isSleep ? 8 : 72);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="panel w-full max-w-sm">
        <div className="panel-header">
          <span className="panel-title">{isSleep ? 'Activate Sleep Mode' : 'Activate Vacation Mode'}</span>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-4 space-y-4">
          {!isSleep && (
            <InfoAlert variant="warn">
              Vacation mode cannot be activated during family wars. Verify your family is not at war before proceeding.
            </InfoAlert>
          )}

          <div>
            <label className="label-caps block mb-2">Duration</label>
            <input
              type="range"
              min={1}
              max={maxHours}
              value={hours}
              onChange={e => setHours(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1h</span>
              <span className="text-foreground font-semibold">
                {hours >= 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h` : `${hours}h`}
              </span>
              <span>{isSleep ? '8h' : '7d'}</span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1" style={{ lineHeight: 1.6 }}>
            {isSleep ? (
              <>
                <p>Sleep mode reduces incoming attack risk during your rest period.</p>
                <p>You will return to NONE mode automatically when the timer expires.</p>
                <p>Cooldown: 1 sleep per 24 hours.</p>
              </>
            ) : (
              <>
                <p>Full protection from all attacks during vacation mode.</p>
                <p>You cannot participate in missions or attacks while on vacation.</p>
                <p>Cooldown: 1 vacation per 30 days.</p>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onConfirm(hours)}
              className="btn btn-primary flex-1"
            >
              {isSleep ? <Moon size={11} /> : <Palmtree size={11} />}
              Activate {isSleep ? 'Sleep' : 'Vacation'}
            </button>
            <button onClick={onCancel} className="btn btn-ghost px-4">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────

export default function Protection() {
  const { player } = useGame();

  const initialProtection: PlayerProtection = MOCK_PROTECTION[player.id] ?? {
    player_id: player.id,
    mode: 'NONE',
    activated_at: null,
    expires_at: null,
    last_sleep_at: null,
    last_vacation_at: null,
  };

  const [protection, setProtection] = useState<PlayerProtection>(initialProtection);
  const [confirmMode, setConfirmMode] = useState<ProtectionMode | null>(null);

  const isAtWar = MOCK_FAMILY.status === 'AT_WAR';

  // Cooldown checks
  const sleepCooldown   = formatCooldownRemaining(protection.last_sleep_at, 24);
  const vacationCooldown = formatCooldownRemaining(protection.last_vacation_at, 30 * 24);

  const canActivateSleep    = protection.mode === 'NONE' && !sleepCooldown;
  const canActivateVacation = protection.mode === 'NONE' && !vacationCooldown && !isAtWar;

  function activate(hours: number) {
    if (!confirmMode || confirmMode === 'NONE') return;
    const now = new Date().toISOString();
    const expires = new Date(Date.now() + hours * 3600000).toISOString();
    setProtection(prev => ({
      ...prev,
      mode: confirmMode,
      activated_at: now,
      expires_at: expires,
      last_sleep_at:    confirmMode === 'SLEEP'    ? now : prev.last_sleep_at,
      last_vacation_at: confirmMode === 'VACATION' ? now : prev.last_vacation_at,
    }));
    setConfirmMode(null);
  }

  function deactivate() {
    setProtection(prev => ({
      ...prev,
      mode: 'NONE',
      activated_at: null,
      expires_at: null,
    }));
  }

  const MODE_COLOR: Record<ProtectionMode, string> = {
    NONE:     '#888',
    SLEEP:    '#6699ff',
    VACATION: '#4a9a4a',
  };

  return (
    <div>
      <PageHeader
        title="Protection Settings"
        sub="Manage your sleep and vacation protection modes."
      />

      {/* Current status card */}
      <div className="panel p-5 mb-5" style={{
        background: protection.mode !== 'NONE' ? 'hsl(220 30% 8%)' : undefined,
        borderColor: protection.mode !== 'NONE' ? MODE_COLOR[protection.mode] + '40' : undefined,
      }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {protection.mode === 'NONE' && <Shield size={20} className="text-muted-foreground" />}
            {protection.mode === 'SLEEP' && <Moon size={20} style={{ color: '#6699ff' }} />}
            {protection.mode === 'VACATION' && <Palmtree size={20} style={{ color: '#4a9a4a' }} />}
            <div>
              <div className="label-caps mb-0.5">Current Protection</div>
              <div className="font-bold text-sm" style={{ color: MODE_COLOR[protection.mode] }}>
                {protection.mode === 'NONE' ? 'No Protection Active' : protection.mode + ' MODE'}
              </div>
            </div>
          </div>
          {protection.mode !== 'NONE' && (
            <button onClick={deactivate} className="btn btn-danger text-xs">
              <X size={11} /> Cancel Protection
            </button>
          )}
        </div>

        {protection.mode !== 'NONE' && protection.expires_at && (
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock size={10} />
              <span>Activated: {protection.activated_at ? new Date(protection.activated_at).toLocaleString() : '—'}</span>
            </div>
            <div className="flex items-center gap-2 font-semibold" style={{ color: MODE_COLOR[protection.mode] }}>
              <Clock size={10} />
              <span>{formatTimeRemaining(protection.expires_at)}</span>
            </div>
          </div>
        )}

        {protection.mode === 'NONE' && (
          <p className="text-xs text-muted-foreground">
            You have no active protection. You can receive attacks normally.
          </p>
        )}
      </div>

      {/* Sleep Mode card */}
      <div className="panel p-5 mb-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <Moon size={18} style={{ color: '#6699ff', shrink: 0 }} />
            <div>
              <div className="font-semibold text-sm text-foreground mb-0.5">Sleep Mode</div>
              <div className="text-xs text-muted-foreground">Up to 8 hours. Reduces incoming attack risk. 1 use per 24 hours.</div>
            </div>
          </div>
          <button
            onClick={() => setConfirmMode('SLEEP')}
            disabled={!canActivateSleep}
            className={`btn text-xs shrink-0 ${canActivateSleep ? 'btn-primary' : 'btn-ghost opacity-40'}`}
          >
            <Moon size={11} /> Activate Sleep
          </button>
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          {sleepCooldown && (
            <div className="flex items-center gap-1.5" style={{ color: '#cc9900' }}>
              <Clock size={10} />
              <span>{sleepCooldown}</span>
            </div>
          )}
          {protection.last_sleep_at && !sleepCooldown && (
            <div className="flex items-center gap-1.5 text-success">
              <CheckCircle size={10} />
              <span>Ready to use · Last used: {new Date(protection.last_sleep_at).toLocaleDateString()}</span>
            </div>
          )}
          {!protection.last_sleep_at && (
            <div className="flex items-center gap-1.5 text-success">
              <CheckCircle size={10} />
              <span>Ready to use · Never used</span>
            </div>
          )}
          {protection.mode !== 'NONE' && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <AlertTriangle size={10} />
              <span>Cannot activate — protection already active</span>
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-border/40 text-xs text-muted-foreground" style={{ lineHeight: 1.6 }}>
          <strong className="text-foreground">Rules:</strong> Activates immediately. Expires after chosen duration (1–8 hours).
          If attacked during sleep, attack has a reduced chance of success.
          Cannot stack with Vacation Mode. Cooldown resets 24 hours after last use.
        </div>
      </div>

      {/* Vacation Mode card */}
      <div className="panel p-5 mb-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <Palmtree size={18} style={{ color: '#4a9a4a', shrink: 0 }} />
            <div>
              <div className="font-semibold text-sm text-foreground mb-0.5">Vacation Mode</div>
              <div className="text-xs text-muted-foreground">Up to 7 days. Full protection. 1 use per 30 days. Cannot activate during war.</div>
            </div>
          </div>
          <button
            onClick={() => setConfirmMode('VACATION')}
            disabled={!canActivateVacation}
            className={`btn text-xs shrink-0 ${canActivateVacation ? 'btn-primary' : 'btn-ghost opacity-40'}`}
          >
            <Palmtree size={11} /> Activate Vacation
          </button>
        </div>

        <div className="space-y-1 text-xs">
          {isAtWar && (
            <div className="flex items-center gap-1.5" style={{ color: '#cc3333' }}>
              <AlertTriangle size={10} />
              <span>Cannot activate during family war</span>
            </div>
          )}
          {vacationCooldown && (
            <div className="flex items-center gap-1.5" style={{ color: '#cc9900' }}>
              <Clock size={10} />
              <span>{vacationCooldown}</span>
            </div>
          )}
          {protection.last_vacation_at && !vacationCooldown && !isAtWar && (
            <div className="flex items-center gap-1.5 text-success">
              <CheckCircle size={10} />
              <span>Ready to use · Last used: {new Date(protection.last_vacation_at).toLocaleDateString()}</span>
            </div>
          )}
          {!protection.last_vacation_at && !isAtWar && (
            <div className="flex items-center gap-1.5 text-success">
              <CheckCircle size={10} />
              <span>Ready to use · Never used</span>
            </div>
          )}
          {protection.mode !== 'NONE' && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <AlertTriangle size={10} />
              <span>Cannot activate — protection already active</span>
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-border/40 text-xs text-muted-foreground" style={{ lineHeight: 1.6 }}>
          <strong className="text-foreground">Rules:</strong> Full immunity from all attacks.
          You cannot attack others, start missions, or participate in wars during vacation mode.
          Cooldown resets 30 days after last use. Cannot be activated when your family is AT_WAR.
        </div>
      </div>

      {/* Rules summary */}
      <div className="panel p-4">
        <span className="label-caps block mb-2">Protection Rules Summary</span>
        <div className="text-xs text-muted-foreground space-y-1" style={{ lineHeight: 1.7 }}>
          <p>· Only one protection mode can be active at a time.</p>
          <p>· Sleep mode: max 8 hours, once per 24 hours.</p>
          <p>· Vacation mode: max 7 days, once per 30 days, not available during war.</p>
          <p>· Cancelling early does NOT reset the cooldown timer.</p>
          <p>· Protection ends automatically when the timer expires.</p>
          <p>· Leadership may be able to override your protection in exceptional circumstances.</p>
        </div>
      </div>

      {confirmMode && confirmMode !== 'NONE' && (
        <ConfirmModal
          mode={confirmMode}
          onConfirm={activate}
          onCancel={() => setConfirmMode(null)}
        />
      )}
    </div>
  );
}
