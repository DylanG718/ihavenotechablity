-- ═══════════════════════════════════════════════════════════════════════
-- THE LAST FIRM — Seed Data
-- Run after migrations to populate a fresh database.
-- NOTE: player auth_user_id fields are left NULL in seed —
--       they get linked when real Supabase auth users sign up.
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- SEASONS
-- ─────────────────────────────────────────────

INSERT INTO seasons (id, number, name, status, description, started_at, ends_at,
  soft_reset_fields, preserved_fields) VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  1, 'The Beginning', 'ENDED',
  'The first season. Five families competed for control of the city.',
  '2025-10-01T00:00:00Z', '2026-01-01T00:00:00Z',
  ARRAY['treasury','prestige','turf'],
  ARRAY['rank','archetype','family_membership','rep_history']
),
(
  'a0000000-0000-0000-0000-000000000002',
  2, 'The Reckoning', 'ENDED',
  'Season 2. The Rizzo Outfit rose to dominance on the Casino Strip.',
  '2026-01-01T00:00:00Z', '2026-03-01T00:00:00Z',
  ARRAY['treasury','prestige','turf'],
  ARRAY['rank','archetype','family_membership','rep_history']
),
(
  'a0000000-0000-0000-0000-000000000003',
  3, 'The Long Game', 'ACTIVE',
  'With territories reset and fresh capital, every family is rebuilding.',
  '2026-03-01T00:00:00Z', '2026-06-01T00:00:00Z',
  ARRAY['treasury','prestige','turf'],
  ARRAY['rank','archetype','family_membership','rep_history']
);

-- ─────────────────────────────────────────────
-- DISTRICTS
-- ─────────────────────────────────────────────

INSERT INTO districts (id, slug, name, description, tagline, theme, turf_count_target,
  allowed_front_types, influence_bonus_type, display_order) VALUES
(
  'b0000000-0000-0000-0000-000000000001',
  'DOWNTOWN', 'Downtown',
  'The financial and political core of the city.',
  'Suits, city hall, and the corruption behind the curtain.',
  'POLITICAL', 6,
  ARRAY['CONSTRUCTION','REAL_ESTATE','HQ_CLUB']::front_type[],
  'CORRUPTION', 1
),
(
  'b0000000-0000-0000-0000-000000000002',
  'WATERFRONT', 'The Waterfront',
  'A working port district of warehouses and shipping terminals.',
  'Everything that moves through this city crosses the docks first.',
  'MARITIME', 7,
  ARRAY['CONSTRUCTION','PORT_LOGISTICS','NIGHTCLUB']::front_type[],
  'SMUGGLING', 2
),
(
  'b0000000-0000-0000-0000-000000000003',
  'NORTH_END', 'North End',
  'A dense residential neighborhood with deep family roots.',
  'Old money. Old neighborhood. Old rules.',
  'RESIDENTIAL', 8,
  ARRAY['PIZZERIA','SMALL_BAR','CAR_REPAIR','NIGHTCLUB']::front_type[],
  'PROTECTION', 3
),
(
  'b0000000-0000-0000-0000-000000000004',
  'INDUSTRIAL_BELT', 'Industrial Belt',
  'The city''s industrial spine — construction yards and chop shops.',
  'Concrete, gravel, and things that go missing.',
  'INDUSTRIAL', 6,
  ARRAY['CONSTRUCTION','CAR_REPAIR','WASTE_MANAGEMENT']::front_type[],
  'CONSTRUCTION', 4
),
(
  'b0000000-0000-0000-0000-000000000005',
  'CASINO_STRIP', 'Casino Strip',
  'A concentrated entertainment corridor of casinos and nightclubs.',
  'The lights are bright. The money is dirty.',
  'GAMBLING', 5,
  ARRAY['CASINO','NIGHTCLUB','HQ_CLUB','REAL_ESTATE']::front_type[],
  'GAMBLING', 5
),
(
  'b0000000-0000-0000-0000-000000000006',
  'OUTER_BOROUGHS', 'Outer Boroughs',
  'Suburban neighborhoods at the edge of the city''s reach.',
  'Quiet streets, steady money, no questions.',
  'SUBURBAN', 8,
  ARRAY['PIZZERIA','SMALL_BAR','CAR_REPAIR']::front_type[],
  'NONE', 6
);

