# COZY ARCADE BOARD PREP — MASTER CONTEXT PROMPT V2
*2026-05-29 · Built from: GOAL.md · RECTIFIER_PLAN_2026-05-29.md · FAILED_ATTEMPTS_2026-05-29.md · REDUNDANT_CODE_AUDIT.md · MOBILE_RECTIFIER_PLAN.md · ULTIMATE_GOALS.md · COZY_ARCADE_PROJECT_STATUS_2026-05-29.md*
*Zero hallucination. All facts sourced. Theoretical sections labeled [THEORETICAL].*

---

## ⚡ HOW THIS PROMPT WORKS

Paste this entire document at the start of any new AI session — Claude, GPT, Gemini, or otherwise.
It replaces all prior context and gives the AI full working state in one shot.

**Session contract:**
- One feature per prompt. Write the spec before the code.
- Read the FAILED ATTEMPTS table (Section 2) before proposing anything.
- `runFSRSValidation()` → 17/17 before any push. No exceptions.
- Any fix to a live broken app → bump `CACHE` in `sw.js` in the same commit.

---

## SECTION 1 — WHO AND WHAT

**Developer:** US internal medicine resident. Preparing for ABIM boards, August 2026.
**App:** Cozy Arcade Board Prep — Medicine. Single-player gamified ABIM flashcard system.
**Core loop:** FSRS spaced repetition surfaces the right card → game makes it worth opening at midnight post-call.
**Constraint:** Single HTML file. No build step. No framework. Study tool first, engineering project second.

**Live URLs:**
- Main app: `malevolentmicrobes-stack.github.io/cozy-arcade-app`
- Phase 2 (separate repo, never cross-push): `malevolentmicrobes-stack.github.io/cozy-arcade-app-PHASE2`

---

## SECTION 2 — ⛔ FAILED ATTEMPTS (READ BEFORE WRITING CODE)

*Full detail: `FAILED_ATTEMPTS_2026-05-29.md`. Every item below caused a revert, a freeze, or hours of wasted work. Source: git log + commit diffs.*

| # | What was tried | What broke | Commits |
|---|---------------|------------|---------|
| 1 | Another `updateKpis` wrapper for ABIM score tile (vFix41) | Solo-click freeze; 5 revert commits; ~2hr lost | `5daef88` → 5 reverts |
| 2 | 3 features in one prompt (vFix42: logo + overlay-close + HUD settings) | Overlay-close + HUD settings broken; revert required all 3 | `f540bcf` → `81ae55e` |
| 3 | `home()` on a 900ms timer post-import (vFix43a) | Scroll-jump freeze on mobile; `importObject()` already refreshes state | `dfd488b` → `6d7e70b` |
| 4 | `window.toast` interception to show deck-upload overlay (vC6) | Game buttons appeared permanently broken; any "import" toast triggered full-screen overlay | → `b4364b3` |
| 5 | `window.normalizeHud` wrap of a local IIFE closure | Wrapper was dead from line 1; `window.normalizeHud` is always `undefined` | `f540bcf` → `81ae55e` |
| 6 | Diagnosing Solo-click freeze without counting onclick handlers | Wrong root cause patched; 7 handlers compete on `#startSolo`; `patchButtons()` resets on every `home()` | multiple |
| 7 | Pushing fixes without bumping SW cache | Fixed code invisible; users saw broken version for 1–2 extra reloads each time | `d53dbeb` (no bump) |
| 8 | In-game settings button without setting `settingsReturnMode` | User always lands on home instead of back in game after settings | `f540bcf` → reverted |
| 9 | Hiding `.hudStats371` on mobile to simplify HUD | HUD flex collapse; home button tap target shifted off-screen | `f540bcf` → reverted |
| 10 | Assuming post-import refresh was missing | Called `home()` again; `importObject()` already calls `updateKpis()` | `dfd488b` → reverted |

### Pattern recognition — why the same failures recur

