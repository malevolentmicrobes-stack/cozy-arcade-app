# COZY ARCADE BOARD PREP — MASTER CONTEXT PROMPT V3
*2026-05-30 · Branch: clean-rebuild-80*
*Sources: GOAL.md · RECTIFIER_PLAN_2026-05-29.md · FAILED_ATTEMPTS_2026-05-29.md · REDUNDANT_CODE_AUDIT.md · MOBILE_RECTIFIER_PLAN.md · ULTIMATE_GOALS.md · COZY_ARCADE_PROJECT_STATUS_2026-05-29.md · FSRS_V5_IMPLEMENTATION_PROMPT.md · LAYOUT_MAP_2026-05-27.md*
*Zero hallucination. All facts sourced. [THEORETICAL] sections labeled.*

---

## V2 → V3 CORRECTIONS (read before using V2 for anything)

| # | Type | V2 error | V3 fix | Source |
|---|------|----------|--------|--------|
| 1 | Error | FSRS W array: 17 elements | 19 elements — W[17]=0.4527, W[18]=0.6632 required for short-term stability + difficulty update paths | FSRS_V5_IMPLEMENTATION_PROMPT.md line 9–11 |
| 2 | Error | localStorage: 6 keys listed | 10 keys — 4 live production keys missing: `cozy_dailygoal_v20` `cozy_audio_v37` `cozy_backup_v39` `cozy_cal30_v40` | GOAL.md·MOBILE_RECTIFIER_PLAN.md |
| 3 | Error | ~20 working features listed | 41 confirmed ✅ features — all must not regress | MOBILE_RECTIFIER_PLAN.md full audit |
| 4 | Error | Redundancy R01–R12 only | R01–R21 — R13–R21 are the entries behind the 2026-05-29 cascade | REDUNDANT_CODE_AUDIT.md |
| 5 | Omission | `naLaunchSysReview()` absent from protected functions | Added — vFix9 confirmed bug: chips called wrong function; this is the correct one | GOAL.md vFix9 entry |
| 6 | Omission | Atlas data source vague | Explicit: MUST read `window.appCards()` + `window.phase3State.progress` live. localStorage read = blank constellation. | RECTIFIER_PLAN_2026_05_26.md Root Cause I |
| 7 | Omission | Persona system absent | 8 confirmed personas documented; stored in `cozy_arcade_persona_v1` | Study_Mode_Selectable.png |

---

## SESSION CONTRACT

One feature per prompt. Spec before code. Gate before push.
Read Section 2 (failures) before proposing anything.
`runFSRSValidation()` → 17/17 + `runCozySmokeTests()` → 6/6 before every push.
SW cache bump mandatory in same commit as any fix to a broken live app.

---

## SECTION 1 — WHO AND WHAT

**Developer:** US internal medicine resident. ABIM boards August 2026. Single user, primary device iPhone.
**App:** Cozy Arcade Board Prep — Medicine. Gamified ABIM flashcard system. Single HTML file.
**Core loop:** FSRS surfaces the right card → game makes it worth opening at midnight post-call.
**Branch context:** `clean-rebuild-80` — target 80% of current file size with zero patch IIFEs.

**Live URLs:**
- Main: `malevolentmicrobes-stack.github.io/cozy-arcade-app`
- Phase 2 (separate repo — never cross-push): `malevolentmicrobes-stack.github.io/cozy-arcade-app-PHASE2`

---

## SECTION 2 — ⛔ FAILED ATTEMPTS (read before writing any code)

*Full detail: `FAILED_ATTEMPTS_2026-05-29.md`. Source: git log + commit diffs.*

