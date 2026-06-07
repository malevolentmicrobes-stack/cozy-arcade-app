# ⛔ FAILED ATTEMPTS LOG — DO NOT REPEAT
*Cozy Arcade Board Prep — 2026-05-29*
*Sourced from: git log, REDUNDANT_CODE_AUDIT.md (R13–R21), RECTIFIER_PLAN_2026-05-29.md, commit diffs*
*Every entry below is a confirmed failure from today's session. Read before writing any new code.*

---

## HOW TO READ THIS DOCUMENT

Each entry has:
- **What was attempted** — the exact prompt goal
- **What broke** — the exact symptom
- **Why it broke** — the root cause (code-level)
- **The commit** — so you can diff it
- **The lesson** — one sentence, the thing to carry forward

These are prefaced here so that the next session does not re-derive these failures from scratch.
The goal is not to shame — it's to not repeat 3 hours of churn.

---

## ENTRY 1 — ⛔ DO NOT: Add another `updateKpis` wrapper for a home screen stat

**Attempted:** `vFix41` (`5daef88`) — ABIM Predicted Board Score tile in the mastery panel. Implemented as another `window.updateKpis` wrapper appended at end of file.

**What broke:** Solo game button click produced a freeze. On click → `startSolo()` → no response. User stuck on home screen.

**Why:** The `updateKpis` wrapper chain was already 9 layers deep (vFix5→vFix8→vFix9→vFix10→vFix13→vFix17→vFix20→vFix24→vFix25). Any unhandled error in an outer wrapper silently drops all inner results. Adding layer 10 compounded the risk. Diagnostic confirmed: the Solo-click freeze existed in BOTH vFix41 and the pre-vFix41 worktree (`b69ed83`), meaning vFix41 was not the sole cause — but it triggered the hard stop. The underlying onclick conflict was the real root cause (see Entry 6).

**Commits:** `5daef88` (added) → `296154e` (removed) → `c179a67` (re-added) → `355f5ba` (reverted again) → `09a49d5` (reverted to vFix41 state) → eventually abandoned.
That is **5 commits fighting one feature.** Zero net change. ~2 hours lost.

**Lesson:** No more `updateKpis` wrappers as isolated patches. Any new home-screen stat must be integrated into a single consolidated `updateKpis` function — not stacked as another outer shell.

---

## ENTRY 2 — ⛔ DO NOT: Bundle multiple features into one prompt

**Attempted:** `vFix42` (`f540bcf`) — Three features in one commit: (a) logo order fix, (b) import overlay auto-close, (c) game HUD settings button.

**What broke:**
- (b) auto-close: global `document` capture listener fired on every `<input>` change anywhere in the app
- (c) HUD settings: HUD layout collapsed on mobile; settings opened mid-game always returned to home instead of game

**Why:**
- (a) was safe (single CSS rule `order:-1`)
- (b) was unnecessary — `panel.innerHTML` at line 8506 destroys the direct-element listener (R13), so delegated listeners were needed, but auto-close itself is wrong UX. The ✕ button is correct.
- (c) wrapped `window.normalizeHud` — which is a **local closure variable inside vFix4's IIFE**, never exported to `window`. `window.normalizeHud` is always `undefined`. The wrapper was dead code from line 1 (R18). The MutationObserver fallback ran instead, which injected the button — but then calling `gearBtn.click()` without setting `settingsReturnMode = 'solo'` sent the user back to home after every settings visit (R20). Additionally, hiding `.hudStats371` on mobile collapsed the HUD flex row (R19).

**Commit:** `f540bcf` → `81ae55e` (reverted b + c, kept a)

**Lesson:** One feature per prompt. Always. The logo fix took 1 line and worked. The other two features took 30 minutes to write and 1 hour to revert.

---

## ENTRY 3 — ⛔ DO NOT: Call `home()` on a timer after import to "unstick" the game

**Attempted:** `vFix43a` (`dfd488b`) — Document-level capture listener calls `home()` 900ms after `#limitlessHomeDeckFile` change event, as a workaround for `wire()`'s `stopImmediatePropagation()`.

**What broke:** On mobile with 1,249 cards: visible scroll-jump → full re-render freeze (~1.5 seconds). The 10-wrapper `updateKpis` chain fired on `home()` call on a 1,249-card deck.

**Why the diagnosis was wrong:** The stuck-game-button state was caused by vFix42c side effects (settingsReturnMode bug, R20) — not by a missing `home()` call. `importObject()` at line 8465 already calls `updateKpis()` + `installHomeActions()` — the post-import state was already refreshed. Calling `home()` again 900ms later was redundant AND destructive on mobile.

**Commit:** `dfd488b` → `6d7e70b` (reverted vFix43a)
Note: `vFix43b` in the same commit (heatmap/KPI redesign) was correct and was preserved.

**Lesson:** Before adding a workaround, confirm the actual root cause. `importObject()` already refreshes state. Don't call `home()` on a timer — the 10-wrapper chain costs ~200ms on 1,249 cards, and mobile scroll position resets.

---

## ENTRY 4 — ⛔ DO NOT: Intercept `window.toast` to trigger game-blocking overlays

