import { MOCK_FAMILY, MOCK_RIVAL_FAMILY, fmt } from '../lib/mockData';
import { PageHeader, SectionPanel } from '../components/layout/AppShell';

const FAMILY_RANKINGS = [
  { rank: 1, name: 'The Corrado Family', power: 8420, members: 6, treasury: 1240000, wins: 12, territory: 3 },
  { rank: 2, name: 'The Ferrante Crew',  power: 7100, members: 5, treasury: 980000,  wins: 9,  territory: 2 },
  { rank: 3, name: 'West Side Outfit',   power: 4200, members: 3, treasury: 420000,  wins: 5,  territory: 1 },
  { rank: 4, name: 'The Neri Faction',   power: 3100, members: 4, treasury: 310000,  wins: 3,  territory: 1 },
];

const TOP_PLAYERS = [
  { rank: 1, alias: 'Don Corrado',    archetype: 'RUNNER', cash: 480000, respect: 940 },
  { rank: 2, alias: 'Sal the Fist',   archetype: 'MUSCLE',    cash: 210000, respect: 780 },
  { rank: 3, alias: 'The Cardinal',   archetype: 'HITMAN',    cash: 510000, respect: 980 },
  { rank: 4, alias: 'Tommy Two-Times',archetype: 'RACKETEER', cash: 95000,  respect: 620 },
  { rank: 5, alias: 'The Iceman',     archetype: 'HITMAN',    cash: 320000, respect: 870 },
];

export default function RoundStats() {
  return (
    <div>
      <PageHeader title="Round Stats" sub="Current standings. Round ends in 4d 13h 22m." />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { l: 'Active Families', v: 4 },
          { l: 'Total Players',   v: '1,247' },
          { l: 'Contracts Posted',v: 38 },
          { l: 'Total Cash in Play', v: fmt(12400000) },
        ].map(({ l, v }) => (
          <div key={l} className="panel p-4">
            <span className="label-caps block mb-1">{l}</span>
            <span className="stat-val">{v}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionPanel title="Family Rankings">
          <table className="data-table">
            <thead><tr><th>#</th><th>Family</th><th>Power</th><th>Members</th><th>Treasury</th><th>Territory</th></tr></thead>
            <tbody>
              {FAMILY_RANKINGS.map(f => (
                <tr key={f.rank}>
                  <td className={f.rank === 1 ? 'text-cash font-black' : f.rank <= 3 ? 'font-bold' : 'text-muted-foreground'}>{f.rank}</td>
                  <td className="font-semibold text-foreground">{f.name}</td>
                  <td className="text-foreground">{f.power.toLocaleString()}</td>
                  <td>{f.members}</td>
                  <td className="text-cash">{fmt(f.treasury)}</td>
                  <td>{f.territory}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionPanel>

        <SectionPanel title="Top Players">
          <table className="data-table">
            <thead><tr><th>#</th><th>Alias</th><th>Archetype</th><th>Cash</th><th>Respect</th></tr></thead>
            <tbody>
              {TOP_PLAYERS.map(p => (
                <tr key={p.rank}>
                  <td className={p.rank === 1 ? 'text-cash font-black' : 'text-muted-foreground'}>{p.rank}</td>
                  <td className="font-semibold text-foreground">{p.alias}</td>
                  <td className="text-muted-foreground">{p.archetype}</td>
                  <td className="text-cash">{fmt(p.cash)}</td>
                  <td>{p.respect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionPanel>
      </div>

      <div className="mt-4">
        <SectionPanel title="Recent Events">
          <div className="divide-y divide-border/50">
            {[
              { time: '2h ago',  event: 'The Cardinal completes contract #42 — streak reaches ×15', type: 'hitman' },
              { time: '3h ago',  event: 'Corrado Family seizes South Port from West Side Outfit', type: 'territory' },
              { time: '5h ago',  event: 'Ferrante Crew declares war on West Side Outfit', type: 'war' },
              { time: '8h ago',  event: 'Pale Ghost sent to Blacksite after traced failure on contract #4', type: 'prison' },
              { time: '12h ago', event: 'The Armored Car Hit resolved — $1.4M payout for Corrado Family', type: 'mission' },
              { time: '1d ago',  event: 'Tommy Two-Times promoted to Capo by Sal the Fist', type: 'promo' },
            ].map((e, i) => (
              <div key={i} className="flex items-baseline gap-3 px-4 py-2.5 text-xs">
                <span className="text-muted-foreground/60 shrink-0 tabular-nums w-14">{e.time}</span>
                <span className="text-muted-foreground">{e.event}</span>
              </div>
            ))}
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}