| # | Attempted | Broke | Root cause | Commits |
|---|-----------|-------|------------|---------|
| 1 | vFix41: `updateKpis` wrapper #10 for ABIM score | Solo-click freeze; 5 revert commits; ~2hr lost | Wrapper chain 9 deep; silent failures cascade | `5daef88` → 5 reverts |
| 2 | 3 features in one prompt (vFix42) | Overlay-close + HUD settings broken; revert required all 3 | One bad feature forces full revert | `f540bcf` → `81ae55e` |
| 3 | `home()` at 900ms post-import (vFix43a) | Scroll-freeze on mobile | `importObject()` already refreshes state | `dfd488b` → `6d7e70b` |
| 4 | `window.toast` interception for overlay trigger (vC6) | Game buttons appeared permanently broken | Toast is fire-and-forget; can't use for flow control | → `b4364b3` |
| 5 | `window.normalizeHud` wrap of local IIFE closure | Dead from line 1; `window.normalizeHud` always `undefined` | Local vars not on window unless exported | `f540bcf` → `81ae55e` |
| 6 | Fixing "button broken" without counting onclick handlers | Wrong root cause patched | 7 handlers on `#startSolo`; `patchButtons()` resets on every `home()` | multiple |
| 7 | Push fix without bumping SW cache | Fix invisible for 1–2 reloads | Stale-while-revalidate serves cache instantly | `d53dbeb` (no bump) |
| 8 | In-game settings without `settingsReturnMode` | Lands on home instead of game after settings | `returnToPrior()` checks `settingsReturnMode` | `f540bcf` → reverted |
| 9 | Hide `.hudStats371` on mobile | HUD flex collapse; tap targets shift | Hiding flex child collapses row | `f540bcf` → reverted |
| 10 | Assumed post-import needs `home()` refresh | Scroll-freeze | `importObject()` already calls `updateKpis()` | `dfd488b` → reverted |

**Three loops that repeat across sessions:**

`Loop A — "Fix the button"` (4+ sessions): Patch onclick → patchButtons() resets it on next home() → nothing fixed. Correct response: `getEventListeners(document.getElementById('startSolo'))` first.

`Loop B — "Push looks broken"` (3 SW cache busts): Pushed fix, site unchanged. Correct response: bump CACHE in sw.js same commit.

`Loop C — "Add one more updateKpis wrapper"` (9 wrappers built): New stat appended as outer wrapper → chain is 9 deep → silent failures. Correct response: consolidated rewrite, not another wrapper.

---

## SECTION 3 — ARCHITECTURE

**Single file:** `index.html`. No build step. No framework.
All patches: `<style id="vXXX">` / `<script id="vXXX">` blocks before `</body></html>`. Never edit inline.

**Current baseline (commit `b2f1a9f`, branch `main`):**

| Metric | Value | Debt |
|--------|-------|------|
| Lines | 13,689 | Target: ~10,950 (80%) |
| `<style>` + `<script>` blocks | 88 | Each fought the previous |
| `!important` declarations | 1,126 | No value has one source of truth |
| `@media(max-width:760px)` blocks | 35 | Last-in-file wins; 34 are noise |
| `.soloTrack inset` definitions | 11 | 7 different values; correct: `calc(22vh + 58px)` |
| Dead CSS `.gameMain371` | ~180 lines | Class never in DOM |
| `updateKpis` wrapper depth | 7 layers | vFix5 writes wrong values; vFix8 overwrites |
| SW cache | `cozy-arcade-v4` (sw.js) | Increment on every broken-app fix |

**Three screens:**
- `#home` — stats, launch buttons, hero, ABIM countdown
- `#solo` / `#domain` — Solo Runner / Knowledge Expansion games
- `#atlas` — Neural Atlas constellation (embedded inline, `na-` prefixed)

---

## SECTION 4 — LOCALSTORAGE CONTRACT (permanent — never rename)

```
soloStudyingState_v1757          active game session
cozy_arcade_progress_v1          FSRS progress per card (canonical)
cozyQuestionSeconds351           timer setting
bionicOn_v1751523                bionic reading toggle
cozy_arcade_limitless_cards_v1   deck card data
cozy_arcade_persona_v1           persona (8 confirmed: see Section 7)
cozy_dailygoal_v20               daily goal picker value (vFix20 — cut but key is live)
cozy_audio_v37                   audio feedback toggle (vFix37 — cut but key is live)
cozy_backup_v39                  backup reminder guard (vFix39 — cut but key is live)
cozy_cal30_v40                   30-day calendar state (vFix40 — cut but key is live)
```