Reviewing all prompts across sessions reveals three repeating loops:

**Loop A — "Fix the button"**
Frequency: 4+ sessions. Symptom: game button doesn't respond. Prompt: patch the onclick. Actual cause: `patchButtons()` reset the handler on the last `home()` call. The patch adds yet another handler to the 7-layer pile. Nothing is fixed.
→ **Correct response:** `getEventListeners(document.getElementById('startSolo'))` in DevTools first.

**Loop B — "The app looks broken after push"**
Frequency: 3 separate cache bust commits. Symptom: pushed fix, live site unchanged. Prompt: another fix. Actual cause: SW serving stale cache. Fix was live — just cached.
→ **Correct response:** Bump `CACHE` in `sw.js` in the same commit as every fix to a broken app.

**Loop C — "Add one more thing to updateKpis"**
Frequency: 9 wrappers built across sessions. Symptom: new home stat wanted. Prompt: wrap `window.updateKpis`. Result: silent failures compound; wrapper chain is now 9 deep; any error drops all inner results.
→ **Correct response:** New stats go into a single consolidated `updateKpis` rewrite, not another outer wrapper.

---

## SECTION 3 — ARCHITECTURE

**Single file:** `index.html`. All patches are `<style id="vXXX">` / `<script id="vXXX">` blocks appended before `</body></html>`. Never edit inline — always append.

**Current file state (commit `b2f1a9f`, 2026-05-29):**

| Metric | Value | Problem |
|--------|-------|---------|
| Lines | 13,689 | ~80% of this is addressable debt |
| `<style>` + `<script>` blocks | 88 | Each one fought the previous |
| `!important` declarations | 1,126 | No value has a single source of truth |
| `@media (max-width: 760px)` blocks | 35 | Last-in-file wins; earlier 34 are noise |
| `.soloTrack inset` definitions | 11 | Values: 290→258→245→250→230→240→calc() |
| Dead CSS (`.gameMain371` block) | ~180 lines | Targets a class never added to DOM |
| `updateKpis` wrapper chain depth | 7 layers | vFix5 writes wrong values; vFix8 overwrites |
| SW cache | `cozy-arcade-v4` | sw.js — bump to v5, v6… on each broken-app fix |

**Three screens:**
1. `#home` — stats, launch buttons, ABIM countdown
2. `#solo` / `#domain` — Solo Runner / Knowledge Expansion games
3. `#atlas` — Neural Atlas constellation graph (embedded inline)

**Settings drawer** — slides in from right, never its own screen.

---

## SECTION 4 — LOCALSTORAGE CONTRACT (PERMANENT — NEVER RENAME)

```
soloStudyingState_v1757          active game session state
cozy_arcade_progress_v1          FSRS progress per card (canonical)
cozyQuestionSeconds351           timer setting
bionicOn_v1751523                bionic reading toggle
cozy_arcade_limitless_cards_v1   deck card data
cozy_arcade_persona_v1           persona setting
```

These keys are in production. Renaming any one destroys existing user progress.

---

## SECTION 5 — PROTECTED FUNCTIONS (WRAP OUTER ONLY, NEVER REPLACE INTERNALS)

```javascript
rate()             // FSRS core — never touch internals
rateCard()         // writes progress — never touch
advance()          // next card — never touch
fullCard()         // reveal toggle — never touch
saveState()        // localStorage write — never touch
updateKpis()       // DOM updates — outer wrapper only; no new wrappers
canonicalCardId()  // card ID resolution — use this everywhere, no inline fallbacks
importDeck()       // deck import — never touch
```

---

## SECTION 6 — FSRS GATES (MUST PASS BEFORE EVERY PUSH)

```javascript
window.runFSRSValidation()   // → 17/17
window.runCozySmokeTests()   // → 6/6
```

Run in browser console. Both must pass. If either fails: fix the failure, re-run, then push.

---

## SECTION 7 — CANONICAL CARD SCHEMA