**Attempted:** `vC6` (earlier session) — Wrapped `window.toast` and `window.toastSafe`. Any toast message matching `/import.*deck/i` triggered a full-screen overlay prompting deck upload.

**What broke:** With no deck loaded: user taps Solo → `hasCardsOrWarn()` → `toastSafe('Import a JSON or CSV deck first')` → vC6 intercepts → full-screen overlay appears → user dismisses → taps Solo again → overlay again. Game buttons appeared permanently broken.

**Why:** The toast wrapper had no awareness of call context. It intercepted ANY toast — including internal ones from `hasCardsOrWarn()`. The intended trigger (user explicitly clicking an import path) and the actual trigger (any toast with "import" in the string) were different things.

**Fix:** `b4364b3` killed the vC6 overlay loop + MutationObserver kill switch. `167ed4a` replaced the pattern entirely: game tap with no deck now opens the file picker directly. No overlay. No toast interception.

**Lesson:** Never intercept `window.toast` or `window.toastSafe` to trigger UI state changes. Toast is a fire-and-forget notification system. Wrap it only if you need analytics, never for flow control.

---

## ENTRY 5 — ⛔ DO NOT: Wrap a local closure variable via `window.*`

**Attempted:** `vFix42c` (`f540bcf`) — `window.normalizeHud = function() { ... }` wrapping the existing `normalizeHud`.

**What broke:** The wrapper was dead from line 1. `normalizeHud` is declared as a `const` inside vFix4's IIFE — it was never assigned to `window`. `window.normalizeHud` was `undefined`. The wrapper wrapped `undefined`. `typeof _origNH === 'function'` was always `false`. The wrapper body never ran (R18).

**Why it wasn't caught:** It looked correct syntactically. There were no console errors. The MutationObserver fallback (also in vFix42c) ran instead and appeared to work — until it caused R20.

**Lesson:** Before wrapping any function via `window.X`, verify `typeof window.X === 'function'` is actually true at runtime. Local IIFE variables are NOT on window unless explicitly exported via `window.X = localX`.

---

## ENTRY 6 — ⛔ DO NOT: Diagnose "Solo button doesn't work" without checking onclick handler count first

**Attempted:** Multiple sessions — patching `startSolo` behavior, adding guards, calling `home()` after import, reverting vFix41 — all to fix a Solo-click freeze.

**What broke:** Nothing new. The freeze existed before vFix41 (`b69ed83` confirmed). 7 competing onclick sources on `#startSolo`: `wire()`, `patchButtons()`, `guardStart`, `wrapStarts`, `boot17527`, vFix-level guards, and normalizeHud attempts. `patchButtons()` resets `#startSolo.onclick` on **every `home()` call**, overwriting any listener set by a prior patch.

**Root cause never fully fixed:** The rectifier addressed it by consolidating onclick into a single source at vFix8 baseline. But the underlying architecture (patchButtons resetting on home()) remains.

**The correct diagnostic sequence** (for any future "game button doesn't work"):
```
1. Open DevTools console
2. document.getElementById('startSolo').onclick  ← what's actually registered?
3. getEventListeners(document.getElementById('startSolo'))  ← how many listeners?
4. Check if patchButtons() was called since last wire()
5. Check settingsReturnMode — if wrong value, user lands on home after settings
```

**Lesson:** Never patch the symptom (button not responding) without first counting how many things are fighting for that onclick. The architecture has a structural onclick conflict. Any new patch that calls `home()` or re-invokes `patchButtons()` will reset the button again.

---

## ENTRY 7 — ⛔ DO NOT: Push a fix without bumping the SW cache name

**Attempted:** Multiple fixes throughout the day pushed to `origin/main` without bumping `CACHE` in `sw.js`.

**What happened:** Users (including the developer) saw the broken version for 1–2 additional reloads. The stale-while-revalidate strategy serves the cached response instantly; the new HTML is only fetched in the background and served on the NEXT load after SW re-installs.

**The cascade:**
- `0aad991` — bumped to `v2` (first cache bust)
- `b4364b3` — bumped to `v3` (second cache bust)
- `d53dbeb` — restore pushed but SW NOT bumped ← this caused the final "still broken" report
- `b2f1a9f` — bumped to `v4` ← fixed it

**Every cache bust was a separate commit**, meaning every broken-state-extended-by-cache could have been prevented.

**Lesson (standing rule, non-negotiable):**
> Any commit that fixes a broken live app **must** bump `CACHE` in `sw.js` in the same commit.
> `const CACHE = 'cozy-arcade-vN'` → increment N.
> No exceptions. Stale cache is invisible and indistinguishable from unfixed code.

---

## ENTRY 8 — ⛔ DO NOT: Use `settingsReturnMode` incorrectly (or not at all) when adding in-game settings access

**Attempted:** `vFix42c` — Settings button in game HUD via `btn.addEventListener('click', () => gearBtn.click())`.

**What broke:** After visiting settings mid-game, pressing ← returned to **home** instead of back to the game.