-- ─────────────────────────────────────────────
-- BUSINESS DEFINITIONS
-- ─────────────────────────────────────────────

INSERT INTO business_definitions (id, display_name, scale, base_profit_per_tick, base_risk,
  build_cost, recommended_manager_rank, allowed_districts, description, lore, implemented) VALUES
('CAR_REPAIR', 'Car Repair Shop', 'SMALL', 2800, 0.12, 35000, 'CAPO',
  ARRAY['NORTH_END','INDUSTRIAL_BELT','OUTER_BOROUGHS'], 
  'A legitimate auto body shop with insurance fraud on the side.',
  'They''ll fix your car. They''ll also ask no questions about the car.', true),
('PIZZERIA', 'Pizzeria', 'SMALL', 2200, 0.08, 28000, 'CAPO',
  ARRAY['NORTH_END','OUTER_BOROUGHS','WATERFRONT'],
  'A neighborhood pizzeria serving the community by day, running numbers by night.',
  'Best pizza in the city. Come for the food, stay because you have to.', true),
('SMALL_BAR', 'Small Bar', 'SMALL', 2500, 0.10, 30000, 'CAPO',
  ARRAY['NORTH_END','OUTER_BOROUGHS','WATERFRONT','CASINO_STRIP'],
  'A corner bar with a back room that does more business than the front.',
  'Drinks are cold. Questions aren''t welcome.', true),
('CASINO', 'Casino', 'LARGE', 22000, 0.28, 250000, 'UNDERBOSS',
  ARRAY['CASINO_STRIP','DOWNTOWN','WATERFRONT'],
  'A licensed gaming establishment enabling skim, laundering, and credit operations.',
  'The odds favor the house. You own the house.', true),
('CONSTRUCTION', 'Construction Company', 'LARGE', 18000, 0.22, 200000, 'UNDERBOSS',
  ARRAY['INDUSTRIAL_BELT','DOWNTOWN','WATERFRONT'],
  'A contracting business operating in the gray zone between legitimate infrastructure and fraud.',
  'The city gets built. You decide who builds it.', true),
('NIGHTCLUB', 'Nightclub', 'LARGE', 16000, 0.24, 180000, 'UNDERBOSS',
  ARRAY['CASINO_STRIP','DOWNTOWN','WATERFRONT','NORTH_END'],
  'A high-end venue for laundering, blackmail, and product distribution.',
  'The best clubs in the city are where business gets done.', true),
('PORT_LOGISTICS', 'Port Logistics Company', 'LARGE', 20000, 0.25, 220000, 'UNDERBOSS',
  ARRAY['WATERFRONT','INDUSTRIAL_BELT'],
  'Freight and logistics for importing contraband at scale.', 
  'Everything the city needs comes through the docks.', false),
('WASTE_MANAGEMENT', 'Waste Management', 'LARGE', 15000, 0.18, 170000, 'UNDERBOSS',
  ARRAY['INDUSTRIAL_BELT','OUTER_BOROUGHS'],
  'Sanitation with city contracts and evidence disposal.',
  'You''d be amazed what goes in the trucks.', false),
('REAL_ESTATE', 'Real Estate Holdings', 'LARGE', 12000, 0.14, 150000, 'UNDERBOSS',
  ARRAY['DOWNTOWN','CASINO_STRIP','NORTH_END'],
  'Property development used for large-scale laundering.',
  'The building has your name on it. The money never does.', false),
('HQ_CLUB', 'Headquarters Club', 'HQ', 35000, 0.35, 500000, 'DON',
  ARRAY['CASINO_STRIP','DOWNTOWN'],
  'The Don''s private establishment — command center and symbol of power.',
  'You don''t find the place. The place finds you.', false);

-- ─────────────────────────────────────────────
-- BUSINESS SLOT DEFINITIONS
-- ─────────────────────────────────────────────

