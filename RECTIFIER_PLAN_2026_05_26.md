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

---

## 2026-07-05 continuation — neural pulse rewritten 3 more times, each caught a real bug live measurement found; Shadow Dungeon cleanup

**Neural pulse went through v1 (removed) → v2 → v3 → v4, and every single revision was driven by something a live measurement caught, never by static reasoning alone:**
- **v2** (dock inside `.promptBox`, keep content, remove flash): passed automated checks, but user's own device screenshots (`/Users/rebekahbetar/Documents/glitch source/HUD GLITCH/`, taken live, AFTER v2 was already deployed) showed the exact same flashing complaint persisting — proof that "my own test passed" is not the same as "the user's actual experience is fixed." Led to discovering `.systemBadge` is `position:absolute!important` and ignores document-flow siblings entirely — a margin/padding value on an adjacent element has zero effect on it. Measured actual gaps via `getBoundingClientRect()` at every step rather than trusting CSS box-model reasoning; the "obviously correct" `margin-bottom` fix measured a **-5px real overlap**.
- **v3** (user's explicit ask: true viewport top via `position:fixed`, smooth breathing-star cycle through multiple glyphs): user reported "still flashing" again immediately after this shipped. Root cause this time was self-inflicted: switching to `document.body.appendChild()` triggered an **already-existing** `MutationObserver` on `document.body`'s direct children (this file has one at the `run()`/`renderHudControls` cycle, debounced ~800ms) that this feature's own `watchGame()` observer reacted to in turn (filtering on the whole `class` attribute, not just `hidden`) — a self-sustaining eject/inject loop. Caught by a boring, deliberate check: sample `document.getElementById(...)` existence 20 times over 2 seconds and look for `false` in the middle. Found it immediately; would never have been caught by a single before/after screenshot.
- **v4** (user clarified further: wanted continuous smooth *rotation*, like a CLI spinner, not glyph-swapping at all — even the smooth-crossfade glyph cycling from v3 still read as "flashing"): switched to the exact same mechanism already proven in this file for `vEnergyPulse`'s `.energyChipStar_v` — one static character, pure CSS `transform:rotate` animation, zero JS-driven content swapping on the star. Measured via computed-style sampling that the character never changes and only the transform matrix does.

**Lesson, stated plainly because it took 4 iterations to learn: when a user says "still X" after a fix, do not re-derive the same category of fix faster — instrument the SPECIFIC claim (existence over time, computed transform values, actual rendered gaps) before proposing anything, and prefer copying a mechanism this file has *already shipped and the user has already approved* (`vEnergyPulse`'s rotating star) over inventing a new one, even a carefully-designed new one.**

**Shadow Dungeon, investigated as a premortem (not code) first, per explicit user instruction given SM2/card-order was flagged as "very very delicate":**
1. **Dead dropdown removed**: `shadowSchedule351` ("Review scheduled") was set in the Shadow Dungeon setup modal's HTML in two places, read by zero lines of JS anywhere in the file — a genuinely non-functional control sitting next to the one that actually works (`shadowScope351`), exactly the kind of "too many duplicate choices" confusion the user flagged. Removed from both (byte-identical) HTML strings in one edit.
2. **Duplicate modal function removed**: `openShadowSetupFallback371()` was a byte-identical copy of the primary modal's markup with a simpler, less-complete Start handler (skipped `directStartGame351`/`shadowActive351`/`syncGeneralStudyScopePhase3`). Its only call site was `if (typeof window.openShadowSetup351 === 'function') ... else openShadowSetupFallback371()` — since the primary assigns `window.openShadowSetup351` unconditionally and synchronously, much earlier in the file, the `else` branch could never execute by the time any real user click fires. Confirmed via document-execution-order reasoning (not a guess) before deleting; validated the modal still opens correctly afterward with the expected 3 dropdowns (was 4).
3. **`.pulseToast351` — premortem claim corrected, NOT deleted.** Original analysis called this dead code superseded by `vEnergyPulse`. Before acting on task #3 as originally scoped ("clean up if confirmed fully dead"), tested empirically via a real wrong-answer through the UI: **the bottom toast fired with real content; the top-right chip did not.** Root cause: bare `showPulseToast(...)` calls (used for wrong-answer/persona/milestone messages) resolve to a *different* closure-scoped function than `window.showPulseToast` (which `vEnergyPulse` only overwrites at the `window` property level, not the local variable other code in the same enclosing script references). **This is two genuinely live, parallel feedback systems, not one dead and one live** — a real "too many duplicates" finding, but not a safe deletion. Correcting this in the record rather than quietly deleting live code because an earlier grep-based premortem got the liveness question wrong.
4. **SM2/card-pool filter logic — confirmed independently reimplemented 5-6 times** (`scope==='due'`/`scope==='review'` at ~lines 1395, 3261, 4337, 4481, 6163, 6166, each with slightly different exact conditions). Flagged, not touched, matching the user's own "very very delicate" framing — this needs a dedicated trace of which implementation is actually live for each of main-page Solo / Shadow Dungeon / Domain before anything here is safe to consolidate.

---

## 2026-07-05 continued — v4's fix was incomplete; idle-state testing missed the real trigger twice

**User reported "still flashing" a third time after v4 shipped, this time on a device confirmed already running the latest deploy (directly ruled out stale service worker cache before investigating further).** Their description — text visible 1-3s, gone, reappearing later during card review — matched v3's already-fixed loop symptom closely enough to be suspicious, so instead of re-testing idle state again, instrumented the exact answer→reveal→continue transition specifically.

**Found a second, independent trigger for the identical symptom v4 only partially fixed.** `watchGame()`'s `MutationObserver` fired on *any* mutation to `#solo`/`#domain`'s `class` attribute, not specifically when `hidden` actually toggled. v4 removed one source of spurious class mutations (the `document.body` childlist loop), but a completely separate, always-running `setInterval(run, 500)` (line ~10329, nothing to do with what v4 touched) independently re-adds the `game-shell` class on its own schedule — still firing a class-attribute mutation record even when the class's actual token set never changes. `watchGame()`'s naive "any mutation → eject then inject" logic reacted every time, producing a real ~50-100ms disappear/reappear right around answer/reveal moments. Confirmed via a dedicated instrumented test of the real transition (not idle sampling): one `classAttr` mutation logged, immediately followed by `exists:false`.

**Fix:** `watchGame()` now tracks the `hidden` boolean itself and only calls `eject()`/`inject()` on an actual flip, ignoring mutation records that don't represent a real state change. Verified the same class mutation still fires post-fix (confirming the mutation source itself wasn't touched, only the reaction to it) while element existence stayed `true` across the identical test, then extended to 5 full answer→continue cycles with zero disappearances.

**The lesson, now proven twice on this exact feature:** a clean 2-second idle-state sample is not sufficient validation for any code reacting to DOM mutations. Both v3's loop and this bug only ever manifested around real state transitions (answer submission, reveal, continue) — idle sampling passed cleanly both times while the actual bug was live in production. Any future validation of mutation-observer-driven code in this file must instrument the specific transition the code is meant to react to, not just confirm steady-state behavior looks fine.

---

## 2026-07-05 continued — Clear Local State silently broken for 3 weeks; two more dead dropdowns found by tracing, not guessing

**Root cause, found by tracing the actual click handler rather than trusting the label:** both existing "Clear Local State" buttons (`#review` screen and the Shadow Dungeon hub) did `state={};saveState();` — `saveState()` only writes `localStorage.setItem('soloStudyingState_v1757', ...)`. A comment already in the file, at the canonical `savePhase3State()` function, says `/* LEGACY_STATE_KEYS dead write removed 2026-06-15 — soloStudyingState_v1757 no longer written */` — meaning the ONE key this button clears has not been written to by the app itself for three weeks. The real progress store, `cozy_arcade_progress_v1` via `phase3State.progress`, was never touched by either button. This is why "clear cookies + browser history" was the only workaround that actually worked, and why no one caught it: the button *looked* like it did something (screen refreshed, KPIs sometimes changed transiently) without ever touching the data users actually cared about.

**Fix:** one shared `window.clearAllLocalProgress()`, placed next to `savePhase3State()` so it has direct closure access, that sets `phase3State.progress = {}` and calls the canonical save path — the same path every real rating goes through, so there's no second, parallel write mechanism to get out of sync. Both old buttons now call it (previously neither had a confirmation prompt at all — added a plain `confirm()` to both, since they're simple legacy click handlers on less-visible screens). A new "Advanced Settings" section in the main Settings & Gameplay drawer gets a nicer custom inline Accept/Cancel (not a native dialog, matching the drawer's own visual language) calling the same shared function.

**Second and third dead dropdowns found in Shadow Dungeon, this time by tracing rather than by the earlier grep-based premortem:** `shadowDropSeconds351()` is a one-line passthrough to `questionSeconds351()` — the Shadow Dungeon setup modal's "Game timing" dropdown has never been wired to its own timer value; changing it does nothing, Shadow Dungeon always uses Solo's shared timer. No comment explains this as intentional. Flagged, not fixed — the user's own framing (past card-state glitches in this exact area) means a timer-independence fix needs a full Shadow-Dungeon-specific regression pass before shipping, not a reactive one-liner.

**A likely-unintentional near-duplicate found while tracing the "Weak System Detected" banner (screenshot-confirmed) for the System Surge premortem:** the banner comes from a bare (non-`window.`) `showPulseToast(...)` call inside `checkKnowledgePulse()` — confirmed the SAME `.pulseToast351` closure-scoped function documented earlier this session, not `vEnergyPulse`. Separately, `vEnergyPulse` (line ~14493) already has its own `'SYSTEM SURGE'`/`'WEAK SYSTEM DETECTED'` message tables that are never actually invoked for this trigger — meaning partial groundwork for the exact consolidation the user wants already exists, unused, in a second system. Documented as a design decision for later, nothing touched.

**Pattern holding across this whole session, worth restating one more time since it just paid off again:** every one of today's "the dropdown/button doesn't seem to do anything" complaints turned out to be a real, traceable, single-function root cause once actually followed — never assumed, never fixed by adding a wrapper. Grep-based premortems (like the earlier one that wrongly called `.pulseToast351` dead) are a good first pass but must still be verified by tracing the actual runtime call, exactly as this session's `.pulseToast351` correction and this Clear-Local-State fix both demonstrate.

---

## 2026-07-05 continued — Clear Local State's actual final shape, after 4 iterations same day

Worth logging precisely since it moved fast: broken (3 weeks, cleared a dead key) → fixed for real (clears canonical `phase3State.progress`) → reverted to a no-op same day on user's explicit "UNDO THIS: KEEP LOCAL STATE" — turned out to be caution before shipping something destructive, not a rejection — → re-confirmed wanted ("OK TO CLEAR LOCAL STATE IF SELECTED THEN CONFIRMED") and moved from a standalone redundant `<details>` section into a 4th "Advanced ▾" button in the existing Apply/Import/Export action row (found and fixed a real `right:0` dropdown-overflow bug for the new rightmost button in the process) → split into two explicit scopes, "Clear Progress Only" and "Clear Deck + Progress," after tracing that deck and progress are genuinely two independent localStorage paths (`cozy_arcade_limitless_cards_v1` vs `cozy_arcade_progress_v1`, no shared code between them) and the user wanted both surfaced separately, matching the Export ▾ dropdown's existing Deck/Progress/Full split.

**Lesson:** when a user says "undo this" immediately after a fix they themselves asked for, don't assume the whole direction was wrong — ask what specifically should change before reverting further than necessary. Here the revert was really about sequencing (pause before shipping something irreversible) and about redundant UI placement, not about the underlying feature being unwanted. The final shape ended up very close to the original fix, just correctly scoped and better placed.

---

## 2026-07-06 — SM2 "Again" card doesn't resurface: two-day-old symptom, root cause finally traced to the actual live pool filter, not a competing legacy implementation

**Symptom, user-reported across both game modes:** rate a card "Again" in Solo Studying, don't see it again within ~10 minutes as expected. Same thing in Knowledge Expansion. User explicitly asked whether SM2-due cards "win" regardless of which scope (random/pinned/new) is active — they don't, currently, in two of `getStudyPool()`'s modes.

**Traced `getStudyPool()` (line ~11590) directly rather than assuming which of the "5-6 duplicate scope filters" flagged in GOAL.md/earlier premortems is live.** They're not actually competing implementations: `cardPool()` (line 394) and the `scope==='due'`/`deckMode==='due'` sorts at ~1396/3262/4338/4482/6166 are all legacy pre-Phase3 pool builders that only *reorder* by due-score — none of them *filter out* anything, and per the already-validated 2026-06-03 E7 fix, Phase3's `getStudyPool()`/`sessionPool()` is confirmed the one `window.cardPool`/`window.getStudyPool` actually points to for both Solo and Domain. So the standing "trace which one is live" item is answered: there's no multi-owner conflict here, just one real gap inside the one live function.

**The actual gap:** `isReviewedCard(card)` flips true the instant a card gets any `last_rating`/`stage:'relearning'` — i.e. right after the first "Again." `isNewCard` is `!isReviewedCard`. Solo's factory default, `solo_order:'random_new'`, filters `arr.filter(isNewCard)` — so an Again-rated card drops out of that pool permanently (not in 10 minutes — forever, for that session), even though `previewInterval()` correctly scheduled it as a 10-minute relearning step. The SM2/FSRS math isn't broken; the pool filter hides a correctly-scheduled card. `new_only` has the identical gap. `new_first` (Domain's default) already handles this correctly — it explicitly re-includes not-yet-due relearning cards in a third bucket. `reviewed_first` has a narrower version of the same gap (excludes relearning cards until they're actually due, rather than always).

**Why the user saw this in BOTH modes, when Domain's own default should have been fine:** traced `resetStudyFiltersForImportedDeck()` (Codex's authoritative import gate, added the day before) and the two empty-pool fallback safety nets added the same day in the Solo/Phase3 start wrappers. All three set **both** `solo_order` and `expansion_order` to `'random_new'` when triggered — one explicitly via `syncGeneralStudyScopePhase3('random_new',{syncExpansion:true})`. The prior day's fresh 1249-card ABIM import (100% new cards) triggered exactly this path, silently overwriting Domain's normally-correct `new_first` default into the one mode that shares Solo's exclusion gap. **This is a real side effect of the previous day's "no cards match filter" emergency fix, not an unrelated second bug** — worth remembering before assuming two separate root causes next time a fix seems to reintroduce an old symptom in an unrelated game mode.

