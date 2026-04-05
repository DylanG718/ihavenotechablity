/**
 * Mailbox.tsx — Chain-of-Command Mailbox
 * Messages flow only up the hierarchy to your immediate superior.
 * Leadership can escalate messages further up.
 */

import { useState } from 'react';
import { useGame } from '../lib/gameContext';
import { MOCK_PLAYERS, MOCK_FAMILY } from '../lib/mockData';
import { PageHeader, InfoAlert, EmptySlate } from '../components/layout/AppShell';
import { MOCK_CHAIN_MESSAGES } from '../lib/worldData';
import { RoleBadge } from '../components/ui/Badges';
import type { ChainMessage, MessageStatus, FamilyRole } from '../../../shared/schema';
import { Send, ChevronUp, Inbox, ArrowUpRight, CheckCircle } from 'lucide-react';

// ── Hierarchy rules ───────────────────────────
// Who is the immediate superior for each role?
const SUPERIOR_ROLE: Partial<Record<FamilyRole, FamilyRole>> = {
  RECRUIT:     'CAPO',
  ASSOCIATE:   'CAPO',
  SOLDIER:     'CAPO',
  CAPO:        'UNDERBOSS',
  UNDERBOSS:   'BOSS',
  CONSIGLIERE: 'BOSS',
};

function getSuperiorPlayerId(currentRole: FamilyRole): string | null {
  const superiorRole = SUPERIOR_ROLE[currentRole];
  if (!superiorRole) return null;
  const superior = MOCK_FAMILY.members.find(m => m.role === superiorRole);
  return superior?.player_id ?? null;
}

function getSuperiorAlias(superiorId: string | null): string {
  if (!superiorId) return 'No superior (you are the Boss)';
  return MOCK_PLAYERS[superiorId]?.alias ?? 'Unknown';
}

// ── Status badge ──────────────────────────────

function StatusBadge({ status }: { status: MessageStatus }) {
  const map: Record<MessageStatus, { label: string; cls: string }> = {
    OPEN:      { label: 'Open',      cls: 'badge-green' },
    ESCALATED: { label: 'Escalated', cls: 'badge-yellow' },
    RESOLVED:  { label: 'Resolved',  cls: 'badge-gray' },
  };
  const { label, cls } = map[status];
  return <span className={cls}>{label}</span>;
}

// ── Time helper ───────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (days > 0)  return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'Recently';
}

// ── Compose Modal ─────────────────────────────

function ComposeModal({
  superiorId,
  onClose,
  onSend,
}: {
  superiorId: string | null;
  onClose: () => void;
  onSend: (subject: string, body: string) => void;
}) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const superiorAlias = getSuperiorAlias(superiorId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="panel w-full max-w-lg">
        <div className="panel-header">
          <span className="panel-title">Compose Message</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-4 space-y-3">
          <InfoAlert variant="warn">
            Messages go to your direct superior only. For urgent matters, request escalation after sending.
          </InfoAlert>

          <div>
            <label className="label-caps block mb-1">To</label>
            <div className="game-input opacity-60 cursor-not-allowed" style={{ pointerEvents: 'none' }}>
              {superiorAlias} (your superior)
            </div>
          </div>

          <div>
            <label className="label-caps block mb-1">Subject</label>
            <input
              className="game-input"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Message subject..."
            />
          </div>

          <div>
            <label className="label-caps block mb-1">Message</label>
            <textarea
              className="game-input"
              rows={6}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your message..."
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => subject.trim() && body.trim() && onSend(subject.trim(), body.trim())}
              disabled={!subject.trim() || !body.trim()}
              className={`btn flex-1 ${subject.trim() && body.trim() ? 'btn-primary' : 'btn-ghost opacity-40'}`}
            >
              <Send size={11} /> Send Message
            </button>
            <button onClick={onClose} className="btn btn-ghost px-4">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Message Detail Modal ──────────────────────

