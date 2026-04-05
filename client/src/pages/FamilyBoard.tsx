/**
 * FamilyBoard.tsx — Family Board
 * Pinned announcements + post feed with inline replies.
 * Boss/Underboss: pin/unpin. All family members: post and reply.
 */

import { useState } from 'react';
import { useGame } from '../lib/gameContext';
import { MOCK_PLAYERS, fmt } from '../lib/mockData';
import { MOCK_FAMILY } from '../lib/mockData';
import { PageHeader, SectionPanel, InfoAlert, EmptySlate } from '../components/layout/AppShell';
import { MOCK_BOARD_POSTS } from '../lib/worldData';
import { RoleBadge } from '../components/ui/Badges';
import type { FamilyBoardPost, BoardReply } from '../../../shared/schema';
import { Pin, MessageSquare, ChevronDown, ChevronUp, Plus, Send } from 'lucide-react';

// ── Helpers ───────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (days > 0)  return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0)  return `${mins}m ago`;
  return 'just now';
}

function getMemberRole(playerId: string) {
  return MOCK_FAMILY.members.find(m => m.player_id === playerId)?.role ?? null;
}

// ── New Post Modal ────────────────────────────

function NewPostModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (content: string) => void }) {
  const [content, setContent] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="panel w-full max-w-md">
        <div className="panel-header">
          <span className="panel-title">New Board Post</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="label-caps block mb-1.5">Message</label>
            <textarea
              className="game-input"
              rows={6}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Say something to the family..."
              style={{ resize: 'vertical' }}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => content.trim() && onSubmit(content.trim())}
              disabled={!content.trim()}
              className={`btn flex-1 ${content.trim() ? 'btn-primary' : 'btn-ghost opacity-40'}`}
            >
              <Send size={11} /> Post to Board
            </button>
            <button onClick={onClose} className="btn btn-ghost px-4">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Reply row ─────────────────────────────────

