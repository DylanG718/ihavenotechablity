# The Last Firm — Job Art Production Manifest
## Source of Truth · Image Pipeline · v1.0

---

## PHASE 1 — AUDIT RESULTS

### Confirmed Jobs in the Codebase

**Total: 55 jobs**

#### Ranked Jobs (30 — tier-gated by family rank)

| Job ID | Name | Tier | Min Rank | Category | Mode | Jail Risk |
|---|---|---|---|---|---|---|
| j-rank-01 | Run a Corner Numbers Spot | 1 | ASSOCIATE | GAMBLING | SOLO | 3% |
| j-rank-02 | Collect a Street Debt | 1 | ASSOCIATE | EXTORTION | SOLO | 5% |
| j-rank-03 | Move Hot Electronics | 1 | ASSOCIATE | FENCING | SOLO_OR_CREW | 6% |
| j-rank-04 | Run an Errand for the Crew | 1 | ASSOCIATE | LOGISTICS | SOLO | 1% |
| j-rank-05 | Boost a Car | 1 | ASSOCIATE | HUSTLE | SOLO | 8% |
| j-rank-10 | Extort a Local Business | 2 | SOLDIER | EXTORTION | SOLO_OR_CREW | 8% |
| j-rank-11 | Run a Card Game | 2 | SOLDIER | GAMBLING | SOLO_OR_CREW | 6% |
| j-rank-12 | Fence Stolen Goods (Mid-Tier) | 2 | SOLDIER | FENCING | SOLO | 9% |
| j-rank-13 | Intimidate a Witness | 2 | SOLDIER | ENFORCEMENT | SOLO | 12% |
| j-rank-14 | Manage a Loan Book | 2 | SOLDIER | ECONOMY | SOLO | 5% |
| j-rank-15 | Oversee a Contraband Shipment | 2 | SOLDIER | CONTRABAND | CREW | 13% |
| j-rank-20 | Run a Territory Racket | 3 | CAPO | EXTORTION | CREW | 8% |
| j-rank-21 | Corrupt a City Official | 3 | CAPO | CORRUPTION | SOLO | 10% |
| j-rank-22 | Orchestrate a Mid-Level Heist | 3 | CAPO | HUSTLE | CREW | 18% |
| j-rank-23 | Set Up a Money Laundering Front | 3 | CAPO | ECONOMY | SOLO | 7% |
| j-rank-24 | Broker a Labor Union Deal | 3 | CAPO | INFLUENCE | SOLO | 9% |
| j-rank-30 | Broker a Peace Between Families | 3.5 | CONSIGLIERE | INFLUENCE | SOLO | 4% |
| j-rank-31 | Compile Intel on a Rival Family | 3.5 | CONSIGLIERE | INTEL | SOLO | 5% |
| j-rank-32 | Advise on a High-Stakes Contract | 3.5 | CONSIGLIERE | SPECIAL | SOLO | 2% |
| j-rank-33 | Turn a Police Commander | 3.5 | CONSIGLIERE | CORRUPTION | SOLO | 10% |
| j-rank-40 | Orchestrate a Multi-Crew Operation | 4 | UNDERBOSS | HUSTLE | CREW | 18% |
| j-rank-41 | Consolidate Family Rackets | 4 | UNDERBOSS | ECONOMY | SOLO | 6% |
| j-rank-42 | Negotiate a War Ceasefire | 4 | UNDERBOSS | INFLUENCE | SOLO | 4% |
| j-rank-43 | Flip a Rival Crew Lieutenant | 4 | UNDERBOSS | INTEL | SOLO | 12% |
| j-rank-44 | Run a Major Gambling Operation | 4 | UNDERBOSS | GAMBLING | CREW | 9% |
| j-rank-50 | Seize a Rival Territory (War Op) | 5 | BOSS | SPECIAL | CREW | 20% |
| j-rank-51 | Order a Strategic Hit (War Score Op) | 5 | BOSS | SPECIAL | SOLO | 15% |
| j-rank-52 | Call a Commission Meeting | 5 | BOSS | INFLUENCE | SOLO | 5% |
| j-rank-53 | Secure a Federal Contact | 5 | BOSS | CORRUPTION | SOLO | 12% |
| j-rank-54 | Establish a New Racket Empire | 5 | BOSS | ECONOMY | CREW | 10% |

#### Universal Jobs (25 — any rank, reward scaled by multiplier)

| Job ID | Name | Category |
|---|---|---|
| j-univ-01 | Run a Sports Book | GAMBLING |
| j-univ-02 | Run a Numbers Spot | GAMBLING |
| j-univ-03 | Poker Night (Back Room) | GAMBLING |
| j-univ-04 | Horse Race Fix Information | GAMBLING |
| j-univ-05 | Protection Rounds | EXTORTION |
| j-univ-06 | Extort a Restaurant | EXTORTION |
| j-univ-07 | Demand Tribute from a Street Crew | EXTORTION |
| j-univ-08 | Collect Insurance Fraud Cut | EXTORTION |
| j-univ-09 | Move Stolen Electronics | FENCING |
| j-univ-10 | Fence Stolen Jewelry | FENCING |
| j-univ-11 | Move Counterfeit Goods | FENCING |
| j-univ-12 | Run Bootleg Liquor | CONTRABAND |
| j-univ-13 | Smuggle Cigarettes | CONTRABAND |
| j-univ-14 | Loan Shark Collection (Routine) | ECONOMY |
| j-univ-15 | Loan Money Out (Set New Account) | ECONOMY |
| j-univ-16 | Black Market Deal | ECONOMY |
| j-univ-17 | Cash a Stolen Check | ECONOMY |
| j-univ-18 | Skim a Legitimate Business | ECONOMY |
| j-univ-19 | Recruit an Informant | INTEL |
| j-univ-20 | Tail a Mark | INTEL |
| j-univ-21 | Intimidate a Business Into Silence | ENFORCEMENT |
| j-univ-22 | Grease a Cop | CORRUPTION |
| j-univ-23 | Vandalize a Rival's Business | SABOTAGE |
| j-univ-24 | Run an Errand for the Boss | LOGISTICS |
| j-univ-25 | Dispose of Evidence | LOGISTICS |

---

### Engine Outcome States (Current)

The Jobs engine currently supports **3 outcome states**:

| State | Description | Image Required |
|---|---|---|
| `SUCCESS` | Job completed, cash paid | `_base` + `_success` |
| `FAILURE` | Job failed, no cash, heat gained | `_failure` |
| `JAILED` | Failure + jail triggered (sub-state of failure) | `_busted` |

**Currently NOT supported in Jobs engine (but supported in Missions/Contracts):**
- `JACKPOT` — critical success / rare bonus payout
- `INJURY` — physical damage / hospitalized state

