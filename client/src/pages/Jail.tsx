/**
 * Jail.tsx — Unified prison screen.
 *
 * Handles both:
 *   - Regular jail (non-hitman players who fail jobs)
 *   - Hitman Blacksite link (redirects to existing Prison.tsx for hitmen)
 *
 * Tabs:
 *   MY CELL     — current sentence status + available actions
 *   KITES       — in-prison messages to/from family
 *   JAIL CHAT   — global channel + family block channel
 *   WHO'S IN    — roster of all currently jailed players
 *
 * Blocked actions banner: shown when player is in jail to remind them
 * that normal actions (missions, jobs, treasury, etc.) are unavailable.
 */

import { useState, useEffect, useRef } from 'react';
import { useGame } from '../lib/gameContext';
import { ENABLE_DEV_TOOLS } from '../lib/env';
import { useLocation } from 'wouter';
import {
  MOCK_JAIL_RECORDS, MOCK_KITES, MOCK_JAIL_CHAT,
  MOCK_BAIL_MISSIONS, MOCK_ACTION_LAST_USED,
} from '../lib/jailMockData';
import {
  resolveJailAction, formatSentenceRemaining, sentenceProgress,
  isReleaseEligible, isActionAvailable, jailTierLabel, jailTierColor,
  jailStatusLabel,
} from '../lib/jailEngine';
import { JAIL_ACTIONS, computeArrestChance } from '../../../shared/jail';
import type { JailRecord, JailActionType, JailChatMessage, Kite, JailChatChannel } from '../../../shared/jail';
import { MOCK_PLAYERS, fmt } from '../lib/mockData';
import { PageHeader, SectionPanel, InfoAlert } from '../components/layout/AppShell';
import {
  Lock, MessageSquare, Users, Activity, Send, AlertTriangle,
  ChevronRight, Shield, Clock, DollarSign, CheckCircle,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

const PLAYER_NAMES: Record<string, string> = {
  'p-soldier':     'Vinnie D',
  'p-associate':   'Luca B',
  'p-recruit':     'Joey Socks',
  'p-rival-capo':  'Nico Russo',
  'p-boss':        'Don Corrado',
  'p-consigliere': 'The Counselor',
};

// ─────────────────────────────────────────────
// Sentence countdown hook
// ─────────────────────────────────────────────

function useSentenceClock(record: JailRecord | null): string {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    if (!record) return;
    function update() { setDisplay(formatSentenceRemaining(record!)); }
    update();
    const id = setInterval(update, 10_000);
    return () => clearInterval(id);
  }, [record]);
  return display;
}

// ─────────────────────────────────────────────
// 1. MY CELL tab
// ─────────────────────────────────────────────

