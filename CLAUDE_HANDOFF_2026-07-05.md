# Claude Handoff — Cozy Arcade PHASE1 (cozy-app)
**Date:** 2026-07-05 | For: Claude (new session) or any AI agent working on this repo specifically.

This is PHASE1's first dedicated, actively-maintained handoff doc (previously only PHASE2 had one, `cozy-arcade-app-PHASE2/CLAUDE_HANDOFF_2026-06-15.md`). Read that one too if you have access to PHASE2 — several of its standing rules apply equally here since both repos share the same underlying codebase history.

## Rule #1: never say "pushed"/"confirmed" without a SHA comparison
`git -C <repo> ls-remote origin main` must byte-for-byte match `git -C <repo> rev-parse HEAD`. Not equal = not pushed, say so plainly. This shell cannot authenticate to GitHub (`could not read Username for 'https://github.com'`) — hand push commands to the user via `!`, or they may need GitHub Desktop / `gh auth login` if the CLI prompts fail (recurring issue this project).

## Rule #2: deploy (GitHub push) and live (CDN/Pages) are two separate gates
Confirming the SHA gate says nothing about whether the CDN has redeployed. Curl the live `sw.js` separately, always, after the SHA gate passes:
```
curl -s https://malevolentmicrobes-stack.github.io/cozy-arcade-app/sw.js | grep CACHE
```

## Rule #3: "verified"/"confirmed" in any doc is a timestamp, not a permanent fact
Multiple incidents this project (both repos) came from trusting a prior session's "this is fixed/live/dead" claim without re-checking. Re-run the actual check yourself before relying on anything a doc says was already true.

## Rule #4: when a user says "still X" after you ship a fix for X, do not re-derive the same category of fix — instrument the specific claim
The 2026-07-05 neural-pulse saga (see `RECTIFIER_PLAN_2026_05_26.md`'s "2026-07-05 continuation" section) went through 4 revisions. Each "still flashing" report was caused by something a live measurement caught immediately (existence-over-time sampling, computed transform values, actual rendered gaps via `getBoundingClientRect()`) that static reasoning had missed. Prefer copying a mechanism this file has *already shipped and the user has already approved* (e.g. `vEnergyPulse`'s rotating star) over inventing a new one.

## Rule #5: before calling anything "dead code," test it live — grep alone is not proof
`.pulseToast351` was assessed as dead (superseded by `vEnergyPulse`) based on `window.showPulseToast` being reassigned later in the file. This was wrong: bare `showPulseToast(...)` calls elsewhere in the same enclosing script resolve to a *different* closure-scoped function than the one reachable via `window.showPulseToast`. Confirmed only by triggering a real wrong-answer through the UI and observing which element actually appeared. Multi-owner/multi-scope confusion is the single most common root cause of bugs in this codebase — verify liveness empirically, not by reference-counting greps.

## Current state (2026-07-05, end of session)
- SW `cozy-arcade-v108` (local; push/live status — check the two gates above before trusting this).
- This session's fixes, in order: `ADVANCE-LOCK-SELF-CANCEL`, `REVEAL-TRIGGER-CHURN` root cause, duplicate/offscreen HUD home buttons, double-rendered Pause/Exit icons, gate-completion-banner removal, neural-pulse v1→v4, Shadow Dungeon dead-dropdown + duplicate-modal removal.
- **Flagged, not touched, genuinely delicate:** SM2/card-pool filter logic (`scope==='due'`/`'review'`) independently reimplemented 5-6 times across the file. Do not consolidate without tracing which implementation is live for each of main-page Solo / Shadow Dungeon / Domain first.
- **Flagged, not touched:** `.pulseToast351` vs. `vEnergyPulse` — two real parallel feedback systems firing for different triggers. Needs a deliberate consolidation design decision from the user (which one should be canonical), not a reactive fix.
- M2 Stripe stays paused per explicit 2026-06-18 user decision (see memory / PHASE2's project docs) — do not resume without being asked.

## Documents in this repo, what each is for
- `GOAL.md` — active goal + gate log (mostly historical/stale before 2026-07-05, has a fresh "UPDATE 2026-07-05" section at the top now — treat everything below that as historical unless cross-checked).
- `RECTIFIER_PLAN_2026_05_26.md` — the coding-error/lesson log for this repo. Read the most recent dated section before starting any new work; it documents mistakes already made so you don't repeat them.
- `COZY_ARCADE_PROJECT_STATUS_2026-07-04.md` — the current session's detailed fix-by-fix status (most granular, most current record of exactly what changed and how it was validated).
- This file (`CLAUDE_HANDOFF_2026-07-05.md`) — standing rules + current-state summary, read this one first.