**Why:** `returnToPrior()` at line 1280 checks `settingsReturnMode`. If it's `'solo'` or `'domain'`, it returns to the game. Otherwise it calls `home()`. vFix42c never set `settingsReturnMode` before calling `gearBtn.click()`. So every settings visit from game → `settingsReturnMode` was `undefined` → `returnToPrior()` → `home()` (R20).

**The correct pattern** (for any future in-game settings button):
```javascript
// Must set BEFORE opening settings
settingsReturnMode = mode; // 'solo' or 'domain'
show('settings');
// Do NOT call gearBtn.click() directly — it may have its own click handlers
```

**Lesson:** In-game settings access is Phase 2 scope. It requires proper `settingsReturnMode` integration. Do not attempt it as an appended patch without reading `returnToPrior()` first.

---

## ENTRY 9 — ⛔ DO NOT: Hide `.hudStats371` on mobile to "simplify" the HUD

**Attempted:** `vFix42c` CSS — `.hudStats371 { display: none }` at `≤760px`.

**What broke:** `.hudStats371` contains energy/score/streak pills. Hiding it collapsed the flex row, altering `.hudActions371` positioning. Home/exit button (`button[data-home]`) shifted off its tap target on small screens.

**Why:** The HUD is a flex row. Hiding a child collapses the available space, repositioning all siblings. There is no compensating `min-height` or fixed-size container.

**Lesson:** Never hide a HUD flex child to simplify layout. The correct approach is to reduce content within the child (abbreviate labels, remove non-essential pills) while keeping the DOM node present for layout stability.

---

## ENTRY 10 — ⛔ DO NOT: Assume `importObject()` doesn't refresh state after import

**Attempted:** `vFix43a` — Called `home()` at 900ms post-import to "refresh the state machine."

**What happened:** `importObject()` at line 8465 already calls `updateKpis()` + `installHomeActions()`. State was already refreshed. The second `home()` call was redundant and caused: scroll jump to top, full 10-wrapper `updateKpis` chain re-fired on 1,249 cards, ~1.5s visual freeze on mobile.

**Lesson:** Before adding any post-event refresh call, read `importObject()` and confirm whether it already handles state refresh. It does. Do not call `home()` on a timer post-import.

---

## MASTER SUMMARY — THE ONE PATTERN THAT CAUSED ALL OF THIS

Every failure above traces to one of three root causes:

| Root Cause | Failures caused |
|-----------|----------------|
| **Multiple features in one prompt** | Entries 2, 3, 4 — three separate broken features shipped together; revert of any one required reverting all |
| **Wrapping/overriding without verifying the target exists** | Entries 1, 5, 6 — wrapped undefined, or wrapped a function that already handled the case |
| **Not bumping SW cache on fix push** | Entry 7 — fixed code invisible to users; extended broken state by 1–2 reloads each time |

### The pre-mortem question to ask before writing any code:

> "If this patch creates a new problem, what exactly breaks — and can I revert it cleanly without touching the 3 other things in this commit?"

If the answer is no: split the work.

---

*Last updated: 2026-05-30*
*Source: git log · REDUNDANT_CODE_AUDIT.md · RECTIFIER_PLAN_2026-05-29.md · commit diffs f540bcf, dfd488b, 8b1237b, 0aad991, b4364b3, b2f1a9f*

---

## ENTRY 11 — ⛔ DO NOT: Fix Knowledge Expansion card/orb position by overriding `positionOrbs` cy and hiding `.domainTitle`

**Attempted:** `ad610c9` (2026-05-30) — Two changes at once: (1) `#domain.game-shell .gameMain371 > .domainTitle { display:none }` to remove the title spacer; (2) new `positionOrbs` override setting `cy = rect.height * 0.22` instead of `rect.height / 2`.

**What broke:** Worsened gameplay mechanics and the card position was still incorrect. Reverted at `53d8f09`, SW bumped to v17 at `a0551bf`.

**Why it broke (diagnosis incomplete):** The root cause of "first card in center" in Knowledge Expansion is NOT confirmed. The `positionOrbs` chain is deep (5+ overrides: lines 411, 451, 558, 605, 1581 in the file, then `patchDomainGeometry` at 12712). The `patchDomainGeometry` wrapper already attempts arena-relative positioning but has multiple fallback paths. Changing `cy` without fully understanding the interaction of all override layers worsened the starting position and disrupted the expansion mechanic.

**What needs investigation FIRST (before any future fix):**
1. Confirm in DevTools: does `#domain` actually have class `game-shell` when the game is live?
2. Check `window.positionOrbs.__mobileShell371` and `window.positionOrbs.__domainOrbFix` at runtime — are the patches in effect?
3. What does `arena.getBoundingClientRect()` return during gameplay? Is the arena 0×0 at call time?
4. Is the "first card in center" the `.promptBox` or the orbs? Screenshot needed.

**Lesson:** Do not touch `positionOrbs` without first confirming via DevTools which override is actually executing at runtime. There are 6 competing definitions. The game mechanic (orbs expand from start position to edges) is sensitive to `cy` and `maxR` values. Any change needs user confirmation of the exact visual bug before coding.

*This document contains only confirmed failures. No speculation.*