**Recommendation:** Add `JACKPOT` and `INJURY` as optional outcome states to the Jobs engine (low-probability rolls). Flag these in manifest as "Phase 4 — engine work required before image is usable."

---

### Jobs Currently Missing (Recommended Additions)

These exist in the taxonomy request and are thematically logical but have no current implementation:

| Missing Job | Category | Suggested Tier | Priority |
|---|---|---|---|
| Car Theft (specific vehicle, chop shop) | HUSTLE | 1 | HIGH — j-rank-05 covers this partially but needs its own universal version |
| Warehouse Burglary | HUSTLE | 2 | MEDIUM |
| Port Dock Pickup / Contraband Run | CONTRABAND | 2 | HIGH — j-rank-15 exists but no universal version |
| Casino Skimming | GAMBLING | 3 | MEDIUM |
| Nightclub Cash Extraction | GAMBLING | 2 | MEDIUM |
| Construction Kickback Collection | EXTORTION | 3 | MEDIUM |
| Pharmaceutical Diversion Run | CONTRABAND | 3 | MEDIUM |
| Armored Car Robbery | HUSTLE | 4-5 | HIGH — prestige capstone, no equivalent |
| Art Theft Facilitation | FENCING | 3 | LOW |
| Emergency Cash Relocation | LOGISTICS | 3 | LOW |
| Informant Silence Job | ENFORCEMENT | 4 | MEDIUM |

**Gameplay inconsistency flagged:** No TRANSPORT/SMUGGLING jobs exist below Tier 2 (Soldier). New Associates have no smuggling or transport entry point — only gambling, extortion, fencing, and logistics. Consider adding one universal transport job for early-game variety.

---

## PHASE 2 — MAFIA-STYLE JOB TAXONOMY (Aligned to Existing Game)

```
CATEGORY A — GAMBLING (7 jobs in game)
  Street-level: Numbers Spot, Sports Book, Horse Fix, Poker Night
  Mid-level: Card Game, Territory Card Night
  High-level: Major Gambling Operation

CATEGORY B — EXTORTION (9 jobs in game)
  Street-level: Protection Rounds, Restaurant Visit, Tribute Collection
  Mid-level: Street Debt, Loan Book, Business Extortion
  High-level: Territory Racket, Union Deal
  Institutional: Insurance Fraud Cut

CATEGORY C — FENCING / THEFT (6 jobs in game)
  Street-level: Electronics, Jewelry, Counterfeit Goods
  Mid-level: Mid-Tier Fence, Hot Electronics
  Missing: Warehouse, Car Theft (dedicated)

CATEGORY D — CONTRABAND / SMUGGLING (3 jobs in game)
  Street-level: Bootleg Liquor, Cigarettes
  Mid-level: Contraband Shipment (Soldier)
  Missing: Port pickup, pharma diversion

CATEGORY E — ENFORCEMENT (3 jobs in game)
  Witness Intimidation, Business Silence, (War Territory Seizure)
  Missing: Informant silence, armed escort

CATEGORY F — ECONOMY / FINANCE (7 jobs in game)
  Loan Collection, Loan Setup, Skimming, Stolen Checks, Black Market
  Mid: Laundering Front, Racket Consolidation, Racket Empire

CATEGORY G — INTEL / INFLUENCE (6 jobs in game)
  Tail a Mark, Recruit Informant, Rival Intel, Flip Lieutenant
  Broker Peace, Advise Contract

CATEGORY H — CORRUPTION (5 jobs in game)
  Grease a Cop, Corrupt City Official, Turn Police Commander
  Secure Federal Contact, (Witness Intimidation crosses here)

CATEGORY I — LOGISTICS (3 jobs in game)
  Crew Errand, Boss Errand, Evidence Disposal

CATEGORY J — HUSTLE / HEIST (3 jobs in game)
  Boost a Car, Mid-Level Heist, Multi-Crew Operation
  Missing: Armored Car Robbery (major gap)

CATEGORY K — SABOTAGE (1 job in game)
  Vandalize Rival Business

CATEGORY L — SPECIAL / BOSS-ONLY (5 jobs in game)
  Territory Seizure, Strategic Hit, Commission Meeting,
  Federal Contact, Racket Empire
```

---

## PHASE 3 — IMAGE VARIANT REQUIREMENTS

**Decision rules:**
- ALL jobs need: `base` + `success` + `failure`
- `busted` image: only for jobs with jail_chance_base ≥ 0.08
- `jackpot` image: only for jobs with reward_band_max ≥ $15,000 AND high visual drama potential
- `injury` image: only for enforcement, heist, war-context, and hitman-eligible jobs
- `jackpot` and `injury` are Phase 4 (engine support needed first)

---

## PHASE 4 — FULL PRODUCTION MANIFEST

### Naming Convention

```
job_[short_slug]_[variant]_v[version]
```

Examples:
- `job_collect_debt_base_v01.png`
- `job_collect_debt_success_v01.png`
- `job_collect_debt_failure_v01.png`
- `job_collect_debt_busted_v01.png`
- `job_smuggle_cigarettes_jackpot_v01.png`

**Variant codes:**
- `base` — job card / before running
- `success` — clean outcome
- `failure` — failed outcome
- `busted` — jailed / law enforcement pressure
- `jackpot` — rare critical success (Phase 4)
- `injury` — physical cost / aftermath (Phase 4)

---

### Full Manifest Table