**14 canonical export fields** — only these appear in any deck export:
```
card_id  qid  sys  diagnosis  presentation  one_thing
educational_objective  board_trigger  explanation  why_not_others
test  quick_recall  cloze_source_text  cloze_enabled  tags
```

**Stripped from all exports** (alias fields — must never appear in output JSON):
```
level_1_presentation  level_2_three_second_exposure  prompt
clinical_vignette_summary  answer  subject  qid_unique
treatment  next_step  seen  reviewed  correct  rating  last
```

`canonicalizeCard(raw, {mode:'export'})` enforces this. Use it. Don't inline the logic.

---

## SECTION 8 — REDUNDANCY AUDIT SUMMARY

*Full detail: `REDUNDANT_CODE_AUDIT.md`. These are the confirmed structural debts.*

| ID | What | Lines | Fix (clean rebuild only) |
|----|------|-------|--------------------------|
| R01 | vFix5 writes wrong KPI values; vFix8 immediately overwrites. Two DOM-write passes per cycle. | ~15083 | Collapse vFix5+8 into one accurate function |
| R02 | `soloTrack inset` defined 11 times with 7 different values | scattered | One declaration: `calc(22vh + 58px)` |
| R03 | `.gameMain371` CSS block (~180 lines) — class never added to any DOM element | ~12026 | Delete entire block |
| R04 | `cursorGlow` touchmove JS runs on mobile; element is CSS-hidden | ~430 | Guard with `matchMedia('(hover:none)')` |
| R05 | `bgMove` grid animation runs on mobile (GPU compositor layer) | line 3 | `@media(max-width:760px){.game::before{animation:none}}` |
| R06 | FSRS aliases: 4 field pairs both active in data (`seen_count`/`seen`, `next_due_at`/`due`, etc.) | everywhere | Normalize on `loadState()`; canonical reads only downstream |
| R07 | `heroSub` CSS defined 12+ times | scattered | One definition |
| R08 | 35 `@media(max-width:760px)` blocks | scattered | One authoritative block appended last |
| R09 | Card ID resolution: 4 different patterns used across file | scattered | `canonicalCardId()` everywhere |
| R10 | `domainTitle` defined 3× (48px, 30px@820px, then hidden) | scattered | One hidden declaration |
| R11 | `updateKpis` 7-layer wrapper; vFix5 and vFix8 both write KPIs | vFix5–vFix25 | Collapse to single function |
| R12 | `progress.seen` boolean written from `seen_count`; redundant field | ~11005 | Remove; use `seen_count > 0` directly |

---

## SECTION 9 — NON-NEGOTIABLES (MASTER SUBSECTION)

*Compiled from all source files. These override any feature request, any user suggestion, any AI proposal.*

### 9A — Code rules
1. **One feature per prompt.** Spec first, code second. Pre-mortem before any `onclick` change.
2. **Never edit inline HTML/JS.** Append only, before `</body></html>`.
3. **Never cross-push** between `cozy-arcade-app.git` and `cozy-arcade-app-PHASE2.git`.
4. **SW cache bump is mandatory** in the same commit as any fix to a broken live app.
5. **No new `updateKpis` wrappers.** New stats → consolidated rewrite.
6. **Verify `typeof window.X === 'function'`** before wrapping anything via `window.X`.
7. **Set `settingsReturnMode`** before opening settings from any game screen.
8. **Count onclick handlers** before patching any game button. (`getEventListeners` in DevTools.)

### 9B — Must never regress
- HUD top bar: single row, home button reachable on 390px phone
- Prompt AI: visible in settings, not broken by drawer patches
- Import/Export: JSON + CSV, all three modes (deck / progress / deck+progress)
- FSRS v5 scoring: `rate()` → `rateCard()` → progress written correctly
- Undo: Cmd+Z / shake, 5-deep stack, toast shows "Undone (N more)"
- Neural Atlas: constellation renders; all IDs `na-` prefixed; CSS scoped to `#atlas`; RAF stops when `#atlas.hidden`
- Hunter/sword character animation: identity of the app
- `runFSRSValidation()` → 17/17 always