INSERT INTO business_slot_definitions (id, business_type, role_type, display_name, required_min_rank, preferred_skill, max_one_per_business) VALUES
-- Casino
('slot-casino-manager',              'CASINO', 'MANAGER',          'Casino Manager',       'UNDERBOSS',   'OPERATIONS', true),
('slot-casino-pit-boss',             'CASINO', 'OPERATIONS_STAFF', 'Pit Boss',             'SOLDIER',     'OPERATIONS', true),
('slot-casino-dealer',               'CASINO', 'OPERATIONS_STAFF', 'Dealer',               'ASSOCIATE',   'OPERATIONS', false),
('slot-casino-floor-security-chief', 'CASINO', 'SECURITY_STAFF',   'Floor Security Chief', 'SOLDIER',     'SECURITY',   true),
('slot-casino-vip-host',             'CASINO', 'VIP_HOST',         'VIP Host',             'SOLDIER',     'CHARM',      true),
('slot-casino-cage-cashier',         'CASINO', 'FINANCE_STAFF',    'Cage Cashier',         'SOLDIER',     'FINANCE',    true),
-- Construction
('slot-construction-manager',             'CONSTRUCTION', 'MANAGER',          'Construction Boss',   'UNDERBOSS',   'OPERATIONS', true),
('slot-construction-site-foreman',        'CONSTRUCTION', 'OPERATIONS_STAFF', 'Site Foreman',        'CAPO',        'OPERATIONS', true),
('slot-construction-union-liaison',       'CONSTRUCTION', 'VIP_HOST',         'Union Liaison',       'CAPO',        'CHARM',      true),
('slot-construction-procurement-officer', 'CONSTRUCTION', 'FINANCE_STAFF',    'Procurement Officer', 'SOLDIER',     'FINANCE',    true),
('slot-construction-yard-supervisor',     'CONSTRUCTION', 'SECURITY_STAFF',   'Yard Supervisor',     'SOLDIER',     'SECURITY',   true),
-- Nightclub
('slot-nightclub-manager',        'NIGHTCLUB', 'MANAGER',          'Club Manager',    'UNDERBOSS', 'OPERATIONS', true),
('slot-nightclub-vip-host',       'NIGHTCLUB', 'VIP_HOST',         'VIP Host',        'SOLDIER',   'CHARM',      true),
('slot-nightclub-floor-manager',  'NIGHTCLUB', 'OPERATIONS_STAFF', 'Floor Manager',   'SOLDIER',   'OPERATIONS', true),
('slot-nightclub-security-chief', 'NIGHTCLUB', 'SECURITY_STAFF',   'Security Chief',  'SOLDIER',   'SECURITY',   true),
('slot-nightclub-accountant',     'NIGHTCLUB', 'FINANCE_STAFF',    'Accountant',      'SOLDIER',   'FINANCE',    true),
('slot-nightclub-bartender',      'NIGHTCLUB', 'OPERATIONS_STAFF', 'Bartender',       'ASSOCIATE', 'CHARM',      false),
-- Car Repair
('slot-car-repair-manager',               'CAR_REPAIR', 'MANAGER',          'Shop Manager',          'CAPO',      'OPERATIONS', true),
('slot-car-repair-lead-mechanic',         'CAR_REPAIR', 'OPERATIONS_STAFF', 'Lead Mechanic',         'SOLDIER',   'OPERATIONS', true),
('slot-car-repair-insurance-coordinator', 'CAR_REPAIR', 'FINANCE_STAFF',    'Insurance Coordinator', 'SOLDIER',   'FINANCE',    true),
('slot-car-repair-yard-guy',              'CAR_REPAIR', 'SECURITY_STAFF',   'Yard Guy',              'ASSOCIATE', 'SECURITY',   true),
-- Pizzeria
('slot-pizzeria-manager',          'PIZZERIA', 'MANAGER',          'Restaurant Manager', 'CAPO',      'OPERATIONS', true),
('slot-pizzeria-head-waiter',      'PIZZERIA', 'OPERATIONS_STAFF', 'Head Waiter',        'SOLDIER',   'CHARM',      true),
('slot-pizzeria-delivery-driver',  'PIZZERIA', 'OPERATIONS_STAFF', 'Delivery Driver',    'ASSOCIATE', 'SECURITY',   false),
('slot-pizzeria-back-room-runner', 'PIZZERIA', 'FINANCE_STAFF',    'Back Room Runner',   'SOLDIER',   'FINANCE',    true),
-- Small Bar
('slot-small-bar-manager',          'SMALL_BAR', 'MANAGER',          'Bar Manager',       'CAPO',      'OPERATIONS', true),
('slot-small-bar-bartender',        'SMALL_BAR', 'OPERATIONS_STAFF', 'Bartender',         'SOLDIER',   'CHARM',      false),
('slot-small-bar-doorman',          'SMALL_BAR', 'SECURITY_STAFF',   'Doorman',           'ASSOCIATE', 'SECURITY',   true),
('slot-small-bar-back-room-dealer', 'SMALL_BAR', 'FINANCE_STAFF',    'Back Room Dealer',  'SOLDIER',   'FINANCE',    true);

