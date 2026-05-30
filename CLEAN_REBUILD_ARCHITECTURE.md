# Clean Rebuild Architecture — cozy-arcade-app
*Branch: clean-rebuild-80 · Target: ~10,950 lines (80% of 13,689)*
*2026-05-30 · Post-ABIM build reference*

---

## Principle

One source of truth for every value.
No patch IIFEs. No wrapper chains. No `!important` arms race.
Every function does one thing. Every CSS rule has one address.

---

## Target File Structure

```
index.html (~10,950 lines)
│
├── [1]   DOCTYPE + <html><head>
├── [2]   <meta> + manifest + SW registration (~15 lines)
├── [3]   ════ SINGLE :root BLOCK ════ (~40 lines)
│           --bg, --panel, --accent, --cyan, --gold, --warm-bg, --warm-accent
│           .game override (cold palette)
│           #atlas override (neutral dark)
│
├── [4]   ════ BASE CSS ════ (~600 lines)
│           Reset, layout primitives, screens, HUD (48px fixed)
│           .hero, .homeWrap, .kpis (2-col grid, mobile-ready)
│           Solo + KE game elements
│           Atlas (#atlas, na-* scoped)
│           Settings drawer
│           Animations (bgMove disabled on mobile HERE, once)
│
├── [5]   ════ SINGLE MOBILE BLOCK ════ (~120 lines)
│           @media(max-width:760px) — one block, all mobile rules
│           soloTrack: calc(22vh + 58px) — single declaration
│           orbArena: #orbArena inset — single declaration
│           cursorGlow: display:none on (hover:none) — single declaration
│
├── [6]   ════ HTML BODY ════ (~400 lines)
│           #home screen
│           #solo screen
│           #domain screen
│           #atlas screen (na-* IDs)
│           Settings drawer
│           Modals (pause, end, modal)
│
├── [7]   ════ CORE DATA ════ (~80 lines)
│           FSRS W array (19 elements)
│           localStorage keys (constants)
│           Card schema field lists
│           Persona names
│
├── [8]   ════ STATE ════ (~120 lines)
│           phase3State, currentState(), saveState(), loadState()
│           loadState() normalizes ALL aliases on read (one place)
│           canonicalCardId() — single definition
│
├── [9]   ════ FSRS ENGINE ════ (~200 lines)
│           rate(), rateCard(), isDue(), isSeen()
│           getStudyPool() with new_first bucket order
│           runFSRSValidation() — 17/17 test vectors
│
├── [10]  ════ DECK + IMPORT/EXPORT ════ (~300 lines)
│           importDeck(), canonicalizeCard(), exportDeckWithProgress()
│           progressPayload(), backupPayload(), fullGameStatePayload()
│           parseJsonLoose(), parseCsv()
│
├── [11]  ════ GAME LOGIC ════ (~500 lines)
│           Solo Runner: startSolo(), renderSolo(), selectSolo(), advance()
│           Knowledge Expansion: startDomain(), renderDomain(), positionOrbs()
│           Shared: rate(), fullCard(), pauseGame(), resumeGame()
│           home() — single definition, single onclick per button
│
├── [12]  ════ NEURAL ATLAS ════ (~800 lines)
│           naInit(), naRender() RAF loop
│           buildSysMap(), buildTagMap() (from PHASE2)
│           Sidebar: renderTable(), card detail, KPIs
│           showAtlasScreen(), hideAtlasScreen()
│           naLaunchSysReview() — protected, single definition
│
├── [13]  ════ HOME UI ════ (~400 lines)
│           updateKpis() — SINGLE FUNCTION (not 7-layer chain)
│             reads: seen_count, reviewed_count, next_due_at (canonical)
│             writes: all KPI tiles in one pass
│           Board Readiness Map
│           Session size picker
│           ABIM countdown chip
│           Weak-system chips → naLaunchSysReview()
│
├── [14]  ════ REVEAL UI ════ (~300 lines)
│           Board Pearl injection (one_thing)
│           Swipe-to-rate gesture
│           Undo stack (5-deep)
│
├── [15]  ════ SETTINGS DRAWER ════ (~200 lines)
│           Bionic toggle (bionicOn_v1751523)
│           Timer (cozyQuestionSeconds351)
│           Prompt AI collapsible (<details>)
│           How to Play collapsible
│           Import/Export buttons
│
├── [16]  ════ PWA ════ (~20 lines)
│           SW registration inline
│           (sw.js is separate file — not in index.html)
│
└── [17]  </body></html>
```

---

## What Gets Eliminated vs Current File

