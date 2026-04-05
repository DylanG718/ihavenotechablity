/**
 * Onboarding — branching multi-step first-time user flow.
 *
 * Two paths after archetype selection:
 *   - Standard: join/unaffiliated → brief game intro
 *   - Founder:  create your own family → full Don onboarding
 *
 * Mobile-first. Progressive disclosure. No info walls.
 */

import { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { ARCHETYPES } from '../lib/archetypes';
import { useGame } from '../lib/gameContext';
import { Analytics } from '../lib/analyticsEngine';
import { NEW_FAMILY_CONFIG, FAMILY_RANKS } from '../../../shared/familyConfig';
import type { OnboardingStep } from '../../../shared/ops';
import {
  STANDARD_ONBOARDING_STEPS,
  FOUNDER_ONBOARDING_STEPS,
  ONBOARDING_STEP_LABELS,
} from '../../../shared/ops';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type OnboardingPath = 'standard' | 'founder';

interface OnboardingState {
  path: OnboardingPath;
  steps: OnboardingStep[];
  currentIdx: number;
  archetypeChosen: string | null;
  founderFamilyName: string;
}

// ─────────────────────────────────────────────
// Layout wrapper
// ─────────────────────────────────────────────

function OnboardingShell({
  children,
  currentStep,
  steps,
  onSkip,
  onBack,
  isFirstStep,
}: {
  children: React.ReactNode;
  currentStep: OnboardingStep;
  steps: OnboardingStep[];
  onSkip: () => void;
  onBack: () => void;
  isFirstStep: boolean;
}) {
  const currentIdx = steps.indexOf(currentStep);

  return (
    <div style={{
      minHeight: '100vh', background: '#080808',
      fontFamily: "'Helvetica Now Display', Helvetica, Arial, sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 16px 0',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: '11px', fontWeight: '900', color: '#cc3333', letterSpacing: '0.06em' }}>
          MAFIALIFE
        </div>
        {!isFirstStep && (
          <button
            onClick={onSkip}
            style={{ background: 'none', border: '1px solid #1a1a1a', color: '#444', cursor: 'pointer', fontSize: '10px', padding: '5px 10px', borderRadius: '3px' }}
          >
            Skip All
          </button>
        )}
      </div>

      {/* Progress */}
      <div style={{ padding: '14px 16px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '7px' }}>
          {steps.map((step, idx) => {
            const done   = idx < currentIdx;
            const active = idx === currentIdx;
            return (
              <div key={step} style={{
                flex: 1, height: '3px',
                background: done ? '#cc3333' : active ? '#ff4444' : '#1a1a1a',
                borderRadius: '2px', transition: 'background 0.3s',
              }} />
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#444' }}>
          <span>Step {currentIdx + 1} of {steps.length}</span>
          <span>{ONBOARDING_STEP_LABELS[currentStep]}</span>
        </div>
      </div>

      {/* Back button */}
      {!isFirstStep && (
        <div style={{ padding: '10px 16px 0', flexShrink: 0 }}>
          <button
            onClick={onBack}
            style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '10px', padding: '0', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            ← Back
          </button>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 32px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Shared: section label, heading, body
// ─────────────────────────────────────────────

function StepHeading({ tag, title, body }: { tag?: string; title: string; body?: string }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      {tag && (
        <div style={{ fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#cc3333', fontWeight: '700', marginBottom: '6px' }}>
          {tag}
        </div>
      )}
      <div style={{ fontSize: '22px', fontWeight: '900', color: '#e8e8e8', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: body ? '10px' : 0 }}>
        {title}
      </div>
      {body && (
        <div style={{ fontSize: '12px', color: '#777', lineHeight: '1.7', maxWidth: '480px' }}>
          {body}
        </div>
      )}
    </div>
  );
}

function InfoBox({ title, children, accent = '#2a2a2a' }: { title?: string; children: React.ReactNode; accent?: string }) {
  return (
    <div style={{
      background: '#0f0f0f', border: `1px solid ${accent}`,
      borderRadius: '6px', padding: '14px 16px', marginBottom: '16px',
    }}>
      {title && (
        <div style={{ fontSize: '10px', fontWeight: '700', color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
          {title}
        </div>
      )}
      <div style={{ fontSize: '12px', color: '#888', lineHeight: '1.7' }}>
        {children}
      </div>
    </div>
  );
}

function CTA({ label, onClick, secondary = false }: { label: string; onClick: () => void; secondary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={secondary ? 'btn btn-ghost' : 'btn btn-primary'}
      style={{ width: '100%', padding: '13px', fontSize: '12px', fontWeight: '700', marginBottom: secondary ? 0 : '8px' }}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────
// Step: INTRO
// ─────────────────────────────────────────────

function StepIntro({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <StepHeading
        title="Welcome to MafiaLife"
        body="A world built on loyalty, territory, and quiet violence. Families run districts, operate businesses, and wage wars through power scores — not words."
      />
      <div style={{ fontSize: '12px', color: '#777', lineHeight: '1.7', marginBottom: '24px' }}>
        You start as nobody. You can join a family and rise through the ranks, build your own, or stay independent and work contracts.
        <br /><br />
        <span style={{ color: '#cc9900', fontStyle: 'italic' }}>
          The streets do not care about your intentions. Only your results.
        </span>
      </div>
      <CTA label="Enter the World →" onClick={onNext} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Step: ARCHETYPE_CHOICE
// ─────────────────────────────────────────────

function ArchetypeDetailPanel({
  arch,
  onConfirm,
  onBack,
}: {
  arch: import('../lib/archetypes').ArchetypeDefinition;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const isHitman  = arch.solo_only;
  const isRunner  = arch.type === 'RUNNER';
  const accent    = isHitman ? '#818cf8' : isRunner ? '#4a9a4a' : '#cc3333';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 80,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)',
    }}>
      <div style={{
        width: '100%', maxWidth: '580px',
        background: '#0e0e14',
        borderTop: `2px solid ${accent}`,
        borderRadius: '12px 12px 0 0',
        maxHeight: '90vh', overflowY: 'auto',
        padding: '24px 20px 32px',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <div>
            {isHitman && (
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', color: accent, textTransform: 'uppercase', marginBottom: '6px' }}>
                Solo Path — Cannot join families
              </div>
            )}
            {isRunner && (
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', color: accent, textTransform: 'uppercase', marginBottom: '6px' }}>
                Recommended for new players
              </div>
            )}
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#e8e8e8', lineHeight: 1.1 }}>
              {arch.name}
            </div>
            <div style={{ fontSize: '12px', color: '#555', fontStyle: 'italic', marginTop: '4px' }}>{arch.role}</div>
          </div>
          <button onClick={onBack} style={{ background: 'none', border: '1px solid #222', color: '#555', cursor: 'pointer', padding: '4px 8px', fontSize: '13px', borderRadius: '4px', flexShrink: 0, marginLeft: '12px' }}>✕</button>
        </div>

        <div style={{ fontSize: '14px', fontWeight: '600', color: accent, margin: '14px 0 12px', lineHeight: 1.4 }}>
          "{arch.tagline}"
        </div>
        <div style={{ fontSize: '12px', color: '#888', lineHeight: '1.7', marginBottom: '20px' }}>
          {arch.description}
        </div>

        {/* Strengths */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.08em', color: '#4a9a4a', textTransform: 'uppercase', marginBottom: '8px' }}>Strengths</div>
          {arch.starting_bonuses.map(b => (
            <div key={b} style={{ display: 'flex', gap: '8px', marginBottom: '5px' }}>
              <span style={{ color: '#4a9a4a', flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: '12px', color: '#c0c0c0' }}>{b}</span>
            </div>
          ))}
        </div>

        {/* Tradeoffs */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.08em', color: '#cc7700', textTransform: 'uppercase', marginBottom: '8px' }}>Tradeoffs</div>
          {arch.soft_penalties.map(p => (
            <div key={p} style={{ display: 'flex', gap: '8px', marginBottom: '5px' }}>
              <span style={{ color: '#cc7700', flexShrink: 0 }}>▲</span>
              <span style={{ fontSize: '12px', color: '#888' }}>{p}</span>
            </div>
          ))}
        </div>

        {/* Best at */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.08em', color: '#5580bb', textTransform: 'uppercase', marginBottom: '8px' }}>Best suited for</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {arch.best_at.map(b => (
              <span key={b} style={{ fontSize: '11px', padding: '4px 10px', background: '#111', border: '1px solid #2a2a3a', color: '#8899cc', borderRadius: '4px' }}>{b}</span>
            ))}
          </div>
        </div>

        {/* Recommended for */}
        <div style={{ background: '#0d0d14', border: '1px solid #2a2a3a', borderRadius: '6px', padding: '10px 12px', marginBottom: '20px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: '#5580bb', marginBottom: '4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Good for</div>
          <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.6' }}>{arch.recommended_for}</div>
        </div>

        {/* Hitman warning */}
        {isHitman && (
          <div style={{ background: '#0d0d1a', border: '1px solid #2a2a5a', borderRadius: '6px', padding: '12px', marginBottom: '20px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#818cf8', marginBottom: '4px' }}>Solo Path — What this means</div>
            <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.6' }}>
              Hitmen operate outside family structures. You take contracts from the open market, build reputation through kills, and access the Hitman leaderboard. You cannot join a family, recruit, or hold turf — but you answer to no one.
            </div>
          </div>
        )}

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={onConfirm} className="btn btn-primary" style={{ width: '100%', fontSize: '13px', padding: '14px', fontWeight: '700', background: accent, borderColor: accent }}>
            Choose {arch.name}
          </button>
          <button onClick={onBack} className="btn btn-ghost" style={{ width: '100%', fontSize: '11px', padding: '11px', color: '#555' }}>
            ← See other archetypes
          </button>
        </div>
      </div>
    </div>
  );
}

function StepArchetypeChoice({ onNext }: { onNext: (archetype: string) => void }) {
  const [previewing, setPreviewing]   = useState<string | null>(null);
  const [confirmed, setConfirmed]     = useState<string | null>(null);
  const previewArch = previewing ? ARCHETYPES.find(a => a.type === previewing) ?? null : null;

  const familyArchs = ARCHETYPES.filter(a => !a.solo_only);
  const soloArchs   = ARCHETYPES.filter(a => a.solo_only);

  function handleConfirm() {
    const type = previewing!;
    setConfirmed(type);
    setPreviewing(null);
    Analytics.archetypeSelected?.('new-player', type);
    if (type === 'RUNNER') Analytics.runnerSelected?.('new-player');
  }

  const archetypeCard = (arch: typeof ARCHETYPES[0], fullWidth = false) => {
    const isConfirmed = confirmed === arch.type;
    const isRunner    = arch.type === 'RUNNER';
    const isHitman    = arch.solo_only;
    const accent      = isHitman ? '#818cf8' : isRunner ? '#4a9a4a' : '#1a1a1a';

    return (
      <div
        key={arch.type}
        onClick={() => setPreviewing(arch.type)}
        data-testid={`archetype-card-${arch.type.toLowerCase()}`}
        style={{
          gridColumn: fullWidth ? '1 / -1' : undefined,
          padding: '12px 14px',
          background: isConfirmed ? '#0a1a0a' : '#0e0e0e',
          border: `1px solid ${isConfirmed ? '#3a8a3a' : accent}`,
          borderRadius: '6px',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        {isRunner && !isConfirmed && (
          <div style={{ position: 'absolute', top: '6px', right: '8px', fontSize: '9px', background: '#1a3a1a', border: '1px solid #2a5a2a', color: '#4a9a4a', padding: '2px 6px', borderRadius: '3px', fontWeight: '700', letterSpacing: '0.06em' }}>
            RECOMMENDED
          </div>
        )}
        {isHitman && !isConfirmed && (
          <div style={{ position: 'absolute', top: '6px', right: '8px', fontSize: '9px', background: '#14143a', border: '1px solid #2a2a7a', color: '#818cf8', padding: '2px 6px', borderRadius: '3px', fontWeight: '700', letterSpacing: '0.06em' }}>
            SOLO PATH
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: '700', fontSize: '13px', color: isConfirmed ? '#5ab85a' : '#e0e0e0', marginBottom: '4px', paddingRight: fullWidth ? '80px' : 0 }}>
            {arch.name}
            {isConfirmed && <span style={{ color: '#5ab85a', fontSize: '11px', marginLeft: '8px' }}>✓</span>}
          </div>
          <div style={{ color: '#333', fontSize: '14px' }}>›</div>
        </div>
        <div style={{ fontSize: '10px', color: '#555', lineHeight: '1.5' }}>{arch.description.slice(0, 72)}…</div>
        {!fullWidth && (
          <div style={{ fontSize: '9px', color: '#444', marginTop: '6px', letterSpacing: '0.04em' }}>{arch.playstyle}</div>
        )}
      </div>
    );
  };

  return (
    <div>
      {previewArch && (
        <ArchetypeDetailPanel
          arch={previewArch}
          onConfirm={handleConfirm}
          onBack={() => setPreviewing(null)}
        />
      )}

      <StepHeading
        title="Choose Your Archetype"
        body="Your archetype is your personal playstyle — it is NOT your family rank. Any archetype can rise to Don. Tap an archetype to learn more."
      />

      {/* Confirmed selection banner */}
      {confirmed && (
        <div style={{ background: '#0a1a0a', border: '1px solid #2a5a2a', borderRadius: '5px', padding: '10px 14px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: '#5ab85a', fontWeight: '700' }}>
            ✓ Selected: {ARCHETYPES.find(a => a.type === confirmed)?.name}
          </div>
          <button onClick={() => setConfirmed(null)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '10px' }}>Change</button>
        </div>
      )}

      {/* Grid: Runner first full-width, then 2-col grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {/* Runner — full width, first */}
        {archetypeCard(familyArchs[0], true)}
        {/* Other family archetypes — 2-col grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {familyArchs.slice(1).map(a => archetypeCard(a))}
        </div>
        {/* Hitman — full width, last */}
        {soloArchs.map(a => archetypeCard(a, true))}
      </div>

      <button
        onClick={() => confirmed && onNext(confirmed)}
        disabled={!confirmed}
        className="btn btn-primary"
        data-testid="confirm-archetype-btn"
        style={{ width: '100%', padding: '13px', fontSize: '12px', fontWeight: '700', opacity: confirmed ? 1 : 0.35 }}
      >
        Confirm Archetype →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Step: FAMILY_PATH_CHOICE
// ─────────────────────────────────────────────

function StepFamilyPathChoice({ archetype, onStandard, onFounder }: {
  archetype: string | null;
  onStandard: () => void;
  onFounder: () => void;
}) {
  const isHitman = archetype === 'HITMAN';

  if (isHitman) {
    // Hitmen cannot join families — skip this choice
    return (
      <div>
        <StepHeading
          tag="Solo Path"
          title="You Work Alone"
          body="As a Hitman, you operate entirely outside family structures. No family to join, none to create. Contracts, reputation, and the leaderboard are your only concern."
        />
        <InfoBox accent="#2a2a5a">
          You take contracts from the open market, build your reputation through completed kills, and access the Hitman leaderboard. You have no crew, no turf, and no Don — but you answer to no one.
        </InfoBox>
        <CTA label="Continue →" onClick={onStandard} />
      </div>
    );
  }

  return (
    <div>
      <StepHeading
        title="What's Your Path?"
        body="You can join an existing family, stay independent for now, or found your own family."
      />

      {/* Option 1: Standard path */}
      <div
        onClick={onStandard}
        style={{ background: '#0e0e0e', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '16px', marginBottom: '10px', cursor: 'pointer' }}
      >
        <div style={{ fontWeight: '700', fontSize: '13px', color: '#e0e0e0', marginBottom: '5px' }}>
          Join a family or stay independent
        </div>
        <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.6' }}>
          Apply to an existing family, or stay unaffiliated and build your reputation first. You can found a family later once you know the game.
        </div>
        <div style={{ fontSize: '10px', color: '#4a9a4a', marginTop: '8px' }}>✓ Recommended for new players</div>
      </div>

      {/* Option 2: Founder path */}
      <div
        onClick={onFounder}
        style={{ background: '#0e0e0e', border: '1px solid #3a2a10', borderRadius: '6px', padding: '16px', cursor: 'pointer', marginBottom: '10px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontWeight: '700', fontSize: '13px', color: '#e0e0e0', marginBottom: '5px' }}>
            Create your own family
          </div>
          <div style={{ fontSize: '9px', background: '#2a1800', border: '1px solid #5a3300', color: '#cc7700', padding: '2px 7px', borderRadius: '3px', fontWeight: '700', letterSpacing: '0.06em', flexShrink: 0, marginLeft: '8px' }}>
            ADVANCED
          </div>
        </div>
        <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.6' }}>
          Found your own family and become the Don. You will be responsible for building it from nothing, protecting it, and recruiting the right people fast.
        </div>
        <div style={{ fontSize: '10px', color: '#cc7700', marginTop: '8px' }}>⚠ Not recommended for new players</div>
      </div>

      <div style={{ fontSize: '10px', color: '#444', textAlign: 'center', marginTop: '8px' }}>
        You can always found a family later from the dashboard.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Founder onboarding steps
// ─────────────────────────────────────────────

function StepFounderFamilyName({
  onNext,
  familyName,
  onNameChange,
}: { onNext: () => void; familyName: string; onNameChange: (n: string) => void }) {
  const valid = familyName.trim().length >= 3;
  return (
    <div>
      <StepHeading
        tag="Founding Your Family"
        title="Name Your Family"
        body="This is the name every other family in the city will know. Choose carefully."
      />
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontSize: '9px', color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Family Name</label>
        <input
          type="text"
          value={familyName}
          onChange={e => onNameChange(e.target.value)}
          maxLength={40}
          placeholder="The _____ Family"
          data-testid="input-family-name"
          style={{
            width: '100%', background: '#0d0d0d', border: '1px solid #2a2a2a',
            color: '#e0e0e0', padding: '12px', fontSize: '14px', fontWeight: '700',
            borderRadius: '5px', outline: 'none', boxSizing: 'border-box',
          }}
        />
        <div style={{ fontSize: '9px', color: '#333', marginTop: '4px' }}>{familyName.trim().length}/40 characters</div>
      </div>
      <InfoBox>
        Your family motto is optional and can be set from the dashboard later.
      </InfoBox>
      <button
        onClick={onNext}
        disabled={!valid}
        className="btn btn-primary"
        style={{ width: '100%', padding: '13px', fontSize: '12px', fontWeight: '700', opacity: valid ? 1 : 0.4 }}
      >
        Name the Family →
      </button>
    </div>
  );
}

function StepFounderResponsibilityWarn({ onNext }: { onNext: () => void }) {
  const [confirmed, setConfirmed] = useState(false);
  const cfg = NEW_FAMILY_CONFIG;

  return (
    <div>
      <StepHeading
        tag="This Is Real Responsibility"
        title="What You Are Taking On"
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        {[
          { icon: '⏰', title: `10-day protection window`, body: `Your family cannot be attacked by larger families for ${cfg.protection_window_days} days. After that, you are on your own.` },
          { icon: '👥', title: 'You must recruit leadership fast', body: `You need an Underboss and Consigliere within ${cfg.stabilization.evaluation_deadline_days} days or your family becomes vulnerable.` },
          { icon: '💰', title: 'You start with almost nothing', body: `Starting treasury: $${(cfg.starting_cash / 1000).toFixed(0)}K and ${cfg.starting_items.reduce((s, i) => s + i.quantity, 0)}× 9mm Pistols. You build from here.` },
          { icon: '⚔️', title: 'You are the primary target', body: 'Enemy families will come for the Don first. Your choices affect every member in your family.' },
        ].map(item => (
          <div key={item.title} style={{ display: 'flex', gap: '12px', padding: '12px', background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '5px' }}>
            <div style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#c0c0c0', marginBottom: '3px' }}>{item.title}</div>
              <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.5' }}>{item.body}</div>
            </div>
          </div>
        ))}
      </div>

      <div
        onClick={() => setConfirmed(c => !c)}
        style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px', background: '#0e0e0e', border: `1px solid ${confirmed ? '#3a8a3a' : '#2a2a2a'}`, borderRadius: '5px', cursor: 'pointer', marginBottom: '16px' }}
      >
        <div style={{ width: '16px', height: '16px', border: `2px solid ${confirmed ? '#5ab85a' : '#333'}`, borderRadius: '3px', flexShrink: 0, background: confirmed ? '#5ab85a' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px' }}>
          {confirmed && <span style={{ color: '#000', fontSize: '10px', fontWeight: '900' }}>✓</span>}
        </div>
        <div style={{ fontSize: '11px', color: '#888', lineHeight: '1.5' }}>
          I understand. I am ready to found a family and take on the responsibility.
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!confirmed}
        className="btn btn-primary"
        style={{ width: '100%', padding: '13px', fontSize: '12px', fontWeight: '700', opacity: confirmed ? 1 : 0.4 }}
      >
        I Accept This Role →
      </button>
    </div>
  );
}

function StepFounderTreasury({ onNext }: { onNext: () => void }) {
  const cfg = NEW_FAMILY_CONFIG;
  return (
    <div>
      <StepHeading
        tag="Family Operations"
        title="The Treasury"
        body="The treasury is your family's operating budget. Everything flows through it."
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        {[
          { label: 'Starting balance', value: `$${(cfg.starting_cash / 1000).toFixed(0)}K`, note: 'Seeded at founding' },
          { label: 'Tax rate', value: `${cfg.default_tax_rate_pct}%`, note: '% of member job earnings auto-deposited' },
          { label: 'Kick-up rate', value: `${cfg.default_kickup_rate_pct}%`, note: '% of crew earnings paid as tribute to leadership' },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '5px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#c0c0c0', fontWeight: '600' }}>{row.label}</div>
              <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>{row.note}</div>
            </div>
            <div style={{ fontSize: '14px', fontWeight: '900', color: '#e0e0e0' }}>{row.value}</div>
          </div>
        ))}
      </div>
      <InfoBox title="What treasury pays for">
        Item procurement, mission expenses, war reparations, turf expansion, and paying back your crew. A healthy treasury is the difference between a family that survives and one that collapses.
      </InfoBox>
      <CTA label="Understood →" onClick={onNext} />
    </div>
  );
}

function StepFounderKickupsTaxes({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <StepHeading
        tag="How Money Moves"
        title="Kick-Ups & Taxes"
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        <InfoBox title="Family Tax" accent="#2a3a2a">
          When a member completes a job, a % of the payout automatically deposits into the family treasury. You set this rate. The default is low — raise it as trust builds.
        </InfoBox>
        <InfoBox title="Kick-Up" accent="#2a2a3a">
          Kick-ups are tribute payments from crews to their Capo, and from Capos up to the Don. It reinforces hierarchy. Soldiers who earn well are expected to pay up. This is how loyalty is expressed.
        </InfoBox>
        <InfoBox title="The Don's obligation" accent="#3a2a1a">
          Members pay into the treasury. In exchange, the Don provides protection, equipment, and opportunity. Fail to protect your members and they will leave — or worse.
        </InfoBox>
      </div>
      <CTA label="Next →" onClick={onNext} />
    </div>
  );
}

function StepFounderRanksOverview({ onNext }: { onNext: () => void }) {
  const ranks = [...FAMILY_RANKS].sort((a, b) => b.order - a.order);
  return (
    <div>
      <StepHeading
        tag="Structure"
        title="Family Ranks"
        body="Each rank comes with specific responsibilities and permissions. Rank is not the same as archetype — any player can hold any rank."
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
        {ranks.map(rank => (
          <div key={rank.rank} style={{ display: 'flex', gap: '12px', padding: '10px 14px', background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '5px' }}>
            <div style={{ width: '50px', flexShrink: 0 }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: rank.rank === 'BOSS' ? '#cc3333' : '#888', letterSpacing: '0.04em' }}>
                {rank.short_name}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#c0c0c0', marginBottom: '2px' }}>{rank.display_name}</div>
              <div style={{ fontSize: '10px', color: '#555', lineHeight: '1.5' }}>{rank.description}</div>
            </div>
          </div>
        ))}
      </div>
      <CTA label="Got it →" onClick={onNext} />
    </div>
  );
}

function StepFounderProtectionIntro({ onNext }: { onNext: () => void }) {
  const cfg = NEW_FAMILY_CONFIG;
  return (
    <div>
      <StepHeading
        tag="Your Window"
        title={`${cfg.protection_window_days}-Day Protection`}
        body="New families get a protection window. Use it wisely — it will not last."
      />
      <InfoBox title="What protection covers" accent="#2a2a3a">
        Families with more than {cfg.protection_attack_threshold_members} members cannot attack you during this window. Smaller families and solo players are not blocked — they can still make your life difficult.
      </InfoBox>
      <InfoBox title="What happens after" accent="#3a1a1a">
        When the {cfg.protection_window_days} days expire, your protection is gone permanently. You must be ready. An unprotected family with no Underboss, no Consigliere, and an empty treasury is an easy target.
      </InfoBox>
      <InfoBox title="How to make the most of it">
        Recruit your Underboss and Consigliere. Build treasury. Establish turf. Run jobs constantly. The protection window is your runway — land the plane before it ends.
      </InfoBox>
      <CTA label="Understood →" onClick={onNext} />
    </div>
  );
}

function StepFounderStabilizeIntro({ onNext }: { onNext: () => void }) {
  const { stabilization: s } = NEW_FAMILY_CONFIG;
  return (
    <div>
      <StepHeading
        tag="Milestones"
        title="Stabilization"
        body={`You have ${s.evaluation_deadline_days} days to meet these milestones. Meet them and your family is considered stable. Miss them and you become vulnerable the moment your protection expires.`}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        {[
          { label: 'Recruit an Underboss', required: s.require_underboss, met: false },
          { label: 'Recruit a Consigliere', required: s.require_consigliere, met: false },
          { label: `Build treasury to $${(s.require_minimum_treasury / 1000).toFixed(0)}K`, required: s.require_minimum_treasury > 0, met: false },
        ].filter(m => m.required).map(m => (
          <div key={m.label} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px 14px', background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '5px' }}>
            <div style={{ width: '16px', height: '16px', border: '1px dashed #333', borderRadius: '3px', flexShrink: 0 }} />
            <div style={{ fontSize: '12px', color: '#c0c0c0' }}>{m.label}</div>
          </div>
        ))}
      </div>
      <InfoBox title="Why this matters" accent="#2a1a1a">
        These are not optional. They represent the minimum viable structure a family needs to function. A family without an Underboss has no one to run operations. A family without a Consigliere has no diplomatic voice.
      </InfoBox>
      <CTA label="I understand the stakes →" onClick={onNext} />
    </div>
  );
}

function StepFounderInventoryIntro({ onNext }: { onNext: () => void }) {
  const cfg = NEW_FAMILY_CONFIG;
  return (
    <div>
      <StepHeading
        tag="Starting Arsenal"
        title="Your Family Vault"
        body="Every new family starts with a small amount of equipment. The Don and Underboss control what gets issued and to whom."
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
        {cfg.starting_items.map(si => (
          <div key={si.item_definition_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#0f0f0f', border: '1px solid #2a1a1a', borderRadius: '5px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#c0c0c0' }}>
                {si.quantity}× 9mm Pistol
              </div>
              <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>WEAPON · STANDARD</div>
            </div>
            <div style={{ fontSize: '9px', color: '#555', background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '3px 7px', borderRadius: '3px' }}>IN VAULT</div>
          </div>
        ))}
      </div>
      <InfoBox title="Issuing equipment">
        You or your Underboss can issue items from the vault to members for specific jobs, hits, or missions. Items are tracked — if they are lost or not returned, the audit log records it.
      </InfoBox>
      <CTA label="Let's build this →" onClick={onNext} />
    </div>
  );
}

function StepFounderDashboard({ familyName, onFinish }: { familyName: string; onFinish: () => void }) {
  const cfg = NEW_FAMILY_CONFIG;
  const { stabilization: s } = cfg;

  return (
    <div>
      <StepHeading
        tag="Your Command Center"
        title={familyName || 'Your Family'}
      />

      {/* Protection timer */}
      <div style={{ background: '#0a0d1a', border: '1px solid #2a2a5a', borderRadius: '6px', padding: '14px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '9px', color: '#5580bb', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '2px' }}>Protection Window</div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#818cf8' }}>10 days remaining</div>
          </div>
          <div style={{ fontSize: '10px', color: '#444', textAlign: 'right', lineHeight: '1.5' }}>
            Larger families<br />cannot attack
          </div>
        </div>
      </div>

      {/* Stabilization checklist */}
      <div style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '14px', marginBottom: '10px' }}>
        <div style={{ fontSize: '9px', color: '#888', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>Stabilization Checklist</div>
        {[
          { label: 'Recruit an Underboss', done: false, urgent: true },
          { label: 'Recruit a Consigliere', done: false, urgent: true },
          { label: `Build treasury to $${(s.require_minimum_treasury / 1000).toFixed(0)}K`, done: false, current: `$${(cfg.starting_cash / 1000).toFixed(0)}K`, urgent: false },
        ].map(m => (
          <div key={m.label} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #111' }}>
            <div style={{ width: '14px', height: '14px', border: `1px dashed ${m.urgent ? '#cc7700' : '#333'}`, borderRadius: '3px', flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: '11px', color: '#c0c0c0' }}>{m.label}</div>
            {m.current && <div style={{ fontSize: '10px', color: '#555' }}>{m.current}</div>}
            {m.urgent && <div style={{ fontSize: '9px', color: '#cc7700', fontWeight: '700' }}>PRIORITY</div>}
          </div>
        ))}
      </div>

      {/* Starting inventory */}
      <div style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '14px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ fontSize: '9px', color: '#888', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Family Vault</div>
          <div style={{ fontSize: '10px', color: '#444' }}>2 items</div>
        </div>
        <div style={{ fontSize: '12px', color: '#c0c0c0' }}>2× 9mm Pistol in vault</div>
      </div>

      {/* Next actions */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '9px', color: '#888', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>Recommended Actions</div>
        {[
          'Recruit your Underboss immediately',
          'Recruit a Consigliere',
          'Run jobs to build treasury',
          'Understand tax and kick-up settings',
        ].map((action, i) => (
          <div key={action} style={{ display: 'flex', gap: '10px', padding: '7px 0', borderBottom: '1px solid #111' }}>
            <div style={{ fontSize: '10px', color: '#333', flexShrink: 0, width: '14px' }}>{i + 1}</div>
            <div style={{ fontSize: '11px', color: '#888' }}>{action}</div>
          </div>
        ))}
      </div>

      <CTA label="Enter the Dashboard →" onClick={onFinish} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Standard path steps
// ─────────────────────────────────────────────

function StepFirstJob({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <StepHeading
        tag="Make Your First Move"
        title="Your First Job"
        body="Jobs are how you make money, build heat, and prove yourself. Every job has risk and reward. Your archetype affects your odds in different job types."
      />
      <InfoBox title="How jobs work">
        Each job shows an estimated reward range, risk level, and any requirements (e.g. items, rank). Run it, wait for the outcome, and collect your payout — minus your family tax if you have one.
      </InfoBox>
      <InfoBox title="Heat">
        Completing jobs generates heat. Too much heat increases your chance of arrest, police attention, and making your movements visible. Manage it.
      </InfoBox>
      <CTA label="Go to Jobs →" onClick={onNext} />
    </div>
  );
}

function StepFamilyIntro({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <StepHeading
        tag="The Social Layer"
        title="Families"
        body="Families are the core power unit in MafiaLife. Being in one — or leading one — defines what you can do."
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        {[
          { title: 'Access to missions', body: 'High-value family missions require multiple members working together.' },
          { title: 'Territory and income', body: 'Families hold turf and operate businesses that generate passive income.' },
          { title: 'Protection', body: 'Being in a family provides safety in numbers. Going solo has more risk.' },
          { title: 'Rank and progression', body: 'Your family rank determines your permissions and responsibilities.' },
        ].map(item => (
          <div key={item.title} style={{ padding: '10px 14px', background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '5px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#c0c0c0', marginBottom: '3px' }}>{item.title}</div>
            <div style={{ fontSize: '11px', color: '#555', lineHeight: '1.5' }}>{item.body}</div>
          </div>
        ))}
      </div>
      <CTA label="Next →" onClick={onNext} />
    </div>
  );
}

function StepApplyOrInvited({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <StepHeading
        title="Join or Stay Independent"
        body="You can apply to an existing family or stay unaffiliated and build your reputation first."
      />
      <InfoBox title="Applying to a family">
        Find a family from the World → Directory. Send an application. A Capo or higher will approve or reject you. If accepted, you start as a Recruit.
      </InfoBox>
      <InfoBox title="Staying independent">
        You can run jobs, build cash, and choose a family when you are ready. Unaffiliated players miss out on family missions and turf income — but they also have no obligations.
      </InfoBox>
      <CTA label="Got it →" onClick={onNext} />
    </div>
  );
}

function StepStashIntro({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <StepHeading
        tag="Your Personal Finance"
        title="Your Stash"
        body="Your stash is your personal savings — separate from your wallet and the family treasury."
      />
      <InfoBox>
        Your wallet is visible to others through power scores. Your stash is hidden. Move money there to protect it. If you die or get arrested, your wallet is vulnerable — your stash may be safer.
      </InfoBox>
      <CTA label="Next →" onClick={onNext} />
    </div>
  );
}

function StepDashboardTour({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <StepHeading
        tag="Your Home Base"
        title="The Dashboard"
        body="Your dashboard is your command center. Everything you need is here or one tap away."
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
        {[
          { icon: '🏠', label: 'Home', desc: 'Your dashboard — stats, income, active events' },
          { icon: '💼', label: 'Jobs', desc: 'Browse and run available jobs' },
          { icon: '👥', label: 'Family', desc: 'Your family overview, roster, and activity' },
          { icon: '🌍', label: 'World', desc: 'Districts, turf, and influence map' },
          { icon: '🏢', label: 'Assets', desc: 'Businesses, fronts, and territory' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '9px 14px', background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '5px' }}>
            <div style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#c0c0c0' }}>{item.label}</div>
              <div style={{ fontSize: '10px', color: '#555' }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <CTA label="Enter the Game →" onClick={onNext} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Onboarding component
// ─────────────────────────────────────────────

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { player }   = useGame();

  const [state, setState] = useState<OnboardingState>({
    path:              'standard',
    steps:             STANDARD_ONBOARDING_STEPS,
    currentIdx:        0,
    archetypeChosen:   null,
    founderFamilyName: '',
  });

  const currentStep = state.steps[state.currentIdx];
  const isFirstStep = state.currentIdx === 0;

  const goNext = useCallback((nextSteps?: OnboardingStep[]) => {
    setState(prev => {
      const steps = nextSteps ?? prev.steps;
      const nextIdx = prev.currentIdx + 1;
      if (nextIdx >= steps.length) return prev; // terminal, handled by individual step
      return { ...prev, steps, currentIdx: nextIdx };
    });
  }, []);

  const goBack = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentIdx: Math.max(0, prev.currentIdx - 1),
    }));
  }, []);

  const finish = useCallback((path: OnboardingPath) => {
    Analytics.onboardingCompleted?.(player.id, path);
    if (path === 'founder') {
      Analytics.founderOnboardingCompleted?.(player.id);
      navigate('/');  // → founder dashboard
    } else {
      navigate('/');
    }
  }, [navigate, player.id]);

  const skip = useCallback(() => {
    Analytics.onboardingAbandoned?.(player.id, currentStep);
    navigate('/');
  }, [navigate, player.id, currentStep]);

  function switchToFounderPath() {
    Analytics.familyCreationPathChosen?.(player.id);
    Analytics.familyCreationStarted?.(player.id);
    setState(prev => ({
      ...prev,
      path: 'founder',
      steps: FOUNDER_ONBOARDING_STEPS,
      currentIdx: FOUNDER_ONBOARDING_STEPS.indexOf('FOUNDER_FAMILY_NAME'),
    }));
  }

  function switchToStandardPath() {
    Analytics.familyPathSelected?.(player.id, 'standard');
    goNext();
  }

  // Render step
  function renderStep() {
    switch (currentStep) {
      case 'INTRO':
        return <StepIntro onNext={() => goNext()} />;

      case 'ARCHETYPE_CHOICE':
        return (
          <StepArchetypeChoice
            onNext={archetype => {
              setState(prev => ({ ...prev, archetypeChosen: archetype }));
              goNext();
            }}
          />
        );

      case 'FAMILY_PATH_CHOICE':
        return (
          <StepFamilyPathChoice
            archetype={state.archetypeChosen}
            onStandard={switchToStandardPath}
            onFounder={switchToFounderPath}
          />
        );

      // Standard path
      case 'FIRST_JOB':        return <StepFirstJob        onNext={() => goNext()} />;
      case 'FAMILY_INTRO':     return <StepFamilyIntro     onNext={() => goNext()} />;
      case 'APPLY_OR_INVITED': return <StepApplyOrInvited  onNext={() => goNext()} />;
      case 'STASH_INTRO':      return <StepStashIntro      onNext={() => goNext()} />;
      case 'DASHBOARD_TOUR':   return <StepDashboardTour   onNext={() => finish('standard')} />;

      // Founder path
      case 'FOUNDER_FAMILY_NAME':
        return (
          <StepFounderFamilyName
            familyName={state.founderFamilyName}
            onNameChange={n => setState(prev => ({ ...prev, founderFamilyName: n }))}
            onNext={() => goNext()}
          />
        );
      case 'FOUNDER_RESPONSIBILITY_WARN':
        return <StepFounderResponsibilityWarn onNext={() => goNext()} />;
      case 'FOUNDER_TREASURY_INTRO':
        return <StepFounderTreasury onNext={() => goNext()} />;
      case 'FOUNDER_KICKUPS_TAXES':
        return <StepFounderKickupsTaxes onNext={() => goNext()} />;
      case 'FOUNDER_RANKS_OVERVIEW':
        return <StepFounderRanksOverview onNext={() => goNext()} />;
      case 'FOUNDER_PROTECTION_INTRO':
        return <StepFounderProtectionIntro onNext={() => goNext()} />;
      case 'FOUNDER_STABILIZE_INTRO':
        return <StepFounderStabilizeIntro onNext={() => goNext()} />;
      case 'FOUNDER_INVENTORY_INTRO':
        return <StepFounderInventoryIntro onNext={() => goNext()} />;
      case 'FOUNDER_DASHBOARD':
        return (
          <StepFounderDashboard
            familyName={state.founderFamilyName}
            onFinish={() => finish('founder')}
          />
        );

      default:
        return <div style={{ color: '#555', fontSize: '12px' }}>Unknown step: {currentStep}</div>;
    }
  }

  return (
    <OnboardingShell
      currentStep={currentStep}
      steps={state.steps}
      onSkip={skip}
      onBack={goBack}
      isFirstStep={isFirstStep}
    >
      {renderStep()}
    </OnboardingShell>
  );
}
