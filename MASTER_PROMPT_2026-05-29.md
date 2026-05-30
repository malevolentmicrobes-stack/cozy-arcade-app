# COZY ARCADE BOARD PREP — MASTER SESSION PROMPT
*Generated 2026-05-29. Source: GOAL.md · RECTIFIER_PLAN_2026-05-29.md · REDUNDANT_CODE_AUDIT.md · MOBILE_RECTIFIER_PLAN.md · ULTIMATE_GOALS.md · COZY_ARCADE_PROJECT_STATUS_2026-05-29.md*
*All data below is drawn from those files. No inference. Theoretical sections are labeled.*

---

## HOW TO USE THIS PROMPT

Paste this entire document at the start of any new AI session.
It replaces all prior context and brings any AI up to full working state.
All facts are sourced. All proposals are labeled `[THEORETICAL]`.
The AI must not add features, hallucinate function names, or patch what isn't broken.

---

## PART 1 — PROJECT IDENTITY

**App name:** Cozy Arcade Board Prep — Medicine
**Purpose:** Gamified ABIM internal medicine flashcard study tool for a US medical resident preparing for boards, August 2026.
**Target user:** Single user (the developer). Primary use: iPhone, daily study sessions.
**Core promise:** Right card, right time (FSRS spaced repetition) — inside a game that feels worth opening at midnight post-call.

**Live URLs:**
- Main: `malevolentmicrobes-stack.github.io/cozy-arcade-app`
- Phase 2 (separate repo, do not cross-push): `malevolentmicrobes-stack.github.io/cozy-arcade-app-PHASE2`

---

## PART 2 — ARCHITECTURE FACTS

**Single HTML file.** No build step. No framework. No separate JS files.
All code lives in `index.html`. Patches are `<style id="vXXX">` and `<script id="vXXX">` blocks appended before `</body></html>`.

**Current file state (commit `b2f1a9f`, 2026-05-29):**

| Metric | Value |
|--------|-------|
| Lines | 13,689 |
| `<style>` + `<script>` blocks | 88 |
| `!important` declarations | 1,126 |
| `@media(max-width:760px)` blocks | 35 |
| `.soloTrack inset` definitions | 11 (conflicting) |
| Dead CSS blocks (`.gameMain371`) | 1 major (~180 lines) |
| `updateKpis` wrapper chain depth | 7 layers |
| SW cache version | `cozy-arcade-v4` (sw.js) |

**Two game modes:**
1. **Solo Runner** — FSRS card, 4 multiple-choice answers, hunter/sword character, timer
2. **Knowledge Expansion (Domain)** — Orb-based answer selection, animated arena

**Third screen:**
3. **Neural Atlas** — inline constellation graph (`#atlas`), embedded inside index.html, public API: `window.showAtlasScreen()` / `window.hideAtlasScreen()`

---

## PART 3 — LOCALSTORAGE CONTRACT (NEVER CHANGE THESE KEYS)

```
soloStudyingState_v1757       ← active game session state
cozy_arcade_progress_v1       ← FSRS progress per card (canonical)
cozyQuestionSeconds351        ← timer setting (seconds)
bionicOn_v1751523             ← bionic reading toggle
cozy_arcade_limitless_cards_v1 ← deck card data
cozy_arcade_persona_v1        ← persona setting
```

Changing any key name destroys existing user progress. These are permanent.

---

## PART 4 — PROTECTED FUNCTIONS (WRAP, NEVER REPLACE)

```javascript
rate()              // FSRS rating core — never touch internals
rateCard()          // calls rate(), writes progress — never touch
advance()           // moves to next card — never touch
fullCard()          // toggles full card reveal — never touch
saveState()         // writes to localStorage — never touch
updateKpis()        // KPI DOM updates — wrap only (outer wrapper pattern)
canonicalCardId()   // single source of truth for card ID resolution
importDeck()        // imports JSON/CSV deck — never touch
```

These functions are the spine. Any patch that modifies them inline rather than wrapping them will corrupt FSRS scoring or break progress persistence.

---

## PART 5 — FSRS VALIDATION GATE

```javascript
window.runFSRSValidation()   // must return 17/17 before any push
window.runCozySmokeTests()   // must return 6/6 before any push
```

These run in the browser console. Both must pass after every code change. If either fails, do not push. This is not optional — FSRS accuracy is the reason the app exists.

---

## PART 6 — CANONICAL CARD SCHEMA