### 9C — Structural constraints (accepted, do not "fix")
- 1,249 ABIM cards in localStorage. The `updateKpis` chain processes all of them on every call. Any synchronous blocking operation on the full card set causes visible freeze on mobile.
- `patchButtons()` resets `#startSolo.onclick` on every `home()` call. This is by design in the base app. Work with it; don't fight it with more patches.
- `panel.innerHTML` rebuild at line 8506 orphans direct-element listeners. Use event delegation or `data-*` state attributes instead.

---

## SECTION 10 — CURRENT WORKING FEATURES (commit `b2f1a9f`)

| Feature | In file |
|---------|---------|
| Solo Runner — FSRS + 4-col choices | ✅ |
| Knowledge Expansion — orbs | ✅ |
| FSRS v5 spaced repetition (17/17) | ✅ |
| Neural Atlas inline (constellation + browser) | ✅ |
| Atlas: Pin/Bury from card detail | ✅ |
| Atlas: Study filtered session from card | ✅ |
| Atlas: Personal note textarea per card | ✅ |
| Import JSON/CSV | ✅ |
| Export deck + FSRS progress | ✅ |
| Undo 5-deep (Cmd+Z / shake) | ✅ |
| PWA offline (sw.js, cache v4) | ✅ |
| HUD single-row compact | ✅ |
| Board Readiness Map (per-system bars) | ✅ |
| Session size picker 10/25/50/All | ✅ |
| Board Pearl auto-shown in reveal | ✅ |
| ABIM countdown chip in hero | ✅ |
| Swipe-to-rate gesture | ✅ |
| Weak-system launch chips | ✅ |
| Game tap with no deck → file picker | ✅ |
| Warm home palette / cold game palette | ✅ |

**Cut in the 2026-05-29 rectifier** — re-add one per session, one per prompt, gate after each:
`vFix12` session stats · `vFix14` auto-explain · `vFix15` leech badge · `vFix17` today stat
`vFix18` pin-in-reveal · `vFix19` later-flag · `vFix20` daily goal · `vFix21` quick note
`vFix24` pacing chip · `vFix25` drill weak · `vFix26` confetti · `vFix28` heatmap
`vFix29` session timer · `vFix30` keyboard shortcuts · `vFix31` cram mode
`vFix32` per-sys cram · `vFix33` keyword search · `vFix34` accuracy badges
`vFix35` pinned drill · `vFix36` tab title · `vFix37` audio · `vFix38` pearls drill
`vFix39` backup toast · `vFix40` 30-day calendar · `vFix41` ABIM score

---

## SECTION 11 — RECTIFIER PLAN (current phase)

**Stable baseline:** `b2f1a9f` · 13,689 lines · SW cache v4 · FSRS 17/17

**Target:** ~10,500–11,000 lines (~80% of current) · zero patch IIFEs · one source of truth per value.

### Phase A — Variable foundation (no visual change)
Single `:root` block with warm/cold split:
```css
:root { --bg: #130c08; --accent: #f5c97a; --cyan: #67e8f9; }
.game { --bg: #020611; --accent: #67e8f9; }
```
Kill the two existing `:root` blocks (lines 2 and 5680) by appending one override that wins by cascade position. Delete R03 `.gameMain371` dead block (180 lines, zero runtime effect).

### Phase B — One authoritative mobile block
Replace all 35 `@media(max-width:760px)` blocks with one `<style id="cozy-mobile-v1">` appended last. Single `soloTrack inset: calc(22vh + 58px)`. Disable cursorGlow on `(hover:none)`. Disable `bgMove` animation on mobile.

