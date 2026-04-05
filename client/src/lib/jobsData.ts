// ═══════════════════════════════════════════════════════════════════
// MAFIALIFE — Jobs Seed Data
// Source: MafiaLife Complete Jobs & Missions Design Bible v2
//         + Universal Jobs (Any Rank) spec
//
// HOW TO ADD A JOB:
//   1. Add a new entry to RANKED_JOBS or UNIVERSAL_JOBS arrays below.
//   2. Assign a unique id (e.g. 'j-rank-XX' or 'j-univ-XX').
//   3. Set min_rank, tier, category, cooldown_seconds, reward bands.
//   4. universal: false for ranked jobs, true for universal jobs.
//   5. hitman_eligible: only true for explicit high-stakes ranked jobs.
//   6. effect_scope: 'SELF' for solo income jobs, 'FAMILY_ABSTRACT' for
//      jobs that affect family influence/war score.
//   7. Rebuild and re-deploy.
//
// REWARD SCALING (universal jobs only):
//   base reward × RANK_REWARD_MULTIPLIER[playerRank]
//   Associate: 1.0x | Soldier: 1.35x | Capo: 1.85x
//   Consigliere/Underboss: 2.35–2.5x | Boss: 2.9x
//
// JAIL CHANCE SCALING:
//   base jail_chance_base applies to all ranks. In a real backend
//   implementation multiply by (1 + heat/100) for live risk.
// ═══════════════════════════════════════════════════════════════════

import type { JobDefinition } from '../../../shared/jobs';

// ─────────────────────────────────────────────
// TIER 1 — ASSOCIATE / RECRUIT JOBS
// ─────────────────────────────────────────────

const TIER1_JOBS: JobDefinition[] = [
  {
    id: 'j-rank-01',
    name: 'Run a Corner Numbers Spot',
    lore_tagline: 'Pennies and policy slips — where every street earner starts.',
    description: 'Take over a corner numbers operation for the afternoon. Collect bets, pay out the winners, skim your cut. Low risk, low reward — but it proves you\'re reliable and earns the family a few dollars.',
    tier: 1, category: 'GAMBLING', min_rank: 'ASSOCIATE', universal: false,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 3600,
    reward_band_min: 800, reward_band_max: 2500, reward_types: ['CASH', 'XP'],
    jail_chance_base: 0.03, hitman_eligible: false, war_context_only: false,
    effect_scope: 'SELF',
  },
  {
    id: 'j-rank-02',
    name: 'Collect a Street Debt',
    lore_tagline: 'Some guys forget they owe. You\'re the reminder.',
    description: 'A local borrower is two weeks past due on a $400 loan. The Capo wants his money — and the message delivered. Show up, stay calm, get paid. No bloodshed unless they make it necessary.',
    tier: 1, category: 'EXTORTION', min_rank: 'ASSOCIATE', universal: false,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 7200,
    reward_band_min: 400, reward_band_max: 1800, reward_types: ['CASH', 'XP', 'RESPECT'],
    jail_chance_base: 0.05, hitman_eligible: false, war_context_only: false,
    effect_scope: 'SELF',
  },
  {
    id: 'j-rank-03',
    name: 'Move Hot Electronics',
    lore_tagline: 'Box trucks, loading docks, and questions nobody asks.',
    description: 'A shipment of stolen laptops needs a new home before the serial numbers get flagged. Find a buyer, move the merchandise, deliver the proceeds minus your cut. Keep your mouth shut.',
    tier: 1, category: 'FENCING', min_rank: 'ASSOCIATE', universal: false,
    mode: 'SOLO_OR_CREW', min_crew_size: 0, cooldown_seconds: 14400,
    reward_band_min: 1200, reward_band_max: 4000, reward_types: ['CASH', 'XP'],
    jail_chance_base: 0.06, hitman_eligible: false, war_context_only: false,
    effect_scope: 'SELF',
  },
  {
    id: 'j-rank-04',
    name: 'Run an Errand for the Crew',
    lore_tagline: 'Loyalty starts small.',
    description: 'Pick up a package from a contact downtown, deliver it to a restaurant on Fifth, wait for a call-back confirmation, then report back. Don\'t open the package. Don\'t be late.',
    tier: 1, category: 'LOGISTICS', min_rank: 'ASSOCIATE', universal: false,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 3600,
    reward_band_min: 300, reward_band_max: 900, reward_types: ['CASH', 'XP', 'RESPECT'],
    jail_chance_base: 0.01, hitman_eligible: false, war_context_only: false,
    effect_scope: 'FAMILY_ABSTRACT',
  },
  {
    id: 'j-rank-05',
    name: 'Boost a Car',
    lore_tagline: 'The chop shop needs inventory. You\'re the procurement department.',
    description: 'Steal a specific make and model from the parking garage off Harbor Blvd. The chop shop is waiting. Get in, get out, don\'t get made by any cameras. Payment on delivery.',
    tier: 1, category: 'HUSTLE', min_rank: 'ASSOCIATE', universal: false,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 10800,
    reward_band_min: 600, reward_band_max: 2200, reward_types: ['CASH', 'XP'],
    jail_chance_base: 0.08, hitman_eligible: false, war_context_only: false,
    effect_scope: 'SELF',
  },
];

// ─────────────────────────────────────────────
// TIER 2 — SOLDIER JOBS
// ─────────────────────────────────────────────

