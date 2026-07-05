# Rectifier Plan — 2026-05-26 / 2026-05-27
*Cozy Arcade Board Prep-Medicine — Single-file HTML/JS (index.html ~13,300 lines)*
*Updated 2026-05-27 to include both session compactions.*

---

## Session Summary — 2026-05-26 Changes

| Commit | Change | Status |
|--------|--------|--------|
| `45a26b6` | `window.enhanceSettings` export — bionic checkbox hydrates on every settings open | ✅ |
| `26153a4` | No auto-close on Apply; Advanced panel hidden; bionic rerenders on Apply | ✅ |
| `bc333a9` | `v175374` font restore + bionic contrast CSS; soloTrack inset:240px | ✅ |
| `b0ab820` | `cleanDeckCard()` strips legacy alias fields | ✅ (superseded by `698ebe9`) |
| `d830094` | New-count KPI added to Home row | ✅ CODE |
| `7156bd1` | `bionicOn` reads localStorage at init; `dataset.cozyBionic` set immediately | ✅ |
| `f0f4d6b` | patchSettingsText bionic guard + stale key fix | ✅ |
| `d162708` | makeChoices fix + v17513/14/15 deleted | ✅ |
| `8741251` | Undo v175372 + smoke tests | ✅ |

---

## Session Summary — 2026-05-27 Session 1 (Schema + Export + Undo)

| Commit | Line(s) | Change | Status |
|--------|---------|--------|--------|
| `698ebe9` | ~11379 | `canonicalizeCard(raw, opts)` — allowlist-based export + alias normalization | ✅ |
| `698ebe9` | ~11430 | `cleanDeckCard(card)` = `canonicalizeCard(card,{mode:'export'})` wrapper | ✅ |
| `35cd2b4` | ~11560 | `progressPayload()` → `exportProgressMap()` directly (removed double-dedup) | ✅ |
| `35cd2b4` | ~11570 | `backupPayload()` → `exportProgressMap()` directly | ✅ |
| `35cd2b4` | ~11580 | `fullGameStatePayload()` → `exportProgressMap()` directly | ✅ |
| `92b9be8` | ~11500 | `exportProgressMap` resolves `one_thing` BEFORE `phase3State.progress[cardId]=p` | ✅ |
| `2dd12a1` | ~11634 | Home Download → `exportDeckWithProgress`; labels "Upload"/"Download" | ✅ |
| `92b9be8` | v175372 | Undo stack: 5-deep `__cozyUndoStack372`; toast "Undone (N more)" | ✅ |

---

## Session Summary — 2026-05-27 Session 2 (Neural Atlas Inline)

| Commit | Change | Status |
|--------|--------|--------|
| `74ce963` | Neural Atlas embedded as `<script id="neural-atlas-embedded">` IIFE; `<div id="atlas" class="screen hidden">` injected at boot; Progress button → `window.showAtlasScreen()` | ✅ |
| `c7e5c01` | `hideAtlasScreen`: explicit `#atlas.hidden` + `window.home()`; `readProgress()` reads `window.phase3State.progress` live; `atlasLoadDeck()` reads `window.appCards()` live | ✅ |
| `20df845` | `naInit()` + `fullRefresh()`: prune orphan progress entries (no matching deckMap card) before `buildSysMap()` — eliminates `'—'` node | ✅ |

---

## Root Cause Diagnosis

### A — Bionic Toggle Never Hydrated (FIXED `45a26b6`)
`function enhanceSettings()` was local to main IIFE. IIFE-B's `openSettings()` called `window.enhanceSettings` = undefined.
**Fix:** `window.enhanceSettings = enhanceSettings` in IIFE-A.

### B — Bionic Visual Effect Invisible (FIXED `v175374`)
`.promptText{font-weight:950}` — every character already 950 weight. `<b>` inside = zero contrast.
**Fix:** `[data-cozyBionic="1"] .promptText` base = 500/dim-blue; `b` = 950/white.

### C — Font Size / Timer Overlap (FIXED `bc333a9`)
`clamp(22px,2.6vw,36px)` v1 grew promptBox past soloTrack inset.
**Fix:** Reverted font to accumulated patch values; soloTrack inset:240px.

### D — Settings Auto-Close on Apply (FIXED `26153a4`)
`setTimeout(returnFromSettings352, 0)` in `applyReturn352` listener.
**Fix:** Removed the setTimeout line.