| asset_id | job_id | job_name | category | tier | archetype | rank_restriction | image_type | scene_title | scene_description | mood | lighting | environment | subject_focus | composition | color_bias | risk_level | filename | priority | status | notes_from_art_direction |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TLF-ART-001 | j-univ-05 | Protection Rounds | EXTORTION | 1 | NEUTRAL | none | base | The Walk | A well-dressed man of mixed-race background walks alone down a rain-wet commercial street at night, approaching a lit deli window. Hands in pockets. Unhurried. | Composed, purposeful | Wet amber streetlight | Urban commercial street, rain | Figure approaching business | Wide, figure in lower-third walking toward light | Charcoal + amber reflections | LOW | job_protection_rounds_base_v01.png | 1 | PENDING | Modern city, contemporary clothing. Sole figure, back visible or 3/4 profile. No weapons shown. |
| TLF-ART-002 | j-univ-05 | Protection Rounds | EXTORTION | 1 | NEUTRAL | none | success | The Envelope | A thick envelope rests on a wet metal diner table. A Black man's hand in a clean jacket reaches across to take it. Dim interior warmth. | Quiet satisfaction | Warm diner interior | Interior diner booth | Hands + envelope close-up | Medium close, foreground envelope dominant | Warm cream + dark wood | LOW | job_protection_rounds_success_v01.png | 1 | PENDING | No faces needed. Hands and environment tell the story. |
| TLF-ART-003 | j-univ-05 | Protection Rounds | EXTORTION | 1 | NEUTRAL | none | failure | The Door That Stayed Shut | A closed shop front at night. Blinds drawn. Lights off. A silhouette of a man stands outside on the wet sidewalk staring at it. Rejected. Exposed. | Tense, exposed | Cold blue streetlight | Closed storefront exterior | Figure + closed door | Wide, subject small | Cold blue-grey | LOW | job_protection_rounds_failure_v01.png | 1 | PENDING | Mood of being shut out without drama. Contemporary setting. |
| TLF-ART-004 | j-rank-02 | Collect a Street Debt | EXTORTION | 1 | NEUTRAL | ASSOCIATE | base | The Visit | An Asian man in a dark coat stands in the doorway of a mid-range apartment building. The lobby is lit fluorescent behind him. A phone buzzes in his hand. | Calm pressure | Fluorescent lobby + street light | Urban apartment lobby | Figure in doorway | Medium, figure centered | Pale green-white institutional + street amber | LOW | job_collect_debt_base_v01.png | 1 | PENDING | Modern residential building. Calm not threatening. |
| TLF-ART-005 | j-rank-02 | Collect a Street Debt | EXTORTION | 1 | NEUTRAL | ASSOCIATE | success | Paid in Full | A brown envelope and a folded-up cash stack on a kitchen table. A receipt torn in half beside them. Morning light through blinds. | Relief, closure | Soft morning natural light | Domestic kitchen table | Table objects close | Tight still-life foreground | Warm cream + pale gold | LOW | job_collect_debt_success_v01.png | 1 | PENDING | Still life. No figures needed. Objects communicate. |
| TLF-ART-006 | j-rank-02 | Collect a Street Debt | EXTORTION | 1 | NEUTRAL | ASSOCIATE | failure | The Runaround | A man in a coat stands on a corner at dusk. His phone is to his ear. He's looking down the block — the contact isn't there. | Frustrated, exposed | Grey dusk natural | Street corner, urban | Figure on corner with phone | Wide, figure small in environment | Cool grey-blue | LOW | job_collect_debt_failure_v01.png | 1 | PENDING | No contact showed. Contemporary street. Mixed race figure. |
| TLF-ART-007 | j-rank-05 | Boost a Car | HUSTLE | 1 | MUSCLE | ASSOCIATE | base | The Lot | A dark parking structure. A row of modern cars. A slim Black man in casual clothes crouches beside a door, gloved. Only the sound of distant traffic. | Focused, tense | Harsh parking garage fluorescent | Multi-level parking garage | Figure beside car | Wide, environment dominant | Concrete grey + headlight amber | MEDIUM | job_boost_car_base_v01.png | 2 | PENDING | Modern vehicles. Contemporary garage. No period styling. |
| TLF-ART-008 | j-rank-05 | Boost a Car | HUSTLE | 1 | MUSCLE | ASSOCIATE | success | Clean Delivery | A dark sedan driving away on a wet highway at night, seen from behind. City lights ahead. Open road. | Clean, accomplished | Wet highway night amber | Highway at night | Car retreating into city lights | Cinematic wide rear-view | Asphalt black + amber | MEDIUM | job_boost_car_success_v01.png | 2 | PENDING | Car is modern — no vintage styling. |
| TLF-ART-009 | j-rank-05 | Boost a Car | HUSTLE | 1 | MUSCLE | ASSOCIATE | failure | Blue Lights | A dark alley. Red and blue light pulses reflected in the wet pavement from off-screen. A figure running away seen from far distance. | Panic, exposure | Police strobe reflected | Dark alley, wet night | Running figure seen from distance | Wide, figure tiny in frame | Deep blue-red pulse + black | MEDIUM | job_boost_car_failure_v01.png | 2 | PENDING | Police presence implied through light only, no police shown. |
| TLF-ART-010 | j-rank-05 | Boost a Car | HUSTLE | 1 | MUSCLE | ASSOCIATE | busted | The Cuffs | A man's wrists in handcuffs resting on a metal processing table in a police station. Fluorescent above. Cold and clinical. | Cold, captured | Harsh fluorescent institutional | Police processing room | Hands in cuffs close | Tight close-up horizontal | Pale institutional grey | MEDIUM | job_boost_car_busted_v01.png | 2 | PENDING | No faces. Hands only. Institutional coldness. |
| TLF-ART-011 | j-univ-02 | Run a Numbers Spot | GAMBLING | 1 | EARNER | none | base | The Corner | A Hispanic man in a clean hoodie leans against a wall near a bodega, phone in hand, scanning the street. A folded paper in his jacket pocket. Daytime urban. | Alert, casual authority | Overcast midday natural | Urban corner, bodega | Figure leaning, watching | Medium wide, figure in mid-ground | Dusty green-cream | LOW | job_numbers_spot_base_v01.png | 1 | PENDING | Daytime street. Contemporary. No period elements. |
| TLF-ART-012 | j-univ-02 | Run a Numbers Spot | GAMBLING | 1 | EARNER | none | success | The Count | A pair of hands counting folded cash bills on a small table. A phone with a calculator app beside it. Clean apartment. | Satisfied, methodical | Warm interior lamp | Small apartment table | Hands counting cash | Close medium shot | Warm cream + gold | LOW | job_numbers_spot_success_v01.png | 1 | PENDING | Cash count. Modern apartment. Simple, grounded. |
| TLF-ART-013 | j-univ-02 | Run a Numbers Spot | GAMBLING | 1 | EARNER | none | failure | Bad Numbers | A crumpled paper betting slip on wet sidewalk. Rain. Nobody around. | Flat, deflated | Cold rain, grey | Wet sidewalk | Paper slip close, ground level | Extreme close foreground | Cold wet grey | LOW | job_numbers_spot_failure_v01.png | 1 | PENDING | Abstract still life failure. Simple, quiet. |
| TLF-ART-014 | j-rank-11 | Run a Card Game | GAMBLING | 2 | EARNER | SOLDIER | base | The Back Room | A dimly lit back room above a restaurant. A green baize card table. Four silhouetted figures seated, chips stacked. Warm ceiling light from a single bulb. | Charged, contained | Single hanging warm bulb | Restaurant back room, private | Table from above or wide angle | Cinematic wide, table dominant | Deep amber + green baize | MEDIUM | job_card_game_base_v01.png | 2 | PENDING | Modern private gambling setting. Racially diverse seated figures — silhouettes only. |
| TLF-ART-015 | j-rank-11 | Run a Card Game | GAMBLING | 2 | EARNER | SOLDIER | success | House Wins | A stack of chips and a thick roll of cash on the green table. Cards face-down. The room behind empty now, chairs pushed back. | Clean satisfaction | Warm private interior | Empty back room after game | Cash and chips still life | Close foreground | Deep amber + green | MEDIUM | job_card_game_success_v01.png | 2 | PENDING | Aftermath still life. Warm, earned. |
| TLF-ART-016 | j-rank-11 | Run a Card Game | GAMBLING | 2 | EARNER | SOLDIER | failure | Bad Night | A back room with overturned chairs. One card face-up on the floor. Someone left in a hurry. | Tense, disrupted | Cold fluorescent emergency | Disrupted back room | Empty chaotic room | Wide, environment tells story | Cold green-grey | MEDIUM | job_card_game_failure_v01.png | 2 | PENDING | No figures. Environment communicates. |
| TLF-ART-017 | j-rank-03 | Move Hot Electronics | FENCING | 1 | EARNER | ASSOCIATE | base | The Handoff | A Black man in a clean jacket transfers cardboard boxes from the back of a dark van to the loading bay of a warehouse. Nighttime. | Efficient, calm | Sodium vapor warehouse | Urban loading dock, night | Figure + boxes + van | Wide horizontal | Industrial amber-orange | LOW | job_hot_electronics_base_v01.png | 2 | PENDING | Modern goods. No branded electronics. Contemporary van. |
| TLF-ART-018 | j-rank-03 | Move Hot Electronics | FENCING | 1 | EARNER | ASSOCIATE | success | Moved | A dark empty loading bay. The van is gone. A single cash envelope on a crate. | Quiet completion | Sodium vapor | Empty loading dock | Cash envelope on crate | Close medium | Industrial amber | LOW | job_hot_electronics_success_v01.png | 2 | PENDING | Minimalist. Environment and one object. |
| TLF-ART-019 | j-rank-03 | Move Hot Electronics | FENCING | 1 | EARNER | ASSOCIATE | failure | Wrong Buyer | A man's back as he walks quickly away from a parking lot. Someone else's car peeling out in the distance. | Tense, scrambling | Cold garage fluorescent | Urban parking lot | Retreating figure | Wide, figure small | Cold grey | LOW | job_hot_electronics_failure_v01.png | 2 | PENDING | Buyer was bad. Deal fell apart. Contemporary. |
| TLF-ART-020 | j-univ-14 | Loan Shark Collection | ECONOMY | 1 | NEUTRAL | none | base | The Route | An Asian woman in a structured coat walks along a commercial block, phone in one hand, small leather notebook in the other. Business hours. | Professional, controlled | Overcast natural day | Commercial sidewalk | Figure walking with purpose | Medium wide | Muted green-grey + cream | LOW | job_loansharking_base_v01.png | 1 | PENDING | **Diversity note: woman collector. Modern professional appearance.** |
| TLF-ART-021 | j-univ-14 | Loan Shark Collection | ECONOMY | 1 | NEUTRAL | none | success | The Vig | A pair of hands, one with rings, counting currency on a diner table. Coffee cup beside them. | Satisfied | Warm diner interior | Diner table close | Hands + cash | Close | Warm brown-cream | LOW | job_loansharking_success_v01.png | 1 | PENDING | Close-up still life. |
| TLF-ART-022 | j-univ-14 | Loan Shark Collection | ECONOMY | 1 | NEUTRAL | none | failure | Past Due | A door with a note stuck to it. Nobody home. An empty apartment hallway. | Frustrated, empty | Cold hallway fluorescent | Apartment corridor | Door with note | Medium, door centered | Pale institutional | LOW | job_loansharking_failure_v01.png | 1 | PENDING | Debtor skipped. Implicit. |
| TLF-ART-023 | j-rank-15 | Oversee Contraband Shipment | CONTRABAND | 2 | NEUTRAL | SOLDIER | base | The Port at 2 AM | A commercial port at night. Shipping containers stacked. A lone suited figure on an elevated walkway overlooks the offload operation below. | Commanding, tense | Sodium harbor light + darkness | Industrial port, night | Figure on walkway above dock | Wide aerial, figure tiny | Deep blue + sodium amber | HIGH | job_contraband_shipment_base_v01.png | 1 | PENDING | **Key image.** Wide shot. Figure of authority. Contemporary port. |
| TLF-ART-024 | j-rank-15 | Oversee Contraband Shipment | CONTRABAND | 2 | NEUTRAL | SOLDIER | success | Cleared | The same port dock, quiet now. Containers sealed, truck departing. A phone lit up showing a text confirmation. | Quiet relief | Grey pre-dawn | Port dock, pre-dawn | Phone screen + dock | Medium — phone in foreground, dock behind | Cool grey-blue + phone glow | HIGH | job_contraband_shipment_success_v01.png | 1 | PENDING | Quiet moment after the operation succeeds. |
| TLF-ART-025 | j-rank-15 | Oversee Contraband Shipment | CONTRABAND | 2 | NEUTRAL | SOLDIER | failure | Lights on the Water | The port dock suddenly lit by searchlights from the water. A cutter vessel's spotlight. Everyone gone. | Alarm, exposure | Searchlight white + blue-black | Port dock, night | Empty dock, light beam | Dramatic wide | Ice white + dark blue | HIGH | job_contraband_shipment_failure_v01.png | 1 | PENDING | No people. Searchlight and empty dock communicate. |
| TLF-ART-026 | j-rank-15 | Oversee Contraband Shipment | CONTRABAND | 2 | NEUTRAL | SOLDIER | busted | Processing | A cold interview room. A table with a port authority ID badge and a phone laid flat on it. Nobody in frame. | Cold, official | Clinical fluorescent | Port authority interview room | Objects on table | Still life close | Pale institutional blue | HIGH | job_contraband_shipment_busted_v01.png | 2 | PENDING | Arrest implied through objects. Institutional. |
| TLF-ART-027 | j-rank-13 | Intimidate a Witness | ENFORCEMENT | 2 | MUSCLE | SOLDIER | base | The Parking Garage | A concrete parking garage. A Black man in a tailored jacket stands between two pillars, watching a figure across the garage who doesn't know he's there yet. | Calculated, cold | Parking garage fluorescent | Multi-level parking structure | Two figures, distance between | Wide, tension in space | Concrete grey | MEDIUM | job_intimidate_witness_base_v01.png | 2 | PENDING | Quiet menace. No weapons. Physical presence communicates. |
| TLF-ART-028 | j-rank-13 | Intimidate a Witness | ENFORCEMENT | 2 | MUSCLE | SOLDIER | success | Understood | An empty courtroom witness bench. No one present. A crumpled witness statement form in a trash can. | Cold relief | Cold courtroom light | Courthouse interior | Empty witness area + trash can | Wide, empty environment | Grey-blue institutional | MEDIUM | job_intimidate_witness_success_v01.png | 2 | PENDING | Witness withdrew. Implied through environment. |
| TLF-ART-029 | j-rank-13 | Intimidate a Witness | ENFORCEMENT | 2 | MUSCLE | SOLDIER | failure | He Talked | A police sketch visible on a table — a figure's jawline drawn in pencil. Institutional setting. Police notepad beside it. | Dread, consequence | Clinical office light | Police detective office | Police sketch + notepad | Close foreground | Cold institutional | MEDIUM | job_intimidate_witness_failure_v01.png | 2 | PENDING | Outcome implied through evidence. No faces on sketch. |
| TLF-ART-030 | j-rank-13 | Intimidate a Witness | ENFORCEMENT | 2 | MUSCLE | SOLDIER | busted | Caught in the Act | A stairwell. Police tape on the door. Blue light from below. A figure pressed against the wall. | Trapped | Blue strobe from below | Stairwell | Figure against wall, trapped | Claustrophobic vertical | Deep blue shadow | MEDIUM | job_intimidate_witness_busted_v01.png | 3 | PENDING | Physical presence in tight space. |
| TLF-ART-031 | j-rank-21 | Corrupt a City Official | CORRUPTION | 3 | SCHEMER | CAPO | base | The Restaurant Meeting | An upscale restaurant. A suited Asian man across from a city official. Both eating. Documents in a folder by the breadbasket. Nothing obviously wrong. | Formal, contained | Warm restaurant evening | Upscale restaurant interior | Two figures at table, 3/4 view | Medium wide, both figures | Warm ivory-gold | MEDIUM | job_corrupt_official_base_v01.png | 2 | PENDING | **Key mid-tier image.** Both characters visible, diverse pairing. Suits, not street. |
| TLF-ART-032 | j-rank-21 | Corrupt a City Official | CORRUPTION | 3 | SCHEMER | CAPO | success | The Approval | A manila folder open on a desk. A city permit stamped APPROVED in red. An open pen beside it. | Clean, institutional | Office daylight | City office desk | Document + stamp | Close | Cream + red stamp | MEDIUM | job_corrupt_official_success_v01.png | 2 | PENDING | Object-led success. Simple, readable. |
| TLF-ART-033 | j-rank-21 | Corrupt a City Official | CORRUPTION | 3 | SCHEMER | CAPO | failure | Cold Feet | An empty restaurant table. Two half-finished glasses of wine. The other chair pushed back. The official left. | Tense, stranded | Warm restaurant evening | Restaurant after departure | Empty table, two glasses | Medium | Amber + shadow | MEDIUM | job_corrupt_official_failure_v01.png | 2 | PENDING | The other person walked out. Quiet scene. |
| TLF-ART-034 | j-rank-22 | Orchestrate a Mid-Level Heist | HUSTLE | 3 | NEUTRAL | CAPO | base | The Blueprint | A dark apartment. A table with a hand-drawn map, a burner phone, and a takeout cup. A Hispanic man leans over it planning. | Focused, controlled | Single lamp interior | Dark apartment, planning scene | Figure over table with map | Medium interior, intimate | Deep charcoal + single warm lamp | HIGH | job_mid_heist_base_v01.png | 2 | PENDING | **Strong visual. Planning scene.** Contemporary apartment. |
| TLF-ART-035 | j-rank-22 | Orchestrate a Mid-Level Heist | HUSTLE | 3 | NEUTRAL | CAPO | success | Clean Hands | Four people walking away from a building in different directions, taken from across the street. No bags. Nothing visible. Mission complete. | Composed, dispersal | Overcast urban day | City street, dispersal | Four figures walking away | Wide street shot | Grey-cream street | HIGH | job_mid_heist_success_v01.png | 2 | PENDING | **Diverse crew, racially mixed, all walking away clean. Cinematic.** |
| TLF-ART-036 | j-rank-22 | Orchestrate a Mid-Level Heist | HUSTLE | 3 | NEUTRAL | CAPO | failure | Abort | A black duffel bag dropped on wet concrete. Running footsteps implied but no figure. Police lights approaching in background. | Panic, abandon | Red-blue police strobe | Wet urban back alley | Dropped bag on ground | Wide, bag in foreground | Asphalt grey + police strobe | HIGH | job_mid_heist_failure_v01.png | 2 | PENDING | Objects communicate. Police lights background only. |
| TLF-ART-037 | j-rank-22 | Orchestrate a Mid-Level Heist | HUSTLE | 3 | NEUTRAL | CAPO | busted | The Interview Room | Interrogation room. A Black man seated at the far end of a long table, hands folded. A single light above. Walls bare. Waiting. | Cold control, pressure | Overhead clinical white | Interrogation room | Figure seated, far end | Long table perspective | Institutional grey-white | HIGH | job_mid_heist_busted_v01.png | 3 | PENDING | Figure present but composed. No panic. |
| TLF-ART-038 | j-rank-22 | Orchestrate a Mid-Level Heist | HUSTLE | 3 | NEUTRAL | CAPO | jackpot | The Score | A bag open on a hotel room bed. More cash inside than expected. Much more. A figure stands beside it looking at their phone. Calm. | Rare elevated | Warm hotel interior | Hotel room with city view | Open bag + figure | Medium, bag foreground | Warm gold + cream | HIGH | job_mid_heist_jackpot_v01.png | 4 | PENDING — ENGINE NEEDED | Phase 4 after jackpot outcome added to Jobs engine. |
| TLF-ART-039 | j-rank-33 | Turn a Police Commander | CORRUPTION | 3.5 | SCHEMER | CONSIGLIERE | base | The Coffee | An upscale coffee shop. A man in plainclothes — clearly police bearing — sits across from an Asian woman in a business suit. She's doing the talking. He's listening. | Controlled, subtle | Soft café afternoon | Upscale café interior | Two figures across table | Medium wide | Warm cream + grey | HIGH | job_turn_police_base_v01.png | 2 | PENDING | **High-tier prestige job. Visible power dynamic. Diverse.** |
| TLF-ART-040 | j-rank-33 | Turn a Police Commander | CORRUPTION | 3.5 | SCHEMER | CONSIGLIERE | success | On the Payroll | A plain envelope slipped into the inside pocket of a police uniform jacket. Close up on the chest. No face. | Quiet, sealed | Dim office light | Private office | Envelope into jacket | Extreme close | Dark navy + cream envelope | HIGH | job_turn_police_success_v01.png | 2 | PENDING | Implication of transaction through single gesture. |
| TLF-ART-041 | j-rank-33 | Turn a Police Commander | CORRUPTION | 3.5 | SCHEMER | CONSIGLIERE | failure | He Walked | Empty café. Two cold coffees. A chair pushed sideways. Gone. | Cold, miscalculated | Cool café daylight | Empty café | Empty table, two cups | Medium | Cool grey-cream | HIGH | job_turn_police_failure_v01.png | 2 | PENDING | He said no. Implied through absence. |
| TLF-ART-042 | j-rank-44 | Run a Major Gambling Operation | GAMBLING | 4 | EARNER | UNDERBOSS | base | The Room | A private event space. Roulette tables, poker stations. Well-dressed guests in background — silhouettes. A Black man in a premium suit overlooks from a mezzanine level. | Commanding, elevated | Warm interior event light | Private casino venue | Figure on mezzanine, room below | Wide with depth | Deep amber + cream + casino green | HIGH | job_major_gambling_base_v01.png | 2 | PENDING | **High-tier commanding shot. Figure from above like ref image 4.** |
| TLF-ART-043 | j-rank-44 | Run a Major Gambling Operation | GAMBLING | 4 | EARNER | UNDERBOSS | success | The Count | A table with a money counting machine, cash stacks sorted and banded. A glass of whiskey beside it. 4 AM. | Satisfied, quiet | Warm post-event interior | Private event backroom | Cash machine + stacks | Close foreground | Deep amber + gold | HIGH | job_major_gambling_success_v01.png | 2 | PENDING | Post-event count. Earned. |
| TLF-ART-044 | j-rank-44 | Run a Major Gambling Operation | GAMBLING | 4 | EARNER | UNDERBOSS | failure | Raid | The room from the base image — now empty, overturned, chairs scattered. Blue police lights through the windows. | Disrupted, loss | Police strobe blue | Abandoned event space | Empty disrupted room | Wide | Cold blue-grey | HIGH | job_major_gambling_failure_v01.png | 2 | PENDING | Same environment, opposite mood. |
| TLF-ART-045 | j-rank-52 | Call a Commission Meeting | INFLUENCE | 5 | NEUTRAL | BOSS | base | The Table | A long mahogany conference table. Six chairs. Five are occupied — silhouettes of powerful men in suits. One chair at the head is dominant, its occupant partially visible. Crystal glasses and water. | Dominant, ceremonial | Warm interior prestige | Private boardroom | Long table with figures | Wide, perspective to head of table | Deep mahogany + ivory | EXTREME | job_commission_meeting_base_v01.png | 2 | PENDING | **Prestige cap image. Most powerful visual in the set. Diverse silhouettes.** |
| TLF-ART-046 | j-rank-52 | Call a Commission Meeting | INFLUENCE | 5 | BOSS | BOSS | success | Terms Agreed | Hands around a table — several pairs — in a handshake formation. Crystal glasses. The room around them reflected in the polished table. | Formal closure | Warm prestige | Boardroom table | Hands shaking across | Close foreground, hands dominant | Mahogany + cream | EXTREME | job_commission_meeting_success_v01.png | 2 | PENDING | Diverse hands visible in handshake. Rings, watches, different skin tones. |
| TLF-ART-047 | j-rank-52 | Call a Commission Meeting | INFLUENCE | 5 | BOSS | BOSS | failure | No Show | An empty boardroom. Five chairs — four pushed back, unfilled. Water glasses untouched. Someone didn't come. | Cold, undermined | Overcast boardroom day | Empty boardroom | Empty table, absent chairs | Wide | Cool grey-cream | EXTREME | job_commission_meeting_failure_v01.png | 2 | PENDING | Power challenged through absence. |
| TLF-ART-048 | j-rank-40 | Orchestrate a Multi-Crew Operation | HUSTLE | 4 | NEUTRAL | UNDERBOSS | base | The Map | A dark SUV interior. A woman in a sharp coat in the passenger seat holds a tablet showing a city map with three marked positions. Driver in silhouette. Night. | Operational, tense | Dashboard glow + street | SUV interior, moving | Figure with tablet | Interior medium close | Blue-black + screen glow | HIGH | job_multi_crew_op_base_v01.png | 3 | PENDING | **Female Underboss figure — diversity.** Contemporary SUV, tablet tech. |
| TLF-ART-049 | j-rank-40 | Orchestrate a Multi-Crew Operation | HUSTLE | 4 | NEUTRAL | UNDERBOSS | success | All Points Clear | Three separate phone screens side by side (artistic triptych of one image). Each showing a green checkmark text. | Calm, coordinated | Phone screen glow | Artistic composite | Three phone screens | Wide, triptych | Deep dark + screen glow | HIGH | job_multi_crew_op_success_v01.png | 3 | PENDING | Coordination complete. Modern. |
| TLF-ART-050 | j-rank-40 | Orchestrate a Multi-Crew Operation | HUSTLE | 4 | NEUTRAL | UNDERBOSS | failure | The Gap | An alley. One car at the wrong position. The other arrival point empty. Someone missed the mark. Night rain. | Panicked gap | Police strobe distance | Rain alley at night | Empty position + one car | Wide horizontal | Dark + distant strobe | HIGH | job_multi_crew_op_failure_v01.png | 3 | PENDING | Coordination failed. Implied through absence. |
| TLF-ART-051 | j-univ-22 | Grease a Cop | CORRUPTION | 1 | SCHEMER | none | base | The Hand-Off | A cash-folded bill slipped between two hands in a casual handshake on a sidewalk. One hand with a slight uniform cuff visible. Low angle. | Transactional, quiet | Overcast midday | Street sidewalk | Two hands in brief handshake | Extreme close | Cream-grey skin tones | LOW | job_grease_cop_base_v01.png | 3 | PENDING | Classic low-key corruption gesture. |
| TLF-ART-052 | j-univ-22 | Grease a Cop | CORRUPTION | 1 | SCHEMER | none | success | Green Light | A traffic barrier being lifted. Point of view from a car. A uniformed figure waves you through. | Clean passage | Daylight urban | Checkpoint or barrier | Barrier lifting, figure waving | POV, windshield frame | Grey road + green signal | LOW | job_grease_cop_success_v01.png | 3 | PENDING | Literal "green light" metaphor. |
| TLF-ART-053 | j-univ-22 | Grease a Cop | CORRUPTION | 1 | SCHEMER | none | failure | The Badge | A badge shown directly — a figure reaching inside a jacket. Not what you wanted. | Cold surprise | Street harsh overcast | Sidewalk | Badge reveal close | Close, centered | Navy + silver badge | LOW | job_grease_cop_failure_v01.png | 3 | PENDING | Wrong cop. Not on the payroll. |
| TLF-ART-054 | j-rank-51 | Order a Strategic Hit | SPECIAL | 5 | NEUTRAL | BOSS | base | The Directive | A private study at night. A man's profile — dark, calm — facing away from camera toward a city window. A phone call incoming. | Cold authority | City window night | Private study | Figure in profile, city behind | Medium, figure + city | Deep charcoal + city blue | EXTREME | job_strategic_hit_base_v01.png | 3 | PENDING | **Cap-level image. No violence shown. Command implied.** |
| TLF-ART-055 | j-rank-51 | Order a Strategic Hit | SPECIAL | 5 | NEUTRAL | BOSS | success | The Report | A phone screen with a short text: "Done." Dark interior. The phone face down after reading. | Cold finality | Dark interior ambient | Private room | Phone face-down | Close, horizontal | Deep shadow | EXTREME | job_strategic_hit_success_v01.png | 3 | PENDING | Minimalist. The message received. |
| TLF-ART-056 | j-rank-51 | Order a Strategic Hit | SPECIAL | 5 | NEUTRAL | BOSS | failure | The Silence | A phone screen — call going unanswered. Rings and rings. Night. | Dread, uncertainty | Dark | Private room | Unanswered call screen | Close | Dark + screen glow | EXTREME | job_strategic_hit_failure_v01.png | 3 | PENDING | The man didn't answer. Something went wrong. |
| TLF-ART-057 | j-univ-20 | Tail a Mark | INTEL | 1 | SCHEMER | none | base | The Shadow | An Asian man in a plain jacket sits in a café window with a coffee, watching someone across the street through the glass. Casual but alert. Notebook on the table. | Alert, patient | Café interior + street outside | Café with street view | Figure at window | Medium interior looking out | Warm café cream + grey street outside | LOW | job_tail_mark_base_v01.png | 3 | PENDING | Surveillance. Civilian environment. No drama. |
| TLF-ART-058 | j-univ-20 | Tail a Mark | INTEL | 1 | SCHEMER | none | success | Confirmed | A small notebook open. A name written, a time, an address. A blurry photograph of someone printed on a small page beside it. | Methodical, satisfying | Low interior lamp | Apartment table | Notebook with notes | Close still life | Warm cream + blue-black ink | LOW | job_tail_mark_success_v01.png | 3 | PENDING | Intelligence product. Clean, methodical. |
| TLF-ART-059 | j-univ-20 | Tail a Mark | INTEL | 1 | SCHEMER | none | failure | Made | A figure on the street ahead glancing back directly at the camera — they've noticed the tail. Alert, hostile. | Exposed | Overcast street | Urban sidewalk | Mark looking back | Medium, sudden | Grey street | LOW | job_tail_mark_failure_v01.png | 3 | PENDING | The mark looked back. Composition of eye contact — without making it aggressive. |
| TLF-ART-060 | j-rank-23 | Set Up a Money Laundering Front | ECONOMY | 3 | EARNER | CAPO | base | The Acquisition | A shuttered restaurant storefront. Daytime. A man in a coat looking through the window, arms crossed, evaluating. A real estate agent beside him with paperwork. | Calculated, professional | Overcast day | Empty commercial street | Two figures at storefront | Medium wide | Cool grey-green + cream | MEDIUM | job_laundering_front_base_v01.png | 3 | PENDING | Professional transaction. Both figures visible, diverse. |
| TLF-ART-061 | j-rank-23 | Set Up a Money Laundering Front | ECONOMY | 3 | EARNER | CAPO | success | Open for Business | The restaurant from before — now lit, sign up, through the window diners eating. Evening. A man walks past without stopping, satisfied. | Quiet satisfaction | Evening restaurant glow | Restaurant exterior, open | Lit restaurant, figure walking past | Medium wide | Warm amber-cream | MEDIUM | job_laundering_front_success_v01.png | 3 | PENDING | Transformation complete. Legitimate front operating. |
| TLF-ART-062 | j-rank-23 | Set Up a Money Laundering Front | ECONOMY | 3 | EARNER | CAPO | failure | Closed | The same restaurant — shuttered again. A notice on the door. Business didn't pass inspection. | Flat, loss | Cold grey day | Closed commercial front | Storefront with notice | Medium | Cold grey | MEDIUM | job_laundering_front_failure_v01.png | 3 | PENDING | Notice on door. Failed front. |
| TLF-ART-063 | j-rank-53 | Secure a Federal Contact | CORRUPTION | 5 | SCHEMER | BOSS | base | The Club | An exclusive members club bar. A Hispanic man in an impeccable suit alone at the bar, nursing a drink. Waiting. The bar empty of others. Dim amber. | Premeditated, controlled | Warm private bar amber | Upscale private members club | Figure at bar alone | Wide, environment dominant | Deep amber + wood + brass | EXTREME | job_federal_contact_base_v01.png | 3 | PENDING | **Elegance as camouflage. Premium environment.** |
| TLF-ART-064 | j-rank-53 | Secure a Federal Contact | CORRUPTION | 5 | SCHEMER | BOSS | success | The Asset | A business card on a mahogany bar. A DOJ insignia partially visible, name blurred. A glass ring from a drink left beside it. | Subtle triumph | Dim bar amber | Bar surface close | Business card close | Extreme close | Dark amber + cream card | EXTREME | job_federal_contact_success_v01.png | 3 | PENDING | One object tells the story. Understated power. |
| TLF-ART-065 | j-rank-53 | Secure a Federal Contact | CORRUPTION | 5 | SCHEMER | BOSS | failure | Wrong Room | The bar again — the seat now empty. A half-finished drink. The contact never arrived or recognized who you were and left. | Cold miscalculation | Dim bar ambient | Empty bar | Empty bar stool, unfinished drink | Medium | Deep amber + shadow | EXTREME | job_federal_contact_failure_v01.png | 3 | PENDING | The meeting didn't happen. |
| TLF-ART-066 | j-univ-25 | Dispose of Evidence | LOGISTICS | 1 | NEUTRAL | none | base | The Bag | A figure in dark gloves holds a black garbage bag beside a car in an underground parking lot. 3 AM. | Cold, methodical | Harsh parking lot fluorescent | Underground parking | Figure with bag | Medium, figure + bag | Harsh white + black | LOW | job_dispose_evidence_base_v01.png | 4 | PENDING | No drama. Routine operational task. |
| TLF-ART-067 | j-univ-25 | Dispose of Evidence | LOGISTICS | 1 | NEUTRAL | none | success | Gone | An empty incinerator vent. Smoke rising. Industrial setting. 4 AM light. | Clean, final | Pre-dawn industrial | Industrial incinerator room | Vent + smoke | Medium | Industrial grey + smoke | LOW | job_dispose_evidence_success_v01.png | 4 | PENDING | Evidence destroyed. Minimalist. |
| TLF-ART-068 | j-univ-25 | Dispose of Evidence | LOGISTICS | 1 | NEUTRAL | none | failure | Chain of Evidence | A sealed police evidence bag on a table. Someone got to it first. Institutional. | Cold dread | Institutional light | Police evidence room | Evidence bag on table | Close | Pale institutional + red seal | LOW | job_dispose_evidence_failure_v01.png | 4 | PENDING | Too late. Evidence is in police hands. |