-- ─────────────────────────────────────────────
-- TURFS (sample — Downtown + Waterfront + North End + Casino Strip)
-- ─────────────────────────────────────────────

INSERT INTO turfs (id, district_id, name, slug, slot_count, purchase_cost, quality_tier, location_note) VALUES
-- Downtown
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'City Hall Block',     'turf-dt-01', 8, 180000, 'PRIME',  'Prime real estate adjacent to city hall.'),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Financial Row',       'turf-dt-02', 8, 200000, 'PRIME',  'Investment banks and law firms.'),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Courthouse Square',   'turf-dt-03', 6, 140000, 'SOLID',  'Heavy foot traffic from legal professionals.'),
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Transit Hub Block',   'turf-dt-05', 4, 80000,  'ROUGH',  'High foot traffic, low prestige.'),
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'Hotel Row',           'turf-dt-06', 4, 90000,  'CONTESTED', 'Three families have fought over this strip.'),
-- Waterfront
('c0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000002', 'Pier 7 Terminal',         'turf-wf-01', 8, 160000, 'PRIME', 'The main cargo pier.'),
('c0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000002', 'Dockside Warehouse Row',  'turf-wf-02', 8, 150000, 'PRIME', 'Industrial warehouse district.'),
('c0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000002', 'Harbor View Strip',       'turf-wf-03', 6, 110000, 'SOLID', 'Tourist-facing waterfront.'),
('c0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000002', 'Union Hall Block',        'turf-wf-04', 6, 130000, 'SOLID', 'Longshore union territory.'),
-- North End
('c0000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000003', 'Mulberry Street',        'turf-ne-01', 6, 90000, 'PRIME', 'Three generations of loyalty.'),
('c0000000-0000-0000-0000-000000000021', 'b0000000-0000-0000-0000-000000000003', 'Saint Anthony''s Block', 'turf-ne-02', 6, 85000, 'SOLID', 'Church, social clubs, and back-room arrangements.'),
('c0000000-0000-0000-0000-000000000022', 'b0000000-0000-0000-0000-000000000003', 'North End Market',       'turf-ne-03', 6, 80000, 'SOLID', 'Grocery stores and the back rooms that service them.'),
-- Industrial Belt
('c0000000-0000-0000-0000-000000000030', 'b0000000-0000-0000-0000-000000000004', 'Riverside Yards', 'turf-ib-01', 8, 130000, 'PRIME', 'Construction staging yard with major contracts.'),
('c0000000-0000-0000-0000-000000000031', 'b0000000-0000-0000-0000-000000000004', 'Scrap Metal Row',  'turf-ib-03', 6, 85000,  'SOLID', 'Salvage and metal recycling.'),
-- Casino Strip
('c0000000-0000-0000-0000-000000000040', 'b0000000-0000-0000-0000-000000000005', 'Grand Boulevard Casino Row', 'turf-cs-01', 8, 250000, 'PRIME', 'The crown jewel of the strip.'),
('c0000000-0000-0000-0000-000000000041', 'b0000000-0000-0000-0000-000000000005', 'High Roller Hotel Block',    'turf-cs-02', 8, 240000, 'PRIME', 'Five-star hotel and entertainment complex.'),
('c0000000-0000-0000-0000-000000000042', 'b0000000-0000-0000-0000-000000000005', 'Mid-Strip Entertainment',    'turf-cs-03', 6, 160000, 'SOLID', 'Mid-tier clubs feeding into the main casinos.'),
-- Outer Boroughs
('c0000000-0000-0000-0000-000000000050', 'b0000000-0000-0000-0000-000000000006', 'Eastside Residential Block', 'turf-ob-01', 6, 60000, 'SOLID', 'Quiet working-class neighborhood.'),
('c0000000-0000-0000-0000-000000000051', 'b0000000-0000-0000-0000-000000000006', 'Outer Park Strip',           'turf-ob-02', 4, 40000, 'ROUGH', 'Low-key suburban strip mall.');