const TIER2_JOBS: JobDefinition[] = [
  {
    id: 'j-rank-10',
    name: 'Extort a Local Business',
    lore_tagline: 'Insurance they can\'t refuse.',
    description: 'The dry cleaner on Maple has been operating for three years without contributing a dime to the neighborhood\'s "security fund." Pay a visit. Explain the arrangement. Return with the first installment and a signed understanding.',
    tier: 2, category: 'EXTORTION', min_rank: 'SOLDIER', universal: false,
    mode: 'SOLO_OR_CREW', min_crew_size: 0, cooldown_seconds: 14400,
    reward_band_min: 3000, reward_band_max: 9000, reward_types: ['CASH', 'XP', 'INFLUENCE'],
    jail_chance_base: 0.08, hitman_eligible: false, war_context_only: false,
    effect_scope: 'FAMILY_ABSTRACT',
  },
  {
    id: 'j-rank-11',
    name: 'Run a Card Game',
    lore_tagline: 'The house always wins. Tonight, you are the house.',
    description: 'Set up a private poker game above Sal\'s restaurant. Handle security, manage the float, and make sure the house takes its 10% off every pot. Keep the players happy, keep the cops greased, and close the night clean.',
    tier: 2, category: 'GAMBLING', min_rank: 'SOLDIER', universal: false,
    mode: 'SOLO_OR_CREW', min_crew_size: 0, cooldown_seconds: 28800,
    reward_band_min: 4000, reward_band_max: 12000, reward_types: ['CASH', 'XP'],
    jail_chance_base: 0.06, hitman_eligible: false, war_context_only: false,
    effect_scope: 'SELF',
  },
  {
    id: 'j-rank-12',
    name: 'Fence Stolen Goods (Mid-Tier)',
    lore_tagline: 'Art, jewelry, and things better left uncatalogued.',
    description: 'A jewel heist brought in three pieces the crew can\'t move locally. Your contact in the diamond district will buy them quiet — but he needs an introduction, a clean bill of provenance, and plausible deniability. Arrange the meeting. Take 15%.',
    tier: 2, category: 'FENCING', min_rank: 'SOLDIER', universal: false,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 21600,
    reward_band_min: 5000, reward_band_max: 18000, reward_types: ['CASH', 'XP'],
    jail_chance_base: 0.09, hitman_eligible: false, war_context_only: false,
    effect_scope: 'SELF',
  },
  {
    id: 'j-rank-13',
    name: 'Intimidate a Witness',
    lore_tagline: 'What they didn\'t see is none of their business.',
    description: 'A neighborhood auto body worker saw too much during the Moretti incident last month. He\'s been cooperative with police. Find him, make clear that his memory works better when it\'s quiet, and ensure he recants. No physical harm — just presence and implication.',
    tier: 2, category: 'ENFORCEMENT', min_rank: 'SOLDIER', universal: false,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 21600,
    reward_band_min: 4000, reward_band_max: 10000, reward_types: ['CASH', 'INFLUENCE', 'XP'],
    jail_chance_base: 0.12, hitman_eligible: false, war_context_only: false,
    effect_scope: 'FAMILY_ABSTRACT',
  },
  {
    id: 'j-rank-14',
    name: 'Manage a Loan Book',
    lore_tagline: 'Interest never takes a day off.',
    description: 'Assume responsibility for a 12-account loan book. Collect weekly payments, note delinquencies, issue extensions when warranted, escalate problem accounts to the Capo. Straight numbers work — plus a 5% management fee on everything collected.',
    tier: 2, category: 'ECONOMY', min_rank: 'SOLDIER', universal: false,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 18000,
    reward_band_min: 6000, reward_band_max: 16000, reward_types: ['CASH', 'XP', 'INFLUENCE'],
    jail_chance_base: 0.05, hitman_eligible: false, war_context_only: false,
    effect_scope: 'SELF',
  },
  {
    id: 'j-rank-15',
    name: 'Oversee a Contraband Shipment',
    lore_tagline: 'Cigarettes don\'t pay tariffs. Neither do you.',
    description: 'A truck loaded with untaxed liquor and cigarettes is arriving at the port at 2 AM. Coordinate the offload crew, handle the inspectors, and ensure the product reaches the warehouse intact. Your cut is on the back end.',
    tier: 2, category: 'CONTRABAND', min_rank: 'SOLDIER', universal: false,
    mode: 'CREW', min_crew_size: 2, cooldown_seconds: 28800,
    reward_band_min: 8000, reward_band_max: 22000, reward_types: ['CASH', 'XP'],
    jail_chance_base: 0.13, hitman_eligible: false, war_context_only: false,
    effect_scope: 'FAMILY_ABSTRACT',
  },
];

// ─────────────────────────────────────────────
// TIER 3 — CAPO JOBS
// ─────────────────────────────────────────────