**14 canonical export fields** (only these appear in deck exports):
```
card_id · qid · sys · diagnosis · presentation · one_thing
educational_objective · board_trigger · explanation · why_not_others
test · quick_recall · cloze_source_text · cloze_enabled · tags
```

**Fields stripped from all exports** (aliases — must never appear in output):
```
level_1_presentation · level_2_three_second_exposure · prompt
clinical_vignette_summary · answer · subject · qid_unique
treatment · next_step · seen · reviewed · correct · rating · last
```

`canonicalizeCard(raw, {mode:'export'})` enforces this allowlist. Use it everywhere.

---

## PART 7 — FSRS PROGRESS FIELD ALIASES (READ-FALLBACK ONLY)

The canonical fields and their legacy aliases (both exist in data):

| Canonical | Legacy alias | Notes |
|-----------|-------------|-------|
| `p.seen_count` | `p.seen` (boolean) | seen_count is the truth |
| `p.reviewed_count` | `p.reviewed` | |
| `p.next_due_at` | `p.due` | |
| `p.last_seen_at` | `p.last` | |

All read operations handle both spellings (`p.due || p.next_due_at`).
Exports write canonical only. Do not add new aliases.

---

## PART 8 — CURRENT WORKING FEATURES (confirmed in b2f1a9f)

| Feature | Status |
|---------|--------|
| Solo Runner game (FSRS + 4-col choices) | ✅ |
| Knowledge Expansion game (orbs) | ✅ |
| FSRS v5 spaced repetition (17/17 validated) | ✅ |
| Neural Atlas inline (constellation + card browser) | ✅ |
| Atlas: Pin/Bury from card detail (vA10) | ✅ |
| Atlas: Study filtered session from card detail (vA9) | ✅ |
| Atlas: Personal notes per card (vA11) | ✅ |
| Import JSON/CSV decks | ✅ |
| Export deck + FSRS progress | ✅ |
| Undo last answer (Cmd+Z / shake, 5-deep) | ✅ |
| PWA offline support (sw.js, cache v4) | ✅ |
| HUD single-row compact bar | ✅ |
| Board Readiness Map (per-system mastery bars) | ✅ |
| Session size picker (10/25/50/All) | ✅ |
| Board Pearl in reveal (one_thing auto-shown) | ✅ |
| ABIM countdown chip in hero | ✅ |
| Swipe-to-rate gesture | ✅ |
| Weak-system launch chips | ✅ |
| Game tap with no deck → opens file picker | ✅ |
| Warm palette (home/settings) | ✅ |

**Features cut in the 2026-05-29 rectifier** (can be re-added one per session, one per prompt):
vFix12 session stats · vFix14 auto-explain · vFix15 leech badge · vFix16 scroll fix
vFix17 today stat · vFix18 pin toggle · vFix19 later flag · vFix20 daily goal
vFix21 quick note · vFix24 pacing · vFix25 drill weak · vFix26 confetti
vFix28 heatmap · vFix29 timer · vFix30 keyboard · vFix31 cram · vFix32 per-sys cram
vFix33 search · vFix34 accuracy badges · vFix35 pinned · vFix36 tab title
vFix37 audio · vFix38 pearls · vFix39 backup toast · vFix40 calendar · vFix41 ABIM score

---

## PART 9 — REDUNDANCY AUDIT (what is broken by design in the current file)

These are confirmed issues from `REDUNDANT_CODE_AUDIT.md`. Do not "fix" them by patching more — document them for the clean rebuild.

| ID | Issue | Impact |
|----|-------|--------|
| R01 | vFix5 `getFSRSDueCounts()` uses `p.reps` (never set); vFix8 immediately overwrites. Two DOM passes per KPI cycle. | Medium |
| R02 | `soloTrack inset` defined 11 times (290px→258px→245px→250px→230px→240px→calc()). Last wins. | Medium |
| R03 | `.gameMain371` CSS block (~180 lines) targets a class never added to any DOM element. Entirely dead. | Zero runtime; confusing |
| R04 | `cursorGlow` JS runs touchmove events on mobile; element is hidden by CSS. Wasted JS per scroll. | Low |
| R05 | `bgMove` grid animation active on mobile during all gameplay (GPU compositor layer). | Medium |
| R06 | FSRS alias pairs: 4 fields have two spellings both active in data. | Medium |
| R07 | `heroSub` styled 12+ times across patches; only last wins. | Low |
| R08 | 35 scattered `@media(max-width:760px)` blocks — cascade determines winner per property. | High maintenance |
| R09 | Card ID resolution uses 4 different patterns (`c.id||c.qid||c.card_id` vs `c.card_id||c.id` etc.). Only `canonicalCardId()` is correct. | Medium |
| R10 | `domainTitle` defined 3× (48px, 30px@820px, hidden). Only hidden state matters. | Low |
| R11 | `updateKpis` 7-layer wrapper chain. vFix5 writes wrong values; vFix8 overwrites. Two full DOM-write passes. | Medium |
| R12 | `progress.seen` boolean written redundantly from `seen_count`. Double-storing same bit. | Low |
| R13 | `panel.innerHTML` rebuild (line 8506) orphans the `#limitlessHomeDeckFile` change listener from wire(). | Medium |
| R14 | `ensureSettingsButton()` defined but never called. Dead function. | Low |
| R15 | Injected elements default `order:0`, sort above `.hero` (order:1). Fixed in vFix42a with `order:-1`. | Fixed |