-- ─────────────────────────────────────────────
-- FAMILIES (dev seed — no real auth users yet)
-- ─────────────────────────────────────────────

INSERT INTO families (id, name, motto, treasury, prestige, power_score, status, member_count) VALUES
('d0000000-0000-0000-0000-000000000001', 'The Corrado Family', 'Silenzio è oro.',  1240000, 120, 8420, 'ACTIVE', 7),
('d0000000-0000-0000-0000-000000000002', 'The Ferrante Crew',  'Blood is thicker.', 620000,  85, 7100, 'AT_WAR', 5),
('d0000000-0000-0000-0000-000000000003', 'Rizzo Outfit',       'Patience wins.',    880000, 100, 7800, 'ACTIVE', 6),
('d0000000-0000-0000-0000-000000000004', 'West Side Outfit',   'Own the night.',    210000,  40, 4200, 'ACTIVE', 3);

-- Assign some turf to Corrado Family
UPDATE turfs SET family_id = 'd0000000-0000-0000-0000-000000000001',
  purchased_at = now() - '30 days'::INTERVAL
WHERE slug IN ('turf-dt-01','turf-wf-01','turf-ne-01','turf-ib-01','turf-cs-01');

-- Assign some turf to Rizzo
UPDATE turfs SET family_id = 'd0000000-0000-0000-0000-000000000003',
  purchased_at = now() - '25 days'::INTERVAL
WHERE slug IN ('turf-cs-02','turf-dt-02');

-- ─────────────────────────────────────────────
-- DEV PLAYERS (no auth_user_id — for testing only)
-- ─────────────────────────────────────────────

INSERT INTO players (id, username, alias, archetype, affiliation, family_id, family_role,
  stat_cash, stat_stash, stat_heat, stat_respect, stat_strength, stat_accuracy,
  stat_intelligence, stat_charisma, stat_kills,
  onboarding_completed, player_status) VALUES
