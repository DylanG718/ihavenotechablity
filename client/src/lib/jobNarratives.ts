/**
 * jobNarratives.ts — Narrative content registry for all jobs.
 *
 * CONTENT MODEL (per job):
 *   summary      — 1-line card hook. Target: ≤60 chars.
 *   flavor       — 2-3 sentence job brief. Target: ≤180 chars.
 *   success      — Pool of 3-4 outcome strings. Target: ≤90 chars each.
 *   failure      — Pool of 3-4 outcome strings. Target: ≤90 chars each.
 *   busted        — Pool of 2-3 outcome strings (jail-risk jobs only).
 *   art_key      — Slug matching the generated image filename.
 *   has_busted_image — Whether a busted image variant was generated.
 *
 * TONE RULES:
 *   - Modern, premium, atmospheric. Not campy or cliché.
 *   - Outcomes are specific, not generic ("the contact got tipped off", not "failed").
 *   - Success feels controlled, sharp. Failure feels costly. Busted feels official.
 *   - Never use the word "job" inside the narrative text itself.
 *   - Keep sentences short. Every word earns its place.
 *
 * STATUS KEY:
 *   WAVE_1 — image generated, narrative written, deployed
 *   WAVE_2 — narrative written, image generation queued
 *   PLACEHOLDER — stub content pending final copy pass
 */

import type { JobNarrative } from '../../../shared/jobs';

type NarrativeEntry = Omit<JobNarrative, 'job_id'>;

