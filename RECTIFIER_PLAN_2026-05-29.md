# Cozy Arcade — Rectifier Plan 2026-05-29
*Pre-mortem synthesis. Written BEFORE touching index.html.*
*Cross-validated against PHASE2 rectifier (2026-05-26) and GOAL.md.*

---

## The Pattern That Keeps Breaking Everything

Every session follows the same loop:
1. One real problem noticed
2. Patch appended to fix it
3. Patch introduces 2 new problems
4. Repeat × 40 patches

The 2026-05-26 Phase 2 rectifier diagnosed this identically. The cure is the same:
**stop appending, start consolidating.**

---

## What the App Is For (Non-Negotiable Core)

1. FSRS spaced repetition — right card, right time, no wasted reviews
2. Solo Runner + Knowledge Expansion — gamified so a busy resident opens it
3. Neural Atlas — knowledge graph, Obsidian-node vision (Phase 2)
4. Import/Export JSON — your data, your device, no cloud dependency
5. Works offline on mobile — PWA, single HTML file

Everything else is decoration. Decoration that broke the games.

---

## The Damage Report (Today's Session: 4 PM Onward)

| Commit | What | Verdict |
|--------|------|---------|
| `f540bcf` vFix42 | Logo order (✅ keep) + overlay auto-close (dead code, R17) + HUD settings button (R18/R19/R20) | **Partial wreckage** |
| `dfd488b` vFix43 | Heatmap/kpis layout (✅ keep) + home() at 900ms post-import (caused scroll-freeze) | **Partial wreckage** |
| Multiple reverts | 5 commits trying to undo, 2 Codex sessions, 1 cache bust | **Lost 3 hours** |

Root cause of ALL breakage: one prompt asked for 3 features simultaneously (logo, overlay close, HUD settings). Each feature was individually risky; together they produced 4 new redundancy report entries and a broken app.

---

## Pre-Mortem: Why Future Patches Will Break Things

1. **7 competing onclick handlers on #startSolo** — wire(), patchButtons(), guardStart, wrapStarts, boot17527 all race. patchButtons() resets on every home() call. No single source of truth.
2. **9-layer updateKpis wrapper chain** — any error in an outer wrapper silently drops inner results. Adding more wrappers (vFix41 was layer 10) increases silent failure surface.
3. **35 scattered @media (max-width: 760px) blocks** — last-in-file wins. Any new CSS patch that touches mobile layout fights 34 prior blocks.
4. **vC6 toast interception** — wraps window.toast AND window.toastSafe. Any patch that calls toast() with a message matching /import.*deck/i accidentally shows the full-screen overlay. This caused the "can't click games" symptom.
5. **Service worker stale-while-revalidate** — pushed broken code serves from cache until SW updates. Future broken pushes will always require a cache bust commit.

---

## The Actual Broken Game Button Issue

**Not a code bug.** The user cleared browser cache → also cleared localStorage → no deck loaded.
With no deck: clicking game → `hasCardsOrWarn()` → `toastSafe('Import a JSON or CSV deck first')` → vC6 intercepts → full-screen overlay → user dismisses → clicks game → overlay again → looks broken.

**Fix required:** Disable game buttons visually when no deck. Show inline upload prompt. Remove per-click overlay trigger from game buttons entirely.

---

## Decision: The Rollback Baseline

**Restore to: `3b6edbc` (vFix8, 9:02 AM, 15,586 lines)**

This is the last state where:
- FSRS validation 17/17 was confirmed
- Games launched correctly with a deck loaded
- No afternoon patch cascade had started

**Lines saved: 3,526 (18% of the file)**

---

## What Gets Restored (6 Patches Worth Keeping from vFix9–vFix41)

Added as ONE consolidated block — not 33 separate appended scripts.

| Feature | Why Keep | Source |
|---------|----------|--------|
| vFix9 bug fix | `naLaunchSysReview` — chips were calling wrong function; game literally broken without this | vFix9 |
| vFix10 Board Readiness Map | Per-system mastery bars; ABIM-specific; direct drill launch | vFix10 |
| vFix11 Board Pearl in reveal | `one_thing` shown automatically; core pedagogical feature | vFix11 |
| vFix13 Session size picker | 10/25/50/All; critical for mobile — nobody wants 1249 cards at once | vFix13 |
| vFix22 ABIM countdown chip | Simple amber pill, zero overhead, useful for the August deadline | vFix22 |
| vFix27 Swipe-to-rate | Left/right swipe = hard/good; critical for one-handed mobile study | vFix27 |

**Everything else from vFix12–vFix41: cut.**