### Phase C — Screen-by-screen mobile fixes (one per prompt)
- **C1** HUD: Score + Round only on mobile. Energy = transient `⚡` flash.
- **C2** KE Energy Shift: collapse to `⚡ +1 CE` badge, 1.5s fade. Remove "ENERGY SHIFT" box.
- **C3** KE card font: single `clamp(13px,3.8vw,18px)` definition.
- **C4** Prompt AI: `<details>` collapsible in settings, closed by default.
- **C5** Home bottom: Import/Export ▾ dropdown chip; 2-col KPI grid down to 320px.
- **C6** Import overlay: ✕ close + "Upload deck" shortcut inside.
- **C7** Review screen: dark pill header, Progress label in cyan, Upload/Download as icon pills.

### Phase D — Warm/cold palette (after C is stable)
Token-only change. `:root` override + `.game` override. All elements using `var(--bg)` pick up the shift automatically.

### Gate before each phase ships
```javascript
window.runFSRSValidation()   // 17/17
window.runCozySmokeTests()   // 6/6
// manual: bionic toggle · timer · solo cycle · KE orbs tappable
```

---

## SECTION 12 — THE ONE-PROMPT CLEAN REBUILD

*Use this to brief any capable AI to produce a clean `index.html` from scratch.*
*Do not attempt before August 2026 — this is a post-boards project.*

```
SYSTEM:
You are writing index.html for Cozy Arcade Board Prep — Medicine from scratch.
This is a single-file gamified ABIM flashcard app. No framework. No build step.

You have been given:
  • The current index.html (13,689 lines) as reference source
  • REDUNDANT_CODE_AUDIT.md — R01–R12 structural debts to eliminate
  • ULTIMATE_GOALS.md — invariants and protected function list
  • COZY_ARCADE_PROJECT_STATUS_2026-05-29.md — confirmed working feature list
  • FAILED_ATTEMPTS_2026-05-29.md — 10 confirmed patterns that break the app

REQUIREMENTS (non-negotiable):
1.  window.runFSRSValidation()  →  17/17
2.  window.runCozySmokeTests()  →  6/6
3.  All features marked ✅ in the project status file must be present
4.  All features marked ⏪ reverted must be absent
5.  One :root block only
6.  One @media(max-width:760px) block only
7.  canonicalCardId() used for all card ID resolution — no inline fallbacks
8.  Canonical FSRS field names only in runtime code (aliases normalized in loadState())
9.  No .gameMain371 CSS (R03 — class never added to DOM)
10. updateKpis() is a single function, not a wrapper chain
11. No !important unless you can name the specific cascade conflict it resolves
12. LocalStorage keys match exactly:
      soloStudyingState_v1757
      cozy_arcade_progress_v1
      cozyQuestionSeconds351
      bionicOn_v1751523
13. Protected functions untouched:
      rate() rateCard() advance() fullCard() saveState()
      updateKpis() canonicalCardId() importDeck()
14. All Atlas IDs na- prefixed. CSS scoped to #atlas only.
15. RAF loop stops when #atlas.hidden.
16. Hunter/sword character animation preserved.
17. FSRS v5 weights: W=[0.4072,1.1829,3.1262,15.4722,7.2102,0.5316,1.0651,
    0.0589,1.3337,0.1544,1.0070,1.9395,0.1100,0.2900,2.2700,0.1500,2.9898]
    Validate against the 17 test vectors in FSRS_V5_IMPLEMENTATION_PROMPT.md.

OUTPUT:
A single complete index.html.
No explanation. No markdown. No partial file.
Start with <!DOCTYPE html> and end with </html>.
```

---

## SECTION 13 — NEURAL ATLAS PROPOSAL [THEORETICAL]

*No code exists for this yet. These are proposals only. Do not implement before post-ABIM.*
*Current working atlas described first (data). Proposals labeled clearly.*