### E — Export Alias Pollution (FIXED `698ebe9`, `35cd2b4`)
`cleanDeckCard()` used blacklist — missed fields added by import normalization.
`deduplicateProgress()` called `syncProgressAliases()` which wrote `seen/reviewed/correct/rating/last` back.
**Fix:** `canonicalizeCard` allowlist; all export paths call `exportProgressMap()` directly.

### F — `one_thing` Missing from Progress Export (FIXED `92b9be8`)
`phase3State.progress[cardId] = p` was written BEFORE `p.one_thing` was resolved.
**Fix:** Resolve `oneThingVal` and assign `p.one_thing = oneThingVal` before the `phase3State` write.

### G — Atlas `'—'` System Node (FIXED `20df845`)
`phase3State.progress` accumulates entries for every card ever studied across deck versions.
Orphan entries (card ID no longer in current deck) have no `deckMap[id]` match → `mergeSysFromDeck()` skips → sys stays blank → all group under `'—'`.
**Fix:** After deck+progress load, prune `progress` to entries where `deckMap[id]` exists (guard: only when deck IS loaded).

### H — Atlas Home Button Did Nothing (FIXED `c7e5c01`)
`#atlas` was not in the `screens[]` array defined at app boot, so `show('home')` called by `window.home()` only hid items in that array, not `#atlas`.
**Fix:** Explicitly `document.getElementById('atlas').classList.add('hidden')` before calling `window.home()`.

### I — Atlas Blank Constellation (FIXED `c7e5c01`)
`atlasLoadDeck()` read from `cozy_arcade_limitless_cards_v1` which `showAtlasScreen()` had written as a sys-map stub (`{qid_unique, sys}` only). Cards had no `diagnosis`, `presentation`, etc. And `readProgress()` read from localStorage which may be stale.
**Fix:** `atlasLoadDeck()` tries `window.appCards()` first (live, full card objects). `readProgress()` tries `window.phase3State.progress` first (live).

---

## 10-Step Fix Plan (Status)

| Step | Target | Fix | Gate |
|------|--------|-----|------|
| F1 | Font sizes | ✅ `v175374` style block | Visual confirm |
| F2 | Bionic contrast | ✅ `[data-cozyBionic]` CSS | Visual confirm |
| F3 | `dataset.cozyBionic` on init | ✅ `7156bd1` | localStorage round-trip |
| F4 | Timer key | ✅ line 8118 | `localStorage.getItem('cozyQuestionSeconds351')` |
| F5 | `timerMax` literals | ✅ lines 402,408,446,793,824 | Timer uses selected value |
| F6 | `setInterval(install,900)` guard | ⏳ LOW PRIORITY | No visible regression |
| F7 | Home controls | ✅ `7156bd1` | Home buttons visible |
| F8 | MutationObserver narrowing | ⏳ LOW PRIORITY | No performance hit seen |
| F9 | Due-count widget | ✅ CODE `d830094` | KPI row verify |
| F10 | Gear rewrite one-time guard | ⏳ LOW PRIORITY | Gear always opens settings |

---

## Current `cozy-phase3-state-model-js` IIFE Key Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `canonicalizeCard(raw, opts)` | ~11379 | Allowlist export OR alias-normalize for display |
| `cleanDeckCard(card)` | ~11430 | `canonicalizeCard(card,{mode:'export'})` wrapper |
| `exportProgressMap()` | ~11450 | Canonical progress export — explicit field allowlist |
| `progressPayload()` | ~11560 | Progress-only export JSON |
| `backupPayload()` | ~11570 | Deck+progress backup JSON |
| `fullGameStatePayload()` | ~11580 | Full game state JSON |
| `rateCard(card, rating)` | ~11200 | FSRS v5 scheduling |
| `canonicalCardId(card)` | ~10650 | Stable ID derivation |
| `window.canonicalizeCard` | ~11728 | Global export of canonicalizeCard |
| `window.appCards` | ~11843 | Global export of appCards() |
| `window.phase3State` | ~10877 | Global export of phase3State |

---

## Neural Atlas IIFE Architecture

**Script id:** `neural-atlas-embedded` (appended before `</body></html>`, line ~12884)
**Screen div:** `<div id="atlas" class="screen hidden">` — injected into DOM at IIFE parse time
**Canvas:** `id="na-canvas"` inside `id="na-canvas-wrap"`