-- Corrado Family
('e0000000-0000-0000-0000-000000000001', 'don_corrado',    'Don Corrado',    'BOSS',      'LEADERSHIP', 'd0000000-0000-0000-0000-000000000001', 'BOSS',        480000, 250000, 22, 940, 42, 38, 76, 91, 12, true, 'ACTIVE'),
('e0000000-0000-0000-0000-000000000002', 'sal_the_fist',   'Sal the Fist',   'MUSCLE',    'LEADERSHIP', 'd0000000-0000-0000-0000-000000000001', 'UNDERBOSS',   210000, 80000,  18, 780, 70, 55, 55, 48, 8,  true, 'ACTIVE'),
('e0000000-0000-0000-0000-000000000003', 'the_counselor',  'The Counselor',  'SCHEMER',   'LEADERSHIP', 'd0000000-0000-0000-0000-000000000001', 'CONSIGLIERE', 165000, 60000,  14, 620, 28, 40, 88, 72, 2,  true, 'ACTIVE'),
('e0000000-0000-0000-0000-000000000004', 'tommy_two_times', 'Tommy Two-Times','RACKETEER', 'LEADERSHIP', 'd0000000-0000-0000-0000-000000000001', 'CAPO',        430000, 120000, 25, 590, 38, 44, 58, 65, 5,  true, 'ACTIVE'),
('e0000000-0000-0000-0000-000000000005', 'vinnie_d',       'Vinnie D',       'SHOOTER',   'MEMBER',     'd0000000-0000-0000-0000-000000000001', 'SOLDIER',     42000,  15000,  30, 340, 64, 78, 40, 26, 18, true, 'ACTIVE'),
('e0000000-0000-0000-0000-000000000006', 'luca_b',         'Luca B',         'EARNER',    'MEMBER',     'd0000000-0000-0000-0000-000000000001', 'ASSOCIATE',   19000,  5000,   12, 180, 22, 30, 44, 58, 0,  true, 'ACTIVE'),
('e0000000-0000-0000-0000-000000000007', 'joey_socks',     'Joey Socks',     'MUSCLE',    'RECRUIT',    'd0000000-0000-0000-0000-000000000001', 'RECRUIT',     8000,   0,      5,  60,  30, 22, 28, 35, 0,  false, 'ACTIVE');

-- Update boss references
UPDATE families SET boss_player_id = 'e0000000-0000-0000-0000-000000000001'
WHERE id = 'd0000000-0000-0000-0000-000000000001';

-- ─────────────────────────────────────────────
-- CONTRIBUTION SCORES (dev players)
-- ─────────────────────────────────────────────

INSERT INTO contribution_scores (player_id, jobs_completed, missions_completed, money_earned,
  business_jobs_completed, passive_income_generated, loyalty_days) VALUES
('e0000000-0000-0000-0000-000000000001', 142, 38, 1240000, 22, 480000, 180),
('e0000000-0000-0000-0000-000000000002', 98,  28, 780000,  18, 210000, 160),
('e0000000-0000-0000-0000-000000000003', 72,  20, 550000,  14, 165000, 155),
('e0000000-0000-0000-0000-000000000004', 88,  24, 650000,  16, 180000, 145),
('e0000000-0000-0000-0000-000000000005', 38,  14, 185000,  8,  42000,  84),
('e0000000-0000-0000-0000-000000000006', 15,  5,  85000,   2,  19000,  42),
('e0000000-0000-0000-0000-000000000007', 3,   2,  8000,    0,  0,      7);

-- ─────────────────────────────────────────────
-- CREWS
-- ─────────────────────────────────────────────

INSERT INTO crews (id, name, family_id, leader_id, description, territory, status) VALUES
(
  'f0000000-0000-0000-0000-000000000001',
  'South Port Crew',
  'd0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000002',
  'Sal''s crew covering South Port and the Waterfront.',
  ARRAY['WATERFRONT','NORTH_END'], 'ACTIVE'
),
(
  'f0000000-0000-0000-0000-000000000002',
  'Dockside Crew',
  'd0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000002',
  'Industrial Belt and Riverside operations.',
  ARRAY['INDUSTRIAL_BELT','DOWNTOWN'], 'ACTIVE'
);

-- Assign players to crews
UPDATE players SET crew_id = 'f0000000-0000-0000-0000-000000000001', crew_role = 'LEADER'
WHERE id = 'e0000000-0000-0000-0000-000000000002';
UPDATE players SET crew_id = 'f0000000-0000-0000-0000-000000000001', crew_role = 'MEMBER'
WHERE id IN ('e0000000-0000-0000-0000-000000000004','e0000000-0000-0000-0000-000000000005');

-- ─────────────────────────────────────────────
-- FRONT INSTANCES (dev seed)
-- ─────────────────────────────────────────────

INSERT INTO front_instances (id, turf_id, slot_index, front_type, family_id, upgrade_level,
  manager_player_id, daily_income_cache) VALUES