const TIER3_JOBS: JobDefinition[] = [
  {
    id: 'j-rank-20',
    name: 'Run a Territory Racket',
    lore_tagline: 'Three blocks, six businesses, one monthly envelope.',
    description: 'Organize and systematize collections from an assigned six-block territory. Recruit muscle, set rates, handle disputes, and deliver the monthly envelope to the Underboss. The territory is yours to develop — provided it earns.',
    tier: 3, category: 'EXTORTION', min_rank: 'CAPO', universal: false,
    mode: 'CREW', min_crew_size: 2, cooldown_seconds: 43200,
    reward_band_min: 20000, reward_band_max: 60000, reward_types: ['CASH', 'INFLUENCE', 'XP'],
    jail_chance_base: 0.08, hitman_eligible: false, war_context_only: false,
    effect_scope: 'FAMILY_ABSTRACT',
  },
  {
    id: 'j-rank-21',
    name: 'Corrupt a City Official',
    lore_tagline: 'Everyone has a price. Find it.',
    description: 'A contracts official in the permits department holds the zoning approval for the family\'s new restaurant front. He\'s resistant. Research his vices, build leverage, and convert him into a reliable asset. Subtlety is paramount — he must never feel coerced.',
    tier: 3, category: 'CORRUPTION', min_rank: 'CAPO', universal: false,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 86400,
    reward_band_min: 25000, reward_band_max: 80000, reward_types: ['CASH', 'INFLUENCE', 'INTEL', 'XP'],
    jail_chance_base: 0.1, hitman_eligible: false, war_context_only: false,
    effect_scope: 'FAMILY_ABSTRACT',
  },
  {
    id: 'j-rank-22',
    name: 'Orchestrate a Mid-Level Heist',
    lore_tagline: 'Plan the job, crew the job, run the job.',
    description: 'A commercial property management company moves payroll cash every Thursday at 4 PM. Plan the intercept: scout the route, build a four-man crew, handle the take, and clean the trail. Execution is your responsibility.',
    tier: 3, category: 'HUSTLE', min_rank: 'CAPO', universal: false,
    mode: 'CREW', min_crew_size: 3, cooldown_seconds: 72000,
    reward_band_min: 40000, reward_band_max: 120000, reward_types: ['CASH', 'XP', 'RESPECT'],
    jail_chance_base: 0.18, hitman_eligible: true, war_context_only: false,
    effect_scope: 'SELF',
  },
  {
    id: 'j-rank-23',
    name: 'Set Up a Money Laundering Front',
    lore_tagline: 'Clean money is the only money that counts.',
    description: 'Acquire a struggling restaurant or car wash, install the family\'s bookkeeper, and route a portion of monthly earnings through it. The legitimate business gives the crew a veneer of legitimacy and a channel for converting dirty cash.',
    tier: 3, category: 'ECONOMY', min_rank: 'CAPO', universal: false,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 86400,
    reward_band_min: 30000, reward_band_max: 90000, reward_types: ['CASH', 'INFLUENCE', 'XP'],
    jail_chance_base: 0.07, hitman_eligible: false, war_context_only: false,
    effect_scope: 'FAMILY_ABSTRACT',
  },
  {
    id: 'j-rank-24',
    name: 'Broker a Labor Union Deal',
    lore_tagline: 'Who controls the docks controls the city.',
    description: 'A rival union president is blocking the family\'s access to longshore labor contracts worth millions annually. Negotiate, pressure, or compensate your way into a working arrangement. The Underboss wants the contract — what you do to get it is your business.',
    tier: 3, category: 'INFLUENCE', min_rank: 'CAPO', universal: false,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 86400,
    reward_band_min: 35000, reward_band_max: 100000, reward_types: ['CASH', 'INFLUENCE', 'XP'],
    jail_chance_base: 0.09, hitman_eligible: false, war_context_only: false,
    effect_scope: 'FAMILY_ABSTRACT',
  },
];

// ─────────────────────────────────────────────
// TIER 3.5 — CONSIGLIERE JOBS
// ─────────────────────────────────────────────

const TIER35_JOBS: JobDefinition[] = [
  {
    id: 'j-rank-30',
    name: 'Broker a Peace Between Families',
    lore_tagline: 'The right word in the right ear prevents a war.',
    description: 'Two crews have been escalating over a shared block. Left unchecked this becomes a war that benefits no one. Arrange a quiet meeting, identify the grievances, propose an equitable carve-up, and secure both bosses\' verbal agreement. Document nothing.',
    tier: 3.5, category: 'INFLUENCE', min_rank: 'CONSIGLIERE', universal: false,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 86400,
    reward_band_min: 30000, reward_band_max: 100000, reward_types: ['INFLUENCE', 'XP', 'CASH'],
    jail_chance_base: 0.04, hitman_eligible: false, war_context_only: false,
    effect_scope: 'FAMILY_ABSTRACT',
  },
  {
    id: 'j-rank-31',
    name: 'Compile Intel on a Rival Family',
    lore_tagline: 'Information is the only weapon that never runs out.',
    description: 'Develop a comprehensive intelligence profile on a rival family: their hierarchy, earning operations, police contacts, and internal conflicts. Use informants, surveillance, and records review. Deliver a written assessment to the Boss.',
    tier: 3.5, category: 'INTEL', min_rank: 'CONSIGLIERE', universal: false,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 43200,
    reward_band_min: 20000, reward_band_max: 65000, reward_types: ['INTEL', 'INFLUENCE', 'XP'],
    jail_chance_base: 0.05, hitman_eligible: false, war_context_only: false,
    effect_scope: 'FAMILY_ABSTRACT',
  },
  {
    id: 'j-rank-32',
    name: 'Advise on a High-Stakes Contract',
    lore_tagline: 'Bad decisions cost lives. Good advice costs money.',
    description: 'The Boss is considering a major contract with an outside party. Review the terms, research the counterpart\'s reputation, identify hidden risks, and provide a written recommendation. Your analysis could shape a deal worth seven figures.',
    tier: 3.5, category: 'SPECIAL', min_rank: 'CONSIGLIERE', universal: false,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 28800,
    reward_band_min: 25000, reward_band_max: 70000, reward_types: ['CASH', 'INFLUENCE', 'XP'],
    jail_chance_base: 0.02, hitman_eligible: false, war_context_only: false,
    effect_scope: 'FAMILY_ABSTRACT',
  },
  {
    id: 'j-rank-33',
    name: 'Turn a Police Commander',
    lore_tagline: 'The badge is just another kind of uniform.',
    description: 'A precinct commander has been aggressively targeting family operations. Identify his leverage points — debt, affair, ambition — and convert him into a protected asset. He will provide advance warning of raids and bury select investigations.',
    tier: 3.5, category: 'CORRUPTION', min_rank: 'CONSIGLIERE', universal: false,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 86400,
    reward_band_min: 40000, reward_band_max: 120000, reward_types: ['INFLUENCE', 'CASH', 'INTEL', 'XP'],
    jail_chance_base: 0.1, hitman_eligible: false, war_context_only: false,
    effect_scope: 'FAMILY_ABSTRACT',
  },
];

// ─────────────────────────────────────────────
// TIER 4 — UNDERBOSS JOBS
// ─────────────────────────────────────────────

