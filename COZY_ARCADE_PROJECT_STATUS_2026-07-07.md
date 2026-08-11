# Cozy Arcade Project Status — 2026-07-07 (PHASE1 `cozy-arcade-app` only)

## Addendum — 2026-08-11 mobile HUD compression fix

PHASE1-only mobile HUD cleanup: after the intentional `#neuralPulse371` top-strip spacing fix, browser inspection showed the older `vHUD-single-row` patch was still compressing stat pills on small phones once later HUD polish enlarged the action buttons. Added `vHUD-compression-fix` as a late gameplay-scoped CSS override that restores the canonical two-row mobile HUD layout: readable stat row, single no-wrap action row, no document horizontal overflow. Bumped service worker cache to `cozy-arcade-v120`. Browser-validated at 393x852 DPR 3 across Solo/Domain closed, reveal-open, and closed-after-reveal states: neural pulse remains 0-17px, HUD starts at 17px, HUD width/scrollWidth both 393px, `#gearBtn`/`#homeTopBtn` hidden, `runFSRSValidation()` 17/17, `runCozySmokeTests()` 6/6.

## What this session was about
Two-day-old user report: rating a card "Again" doesn't bring it back for review — not within 10 minutes, not ever, in the same session. Traced across multiple rounds (Claude + two independent Codex passes) to a real, now browser-verified fix. Full blow-by-blow trace is in `RECTIFIER_PLAN_2026_05_26.md`'s 2026-07-06/07-07 sections; this doc is the consolidated reference for what the algorithm actually does now, verified end to end.

## Root cause (verified, not assumed)
`getStudyPool()` is the one live pool builder for Solo, Domain, and Shadow Dungeon (confirmed via the already-validated 2026-06-03 E7 fix — `window.cardPool`/`window.nextCard`/`window.getStudyPool` all point here). Several of its per-mode branches — `new_only`, `random_new` (Solo's factory default), `reviewed_first`, and strict `due` — either hard-excluded any card with `stage:'relearning'`, or put brand-new cards ahead of it in array order, or excluded it until its exact FSRS-scheduled timestamp arrived. None of this was an SM2/FSRS math bug — `previewInterval()` always scheduled "Again" as a correct 10-minute relearning step. The pool filters were hiding a correctly-scheduled card.

## What actually changed (index.html)
1. **`dueRelearningFirst(list)` / `isRelearningNow(card)` / `isDueOrRelearning(card)`** — one shared set of helpers (not copy-pasted per branch), checking `isDue() || stage==='relearning' || repair_point || rating==='again' || last_rating==='again'`, explicitly excluding `suspended`/`buried` cards.
2. Applied to `new_only`, `new_first`, `random_new`, `reviewed_first`, and strict `due` — all now lead with due/relearning/repair/again cards instead of excluding or burying them behind new cards.
3. The **same fix applied a second time** to `getStudyPool()`'s separate retry-path implementation (only reached after `clearSessionBuried()`) — this parallel copy had been missed in the first pass and still had the old ordering for a full extra round.
4. **`due` removed from an early `if (!arr.length && [...].includes(selected)) return [];` guard** — it was possible for this guard to return empty *before* the retry logic ever ran, if every due/relearning candidate happened to already be `buried`.
5. **The `'again'` rating handler** (`rateCard`) now explicitly clears `session.seenThisSession` and `session.buriedToday` for that card and resets `session.poolKey`/`index`, so the next `sessionPool()` call is guaranteed to recompute rather than rely on an incidental cache-key change.
6. **Shadow Dungeon's `__shadowRunQueue`** — previously dead code (checked in `nextCard()`, never populated anywhere) — is now built once at Shadow Dungeon start (`buildShadowQueue()`), composed from `getStudyPool()` calls in a priority order per scope, deduplicated by card ID. `directStartGame351`'s empty-pool precheck now also checks this queue before triggering the emergency scope-reset/toast.

## Verified algorithm — what each path actually does now

**Normal study pools (Solo/Domain, via `getStudyPool()`):**
| Mode | Behavior |
|---|---|
| `due` | Overdue + relearning/repair, due-soonest first |
| `review_deck` | Pinned first, then repair/hard/again |
| `pinned` | Pinned cards only (deliberately exclusive, untouched) |
| `hard` | Repair/hard/again only (deliberately exclusive, untouched) — a just-rated card here can still be session-blocked from *immediate* repetition in the same run; it's not excluded from the mode, just not instantly re-shown |
| `random_new`, `new_only`, `new_first`, `reviewed_first` | Due/relearning/repair/again cards lead, new cards follow |

**Shadow Dungeon (via `buildShadowQueue()`):**
| Scope | Queue order |
|---|---|
| Spaced Repetition (`due`) | scheduled/relearning → review/pinned/hard → shuffled new |
| Review | review/pinned/hard → due/relearning → shuffled new |
| Pinned | pinned only |
| Random new | due/relearning/repair → shuffled new |

**Rating impact:**
- **Again** → `stage:'relearning'`, `repair_point:true`, `next_due_at` ~10 min out. Enters `due`, `review_deck`, `random_new`/`new_only`/`new_first`/`reviewed_first`, and `hard`. Un-blocked from `seenThisSession`/`buriedToday` immediately.
- **Hard** → `repair_point:true`, enters `review_deck`/`hard`; may be session-buried from *instant* repetition in an active random-new run, but shows in Review Deck.
- **Good** / **Easy** → future review, `repair_point:false`, removed from review/repair pools. Easy schedules a longer interval.
- **Pin** → toggles the `pinned` pool membership only; does not mark a card as reviewed.

## Verification performed (real, not hand-waved)
- Playwright browser interaction: Solo Again → same card resurfaces immediately. Domain Again → same. Shadow Dungeon `due`/`random-new`/`review` all launch (previously empty-toasted in an all-relearning controlled state).
- Playwright + canonical JSON round-trip: real Again button click → exported Phase3 progress JSON contains `last_rating:"again"`/`stage:"relearning"` → re-imported via the public `window.cozyPhase3.importObjectPhase3(...)` hook → card still leads `due`/`random_new` pools afterward.
- Full 6-card state matrix (again/hard/pinned/due/new×2) run through every mode above and both Shadow queue orders — matches the table exactly.
- `runCozySmokeTests()` 6/6, 60/60 script tags, `git diff --check` clean, zero page errors throughout, every round.
- **Not yet done:** the user's own hands-on confirmation in the real app (all validation above is Codex's Playwright/headless runs). PHASE2 still carries its own, separately-arrived-at, unreconciled fix for this same bug — not diffed against this one.