**The pattern:** Every patch fought the previous one with `!important`. The file has accumulated 1,126 `!important` declarations. No value has a single source of truth.

---

## PART 10 — NON-NEGOTIABLES (master subsection)

*Compiled from ULTIMATE_GOALS.md, MOBILE_RECTIFIER_PLAN.md, RECTIFIER_PLAN_2026-05-29.md. These override any feature request.*

### Code rules
1. All patches appended before `</body></html>`. Never edit inline HTML/JS.
2. Never cross-push between `cozy-arcade-app.git` and `cozy-arcade-app-PHASE2.git`.
3. `runFSRSValidation()` → 17/17 before every push, no exceptions.
4. `runCozySmokeTests()` → 6/6 before every push.
5. Maximum **one feature per prompt**. Write the spec before any code. Pre-mortem every `onclick` handler change.
6. Any commit that repairs a broken live app **must** bump `CACHE` in `sw.js` in the same commit. Stale-while-revalidate means broken HTML serves from cache until SW evicts it.

### Functional non-negotiables (do not regress)
- HUD top bar: single row, visible, home button accessible
- Prompt AI: present in settings, not broken by drawer changes
- Import/Export: JSON + CSV, all three modes (deck / progress / deck+progress)
- FSRS v5 scoring: `rate()` → `rateCard()` → progress persisted correctly
- Undo: Cmd+Z / shake, 5-deep stack
- Drop mechanic (v175151): timer + auto-select behavior
- Neural Atlas: constellation renders, `na-` prefix IDs, CSS scoped to `#atlas`
- Hunter/sword character animation: identity of the app
- `settingsReturnMode` must be set before opening settings from a game screen (otherwise ← returns to home instead of game)

### What killed the app in prior sessions (never repeat)
| Pattern | What broke |
|---------|-----------|
| 3 features in one prompt | 4 new redundancy entries + broken app |
| Wrapping `window.normalizeHud` (local closure, not on window) | Silent dead wrapper, used MutationObserver fallback that caused settingsReturnMode bug |
| Hiding `.hudStats371` on mobile | Collapsed HUD, shifted tap targets |
| `home()` at 900ms post-import | Scroll-jump freeze on mobile (10-wrapper chain on 1249 cards) |
| Another `updateKpis` wrapper (vFix41) | Risk of silent failure in wrapper chain |
| Not bumping SW cache after broken push | Users see broken version until manual cache clear |
| `panel.innerHTML` rebuild | Orphaned file input listeners |

---

## PART 11 — RECTIFIER PLAN (current)

**Current stable baseline:** commit `b2f1a9f` · 13,689 lines · SW cache v4 · FSRS 17/17 confirmed.

The 2026-05-29 rectifier restored from vFix8 and added 6 consolidated features (Board Readiness Map, Board Pearl, session size picker, ABIM countdown, swipe-to-rate, sys-chip launch). vFix12–vFix41 were cut.

### What a clean rebuild looks like (target: ~80% of current file size)

**Phase A — Variable foundation** (no visual change)
- Single authoritative `:root` block: warm-home palette + cold-game palette
- Map all hardcoded colors to CSS variables (`#67e8f9` → `var(--cyan)` etc.)
- Delete dead R03 `.gameMain371` CSS block (180 lines, zero runtime effect)
- Collapse the two `:root` definitions at lines 2 and 5680 into one

**Phase B — One authoritative mobile block**
- Replace all 35 `@media(max-width:760px)` blocks with one `<style id="cozy-mobile-authority-css">`
- Single `soloTrack inset` declaration (current correct: `calc(22vh + 58px)`)
- Disable `cursorGlow` touchmove on `(hover:none)` devices