Keys marked "cut but live" were shipped in prior commits and may exist in user's localStorage.
Never create new keys that collide with these. Never rename them.

---

## SECTION 5 — PROTECTED FUNCTIONS (wrap outer only — never replace internals)

```javascript
rate()                 // FSRS core math — never touch
rateCard()             // writes progress — never touch
advance()              // next card — never touch
fullCard()             // reveal toggle — never touch
saveState()            // localStorage write — never touch
updateKpis()           // DOM updates — outer wrap only; no new wrappers (chain is 7 deep)
canonicalCardId()      // card ID resolution — use everywhere, never inline fallbacks
importDeck()           // deck import — never touch
naLaunchSysReview()    // Atlas → filtered study launch — use this, not showAtlasScreen()
```

`naLaunchSysReview()` specifically: vFix9 fixed a confirmed bug where weak-system chips called `showAtlasScreen()` (wrong). Always use `naLaunchSysReview()` for any "study this system" action.

---

## SECTION 6 — FSRS v5 VALIDATION GATE

```javascript
window.runFSRSValidation()   // → 17/17 — before every push
window.runCozySmokeTests()   // → 6/6  — before every push
```

**W array (19 elements — source: FSRS_V5_IMPLEMENTATION_PROMPT.md):**
```javascript
const W = [
  0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0589,
  1.5330, 0.1544, 0.9956,  1.9783, 0.1542, 0.4683, 0.5825, 0.0000,
  2.7869, 0.4527, 0.6632   // W[17] + W[18] required for short-term stability
];
```

**Test vectors (first review):**
```
again → S=0.4072  D=7.2102  interval=1d
hard  → S=1.1829  D=6.5085  interval=1d
good  → S=3.1262  D=5.3146  interval=3d
easy  → S=15.4722 D=3.2829  interval=15d
```

---

## SECTION 7 — CANONICAL CARD SCHEMA + PERSONAS

**14 canonical export fields:**
```
card_id · qid · sys · diagnosis · presentation · one_thing
educational_objective · board_trigger · explanation · why_not_others
test · quick_recall · cloze_source_text · cloze_enabled · tags
```

**Stripped from all exports (aliases — never appear in output):**
```
level_1_presentation · level_2_three_second_exposure · prompt
clinical_vignette_summary · answer · subject · qid_unique
treatment · next_step · seen · reviewed · correct · rating · last
```

**8 confirmed personas** (stored in `cozy_arcade_persona_v1`):
```
Limitless Scholar · Veil Warden · Protocol Executor · Phantom Razor
Theory Weaver · Vision Commander · Loyal Shield · Adaptive Sentinel
```

---

## SECTION 8 — FULL REDUNDANCY AUDIT (R01–R21)

*Source: REDUNDANT_CODE_AUDIT.md. R13–R21 were missing from V2 — these caused the 2026-05-29 cascade.*

**R01–R12 (structural debt):**

| ID | Issue | Fix in clean rebuild |
|----|-------|---------------------|
| R01 | vFix5 writes wrong KPI values; vFix8 overwrites. Two DOM passes per cycle. | Collapse vFix5+8 into one accurate function |
| R02 | `soloTrack inset` 11 definitions, 7 values. Correct: `calc(22vh + 58px)` | One declaration |
| R03 | `.gameMain371` ~180 lines CSS — class never added to DOM | Delete entire block |
| R04 | `cursorGlow` touchmove JS on mobile; element CSS-hidden | Guard: `matchMedia('(hover:none)')` |
| R05 | `bgMove` grid animation on mobile (GPU layer) | `@media(max-width:760px){.game::before{animation:none}}` |
| R06 | FSRS alias pairs: 4 fields have two spellings active | Normalize in `loadState()`; canonical reads only downstream |
| R07 | `heroSub` CSS 12+ definitions | One declaration |
| R08 | 35 `@media(max-width:760px)` blocks | One authoritative block appended last |
| R09 | Card ID resolution: 4 patterns used. Only `canonicalCardId()` correct | `canonicalCardId()` everywhere |
| R10 | `domainTitle` defined 3× (48px→30px→hidden). Only hidden matters | One hidden declaration |
| R11 | `updateKpis` 7-layer wrapper; vFix5+8 both write KPIs | Collapse to single function |
| R12 | `progress.seen` boolean written redundantly from `seen_count` | Remove; use `seen_count > 0` directly |