function SentenceBar({ record }: { record: JailRecord }) {
  const pct  = sentenceProgress(record);
  const tier = record.tier;
  const color = jailTierColor(tier);
  const timeLeft = useSentenceClock(record);
  const eligible = isReleaseEligible(record);

  return (
    <div className="panel" style={{ marginBottom: '10px', overflow: 'hidden' }}>
      {/* Tier header */}
      <div style={{
        background: `${color}18`, borderBottom: `1px solid ${color}44`,
        padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color }}>{jailTierLabel(tier)}</div>
          <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>{record.arrested_for}</div>
        </div>
        <span style={{
          fontSize: '10px', fontWeight: 'bold',
          color: eligible ? '#4a9a4a' : '#cc9900',
          border: `1px solid ${eligible ? '#2a4a2a' : '#4a3a00'}`,
          padding: '2px 8px',
        }}>
          {jailStatusLabel(record.status)}
        </span>
      </div>

      {/* Sentence progress */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '10px' }}>
          <span style={{ color: '#888' }}>Sentence progress</span>
          <span style={{ fontWeight: 'bold', color: eligible ? '#4a9a4a' : '#e0e0e0' }}>
            {eligible ? '✓ Complete' : timeLeft}
          </span>
        </div>
        <div style={{ height: '8px', background: '#1a1a1a', border: '1px solid #2a2a2a', marginBottom: '10px' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: eligible ? '#2a6a2a' : color,
            transition: 'width 0.5s ease',
          }} />
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {[
            ['Heat at Arrest', `${record.heat_at_arrest}/100`],
            ['Bribe Attempts', `${record.bribe_attempts}/2`],
            ['Lawyer Uses',    `${record.lawyer_attempts}/3`],
          ].map(([l, v]) => (
            <div key={String(l)} style={{ background: '#111', border: '1px solid #2a2a2a', padding: '5px 8px' }}>
              <div className="label-caps">{l}</div>
              <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#e0e0e0' }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Bail mission progress */}
        {record.bail_mission_active && (
          <div style={{
            marginTop: '10px', background: '#0d1020', border: '1px solid #1e2840',
            padding: '8px 10px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px' }}>
              <span style={{ color: '#5580bb', fontWeight: 'bold' }}>
                🚔 Family Bail Mission Active
              </span>
              <span style={{ color: '#5580bb' }}>{record.bail_mission_progress}%</span>
            </div>
            <div style={{ height: '5px', background: '#1a2040', border: '1px solid #2a3060' }}>
              <div style={{
                height: '100%', width: `${record.bail_mission_progress}%`,
                background: '#5580bb', transition: 'width 0.5s',
              }} />
            </div>
            <div style={{ fontSize: '9px', color: '#444', marginTop: '4px' }}>
              On success: sentence −4 hours
            </div>
          </div>
        )}

        {/* Release eligible walk-out */}
        {eligible && (
          <button
            className="btn btn-success"
            style={{ width: '100%', padding: '9px', marginTop: '12px', fontSize: '11px' }}
            data-testid="walk-out"
            onClick={() => alert('Released! (In production, updates player status to ACTIVE)')}
          >
            ✓ Walk Out — Sentence Served
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Prison action cards
// ─────────────────────────────────────────────

function ActionCard({ record, playerCash, lastUsed, onAction }: {
  record: JailRecord;
  playerCash: number;
  lastUsed: Record<JailActionType, string | null>;
  onAction: (result: ReturnType<typeof resolveJailAction>, updatedRecord: JailRecord) => void;
}) {
  const [result, setResult] = useState<ReturnType<typeof resolveJailAction> | null>(null);
  const [done, setDone] = useState<Set<JailActionType>>(new Set());

  function handleAction(id: JailActionType) {
    const r = resolveJailAction(id, record, playerCash);
    setResult(r);
    setDone(prev => new Set([...prev, id]));
    // Update record mock state
    const updated: JailRecord = {
      ...record,
      sentence_delta_hours: record.sentence_delta_hours + (r.released ? -999 : r.sentence_delta_hours),
      bribe_attempts:  id === 'BRIBE_GUARD'  ? record.bribe_attempts + 1  : record.bribe_attempts,
      lawyer_attempts: id === 'HIRE_LAWYER'  ? record.lawyer_attempts + 1 : record.lawyer_attempts,
      bail_mission_active: id === 'REQUEST_BAIL' ? true : record.bail_mission_active,
      status: r.released ? 'RELEASED' : record.status,
    };
    onAction(r, updated);
  }

  return (
    <div>
      {result && (
        <div style={{
          padding: '10px 14px', marginBottom: '10px',
          background: result.success ? '#0a1a0a' : '#1a0808',
          border: `1px solid ${result.success ? '#2a4a2a' : '#4a1010'}`,
          fontSize: '10px',
        }}>
          <div style={{ fontWeight: 'bold', color: result.success ? '#4a9a4a' : '#cc3333', marginBottom: '4px' }}>
            {result.success ? '✓ Action Succeeded' : '✗ Action Failed'}
          </div>
          <div style={{ color: '#aaa', marginBottom: '6px' }}>{result.notes}</div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '9px' }}>
            {result.heat_delta !== 0 && (
              <span style={{ color: result.heat_delta > 0 ? '#cc7700' : '#4a9a4a' }}>
                Heat {result.heat_delta > 0 ? '+' : ''}{result.heat_delta}
              </span>
            )}
            {result.cash_gained !== 0 && (
              <span style={{ color: result.cash_gained > 0 ? '#ffcc33' : '#cc3333' }}>
                {result.cash_gained > 0 ? '+' : ''}{fmt(result.cash_gained)}
              </span>
            )}
            {result.sentence_delta_hours !== 0 && !result.released && (
              <span style={{ color: '#4a9a4a' }}>
                Sentence {result.sentence_delta_hours}h
              </span>
            )}
            {result.released && (
              <span style={{ color: '#4a9a4a', fontWeight: 'bold' }}>Released!</span>
            )}
          </div>
        </div>
      )}

      <div className="ml-grid-auto" style={{ gap: '6px' }}>
        {JAIL_ACTIONS.map(action => {
          const { available, reason } = isActionAvailable(action, record, lastUsed);
          const cantAfford = action.cash_cost !== null && playerCash < action.cash_cost;
          const isDisabled = !available || cantAfford || done.has(action.id);
          const riskColor = action.risk === 'HIGH' ? '#cc3333' : action.risk === 'MEDIUM' ? '#cc9900' : '#4a9a4a';

          return (
            <div
              key={action.id}
              style={{
                background: isDisabled ? '#111' : '#181818',
                border: `1px solid ${isDisabled ? '#1a1a1a' : '#2a2a2a'}`,
                padding: '10px 12px',
                opacity: isDisabled ? 0.5 : 1,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#e0e0e0' }}>
                  {action.label}
                </span>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {action.cash_cost && (
                    <span style={{ fontSize: '9px', color: cantAfford ? '#cc3333' : '#ffcc33' }}>
                      {fmt(action.cash_cost)}
                    </span>
                  )}
                  <span style={{ fontSize: '9px', color: riskColor, border: `1px solid ${riskColor}44`, padding: '1px 4px' }}>
                    {action.risk}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '9px', color: '#888', lineHeight: '1.45', marginBottom: '6px' }}>
                {action.description}
              </p>
              {reason && (
                <p style={{ fontSize: '9px', color: '#555', marginBottom: '4px', fontStyle: 'italic' }}>
                  {reason}
                </p>
              )}
              {!isDisabled && (
                <button
                  onClick={() => handleAction(action.id)}
                  className="btn btn-ghost"
                  style={{ fontSize: '10px', padding: '3px 12px' }}
                  data-testid={`jail-action-${action.id.toLowerCase()}`}
                >
                  Execute
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 2. KITES tab
// ─────────────────────────────────────────────

function KitesTab({ myPlayerId, familyId }: { myPlayerId: string; familyId: string | null }) {
  const [composeOpen, setComposeOpen] = useState(false);
  const [to, setTo] = useState<'FAMILY_LEADERSHIP' | string>('FAMILY_LEADERSHIP');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sent, setSent] = useState(false);

  const myKites = MOCK_KITES.filter(k =>
    k.from_player_id === myPlayerId || k.to_player_id === myPlayerId
  );

  const statusColors: Record<string, string> = {
    SENT: '#888', DELIVERED: '#cc9900', READ: '#5580bb', REPLIED: '#4a9a4a',
  };

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
    setComposeOpen(false);
    setSubject('');
    setBody('');
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <p style={{ fontSize: '10px', color: '#888', margin: 0 }}>
          Send notes to your family. Leadership can reply directly.
        </p>
        <button
          onClick={() => setComposeOpen(!composeOpen)}
          className="btn btn-primary"
          style={{ padding: '5px 12px', fontSize: '10px' }}
          data-testid="compose-kite"
        >
          + Write Kite
        </button>
      </div>

      {sent && (
        <div style={{ background: '#0a1a0a', border: '1px solid #2a4a2a', padding: '8px 12px', marginBottom: '10px', fontSize: '10px', color: '#4a9a4a' }}>
          ✓ Kite sent. Your family will see it soon.
        </div>
      )}

      {composeOpen && (
        <div style={{ background: '#0d1020', border: '1px solid #1e2840', padding: '14px', marginBottom: '12px' }}>
          <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#5580bb', marginBottom: '10px' }}>New Kite</p>
          <form onSubmit={handleSend}>
            <div className="form-group">
              <label>To</label>
              <select
                value={to} onChange={e => setTo(e.target.value)}
                className="game-input" style={{ width: '100%' }}
                data-testid="kite-to-select"
              >
                <option value="FAMILY_LEADERSHIP">Family Leadership (Broadcast)</option>
                <option value="p-boss">Don Corrado</option>
                <option value="p-consigliere">The Counselor</option>
                <option value="p-underboss">Sal the Fist</option>
              </select>
            </div>
            <div className="form-group">
              <label>Subject</label>
              <input
                value={subject} onChange={e => setSubject(e.target.value)}
                className="game-input" placeholder="What's this about?"
                required data-testid="kite-subject-input"
              />
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea
                value={body} onChange={e => setBody(e.target.value)}
                className="game-input" rows={4} style={{ width: '100%', resize: 'none' }}
                placeholder="Write your kite..."
                required data-testid="kite-body-input"
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '7px' }}
                data-testid="send-kite">
                Send Kite
              </button>
              <button type="button" onClick={() => setComposeOpen(false)} className="btn btn-ghost" style={{ padding: '7px 12px' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kite list */}
      {myKites.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#555', fontSize: '10px' }}>
          No kites yet. Write one to your family.
        </div>
      ) : (
        myKites.map(kite => (
          <div key={kite.id} style={{
            border: '1px solid #2a2a2a', background: '#181818',
            padding: '10px 12px', marginBottom: '6px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#e0e0e0' }}>
                {kite.from_player_id === myPlayerId
                  ? `→ To: ${kite.to_player_id === 'FAMILY_LEADERSHIP' ? 'Leadership' : kite.to_player_alias}`
                  : `← From: ${kite.from_player_alias}`
                }
              </div>
              <span style={{ fontSize: '9px', color: statusColors[kite.status] ?? '#888' }}>
                {kite.status}
              </span>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffcc33', marginBottom: '4px' }}>
              {kite.subject}
            </div>
            <div style={{ fontSize: '10px', color: '#aaa', lineHeight: '1.5', marginBottom: kite.reply_body ? '8px' : 0 }}>
              {kite.body}
            </div>
            {kite.reply_body && (
              <div style={{
                borderTop: '1px solid #2a2a2a', paddingTop: '8px', marginTop: '2px',
                fontSize: '10px', color: '#4a9a4a',
              }}>
                <span style={{ fontSize: '9px', color: '#555' }}>Reply: </span>
                {kite.reply_body}
              </div>
            )}
            <div style={{ fontSize: '9px', color: '#444', marginTop: '4px' }}>
              {timeAgo(kite.sent_at)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 3. JAIL CHAT tab
// ─────────────────────────────────────────────

function JailChatTab({ myPlayerId, myFamilyId, jailTier }: {
  myPlayerId: string;
  myFamilyId: string | null;
  jailTier: 'COUNTY' | 'STATE' | 'FEDERAL';
}) {
  const [channel, setChannel] = useState<JailChatChannel>('GLOBAL_JAIL');
  const [draft, setDraft] = useState('');
  const [localMessages, setLocalMessages] = useState<JailChatMessage[]>(MOCK_JAIL_CHAT);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = localMessages.filter(m => {
    if (m.channel !== channel) return false;
    if (channel === 'FAMILY_BLOCK') {
      // Only show if same family
      return m.player_id === myPlayerId ||
        MOCK_JAIL_RECORDS.find(r => r.player_id === m.player_id)?.family_id === myFamilyId;
    }
    return true;
  });

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    const newMsg: JailChatMessage = {
      id: `jc-${Date.now()}`,
      channel,
      player_id: myPlayerId,
      player_alias: PLAYER_NAMES[myPlayerId] ?? myPlayerId,
      family_name: myFamilyId ? 'The Corrado Family' : null,
      jail_tier: jailTier,
      body: draft.trim(),
      sent_at: new Date().toISOString(),
      reply_to_id: null,
    };
    setLocalMessages(prev => [...prev, newMsg]);
    setDraft('');
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  const tierColors: Record<string, string> = {
    COUNTY: '#cc9900', STATE: '#cc7700', FEDERAL: '#cc3333',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Channel tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
        {(['GLOBAL_JAIL', 'FAMILY_BLOCK'] as const).map(ch => (
          <button
            key={ch}
            onClick={() => setChannel(ch)}
            className={`btn ${channel === ch ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '10px' }}
            data-testid={`chat-tab-${ch.toLowerCase()}`}
          >
            {ch === 'GLOBAL_JAIL' ? '🌐 General Population' : '👥 Family Block'}
          </button>
        ))}
      </div>

      {/* Channel description */}
      <p style={{ fontSize: '9px', color: '#555', marginBottom: '8px' }}>
        {channel === 'GLOBAL_JAIL'
          ? 'All jailed players across all families. Assume everyone\'s watching.'
          : 'Your family\'s jailed members only. Private channel.'}
      </p>

      {/* Messages */}
      <div style={{
        background: '#111', border: '1px solid #1a1a1a',
        height: '320px', overflowY: 'auto',
        padding: '10px', marginBottom: '8px',
      }}>
        {messages.length === 0 ? (
          <p style={{ color: '#444', fontSize: '10px', textAlign: 'center', padding: '20px 0' }}>
            No messages yet in this channel.
          </p>
        ) : (
          messages.map(msg => {
            const isMe = msg.player_id === myPlayerId;
            return (
              <div key={msg.id} style={{
                marginBottom: '10px',
                paddingLeft: isMe ? '20px' : 0,
                paddingRight: isMe ? 0 : '20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '10px', color: isMe ? '#ffcc33' : '#e0e0e0' }}>
                    {msg.player_alias}
                  </span>
                  {msg.family_name && (
                    <span style={{ fontSize: '9px', color: '#555' }}>{msg.family_name}</span>
                  )}
                  <span style={{
                    fontSize: '8px', color: tierColors[msg.jail_tier] ?? '#888',
                    border: `1px solid ${tierColors[msg.jail_tier] ?? '#888'}44`,
                    padding: '0px 4px',
                  }}>
                    {msg.jail_tier}
                  </span>
                  <span style={{ fontSize: '8px', color: '#444', marginLeft: 'auto' }}>
                    {timeAgo(msg.sent_at)}
                  </span>
                </div>
                {msg.reply_to_id && (
                  <div style={{ fontSize: '9px', color: '#555', fontStyle: 'italic', marginBottom: '2px', paddingLeft: '8px', borderLeft: '2px solid #2a2a2a' }}>
                    ↩ replying to earlier message
                  </div>
                )}
                <div style={{
                  fontSize: '10px', color: '#aaa', lineHeight: '1.5',
                  background: isMe ? '#1a1a0a' : '#181818',
                  border: `1px solid ${isMe ? '#3a3a00' : '#2a2a2a'}`,
                  padding: '6px 8px',
                }}>
                  {msg.body}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '6px' }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder={`Message ${channel === 'GLOBAL_JAIL' ? 'general population' : 'your family block'}...`}
          className="game-input"
          style={{ flex: 1 }}
          data-testid="jail-chat-input"
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '6px 14px' }}
          data-testid="send-jail-chat">
          <Send size={12} />
        </button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────
// 4. WHO'S IN tab
// ─────────────────────────────────────────────

function WhosInTab() {
  const allIn = MOCK_JAIL_RECORDS.filter(r => r.status !== 'RELEASED');
  return (
    <div>
      <p style={{ fontSize: '10px', color: '#888', marginBottom: '10px' }}>
        {allIn.length} player{allIn.length !== 1 ? 's' : ''} currently incarcerated.
      </p>
      {allIn.map(r => {
        const player = MOCK_PLAYERS[r.player_id];
        const color  = jailTierColor(r.tier);
        const timeLeft = formatSentenceRemaining(r);
        return (
          <div key={r.id} style={{
            border: '1px solid #2a2a2a', background: '#181818',
            padding: '10px 12px', marginBottom: '6px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          }}
          data-testid={`jailed-player-${r.player_id}`}
          >
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#e0e0e0', marginBottom: '3px' }}>
                {player?.alias ?? r.player_id}
                <span style={{ marginLeft: '8px', fontSize: '9px', color: '#888' }}>
                  {player?.archetype}
                </span>
              </div>
              <div style={{ fontSize: '9px', color: '#666', marginBottom: '3px' }}>
                {r.arrested_for}
              </div>
              <span style={{ fontSize: '9px', color, border: `1px solid ${color}44`, padding: '1px 5px' }}>
                {jailTierLabel(r.tier)}
              </span>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
              <div style={{
                fontSize: '10px', fontWeight: 'bold',
                color: isReleaseEligible(r) ? '#4a9a4a' : '#cc9900',
              }}>
                {isReleaseEligible(r) ? 'Release Eligible' : timeLeft}
              </div>
              {r.bail_mission_active && (
                <div style={{ fontSize: '9px', color: '#5580bb', marginTop: '3px' }}>
                  Bail mission: {r.bail_mission_progress}%
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// Blocked-actions banner
// ─────────────────────────────────────────────

function BlockedBanner() {
  return (
    <div style={{
      background: '#1a0808', border: '1px solid #4a1010',
      padding: '10px 14px', marginBottom: '12px', fontSize: '10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <Lock size={12} style={{ color: '#cc3333', flexShrink: 0 }} />
        <span style={{ fontWeight: 'bold', color: '#cc3333' }}>Actions Blocked While Incarcerated</span>
      </div>
      <div style={{ color: '#888', lineHeight: '1.5' }}>
        You cannot run missions, manage treasury, post contracts, or use the black market.
        Chat and kites remain available. Your family can run a bail mission to reduce your sentence.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Arrest chance explainer (shown before/after arrest)
// ─────────────────────────────────────────────

function ArrestChanceBreakdown({ tier, role, heat }: {
  tier: string; role: string; heat: number;
}) {
  const tierMap: Record<string, any> = { STARTER: 'STARTER', STANDARD: 'STANDARD', ADVANCED: 'ADVANCED', ELITE: 'ELITE' };
  const t = tierMap[tier] ?? 'STANDARD';
  const chance = computeArrestChance({ tier: t, role: role as any, familyHeat: heat });

  return (
    <div style={{ background: '#181818', border: '1px solid #2a2a2a', padding: '10px 12px', marginBottom: '10px', fontSize: '10px' }}>
      <div className="label-caps" style={{ marginBottom: '6px' }}>Arrest Formula</div>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', color: '#aaa' }}>
        <span>Base ({tier}): {Math.round((computeArrestChance({tier: t, role: 'RECRUIT', familyHeat: 0})) * 100)}%</span>
        <span style={{ color: '#4a9a4a' }}>Rank bonus: −{Math.round(Math.max(0, (computeArrestChance({tier: t, role: 'RECRUIT', familyHeat: 0})) - (computeArrestChance({tier: t, role: role as any, familyHeat: 0}))) * 100)}%</span>
        <span style={{ color: '#cc7700' }}>Heat ({heat}): +{Math.round(Math.max(0, heat - 30) / 10 * 2)}%</span>
        <span style={{ fontWeight: 'bold', color: '#ffcc33' }}>= {Math.round(chance * 100)}% arrest chance</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Jail page
// ─────────────────────────────────────────────

export default function JailPage() {
  const { player, gameRole } = useGame();
  const [, nav] = useLocation();
  const [tab, setTab] = useState<'CELL' | 'KITES' | 'CHAT' | 'ROSTER'>('CELL');
  const [devPlayerId, setDevPlayerId] = useState(player.id);

  // Find jail record for current player
  const myRecord = MOCK_JAIL_RECORDS.find(r => r.player_id === devPlayerId && r.status !== 'RELEASED');
  const [record, setRecord] = useState<JailRecord | null>(myRecord ?? null);

  // Action cooldowns
  const lastUsed = (MOCK_ACTION_LAST_USED[devPlayerId] ?? {}) as Record<JailActionType, string | null>;

  const isJailed = !!record && record.status !== 'RELEASED';
  const isHitman = gameRole === 'SOLO_HITMAN';

  // DEV: load different jailed players
  function handleDevSwitch(pid: string) {
    setDevPlayerId(pid);
    const r = MOCK_JAIL_RECORDS.find(x => x.player_id === pid && x.status !== 'RELEASED');
    setRecord(r ?? null);
  }

  function handleActionResult(result: ReturnType<typeof resolveJailAction>, updated: JailRecord) {
    setRecord(updated);
  }

  return (
    <div>
      <PageHeader
        title="County Jail"
        sub="Arrest and detention records. Actions are limited while incarcerated."
      />

      {/* DEV: View as selector (dev mode only) */}
      {ENABLE_DEV_TOOLS && (
        <div style={{ background: '#0d1020', border: '1px solid #1e2840', padding: '8px 12px', marginBottom: '10px', fontSize: '10px' }}>
          <span style={{ color: '#5580bb', marginRight: '8px' }}>DEV: View as</span>
          <select
            value={devPlayerId}
            onChange={e => handleDevSwitch(e.target.value)}
            style={{ background: '#111', border: '1px solid #2a3a5a', color: '#e0e0e0', fontSize: '10px', padding: '2px 6px' }}
            data-testid="dev-player-select"
          >
            {MOCK_JAIL_RECORDS.map(r => (
              <option key={r.id} value={r.player_id}>
                {PLAYER_NAMES[r.player_id] ?? r.player_id} — {r.tier} [{r.status}]
              </option>
            ))}
            <option value="p-boss">Don Corrado (not jailed — leadership view)</option>
          </select>
        </div>
      )}

      {/* Hitman redirect notice */}
      {isHitman && (
        <InfoAlert variant="purple">
          As a Hitman, you go to The Box (Blacksite) — not regular jail.
          <button
            onClick={() => nav('/prison')}
            className="btn btn-ghost"
            style={{ fontSize: '10px', marginLeft: '10px' }}
          >
            → The Box
          </button>
        </InfoAlert>
      )}

      {/* Blocked actions banner */}
      {isJailed && <BlockedBanner />}

      {/* Arrest chance explainer for current player */}
      {record && (
        <ArrestChanceBreakdown
          tier={record.mission_tier}
          role={player.family_role ?? 'UNAFFILIATED'}
          heat={record.heat_at_arrest}
        />
      )}

      {/* No jail record — show leadership view */}
      {!record && !isHitman && (
        <div>
          <SectionPanel title="Your Family Members Currently Jailed">
            {MOCK_JAIL_RECORDS.filter(r =>
              r.family_id === (player.family_id ?? 'fam-1') && r.status !== 'RELEASED'
            ).length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#555', fontSize: '10px' }}>
                No family members currently incarcerated.
              </div>
            ) : (
              MOCK_JAIL_RECORDS
                .filter(r => r.family_id === (player.family_id ?? 'fam-1') && r.status !== 'RELEASED')
                .map(r => {
                  const p = MOCK_PLAYERS[r.player_id];
                  return (
                    <div key={r.id} style={{
                      padding: '8px 12px', borderBottom: '1px solid #1a1a1a',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#e0e0e0' }}>
                          {p?.alias ?? r.player_id}
                        </div>
                        <div style={{ fontSize: '9px', color: '#888' }}>{r.arrested_for}</div>
                        <div style={{ fontSize: '9px', color: jailTierColor(r.tier), marginTop: '2px' }}>
                          {jailTierLabel(r.tier)} — {jailStatusLabel(r.status)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', color: '#cc9900', fontWeight: 'bold' }}>
                          {formatSentenceRemaining(r)}
                        </div>
                        {!r.bail_mission_active && (
                          <button
                            className="btn btn-ghost"
                            style={{ fontSize: '9px', padding: '2px 8px', marginTop: '4px' }}
                            data-testid={`run-bail-${r.player_id}`}
                            onClick={() => alert('Bail mission posted to mission board!')}
                          >
                            Run Bail Mission
                          </button>
                        )}
                        {r.bail_mission_active && (
                          <span style={{ fontSize: '9px', color: '#5580bb', display: 'block', marginTop: '4px' }}>
                            Bail: {r.bail_mission_progress}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </SectionPanel>

          <div style={{ marginTop: '16px' }}>
            <p className="label-caps" style={{ marginBottom: '8px' }}>All Inmates</p>
            <WhosInTab />
          </div>
        </div>
      )}

      {/* Jailed player view — tabbed */}
      {record && (
        <>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '2px' }}>
            {([
              { id: 'CELL',   icon: <Lock size={11} />,         label: 'My Cell' },
              { id: 'KITES',  icon: <MessageSquare size={11} />,label: 'Kites' },
              { id: 'CHAT',   icon: <Send size={11} />,         label: 'Jail Chat' },
              { id: 'ROSTER', icon: <Users size={11} />,        label: "Who's In" },
            ] as const).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`btn ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', flexShrink: 0 }}
                data-testid={`jail-tab-${t.id.toLowerCase()}`}
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {tab === 'CELL' && (
            <>
              <SentenceBar record={record} />
              <SectionPanel title="Available Actions">
                <div style={{ padding: '10px 12px' }}>
                  <ActionCard
                    record={record}
                    playerCash={player.stats.cash}
                    lastUsed={lastUsed}
                    onAction={handleActionResult}
                  />
                </div>
              </SectionPanel>
            </>
          )}

          {tab === 'KITES' && (
            <KitesTab myPlayerId={devPlayerId} familyId={record.family_id} />
          )}

          {tab === 'CHAT' && (
            <JailChatTab
              myPlayerId={devPlayerId}
              myFamilyId={record.family_id}
              jailTier={record.tier}
            />
          )}

          {tab === 'ROSTER' && <WhosInTab />}
        </>
      )}
    </div>
  );
}