const TIER4_JOBS: JobDefinition[] = [
  {
    id: 'j-rank-40',
    name: 'Orchestrate a Multi-Crew Operation',
    lore_tagline: 'Three crews. One night. Your plan.',
    description: 'Coordinate a simultaneous three-crew strike: one crew handles the distraction at the Ferrante warehouse, one intercepts the cash truck, and yours secures the exit route. Timing is everything. One mistake collapses the whole operation.',
    tier: 4, category: 'HUSTLE', min_rank: 'UNDERBOSS', universal: false,
    mode: 'CREW', min_crew_size: 3, cooldown_seconds: 86400,
    reward_band_min: 100000, reward_band_max: 320000, reward_types: ['CASH', 'INFLUENCE', 'XP'],
    jail_chance_base: 0.18, hitman_eligible: true, war_context_only: false,
    effect_scope: 'FAMILY_ABSTRACT',
  },
  {
    id: 'j-rank-41',
    name: 'Consolidate Family Rackets',
    lore_tagline: 'Inefficiency is a tax. Fix it.',
    description: 'Three of the family\'s six street-level rackets are underperforming. Audit the crew leaders, identify the dead weight, restructure the collection routes, and install more reliable earners. The Boss expects a 20% improvement in the next monthly envelope.',
    tier: 4, category: 'ECONOMY', min_rank: 'UNDERBOSS', universal: false,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 86400,
    reward_band_min: 80000, reward_band_max: 250000, reward_types: ['CASH', 'INFLUENCE', 'XP'],
    jail_chance_base: 0.06, hitman_eligible: false, war_context_only: false,
    effect_scope: 'FAMILY_ABSTRACT',
  },
  {
    id: 'j-rank-42',
    name: 'Negotiate a War Ceasefire',
    lore_tagline: 'Peace by persuasion. Or persuasion by other means.',
    description: 'The family\'s war score against the Moretti crew is draining resources. A ceasefire would allow both sides to stabilize. Navigate back-channel negotiations: find the mutual concessions, broker the agreement, and ensure both bosses save face. The deal must hold for at least 30 days.',
    tier: 4, category: 'INFLUENCE', min_rank: 'UNDERBOSS', universal: false,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 86400,
    reward_band_min: 60000, reward_band_max: 200000, reward_types: ['INFLUENCE', 'CASH', 'XP'],
    jail_chance_base: 0.04, hitman_eligible: false, war_context_only: true,
    effect_scope: 'FAMILY_ABSTRACT',
  },
  {
    id: 'j-rank-43',
    name: 'Flip a Rival Crew Lieutenant',
    lore_tagline: 'The best intelligence walks in through the front door.',
    description: 'A disgruntled Capo in the Ferrante organization is unhappy with his cut. Make contact, offer a better arrangement, and turn him into an ongoing source of internal intelligence. Handle it personally — this asset is too valuable to trust to a middleman.',
    tier: 4, category: 'INTEL', min_rank: 'UNDERBOSS', universal: false,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 72000,
    reward_band_min: 50000, reward_band_max: 160000, reward_types: ['INTEL', 'INFLUENCE', 'CASH', 'XP'],
    jail_chance_base: 0.12, hitman_eligible: false, war_context_only: false,
    effect_scope: 'FAMILY_ABSTRACT',
  },
  {
    id: 'j-rank-44',
    name: 'Run a Major Gambling Operation',
    lore_tagline: 'When the stakes get big, only the Underboss runs the table.',
    description: 'Establish a high-stakes private casino night for the city\'s wealthiest clientele. Secure the venue, install protection, manage the house float, and ensure the event closes without incident. Net take is split 70/30 between family treasury and your personal cut.',
    tier: 4, category: 'GAMBLING', min_rank: 'UNDERBOSS', universal: false,
    mode: 'CREW', min_crew_size: 2, cooldown_seconds: 86400,
    reward_band_min: 120000, reward_band_max: 380000, reward_types: ['CASH', 'INFLUENCE', 'XP'],
    jail_chance_base: 0.09, hitman_eligible: false, war_context_only: false,
    effect_scope: 'FAMILY_ABSTRACT',
  },
];

// ─────────────────────────────────────────────
// TIER 5 — BOSS (DON) JOBS
// Note: All Don-level "hit" jobs are NARRATIVE STRUCTURAL MOVES —
//       they affect war scores, political maps, and season flags,
//       NOT direct player character deletion.
// ─────────────────────────────────────────────

