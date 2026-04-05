/**
 * App — Root component
 *
 * Auth flow:
 *   - Not authenticated → /login or /signup
 *   - Authenticated, no onboarding → /onboarding
 *   - Authenticated + onboarded → main app
 *
 * Routes:
 *   /login         — Email/password sign in
 *   /signup        — New account creation
 *   /archetype     — ArchetypeSelection (standalone, no AppShell)
 *   /onboarding    — First-time onboarding flow (standalone, no AppShell)
 *   /              — Dashboard
 *   /family        — Family overview
 *   /jobs          — Job board
 *   /districts     — World / district map
 *   /family/turf   — Turf & businesses
 *   ... (all other game routes)
 *
 * In MOCK MODE (no Supabase configured), auth is bypassed —
 * the game loads directly with mock data for prototyping.
 */

import { Switch, Route, Router, Redirect } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { GameProvider } from './lib/gameContext';
import { EconomyProvider } from './lib/economyContext';
import { AuthProvider, useAuth } from './lib/authContext';
import { AppShell } from './components/layout/AppShell';

import LoginPage        from './pages/Login';
import SignupPage       from './pages/Signup';
import ArchetypeSelect  from './pages/ArchetypeSelect';
import Dashboard        from './pages/Dashboard';
import Family           from './pages/Family';
import MissionBoard     from './pages/Missions';
import ContractBoard    from './pages/Contracts';
import Hitmen           from './pages/Hitmen';
import HitmanLeaderboard from './pages/Leaderboard';
import HitmanPrison     from './pages/Prison';
import DowntimeActions  from './pages/Downtime';
import Profile          from './pages/Profile';
import RoundStats       from './pages/RoundStats';
import InventoryScreen  from './pages/Inventory';
import BankScreen       from './pages/Bank';
import BlackMarketScreen from './pages/BlackMarket';
import TreasuryScreen   from './pages/Treasury';
import DirectoryScreen  from './pages/Directory';
import DiplomacyPage    from './pages/Diplomacy';
import SitdownPage      from './pages/Sitdown';
import JailPage         from './pages/Jail';
import ArmoryPage       from './pages/Armory';
import DefensesPage     from './pages/Defenses';
import AttackPage       from './pages/Attack';
import JobsPage         from './pages/Jobs';
import JobsAdmin        from './pages/JobsAdmin';
import WorldAdmin       from './pages/WorldAdmin';
import FamilyBoard      from './pages/FamilyBoard';
import TurfPage         from './pages/Turf';
import MailboxPage      from './pages/Mailbox';
import ProtectionPage   from './pages/Protection';
import ObituariesPage   from './pages/Obituaries';
import FamilyLeaderboard from './pages/FamilyLeaderboard';
import DistrictMap from './pages/DistrictMap';
import Crews from './pages/Crews';
import SeasonStandings from './pages/SeasonStandings';
import FrontDetail from './pages/FrontDetail';
import OnboardingPage    from './pages/Onboarding';
import FamilyInventory  from './pages/FamilyInventory';
import FamilyTreasury   from './pages/FamilyTreasury';
import FounderDashboard from './pages/FounderDashboard';
import NotificationsPage from './pages/Notifications';
import FamilyFeedPage from './pages/FamilyFeed';
import WorldFeedPage from './pages/WorldFeed';
import AdminPanel from './pages/AdminPanel';
import ProgressionPanel from './pages/ProgressionPanel';

// ─────────────────────────────────────────────
// Loading screen (auth state resolving)
// ─────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px',
      fontFamily: "'Helvetica Now Display', Helvetica, Arial, sans-serif",
    }}>
      <div style={{
        fontSize: '24px', fontWeight: '900', color: '#cc3333',
        letterSpacing: '-0.02em',
      }}>
        MAFIALIFE
      </div>
      <div style={{
        display: 'flex', gap: '6px', alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: '5px', height: '5px', borderRadius: '50%',
              background: '#333',
              animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
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
// All in-app routes (require auth)
// ─────────────────────────────────────────────

function AppShellRoutes() {
  return (
    <AppShell>
      <Switch>
        <Route path="/"               component={Dashboard} />
        <Route path="/family"         component={Family} />
        <Route path="/family/recruit" component={Family} />
        <Route path="/missions"       component={MissionBoard} />
        <Route path="/contracts"      component={ContractBoard} />
        <Route path="/hitmen"         component={Hitmen} />
        <Route path="/leaderboard"    component={HitmanLeaderboard} />
        <Route path="/prison"         component={HitmanPrison} />
        <Route path="/downtime"       component={DowntimeActions} />
        <Route path="/profile"        component={Profile} />
        <Route path="/stats"          component={RoundStats} />
        <Route path="/inventory"      component={InventoryScreen} />
        <Route path="/bank"           component={BankScreen} />
        <Route path="/market"         component={BlackMarketScreen} />
        <Route path="/treasury"       component={TreasuryScreen} />
        <Route path="/directory"      component={DirectoryScreen} />
        <Route path="/diplomacy"      component={DiplomacyPage} />
        <Route path="/sitdown"        component={SitdownPage} />
        <Route path="/jail"           component={JailPage} />
        <Route path="/armory"         component={ArmoryPage} />
        <Route path="/defenses"       component={DefensesPage} />
        <Route path="/attack"         component={AttackPage} />
        <Route path="/jobs"            component={JobsPage} />
        <Route path="/jobs-admin"      component={JobsAdmin} />
        <Route path="/world-admin"     component={WorldAdmin} />
        <Route path="/family/board"    component={FamilyBoard} />
        <Route path="/family/turf"     component={TurfPage} />
        <Route path="/mailbox"         component={MailboxPage} />
        <Route path="/protection"      component={ProtectionPage} />
        <Route path="/obituaries"      component={ObituariesPage} />
        <Route path="/family-leaderboard" component={FamilyLeaderboard} />
        <Route path="/districts"      component={DistrictMap} />
        <Route path="/crews"           component={Crews} />
        <Route path="/season"          component={SeasonStandings} />
        <Route path="/front/:frontId"  component={FrontDetail} />
        <Route path="/notifications"   component={NotificationsPage} />
        <Route path="/family/inventory"  component={FamilyInventory} />
        <Route path="/family/treasury"   component={FamilyTreasury} />
        <Route path="/founder"           component={FounderDashboard} />
        <Route path="/family/feed"     component={FamilyFeedPage} />
        <Route path="/world/feed"      component={WorldFeedPage} />
        <Route path="/admin"           component={AdminPanel} />
        <Route path="/progression"     component={ProgressionPanel} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

// ─────────────────────────────────────────────
// Auth-aware router
// Handles: loading → login → onboarding → app
// ─────────────────────────────────────────────

function AuthRouter() {
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Switch>
      {/* Public routes — accessible without auth */}
      <Route path="/login"   component={LoginPage} />
      <Route path="/signup"  component={SignupPage} />

      {/* Standalone game flows (require auth) */}
      <Route path="/archetype">
        {session ? <ArchetypeSelect /> : <Redirect to="/login" />}
      </Route>
      <Route path="/onboarding">
        {session ? <OnboardingPage /> : <Redirect to="/login" />}
      </Route>

      {/* Unauthenticated root → redirect to login, then onboarding */}
      <Route path="/">
        {session ? <AppShellRoutes /> : <Redirect to="/login" />}
      </Route>

      {/* All other routes — auth gate */}
      <Route>
        {session ? <AppShellRoutes /> : <Redirect to="/login" />}
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
              <AuthRouter />
            </Router>
            <Toaster />
          </EconomyProvider>
        </GameProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
