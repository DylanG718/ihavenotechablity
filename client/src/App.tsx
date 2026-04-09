/**
 * App — Root component
 *
 * Production routing:
 *   Unauthenticated         → /login
 *   Auth, new player        → /onboarding (first-time flow)
 *   Auth, onboarding done   → / (dashboard, based on account state)
 *
 * Dev/admin tools are gated behind ENABLE_DEV_TOOLS / ENABLE_ADMIN_TOOLS flags.
 * These flags default OFF in production (Vercel) and ON in local dev.
 * Set VITE_ENABLE_DEV_TOOLS=true or VITE_ENABLE_ADMIN_TOOLS=true in Vercel
 * to expose them on staging/preview.
 */

import { Switch, Route, Router, Redirect } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { GameProvider } from './lib/gameContext';
import { EconomyProvider } from './lib/economyContext';
import { AuthProvider, useAuth } from './lib/authContext';
import { PlayerBootstrapProvider, usePlayerBootstrap } from './lib/playerBootstrap';
import { AppShell } from './components/layout/AppShell';
import { ENABLE_DEV_TOOLS, ENABLE_ADMIN_TOOLS } from './lib/env';

// ─────────────────────────────────────────────
// Page imports — production routes
// ─────────────────────────────────────────────

import LoginPage         from './pages/Login';
import SignupPage        from './pages/Signup';
import OnboardingPage    from './pages/Onboarding';
import Dashboard         from './pages/Dashboard';
import Family            from './pages/Family';
import MissionBoard      from './pages/Missions';
import ContractBoard     from './pages/Contracts';
import Hitmen            from './pages/Hitmen';
import HitmanLeaderboard from './pages/Leaderboard';
import HitmanPrison      from './pages/Prison';
import DowntimeActions   from './pages/Downtime';
import Profile           from './pages/Profile';
import RoundStats        from './pages/RoundStats';
import InventoryScreen   from './pages/Inventory';
import BankScreen        from './pages/Bank';
import BlackMarketScreen from './pages/BlackMarket';
import TreasuryScreen    from './pages/Treasury';
import DirectoryScreen   from './pages/Directory';
import DiplomacyPage     from './pages/Diplomacy';
import SitdownPage       from './pages/Sitdown';
import JailPage          from './pages/Jail';
import ArmoryPage        from './pages/Armory';
import DefensesPage      from './pages/Defenses';
import AttackPage        from './pages/Attack';
import JobsPage          from './pages/Jobs';
import FamilyBoard       from './pages/FamilyBoard';
import TurfPage          from './pages/Turf';
import MailboxPage       from './pages/Mailbox';
import ProtectionPage    from './pages/Protection';
import ObituariesPage    from './pages/Obituaries';
import FamilyLeaderboard from './pages/FamilyLeaderboard';
import DistrictMap       from './pages/DistrictMap';
import Crews             from './pages/Crews';
import SeasonStandings   from './pages/SeasonStandings';
import FrontDetail       from './pages/FrontDetail';
import FamilyInventory   from './pages/FamilyInventory';
import FamilyTreasury    from './pages/FamilyTreasury';
import FounderDashboard  from './pages/FounderDashboard';
import NotificationsPage from './pages/Notifications';
import FamilyFeedPage    from './pages/FamilyFeed';
import WorldFeedPage     from './pages/WorldFeed';
import ProgressionPanel  from './pages/ProgressionPanel';

// Dev/admin tools — only imported when flags are on
// (Tree-shaken in production builds where the flag = false)
import AdminPanel   from './pages/AdminPanel';
import JobsAdmin    from './pages/JobsAdmin';
import WorldAdmin   from './pages/WorldAdmin';