**Proposed fix, not yet coded (per this project's own standing rule — premortem before any SM2/card-order code, every time):** make `new_only`/`random_new` (and the narrower `reviewed_first` gap) prepend due/relearning cards ahead of the new-card set, exactly mirroring `new_first`'s already-shipped, already-correct pattern — so an SM2-due card wins regardless of the active scope choice. Open design question before writing this: patch each mode branch individually (smaller, safer diff) vs. hoist one shared "due/relearning cards always come first" step to the top of `getStudyPool()` so no future 7th mode can reintroduce the same gap by omission. Awaiting go-ahead.

**FIXED, same day — user chose the shared-step approach.** `dueRelearningFirst(list)` added once, right after `dueSort`, reused (not copy-pasted) by all three affected branches:
- `new_only`: `[...dueRelearningFirst(arr), ...arr.filter(isNewCard)]` (was `arr.filter(isNewCard)` alone — hard-excluded due/relearning before).
- `random_new`: `[...dueRelearningFirst(arr), ...shuffleCards(arr.filter(isNewCard))]` (was `shuffleCards(arr.filter(isNewCard))` — same hard exclusion; new cards still shuffled, due/relearning cards deliberately not shuffled so they consistently lead).
- `reviewed_first`: inserted the missing not-yet-due-relearning bucket between the existing due-sorted list and the new-card tail, matching `new_first`'s 3-bucket shape exactly.

Left `new_first` untouched (already correct — it's the pattern being mirrored) and deliberately did not touch `pinned`/`hard`/`tagged`/`suspended`/`due`/`review_deck`: those are explicit exclusive filters (or, for `review_deck`, already correctly inclusive of again/hard cards via `isReviewCandidate`) — forcing due cards into an explicit "Pinned only" view would violate the user's own deliberate narrow choice, not fix a bug.

**Checked the one thing that could have silently defeated this fix before declaring it done:** `isSessionBlockedCard()` blocks any card already in `session.seenThisSession` for the rest of the session — which would include a card the user just rated seconds ago. Traced the rating handler (line ~11458, pre-existing, not written today) and confirmed it already does `session.seenThisSession.delete(cardId)` specifically when `rating==='again'` — so this session isn't fighting the fix, it already special-cases this exact scenario. Also confirmed `poolKey()` includes `session.seenThisSession.size`, so the delete changes the key and forces `sessionPool()` to actually recompute via `getStudyPool()` rather than serve a stale cached array. The two mechanisms compose correctly together.

**Not live-browser-validated** (Chrome extension disconnected the whole session) — verified by direct source trace of `isDue`/`isReviewedCard`/`isNewCard` semantics and the poolKey invalidation path, not by an actual answer→Again→resurface run in a real browser. Flag this as the next thing to confirm, not as closed.

---

## 2026-07-06 continued — a Codex session fixed this exact bug in PHASE2 (real browser validation) while I'd been working PHASE1; "new_first already correct" claim above was wrong, corrected by tracing priority not just inclusion

**Important process note first:** a separate Codex run reported "no cards match filter" fixed via real headless-Chrome interaction testing, but it worked in `cozy-arcade-app-PHASE2`, not this repo. All of today's SM2 work in this file was PHASE1-only, per the standing "PHASE1 only" rule — so Codex's PHASE2 fix and this repo's fix are two independent efforts on the same bug class, not one confirming the other. Worth remembering: when two agents are both touching "the SM2 bug" in the same session, check which repo before assuming a fix or a failure applies to both.

**Codex's real browser test caught something my static trace above missed: I only checked whether a card was *excluded*, not whether it was *prioritized*.** Above, this file claims "`new_first` (Domain's default, already correct) left untouched." That's only half true — `new_first`'s old bucket order was `[...new cards, ...due-reviewed, ...not-due-relearning]`. The relearning card genuinely was *included*, exactly as claimed — but new cards came **first** in the array. With a ~1249-card new deck ahead of it, `pool[0]` after a fresh recompute is still a new card, not the just-failed one — so from the user's perspective in Knowledge Expansion, the "Again" card still doesn't come back "immediately," which is what actually matters. Confirmed this precisely by re-tracing the live `nextCard()` (line ~12266, the last-assigned/live version): it calls `sessionPool(gameType)` fresh on every call, which recomputes via `getStudyPool()` and resets `index=0` whenever `poolKey` changes (poolKey includes `session.seenThisSession.size`, which the 'again' handler's `session.seenThisSession.delete(cardId)` does change) — so `current = pool[index % pool.length]` really does become `pool[0]` of the freshly recomputed array. Whichever card sits at position 0 is what the user sees next. Old `new_first` put new cards there; `random_new`/`new_only` (already fixed earlier in this same session) didn't have this problem since `dueRelearningFirst()` was already placed first in those.

**Fixed properly this time:** `new_first` now reuses `dueRelearningFirst(arr)` the same way `new_only` does — `[...dueRelearningFirst(arr), ...arr.filter(isNewCard)]` — same total card set, reordered so due/relearning genuinely leads.

**Second gap found the same way (checking priority, not just presence):** `due` mode's filter was `isDue(p) && !p.suspended...` — strictly excludes a card that's in `relearning` but whose `next_due_at` hasn't arrived yet (e.g. seconds after rating "Again," while the 10-minute FSRS window is still counting down). This is exactly the scenario that caused two days ago's original "no cards match filter" crisis in a different but related shape (Shadow Dungeon defaulting to `due` against an all-new deck). Fixed both the primary `due` branch and its retry-after-clearSessionBuried duplicate to `(isDue(p) || p.stage === 'relearning') && !p.suspended...` — a relearning-but-not-yet-due card now shows in strict "due" scope too, not just in the general-browse modes. Left the existing `next_due_at`-ascending sort untouched — it already naturally orders overdue-now cards before soonest-due relearning cards, no change needed there.

**Also added, defense-in-depth, matching what Codex validated as necessary in PHASE2 even though this repo's `poolKey`-size-based invalidation should already cover it:** the 'again' rating handler (line ~11458) now also explicitly does `session.poolKey=''; index=0;` right where it already deletes the card from `seenThisSession`. Belt-and-suspenders — cheap, and removes any dependency on `seenThisSession.size` happening to be the thing that changes the key.

**Confirmed `__shadowRunQueue`, the thing `nextCard()` checks first for Shadow Dungeon, is never actually populated anywhere in this file's current code** — that whole branch is dead, meaning Shadow Dungeon falls through to the exact same `sessionPool()`/`getStudyPool()` path as Solo/Domain today. So the `due` mode fix above applies directly to Shadow Dungeon whenever its scope is set to "Spaced Repetition."

**Still not live-browser-validated in this repo** (Chrome extension disconnected all session) — Codex's PHASE2 result (Solo Again loops immediately, Domain Again loops immediately, Shadow due/random-new/review all launch instead of empty-toasting) is real evidence the *shape* of this fix works, but it was run against PHASE2's code, not this file's. Ask user to confirm live in PHASE1 specifically before calling this closed here.

**2026-07-07 Codex PHASE1 review + live browser validation:** reviewed Claude's PHASE1 patch against the PHASE2 findings, fixed the stale/false inline comment and widened the due/relearning predicate to include `repair_point`, `rating:'again'`, and `last_rating:'again'` as well as `stage:'relearning'`; `Again` now also clears `buriedToday` before resetting `poolKey`/`index`. Browser-tested this repo directly: Solo Again loops same card, Domain Again loops same card, Shadow Dungeon `due`/`random-new`/`review` all launch in controlled relearning state; pool probe shows due/relearning card first in `random_new`, `new_only`, `reviewed_first`, `new_first`, and `due`.

**2026-07-07 continued — Codex re-review caught the primary fix wasn't fully mirrored into `getStudyPool()`'s retry path.** After the pool's normal computation returns nothing playable, the function clears session-buried state and recomputes via a second, separate `new_first`/`reviewed_first` implementation (line ~11701) — this retry block still had the pre-fix ordering (new cards before due/relearning) even though the primary branch above it had already been corrected. Low-frequency path (only reached after `clearSessionBuried()`), but a real gap — fixed to reuse the exact same `dueRelearningFirst`/`isRelearningNow` helpers as the primary branch, not a re-derived copy. **Also traced all known Shadow Dungeon launch paths per Codex's caution** ("test all launch paths before claiming fixed"): the overlay modal's Start button (`shadowStart351.onclick`, ~line 6425) maps its scope to a study mode, calls `syncGeneralStudyScopePhase3()`, then `directStartGame351()` — confirmed this funnels through the same fixed `sessionPool()`/`getStudyPool()`. The older legacy review-hub (list-item click → `current=c; ...; loopSolo()`) bypasses pool computation only for the *first* manually-clicked card; every subsequent card still goes through the live `nextCard()` → `sessionPool()` path already fixed. No additional live entry point found that bypasses this fix.

**2026-07-07 browser probe follow-up:** Codex's real Chrome probe confirmed the retry patch for `new_first`/`reviewed_first`, then exposed one more `due`-specific guard: the early empty-pool return still included `due`, so a progress-buried relearning/due card could return an empty `due` pool before reaching the already-fixed retry block. Removed `due` from that explicit empty-return list so scheduled `due` mode can clear buried state and re-run the shared due/relearning ordering; left `new_only`/`pinned`/`hard`/`tagged`/`suspended` as explicit empty selections.

**Lesson:** "flagged as duplicated 5-6 times, needs tracing" from an earlier premortem turned out to be mostly legacy dead-weight once actually traced — the real, live bug was narrower and different in kind (a filter inclusion gap in the one confirmed-live function, not a multi-owner authority conflict like `cardPool`/`nextCard` was). Don't let an old, correctly-cautious "needs tracing" flag get treated as "already known to be a multi-owner problem" without re-verifying — the shape of the bug can turn out to be simpler than the flag implied, once traced instead of assumed.
