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
// REGISTRY — combined lookup
// ─────────────────────────────────────────────────────────────────────

export const JOB_NARRATIVES: Record<string, NarrativeEntry> = {
  ...WAVE_1,
  ...WAVE_2,
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