// ─────────────────────────────────────────────
// Loading screen
// ─────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '16px',
      fontFamily: "'Helvetica Now Display', Helvetica, Arial, sans-serif",
    }}>
      <div style={{ fontSize: '24px', fontWeight: '900', color: '#cc3333', letterSpacing: '-0.02em' }}>
        THE LAST FIRM
      </div>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: '5px', height: '5px', borderRadius: '50%', background: '#333',
            animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { background: #222; transform: scale(0.8); }
          50% { background: #cc3333; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// Not found
// ─────────────────────────────────────────────

function NotFound() {
  return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#666', fontSize: '12px' }}>
      Page not found.
    </div>
  );
}

// ─────────────────────────────────────────────
// Internal tools guard
// Returns a 404 if the required flag is off.
// This is routing-level enforcement, not just UI hiding.
// ─────────────────────────────────────────────

function DevOnly({ component: Component }: { component: React.ComponentType }) {
  if (!ENABLE_DEV_TOOLS) return <NotFound />;
  return <Component />;
}

function AdminOnly({ component: Component }: { component: React.ComponentType }) {
  if (!ENABLE_ADMIN_TOOLS) return <NotFound />;
  return <Component />;
}

// ─────────────────────────────────────────────
// All authenticated in-app routes
// ─────────────────────────────────────────────

function AppShellRoutes() {
  return (
    <AppShell>
      <Switch>
        {/* ── Core dashboard ─────────────────────────── */}
        <Route path="/"               component={Dashboard} />
        <Route path="/profile"        component={Profile} />
        <Route path="/notifications"  component={NotificationsPage} />
        <Route path="/stats"          component={RoundStats} />

        {/* ── Family ─────────────────────────────────── */}
        <Route path="/family"             component={Family} />
        <Route path="/family/recruit"     component={Family} />
        <Route path="/family/board"       component={FamilyBoard} />
        <Route path="/family/turf"        component={TurfPage} />
        <Route path="/family/inventory"   component={FamilyInventory} />
        <Route path="/family/treasury"    component={FamilyTreasury} />
        <Route path="/family/feed"        component={FamilyFeedPage} />
        <Route path="/missions"           component={MissionBoard} />
        <Route path="/mailbox"            component={MailboxPage} />
        <Route path="/crews"              component={Crews} />
        <Route path="/founder"            component={FounderDashboard} />

        {/* ── Jobs & Economy ─────────────────────────── */}
        <Route path="/jobs"       component={JobsPage} />
        <Route path="/inventory"  component={InventoryScreen} />
        <Route path="/bank"       component={BankScreen} />
        <Route path="/market"     component={BlackMarketScreen} />
        <Route path="/treasury"   component={TreasuryScreen} />
        <Route path="/directory"  component={DirectoryScreen} />

        {/* ── World ──────────────────────────────────── */}
        <Route path="/districts"           component={DistrictMap} />
        <Route path="/world/feed"          component={WorldFeedPage} />
        <Route path="/family-leaderboard"  component={FamilyLeaderboard} />
        <Route path="/season"              component={SeasonStandings} />
        <Route path="/obituaries"          component={ObituariesPage} />
        <Route path="/protection"          component={ProtectionPage} />
        <Route path="/front/:frontId"      component={FrontDetail} />

        {/* ── Diplomacy ──────────────────────────────── */}
        <Route path="/diplomacy"  component={DiplomacyPage} />
        <Route path="/sitdown"    component={SitdownPage} />

        {/* ── Underworld ─────────────────────────────── */}
        <Route path="/contracts"   component={ContractBoard} />
        <Route path="/hitmen"      component={Hitmen} />
        <Route path="/leaderboard" component={HitmanLeaderboard} />

        {/* ── Hitman ─────────────────────────────────── */}
        <Route path="/downtime"  component={DowntimeActions} />
        <Route path="/prison"    component={HitmanPrison} />

        {/* ── Account ────────────────────────────────── */}
        <Route path="/jail"    component={JailPage} />

        {/* ── Combat ─────────────────────────────────── */}
        <Route path="/armory"    component={ArmoryPage} />
        <Route path="/defenses"  component={DefensesPage} />
        <Route path="/attack"    component={AttackPage} />

        {/* ── Admin (gated) ──────────────────────────── */}
        <Route path="/admin">
          <AdminOnly component={AdminPanel} />
        </Route>
        <Route path="/progression">
          <AdminOnly component={ProgressionPanel} />
        </Route>

        {/* ── Dev tools (gated) ──────────────────────── */}
        <Route path="/jobs-admin">
          <DevOnly component={JobsAdmin} />
        </Route>
        <Route path="/world-admin">
          <DevOnly component={WorldAdmin} />
        </Route>

        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

// ─────────────────────────────────────────────
// Production routing logic
// This is the core first-load decision tree.
// ─────────────────────────────────────────────

function AuthRouter() {
  const { session, loading: authLoading } = useAuth();
  const { onboardingComplete, ready: bootstrapReady } = usePlayerBootstrap();

  // Wait for both auth and bootstrap to resolve
  if (authLoading || !bootstrapReady) {
    return <LoadingScreen />;
  }

  return (
    <Switch>
      {/* ── Public routes ─────────────────────────── */}
      <Route path="/login"   component={LoginPage} />
      <Route path="/signup"  component={SignupPage} />

      {/* ── Onboarding (standalone, requires auth) ── */}
      <Route path="/onboarding">
        {session ? <OnboardingPage /> : <Redirect to="/login" />}
      </Route>

      {/* ── All authenticated routes ─────────────── */}
      <Route>
        {!session ? (
          // Not logged in → go to login
          <Redirect to="/login" />
        ) : !onboardingComplete ? (
          // Logged in but never completed onboarding → force onboarding
          // Exception: if already on /onboarding, let it render
          <Redirect to="/onboarding" />
        ) : (
          // Logged in + onboarded → full app
          <AppShellRoutes />
        )}
      </Route>
    </Switch>
  );
}

// ─────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GameProvider>
          <EconomyProvider>
            <Router hook={useHashLocation}>
              <PlayerBootstrapProvider>
                <AuthRouter />
              </PlayerBootstrapProvider>
            </Router>
            <Toaster />
          </EconomyProvider>
        </GameProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