**Phase C — Screen-by-screen mobile fixes** (one per prompt)
- C1: HUD → Score + Round only on mobile. Energy = transient flash.
- C2: Energy Shift → `⚡ +1 CE` inline badge, 1.5s fade
- C3: KE card font → `clamp(13px,3.8vw,18px)` single definition
- C4: Prompt AI → `<details>` collapsible (closed by default)
- C5: Home bottom → Import/Export ▾ dropdown chip; 2-col KPI grid
- C6: Import overlay → ✕ close + "Upload deck" shortcut inside
- C7: Review screen → dark pill header, Progress label in cyan

**Phase D — Warm/cold palette** (after A–C stable)
- Home + Settings + Atlas: `#130c08` warm near-black, `#f5c97a` gold accent
- Game screens: `#020611` cold (unchanged)
- Token-only change via CSS variable override block

**Gate before each phase ships:**
```javascript
window.runFSRSValidation()   // 17/17
window.runCozySmokeTests()   // 6/6
// manual: bionic toggle · timer countdown · solo cycle · KE orbs tappable
```

---

## PART 12 — NEURAL ATLAS PROPOSAL [THEORETICAL]

*This section is a design proposal. No code has been written for it. Separated from data sections.*

### Current Atlas state (confirmed working)
- Embedded as `<div id="atlas" class="screen hidden">` inside index.html
- Canvas: `id="na-canvas"` — constellation of system nodes
- Sidebar: card browser, KPIs, export buttons
- Data: reads live from `window.appCards()` + `window.phase3State.progress`
- PHASE2 has: tag filter, sortable columns, tag/sys constellation toggle
- Public API: `window.showAtlasScreen()` / `window.hideAtlasScreen()`

### Obsidian-style node vision [THEORETICAL]

**Node sizing:** Node radius ∝ `Math.sqrt(cardCount)` per system — large systems (Cardiology, ID) are visually dominant. Current implementation uses uniform node size.

**Node color by mastery:**
```
mastery ≥ 80%  → green  (#22c55e)
mastery 60–79% → amber  (#f59e0b)
mastery < 60%  → red    (#ef4444)
unseen         → gray   (#475569)
```
Currently: all nodes render in a single color. Mastery data is already available in `phase3State.progress`.

**Edge weight:** Edge thickness ∝ number of cards that share both `sys` values (crossover cards). Currently: no edges between system nodes.

**Interactive behaviors:**
- Click node → zoom to system, sidebar shows cards for that system
- Hover node → tooltip: "Cardiology · 47 cards · 73% mastery · 12 due"
- Drag node → repositions with spring physics (RAF loop already running)

**Porting from PHASE2:** PHASE2 already has `buildTagMap()` and tag/sys constellation toggle. These functions could be ported to the main app alongside `buildSysMap()`.

**Implementation sequence** (one feature per prompt, in order):
1. Color nodes by mastery (read from existing progress data — no new data needed)
2. Size nodes by card count (simple radius formula)
3. Add hover tooltip (reuse existing sidebar KPI data)
4. Add edge rendering for crossover cards (scan cards for multi-sys entries)
5. Spring physics for drag (replace current static RAF with force-directed layout)

*None of the above should be attempted before Phase C mobile fixes are stable and ABIM August 2026 has passed.*

---

## PART 13 — BUILDING FROM SCRATCH (the clean-file target)

*This describes what a full clean rebuild would look like. Not to be done before August 2026.*

The goal: one `index.html` at ~10,000–11,000 lines (80% of current) with:
- Zero redundant CSS property definitions
- One `:root` block
- One `@media(max-width:760px)` block
- All card ID resolution through `canonicalCardId()` exclusively
- All FSRS alias reads consolidated in `loadState()` (normalize on load)
- No patch IIFE wrappers — all code integrated into original function bodies
- `updateKpis` as a single function, not a 7-layer wrapper chain
- `progress.seen` field removed; `seen_count > 0` used directly everywhere

**The prompt to elicit this from any capable AI (paste as system instruction):**