const TIER5_JOBS: JobDefinition[] = [
  {
    id: 'j-rank-50',
    name: 'Seize a Rival Territory (War Op)',
    lore_tagline: 'The map changes tonight.',
    description: 'Declare and execute a coordinated territorial seizure against a rival family\'s primary earning block. Deploy multiple crews, overwhelm their street-level defenses, and establish your flag before sunrise. This operation escalates war score and shifts the political map for the season.',
    tier: 5, category: 'SPECIAL', min_rank: 'BOSS', universal: false,
    mode: 'CREW', min_crew_size: 4, cooldown_seconds: 172800,
    reward_band_min: 200000, reward_band_max: 600000, reward_types: ['CASH', 'INFLUENCE', 'RESPECT', 'XP'],
    jail_chance_base: 0.2, hitman_eligible: true, war_context_only: true,
    effect_scope: 'FAMILY_ABSTRACT',
  },
  {
    id: 'j-rank-51',
    name: 'Order a Strategic Hit (War Score Op)',
    lore_tagline: 'A war isn\'t won in a day, but this moves the needle.',
    description: 'Commission a targeted enforcement action against a rival family\'s key operational asset — their primary earner, main fixer, or logistics captain. The action degrades their war score and disrupts their organization. This is a structural political move, not a personal execution order.',
    tier: 5, category: 'SPECIAL', min_rank: 'BOSS', universal: false,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 86400,
    reward_band_min: 100000, reward_band_max: 400000, reward_types: ['INFLUENCE', 'CASH', 'RESPECT', 'XP'],
    jail_chance_base: 0.15, hitman_eligible: true, war_context_only: false,
    effect_scope: 'FAMILY_ABSTRACT',
  },
  {
    id: 'j-rank-52',
    name: 'Call a Commission Meeting',
    lore_tagline: 'All the bosses. One table. You called it.',
    description: 'Organize and chair an emergency Commission session. Present the city\'s current power balance, broker inter-family agreements, collect tribute, and assert your family\'s position at the top of the hierarchy. The outcome shapes political relations for the next two weeks.',
    tier: 5, category: 'INFLUENCE', min_rank: 'BOSS', universal: false,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 172800,
    reward_band_min: 150000, reward_band_max: 500000, reward_types: ['INFLUENCE', 'CASH', 'RESPECT', 'XP'],
    jail_chance_base: 0.05, hitman_eligible: false, war_context_only: false,
    effect_scope: 'FAMILY_ABSTRACT',
  },
  {
    id: 'j-rank-53',
    name: 'Secure a Federal Contact',
    lore_tagline: 'The best protection money can buy wears a suit and a badge.',
    description: 'A senior federal prosecutor has debts that have come due in a very inconvenient way. Use that leverage — carefully, indirectly, through multiple layers of cutouts — to ensure the family\'s current federal case takes a favorable turn. This asset must never be traceable.',
    tier: 5, category: 'CORRUPTION', min_rank: 'BOSS', universal: false,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 86400,
    reward_band_min: 200000, reward_band_max: 700000, reward_types: ['INFLUENCE', 'CASH', 'INTEL', 'XP'],
    jail_chance_base: 0.12, hitman_eligible: false, war_context_only: false,
    effect_scope: 'FAMILY_ABSTRACT',
  },
  {
    id: 'j-rank-54',
    name: 'Establish a New Racket Empire',
    lore_tagline: 'Build something that lasts.',
    description: 'Identify a new untapped market — port smuggling, digital fraud networks, pharmaceutical diversion — and build a complete operation from scratch. Hire the specialists, establish the infrastructure, and bring the first month\'s earnings to the table.',
    tier: 5, category: 'ECONOMY', min_rank: 'BOSS', universal: false,
    mode: 'CREW', min_crew_size: 3, cooldown_seconds: 172800,
    reward_band_min: 300000, reward_band_max: 900000, reward_types: ['CASH', 'INFLUENCE', 'XP', 'RESPECT'],
    jail_chance_base: 0.1, hitman_eligible: false, war_context_only: false,
    effect_scope: 'FAMILY_ABSTRACT',
  },
];

// ─────────────────────────────────────────────
// ALL RANKED JOBS (combined)
// ─────────────────────────────────────────────

export const RANKED_JOBS: JobDefinition[] = [
  ...TIER1_JOBS,
  ...TIER2_JOBS,
  ...TIER3_JOBS,
  ...TIER35_JOBS,
  ...TIER4_JOBS,
  ...TIER5_JOBS,
];

// ─────────────────────────────────────────────
// UNIVERSAL JOBS — any rank, scaled by multiplier
// hitman_eligible: always false
// min_rank: ASSOCIATE (all can see and start)
// ─────────────────────────────────────────────