---

## PHASE 5 — BATCH PLAN

### Wave 1 — Core Player-Loop Jobs (First Priority, 12 jobs × 3 variants = 36 images)

Focus: The jobs most players run most frequently, especially at low-mid tier. Maximum gameplay impact.

| # | Job | ID | Variants |
|---|---|---|---|
| 1 | Protection Rounds | j-univ-05 | base, success, failure |
| 2 | Collect a Street Debt | j-rank-02 | base, success, failure |
| 3 | Run a Numbers Spot | j-univ-02 | base, success, failure |
| 4 | Loan Shark Collection | j-univ-14 | base, success, failure |
| 5 | Oversee a Contraband Shipment | j-rank-15 | base, success, failure |
| 6 | Run a Card Game | j-rank-11 | base, success, failure |
| 7 | Move Hot Electronics | j-rank-03 | base, success, failure |
| 8 | Intimidate a Witness | j-rank-13 | base, success, failure |
| 9 | Corrupt a City Official | j-rank-21 | base, success, failure |
| 10 | Orchestrate a Mid-Level Heist | j-rank-22 | base, success, failure |
| 11 | Boost a Car | j-rank-05 | base, success, failure |
| 12 | Grease a Cop | j-univ-22 | base, success, failure |

### Wave 2 — Mid-Tier + Key Universal Jobs (15 jobs × 3 variants = 45 images)