**R13–R21 (2026-05-29 cascade entries — caused the failed afternoon):**

| ID | Issue | What it broke |
|----|-------|--------------|
| R13 | `panel.innerHTML` rebuild (line 8506) orphans `#limitlessHomeDeckFile` change listeners from `wire()` | Upload overlay never auto-closes; vFix42b document listener attempted + reverted (R17) |
| R14 | `ensureSettingsButton()` defined but never called — dead function | vFix42c tried to call it via dead `window.normalizeHud` wrapper |
| R15 | Injected elements default `order:0` sort above `.hero` (order:1) | Logo appeared below stats. Fixed by vFix42a `order:-1` ✅ |
| R16 | `wire()` `stopImmediatePropagation` at element capture kills bubble-phase listeners | vFix43a attempted workaround; reverted (caused freeze) |
| R17 | vFix42b: unnecessary global `change` listener on `document` | Fired on every `<input>` change in app. Reverted. |
| R18 | vFix42c: `window.normalizeHud` wraps local closure (never on `window`) | Wrapper dead from line 1; always `undefined` |
| R19 | vFix42c: `.hudStats371` hidden on mobile | HUD flex collapse; tap targets shifted |
| R20 | vFix42c: settings opened without setting `settingsReturnMode` | After settings, always lands on home not game |
| R21 | vFix41: another `updateKpis` wrapper (layer 10) | Risk of silent failure; click-freeze existed pre- and post-vFix41 |

---

## SECTION 9 — NON-NEGOTIABLES

### 9A — Code rules (all 10 active)
1. One feature per prompt. Spec before code. Pre-mortem every `onclick` change.
2. Never edit inline HTML/JS. Append only before `</body></html>`.
3. Never cross-push between `cozy-arcade-app.git` and `cozy-arcade-app-PHASE2.git`.
4. SW cache bump mandatory in same commit as any fix to broken live app.
5. No new `updateKpis` wrappers. New stats → consolidated rewrite.
6. Verify `typeof window.X === 'function'` before wrapping via `window.X`.
7. Set `settingsReturnMode` before opening settings from any game screen.
8. Count onclick handlers before patching any game button.
9. Never call `home()` on a timer post-import. `importObject()` already refreshes state.
10. Never intercept `window.toast` for flow control. Fire-and-forget only.

### 9B — Must never regress
- HUD: single row, home button reachable on 390px screen
- Prompt AI: visible in settings, not broken by drawer changes
- Import/Export: JSON + CSV, three modes (deck / progress / deck+progress)
- FSRS v5: `rate()` → `rateCard()` → progress written correctly
- Undo: Cmd+Z / shake, 5-deep stack
- Neural Atlas: constellation renders; `na-` IDs; CSS scoped to `#atlas`; RAF stops on `#atlas.hidden`
- `naLaunchSysReview()`: use for any system-filtered study launch
- Atlas data: reads `window.appCards()` + `window.phase3State.progress` live — never localStorage
- Hunter/sword animation: identity of the app
- `runFSRSValidation()` → 17/17 always

### 9C — Structural constraints (work with, not against)
- 1,249 cards: any synchronous full-card operation causes visible freeze on mobile
- `patchButtons()` resets `#startSolo.onclick` on every `home()` call — by design
- `panel.innerHTML` at line 8506 orphans direct listeners — use event delegation

---

## SECTION 10 — 41 CONFIRMED WORKING FEATURES (b2f1a9f)

All must not regress. Source: MOBILE_RECTIFIER_PLAN.md full audit.

