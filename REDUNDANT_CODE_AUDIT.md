# Redundant Code Audit — cozy-arcade-app
*Written: 2026-05-29 | Based on session analysis of index.html (~17,400 lines)*

---

## Summary

| Category | Count | Impact |
|----------|-------|--------|
| Conflicting CSS property definitions (same property, different patches) | 11+ | Medium — last-in-file wins; earlier values are wasted parse/cascade work |
| Dead CSS selector blocks (target classes that don't exist in DOM) | 2 major | Low parse overhead; zero runtime cost, but confusing |
| Redundant DOM writes in updateKpis chain | 7-layer deep | Low — vFix5 writes wrong values, vFix8 immediately overwrites them |
| Dual-aliased FSRS progress fields | 4 pairs | Medium — every save/read must handle both spellings |
| Scattered mobile media queries | 35 blocks | High maintenance cost — last-wins chaos, no single source of truth |
| `cursorGlow` JS handler running on touch | 1 | Low — element is hidden; position updates are no-ops |
| Background animation on mobile | 1 | Medium — GPU compositor layer active during all game play |

---

## Findings

### R01 — `p.reps` (never set)
**Found in:** vFix5 `getFSRSDueCounts()` at line ~15083  
**Root cause:** vFix5 used `p.reps > 0` to detect reviewed cards. `reps` is NEVER written anywhere in this codebase. FSRS uses `seen_count` and `reviewed_count`.  
**Effect:** Every card was counted as "new" → Study Now badge always showed wrong count.  
**Fixed:** vFix8 (`getFSRSCounts()` uses `isSeen()` which checks `seen_count`). vFix8 overwrites the DOM values vFix5 wrote.  
**Residual:** vFix5's `getFSRSDueCounts()` still runs on every KPI update, writes wrong values, then vFix8 immediately overwrites them. Wasted DOM work per update cycle.  
**Phase 2 fix:** Remove `getFSRSDueCounts()` call from vFix5 wrapper and replace with direct DOM-read from corrected values; or collapse vFix5+8 into a single function.

---

### R02 — `soloTrack inset` — 11 conflicting definitions
**Lines:** 3, 40, 103, 120, 123, 128, 312, 12806, 12807, 13884, 13939, 14000  
**Values seen:** 290px → 258px → 245px → 250px → 230px → 240px → `calc(22vh + 58px)` → `calc(19vh + 52px)` → (back to) `calc(22vh + 58px)`  
**Winner (last in file):** Line 14000 — `inset: calc(22vh + 58px) 0 0 !important`  
**Effect:** 10 earlier definitions are dead parse weight. On mobile the final `calc(22vh)` version is correct and stable.  
**Phase 2 fix:** Single authoritative declaration. One `@media` block. Delete all prior patches.

---

### R03 — `.gameMain371` dead CSS block
**Location:** `<style id="cozy-mobile-shell-371-css">` at line ~12026 (~180 lines)  
**Root cause:** This block targets `.gameMain371` which is never applied to any game element. Game elements use `.game.solo` and `.game.domain`.  
**Effect:** Zero runtime effect. Browser parses ~180 lines of rules that never match. Confusion for future developers.  
**Phase 2 fix:** Delete entire `cozy-mobile-shell-371-css` block.

---

### R04 — `cursorGlow` JS still runs on touch
**Location:** Line ~430: `window.addEventListener('touchmove', ...)` updates `#cursorGlow` position  
**Status:** CSS already hides it: `@media (hover: none) { .cursorGlow { display: none !important; } }`  
**Effect:** On every touch-scroll, JS reads touch coordinates and sets `g.style.left/top`. Element is invisible. Wasted JS per touchmove event.  
**vFix26 fix:** Check `window.matchMedia('(hover: none)').matches` before touching the element (or just skip entirely since it's already visually gone).

---

### R05 — `bgMove` animation runs on mobile
**Location:** Line 3 — `.game::before { animation: bgMove 9s linear infinite }`  
**Effect:** Animated grid overlay runs on every game screen on all devices including mobile. On mobile it:  
- Triggers GPU compositing (creates a paint layer)
- Animates 9s loop indefinitely during study sessions  
- User cannot perceive the fine grid on small screens (it renders below actual game elements)  
**vFix26 fix:** `@media (max-width: 760px) { .game::before { animation: none !important; } }` — instant 0-cost CSS fix.

---

### R06 — FSRS progress field aliases (4 pairs)
**Pairs:**

| Canonical field | Legacy alias | Where alias is still read |
|-----------------|-------------|--------------------------|
| `p.seen_count` | `p.seen` (boolean) | vFix8 `isSeen()`, multiple progress checks |
| `p.reviewed_count` | `p.reviewed` | `getMasteryStats()` |
| `p.next_due_at` | `p.due` | vFix8 `isDueNow()`, atlas `isDue()` |
| `p.last_seen_at` | `p.last` | vFix17, vFix24, atlas streak |

**Status:** Both spellings are handled in every isSeen/isDue check (`p.due || p.next_due_at`). Export hardening (session 2026-05-27) removed alias export but kept alias read-fallback.  
**Phase 2 fix:** Consolidation migration in loadState() — normalize all aliases to canonical fields on load so downstream code can use a single name.

---

### R07 — `heroSub` defined 12+ times
**Lines:** 136, 1331, 5540, 5547, 5689, 5786, 6009, 8414, 8538, 8845, 10207, 10387, 12072  
**Effect:** Each patch tried to style/override the subtitle. Only the last wins. Many also set `textContent` in JS to ensure text is correct (showing `setHeroSub` calls were redundant too).  
**Phase 2 fix:** Single CSS definition + single JS assignment at boot.

---

### R08 — 35 scattered `@media (max-width: 760px)` blocks
**Count:** 35 (grep confirmed)  
**Root cause:** Each patch appended its own media query. Rules conflict; cascade determines winner per property.  
**Effect:** Unpredictable specificity battles. Understanding mobile layout requires reading all 35 blocks.  
**Phase 2 fix:** Consolidate into a single authoritative mobile block. Requires thorough testing.

---

### R09 — Card ID resolution inconsistency
**Patterns found:**
- `c.id || c.qid || c.card_id` (vFix5, vFix8)
- `c.card_id || c.id || c.qid` (different order — slightly different precedence)
- `c.qid_unique || c.qid || c.card_id || c.id` (Atlas deck map)
- `canonicalCardId(c)` (correct — single function, but not always used)

**Effect:** Progress lookups can miss cards if ID resolution doesn't match the key used when the card was rated.  
**Phase 2 fix:** All non-Atlas code should call `canonicalCardId(card)` exclusively.

---

### R10 — `domainTitle` triple definition
**Lines:** 3 (48px), ~5547 `@media(max-width:820px)` (30px), v175161 patch (hidden)  
**Winner:** v175161 hides it. The prior two definitions were preparation for a value that eventually got hidden entirely.  
**Phase 2 fix:** Remove the first two definitions; the hidden rule is the truth.

---

### R11 — `updateKpis` 7-layer wrapper chain (by design, but leaky)
**Wrappers:** vFix5 → vFix8 → vFix9 → vFix10 → vFix13 → vFix17 → vFix20 → vFix24 → vFix25  
**Design:** Correct — each outer wrapper calls inner first, then adds its own DOM updates.  
**Problem:** vFix5's wrapper writes wrong due/new counts → vFix8's wrapper immediately overwrites them. Two full DOM-write passes per KPI update for no visual benefit.  
**Phase 2 fix:** Collapse vFix5+8 into a single wrapper that writes correct values once.

---

### R12 — `progress.seen` and `progress.seen_count` both written
**Location:** `loadState()` at line ~11005: `progress.seen = Number(progress.seen_count || 0) > 0;`  
**Effect:** Every progress entry carries a redundant boolean `seen` derived from `seen_count`. This doubles the storage for a field that provides no additional information.  
**Phase 2 fix:** Remove `progress.seen` write; update all reads to use `seen_count > 0` directly.

---

## Phase 2 Action Plan

| Priority | Item | Scope | Risk |
|----------|------|-------|------|
| P1 | Collapse vFix5+8 into one accurate KPI wrapper | Medium | Low — both work correctly, just redundant work |
| P2 | Single authoritative `soloTrack inset` declaration | Large | Medium — must validate on all screen sizes |
| P3 | Delete `.gameMain371` dead CSS block | Large | Zero — targets non-existent class |
| P4 | Consolidate `@media(max-width:760px)` into one block | Very Large | High — high regression risk |
| P5 | `canonicalCardId()` everywhere for card ID resolution | Medium | Medium — must audit all lookup paths |
| P6 | Normalize FSRS aliases on `loadState()` | Small | Low — additive change with fallback |
| P7 | Remove redundant `progress.seen` field | Medium | Low — only `seen_count` needed |
| P8 | Single `heroSub` CSS definition | Large | Medium — many patches overrode it |

---

## Already Fixed This Session

| ID | Fixed by | Commit |
|----|----------|--------|
| R01 `p.reps` | vFix8 (runtime fix — wrapped, not deleted) | 3b6edbc |
| R04 `cursorGlow` CSS hide on touch | `@media (hover: none)` — existing patch | pre-session |
| R05 `bgMove` on mobile | vFix26 (CSS `animation:none` on `.game::before` at 760px) | d7d9994 |
| orbArena specificity battle | vFix23 (`#orbArena` ID selector beats all class rules) | c2570df |
| Mobile rating UX gap | vFix27 (swipe-to-rate + haptic feedback in reveal panels) | 3790ea7 |

---

*Last updated: 2026-05-29 — vFix38 shipped*  
*This audit is for Phase 2 planning. All items above are NON-BLOCKING for ABIM August 2026.*  
*Phase 2 = post-boards Capacitor scaffold + clean CSS architecture.*
