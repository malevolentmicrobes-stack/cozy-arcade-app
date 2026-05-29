# Cozy Arcade Board Prep — Project Status
*Updated: 2026-05-29 (autonomous session — vFix5 through vFix28 shipped)*

---

## TL;DR — What Works Right Now

| Feature | Status |
|---------|--------|
| Solo Runner game (FSRS + 4-col choices) | ✅ Working |
| Knowledge Expansion game (orbs) | ✅ Working |
| FSRS v5 spaced repetition (17/17 validation) | ✅ Working |
| Neural Atlas inline (constellation + card browser) | ✅ Working |
| Atlas: Pin/Bury from card detail | ✅ Working (vA10) |
| Atlas: Study filtered session from card detail | ✅ Working (vA9) |
| Atlas: Personal notes per card | ✅ Working (vA11) |
| Import JSON/CSV decks | ✅ Working |
| Export deck + FSRS progress | ✅ Working |
| Undo last answer (Cmd+Z / shake) | ✅ Working |
| PWA offline support | ✅ Working (sw.js) |
| HUD single-row compact bar | ✅ Fixed (vFix4+vFix5 JS) |
| HUD home button visible in game | ✅ Fixed (vFix5 — rescued from orphan group) |
| Home screen: FSRS-accurate due/new counts | ✅ Fixed (vFix5) |
| Home screen: ⚔️ Study Now quick-launch | ✅ Added (vFix5) |
| KE orbs: no overlap on mobile | ✅ Fixed (vFix6 — separation pass) |
| End-of-game: Missed cards list | ✅ Added (vFix7) |
| Home: FSRS due/new counts (bug fixed) | ✅ Fixed (vFix8 — p.reps→seen_count) |
| Home: Mastered/In Review/Retention stats | ✅ Added (vFix8) |
| Home: Study streak counter | ✅ Added (vFix8) |
| Home: Weak-system focus chips (direct launch) | ✅ Fixed (vFix9 — naLaunchSysReview, zero extra taps) |
| End-of-game: "Drill N Missed Cards" button | ✅ Added (vFix9 — targeted re-run of missed cards) |
| Home: Board Readiness Map (all systems) | ✅ Added (vFix10 — per-system bars, ABIM countdown) |
| Reveal: "Board Pearl" one_thing shown automatically | ✅ Added (vFix11 — MutationObserver, Solo + KE) |
| End modal: Session accuracy + rating breakdown | ✅ Added (vFix12 — N cards, % correct, again/hard/good/easy) |
| Home: Session size picker (10/25/50/All) | ✅ Added (vFix13 — persists in localStorage) |
| Reveal: Explanation auto-shown on wrong answers | ✅ Added (vFix14 — <details> element, auto-opens) |
| Reveal: Leech warning badge (Missed N times) | ✅ Added (vFix15 — amber/red badge, p.lapses ≥ 2) |
| Reveal: Scroll-to-top on each card (bug fix) | ✅ Fixed (vFix16 — vFix14 regression resolved) |
| In-game: Session card counter overlay | ✅ Added (vFix16 — "N cards" or "N/max" bottom-right) |
| Home: Today: N cards studied stat | ✅ Added (vFix17 — 6th tile in mastery panel) |
| Reveal: 📌 Pin toggle button | ✅ Added (vFix18 — pin/unpin mid-game, persists via saveState) |
| Reveal: 🔁 Later flag button | ✅ Added (vFix19 — queue cards; "Study Flagged (N)" drill button at end modal) |
| Home: Daily Goal progress bar | ✅ Added (vFix20 — 10/20/30/50 goal picker; blue→green fill; persists) |
| Reveal: ✏️ Quick Note on Board Pearl | ✅ Added (vFix21 — inline textarea; saves to user_one_thing; user note overrides deck pearl) |
| Home hero: ABIM countdown chip | ✅ Added (vFix22 — amber pill "N days · ABIM"; red ≤30d; green post-boards) |
| KE orbs: no overlap on mobile (CSS fix) | ✅ Fixed (vFix23 — #orbArena ID selector; promptBox max-height cap) |
| Home hero: Study pacing projection | ✅ Added (vFix24 — "X unseen · Y/day needed · avg Z/day"; green/amber/red) |
| Home: 🔁 Drill Weak Cards button | ✅ Added (vFix25 — red CTA for lapses ≥ 2 cards; direct drill launch) |
| Mobile: bgMove animation disabled on phones | ✅ Fixed (vFix26 — saves GPU compositor layer during game play) |
| Reveal: swipe-to-rate gesture | ✅ Added (vFix27 — left/right swipe rates card; scroll unaffected; flash + haptic) |
| Home: 7-day study heatmap | ✅ Added (vFix28 — colored squares below daily goal bar; green/cyan/amber/gray scale) |
| Game: In-session elapsed timer | ✅ Added (vFix29 — ⏱ M:SS fixed bottom-left; starts on game entry; stops on home) |
| Home: 🎯 Daily Goal celebration | ✅ Added (vFix26 — confetti sparks + toast on first goal completion each day) |
| Question card: readable font | ✅ Fixed (vFix3) |
| 4 answer choices in a row (not 2×2) | ✅ Fixed (vFix3) |
| Warm palette (home/settings) | ✅ Working (vPhaseD) |

---

## Architecture (unchanged)

- **Single file:** `index.html` (~15,740 lines). All patches appended as `<style id="vXXX">` / `<script id="vXXX">` before `</body>`.
- **Live URL:** `malevolentmicrobes-stack.github.io/cozy-arcade-app`
- **Repos:** `cozy-arcade-app.git` (this file); `cozy-arcade-app-PHASE2.git` (keep separate)
- **Data:** 1249 ABIM cards in localStorage. FSRS progress in `cozy_arcade_progress_v1`.

---

## What Was Fixed This Session (2026-05-29)

### vFix4 — HUD single-row (JS-guaranteed)
**Problem:** HUD persisted as 2-row layout despite vFix3 CSS patch. Root cause: CSS cascade
battles between `!important` declarations at equal specificity — earlier CSS was winning.

**Fix:** `element.style.setProperty(prop, val, 'important')` from JS creates inline-important
declarations which sit ABOVE any stylesheet author rule in the cascade. Cannot be overridden.
- Runs at DOMContentLoaded + 300ms + 800ms + 1800ms
- Re-runs on every game-start click (normalizeHud restructuring is post-click)
- Hides orphan hudGroups from older patches
- Hides `|` separator button
- Energy pill hidden from HUD row (ceChip floating at center already shows it)

### vA11 — Personal notes in Atlas card detail
**Feature:** "My Note" textarea appears at the bottom of every Atlas card detail.
- Saves to `phase3State.progress[cardId].user_one_thing` on blur or Cmd+Enter
- Reads existing value on open (persists across sessions via FSRS export)
- Chains off A9/A10 wrapper (A11 layer applied after the A10 injectCardActions call)
- Auto-saves silently with "✓ Saved" flash

---

## Should You Rebuild from Scratch?

**Short answer: No — not before ABIM August 2026.**

Long answer: The CSS is genuinely messy (88 patch blocks, 1,126 `!important`). But:
- All critical features work (FSRS, Atlas, games, export)
- Rebuilding takes 2-3 sessions with regression risk
- The JS-override approach for HUD (vFix4) eliminates the CSS cascade battle permanently

**The real roadmap:**
1. Now → August 2026: Keep current app. Study. Pass boards.
2. Post-ABIM: Capacitor iOS scaffold (native app wrapper for the single HTML)
3. Post-ID fellowship match: Broader platform work (multi-user, decks marketplace)

The architecture does NOT need a rewrite — it needs Capacitor + better CSS organization (which is a separate track). The app is functional enough to be your primary ABIM study tool.

---

## Next High-Value Items (not urgent)

| # | Item | Time | Value |
|---|------|------|-------|
| 1 | KE orb layout — prevent overlap on mobile | 20min | Medium |
| 2 | P8: CSP headers via vercel.json | 15min | Low |
| 3 | Home screen: "X due today" badge | 30min | High |
| 4 | iOS1: Capacitor scaffold | 60min | High (post-boards) |

---

## Active Constraints (never violate)

- localStorage keys: `soloStudyingState_v1757`, `cozy_arcade_progress_v1`, `cozyQuestionSeconds351`, `bionicOn_v1751523`
- Protected functions: `rate()`, `rateCard()`, `advance()`, `fullCard()`, `saveState()`, `updateKpis()`, `canonicalCardId()`, `importDeck()`
- All patches appended before `</body></html>` — never edit inline
- Never cross-push between `cozy-arcade-app.git` and `cozy-arcade-app-PHASE2.git`
- `runFSRSValidation()` must stay 17/17 after any change