| Current debt | Lines saved | Method |
|-------------|-------------|--------|
| R03: `.gameMain371` dead CSS | ~180 | Delete |
| R02: 10 redundant `soloTrack` definitions | ~20 | One declaration in Section [5] |
| R08: 34 redundant `@media(max-width:760px)` | ~200 | One block in Section [5] |
| R07: 11 redundant `heroSub` definitions | ~25 | One in Section [4] |
| R10: 2 redundant `domainTitle` definitions | ~10 | One (hidden) in Section [4] |
| R11: 6 redundant `updateKpis` wrapper layers | ~150 | Single function Section [13] |
| R01: vFix5 dead `getFSRSDueCounts()` | ~30 | Removed; Section [13] writes correctly once |
| R12: `progress.seen` redundant boolean | ~10 | Removed; `seen_count > 0` directly |
| R06: alias reads scattered everywhere | ~40 | All normalized in `loadState()` Section [8] |
| R04: cursorGlow touchmove on mobile | ~5 | One guard in Section [5] |
| 88 patch IIFEs → integrated code | ~400 | Code lives in its section, not appended |
| Duplicate `:root` block | ~20 | One block Section [3] |
| **Total estimated savings** | **~1,090 lines** | |

Current: 13,689 → Target: ~12,599 from structural cleanup alone.
Remaining ~1,600 lines from patch IIFE boilerplate (each IIFE has: immediately-invoked wrapper, try/catch, guards that check if element already processed, DOM-ready waits).

**Combined target: ~10,950 lines.**

---

## Build Order (phases, each gated)

### Phase 0 — Skeleton (no features, just structure)
Create `index_clean.html` with Sections [1]–[6] only.
No JS. No game logic. Just the HTML structure and CSS.
Gate: file opens in browser, screens visible, CSS renders correctly.

### Phase 1 — Core data + FSRS engine
Add Sections [7], [8], [9].
Gate: `window.runFSRSValidation()` → 17/17.

### Phase 2 — Deck + import/export
Add Section [10].
Gate: Upload JSON deck → cards load → export → JSON has canonical fields only.

### Phase 3 — Game logic
Add Section [11].
Gate: `window.runCozySmokeTests()` → 6/6. Solo + KE both playable.

### Phase 4 — Neural Atlas
Add Section [12].
Gate: Atlas opens → constellation renders → ← Home returns → RAF stops.

### Phase 5 — Home UI
Add Section [13].
Gate: KPIs show correct values. Board Readiness Map renders. Weak chips → naLaunchSysReview().

### Phase 6 — Reveal UI + Settings
Add Sections [14], [15].
Gate: Board Pearl shows. Swipe-to-rate works. Bionic toggle persists.

### Phase 7 — PWA
Add Section [16] + sw.js.
Gate: Chrome DevTools → Application → SW registered.

### Phase 8 — Full validation
All gates from Phases 1–7 pass simultaneously.
`wc -l index_clean.html` ≤ 10,950.
Zero `!important` without named conflict.
Zero patch IIFEs.

---

## CSS Architecture Rules (for this branch only)

```css
/* Specificity hierarchy — one level per concern */
:root          { /* palette tokens */ }
[data-theme]   { /* theme overrides if needed */ }
.game          { /* cold palette — scoped to game screens */ }
#atlas         { /* atlas namespace — all na- rules here */ }

/* Mobile — ONE block, appended after all layout rules */
@media (max-width: 760px) { /* authoritative mobile */ }
@media (max-width: 480px) { /* phone-only additions */ }
@media (orientation: landscape) and (max-height: 560px) { /* landscape mobile */ }
```

**Rules for this branch:**
- Zero `!important` except where a 3rd-party or browser default must be overridden
- Zero inline `style=` except for dynamic values set by JS (positions, widths)
- All colors via CSS variables — `var(--cyan)` not `#67e8f9`
- All spacing via `clamp()` or `calc()` — no magic pixel values

---

## JS Architecture Rules (for this branch only)

```javascript
// State — one object, one save function
const phase3State = { cards: [], progress: {}, mode: 'home', ... };
function saveState() { localStorage.setItem('soloStudyingState_v1757', JSON.stringify(phase3State)); }
function loadState() {
  // ALL alias normalization happens HERE and ONLY HERE
  // seen → seen_count, due → next_due_at, last → last_seen_at, reviewed → reviewed_count
  // Downstream code uses canonical fields exclusively
}

// IDs — one resolution function
function canonicalCardId(card) { return card.card_id || card.qid || card.id || ''; }
// Use this. Never inline: c.card_id || c.qid || c.id

// KPIs — one function, one pass
function updateKpis() {
  // reads phase3State.progress once
  // writes all KPI DOM elements once
  // NO outer wrappers — features add their DOM writes here
}

// onclick — one source of truth per button
// wire() sets them. Nothing else resets them.
// patchButtons() may run on home() but must not overwrite wire()'s assignments
```

---

## What This Branch Is NOT

- Not a live deployment branch — `main` remains the production branch
- Not to be merged into `main` before August 2026
- Not a place to add new features — clean rebuild only, matching current feature set
- Not to be touched by patch-append workflow — integrated code only

---

*Branch: clean-rebuild-80 · Created: 2026-05-30*
*Use MASTER_PROMPT_V3.md as the briefing for any AI working on this branch.*