**Data flow (embedded mode):**
```
window.showAtlasScreen()
  → writes sys-map to localStorage (for external import compat)
  → show('atlas')  [uses existing screen system]
  → requestAnimationFrame(naInit)
      → atlasLoadDeck()  →  window.appCards() [live, full cards]
      → readProgress()   →  window.phase3State.progress [live]
      → mergeSysFromDeck()  →  fills sys on progress entries
      → prune orphans  →  drops entries without deckMap match
      → buildSysMap()  →  groups by sys
      → buildGraph()   →  force-directed constellation
      → naRender()     →  RAF loop (halts when #atlas.hidden)

window.hideAtlasScreen()
  → cancelAnimationFrame(naRafId)
  → document.getElementById('atlas').classList.add('hidden')
  → window.home()
```

**Global bridges for HTML `onclick` attrs:**
`naHandleFileUpload`, `naHandleDrop`, `naFullRefresh`, `naRunDiagnostic`,
`naExportProgressOnly`, `naExportFullBackup`, `naClearSelection`,
`naAdjustZoom`, `naResetView`, `naCloseCardDetail`, `naSetFilter`,
`naRenderTable`, `naClickSys`, `naOpenCardDetail`

---

## Validation Tests

```javascript
// Core suites
window.runFSRSValidation()   // 17/17
window.runCozySmokeTests()   // 6/6

// Bionic round-trip
localStorage.setItem('bionicOn_v1751523','0');
location.reload();
// Open settings → bionic checkbox should be UNCHECKED

// Export — no aliases
// Download Deck JSON → must NOT contain: level_1_presentation, seen, reviewed, correct, rating, last

// Undo
// Answer a card → Cmd+Z → prior card reappears; toast 'Undone' or 'Undone (N more)'

// Atlas
window.showAtlasScreen()  // opens inline; constellation shows colored sys nodes
window.hideAtlasScreen()  // returns home; no ghost #atlas overlay
// ↻ button → no '—' node when deck is loaded
```

---

## Contingency Plan

If `runFSRSValidation()` fails after any step:
1. `git revert HEAD` — single commit revert, no squash
2. Re-run validation to confirm clean state
3. Fix only the failing assertion
4. Re-commit

If bionic appears broken:
1. DevTools → Elements → `<html>` → confirm `data-cozy-bionic="1"`
2. If not set: `applyVisibleSettings352()` didn't run → check `applyReturn352` listener
3. If set but no visual: check computed `color` and `font-weight` on `.promptText b`

---

## Key localStorage Keys (never rename)

| Key | Default | Controls |
|-----|---------|----------|
| `bionicOn_v1751523` | `null`→true | Bionic reading ON/OFF |
| `cozyQuestionSeconds351` | `null`→7 | Timer seconds |
| `soloStudyingState_v1757` | — | Active card session state |
| `cozy_arcade_progress_v1` | — | FSRS progress (canonical) |
| `cozy_arcade_persona_v1` | — | User persona |
| `cozy_arcade_limitless_cards_v1` | — | Uploaded deck / Atlas sys-map cache |

---

*Reference file:* `/Users/rebekahbetar/Documents/Codex/2026-05-16/cozy-arcade/index.html` (do not overwrite; CSS/logic comparison only)
*Active gate tracking:* `GOAL.md`
*Feature goals:* `ULTIMATE_GOALS.md`

2026-06-06: Ported Shadow Dungeon phase3State progress lookup and immediate solo timer/user rating path from PHASE2; service worker cache bumped to v40.
2026-06-07: Applied FQ-1/FQ-2/FQ-4 burial-safe study-pool filters and empty Solo guard in PHASE1; browser CDP validation passed FSRS 17/17, smoke 6/6, buried-card exclusion, and empty-pool toast.
2026-06-07: Applied FQ-3/FQ-8 undo session restore in PHASE1; undo snapshots now restore score/streak/hp/gate/index/current card and cover Domain without forcing Solo.
2026-06-07: M2 paywall trigger spec recorded: paywall must not appear on first launch; it should trigger only after 100 cards reviewed AND both Solo Studying and Shadow Dungeon have been used at least once.

---

## 2026-07-04/05 SESSION — deploy incident, HUD fixes, neural pulse removal, git-push verification gate