export const UNIVERSAL_JOBS: JobDefinition[] = [
  // ── GAMBLING ─────────────────────────────
  {
    id: 'j-univ-01',
    name: 'Run a Sports Book',
    lore_tagline: 'The spread is set. You just collect the action.',
    description: 'Take bets on tonight\'s game from your regular list of players. Set the line, manage exposure, and settle up after the final whistle. Reliable weekly income — the kind of steady work every earner depends on.',
    tier: 1, category: 'GAMBLING', min_rank: 'ASSOCIATE', universal: true,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 21600,
    reward_band_min: 1500, reward_band_max: 5000, reward_types: ['CASH', 'XP'],
    jail_chance_base: 0.04, hitman_eligible: false, war_context_only: false,
    effect_scope: 'SELF',
  },
  {
    id: 'j-univ-02',
    name: 'Run a Numbers Spot',
    lore_tagline: 'Three numbers. One pick. Policy for the people.',
    description: 'Operate a daily numbers spot for the neighborhood. Collect the slips, track the action, and pay out the winners. Low heat, reliable income — a backbone racket that keeps money flowing even when bigger jobs dry up.',
    tier: 1, category: 'GAMBLING', min_rank: 'ASSOCIATE', universal: true,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 14400,
    reward_band_min: 800, reward_band_max: 3000, reward_types: ['CASH', 'XP'],
    jail_chance_base: 0.03, hitman_eligible: false, war_context_only: false,
    effect_scope: 'SELF',
  },
  {
    id: 'j-univ-03',
    name: 'Poker Night (Back Room)',
    lore_tagline: 'Five cards, six players, and you take a seat with the house.',
    description: 'Host a back-room poker game for a curated list of players. Handle the float, manage the rake, and keep the evening quiet. The stakes are just high enough to make it worthwhile, just low enough to keep the heat off.',
    tier: 1, category: 'GAMBLING', min_rank: 'ASSOCIATE', universal: true,
    mode: 'SOLO_OR_CREW', min_crew_size: 0, cooldown_seconds: 28800,
    reward_band_min: 1200, reward_band_max: 4500, reward_types: ['CASH', 'XP'],
    jail_chance_base: 0.05, hitman_eligible: false, war_context_only: false,
    effect_scope: 'SELF',
  },
  {
    id: 'j-univ-04',
    name: 'Horse Race Fix Information',
    lore_tagline: 'The horse already knows who wins. Now you do too.',
    description: 'A jockey owes you a favor. Get the inside line on which horse is running clean and which is being held back at the third race. Sell that information to three or four serious bettors at a premium. The truth is worth more than the race.',
    tier: 1, category: 'GAMBLING', min_rank: 'ASSOCIATE', universal: true,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 43200,
    reward_band_min: 2000, reward_band_max: 6000, reward_types: ['CASH', 'INTEL', 'XP'],
    jail_chance_base: 0.06, hitman_eligible: false, war_context_only: false,
    effect_scope: 'SELF',
  },
  // ── EXTORTION ────────────────────────────
  {
    id: 'j-univ-05',
    name: 'Protection Rounds',
    lore_tagline: 'You make the rounds. They make their payments.',
    description: 'Walk your protection route: the deli, the hardware store, the cleaners. Collect the weekly envelope from each. Most pay without a word. Occasionally someone needs reminding. The work is boring until it isn\'t.',
    tier: 1, category: 'EXTORTION', min_rank: 'ASSOCIATE', universal: true,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 14400,
    reward_band_min: 1000, reward_band_max: 4000, reward_types: ['CASH', 'XP', 'RESPECT'],
    jail_chance_base: 0.04, hitman_eligible: false, war_context_only: false,
    effect_scope: 'SELF',
  },
  {
    id: 'j-univ-06',
    name: 'Extort a Restaurant',
    lore_tagline: 'Nice place. Shame if something happened to it.',
    description: 'Visit a restaurant that has been operating in your territory without contributing. Explain the arrangement — politely, professionally. The first meeting is always cordial. Return with the envelope.',
    tier: 1, category: 'EXTORTION', min_rank: 'ASSOCIATE', universal: true,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 21600,
    reward_band_min: 1500, reward_band_max: 5500, reward_types: ['CASH', 'XP'],
    jail_chance_base: 0.07, hitman_eligible: false, war_context_only: false,
    effect_scope: 'SELF',
  },
  {
    id: 'j-univ-07',
    name: 'Demand Tribute from a Street Crew',
    lore_tagline: 'Independent operators need permission to breathe your air.',
    description: 'A small independent crew has been running a dice game in your territory without authorization. Confront the leader — one-on-one — and establish the tribute arrangement. 20% of their weekly take, payable every Friday. Non-negotiable.',
    tier: 1, category: 'EXTORTION', min_rank: 'ASSOCIATE', universal: true,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 28800,
    reward_band_min: 2000, reward_band_max: 7000, reward_types: ['CASH', 'RESPECT', 'XP'],
    jail_chance_base: 0.08, hitman_eligible: false, war_context_only: false,
    effect_scope: 'SELF',
  },
  {
    id: 'j-univ-08',
    name: 'Collect Insurance Fraud Cut',
    lore_tagline: 'The adjuster never asks too many questions. Arrangements were made.',
    description: 'A network of auto body shops has been filing inflated insurance claims for years. You facilitated the arrangement between the shops and their friendly adjuster. Monthly, you collect your facilitation fee. Clean, invisible, reliable.',
    tier: 1, category: 'EXTORTION', min_rank: 'ASSOCIATE', universal: true,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 21600,
    reward_band_min: 1800, reward_band_max: 5500, reward_types: ['CASH', 'XP'],
    jail_chance_base: 0.05, hitman_eligible: false, war_context_only: false,
    effect_scope: 'SELF',
  },
  // ── FENCING ──────────────────────────────
  {
    id: 'j-univ-09',
    name: 'Move Stolen Electronics',
    lore_tagline: 'No serial numbers, no questions, no problem.',
    description: 'A pallet of laptops, phones, and tablets came off a truck at the warehouse last night. Find buyers — pawn shop owners, gray market online sellers, or a corporate fencer — and move the product before the heat hits.',
    tier: 1, category: 'FENCING', min_rank: 'ASSOCIATE', universal: true,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 18000,
    reward_band_min: 1200, reward_band_max: 4000, reward_types: ['CASH', 'XP'],
    jail_chance_base: 0.06, hitman_eligible: false, war_context_only: false,
    effect_scope: 'SELF',
  },
  {
    id: 'j-univ-10',
    name: 'Fence Stolen Jewelry',
    lore_tagline: 'Sparkle doesn\'t mean provenance.',
    description: 'Three pieces came out of an uptown apartment job: a diamond bracelet, a pearl necklace, and a watch worth more than your car. Your contact at the diamond exchange takes pieces like these — no questions, 60 cents on the dollar.',
    tier: 1, category: 'FENCING', min_rank: 'ASSOCIATE', universal: true,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 21600,
    reward_band_min: 2500, reward_band_max: 9000, reward_types: ['CASH', 'XP'],
    jail_chance_base: 0.08, hitman_eligible: false, war_context_only: false,
    effect_scope: 'SELF',
  },
  {
    id: 'j-univ-11',
    name: 'Move Counterfeit Goods',
    lore_tagline: 'Designer bags, designer prices, zero designer involvement.',
    description: 'A container of counterfeit luxury goods arrived from overseas: handbags, watches, and sunglasses that pass casual inspection. Move them through the flea market circuit and gray market retailers. Volume counts more than price per unit.',
    tier: 1, category: 'FENCING', min_rank: 'ASSOCIATE', universal: true,
    mode: 'SOLO_OR_CREW', min_crew_size: 0, cooldown_seconds: 21600,
    reward_band_min: 1500, reward_band_max: 5000, reward_types: ['CASH', 'XP'],
    jail_chance_base: 0.05, hitman_eligible: false, war_context_only: false,
    effect_scope: 'SELF',
  },
  // ── CONTRABAND ───────────────────────────
  {
    id: 'j-univ-12',
    name: 'Run Bootleg Liquor',
    lore_tagline: 'No tax stamp. No middleman. Your price.',
    description: 'Source a case of untaxed spirits from the distribution contact upstate and retail it to bar owners and private buyers at a 40% discount to market. Fast turnover, modest profit, and a reliable income stream that\'s been running since Prohibition.',
    tier: 1, category: 'CONTRABAND', min_rank: 'ASSOCIATE', universal: true,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 18000,
    reward_band_min: 1000, reward_band_max: 3500, reward_types: ['CASH', 'XP'],
    jail_chance_base: 0.04, hitman_eligible: false, war_context_only: false,
    effect_scope: 'SELF',
  },
  {
    id: 'j-univ-13',
    name: 'Smuggle Cigarettes',
    lore_tagline: 'Two states, one truck, forty points of margin.',
    description: 'Coordinate the movement of three thousand cartons of untaxed cigarettes from a low-tax state to city distribution points. Bribe the weigh station attendant, manage the driver, and split proceeds with the sourcing crew. The city\'s smokers are a bottomless market.',
    tier: 1, category: 'CONTRABAND', min_rank: 'ASSOCIATE', universal: true,
    mode: 'SOLO_OR_CREW', min_crew_size: 0, cooldown_seconds: 21600,
    reward_band_min: 1200, reward_band_max: 4000, reward_types: ['CASH', 'XP'],
    jail_chance_base: 0.05, hitman_eligible: false, war_context_only: false,
    effect_scope: 'SELF',
  },
  // ── ECONOMY / LOAN SHARK ─────────────────
  {
    id: 'j-univ-14',
    name: 'Loan Shark Collection (Routine)',
    lore_tagline: 'The vig doesn\'t forgive. Neither do you.',
    description: 'Three accounts are due today. All three are behind on the vigorish. Visit each one — the bar owner, the gambler on the east side, and the contractor who borrowed for a failed venture. Collect what\'s owed, note what\'s still outstanding, and report back.',
    tier: 1, category: 'ECONOMY', min_rank: 'ASSOCIATE', universal: true,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 18000,
    reward_band_min: 1500, reward_band_max: 5000, reward_types: ['CASH', 'XP', 'RESPECT'],
    jail_chance_base: 0.06, hitman_eligible: false, war_context_only: false,
    effect_scope: 'SELF',
  },
  {
    id: 'j-univ-15',
    name: 'Loan Money Out (Set New Account)',
    lore_tagline: 'New accounts mean new income streams.',
    description: 'A restaurant owner needs $15,000 to cover a liquor license renewal and can\'t get a bank loan. You provide the cash at 3% weekly vig. Document the arrangement through a trusted intermediary, collect the first payment, and open the account on the books.',
    tier: 1, category: 'ECONOMY', min_rank: 'ASSOCIATE', universal: true,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 28800,
    reward_band_min: 800, reward_band_max: 3000, reward_types: ['CASH', 'XP', 'INFLUENCE'],
    jail_chance_base: 0.03, hitman_eligible: false, war_context_only: false,
    effect_scope: 'SELF',
  },
  {
    id: 'j-univ-16',
    name: 'Black Market Deal',
    lore_tagline: 'No receipt. No record. No problem.',
    description: 'A buyer and a seller with contraband interests need a neutral introduction and a safe venue. You provide both — plus security — and take a 12% facilitation fee off the top. The deal closes quietly. Everyone goes home happy.',
    tier: 1, category: 'ECONOMY', min_rank: 'ASSOCIATE', universal: true,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 21600,
    reward_band_min: 2000, reward_band_max: 7000, reward_types: ['CASH', 'INTEL', 'XP'],
    jail_chance_base: 0.07, hitman_eligible: false, war_context_only: false,
    effect_scope: 'SELF',
  },
  {
    id: 'j-univ-17',
    name: 'Cash a Stolen Check',
    lore_tagline: 'A check is only worth something if someone cashes it.',
    description: 'A batch of payroll checks came out of an office job on the waterfront. Your contact at the check-cashing outlet on Fifth will process them for 20% of face value — no questions, no IDs. Move them before the account freeze hits.',
    tier: 1, category: 'HUSTLE', min_rank: 'ASSOCIATE', universal: true,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 14400,
    reward_band_min: 700, reward_band_max: 2500, reward_types: ['CASH', 'XP'],
    jail_chance_base: 0.07, hitman_eligible: false, war_context_only: false,
    effect_scope: 'SELF',
  },
  {
    id: 'j-univ-18',
    name: 'Skim a Legitimate Business',
    lore_tagline: 'The books say one thing. The real books say another.',
    description: 'The family\'s restaurant front keeps two sets of ledgers. Your job today is to extract this week\'s skim — the cash that never hits the register — and transfer it to the clean account. Discretion is non-negotiable.',
    tier: 1, category: 'ECONOMY', min_rank: 'ASSOCIATE', universal: true,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 21600,
    reward_band_min: 1500, reward_band_max: 4500, reward_types: ['CASH', 'XP'],
    jail_chance_base: 0.04, hitman_eligible: false, war_context_only: false,
    effect_scope: 'SELF',
  },
  // ── INTEL ────────────────────────────────
  {
    id: 'j-univ-19',
    name: 'Recruit an Informant',
    lore_tagline: 'Everyone talks. You just need to find the right ear.',
    description: 'Identify and develop a new intelligence asset inside a rival crew, a city department, or a law enforcement unit. This requires patience: meet twice, establish trust, offer the arrangement, and confirm the first delivery. Information is the family\'s most durable resource.',
    tier: 1, category: 'INTEL', min_rank: 'ASSOCIATE', universal: true,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 43200,
    reward_band_min: 1500, reward_band_max: 5000, reward_types: ['INTEL', 'XP', 'INFLUENCE'],
    jail_chance_base: 0.06, hitman_eligible: false, war_context_only: false,
    effect_scope: 'FAMILY_ABSTRACT',
  },
  {
    id: 'j-univ-20',
    name: 'Tail a Mark',
    lore_tagline: 'Know their routine before they know you exist.',
    description: 'A target of interest — a rival earner, a compromised official, or a potential asset — needs to be surveilled for 48 hours. Document their movement patterns, identify their contacts, and note any vulnerabilities. Report findings to whoever ordered the tail.',
    tier: 1, category: 'INTEL', min_rank: 'ASSOCIATE', universal: true,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 28800,
    reward_band_min: 1000, reward_band_max: 3500, reward_types: ['INTEL', 'XP'],
    jail_chance_base: 0.04, hitman_eligible: false, war_context_only: false,
    effect_scope: 'FAMILY_ABSTRACT',
  },
  // ── ENFORCEMENT / CORRUPTION ─────────────
  {
    id: 'j-univ-21',
    name: 'Intimidate a Business Into Silence',
    lore_tagline: 'Witnesses don\'t appear if they know better.',
    description: 'A business owner on your block has been talking to a city inspector about irregularities in the neighborhood. Pay a visit. Remind him of the value of minding his own affairs. The message should be received without a word being raised in anger.',
    tier: 1, category: 'ENFORCEMENT', min_rank: 'ASSOCIATE', universal: true,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 21600,
    reward_band_min: 1200, reward_band_max: 4000, reward_types: ['CASH', 'INFLUENCE', 'XP'],
    jail_chance_base: 0.08, hitman_eligible: false, war_context_only: false,
    effect_scope: 'SELF',
  },
  {
    id: 'j-univ-22',
    name: 'Grease a Cop',
    lore_tagline: 'A little oil keeps the machine running smooth.',
    description: 'A local patrol officer has been writing up associates for minor violations — a pattern that suggests either personal ambition or someone else\'s instruction. An envelope delivered through the right intermediary should clarify the arrangement. Monthly, like clockwork.',
    tier: 1, category: 'CORRUPTION', min_rank: 'ASSOCIATE', universal: true,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 21600,
    reward_band_min: 500, reward_band_max: 2000, reward_types: ['INFLUENCE', 'CASH', 'XP'],
    jail_chance_base: 0.07, hitman_eligible: false, war_context_only: false,
    effect_scope: 'FAMILY_ABSTRACT',
  },
  // ── SABOTAGE ─────────────────────────────
  {
    id: 'j-univ-23',
    name: 'Vandalize a Rival\'s Business',
    lore_tagline: 'A broken window costs them more than money.',
    description: 'A rival crew is running a bookmaking operation out of a laundromat on their end of the block. Late tonight, pay a visit with two associates. Broken windows, some graffiti, a door lock glued shut. Keep it clean — no fires, no injuries. Just a message.',
    tier: 1, category: 'SABOTAGE', min_rank: 'ASSOCIATE', universal: true,
    mode: 'SOLO_OR_CREW', min_crew_size: 0, cooldown_seconds: 28800,
    reward_band_min: 500, reward_band_max: 1500, reward_types: ['INFLUENCE', 'RESPECT', 'XP'],
    jail_chance_base: 0.09, hitman_eligible: false, war_context_only: false,
    effect_scope: 'FAMILY_ABSTRACT',
  },
  // ── LOGISTICS / MISC ─────────────────────
  {
    id: 'j-univ-24',
    name: 'Run an Errand for the Boss',
    lore_tagline: 'No questions. No delays. No detours.',
    description: 'The Boss has a task that needs a reliable set of hands: pick up an envelope, deliver a message, confirm a meeting, or escort a package across town. The job itself is simple. The expectation — perfect discretion, zero complications — is not.',
    tier: 1, category: 'LOGISTICS', min_rank: 'ASSOCIATE', universal: true,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 7200,
    reward_band_min: 400, reward_band_max: 1500, reward_types: ['CASH', 'RESPECT', 'XP'],
    jail_chance_base: 0.02, hitman_eligible: false, war_context_only: false,
    effect_scope: 'FAMILY_ABSTRACT',
  },
  {
    id: 'j-univ-25',
    name: 'Dispose of Evidence',
    lore_tagline: 'What can\'t be found can\'t be used.',
    description: 'A recent operation left a trail: a phone, a bag, some documentation that the wrong hands could use. Collect the materials from the safe house, move them through two intermediary locations, and ensure permanent disposal through a trusted contact. Leave nothing.',
    tier: 1, category: 'LOGISTICS', min_rank: 'ASSOCIATE', universal: true,
    mode: 'SOLO', min_crew_size: 0, cooldown_seconds: 14400,
    reward_band_min: 600, reward_band_max: 2000, reward_types: ['CASH', 'INFLUENCE', 'XP'],
    jail_chance_base: 0.05, hitman_eligible: false, war_context_only: false,
    effect_scope: 'FAMILY_ABSTRACT',
  },
];