function ReplyRow({ reply }: { reply: BoardReply }) {
  const author = MOCK_PLAYERS[reply.author_id];
  const role = getMemberRole(reply.author_id);

  return (
    <div className="flex gap-3 py-2 border-t border-border/40 first:border-0">
      <div className="w-5 h-5 rounded-sm shrink-0 flex items-center justify-center text-xs font-bold"
        style={{ background: '#1a1a1a', border: '1px solid #333', color: '#888' }}>
        {(author?.alias ?? '?').charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-semibold text-foreground">{author?.alias ?? 'Unknown'}</span>
          {role && <RoleBadge role={role} />}
          <span className="text-xs text-muted-foreground">{timeAgo(reply.created_at)}</span>
        </div>
        <p className="text-xs text-muted-foreground" style={{ lineHeight: 1.5 }}>{reply.content}</p>
      </div>
    </div>
  );
}

// ── Post Card ─────────────────────────────────

function PostCard({
  post,
  canPin,
  onPin,
  onReply,
}: {
  post: FamilyBoardPost;
  canPin: boolean;
  onPin: (id: string) => void;
  onReply: (postId: string, content: string) => void;
}) {
  const author = MOCK_PLAYERS[post.author_id];
  const role   = getMemberRole(post.author_id);
  const [showReplies, setShowReplies] = useState(post.pinned);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');

  const borderStyle = post.pinned
    ? { borderColor: 'rgba(255,204,51,0.4)', background: 'hsl(45 60% 5%)' }
    : {};

  return (
    <div className="panel mb-3 overflow-hidden" style={borderStyle}>
      {/* Post header */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-6 h-6 rounded-sm flex items-center justify-center text-xs font-bold"
              style={{ background: '#1a1a1a', border: '1px solid #333', color: post.pinned ? '#ffcc33' : '#888' }}>
              {(author?.alias ?? '?').charAt(0)}
            </div>
            <span className="text-xs font-semibold text-foreground">{author?.alias ?? 'Unknown'}</span>
            {role && <RoleBadge role={role} />}
            <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
            {post.pinned && (
              <span className="flex items-center gap-1 text-xs" style={{ color: '#ffcc33' }}>
                <Pin size={9} /> Pinned
              </span>
            )}
          </div>
          {canPin && (
            <button
              onClick={() => onPin(post.id)}
              className="btn btn-ghost text-xs shrink-0"
              title={post.pinned ? 'Unpin post' : 'Pin post'}
            >
              <Pin size={10} /> {post.pinned ? 'Unpin' : 'Pin'}
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground" style={{ lineHeight: 1.6 }}>{post.content}</p>
      </div>

      {/* Reply toggle */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border/40" style={{ background: '#0a0a0a' }}>
        <button
          onClick={() => setShowReplies(v => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageSquare size={10} />
          {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}
          {showReplies ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
        <button
          onClick={() => setReplyOpen(v => !v)}
          className="btn btn-ghost text-xs"
        >
          Reply
        </button>
      </div>

      {/* Replies */}
      {showReplies && post.replies.length > 0 && (
        <div className="px-4 py-2 border-t border-border/40" style={{ background: '#090909' }}>
          {post.replies.map(r => <ReplyRow key={r.id} reply={r} />)}
        </div>
      )}

      {/* Reply compose */}
      {replyOpen && (
        <div className="px-4 py-3 border-t border-border/40 flex gap-2" style={{ background: '#0a0a0a' }}>
          <input
            className="game-input flex-1 text-xs"
            placeholder="Write a reply..."
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && replyText.trim()) {
                onReply(post.id, replyText.trim());
                setReplyText('');
                setReplyOpen(false);
                setShowReplies(true);
              }
            }}
          />
          <button
            onClick={() => {
              if (replyText.trim()) {
                onReply(post.id, replyText.trim());
                setReplyText('');
                setReplyOpen(false);
                setShowReplies(true);
              }
            }}
            disabled={!replyText.trim()}
            className={`btn text-xs ${replyText.trim() ? 'btn-primary' : 'btn-ghost opacity-40'}`}
          >
            <Send size={10} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────

export default function FamilyBoard() {
  const { gameRole, player } = useGame();

  const canPin = gameRole === 'BOSS' || gameRole === 'UNDERBOSS';
  const canPost = !!player.family_id;

  const [posts, setPosts] = useState<FamilyBoardPost[]>(MOCK_BOARD_POSTS);
  const [showNewPost, setShowNewPost] = useState(false);

  const pinnedPosts = posts.filter(p => p.pinned);
  const regularPosts = posts.filter(p => !p.pinned).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  function handlePin(postId: string) {
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, pinned: !p.pinned, pinned_by: player.id } : p
    ));
  }

  function handleNewPost(content: string) {
    const newPost: FamilyBoardPost = {
      id: `bp-${Date.now()}`,
      family_id: 'fam-1',
      author_id: player.id,
      content,
      pinned: false,
      created_at: new Date().toISOString(),
      replies: [],
    };
    setPosts(prev => [newPost, ...prev]);
    setShowNewPost(false);
  }

  function handleReply(postId: string, content: string) {
    const newReply: BoardReply = {
      id: `br-${Date.now()}`,
      author_id: player.id,
      content,
      created_at: new Date().toISOString(),
    };
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, replies: [...p.replies, newReply] } : p
    ));
  }

  return (
    <div>
      <PageHeader
        title={`Family Board`}
        sub={`${MOCK_FAMILY.name} · ${posts.length} posts · ${pinnedPosts.length} pinned`}
        action={
          canPost ? (
            <button className="btn btn-primary" onClick={() => setShowNewPost(true)}>
              <Plus size={11} /> New Post
            </button>
          ) : undefined
        }
      />

      {!canPost && (
        <InfoAlert variant="warn">
          You must be a family member to post on the board.
        </InfoAlert>
      )}

      {/* Pinned announcements */}
      {pinnedPosts.length > 0 && (
        <div className="mb-5">
          <div className="label-caps mb-3 flex items-center gap-2">
            <Pin size={10} style={{ color: '#ffcc33' }} />
            <span>Pinned Announcements ({pinnedPosts.length})</span>
          </div>
          {pinnedPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              canPin={canPin}
              onPin={handlePin}
              onReply={handleReply}
            />
          ))}
        </div>
      )}

      {/* Regular feed */}
      <div>
        <div className="label-caps mb-3">Recent Posts</div>
        {regularPosts.length === 0 ? (
          <EmptySlate msg="No posts yet." sub="Be the first to post on the family board." />
        ) : (
          regularPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              canPin={canPin}
              onPin={handlePin}
              onReply={handleReply}
            />
          ))
        )}
      </div>

      {showNewPost && (
        <NewPostModal onClose={() => setShowNewPost(false)} onSubmit={handleNewPost} />
      )}
    </div>
  );
}