| # | Job | ID | Variants |
|---|---|---|---|
| 13 | Turn a Police Commander | j-rank-33 | base, success, failure |
| 14 | Run a Major Gambling Operation | j-rank-44 | base, success, failure |
| 15 | Call a Commission Meeting | j-rank-52 | base, success, failure |
| 16 | Set Up a Money Laundering Front | j-rank-23 | base, success, failure |
| 17 | Orchestrate a Multi-Crew Operation | j-rank-40 | base, success, failure |
| 18 | Order a Strategic Hit | j-rank-51 | base, success, failure |
| 19 | Secure a Federal Contact | j-rank-53 | base, success, failure |
| 20 | Tail a Mark | j-univ-20 | base, success, failure |
| 21 | Extort a Restaurant | j-univ-06 | base, success, failure |
| 22 | Fence Stolen Jewelry | j-univ-10 | base, success, failure |
| 23 | Run a Sports Book | j-univ-01 | base, success, failure |
| 24 | Manage a Loan Book | j-rank-14 | base, success, failure |
| 25 | Run a Territory Racket | j-rank-20 | base, success, failure |
| 26 | Broker a Peace Between Families | j-rank-30 | base, success, failure |
| 27 | Dispose of Evidence | j-univ-25 | base, success, failure |

### Wave 3 — Remaining Jobs + Special/Rank-Specific (remaining ranked jobs, ~28 images)