// ─────────────────────────────────────────────
// COMBINED EXPORT
// ─────────────────────────────────────────────

export const ALL_JOBS: JobDefinition[] = [...RANKED_JOBS, ...UNIVERSAL_JOBS];

/** Quick lookup by id */
export const JOBS_BY_ID: Record<string, JobDefinition> = Object.fromEntries(
  ALL_JOBS.map(j => [j.id, j])
);

// ─────────────────────────────────────────────
// MOCK PER-PLAYER JOB STATES
// In production this would be per-player DB rows.
// Simulating a few cooldowns for the DEV demo.
// ─────────────────────────────────────────────

import type { PlayerJobState } from '../../../shared/jobs';

const now = new Date();
const minsAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000).toISOString();

export const MOCK_JOB_STATES: Record<string, PlayerJobState[]> = {
  'p-boss': [
    { job_id: 'j-rank-50', last_completed_at: minsAgo(30), last_failed_at: null },
    { job_id: 'j-univ-01', last_completed_at: minsAgo(180), last_failed_at: null },
    { job_id: 'j-univ-05', last_completed_at: null, last_failed_at: minsAgo(10) },
  ],
  'p-underboss': [
    { job_id: 'j-rank-40', last_completed_at: minsAgo(60), last_failed_at: null },
    { job_id: 'j-univ-02', last_completed_at: minsAgo(200), last_failed_at: null },
  ],
  'p-capo': [
    { job_id: 'j-rank-20', last_completed_at: minsAgo(45), last_failed_at: null },
    { job_id: 'j-univ-06', last_completed_at: null, last_failed_at: minsAgo(20) },
  ],
  'p-soldier': [
    { job_id: 'j-rank-10', last_completed_at: minsAgo(120), last_failed_at: null },
  ],
  'p-associate': [],
  'p-recruit': [],
  'p-consigliere': [
    { job_id: 'j-rank-30', last_completed_at: minsAgo(90), last_failed_at: null },
  ],
};

/** Get the job state map for a player (keyed by job_id) */
export function getPlayerJobStates(playerId: string): Record<string, PlayerJobState> {
  const states = MOCK_JOB_STATES[playerId] ?? [];
  return Object.fromEntries(states.map(s => [s.job_id, s]));
}