## Known, deliberately not touched
- `pinned`/`hard`/`tagged`/`suspended` modes stay strictly exclusive — injecting due cards there would violate the user's own deliberate narrow filter choice, not fix a bug.
- A second `sessionPool`/`buildPool()` variable pair (~line 10236, `dueScoreHot`/`isReviewCandidateHot` naming) looks like another legacy duplicate of this same logic — not traced further, consistent with the already-established precedent that Phase3's `getStudyPool()` is the live implementation. Flag only if this exact symptom class resurfaces after today's fix.
- Everything else in `GOAL.md`'s open list (System Surge/`neuralPulse371` integration, Shadow Dungeon setup modal's own scope picker, Home screen scope-dropdown reduction) is untouched and unregressed.

## Addendum — core FSRS formula bug found and fixed same day (separate from the pool/queue work above)

`fsrsRecallStability(D,S,Rv,rating)` — the stability-growth formula for Hard/Good/Easy ratings — was missing the "+1" the real FSRS algorithm requires (`S' = S×(1+growth)`, not `S' = max(S, S×growth)`). This directly affects every game (Solo/Domain/Shadow Dungeon share one `rateCard()` path) and every Good/Easy rating on a previously-reviewed card, understating stability growth and scheduling reviews sooner than correct FSRS/Anki would. `runFSRSValidation()`'s own `'S good->good'` constant had been calibrated to match this bug's output (6.9371) rather than the real algorithm's (≈10.063) — confirmed via precise Python computation, not hand-rounding. Fixed the formula, recalibrated the two dependent test constants (`'S good->good'` and `'int good->good'`). `fsrsForgetStability` (Again/lapse), `fsrsUpdateDifficulty`, `fsrsInitStability`, `fsrsInitDifficulty` were independently re-verified correct and untouched. "Pin" confirmed to have zero interaction with any FSRS math — a pure tag, exactly as intended. Full trace in `RECTIFIER_PLAN_2026_05_26.md`. Browser-validated after the patch: `runFSRSValidation()` 17/17, `runCozySmokeTests()` 6/6, reviewed-card Good schedules 10d with stability ≈10.063, Easy schedules 22d, Hard/Again remain valid, and Pin does not mutate schedule fields.