function MessageDetailModal({
  msg,
  currentPlayerId,
  canEscalate,
  onClose,
  onResolve,
  onEscalate,
}: {
  msg: ChainMessage;
  currentPlayerId: string;
  canEscalate: boolean;
  onClose: () => void;
  onResolve: (msgId: string) => void;
  onEscalate: (msgId: string) => void;
}) {
  const sender   = MOCK_PLAYERS[msg.from_player_id];
  const receiver = MOCK_PLAYERS[msg.to_player_id];
  const senderRole = MOCK_FAMILY.members.find(m => m.player_id === msg.from_player_id)?.role ?? null;

  const isReceiver = msg.to_player_id === currentPlayerId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="panel w-full max-w-lg" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <span className="panel-title truncate">{msg.subject}</span>
            <StatusBadge status={msg.status} />
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Header info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-foreground font-semibold">{sender?.alias ?? 'Unknown'}</span>
              {senderRole && <RoleBadge role={senderRole} />}
              <span>→ {receiver?.alias ?? 'Unknown'}</span>
            </div>
            <div>{timeAgo(msg.created_at)} · Last updated: {timeAgo(msg.updated_at)}</div>
            {msg.escalated_to && (
              <div className="text-yellow-400">
                Escalated to: {MOCK_PLAYERS[msg.escalated_to]?.alias ?? msg.escalated_to}
              </div>
            )}
          </div>

          {/* Message body */}
          <div className="panel p-4">
            <p className="text-xs text-muted-foreground" style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {msg.body}
            </p>
          </div>
        </div>

        {/* Actions */}
        {isReceiver && msg.status !== 'RESOLVED' && (
          <div className="border-t border-border p-4 flex gap-2 flex-wrap">
            <button
              onClick={() => onResolve(msg.id)}
              className="btn btn-success text-xs"
            >
              <CheckCircle size={11} /> Mark Resolved
            </button>
            {canEscalate && msg.status !== 'ESCALATED' && (
              <button
                onClick={() => onEscalate(msg.id)}
                className="btn btn-ghost text-xs"
              >
                <ArrowUpRight size={11} /> Escalate Up
              </button>
            )}
            <button onClick={onClose} className="btn btn-ghost text-xs ml-auto">Close</button>
          </div>
        )}
        {(!isReceiver || msg.status === 'RESOLVED') && (
          <div className="border-t border-border p-4">
            <button onClick={onClose} className="btn btn-ghost w-full">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Message row ───────────────────────────────

function MessageRow({
  msg,
  currentPlayerId,
  onClick,
}: {
  msg: ChainMessage;
  currentPlayerId: string;
  onClick: () => void;
}) {
  const isReceiver = msg.to_player_id === currentPlayerId;
  const otherParty = isReceiver
    ? MOCK_PLAYERS[msg.from_player_id]
    : MOCK_PLAYERS[msg.to_player_id];
  const otherRole = MOCK_FAMILY.members.find(m => m.player_id === (isReceiver ? msg.from_player_id : msg.to_player_id))?.role ?? null;

  return (
    <div
      className="panel p-3 mb-2 cursor-pointer hover:border-border/60 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {isReceiver
              ? <span className="text-xs text-muted-foreground">From:</span>
              : <span className="text-xs text-muted-foreground">To:</span>
            }
            <span className="text-xs font-semibold text-foreground">{otherParty?.alias ?? 'Unknown'}</span>
            {otherRole && <RoleBadge role={otherRole} />}
          </div>
          <p className="text-xs font-semibold text-foreground truncate">{msg.subject}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={msg.status} />
          <span className="text-xs text-muted-foreground">{timeAgo(msg.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────

type TabType = 'inbox' | 'sent' | 'escalated';

export default function Mailbox() {
  const { player, gameRole } = useGame();

  const superiorId = player.family_role
    ? getSuperiorPlayerId(player.family_role as FamilyRole)
    : null;

  // Leadership roles can escalate
  const canEscalate = ['BOSS', 'UNDERBOSS', 'CONSIGLIERE', 'CAPO'].includes(gameRole ?? '');

  const [tab, setTab]       = useState<TabType>('inbox');
  const [messages, setMessages] = useState<ChainMessage[]>(MOCK_CHAIN_MESSAGES);
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<ChainMessage | null>(null);
  const [sentSuccess, setSentSuccess] = useState(false);

  // Filter by tab
  const inbox     = messages.filter(m => m.to_player_id === player.id);
  const sent      = messages.filter(m => m.from_player_id === player.id);
  const escalated = messages.filter(m => m.status === 'ESCALATED');

  const tabMessages: Record<TabType, ChainMessage[]> = { inbox, sent, escalated };
  const displayed = tabMessages[tab];

  function handleSend(subject: string, body: string) {
    if (!superiorId) return;
    const newMsg: ChainMessage = {
      id: `msg-${Date.now()}`,
      family_id: 'fam-1',
      from_player_id: player.id,
      to_player_id: superiorId,
      subject,
      body,
      status: 'OPEN',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setMessages(prev => [newMsg, ...prev]);
    setShowCompose(false);
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3000);
  }

  function handleResolve(msgId: string) {
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, status: 'RESOLVED', updated_at: new Date().toISOString() } : m
    ));
    setSelectedMsg(prev => prev?.id === msgId ? { ...prev, status: 'RESOLVED' } : prev);
  }

  function handleEscalate(msgId: string) {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    // Find who to escalate to (the superior's superior)
    const receiverRole = MOCK_FAMILY.members.find(m => m.player_id === msg.to_player_id)?.role as FamilyRole | undefined;
    const escalateToRole = receiverRole ? SUPERIOR_ROLE[receiverRole] : undefined;
    const escalateTo = escalateToRole
      ? MOCK_FAMILY.members.find(m => m.role === escalateToRole)?.player_id ?? undefined
      : undefined;

    setMessages(prev => prev.map(m =>
      m.id === msgId
        ? { ...m, status: 'ESCALATED', escalated_to: escalateTo, updated_at: new Date().toISOString() }
        : m
    ));
    setSelectedMsg(prev =>
      prev?.id === msgId
        ? { ...prev, status: 'ESCALATED', escalated_to: escalateTo }
        : prev
    );
  }

  const TABS: { id: TabType; label: string; count: number }[] = [
    { id: 'inbox',     label: 'Inbox',     count: inbox.length },
    { id: 'sent',      label: 'Sent',      count: sent.length },
    { id: 'escalated', label: 'Escalated', count: escalated.length },
  ];

  return (
    <div>
      <PageHeader
        title="Chain-of-Command Mailbox"
        sub="Messages travel up the hierarchy. Contact only your direct superior."
        action={
          superiorId ? (
            <button className="btn btn-primary" onClick={() => setShowCompose(true)}>
              <Send size={11} /> Compose
            </button>
          ) : undefined
        }
      />

      {/* Hierarchy note */}
      {player.family_role && (
        <div className="panel p-3 mb-4 text-xs text-muted-foreground" style={{ background: '#0a0a0a' }}>
          <span className="label-caps mr-2">Your chain:</span>
          {player.family_role} → {SUPERIOR_ROLE[player.family_role as FamilyRole] ?? 'Top of chain'}
          {superiorId && <span className="ml-2 text-foreground">(direct: {getSuperiorAlias(superiorId)})</span>}
        </div>
      )}

      {sentSuccess && (
        <InfoAlert>Message sent successfully.</InfoAlert>
      )}

      {!player.family_id && (
        <InfoAlert variant="warn">
          You must be a family member to use the Chain-of-Command Mailbox.
        </InfoAlert>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border mb-4">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-xs font-semibold relative transition-colors flex items-center gap-1.5
              ${tab === t.id
                ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="text-xs px-1 rounded" style={{ background: '#2a2a2a', color: '#888' }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Message list */}
      {displayed.length === 0 ? (
        <EmptySlate
          msg={`No ${tab} messages.`}
          sub={tab === 'inbox' ? 'Messages from your subordinates will appear here.' : ''}
        />
      ) : (
        displayed.map(msg => (
          <MessageRow
            key={msg.id}
            msg={msg}
            currentPlayerId={player.id}
            onClick={() => setSelectedMsg(msg)}
          />
        ))
      )}

      {/* Compose modal */}
      {showCompose && (
        <ComposeModal
          superiorId={superiorId}
          onClose={() => setShowCompose(false)}
          onSend={handleSend}
        />
      )}

      {/* Detail modal */}
      {selectedMsg && (
        <MessageDetailModal
          msg={selectedMsg}
          currentPlayerId={player.id}
          canEscalate={canEscalate}
          onClose={() => setSelectedMsg(null)}
          onResolve={handleResolve}
          onEscalate={handleEscalate}
        />
      )}
    </div>
  );
}