```
Solo Runner (FSRS + 4-col choices)          Knowledge Expansion (orbs)
FSRS v5 spaced repetition (17/17)           Neural Atlas inline
Atlas: Pin/Bury from card detail (vA10)     Atlas: Study filtered session (vA9)
Atlas: Personal note textarea (vA11)        Import JSON/CSV
Export deck + FSRS progress                 Undo 5-deep (Cmd+Z / shake)
PWA offline (sw.js v4)                      HUD single-row compact
Board Readiness Map (per-system bars)       Session size picker 10/25/50/All
Board Pearl auto-shown in reveal            ABIM countdown chip in hero
Swipe-to-rate gesture                       Weak-system launch chips
Game tap → file picker (no deck)            Warm home / cold game palette
CSS variable foundation (Phase A)           One mobile layout block (Phase B)
HUD simplified (C1)                         Energy Shift → ⚡ chip (C2)
Prompt AI collapsible (C4)                  KPI 2-col mobile (C3/C5)
Import overlay ✕ + upload (C6)              iOS select guard (C7)
How to Play collapsible                     ArrowDown glitch fixed
Advanced Merge → status chips               Prompt AI v3 schema (3 locations)
Auto-export on exit                         Card detail scoped to sidebar
← Back pill in card detail                  Scroll position save/restore
Game Complete → home fixed                  Continue button in end modal
Atlas tabs (⬡ Atlas / ≡ Review Cards)       SYS upload verified
Shadow Dungeon dual-event fix
```

**Cut in 2026-05-29 rectifier** (re-add one per session after gate):
`vFix12` session stats · `vFix14` auto-explain · `vFix15` leech badge · `vFix17` today stat
`vFix18` pin-in-reveal · `vFix19` later-flag · `vFix20` daily goal · `vFix21` quick note
`vFix24` pacing chip · `vFix25` drill weak · `vFix26` confetti · `vFix28` heatmap
`vFix29` session timer · `vFix30` keyboard · `vFix31` cram · `vFix32` per-sys cram
`vFix33` keyword search · `vFix34` accuracy badges · `vFix35` pinned drill
`vFix36` tab title · `vFix37` audio · `vFix38` pearls drill · `vFix39` backup toast
`vFix40` calendar · `vFix41` ABIM score

---

## SECTION 11 — LAYOUT MAP (critical dimensions)

*Source: LAYOUT_MAP_2026-05-27.md. Before ANY layout/CSS change, compare against this.*

```
HUD (top bar, fixed):
  height: 48px
  z-index: 100
  flex-row: [home] [spacer] [streak] [energy] [score] [pause]

promptBox (question card):
  max-height: 20vh (mobile)
  inset: below HUD (48px) + soloTrack

soloTrack (runner track):
  inset: calc(22vh + 58px) 0 0   ← canonical, last-wins in current file
  (11 prior definitions all superseded by this)

orbArena (KE game field):
  inset: 338px 0 0 (mobile, #orbArena ID selector — beats all class rules)
  defined by: vFix23

Atlas topbar:
  height: 48px (matches game HUD)
  z-index: 300
  order: [← Home] [⬡ Atlas] [≡ Review Cards] [spacer] [Import] [Export] [Deck+Prog]
```

---

## SECTION 12 — THE ONE-PROMPT CLEAN REBUILD

*For use on `clean-rebuild-80` branch or any clean-slate AI session.*