### What exists now (confirmed working)
- Embedded as `<div id="atlas" class="screen hidden">` inside `index.html`
- Public API: `window.showAtlasScreen()` / `window.hideAtlasScreen()`
- Canvas: `id="na-canvas"` — constellation of system nodes, uniform size, single color
- Sidebar: card browser, KPI tiles, export buttons, import pill
- Data sources: `window.appCards()` (live deck) + `window.phase3State.progress` (live FSRS data)
- RAF loop: halts when `#atlas.hidden`; `naInit()` resets on each open
- PHASE2 has (not yet in main): tag filter, sortable columns, tag/sys constellation toggle

### Obsidian-style node graph [THEORETICAL]

**Node sizing by card count:**
```javascript
// [THEORETICAL] — not in file yet
const radius = 12 + Math.sqrt(sysMap[sys].cards.length) * 3;
// Cardiology (47 cards) → radius ~32px
// Rheum (8 cards) → radius ~21px
```

**Node color by mastery:**
```javascript
// [THEORETICAL]
const mastery = correctCount / Math.max(seenCount, 1);
const color = mastery >= 0.8 ? '#22c55e'   // green
            : mastery >= 0.6 ? '#f59e0b'   // amber
            : seenCount > 0  ? '#ef4444'   // red
            :                  '#475569';  // gray (unseen)
```
All mastery data already exists in `phase3State.progress`. No new data structure needed.

**Hover tooltip:**
```
Cardiology · 47 cards · 73% mastery · 12 due today
```
Data: `sysMap[sys].cards.length` + `correctCount/seenCount` + FSRS `isDue()` count.

**Edge rendering (crossover cards):**
Cards with multiple `sys` values (e.g., `"sys": "Cards/ID"`) create edges between system nodes.
Edge thickness ∝ count of shared cards. Currently: no edges between nodes.

**Spring physics for drag:**
Replace current static RAF with a force-directed layout pass:
```javascript
// [THEORETICAL] — each frame
nodes.forEach(a => nodes.forEach(b => {
  if (a === b) return;
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.sqrt(dx*dx + dy*dy) || 1;
  const force = (dist - idealDist) * 0.03;
  a.vx += (dx/dist) * force;
  a.vy += (dy/dist) * force;
}));
```
The RAF loop already exists. This is an extension of the current render pass.

**Port from PHASE2 (available now, not yet merged):**
- `buildTagMap(prog)` — tag-grouped constellation
- Tag filter list in sidebar
- Sortable column headers (Diagnosis / Sys / Stage / Due)
- Tag pills in card detail → click to filter

**Implementation sequence** (one per session, post-August 2026):
1. Color nodes by mastery → 1 session, low risk, all data available
2. Size nodes by card count → 1 session, low risk
3. Hover tooltip → 1 session, no DOM changes to existing nodes
4. Port tag filter + sortable columns from PHASE2 → 1 session, medium risk
5. Edge rendering for crossover cards → 1 session, additive
6. Spring physics for drag → 1 session, replaces RAF math only

---

## SECTION 14 — SESSION FEEDBACK MESSAGES

*These replace the default AI status verb (Clauding / Levitating / Photosynthesizing / etc.)*
*Format kept: [symbol] [verb]… (Ns · ↑/↓ tokens · [state])*
*KEEP: ↑ Energy · ↓ Energy (token direction indicators — they stay)*

### The replacement vocabulary

**Startup / orienting:**
```
Locked in.
Reading the damage.
Scoping the wreckage.
Clocking the situation.
Last session left marks. Reading them now.
```

**Working / mid-task:**
```
Grinding...
Cooking...
Cooking (no cap)...
Crushing it...
In my bag...
On the grind...
Building...
Actually building...
Running it back...
Running the numbers...
Doing the math...
Cooked something. Checking it.
```

**Deep analysis / long task:**
```
Locked in (no interruptions)...
Deep in the sauce...
This one's a boss fight...
Mapping the whole thing...
Auditing every layer...
Going layer by layer...
Not skipping steps...
One source of truth or it doesn't count...
```

**Almost done:**
```
Almost at the next level.
Final check before ship.
One more pass.
Nearly cooked.
On the verge.
Almost at the limit — the limit doesn't exist.
NEXT LEVEL LOADING...
```