```
You are rebuilding index.html for Cozy Arcade Board Prep from scratch.
You have been given:
- The current 13,689-line index.html as reference
- REDUNDANT_CODE_AUDIT.md (R01–R21 findings)
- ULTIMATE_GOALS.md (invariants + protected functions)
- COZY_ARCADE_PROJECT_STATUS_2026-05-29.md (feature list)

Your task: produce a single index.html that:
1. Passes window.runFSRSValidation() → 17/17
2. Passes window.runCozySmokeTests() → 6/6
3. Contains all features marked ✅ in the project status file
4. Contains zero code from features marked ⏪ reverted
5. Has a single :root block (not two)
6. Has a single @media(max-width:760px) block
7. Uses canonicalCardId() for all card ID resolution
8. Uses the canonical FSRS field names (no alias reads outside loadState())
9. Has no .gameMain371 CSS (dead block, R03)
10. Has updateKpis() as a single function (not a 7-layer wrapper chain)

Do not add features not in the ✅ list.
Do not use !important unless you can name the specific cascade conflict it resolves.
All localStorage keys must match exactly: soloStudyingState_v1757,
cozy_arcade_progress_v1, cozyQuestionSeconds351, bionicOn_v1751523.
Validate against the FSRS v5 test vectors in FSRS_V5_IMPLEMENTATION_PROMPT.md
before declaring the rebuild complete.
```

---

## PART 14 — CUSTOM SESSION FEEDBACK MESSAGES

*Replace standard AI status messages with the following. Designed for a solo dev studying for boards who needs momentum, not corporate polish.*

**Standard states → Cozy Arcade equivalents:**

| State | Message |
|-------|---------|
| Thinking (fast) | `↑ Energy` |
| Thinking (slow) | `↓ Energy` |
| Starting a task | `Grinding...` |
| Mid-task, making progress | `Cooking...` |
| Complex analysis running | `Crushing it...` |
| Almost done | `Almost at the next level.` |
| Near context limit | `The limit doesn't exist.` |
| Committed a fix | `Shipped. Next step — let's go.` |
| Validation passing | `17/17. We run this.` |
| Validation failing | `Not yet. Find the break.` |
| Restored from rollback | `Back to base. Build smarter.` |
| SW cache bumped | `Cache cleared. Live in 1 reload.` |
| Waiting for user | `Your call.` |
| Error in prior session | `Last session left scars. Reading them now.` |
| Writing a new feature | `One feature. One prompt. No detours.` |
| Pre-mortem running | `Naming the ways this breaks before it does.` |

**Extended energy messages (for long tasks):**

```
Leveling up...
Locked in.
Building the thing.
No shortcuts — doing it right.
Stack's clean. Moving.
One commit at a time.
This is the run.
```

**On successful push:**
```
Committed [hash]. <outcome>. Next.
```

**On broken deploy (SW issue):**
```
Code is live. Cache isn't cleared yet. Bump sw.js CACHE name → same commit → push.
```

---

## PART 15 — PROJECT GOALS (current priority order)

**Now → August 2026 (boards):** Study. Pass. Use this app daily.

| Priority | Goal | Gate |
|----------|------|------|
| 0 | App stays working on iPhone after every push | SW cache bump in same commit as any fix |
| 1 | FSRS accuracy: right card, right time | runFSRSValidation() → 17/17 always |
| 2 | Re-add cut features (one per session, one per prompt) | Each passes full gate before next |
| 3 | Mobile UX polish (Phases A→D from Mobile Rectifier Plan) | C1→C7 in order |
| 4 | Neural Atlas: mastery color + node sizing | After C is stable |
| 5 | P8 CSP headers | vercel.json |

**Post-August 2026:**
| Priority | Goal |
|----------|------|
| iOS1 | Capacitor scaffold — wraps current HTML as native iOS app |
| M2 | Stripe Payment Link |
| Clean rebuild | index.html at ~80% current size, zero patch IIFEs |
| Atlas | Full Obsidian-style force-directed node graph |
| Multi-user | Post-match, post-ID fellowship |

---

## PART 16 — SESSION START CHECKLIST

When opening a new session with this prompt:

1. Run `graphify update .` (no API cost — AST only)
2. Run `git log --oneline -5` to confirm current HEAD
3. Confirm `index.html` line count: `wc -l index.html`
4. State the one feature being worked on today
5. Write the spec for that feature before touching any code
6. After any code change: verify `runFSRSValidation()` → 17/17 in console
7. Any push that fixes a broken live app: bump `CACHE` in `sw.js` in the same commit

---

*Last updated: 2026-05-29*
*Source files: GOAL.md · RECTIFIER_PLAN_2026-05-29.md · REDUNDANT_CODE_AUDIT.md · MOBILE_RECTIFIER_PLAN.md · ULTIMATE_GOALS.md · COZY_ARCADE_PROJECT_STATUS_2026-05-29.md*
*No content in this file was inferred or invented. Theoretical sections are labeled [THEORETICAL].*