-- Casino Strip - Grand Boulevard
('g0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000040', 0, 'CASINO',       'd0000000-0000-0000-0000-000000000001', 3, 'e0000000-0000-0000-0000-000000000002', 55000),
-- Waterfront - Pier 7
('g0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000010', 0, 'CONSTRUCTION', 'd0000000-0000-0000-0000-000000000001', 3, 'e0000000-0000-0000-0000-000000000002', 45000),
('g0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000010', 1, 'NIGHTCLUB',    'd0000000-0000-0000-0000-000000000001', 1, 'e0000000-0000-0000-0000-000000000002', 16000),
-- North End
('g0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000020', 0, 'PIZZERIA',  'd0000000-0000-0000-0000-000000000001', 2, 'e0000000-0000-0000-0000-000000000004', 5280),
('g0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000020', 1, 'SMALL_BAR', 'd0000000-0000-0000-0000-000000000001', 1, 'e0000000-0000-0000-0000-000000000004', 2500);

-- ─────────────────────────────────────────────
-- BUSINESS ASSIGNMENTS (dev seed)
-- ─────────────────────────────────────────────

INSERT INTO business_assignments (front_instance_id, slot_definition_id, player_id) VALUES
-- Casino: Sal as Manager, Vinnie as Pit Boss, Luca as Dealer
('g0000000-0000-0000-0000-000000000001', 'slot-casino-manager',    'e0000000-0000-0000-0000-000000000002'),
('g0000000-0000-0000-0000-000000000001', 'slot-casino-pit-boss',   'e0000000-0000-0000-0000-000000000005'),
('g0000000-0000-0000-0000-000000000001', 'slot-casino-dealer',     'e0000000-0000-0000-0000-000000000006'),
-- Construction: Sal as Manager, Tommy as Site Foreman
('g0000000-0000-0000-0000-000000000002', 'slot-construction-manager',      'e0000000-0000-0000-0000-000000000002'),
('g0000000-0000-0000-0000-000000000002', 'slot-construction-site-foreman', 'e0000000-0000-0000-0000-000000000004'),
-- Pizzeria: Tommy as Manager
('g0000000-0000-0000-0000-000000000004', 'slot-pizzeria-manager',  'e0000000-0000-0000-0000-000000000004');

-- ─────────────────────────────────────────────
-- SAMPLE NOTIFICATIONS (dev)
-- ─────────────────────────────────────────────

INSERT INTO notifications (player_id, type, title, body, read, created_at) VALUES
('e0000000-0000-0000-0000-000000000001', 'WAR_DECLARED',        'War Declared', 'The Ferrante Crew has declared war on the Corrado Family.', false, now() - '12 hours'::INTERVAL),
('e0000000-0000-0000-0000-000000000001', 'PASSIVE_INCOME_PAYOUT', 'Passive Income', 'Casino generated $12,400. Deposited to family treasury.', false, now() - '1 day'::INTERVAL),
('e0000000-0000-0000-0000-000000000001', 'RANK_ELIGIBLE',       'Promotion Eligible', 'Tommy Two-Times has met thresholds for Underboss.', false, now() - '1 day'::INTERVAL),
('e0000000-0000-0000-0000-000000000001', 'SEASON_ENDING_SOON',  'Season 3 Ending', 'Season 3 ends in 4 days. Lock in your rankings.', true, now() - '3 days'::INTERVAL);

-- ─────────────────────────────────────────────
-- OBITUARIES (dev)
-- ─────────────────────────────────────────────

INSERT INTO obituary_entries (event_type, player_alias, family_id, family_name, note, created_at) VALUES
('DEATH', 'Marco Ferrante', 'd0000000-0000-0000-0000-000000000002', 'Ferrante Crew', 'Found in his car near the waterfront. The Cardinal sends his regards.', now() - '9 days'::INTERVAL),
('WITNESS_PROTECTION', 'Danny Bricks', 'd0000000-0000-0000-0000-000000000003', 'Rizzo Outfit', 'Turned state''s evidence after the Pier 7 raid. Left with a new name and federal security.', now() - '11 days'::INTERVAL),
('LEADERSHIP_CHANGE', 'Don Corrado', 'd0000000-0000-0000-0000-000000000001', 'Corrado Family', 'Don Corrado has assumed control of the family. The transition was seamless. The throne is occupied.', now() - '30 days'::INTERVAL);