**Committed / shipped:**
```
Shipped. [hash]. Next.
Committed [hash]. <outcome>. We move.
Checkpoint saved. [hash].
W. Shipped. Next step — let's go.
Locked in and pushed.
```

**Validation passing:**
```
17/17. We run this.
6/6. Clean.
Gate passed. We move.
FSRS intact. Ship it.
```

**Validation failing:**
```
Not yet. Find the break.
Gate blocked. Don't push.
Something's off. Diagnose first.
One test is lying. Find which one.
```

**Broken app / rollback:**
```
Respawning...
Back to base. Build smarter.
Rolled back. Reading why.
Last checkpoint: [commit]. Loading.
We respawn. We go again.
```

**SW cache issue specifically:**
```
Code is live. Cache isn't cleared yet.
Bump CACHE in sw.js → same commit → push.
Cache cleared. Live in 1 reload.
```

**Waiting on user:**
```
Your call.
Ball's in your court.
Reading the room.
One feature at a time — which one?
```

**Pre-mortem running:**
```
Naming the ways this breaks before it does.
What goes wrong first?
Counting the onclick handlers.
Reading the failure log.
Checking the kill list.
```

**Context limit approaching:**
```
Almost at the limit.
The limit doesn't exist — but the context window does.
Compressing. Staying focused.
Cutting noise. Keeping signal.
```

**Single-feature discipline check:**
```
One feature. One prompt. No detours.
Spec first. Code second.
Writing the pre-mortem before writing the patch.
```

**Energy states (replaces the "still thinking" / "almost done" suffix):**
```
↑ Energy    (fast / building)
↓ Energy    (slow / deep analysis)
⚡ Locked   (deep focus, long task)
🔁 Loop     (iterating)
✓ Clean     (validated)
⛔ Blocked  (hit a constraint — naming it)
```

### For the app's in-game fixed top bar [THEORETICAL]
*If a status bar is added to the game HUD, use these during card loading / transitions:*
```
Loading next card...
Shuffling the deck...
FSRS says: now.
Your weakest system is waiting.
Board pearl incoming.
Rare card unlocked.
Streak intact. Keep going.
You studied yesterday. Momentum is real.
N cards until the next checkpoint.
```

---

## SECTION 15 — PROJECT GOALS (priority order)

### Now → August 2026
| Priority | Goal | Rule |
|----------|------|------|
| 0 | App stays working on iPhone after every push | SW cache bump same commit as every fix |
| 1 | FSRS accuracy — right card, right time | `runFSRSValidation()` → 17/17, always |
| 2 | Re-add cut features (vFix12–vFix41) | One per session. Gate after each. |
| 3 | Mobile UX — Phases A→D | C1→C7 in order, one per session |
| 4 | Neural Atlas: mastery color + node sizing | After C is stable |
| 5 | P8 CSP headers | `vercel.json` |

### Post-August 2026
| Priority | Goal |
|----------|------|
| iOS1 | Capacitor scaffold — wraps current HTML natively |
| M2 | Stripe Payment Link |
| Clean rebuild | 80% of current file, zero patch IIFEs, one source of truth per value |
| Atlas | Full Obsidian force-directed node graph (Section 13) |
| Multi-user | Post-match, post-ID fellowship |

---

## SECTION 16 — SESSION START CHECKLIST

Every session, in order:
```
1. git log --oneline -5             confirm current HEAD
2. wc -l index.html                 confirm line count
3. graphify update .                sync graph (no API cost)
4. State the ONE feature for today
5. Write the spec before any code
6. After code change: runFSRSValidation() → 17/17 in console
7. If fixing broken live app: bump CACHE in sw.js in same commit
8. Push only after gate passes
```

---

*V2 — 2026-05-29*
*Supersedes MASTER_PROMPT_2026-05-29.md*
*Source files: all listed in header. Zero hallucination. [THEORETICAL] sections labeled.*