All remaining ranked and universal jobs not covered in Waves 1-2. Priority on Boss-level jobs and Underboss jobs.

### Wave 4 — Busted, Injury, Jackpot Variants (priority jobs only, ~20 images)

Requires `JACKPOT` and `INJURY` outcome states added to Jobs engine first. Run only on the 10–12 highest-stakes jobs.

---

## PHASE 6 — NAMING CONVENTION

```
job_[slug]_[variant]_v[nn].png
```

Rules:
- `slug`: lowercase, underscores, max 4 words, derived from job name
- `variant`: base | success | failure | busted | jackpot | injury
- `vnn`: version number (v01, v02 etc.)
- All filenames are unique across the entire library
- Stored in: `/assets/jobs/[variant]/job_[slug]_[variant]_v01.png`

Directory structure:
```
/assets/jobs/
  base/
  success/
  failure/
  busted/
  jackpot/
  injury/
```

---

## GAMEPLAY INCONSISTENCIES FOUND

1. **No SMUGGLING/TRANSPORT job available below Tier 2.** New Associates have no entry point into contraband or transport work. All Tier 1 jobs are gambling, debt collection, fencing, or errands. Recommend adding one universal transport job (e.g., "Drive a Package Across Town").

2. **`Boost a Car` (j-rank-05) is a ranked job but conceptually should be universal** — car theft is an entry-level crime that players at all ranks should have access to. Recommend adding j-univ-26 "Boost a Vehicle" as a universal parallel.