-- ─────────────────────────────────────────────
-- LIVE-OPS EVENTS (dev)
-- ─────────────────────────────────────────────

INSERT INTO liveops_events (name, description, flavor, scope, scope_target_id, modifiers, start_at, end_at, active) VALUES
(
  'Casino Weekend',
  'Increased casino activity across the city this weekend.',
  'The chips are hot. The tables are packed. Cash flows like water.',
  'FRONT_TYPE', 'CASINO',
  '[{"type": "INCOME_MULTIPLIER", "multiplier": 1.5, "targetId": "CASINO"}]'::JSONB,
  now() - '1 day'::INTERVAL, now() + '2 days'::INTERVAL, true
),
(
  'Waterfront Crackdown',
  'Federal agents are active on the docks this week.',
  'Feds are everywhere at the docks. Keep your head down.',
  'DISTRICT', 'WATERFRONT',
  '[{"type": "JAIL_RISK_MULTIPLIER", "multiplier": 1.75, "targetId": null}, {"type": "INCOME_MULTIPLIER", "multiplier": 0.7, "targetId": null}]'::JSONB,
  now() - '1 day'::INTERVAL, now() + '3 days'::INTERVAL, true
);

-- ─────────────────────────────────────────────
-- FAMILY ACTIVITY FEED (dev)
-- ─────────────────────────────────────────────

INSERT INTO family_activity_feed (family_id, event_type, actor_alias, actor_role, description, metadata, created_at) VALUES
('d0000000-0000-0000-0000-000000000001', 'WAR_STARTED',       'Don Corrado',    'BOSS',       'Don Corrado declared war on the Ferrante Crew after repeated turf incursions.', '{}'::JSONB, now() - '12 hours'::INTERVAL),
('d0000000-0000-0000-0000-000000000001', 'TURF_PURCHASED',    'Don Corrado',    'BOSS',       'South Port district added to family holdings. Cost: $85,000.', '{"cost": 85000}'::JSONB, now() - '1 day'::INTERVAL),
('d0000000-0000-0000-0000-000000000001', 'MEMBER_PROMOTED',   'Sal the Fist',   'UNDERBOSS',  'Vinnie D promoted from Associate to Soldier after consistent performance.', '{}'::JSONB, now() - '2 days'::INTERVAL),
('d0000000-0000-0000-0000-000000000001', 'FRONT_UPGRADED',    'Sal the Fist',   'UNDERBOSS',  'Waterfront Casino upgraded to Tier 3. Passive income increased by $4,200/day.', '{}'::JSONB, now() - '2 days'::INTERVAL);

-- ─────────────────────────────────────────────
-- WORLD ACTIVITY FEED (dev)
-- ─────────────────────────────────────────────

INSERT INTO world_activity_feed (event_type, headline, detail, family_id, district_id, created_at) VALUES
('OBITUARY', 'Marco Ferrante Found Dead', 'Senior Ferrante Crew member found near the waterfront. Third death this month.', 'd0000000-0000-0000-0000-000000000002', NULL, now() - '9 days'::INTERVAL),
('WITNESS_PROTECTION', 'Danny Bricks Enters Federal Protection', 'Rizzo Outfit capo turned state''s evidence. Three open investigations reopened.', 'd0000000-0000-0000-0000-000000000003', NULL, now() - '11 days'::INTERVAL),
('FAMILY_RANK_CHANGE', 'Corrado Family Claims #1 Ranking', 'The Corrado Family overtook the Rizzo Outfit for the top position in Season 3.', 'd0000000-0000-0000-0000-000000000001', NULL, now() - '5 days'::INTERVAL),
('DISTRICT_CONTROL_CHANGE', 'Corrado Family Controls Downtown', 'After sustained turf investment, the Corrado Family now controls the Downtown district.', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', now() - '3 days'::INTERVAL);

-- ─────────────────────────────────────────────
-- Calculate initial district influence
-- ─────────────────────────────────────────────

SELECT update_district_influence();