```
SYSTEM PROMPT — COZY ARCADE CLEAN REBUILD

You are writing index.html for Cozy Arcade Board Prep — Medicine from scratch.
Single-file app. No framework. No build step. No separate JS files.
1,249 ABIM internal medicine flashcards. Primary device: iPhone.

REFERENCE FILES (you have been given):
  index.html (13,689 lines — current working file, use as reference only)
  FSRS_V5_IMPLEMENTATION_PROMPT.md (test vectors + W array)
  REDUNDANT_CODE_AUDIT.md (R01–R21 — structural debts to eliminate)
  ULTIMATE_GOALS.md (invariants)
  COZY_ARCADE_PROJECT_STATUS_2026-05-29.md (41 confirmed working features)
  FAILED_ATTEMPTS_2026-05-29.md (10 patterns that break the app)
  LAYOUT_MAP_2026-05-27.md (dimension constraints)

TARGET:
  ~10,950 lines (80% of 13,689)
  Zero patch IIFEs — all code in single integrated function bodies
  One :root block
  One @media(max-width:760px) block
  One soloTrack inset declaration: calc(22vh + 58px)
  updateKpis() as single function (not 7-layer chain)
  canonicalCardId() for all card ID resolution
  No .gameMain371 CSS (R03 — 180 dead lines)
  No progress.seen write (R12 — use seen_count > 0 directly)
  FSRS aliases normalized in loadState() only

NON-NEGOTIABLE REQUIREMENTS:
  1.  window.runFSRSValidation() → 17/17
  2.  window.runCozySmokeTests() → 6/6
  3.  All 41 ✅ features from project status present
  4.  All ⏪ reverted features absent
  5.  localStorage keys exact:
        soloStudyingState_v1757 · cozy_arcade_progress_v1
        cozyQuestionSeconds351 · bionicOn_v1751523
        cozy_arcade_limitless_cards_v1 · cozy_arcade_persona_v1
        cozy_dailygoal_v20 · cozy_audio_v37
        cozy_backup_v39 · cozy_cal30_v40
  6.  Protected functions untouched:
        rate() rateCard() advance() fullCard() saveState()
        updateKpis() canonicalCardId() importDeck() naLaunchSysReview()
  7.  Atlas: all IDs na- prefixed · CSS scoped to #atlas · RAF stops on hidden
  8.  Atlas reads window.appCards() + window.phase3State.progress live
        NEVER reads localStorage for atlas data
  9.  FSRS W array (19 elements):
        [0.4072,1.1829,3.1262,15.4722,7.2102,0.5316,1.0651,0.0589,
         1.5330,0.1544,0.9956,1.9783,0.1542,0.4683,0.5825,0.0000,
         2.7869,0.4527,0.6632]
  10. Hunter/sword animation preserved
  11. !important only when you can name the specific cascade conflict

OUTPUT: Single complete index.html. No explanation. No markdown.
Start: <!DOCTYPE html>   End: </html>
```

---

## SECTION 13 — NEURAL ATLAS [THEORETICAL]

*No code exists for these proposals. Post-ABIM only.*

### Working now (confirmed)
- Embedded `<div id="atlas" class="screen hidden">` in index.html
- Canvas: `id="na-canvas"` — system nodes, uniform size, single color
- API: `window.showAtlasScreen()` / `window.hideAtlasScreen()`
- Data: live from `window.appCards()` + `window.phase3State.progress`
- PHASE2 has (not yet merged): tag filter, sortable columns, tag/sys toggle

### Obsidian graph vision [THEORETICAL]

**The $10M feature:** Nodes by system. Edges by crossover cards. Size by mastery. Color by retention. This is Obsidian for medical knowledge.

```javascript
// Node radius by card count
const radius = 12 + Math.sqrt(sys.cards.length) * 3;

// Node color by mastery
const color = mastery >= 0.8 ? '#22c55e'   // green — owned
            : mastery >= 0.6 ? '#f59e0b'   // amber — close
            : seenCount > 0  ? '#ef4444'   // red — struggling
            :                  '#475569';  // gray — unseen

// Edge: cards shared between two systems
// thickness = shared card count
```

**"oh my hours" home screen [THEORETICAL]:**
Seven dots. Sun–Sat. Filled = studied that day. That's it.
No heatmap grid. No 40 widgets. One filled dot = one day = one felt thing.
The pull is in the simplicity.

**Implementation order (post-August 2026, one per session):**
1. Color nodes by mastery — all data exists, no new structures
2. Size nodes by card count — simple radius formula
3. Hover tooltip — reuse sidebar KPI data
4. Port tag filter + sortable columns from PHASE2
5. Edge rendering for crossover cards
6. "oh my hours" 7-dot home replacement for heatmap
7. Spring physics (force-directed layout)

---

## SECTION 14 — SESSION FEEDBACK MESSAGES

*Replaces: Clauding / Levitating / Composing / Photosynthesizing / Sprouting / Marinating / meandering*
*Keeps: ↑ Energy · ↓ Energy (token direction — these stay)*