3. **No visual distinction between universal and ranked jobs in the UI.** The art system should use this distinction: **ranked jobs should have wider/more cinematic framing**, universal jobs should feel more street-level and intimate.

4. **Jackpot and Injury outcomes exist in Missions/Contracts but not in Jobs engine.** The Jobs engine only has: SUCCESS, FAILURE, JAILED. Must be added before Wave 4 imagery is deployable.

5. **Art direction gap: image-to-job connection is not yet enforced in the codebase.** There is no `image_id` or `art_key` field on JobDefinition. Recommend adding `art_key: string` to `JobDefinition` interface before integrating images, so each job maps explicitly to its art asset.

---

## WAVE 1 RECOMMENDATION — Best 12 Jobs for First Production Run

Based on gameplay importance (how often players see/run these), visual clarity, and archetype spread:

| Priority | Job | Why This First |
|---|---|---|
| 1 | Protection Rounds | Most-run job in the game. Universally visible. Strong visual scene. |
| 2 | Loan Shark Collection | High frequency, all ranks, excellent visual variety. |
| 3 | Run a Numbers Spot | Core gambling entry. Instantly recognizable. |
| 4 | Oversee a Contraband Shipment | Port scene is a signature image for the game world. |
| 5 | Collect a Street Debt | The canonical Tier 1 ranked job. |
| 6 | Corrupt a City Official | Mid-tier anchor. Establishes the white-collar crime visual lane. |
| 7 | Orchestrate a Mid-Level Heist | Capo-tier set piece. Crew scene adds diversity naturally. |
| 8 | Run a Card Game | Gambling backbone. Elegant back-room scene. |
| 9 | Boost a Car | Strong action-scene visual with modern car and garage setting. |
| 10 | Move Hot Electronics | Fencing/logistics visual lane established early. |
| 11 | Intimidate a Witness | Enforcement visual lane. Strong location contrast. |
| 12 | Grease a Cop | Corruption entry. Minimal scene, high symbolic clarity. |

---

*This manifest is the source of truth for all job image production.*
*No images should be generated without a corresponding manifest row.*
*Update status field as each image moves through production.*
