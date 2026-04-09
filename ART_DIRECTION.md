# The Last Firm — Art Direction Guide
## Master Visual Language

---

### Style Summary

The Last Firm uses a **painterly editorial illustration** aesthetic drawn from
impressionist oil and gouache traditions. The goal is images that feel like they
belong in a luxury magazine, an art-house film poster, or an expensive hardcover
fiction jacket — not a video game asset pack.

Every image should communicate **old money, new crime, quiet power.**

---

### Reference Extraction (from master references)

| Reference | What it contributes |
|---|---|
| Tennis court figure | Single subject + geometric environment; figure as statement not action; cream/ivory palette; wide aerial framing; visible canvas texture |
| Rainy city street | Dramatic vanishing-point composition; amber/gold reflections on wet asphalt; impressionist brushwork on vehicles and architecture; atmospheric depth haze |
| Mediterranean pool | Foreground prop depth (glass, arm, magazine); luxury-leisure as power signal; sun-drenched saturated blues + warm cream; cypress silhouettes |
| City skyline figure | Back-of-head intimacy; figure as observer not actor; dusty golden-hour blue-grey city; quiet dominance; enormous environmental scale vs small human form |

---

### Visual Pillars

1. **Painterly texture always present** — canvas weave, oil impasto, or gouache opacity visible in every image. Never smooth or digital-looking.
2. **Wide cinematic framing** — 16:9 ratio preferred for job cards. Strong foreground/midground/background separation.
3. **Figure as silhouette of power** — characters communicate through posture, clothing, and position. Never grimacing. Emotionally controlled.
4. **Environment earns its place** — rain, architecture, light sources, weather are storytelling devices. No generic backdrops.
5. **Color restraint** — max 3–4 dominant hues per image. Rich but muted. No neons. No oversaturation.
6. **No cliché crime iconography** — no guns pointed at camera, no masked faces, no comic-book violence. Crime is implied through setting, behavior, and atmosphere.


---

## LOCKED RULE — Face Treatment (added April 2026)

**Characters must never have clearly rendered, portrait-level facial features.**

This rule applies to every image in the game — Wave 1 through Wave N, all variants.

### Reference
The approved reference is the tennis-court editorial illustration (Jazz House cover). The figure is fully present and readable from a distance, but the face is treated as a painterly color mass — warm skin tone, the general shape of a head, perhaps a jaw or brow suggested, but no sharp eyes, no defined lips, no legible expression.

### What this means in prompts
Every prompt containing a human figure must include this phrase exactly:
```
face treated as a softened painterly smear, no defined eyes no sharp lips no portrait realism, identity communicated through posture clothing silhouette and gesture only
```

### The rule in plain terms
| WRONG | RIGHT |
|---|---|
| Sharp eyes and defined irises | Warm skin-tone color mass, no eye detail |
| Readable lip shape or smile | Jaw area suggested by shadow and paint, no lip line |
| Portrait-realistic skin texture | Loose impressionist brush strokes across the face area |
| Identifiable individual face | Unidentifiable figure readable as human, not as person |
| AI "polished face" look | Smeared, abstracted, softened face plane |

### Practical framing approaches that support this rule
1. **Back-of-head or 3/4-rear composition** — most reliable, face never visible
2. **Downward head angle** — figure looking down at object, face obscured
3. **Hat brim shadow** — cap or hat casting shadow over face area
4. **Distance** — figure far enough that face reads as mass not features
5. **Profile with abstracted face** — profile angle, but face treated as flat painterly plane

### Updated master prompt fragment
```
painterly editorial illustration, oil on canvas texture, visible impressionist brushstrokes, [SCENE], face treated as a softened painterly smear no defined eyes no sharp lips no portrait realism identity communicated through posture clothing silhouette and gesture only, contemporary modern setting, cinematic wide composition, foreground-midground-background depth, elegant simplified forms, restrained emotion, upscale organized-crime atmosphere, [COLOR PALETTE], [LIGHT TYPE] light, no text overlays, no neon, no anime, no comic-book style, no vintage period cues, no letterbox bars, premium luxury editorial illustration quality
```

---

### Color Palette