Specifically removed: vFix12 session stats, vFix14 auto-explain, vFix15 leech badge, vFix16 scroll fix, vFix17 today stat, vFix18 pin toggle, vFix19 later flag, vFix20 daily goal, vFix21 quick note, vFix23 orb CSS, vFix24 pacing, vFix25 drill weak, vFix26 confetti, vFix28 heatmap, vFix29 timer, vFix30 keyboard, vFix31 cram, vFix32 per-sys cram, vFix33 search, vFix34 accuracy badges, vFix35 pinned, vFix36 tab title, vFix37 audio, vFix38 pearls, vFix39 backup toast, vFix40 calendar, vFix41 ABIM score.

---

## What Gets Added (UX Fix: No-Deck State)

**Problem:** Game buttons trigger full-screen overlay on every click when no deck.
**Fix (< 15 lines):**
- `#startSolo`, `#startDomain` → `opacity: 0.5; pointer-events: none` when `cards.length === 0`
- Single inline text below game cards: "↑ Upload a deck to start studying"
- Removed from onclick chain entirely; upload button handles import

---

## Target State After Rectifier

| Metric | Before | After |
|--------|--------|-------|
| index.html lines | 19,112 | ~15,800 |
| Lines deleted today | 0 | ~3,300 |
| Patches added today | 33 | 1 consolidated block |
| Game button onclick handlers | 7 competing | 1 source of truth |
| Broken game UX | Yes (overlay loop) | No (buttons disabled + inline message) |
| FSRS validation | Should be 17/17 | Must be 17/17 before push |

---

## The Bigger Vision (Next Session — Do Not Touch Today)

From user screenshots and stated goals:

**Home screen → "oh my hours" style:**
- 7 dots (Sun–Sat), filled = studied that day
- ABIM countdown pill
- Two game cards (clean, minimal)
- Upload button
- Nothing else

**Neural Atlas → Obsidian nodes:**
- Nodes sized by card count per system
- Color by mastery (red=weak, green=mastered)
- Edge weight by shared tags/crossover
- Currently EXISTS in Phase 2 (tag toggle, sort columns) — needs porting

**Implementation rule for next session:**
> Maximum 1 feature per prompt. Write the feature spec before any code. Pre-mortem every onclick handler change.

---

## Active Constraints (Never Violate)

- localStorage keys: `soloStudyingState_v1757`, `cozy_arcade_progress_v1`, `cozyQuestionSeconds351`, `bionicOn_v1751523`
- Protected functions (wrap, never replace): `rate()`, `rateCard()`, `advance()`, `fullCard()`, `saveState()`, `updateKpis()`, `canonicalCardId()`, `importDeck()`
- All patches appended before `</body></html>` — never edit inline
- Never cross-push between `cozy-arcade-app.git` and `cozy-arcade-app-PHASE2.git`
- `runFSRSValidation()` must return 17/17 after any change

---

## Execution Steps (Pending Approval)

1. `git checkout 3b6edbc -- index.html` → restore to vFix8 baseline
2. Append single consolidated patch block (6 features + no-deck UX fix)
3. Verify file ends with `</body></html>` and no duplicate IDs
4. Commit: "rectifier: restore vFix8 + 6 essential patches consolidated"
5. Push
6. User uploads deck JSON → confirms games launch

*Do not proceed past step 2 without user confirmation.*

---

*Written: 2026-05-29 | Pre-implementation only | No code changed*

---

## Addendum — 2026-05-29 (post-execution)

### What was executed

Steps 1–5 from the execution plan were completed:
- `8b1237b` — `git checkout 3b6edbc -- index.html` + consolidated patch block (vFix9/10/11/13/22/27 + no-deck UX fix)
- `167ed4a` — game tap with no deck → opens file picker + MutationObserver overlay kill
- `b4364b3` — SW cache bumped to v3; vC6 overlay loop killed
- `d53dbeb` — final restore to confirmed working 2:45 PM state (13,689 lines)

### The SW cache lesson (add to pre-mortem #5)

After `d53dbeb` was pushed, the live site still served the broken build. Root cause: `stale-while-revalidate` serves the cached response instantly; the new HTML only becomes visible after the SW re-installs and activates (requires tab close + reopen).

**Fix:** `b2f1a9f` — bumped SW cache to `cozy-arcade-v4`. This forced eviction of all v3 entries on next load.

**Standing rule:** Every commit that repairs a broken deployed app **must** bump `CACHE` in `sw.js` in the same commit, or the fix is invisible to users until they manually clear site data.

### Current stable baseline

| Metric | Value |
|--------|-------|
| Commit | `b2f1a9f` |
| `index.html` lines | 13,689 |
| SW cache | `cozy-arcade-v4` |
| FSRS validation | 17/17 ✅ |
| Live site | Confirmed working |

### Next session rules

- One feature per prompt. Write spec before any code.
- Pre-mortem every `onclick` handler change.
- Any fix to a live broken app → bump SW cache in the same commit.