### Status vocabulary

**Orienting:**
```
Locked in.          Reading the damage.       Clocking the situation.
Last session left marks. Reading them now.    Scoping the file.
```

**Building:**
```
↑ Energy  Grinding...          ↑ Energy  Cooking...
↑ Energy  Cooking (no cap)...  ↑ Energy  Crushing it...
↑ Energy  In my bag...         ↑ Energy  Actually building...
↑ Energy  Running it back...   ↑ Energy  Doing the math...
```

**Deep / long task:**
```
↓ Energy  Deep in the sauce...      ↓ Energy  Boss fight...
↓ Energy  Going layer by layer...   ↓ Energy  Mapping the whole thing...
↓ Energy  Not skipping steps...     ↓ Energy  One source of truth or it doesn't count...
```

**Almost done:**
```
ALMOST AT THE NEXT LEVEL.
Final pass before ship.
One more check.
Nearly cooked.
On the verge.
THE LIMIT DOESN'T EXIST.
NEXT LEVEL LOADING...
```

**Shipped:**
```
Shipped. [hash]. We move.       Checkpoint saved. [hash].
W. Pushed. Next.                Locked in and shipped.
Committed [hash]. <outcome>.
```

**Gate passing:**
```
17/17. We run this.    6/6. Clean.    Gate passed. Ship it.
```

**Gate failing:**
```
Not yet. Find the break.    Gate blocked. Don't push.    One test is lying. Find it.
```

**Rollback / recovery:**
```
Respawning...      Back to base. Build smarter.
We respawn. We go again.      Last checkpoint: [commit].
```

**SW cache specifically:**
```
Code live. Cache not cleared. Bump sw.js CACHE → same commit → push.
Cache cleared. Live in 1 reload.
```

**Pre-mortem:**
```
Naming the ways this breaks before it does.
Counting the onclick handlers.
Reading the kill list.
What goes wrong first?
```

**Context pressure:**
```
Almost at the limit.        THE LIMIT DOESN'T EXIST — but the context window does.
Cutting noise. Keeping signal.
```

**Single-feature discipline:**
```
One feature. One prompt. No detours.
Spec first. Code second.
Pre-mortem before the patch.
```

**Energy state suffixes** (replace "still thinking" / "almost done"):
```
⚡ Locked   — deep focus, long task
🔁 Loop     — iterating
✓ Clean     — validated
⛔ Blocked  — constraint hit, naming it
↑ Energy    — fast/building
↓ Energy    — slow/deep analysis
```

---

## SECTION 15 — PROJECT GOALS

### Now → August 2026
| Priority | Goal | Rule |
|----------|------|------|
| 0 | App works on iPhone after every push | SW cache bump same commit as every fix |
| 1 | FSRS accuracy | 17/17 always |
| 2 | Re-add cut features | One per session, gate after each |
| 3 | Mobile UX Phase C→D | C1→C7 in order, one per session |
| 4 | Atlas mastery color + node sizing | After Phase C stable |
| 5 | P8 CSP headers | vercel.json |

### Post-August 2026
| Priority | Goal |
|----------|------|
| Clean rebuild | Branch `clean-rebuild-80` — 80% file, zero IIFEs |
| Atlas | Obsidian force-directed graph (Section 13) |
| Home | "oh my hours" 7-dot design |
| iOS | Capacitor scaffold |
| M2 | Stripe |

---

## SECTION 16 — SESSION START CHECKLIST

```
1.  git log --oneline -5           confirm HEAD
2.  wc -l index.html               confirm line count
3.  graphify update .              sync graph (no API cost)
4.  State the ONE feature today
5.  Write spec before code
6.  After change: runFSRSValidation() → 17/17
7.  Fixing broken live app: bump CACHE in sw.js same commit
8.  Gate passes → push
```

---

*V3 — 2026-05-30 · Branch: clean-rebuild-80*
*Corrects 4 V2 errors. Adds 3 V2 omissions. All 41 features documented. R01–R21 complete.*
*Supersedes MASTER_PROMPT_V2.md*