**Context:** a full day of deploy-stale/live-verification incidents (see PHASE2's `RECTIFIER_PLAN_2026_05_26.md` 2026-07-04 pre-mortem for the full deploy-incident writeup — shared root cause across both repos, not duplicated here). PHASE1-specific work this session, in order:

1. **ADVANCE-LOCK-SELF-CANCEL fixed** (v99→v100): `wrappedAdvance`'s 350ms lock checked/set unconditionally even on non-reveal calls, letting stray calls poison the shared timestamp right before a real Continue/Space press — silently swallowed, card never advanced. Fixed by gating both the check and the set on `revealOpen===true`. Live-validated, both automated and by direct user play.
2. **REVEAL-TRIGGER-CHURN root cause found** (v100→v101): two undocumented `setInterval` sweeps (`relabelMainFilters` 1200ms, `pinLanguage` 1000ms) walked the whole document rewriting `.textContent` unconditionally, even when unchanged — the actual majority contributor to weeks of measured reveal-panel mutation counts, not the previously-assumed multi-writer `reveal()` chain alone. Added write-if-changed guards; churn dropped ~80%.
3. **Duplicate/offscreen HUD home buttons fixed by deletion, not patching** (v101→v102): two legacy functions (`addHudHome`, `standardHud`) each independently created their own home button, uncoordinated with the canonical `ensureHudButton`/`renderHudControls` system. PHASE2 had already deleted both button-creation blocks months earlier; ported that exact deletion verbatim — net negative lines. Exposed a second bug in the process (canonical home button was invisible on mobile, a leftover CSS hide-rule from when the legacy button provided the visible affordance) — fixed same commit.
4. **Double-rendered Pause/Exit icons fixed** (v102→v103): `#soloPause`/`[data-home]` each had two simultaneously-active icon painters — an old hardcoded `::after{content:'Ⅱ'/'×'}` rule stacking on the newer unconditional `.hudIconButton371::before{content:attr(data-hud-icon)}` rule. Removed only the two old `::after` declarations; confirmed Undo/Settings (no legacy class) already rendered clean with one pseudo-element, proving the new system alone is sufficient. Same bug found live in PHASE2 by Codex; ported there too after explicit user approval to lift the same-day PHASE2 restriction for this one fix.
5. **Neural pulse flicker removed by deletion** (v103→v104): `#neuralPulse371` (`vNeuralPulseCSS`/`vNeuralPulseJS`) was a persistent, absolute-positioned text strip appended directly into `#solo`/`#domain` (not the HUD), mutating text + a 4-character rotating star every 12s, plus flashing a color change on every rating via a 3rd `window.rate` wrapper explicitly commented as cosmetic-only. `vEnergyPulse` (`window.showPulseToast`) already covers this signal correctly (transient top-right chip, one smooth CSS-animated star, auto-dismiss) — confirmed neural pulse's DOM id/functions referenced nowhere else in the file, deleted both blocks entirely (net ~-120 lines). Browser-validated (self-run, Codex out of credits this session): `#neuralPulse371` null at every gameplay phase (idle/mid-question/reveal-open/post-advance), `showPulseToast`/`.energyChip_v` proven functional in isolation, FSRS 17/17, smoke 6/6, zero console errors across a full answer→reveal→advance cycle.

**Standing pattern across items 3–5, worth repeating as the model for future HUD/UI cleanup:** in each case, the actual fix was *deleting* redundant/legacy code (often because a cleaner replacement already existed elsewhere in the file), not adding a wrapper or a patch on top. Before patching any recurring HUD glitch, check whether an older, uncoordinated duplicate system is the real source — this file has repeatedly turned out to have two-or-more systems doing the same job without knowing about each other.

**GIT-PUSH-VERIFY-GATE, new standing rule this session (full detail in PHASE2's OPEN_DIFFERENTIALS.md, applies equally to both repos):** a "pushed" claim was wrong the next day — local HEAD one full commit ahead of `origin/main` — because the check used was "did `git push` error out" instead of an actual SHA comparison. Rule now: never say "pushed"/"confirmed" without `git -C <repo> ls-remote origin main` matching `git -C <repo> rev-parse HEAD` byte-for-byte. Push-to-GitHub and Pages-CDN-redeploy are two separate gates — clearing the SHA match says nothing about whether the CDN has caught up; curl live separately, after. Also: this session's git CLI push repeatedly failed with GitHub's deprecated-password-auth error (`https://github.com` remote, no token/SSH configured) — GitHub Desktop or a one-time `gh auth login` are the working paths for this user's machine, not raw CLI push.

**Scope note this session:** user explicitly restricted PHASE2 changes for a period ("no more PHASE2 changes unless you ask") after item 4 shipped there; items 3 and 5's deletions were PHASE1-only pending that restriction. Always check current scope restrictions before touching PHASE2 — they can be lifted per-fix (as item 4 was, explicitly) but default to PHASE1-only when in doubt.