function pick(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getJobNarrative(jobId: string): NarrativeEntry | null {
  return JOB_NARRATIVES[jobId] ?? null;
}

export function pickOutcome(pool: { narratives: string[] }): string {
  return pick(pool.narratives);
}

// ─────────────────────────────────────────────────────────────────────
// WAVE 1 — Image generated · Narrative complete
// ─────────────────────────────────────────────────────────────────────

const WAVE_1: Record<string, NarrativeEntry> = {

  // ── PROTECTION ROUNDS (j-univ-05) ────────────────────────────────
  'j-univ-05': {
    art_key: 'protection_rounds',
    has_busted_image: false,
    summary: 'Collect tribute from the businesses on your block.',
    flavor: 'Every store on this strip pays for the privilege of operating without problems. Walk the route, collect the envelopes, and remind anyone slow to pay that the neighborhood has expectations.',
    success: {
      narratives: [
        'Every envelope came in without a word. The block understands its obligations.',
        'Clean collection. No raised voices, no empty hands. Back before midnight.',
        'Three stops, three payments. The route runs itself when respect is established.',
        'Nobody tested you tonight. The money moved quietly and that\'s exactly how it should.',
      ],
    },
    failure: {
      narratives: [
        'The laundromat owner had a cop car parked out front all evening. You walked past.',
        'Your contact tipped off two of the shops. Half the block had their shutters down.',
        'The Korean grocery has new ownership. They didn\'t know the arrangement — and they weren\'t afraid.',
        'Someone called it in. Blue-and-whites were rolling the block within twenty minutes.',
      ],
    },
  },

  // ── COLLECT A STREET DEBT (j-rank-02) ────────────────────────────
  'j-rank-02': {
    art_key: 'collect_debt',
    has_busted_image: false,
    summary: 'Someone is past due. Go remind them.',
    flavor: 'A borrower is eleven days overdue on $400 in interest. The Capo wants his money and a clear signal that delinquency has consequences. Show up calm, make clear what\'s at stake, and don\'t leave without the cash.',
    success: {
      narratives: [
        'He had the cash in an envelope before you knocked. Word had already reached him.',
        'One quiet conversation. He counted it out on the kitchen table without being asked twice.',
        'The full amount plus three days\' interest as an apology. Fear is productive.',
        'He was nervous but he paid. Agreed to be on time going forward. Message received.',
      ],
    },
    failure: {
      narratives: [
        'The apartment was cleared out. He\'s gone — forwarding address, nothing.',
        'He answered the door with a cousin and two friends standing behind him. You assessed the math.',
        'His landlord said he hasn\'t been home in four days. Somebody warned him you were coming.',
        'He\'s on a payment plan with a different crew now. The territory got complicated while you weren\'t looking.',
      ],
    },
  },

  // ── RUN A NUMBERS SPOT (j-univ-02) ───────────────────────────────
  'j-univ-02': {
    art_key: 'numbers_spot',
    has_busted_image: false,
    summary: 'Manage the afternoon book on your corner.',
    flavor: 'Take over the corner operation for the afternoon shift. Collect bets, pay out the small winners, track the slips, and deliver the day\'s net to the pickup before dusk. Reliable work for reliable earners.',
    success: {
      narratives: [
        'Seventy-three bets in four hours. Net came out clean. They\'re calling it a good day.',
        'The book ran itself. Light winners, heavy losers, and the house kept its percentage.',
        'Numbers spot moved $2,200 before you closed down the corner for the night.',
        'Not a single beef. Regulars, good numbers, clean handoff at the end of the afternoon.',
      ],
    },
    failure: {
      narratives: [
        'Plainclothes detective walked the block twice. You cleared out before he finished his coffee.',
        'A winner claimed he hit for three times what the slip says. The argument drew attention.',
        'The float came up $140 short and nobody can account for it. You eat the difference.',
        'Your pickup didn\'t show. You held the book for six hours in the cold and then had to walk it home.',
      ],
    },
  },

  // ── LOAN SHARK COLLECTION (j-univ-14) ────────────────────────────
  'j-univ-14': {
    art_key: 'loansharking',
    has_busted_image: false,
    summary: 'Walk your accounts. Collect what\'s owed.',
    flavor: 'Twelve active borrowers. Most are current — a few are one call away from becoming a problem. Today you make the rounds, accept payments, issue extensions where warranted, and note who you\'ll need to visit with someone else next time.',
    success: {
      narratives: [
        'Ten of twelve accounts paid. You flagged the other two for escalation and kept moving.',
        'Collected in full. One account offered extra on top to buy himself another week. You took both.',
        'Clean sweep. Every borrower came through within the payment window you gave them.',
        'Strong collection day. The book is healthy and every face you met looked appropriately worried.',
      ],
    },
    failure: {
      narratives: [
        'Three accounts are relocating. Two gave no notice. One left a forwarding address in another city.',
        'Your biggest borrower filed bankruptcy. The paperwork makes it a civil matter. You\'re behind him in line.',
        'Somebody\'s been telling your accounts that collections are suspended. The rumor got ahead of you.',
        'Two of the stops refused. Said they\'re with another outfit now. You\'ll need backup for the callback.',
      ],
    },
  },

  // ── OVERSEE CONTRABAND SHIPMENT (j-rank-15) ──────────────────────
  'j-rank-15': {
    art_key: 'contraband_shipment',
    has_busted_image: true,
    summary: 'Oversee the offload at the port. Nothing moves without you.',
    flavor: 'A container arrived from Rotterdam three days early. The dock foreman is on the payroll, the truck is standing by, but the operation needs a point of authority on-site. You\'re the one who makes the call if something goes wrong.',
    success: {
      narratives: [
        'The offload took forty minutes. Crew was professional. Truck was gone before the shift change.',
        'Clean. The foreman didn\'t ask questions, the driver didn\'t look in the container, and customs missed the manifest.',
        'Smooth from dock to door. You got the confirmation text on the highway home.',
        'Everything off before 2 AM and the next shift had no idea it had ever been there.',
      ],
    },
    failure: {
      narratives: [
        'Coast guard ran a surprise inspection on the adjacent berth. The crew scattered before the offload started.',
        'The foreman\'s shift ended early. His replacement wasn\'t on the payroll and had questions.',
        'Manifest discrepancy flagged during the automated scan. The port locked down the container.',
        'One of the crew members was a federal informant. You found out two days later and too late.',
      ],
    },
    busted: {
      narratives: [
        'Port Authority pulled the manifest thread. An hour later you were in an interview room explaining your night.',
        'Federal agents were already watching the container. You walked into a surveillance operation.',
        'The truck driver cooperated in exchange for immunity. You were the only name he could give them.',
      ],
    },
  },

  // ── RUN A CARD GAME (j-rank-11) ──────────────────────────────────
  'j-rank-11': {
    art_key: 'card_game',
    has_busted_image: false,
    summary: 'Run the private game above Sal\'s. House takes 10%.',
    flavor: 'Eight players, $500 minimum buy-in, private room above the restaurant. Your job is floor management — keep the game running, keep the players comfortable, collect the house percentage on every pot, and make sure nobody leaves angry enough to make a phone call.',
    success: {
      narratives: [
        'Seven hours, eight players, and the house walked out with $1,800 before the table went cold.',
        'Nobody won too much, nobody lost too badly. The house percentage landed exactly right.',
        'Clean game. Two players left up, four left even, two left quietly. Nobody made a scene.',
        'The big spender stayed until 3 AM and tipped the house an extra 5%. Good night.',
      ],
    },
    failure: {
      narratives: [
        'A player accused the dealer of running a stacked deck. The room cleared before you could settle it.',
        'Someone brought a friend who brought a wire. The game broke up in under four minutes.',
        'Two of your regulars got into it over a hand. The noise carried into the restaurant downstairs.',
        'Three players no-showed and the float didn\'t cover the house\'s minimum. You ate the night.',
      ],
    },
  },

  // ── MOVE HOT ELECTRONICS (j-rank-03) ─────────────────────────────
  'j-rank-03': {
    art_key: 'hot_electronics',
    has_busted_image: false,
    summary: 'Move the stolen merchandise before the serial numbers get flagged.',
    flavor: 'A hijacked trailer left a thousand units of laptops and tablets looking for a new owner. You have a buyer, a truck, and a four-hour window before the warehouse security logs get reviewed. Get the goods moved and the payment delivered.',
    success: {
      narratives: [
        'The buyer didn\'t count every unit. Payment hit in cash before the truck was back on the highway.',
        'Smooth transfer. Everything moved in two runs and nobody asked where it came from.',
        'The fence took the lot at 60 cents on the dollar without negotiating. He knows quality when he sees it.',
        'Clean offload. Truck was empty and wiped down by midnight. Proceeds delivered by morning.',
      ],
    },
    failure: {
      narratives: [
        'The buyer backed out at the last minute. Said the serial number situation made him nervous.',
        'The truck broke down two blocks from the warehouse. You had to call it off and leave it.',
        'A neighbor recognized the logo on the boxes and wrote down the plate number. Too much exposure.',
        'Your fence got hit with a search warrant two hours before the handoff. The merchandise is in a holding unit now.',
      ],
    },
  },

  // ── BOOST A CAR (j-rank-05) ──────────────────────────────────────
  'j-rank-05': {
    art_key: 'boost_car',
    has_busted_image: true,
    summary: 'The chop shop needs inventory. You\'re procurement.',
    flavor: 'A specific make and model — grey sedan, third-generation. The chop shop has a buyer who wants it clean and quick. Find one in the parking structure off Harbor, get it moving, and deliver it across town before the plates hit the system.',
    success: {
      narratives: [
        'Twenty-two minutes from the garage to the chop shop. Clean, no plates on the camera.',
        'Car moved without a scratch. The mechanic had the VIN off before you were back on the highway.',
        'In and out in under fifteen minutes. Payment in an envelope, no questions, no receipt.',
        'Delivered before the owner\'s parking ticket even expired. The chop shop was satisfied.',
      ],
    },
    failure: {
      narratives: [
        'The garage had a new camera system installed yesterday. You spotted it on the way in and walked.',
        'Wrong model — the buyer wanted the V6, not the V4. Rejected at the drop.',
        'The LoJack activated three blocks from the garage. You abandoned the car and walked.',
        'Off-duty cop in the elevator recognized you from a previous incident. You didn\'t get to the car.',
      ],
    },
    busted: {
      narratives: [
        'The GPS tracker had a secondary unit they didn\'t disclose. Units surrounded you on the off-ramp.',
        'An undercover was running surveillance on the garage. He had your plate number before you reached the exit.',
        'You were halfway across town when the registration ping hit the system. They were waiting at the chop shop.',
      ],
    },
  },

  // ── INTIMIDATE A WITNESS (j-rank-13) ─────────────────────────────
  'j-rank-13': {
    art_key: 'intimidate_witness',
    has_busted_image: true,
    summary: 'A witness is cooperating. Make sure they rethink that decision.',
    flavor: 'An auto body worker near the Moretti incident filed a statement with police last week. No threats, no physical contact — just a quiet conversation about the wisdom of certainty, and whether his memory is as reliable as he thinks it is.',
    success: {
      narratives: [
        'He called his attorney and withdrew the statement. Cited uncertainty about what he actually saw.',
        'He was at work when you left. By end of day, his lawyer had filed a recantation.',
        'The detective called it a dead end. The witness had nothing reliable to offer after your visit.',
        'His deposition was cancelled. He developed a significant uncertainty about the timeline.',
      ],
    },
    failure: {
      narratives: [
        'He had a recording device. He\'d been coached by the DA\'s office to expect a visit.',
        'Two detectives were parked across from his shop. You did one pass and kept moving.',
        'He called your bluff. Said he\'d already given a recorded statement and it was too late to matter.',
        'His wife was home. With her there, he had too much to prove. The conversation ended before it started.',
      ],
    },
    busted: {
      narratives: [
        'It was a sting. The "witness" was an undercover and the conversation was going to a recorder.',
        'Police were watching his apartment. They took you in on approach for questioning.',
        'He reported the visit immediately. Detectives pulled CCTV from the block before you were home.',
      ],
    },
  },

  // ── CORRUPT A CITY OFFICIAL (j-rank-21) ──────────────────────────
  'j-rank-21': {
    art_key: 'corrupt_official',
    has_busted_image: false,
    summary: 'A dinner meeting. A folder. An understanding.',
    flavor: 'The zoning board is reviewing three blocks that matter to the family\'s expansion plan. The deputy commissioner has dinner reservations at a restaurant he prefers. You\'ll be there too. The folder stays under the tablecloth until the moment is right.',
    success: {
      narratives: [
        'The stamp was on the documents by Thursday morning. He\'s been reached. He understands the arrangement.',
        'He was professional about it. Barely looked at the folder. By dessert, the matter was settled.',
        'Permits cleared without objection. The commissioner\'s office issued the approval in forty-eight hours.',
        'Clean exchange. He\'s on retainer now, whether he knows it or not.',
      ],
    },
    failure: {
      narratives: [
        'He pushed the envelope back across the table. Said this wasn\'t something he could do. And he meant it.',
        'His chief of staff showed up unexpectedly. The dinner became a three-person conversation with nothing resolved.',
        'He was already being watched by an internal affairs unit. He left without touching the folder.',
        'The approach was too direct. He made his excuses and left before the main course. You\'ve lost the window.',
      ],
    },
  },

  // ── ORCHESTRATE A MID-LEVEL HEIST (j-rank-22) ────────────────────
  'j-rank-22': {
    art_key: 'mid_heist',
    has_busted_image: true,
    summary: 'Three entry points, four crew, one window.',
    flavor: 'A commercial property management firm keeps their weekly float in a safe on the third floor. You have the floor plan, two reliable crew members, and a twenty-minute window after the cleaning crew leaves. The plan has been tested. Execute it.',
    success: {
      narratives: [
        'Seventeen minutes door to door. Everyone dispersed clean and was three miles away before it registered.',
        'The safe was lighter than expected but the crew was professional and the exit was clean.',
        'No cameras caught anything useful. The crew split up at the corner and disappeared into the city.',
        'Clean operation. By the time the police filed the report, everyone was home and accounted for.',
      ],
    },
    failure: {
      narratives: [
        'The cleaning crew ran forty minutes late. The window collapsed before you reached the third floor.',
        'One crew member froze at the entry point. The delay burned the window and you called the abort.',
        'The security rotation had changed. There was a guard in the building who wasn\'t supposed to be there.',
        'The bag was dropped on the exit. You ran with what you could carry. The split didn\'t cover the cost.',
      ],
    },
    busted: {
      narratives: [
        'A silent alarm triggered on the stairwell door. Units arrived while you were still inside.',
        'Someone on the crew talked. By the time you hit the exit, detectives were already waiting.',
        'CCTV outside the building caught two of the crew on approach. They gave up the rest.',
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────
// WAVE 2 — Narrative complete · Image generation in queue
// ─────────────────────────────────────────────────────────────────────

const WAVE_2: Record<string, NarrativeEntry> = {

  // ── TURN A POLICE COMMANDER (j-rank-33) ──────────────────────────
  'j-rank-33': {
    art_key: 'turn_police',
    has_busted_image: false,
    summary: 'Bring a senior commander onto the payroll.',
    flavor: 'The Commander of the 12th District has expensive tastes and a pension that doesn\'t cover them. You\'ve arranged a quiet meeting at a private club. The offer is reasonable, the terms are clear, and he already suspects why you called.',
    success: {
      narratives: [
        'He took the envelope without looking inside it. He knows what it means and he accepted the terms.',
        'He\'s on the payroll. Operational intelligence starts flowing next week.',
        'The commander was more pragmatic than expected. He\'s been waiting for the right introduction for years.',
        'The arrangement is formalized. His first favor is already in motion.',
      ],
    },
    failure: {
      narratives: [
        'He was wearing a wire. You spotted the earpiece and walked out before coffee arrived.',
        'He refused — not out of principle, but because he already works for someone else.',
        'Internal affairs had flagged him for a financial review two weeks ago. He\'s untouchable right now.',
        'He was interested, then got a call mid-meeting and left immediately. The window is closed.',
      ],
    },
  },

  // ── RUN A MAJOR GAMBLING OPERATION (j-rank-44) ───────────────────
  'j-rank-44': {
    art_key: 'major_gambling',
    has_busted_image: false,
    summary: 'Run the monthly private event. Capacity crowd, high stakes.',
    flavor: 'Four hundred square feet, eight tables, two hundred guests who know how to behave and what not to mention. You manage the floor, the float, and the personnel. The house percentage on a night like this funds three months of operations.',
    success: {
      narratives: [
        'Net came in at $86,000. The house ran clean and every complaint was handled before it became a scene.',
        'Twelve hours, four tables, no incidents. The float balanced to the dollar at close.',
        'Biggest single-night take of the quarter. Every player left satisfied and will be back.',
        'The event ran like clockwork. Staff was professional, guests were discreet. Already booking the next one.',
      ],
    },
    failure: {
      narratives: [
        'A player had a medical incident. The ambulance call brought uniforms. You cleared the room in four minutes but the night was done.',
        'An uninvited guest arrived claiming to represent a rival. The tension killed the room.',
        'The floor manager miscounted the float. You spent three hours finding a discrepancy you couldn\'t close.',
        'A local news crew was filming in the building for an unrelated story. Too much foot traffic to continue.',
      ],
    },
  },

  // ── CALL A COMMISSION MEETING (j-rank-52) ────────────────────────
  'j-rank-52': {
    art_key: 'commission_meeting',
    has_busted_image: false,
    summary: 'Convene the heads. Set the terms. Lead the room.',
    flavor: 'Five families, one table, one agenda. You called the meeting to resolve the waterfront dispute before it becomes a war nobody can afford. Leadership means controlling the room before you enter it.',
    success: {
      narratives: [
        'Terms agreed. The waterfront gets divided along the lines you proposed. No dissent at the table.',
        'All five signed off. The agreement holds for ninety days minimum and resets the current tensions.',
        'The room recognized your authority before you spoke. By the end, the dispute was settled and credited to you.',
        'Commission meeting closed with a consensus. Everyone left with something. Nobody left angry.',
      ],
    },
    failure: {
      narratives: [
        'Two of the five didn\'t show. A meeting with three families sets a precedent you can\'t afford.',
        'The Rizzo faction walked out over the waterfront terms. The dispute remains open.',
        'Someone leaked the agenda before the meeting. Three families arrived with counter-proposals.',
        'The neutral party lost their nerve. Without their presence, no agreement carries weight.',
      ],
    },
  },

  // ── SET UP A MONEY LAUNDERING FRONT (j-rank-23) ──────────────────
  'j-rank-23': {
    art_key: 'laundering_front',
    has_busted_image: false,
    summary: 'Turn a shuttered restaurant into a working legitimate front.',
    flavor: 'A vacant commercial space on Whitmore Street is under a lease the family acquired through a shell. Turn it into an operating restaurant with clean books, a full liquor license, and invoices that never raise questions at an audit.',
    success: {
      narratives: [
        'Open for business and properly permitted. First week of "revenue" already posted to the books.',
        'The inspector signed off without a note. The front is operational and generating clean receipts.',
        'Staff hired, license secured, kitchen running. The money has somewhere to go now.',
        'The operation is live. From the outside, it\'s just a restaurant. From the inside, it\'s a balance sheet.',
      ],
    },
    failure: {
      narratives: [
        'The liquor license was flagged for a background review on the ownership structure. The timeline collapsed.',
        'A former employee of the old space recognized the shell company name and asked questions.',
        'The city inspector found three code violations. The opening is delayed by sixty days minimum.',
        'The accountant you hired turned out to have a prior fraud conviction. Everything needs to be rebuilt.',
      ],
    },
  },

  // ── ORCHESTRATE A MULTI-CREW OPERATION (j-rank-40) ───────────────
  'j-rank-40': {
    art_key: 'multi_crew_op',
    has_busted_image: false,
    summary: 'Coordinate three simultaneous crews across the city.',
    flavor: 'Three separate operations, same night, same two-hour window. You\'re the point of authority for all three. If any one of them breaks, your call ends it for all of them. Communication is everything and everything depends on timing.',
    success: {
      narratives: [
        'All three checked in within ninety seconds of each other. Clean across the board.',
        'The coordination held. Every crew hit their mark and cleared without incident.',
        'Three operations, three successful outcomes, zero contact between units. Exactly as designed.',
        'The timing was precise. All three were home before the first radio call went out.',
      ],
    },
    failure: {
      narratives: [
        'The third crew missed their window by eight minutes. The delay cascaded and you called the abort.',
        'One crew went dark at the wrong moment. Without confirmation, you shut down all three.',
        'Communications interference meant two of the three were operating blind at the critical point.',
        'A crew captain made an unauthorized decision. The ripple effect compromised the other two.',
      ],
    },
  },

  // ── ORDER A STRATEGIC HIT (j-rank-51) ────────────────────────────
  'j-rank-51': {
    art_key: 'strategic_hit',
    has_busted_image: false,
    summary: 'Make the call. Someone doesn\'t get to continue.',
    flavor: 'The Ferrante family\'s logistics director has been a problem for eighteen months. You\'ve exhausted the diplomatic options. This is the directive — quiet, clean, and without fingerprints that reach back to this side of the city.',
    success: {
      narratives: [
        'The matter was resolved before morning. No noise, no witnesses, no complications.',
        'The operative confirmed at 3 AM. By sunrise, it was already being treated as an accident.',
        'Clean execution. The target\'s organization won\'t know what changed until they start feeling the operational gaps.',
        'One call sent, one confirmation received. The problem is resolved and the paperwork trail ends with someone else.',
      ],
    },
    failure: {
      narratives: [
        'The operative lost the target. He changed his route without warning and the window closed.',
        'The target was tipped off. He\'s in protective custody now and this gets more complicated.',
        'A secondary witness complicated the scene. The operative aborted to preserve the clean profile.',
        'The timing slipped. The target was with a police escort at the critical moment. Not tonight.',
      ],
    },
  },

  // ── SECURE A FEDERAL CONTACT (j-rank-53) ─────────────────────────
  'j-rank-53': {
    art_key: 'federal_contact',
    has_busted_image: false,
    summary: 'Cultivate a relationship inside the federal apparatus.',
    flavor: 'A DOJ analyst with access to case files and investigation timelines has been cultivated for six months. This meeting at a private club is the conversion — the moment where an acquaintance becomes an asset. The offer has been calibrated precisely.',
    success: {
      narratives: [
        'He accepted. The arrangement is active. First intelligence delivery expected within two weeks.',
        'The card was left on the table and he picked it up. He knows what it means and he\'s in.',
        'Federal asset secured. Operational intelligence on active investigations starts flowing immediately.',
        'He committed before dessert. Six months of cultivation just paid off.',
      ],
    },
    failure: {
      narratives: [
        'He was more principled than his file suggested. He declined politely and left without a scene.',
        'His supervisor had assigned him a handler two days before the meeting. He was compromised before you arrived.',
        'The offer wasn\'t enough. He wants something specific that will take months to arrange.',
        'He got a reassignment notice that morning. His access level changed and the leverage evaporated.',
      ],
    },
  },

  // ── TAIL A MARK (j-univ-20) ───────────────────────────────────────
  'j-univ-20': {
    art_key: 'tail_mark',
    has_busted_image: false,
    summary: 'Follow the target. Don\'t be seen. Build the pattern.',
    flavor: 'A mid-level manager at a rival operation keeps a schedule that someone is very interested in. You spend the afternoon at a café window learning his routes, his contacts, and the times he\'s predictably alone. No confrontation — just intelligence.',
    success: {
      narratives: [
        'Three hours of clean surveillance. Route documented, contacts photographed, schedule confirmed.',
        'He never looked up once. You have everything needed to build the full picture.',
        'The target is predictable. You have his habits, his preferred routes, and two possible leverage points.',
        'Solid intelligence package. The Consigliere will know exactly what he wants to know by morning.',
      ],
    },
    failure: {
      narratives: [
        'He made you on the second pass. Changed direction three times before ducking into a building.',
        'He cancelled his usual route entirely — someone already warned him he was being watched.',
        'The target moved in a group all afternoon. No clean opportunity to observe his independent pattern.',
        'Your cover at the café was compromised when someone recognized you and called over to say hello.',
      ],
    },
  },

  // ── EXTORT A RESTAURANT (j-univ-06) ──────────────────────────────
  'j-univ-06': {
    art_key: 'extort_restaurant',
    has_busted_image: false,
    summary: 'The restaurant has been operating without contributing. Fix that.',
    flavor: 'A Vietnamese restaurant on the corner of Fifth and Marlowe has been in business for three years without a penny going to the neighborhood\'s security arrangement. Tonight you explain the arrangement and return with a commitment and a first payment.',
    success: {
      narratives: [
        'He understood immediately. Shook your hand and handed over the first month without negotiation.',
        'The owner was not surprised. He\'s been waiting for this conversation. Agreement made.',
        'Cooperative from the first word. He has the cash in the register and the schedule worked out.',
        'Smooth conversation. He pays monthly, asks no questions, and keeps the arrangement private.',
      ],
    },
    failure: {
      narratives: [
        'He already has an arrangement with the Marciano crew. You\'re stepping on covered territory.',
        'His brother-in-law is a detective. He said it calmly and you assessed your next move.',
        'He refused. Said the city inspectors would be more of a problem than you. He wasn\'t entirely wrong.',
        'The restaurant had a private dining event in back. Twenty people made the conversation impossible.',
      ],
    },
  },

  // ── FENCE STOLEN JEWELRY (j-univ-10) ─────────────────────────────
  'j-univ-10': {
    art_key: 'fence_jewelry',
    has_busted_image: false,
    summary: 'Move three pieces through the diamond district quietly.',
    flavor: 'A weekend heist brought in pieces that can\'t be moved locally — the designs are too identifiable. Your contact in the diamond district will buy them clean if you bring proper provenance documentation and don\'t push on the price.',
    success: {
      narratives: [
        'He authenticated the pieces, agreed to price, and handed over the envelope on the spot.',
        'Clean transaction. He didn\'t ask where they came from and you didn\'t volunteer it.',
        'All three pieces moved at 60 cents on the dollar. The fence was professional and fast.',
        'Sale completed in twelve minutes. He\'ll have them out of the country by Thursday.',
      ],
    },
    failure: {
      narratives: [
        'He recognized one of the pieces from a police circular. He won\'t touch it and neither should you.',
        'The provenance documents weren\'t convincing enough. He said he\'d need two weeks to verify before buying.',
        'His buyer backed out of the pre-arrangement. Without a downstream buyer, he can\'t make the purchase.',
        'The piece had a hidden RFID chip that activated when he ran his scanner. He handed it back without a word.',
      ],
    },
  },

  // ── RUN A SPORTS BOOK (j-univ-01) ─────────────────────────────────
  'j-univ-01': {
    art_key: 'sports_book',
    has_busted_image: false,
    summary: 'Run the weekly line and manage the bets.',
    flavor: 'Thursday through Sunday is sports book season. You run the line, manage incoming action, pay out the winners, and keep the book balanced enough that a bad weekend doesn\'t become a problem for anyone else.',
    success: {
      narratives: [
        'The book ran $14,000 in action over four days. Net came out $3,200 on the right side.',
        'Heavy favorites covered. Light book week, clean close. Nothing to flag.',
        'Good spread of action across three games. The house stayed ahead throughout.',
        'Saturday\'s big game went the way you needed. The week closed profitable.',
      ],
    },
    failure: {
      narratives: [
        'Three heavy underdogs covered in the same weekend. The book took a significant hit.',
        'A bettor who was supposed to be banned got action through a proxy. The dispute cost time and money.',
        'A runner missed a collection and two accounts went dark. The book is exposed heading into next week.',
        'Heavy one-sided action on a single game forced you to lay off bets. The offset didn\'t come through.',
      ],
    },
  },

  // ── MANAGE A LOAN BOOK (j-rank-14) ───────────────────────────────
  'j-rank-14': {
    art_key: 'manage_loan_book',
    has_busted_image: false,
    summary: 'Take over the 12-account book. Keep it healthy.',
    flavor: 'You\'ve been handed twelve active accounts — a mix of business borrowers and individuals who needed money faster than a bank could move. Your job is to maintain the accounts, issue extensions where warranted, and flag anything that looks like it\'s going sideways.',
    success: {
      narratives: [
        'Twelve accounts active, eleven current. The one delinquent account has a credible plan.',
        'Clean week. All collections came in on schedule and two accounts paid ahead.',
        'Book is healthy. One extension granted, two accounts flagged for review. The interest keeps compounding.',
        'Full collection week with no escalations. The book is performing above its historical average.',
      ],
    },
    failure: {
      narratives: [
        'Three accounts missed in the same week. The pattern suggests someone is coordinating the delinquency.',
        'Two of your largest borrowers are partners in a business that just went bankrupt. The exposure is significant.',
        'A borrower filed a complaint with the DA\'s consumer protection unit. Everything needs to pause.',
        'The accounts were in worse shape than the handoff documentation suggested. You inherited a problem.',
      ],
    },
  },

  // ── RUN A TERRITORY RACKET (j-rank-20) ────────────────────────────
  'j-rank-20': {
    art_key: 'territory_racket',
    has_busted_image: false,
    summary: 'Your crew controls twelve blocks. Make them pay.',
    flavor: 'As a Capo, your territory produces revenue every week without exception. Collection day means route management, account disputes, new registration of businesses that opened without arrangement, and making sure your crew\'s take flows cleanly upward.',
    success: {
      narratives: [
        'Full collection on the primary route. Two new accounts registered. Revenue up 8% from last month.',
        'Territory ran clean. No disputes, no skimming, no complaints from upstairs about the numbers.',
        'Strong week. Your crew is running efficiently and the revenue is coming in on schedule.',
        'Route completed. Every account paid and two delinquent ones settled with a clear arrangement going forward.',
      ],
    },
    failure: {
      narratives: [
        'A rival crew has been working your secondary route. Three accounts are paying them instead of you.',
        'Two of your soldiers are skimming. The discrepancy is small enough that they thought you wouldn\'t notice.',
        'A local politician is making noise about the neighborhood. Your accounts are nervous and pulling back.',
        'Heat from a recent incident has made your businesses unresponsive. The route earned half of what it should.',
      ],
    },
  },

  // ── BROKER A PEACE BETWEEN FAMILIES (j-rank-30) ──────────────────
  'j-rank-30': {
    art_key: 'broker_peace',
    has_busted_image: false,
    summary: 'Two families are close to open conflict. You\'re the solution.',
    flavor: 'The Rizzo and Marciano crews have been at each other for three weeks over a disputed contract. The Don asked you to resolve it before it becomes a war nobody can afford. You have leverage with both sides and a very small window to use it.',
    success: {
      narratives: [
        'Both sides agreed to a ninety-day truce and a shared revenue arrangement on the disputed territory.',
        'The dispute is settled. Both capos shook hands and you have the credibility of having brokered it.',
        'Ceasefire established. The underlying contract will be arbitrated at the commission level next month.',
        'Both families walked away with something. The peace will hold for at least sixty days.',
      ],
    },
    failure: {
      narratives: [
        'The Rizzo side refused to negotiate through you. They want to deal directly with the Don or not at all.',
        'Your proposal was rejected by both sides as insufficient. The dispute escalated the following morning.',
        'New information surfaced about the original contract dispute. The context changed and your leverage evaporated.',
        'The Marciano Capo was replaced overnight. The new point of contact doesn\'t recognize the previous terms.',
      ],
    },
  },

  // ── DISPOSE OF EVIDENCE (j-univ-25) ──────────────────────────────
  'j-univ-25': {
    art_key: 'dispose_evidence',
    has_busted_image: false,
    summary: 'What\'s left behind can\'t be left behind.',
    flavor: 'A recent incident left materials that connect people who cannot be connected. You have a four-hour window and two reliable contacts who know how to handle what needs handling without asking what it was or why it matters.',
    success: {
      narratives: [
        'Materials are gone. The incinerator ran clean and nobody asked questions about the after-hours access.',
        'Handled completely. The chain of custody ends with you and it ends tonight.',
        'Clean disposal. The investigation will find a dead end exactly where you need one.',
        'All materials are accounted for and destroyed. The incident has no physical record remaining.',
      ],
    },
    failure: {
      narratives: [
        'The facility had an unscheduled overnight security inspection. You had to hold the materials.',
        'One of your contacts got cold feet. Without both of them, the window doesn\'t work.',
        'A police evidence unit was operating near the disposal location. The timing was impossible.',
        'The materials are in a location you can\'t access until the heat from last week dies down.',
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────
// WAVE 3 — Narrative complete · Images complete
// ─────────────────────────────────────────────────────────────────────

const WAVE_3: Record<string, NarrativeEntry> = {

  // ── RUN A CORNER NUMBERS SPOT (j-rank-01) ─────────────────────────
  'j-rank-01': {
    art_key: 'corner_numbers',
    has_busted_image: false,
    summary: 'Work the corner book from noon to dusk.',
    flavor: 'Entry-level earning. A folding table, a coffee, and the afternoon shift on a corner that moves three hundred dollars on a slow day. Learn the rhythm before you run the whole operation.',
    success: {
      narratives: [
        'Forty bets, no disputes, clean handoff at dusk. You are building a reputation for reliability.',
        'The corner ran itself. Light traffic, solid take. You were back with the count before dark.',
        'Nobody short-changed you and nobody made a scene. Smooth afternoon on the corner.',
        'Small numbers, clean hands. The crew noticed you did not lose a dollar.',
      ],
    },
    failure: {
      narratives: [
        'A uniformed officer walked the block twice. You cleared the table and waited him out. Too late to restart.',
        'Two bettors got into an argument over a disputed number. The crowd it drew ended the shift early.',
        'The float came up twenty short. Either you miscounted or someone palmed it. Either way, it is your problem.',
        'Pickup never came. You held the take for four hours and walked it home in the rain.',
      ],
    },
  },

  // ── RUN AN ERRAND FOR THE CREW (j-rank-04) ────────────────────────
  'j-rank-04': {
    art_key: 'crew_errand',
    has_busted_image: false,
    summary: 'Simple delivery. No questions. No delays.',
    flavor: 'A sealed envelope needs to travel from a restaurant on Tenth Street to a private address three miles north. You do not know what is inside and you are not supposed to. You show up, you deliver, you leave.',
    success: {
      narratives: [
        'Delivered in under forty minutes. No detours, no contact, no trace. Clean.',
        'The recipient answered on the first knock. Took the envelope without a word. Done.',
        'Nothing complicated happened. Which is exactly what they needed.',
        'You were back before the coffee went cold. Reliable runners get called again.',
      ],
    },
    failure: {
      narratives: [
        'The address was wrong. By the time you found the right building, the recipient had left.',
        'Your route took you past a checkpoint that was not there yesterday. You turned around.',
        'The contact did not answer. You waited forty minutes and had to return with the envelope.',
        'Someone was watching the building. You assessed the situation and decided not to approach.',
      ],
    },
  },

  // ── EXTORT A LOCAL BUSINESS (j-rank-10) ───────────────────────────
  'j-rank-10': {
    art_key: 'extort_local',
    has_busted_image: false,
    summary: 'The dry cleaner on Fifth has never paid. Change that.',
    flavor: 'Three years operating without contributing to the neighborhood arrangement. You make a single visit, explain how things work in this part of the city, and leave with either a commitment or a clear signal that a second visit will be necessary.',
    success: {
      narratives: [
        'He understood the structure immediately. First payment next Friday, same time every week.',
        'Cooperative from the moment you introduced the subject. He had been expecting this conversation.',
        'Agreement reached. He will keep the arrangement quiet and so will you.',
        'He paid the first month on the spot. Said he had been setting it aside just in case.',
      ],
    },
    failure: {
      narratives: [
        'His nephew is a cop. He mentioned it the way people mention the weather. You recalibrated.',
        'He refused outright and said he would report any further contact. He meant it.',
        'Two other businesses on the same block have a rival arrangement. The territory is contested.',
        'He was already behind on a different debt to a different crew. Nothing available to collect.',
      ],
    },
  },

  // ── FENCE STOLEN GOODS MID-TIER (j-rank-12) ───────────────────────
  'j-rank-12': {
    art_key: 'fence_goods_mid',
    has_busted_image: false,
    summary: 'A trailer full of merchandise needs a new owner.',
    flavor: 'Sixty units of high-end audio equipment, serial numbers removed, sitting in a warehouse that costs money every day it is occupied. Your fence takes the lot at a discount and moves it through three different buyers before the week is out.',
    success: {
      narratives: [
        'Fence took the lot at fifty-five cents on the dollar without inspecting every unit. Cash on delivery.',
        'Transfer completed in two runs. The warehouse is empty and the proceeds are in an envelope.',
        'He did not negotiate. He knew the price was fair and so did you.',
        'Clean handoff. He will have it distributed before any serial check triggers.',
      ],
    },
    failure: {
      narratives: [
        'The fence backed out. Said the equipment was flagged in a law enforcement circular.',
        'The warehouse landlord showed up unexpectedly for an inspection. You had to delay the handoff.',
        'Your buyer had a capacity problem. He could only take twenty units this week.',
        'The merchandise was damaged in transit. The fence reduced the offer below cost.',
      ],
    },
  },

  // ── BROKER A LABOR UNION DEAL (j-rank-24) ─────────────────────────
  'j-rank-24': {
    art_key: 'union_deal',
    has_busted_image: false,
    summary: 'Sit between the union rep and the contractor. Get the cut.',
    flavor: 'A construction contract worth four million dollars is moving through city council. The union controls the workforce and the contractor controls the permit relationship. You are the one both sides need to make the arrangement official and quiet.',
    success: {
      narratives: [
        'The intermediary fee was agreed to without negotiation. You are in the deal.',
        'Both sides signed off. The contractor gets the workforce, the union gets their terms, and you get two percent.',
        'Clean brokerage. The arrangement is documented in a way that describes nothing illegal.',
        'Contract is moving. Your name appears nowhere in the paperwork.',
      ],
    },
    failure: {
      narratives: [
        'A federal oversight board audited the project before the arrangement was finalized. The window closed.',
        'The contractor brought in their own intermediary. You were cut out before the first meeting.',
        'The union rep wanted a larger percentage than either side was prepared to offer.',
        'City council delayed the vote. The entire timeline collapsed and everyone walked away.',
      ],
    },
  },

  // ── COMPILE INTEL ON A RIVAL FAMILY (j-rank-31) ───────────────────
  'j-rank-31': {
    art_key: 'compile_intel',
    has_busted_image: false,
    summary: 'Build the complete picture on the Ferrante operation.',
    flavor: 'Three weeks of passive surveillance, contact mapping, and financial pattern analysis. You compile everything into a single dossier — routes, schedules, weak points, and the names of people who might be persuadable.',
    success: {
      narratives: [
        'The dossier is complete. Routes, schedules, three vulnerabilities, and one name worth a conversation.',
        'Thorough intelligence delivered. The Consigliere read it twice and asked no follow-up questions.',
        'Clean operation. No exposure, no counter-surveillance triggered, complete picture assembled.',
        'Every contact mapped. The Ferrante schedule is predictable and you have three weeks of proof.',
      ],
    },
    failure: {
      narratives: [
        'The Ferrante crew changed their route pattern after noticing unusual attention.',
        'One of your surveillance contacts was recognized by a Ferrante associate. Operation compromised.',
        'The intelligence gathered was incomplete. Key figures were not observed and the schedule had gaps.',
        'Counter-surveillance detected the watch on their primary location. You pulled everyone back.',
      ],
    },
  },

  // ── ADVISE ON A HIGH-STAKES CONTRACT (j-rank-32) ──────────────────
  'j-rank-32': {
    art_key: 'advise_contract',
    has_busted_image: false,
    summary: 'Your read on the deal could cost or make the family millions.',
    flavor: 'A Capo is about to commit family resources to a joint venture with a third-party operator. The terms are complicated and the operator has a history. You spend three days reviewing the structure before the papers get signed.',
    success: {
      narratives: [
        'Your analysis identified a clause that would have transferred control at the eighteen-month mark. The Capo pulled out.',
        'Clean assessment delivered. The deal was restructured on your terms.',
        'You spotted the exposure early. The operator renegotiated when it was clear they had been read.',
        'The contract was signed on terms the family controls. Your read was correct on every major point.',
      ],
    },
    failure: {
      narratives: [
        'The deal moved before your analysis was complete. The papers were signed without your input.',
        'Your assessment was disputed by the existing advisor. The conflicting advice cost more than the deal.',
        'The operator had better legal representation than anticipated. The structure resisted renegotiation.',
        'You missed a secondary clause that matters. It will become a problem at the twelve-month mark.',
      ],
    },
  },

  // ── CONSOLIDATE FAMILY RACKETS (j-rank-41) ────────────────────────
  'j-rank-41': {
    art_key: 'consolidate_rackets',
    has_busted_image: false,
    summary: 'Reorganize five overlapping rackets into one clean system.',
    flavor: 'Five separate earners are running overlapping territory with inconsistent reporting and no coordination. You spend a week mapping conflicts, reassigning accounts, standardizing the take, and building a reporting chain that keeps money moving upward without friction.',
    success: {
      narratives: [
        'Reorganization complete. Five rackets now report through two captains and the take increased by twelve percent.',
        'The friction points are resolved. Every earner has defined territory and a clear reporting line.',
        'Clean consolidation. No crew lost significant earning capacity and the family\'s net position improved.',
        'System is running. The conflicts that cost money every week are documented, resolved, and assigned.',
      ],
    },
    failure: {
      narratives: [
        'Two earners refused the reassignment. The dispute required escalation before consolidation could continue.',
        'The territory overlap was more complex than the map suggested. Three more weeks of work at minimum.',
        'A rival crew exploited the reorganization window to move into a temporarily unassigned block.',
        'The reporting structure broke down in the first week when a captain ignored the new chain.',
      ],
    },
  },

  // ── NEGOTIATE A WAR CEASEFIRE (j-rank-42) ─────────────────────────
  'j-rank-42': {
    art_key: 'war_ceasefire',
    has_busted_image: false,
    summary: 'Both sides are bleeding. You stop it today.',
    flavor: 'Seven incidents in fourteen days. Two families at open war over a disputed port contract. The violence is attracting federal attention and costing both sides more than the contract is worth. You have thirty-six hours to get it done.',
    success: {
      narratives: [
        'Ceasefire agreed. Thirty-day pause with binding arbitration on the port contract at day twenty.',
        'Both sides stood down. The agreement was communicated to all crews within the hour.',
        'Temporary peace secured. The violence stops and the negotiation begins.',
        'The ceasefire holds. Both families returned to their primary earners and street pressure dropped immediately.',
      ],
    },
    failure: {
      narratives: [
        'An unauthorized incident occurred during the negotiation. The other side withdrew from the table.',
        'The terms were rejected. The port contract dispute has a dimension you did not have access to.',
        'A rogue element on your side moved before the agreement was finalized. The effort collapsed.',
        'Federal surveillance of the meeting location was detected. Both sides scattered before terms were reached.',
      ],
    },
  },

  // ── FLIP A RIVAL CREW LIEUTENANT (j-rank-43) ──────────────────────
  'j-rank-43': {
    art_key: 'flip_lieutenant',
    has_busted_image: false,
    summary: 'Turn the number two in the Marchetti crew.',
    flavor: 'The Marchetti lieutenant has been underpaid for three years and knows where the bodies are. Six weeks of cultivation through an intermediary have brought him to a meeting. Your job is to convert his dissatisfaction into a usable arrangement.',
    success: {
      narratives: [
        'He is in. First intelligence delivery is scheduled for next week and the terms are clear.',
        'The offer was accepted without counter-negotiation. He was ready before you finished the pitch.',
        'Converted. He provides operational intelligence and you provide protection and a monthly retainer.',
        'The arrangement is active. He already handed over the Marchetti meeting schedule for the next thirty days.',
      ],
    },
    failure: {
      narratives: [
        'He was already in a parallel conversation with a federal handler. Flipped the wrong direction.',
        'He seemed interested until the last moment, then declined. His loyalty held under pressure.',
        'The intermediary was compromised. The Marchetti crew knows about the approach.',
        'He asked for terms the family cannot authorize.',
      ],
    },
  },

  // ── SEIZE A RIVAL TERRITORY (j-rank-50) ───────────────────────────
  'j-rank-50': {
    art_key: 'seize_territory',
    has_busted_image: false,
    summary: 'The Delacroix crew vacated. Move in before someone else does.',
    flavor: 'Three blocks of prime collection territory became available when the Delacroix captain was arrested. The window is seventy-two hours. Move crew onto every active account and establish presence before any other family can organize a claim.',
    success: {
      narratives: [
        'All three blocks registered under your family\'s name before any competing crew made contact.',
        'Twelve accounts secured in forty-eight hours. The territory is operational and producing.',
        'Clean acquisition. Every business accepted the transition without incident.',
        'Territory secured. First collection under the new arrangement produced full payment on eleven of twelve accounts.',
      ],
    },
    failure: {
      narratives: [
        'A rival crew moved faster. By the time your people arrived, six accounts were already spoken to.',
        'The Delacroix accounts had a loyalty that outlasted the arrest. Several refused to transfer.',
        'Police presence on the block during the transition window made establishing contact impossible.',
        'A third family entered the contested blocks simultaneously. The standoff required commission arbitration.',
      ],
    },
  },

  // ── ESTABLISH A NEW RACKET EMPIRE (j-rank-54) ─────────────────────
  'j-rank-54': {
    art_key: 'new_racket_empire',
    has_busted_image: false,
    summary: 'Four precincts, six crews, one coordinated system.',
    flavor: 'You have the mandate to build a coordinated racket structure across four police precincts. The operation requires aligning six existing crews under a shared revenue model, establishing reporting protocols, and eliminating conflicts that have cost money for years.',
    success: {
      narratives: [
        'The structure is live. Six crews reporting through two regional captains with clean upward flow.',
        'Operational consolidation complete. The new model is producing fifteen percent above the fragmented baseline.',
        'The architecture holds. Every precinct has a designated crew, defined territory, and clear reporting lines.',
        'Empire established. The crews that were in conflict are now producing efficiently under a shared model.',
      ],
    },
    failure: {
      narratives: [
        'Two of the six crews refused the revenue sharing model. The structure cannot function with defectors.',
        'A federal organized crime sweep launched during the consolidation phase. The coordination collapsed.',
        'The reporting protocols broke down in the first week when captains began making unilateral decisions.',
        'A territorial dispute between two designated crews undermined the entire framework before it stabilized.',
      ],
    },
  },

  // ── POKER NIGHT (j-univ-03) ───────────────────────────────────────
  'j-univ-03': {
    art_key: 'poker_night',
    has_busted_image: false,
    summary: 'Host the back-room game. House takes eight percent.',
    flavor: 'Six regulars, a locked back room above a restaurant, and a minimum buy-in of three hundred. You run the table, manage the float, keep the atmosphere professional, and collect the house cut without anyone feeling managed.',
    success: {
      narratives: [
        'Six hours, six players, and the house walked out with clean earnings. Nobody questioned the rake.',
        'Two big spenders kept the action moving and the house percentage landed exactly where it should.',
        'Clean game from start to finish. Every player left satisfied and two asked about next week.',
        'The float balanced perfectly at close. Professional game, professional outcome.',
      ],
    },
    failure: {
      narratives: [
        'A player brought someone who did not belong. The vibe shifted and the table broke up early.',
        'A dispute over a hand turned into something that needed resolving before it became public.',
        'Three regulars did not show. The game barely covered the cost of the room.',
        'Neighbors filed a noise complaint. You had to clear the table three hours before planned close.',
      ],
    },
  },

  // ── HORSE RACE FIX INFORMATION (j-univ-04) ────────────────────────
  'j-univ-04': {
    art_key: 'horse_fix',
    has_busted_image: false,
    summary: 'The fifth race is decided. Get the information placed correctly.',
    flavor: 'You have reliable information about Saturday\'s fifth race. Getting the right money on the right horse through enough separate accounts to avoid flagging the odds requires coordination, discretion, and a forty-eight-hour window.',
    success: {
      narratives: [
        'The action was placed cleanly across six accounts. The horse won and the payout was substantial.',
        'Information used correctly. The odds barely moved and the return came in at a favorable ratio.',
        'Forty-eight hours, clean execution, no flags from the track or the books.',
        'The race went as expected. Proceeds collected before the track settled the books for the day.',
      ],
    },
    failure: {
      narratives: [
        'The information was wrong. The horse ran third and the accounts took a loss.',
        'Too much action moved on the race and the track flagged suspicious betting patterns.',
        'One of the accounts used was under regulatory review. The bet drew attention to the whole structure.',
        'The race was scratched due to a track condition. The window closed with nothing placed.',
      ],
    },
  },

  // ── DEMAND TRIBUTE FROM A STREET CREW (j-univ-07) ────────────────
  'j-univ-07': {
    art_key: 'demand_tribute',
    has_busted_image: false,
    summary: 'The independent crew on Archer Ave pays tonight.',
    flavor: 'A small independent crew has been operating on Archer Avenue for eight months without acknowledging the neighborhood structure. Tonight you make contact, explain the hierarchy, and return with either a commitment or clarity about what comes next.',
    success: {
      narratives: [
        'They understood the situation immediately. First tribute payment in an envelope before the conversation ended.',
        'The crew leader shook your hand and agreed to monthly payments. He had been expecting this.',
        'No resistance. They recognized the authority and committed to the arrangement on first contact.',
        'Tribute established. They pay on the first of the month and stay out of territory that is not theirs.',
      ],
    },
    failure: {
      narratives: [
        'The crew has a silent backing arrangement with a larger family. The leverage calculation changed on the spot.',
        'They refused and made clear they had the numbers to back it up. This requires a different approach.',
        'The crew leader was not present and his people would not negotiate without him. Try again.',
        'They stalled with a partial offer that does not reflect the actual arrangement.',
      ],
    },
  },

  // ── COLLECT INSURANCE FRAUD CUT (j-univ-08) ───────────────────────
  'j-univ-08': {
    art_key: 'insurance_fraud',
    has_busted_image: false,
    summary: "The adjuster settled three claims. Collect the family's cut.",
    flavor: 'An insurance adjuster on the family payroll has processed three fraudulent claims this month. Your job is to collect the arranged percentage before the proceeds are spent on something they should not be spent on.',
    success: {
      narratives: [
        'Three envelopes, three payments, clean collection. The adjuster stays on the arrangement.',
        'He had the money ready. Reliable earner. The family\'s cut came through without a discussion.',
        'Collection completed before noon. The adjuster is current and the arrangement continues.',
        'Clean pickup. He is motivated to stay on the right side of this and it shows.',
      ],
    },
    failure: {
      narratives: [
        'The adjuster is under an internal audit at his firm. He cannot move money until it resolves.',
        'One of the claims was flagged for review by the insurer\'s fraud department. Everything is frozen.',
        'He paid partial and said the rest would follow next week. It will need to be enforced.',
        'The adjuster has a new supervisor who reviews all settlements personally.',
      ],
    },
  },

  // ── MOVE STOLEN ELECTRONICS (j-univ-09) ──────────────────────────
  'j-univ-09': {
    art_key: 'stolen_electronics',
    has_busted_image: false,
    summary: 'Forty units in a van. Find them a home before morning.',
    flavor: 'Forty laptops need to be moved through a buyer tonight. Your contact takes electronics without questions. The arrangement requires delivery before 2 AM and payment in cash at the handoff.',
    success: {
      narratives: [
        'All forty units delivered and counted by the buyer before midnight. Cash in hand before the van left.',
        'Clean transaction. He bought the lot at the agreed price without inspecting every unit.',
        'Delivered in one run. The buyer was satisfied and flagged interest in more.',
        'Handoff complete. Nobody on the block knew what was in the van.',
      ],
    },
    failure: {
      narratives: [
        'The buyer backed out an hour before delivery. Said his storage situation had changed.',
        'A patrol car ran the van plate at a light. You changed the route and ran out of time.',
        'The serial numbers were flagged in a recent theft report the buyer had seen.',
        'The van broke down four blocks from the delivery point. The operation had to be abandoned.',
      ],
    },
  },

  // ── MOVE COUNTERFEIT GOODS (j-univ-11) ───────────────────────────
  'j-univ-11': {
    art_key: 'counterfeit_goods',
    has_busted_image: false,
    summary: 'Three hundred units of counterfeit product. Move them quietly.',
    flavor: 'Counterfeit luxury goods packed into shipping boxes labeled as wholesale accessories. Your distribution contact takes the lot and breaks it down through street vendors across four neighborhoods. Clean margin, low contact, steady operation.',
    success: {
      narratives: [
        'Three hundred units distributed across four contact points. The proceeds will come in over the next ten days.',
        'Clean movement. The distributor took delivery without incident and the product is already in the network.',
        'Smooth handoff. The contact had buyers lined up and the goods were moving before you were on the highway.',
        'Full lot transferred. The distributor confirmed placement and the family\'s cut is on schedule.',
      ],
    },
    failure: {
      narratives: [
        'Customs ran a sweep of the storage facility where the goods were staged.',
        'The distributor could only take half. The remainder needs a second buyer and a second window.',
        'A luxury brand investigator is working the neighborhood. Timing is off.',
        'The goods were lower quality than the price point supported. The distributor renegotiated down.',
      ],
    },
  },

  // ── RUN BOOTLEG LIQUOR (j-univ-12) ───────────────────────────────
  'j-univ-12': {
    art_key: 'bootleg_liquor',
    has_busted_image: false,
    summary: 'The bars on Meridian pay less for liquor with no tax stamp.',
    flavor: 'Four bars on Meridian Avenue take their well liquor from a warehouse that charges fifty cents on the dollar. You manage the delivery schedule, collect payment, and make sure the bar owners understand the quiet nature of the arrangement.',
    success: {
      narratives: [
        'Four deliveries, four payments, no complications. The bars are stocked and the family is paid.',
        'Clean distribution run. Every bar owner was cooperative and the volume held at the agreed level.',
        'The route is reliable. These four accounts have been consistent for six months and tonight was no different.',
        'Delivery complete. The arrangement continues to run cleanly on both sides.',
      ],
    },
    failure: {
      narratives: [
        'A liquor control inspector made a surprise visit to one of the bars during the delivery window.',
        'Two of the four bars are switching to a licensed distributor after a warning from their attorneys.',
        'The warehouse product failed a quality check. One bar owner refused the delivery.',
        'The delivery driver is under investigation for an unrelated matter. You had to abort the route.',
      ],
    },
  },

  // ── SMUGGLE CIGARETTES (j-univ-13) ───────────────────────────────
  'j-univ-13': {
    art_key: 'smuggle_cigarettes',
    has_busted_image: false,
    summary: 'A truckload of untaxed cigarettes crosses the state line tonight.',
    flavor: 'Untaxed cigarettes purchased at low-tax state prices and sold through corner stores at a margin that beats every licensed distributor. The truck makes one crossing and the product gets broken down across four warehouses before morning.',
    success: {
      narratives: [
        'The truck crossed without incident and the product is staged for distribution. Clean crossing.',
        'No stops, no inspections, clean route all the way. Product in the warehouse by 3 AM.',
        'Successful run. Four warehouses loaded before the morning shift. The distribution network is supplied.',
        'The border crossing was routine. Driver was clean and the cargo was manifested correctly.',
      ],
    },
    failure: {
      narratives: [
        'A random inspection checkpoint was set up on the primary crossing route. The truck turned around.',
        'The manifest did not match the cargo at a weigh station. The driver pulled the truck and called in.',
        'One of the staging warehouses was under surveillance from an unrelated operation.',
        'The product was damaged in transit. Too much was lost to make the run profitable.',
      ],
    },
  },

  // ── LOAN MONEY OUT — NEW ACCOUNT (j-univ-15) ──────────────────────
  'j-univ-15': {
    art_key: 'new_loan_account',
    has_busted_image: false,
    summary: 'Open a new account. Terms are clear. So are the consequences.',
    flavor: 'A restaurant owner needs eight thousand dollars in forty-eight hours and cannot use a bank. You meet him, assess the risk, set the weekly interest rate, and put the cash in his hand with a clear verbal understanding about what happens if he misses a payment.',
    success: {
      narratives: [
        'Account opened. Eight thousand out, terms agreed, first payment date confirmed.',
        'Clean origination. He needed the money and accepted the terms without negotiating the rate down.',
        'New account active. The borrower signed the informal acknowledgment and received the full amount.',
        'The account is on the book. He was grateful enough that the conversation about consequences was unnecessary.',
      ],
    },
    failure: {
      narratives: [
        'He reconsidered at the last moment. Said he found another solution. The cash never moved.',
        'His financial situation was worse than he described. The risk assessment came back unfavorable.',
        'He wanted a rate lower than the book supports. The conversation ended without an agreement.',
        'A previous bad account in the same neighborhood has made new originations inadvisable.',
      ],
    },
  },

  // ── BLACK MARKET DEAL (j-univ-16) ────────────────────────────────
  'j-univ-16': {
    art_key: 'black_market',
    has_busted_image: false,
    summary: 'Broker the deal. Buyer and seller never meet.',
    flavor: 'A buyer wants restricted materials. A seller has them. Neither party can make direct contact without exposure. You are the trusted intermediary who manages the exchange and takes a percentage for the operational risk you absorb.',
    success: {
      narratives: [
        'Exchange completed cleanly. Both parties are satisfied and you never appeared in the same place as the goods.',
        'Deal closed without incident. Your cut is in the envelope and both parties have what they came for.',
        'Clean brokerage. The exchange took eleven minutes and both principals were gone before it registered.',
        'Successful deal. You controlled the meeting, managed the handoff, and exited without exposure.',
      ],
    },
    failure: {
      narratives: [
        'The buyer brought a third party who had not been vetted. The seller walked before the exchange.',
        'The goods were not what the seller represented. The buyer refused delivery and both sides blamed you.',
        'A surveillance team was running an operation on the buyer. You walked.',
        'The location was compromised before the meeting. You called it off and the deal collapsed.',
      ],
    },
  },

  // ── CASH A STOLEN CHECK (j-univ-17) ──────────────────────────────
  'j-univ-17': {
    art_key: 'stolen_check',
    has_busted_image: false,
    summary: 'The check is real. The endorsement is not. Cash it clean.',
    flavor: 'A stolen payroll check for four thousand dollars needs to become cash before the account freeze propagates to the check-cashing network. Three locations, a reliable ID, and a twenty-four-hour window.',
    success: {
      narratives: [
        'All three stops completed. Check cashed across split amounts with no flags at any location.',
        'Clean conversion. The freeze had not propagated to the network yet and the timing worked.',
        'The ID held at all three locations. Cash in hand before noon.',
        'Completed in the window. The account freeze hit six hours after the last location was done.',
      ],
    },
    failure: {
      narratives: [
        'The account freeze was faster than expected. The first location declined and the ID raised questions.',
        'The check amount triggered automatic verification at the second stop. You walked before it completed.',
        'A familiar face was working the desk at the main location. The risk assessment ended the operation.',
        'The network had already flagged the check number. None of the three locations would process it.',
      ],
    },
  },

  // ── SKIM A LEGITIMATE BUSINESS (j-univ-18) ───────────────────────
  'j-univ-18': {
    art_key: 'skim_business',
    has_busted_image: false,
    summary: 'The car wash on Delancey has been skimming for the family for two years.',
    flavor: 'Monthly visit to collect the undeclared cash percentage from a legitimate business that runs double books. The owner cooperates because the alternative was explained two years ago. You verify the number, take the envelope, and report back.',
    success: {
      narratives: [
        'Full monthly skim collected without discussion. The owner was current and professionally cooperative.',
        'Clean pickup. The envelope was on the desk before you sat down.',
        'The books match the arrangement. Skim is healthy and the owner continues to perform.',
        'Reliable account. Two years without a missed payment and tonight was no exception.',
      ],
    },
    failure: {
      narratives: [
        'An IRS audit is currently running on the business. The owner cannot move undeclared cash right now.',
        'The business had a slow month and the owner is asking to defer. This requires a decision from above.',
        'A new business partner was brought in without notification. He does not know about the arrangement.',
        'The owner is selling. The new buyers take possession in thirty days and nothing transfers.',
      ],
    },
  },

  // ── RECRUIT AN INFORMANT (j-univ-19) ─────────────────────────────
  'j-univ-19': {
    art_key: 'recruit_informant',
    has_busted_image: false,
    summary: 'Convert a civilian contact into a reliable source.',
    flavor: 'A building supervisor at a courthouse handles mail and knows faces. Cultivated over four months, he is at the stage where a direct offer can be made. A modest monthly payment for minor information — a reliable inside connection, not a co-conspirator.',
    success: {
      narratives: [
        'He accepted. Monthly payment established and the first piece of useful information was delivered same day.',
        'The offer was calibrated correctly. He did not feel like he was crossing a line he cannot walk back.',
        'Informant recruited. Low-risk, consistent, reliable. Exactly what was needed from that position.',
        'He is in. The relationship is formalized and the intelligence will flow quietly each week.',
      ],
    },
    failure: {
      narratives: [
        'He refused and reported the approach to building security. The contact is now burned.',
        'He seemed interested then went quiet. The approach was too direct and the cultivation was not complete.',
        'He was already cooperating with a law enforcement contact. The conversation ended quickly.',
        'His position was transferred before the offer could be made. The access is gone.',
      ],
    },
  },

  // ── INTIMIDATE A BUSINESS INTO SILENCE (j-univ-21) ───────────────
  'j-univ-21': {
    art_key: 'intimidate_silence',
    has_busted_image: false,
    summary: 'The hardware store owner saw something he should not have remembered.',
    flavor: 'The hardware store owner on Clement Street made a statement to a detective last Thursday about a vehicle near an incident. You visit him and help him understand why his memory of that detail might not be reliable.',
    success: {
      narratives: [
        'He called his attorney the next morning and withdrew the statement. Cited uncertainty about what he saw.',
        'A brief conversation was sufficient. He looked appropriately uncertain about what he thought he saw.',
        'The detective called it an unreliable witness. The statement lost its value.',
        'He will not testify to anything specific. Short, professional, persuasive.',
      ],
    },
    failure: {
      narratives: [
        'He had already given a recorded statement the night before. Your visit changed nothing.',
        'His adult son was in the store and the son was not cooperative. The conversation did not happen.',
        'He called the police immediately after you left. The visit became its own incident.',
        'Two detectives were running surveillance on his block. You assessed the situation and did not approach.',
      ],
    },
  },

  // ── GREASE A COP (j-univ-22) ─────────────────────────────────────
  'j-univ-22': {
    art_key: 'grease_cop',
    has_busted_image: false,
    summary: 'The sergeant on the night shift needs to look the other way.',
    flavor: 'A sergeant at the 9th Precinct controls patrol routing on Tuesday nights. Three Tuesdays from now, a delivery needs to go through his sector without a traffic stop. You arrange a meeting and make an offer he can accept without asking what it is for.',
    success: {
      narratives: [
        'He accepted without asking questions. Tuesday routes will clear the corridor without incident.',
        'The offer was right-sized. He took it professionally and the route is clear for the next three Tuesdays.',
        'Arrangement confirmed. He has been in this position before and he knows how it works.',
        'Clean payment. He received the envelope and the patrol schedule will accommodate the operation.',
      ],
    },
    failure: {
      narratives: [
        'He is under an internal affairs review that was opened last week. Untouchable for now.',
        'He refused on principle. Some of them still have it and he happened to be one of them.',
        'He was interested but the timing is wrong. He suggested six weeks and that does not work.',
        'He was already on the payroll of a competing operation. The sector is not available.',
      ],
    },
  },

  // ── VANDALIZE A RIVAL'S BUSINESS (j-univ-23) ─────────────────────
  'j-univ-23': {
    art_key: 'vandalize_rival',
    has_busted_image: false,
    summary: 'Send a message without sending a message.',
    flavor: 'The Reyes crew has been making inquiries in territory they do not operate in. A targeted act of property damage at one of their front businesses communicates displeasure without requiring a confrontation — if executed without witnesses or connection back to you.',
    success: {
      narratives: [
        'Clean operation. The message was delivered without cameras, witnesses, or traceable materials.',
        'No exposure. The Reyes front had its windows replaced and their crew was noticeably quieter the following week.',
        'Executed without incident. The point was made and the inquiry into your territory stopped.',
        'Clean message sent. No attribution, no evidence, one less crew making noise in the wrong neighborhood.',
      ],
    },
    failure: {
      narratives: [
        'A security camera that was not on the plan captured the approach. The footage was reviewed next morning.',
        'A resident saw two of your crew leaving the area and described them to a responding officer.',
        'The operation was aborted when a patrol car made an unscheduled pass through the block.',
        'The wrong property was targeted. The Reyes crew does not own that building. Complication.',
      ],
    },
  },

  // ── RUN AN ERRAND FOR THE BOSS (j-univ-24) ───────────────────────
  'j-univ-24': {
    art_key: 'boss_errand',
    has_busted_image: false,
    summary: 'When the boss asks, you move.',
    flavor: 'A sealed package needs to travel from the boss\'s private residence to a business address forty minutes south. You are told nothing about the contents or the purpose. You are told to be discreet, use the secondary vehicle, and confirm delivery with a single text message.',
    success: {
      narratives: [
        'Delivered, confirmed, returned. The boss received the text and sent nothing back, which means it was correct.',
        'Clean delivery. The recipient said nothing and you asked nothing. The package changed hands.',
        'Completed without incident. These are the errands that build the kind of trust money cannot buy.',
        'Smooth execution. Nobody on either end of the transfer spoke more than four words. Exactly right.',
      ],
    },
    failure: {
      narratives: [
        'The recipient was not at the address. You held the package and returned without completing the delivery.',
        'You were followed for three blocks before the tail dropped off. The delivery was aborted as a precaution.',
        'The secondary vehicle had registration issues at a traffic stop. You had to handle that first.',
        'The address had changed and your contact information was out of date. Confirmation never sent.',
      ],
    },
  },

};

// ─────────────────────────────────────────────────────────────────────
// REGISTRY — combined lookup
// ─────────────────────────────────────────────────────────────────────

export const JOB_NARRATIVES: Record<string, NarrativeEntry> = {
  ...WAVE_1,
  ...WAVE_2,
  ...WAVE_3,
};

// Placeholder stub for any job not yet in the narrative registry
export const PLACEHOLDER_NARRATIVE: NarrativeEntry = {
  art_key: '',
  has_busted_image: false,
  summary: 'Complete this operation for the family.',
  flavor: 'Details are need-to-know. Your contact will brief you at the location. Bring what you need and leave what you don\'t.',
  success: {
    narratives: [
      'Operation completed without incident. Proceeds delivered, accounts settled.',
      'Clean outcome. Everything went according to plan.',
      'Well executed. The family notes your reliability.',
    ],
  },
  failure: {
    narratives: [
      'The operation didn\'t go as planned. Walk away and wait for the situation to settle.',
      'Complications forced an early exit. No blame assigned — yet.',
      'The timing wasn\'t right. Try again when the heat drops.',
    ],
  },
};