**Primary atmosphere colors:**
- Wet asphalt with amber headlight reflections: `#8B5E2A` amber, `#2C2C2C` asphalt
- Dusty blue-grey city haze: `#7A8FA6`, `#4A5C6B`
- Mediterranean cream and sun: `#F2E8D0`, `#D4A853`
- Deep forest and cypress green: `#2D4A2D`, `#4A6741`
- Charcoal interior shadow: `#1A1A1A`, `#2A2520`
- Ivory linen and tailoring: `#EDE4D0`, `#C8B89A`

**Accent use only:**
- Warm gold (success, wealth): `#C9973A`
- Cold blue-white (police, exposure): `#8BAEC4`
- Deep burgundy-red (injury, cost): `#6B1A1A`

---

### Reusable Prompt Template

Use this as the base for every generated image. Swap in the `[SCENE]` block only.

```
painterly editorial illustration, oil on canvas texture, visible brushstrokes, impressionist technique, gouache and oil paint mixed media, [SCENE], cinematic wide composition, foreground-midground-background depth, elegant simplified forms, restrained emotion, upscale modern-crime atmosphere, sophisticated color palette of [COLOR NOTES], soft [LIGHT TYPE] light, no text overlays, no neon, no comic-book style, premium luxury editorial quality, 16:9 cinematic aspect ratio
```

**Light types by scene:**
- Job base images: `overcast natural` or `golden hour urban`
- Success: `warm late-afternoon golden`
- Failure: `cold blue-grey overcast` or `harsh fluorescent`
- Busted/arrest: `blue-white institutional` or `red-blue alternating (implied police)`
- Injury/aftermath: `low diffuse grey` or `hospital cool`
- Jackpot: `warm amber glow` or `soft interior candlelight`

---

### Image Specifications by Type

#### Job Base Images
- Mood: composed, purposeful, atmospheric
- Subject: one dominant action or setting — no crowds
- Framing: wide, subject in lower-third or center with environment dominant
- Palette: naturalistic, environment-led
- Example subjects: a figure crossing a rain-wet bridge at dusk; a car parked outside a restaurant at night; hands exchanging an envelope across a restaurant table

#### Success Result Images
- Mood: sharp, composed, satisfied — not triumphant
- Framing: tight or medium — focus shifts from environment to figure or object
- Palette: warm, golden-hour cast, slight glow
- Example: a briefcase on a hotel bed with city lights through the window; a figure in tailored coat walking away from a building

#### Failure Result Images
- Mood: tense, exposed, costly — never cartoonishly distressed
- Framing: environment-dominant, figure small or partially obscured
- Palette: cold, desaturated, grey-blue
- Example: a figure alone under harsh streetlight in the rain; a phone face-down on wet pavement

#### Busted/Arrest Images
- Mood: official, controlled, pressure — not dramatic action
- Framing: wide, clinical, cold
- Palette: blue-white institutional, grey, cold
- Example: an empty interrogation room with one light; a corridor viewed from the end

#### Injury/Aftermath Images
- Mood: quiet damage, vulnerability, cost
- Framing: close or medium, detail-focused
- Palette: muted, cool, slight warmth on skin tones only
- Example: a hand bandaged on a white hospital sheet; a cracked watch face on a table

#### Jackpot/High-Reward Images
- Mood: rare, elevated, charged with potential
- Framing: dramatic scale — figure small against enormous wealth or power
- Palette: deep warm amber, rich interior golds, controlled luxury
- Example: a penthouse table with stacks of cash in soft window light; a figure on a rooftop at golden hour overlooking the city

---

### What This World Is Not

- Not chaotic. Not loud. Not grimy street art.
- Not photorealistic. Not AI fantasy. Not anime.
- Not neon cyberpunk. Not superhero.
- Not posed stock photography.
- Not clichéd mob imagery (no fedoras, tommy guns, or pinstripes as costume).

---

### Consistency Rules

1. Every image must look like it was painted by the same artist in the same series.
2. Brush texture must be visible but not overwhelming — it is paint, not painting.
3. Light sources must be physically coherent within the scene.
4. Human figures are always dressed tastefully and contemporarily — no period costumes.
5. No image should require a caption to explain its mood.
