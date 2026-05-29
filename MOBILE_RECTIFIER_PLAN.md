# Mobile Rectifier Plan — cozy-arcade-app
*Senior audit. Independent. Written before cross-checking user notes. 2026-05-28*
*Last updated: 2026-05-29 — vFix16 shipped*

## Patch Status (as of 2026-05-29)

| Patch | Description | Status | Commit |
|-------|-------------|--------|--------|
| vA01 | CSS variable foundation (`--warm-bg`, `--warm-accent`, cold `.game` pin) | ✅ | prior |
| vB01 | One authoritative mobile layout block; orbArena id-specificity fix | ✅ | prior |
| vC1C2 | HUD simplified; Energy shift → ⚡ chip; ENERGY SHIFT box hidden | ✅ | prior |
| vC4 | Prompt AI → `<details>` collapsible | ✅ | prior |
| vC3C5 | KE prompt font clamp; KPI 2-col; Upload/Download compact row | ✅ | d17943c |
| vC6 | "Import a deck first" overlay with ✕ + Upload shortcut | ✅ | d17943c |
| vC7 | iOS select flicker guard on `refreshHomeFilters` | ✅ | d17943c |
| vPhaseD | Warm palette: home/settings amber; game screens cold | ✅ | d17943c |
| P7 | PWA: sw.js + manifest + registration | ✅ | 9f0ef43 |
| vA9 | Atlas card detail "▶ Study [tag/sys]" buttons | ✅ | f606645 |
| vA10 | Atlas card detail Pin/Bury toggles | ✅ | f16a04f |
| vFix1 | ceChip centered; import overlay → home() after upload | ✅ | prior |
| vFix3 | Question font weight→700, size reduced; 4-col solo choices; edge-to-edge card | ✅ | 86c4409 |
| vFix4 | HUD single-row via JS setProperty (beats all CSS) | ✅ | 5779719 |
| vA11 | Atlas personal note textarea → `user_one_thing` in progress | ✅ | 5779719 |
| vFix5 | Home button rescue; FSRS-accurate due/new KPIs; ⚔️ Study Now quick-launch button | ✅ | 8d9a9fa |
| vFix6 | **KE orb overlap fix** — 5-pass separation algorithm; starting radius raised to 68px so orbs spread at p=0 | ✅ | 16076b9 |
| vFix7 | **Session missed-cards summary** — "Missed this session (N)" list in end modal; reads last/rating from progress | ✅ | 16076b9 |
| vFix8 | **Bug: vFix5 used p.reps (never set) → fixed to seen_count**; mastery stats panel (Mastered/Learning/Retention); streak; weak-system chips | ✅ | 3b6edbc |
| vFix9 | **Bug: chips called showAtlasScreen → fixed to naLaunchSysReview**; "Drill N Missed Cards" button in end modal; drill cardPool filter + home() cleanup | ✅ | 019f554 |
| vFix10 | **Board Readiness Map** — per-system mastery bars (color-coded red/amber/green), ABIM countdown in toggle header, each row launches naLaunchSysReview | ✅ | 209cd9d |
| vFix11 | **Board Pearl in reveal** — `one_thing` shown as amber-gold "📌 Board Pearl" box in Solo + KE reveal panels via MutationObserver; re-injects per card | ✅ | 923121b |
| vFix12 | **Session stats in end modal** — N cards studied, % correct, rating breakdown (again/hard/good/easy) | ✅ | 9683ea2 |
| vFix13 | **Session size limit** — "Cards: 10/25/50/All" picker; persists; cardPool wrapper slices after FSRS sort | ✅ | 46c330b |
| vFix14 | **Explanation in reveal** — `<details>` collapsible, auto-opens on wrong answers; 150ms MutationObserver | ✅ | a1cdec7 |
| vFix15 | **Leech warning badge** — amber/red "Missed N times" below diagnosis when p.lapses ≥ 2 | ✅ | b2f28a5 |
| vFix16 | **Fix: reveal scroll-to-top** (regression from vFix14 auto-open) + **session card counter** bottom-right overlay ("N cards" or "N/max") | ✅ | 1847316 |
| vFix17 | **Today: N cards studied** stat tile in mastery panel; outermost updateKpis wrapper; counts last_seen_at/last == today ISO date | ✅ | c54eea7 |

## Remaining Items

| Item | Priority | Notes |
|------|----------|-------|
| P8 CSP headers | Low | `vercel.json` |
| M2 Stripe | Low | post-ABIM |
| iOS1 Capacitor | Medium | after boards — wraps current HTML natively |
| iOS native `<select>` full fix | Low | vC7 guard in place; full fix = custom dropdown |

---


---

## Audit Findings

### The Numbers
| Metric | Value | Meaning |
|--------|-------|---------|
| Total lines | 13,722 | Single HTML file |
| `<style>` + `<script>` blocks | 88 | Each is a patch stacked on prior patches |
| `!important` declarations | 1,126 | Every patch had to fight the previous one |
| `:root` definitions | 2 | Line 2 + line 5680 — CSS vars defined twice |
| `@media(max-width:760px)` blocks | 9+ | Scattered, conflicting, last-wins chaos |
| `.soloTrack` `inset` overrides | 7 different values | 258px → 245px → 250px → 230px → 240px → calc() |
| Dead/unreachable selectors found | ~12 | `cursorGlow`, `gameMain371`, some `choiceTop` vars |

### What's Actually Wrong (not symptoms — root causes)

**1. No single source of truth for any value.**
`soloTrack inset` is defined 7 times across 7 different patches. The final computed value is whatever was last appended. There is no way to know which value is "correct" without running the app and measuring.

**2. CSS variables exist but aren't used.**
Line 2 defines `--cyan`, `--bg`, `--panel`, `--gold`, etc. Line 5680 adds `--cozy-cyan`, `--cozy-gold`. Neither set is used consistently — 95% of rules hardcode `#67e8f9` instead of `var(--cyan)`. This means no palette swap is possible without touching hundreds of lines.

**3. Two competing mobile layout systems.**
- The original `@media(max-width:820px)` block + nested 760px sub-blocks (lines 3–163)
- The `cozy-mobile-shell-371-css` at line ~12026, which targets `.gameMain371` — a class that does NOT appear on game elements (they use `.game.solo`, `.game.domain`). This entire block is dead CSS.

**4. `cursorGlow` is a desktop-only element (mouse tracking).**
It's injected via JS, positioned via `mousemove`. On mobile it never moves, renders at (0,0), and wastes a compositor layer. Should be disabled on touch devices.

**5. The `domainTitle` ("Knowledge Expansion" heading) is 48px on desktop, overridden to 30px at 760px, then hidden by v175161 patch. All three definitions are in the file. Only one matters.**

**6. Settings "Prompt AI" is a static pre-formatted text block inside a `.box` div.** It takes ~120px on mobile, always visible. The content is rarely changed — it should be a `<details>` element.

**7. Home screen bottom section is three full-width stacked buttons (Upload / Download / Progress) + 5 individual KPI tiles.** On mobile this is a long scroll of visually identical dark rectangles. Not "cozy arcade" — it looks like a settings page.

**8. Knowledge Expansion topbar on mobile has "Knowledge Expansion" title + Energy Level + Score all on one cramped line** at ~9-10px readable size. The energy meter concept ("Energy Shift +/-") adds cognitive load with no gameplay payoff on mobile.

---

## What to Preserve Absolutely (Non-Negotiables)

| Element | Why |
|---------|-----|
| `drawerBionic351` checkbox + `drawerQuestionTime351` select | Perfect working state |
| `updateDrawer351()` 700ms guard | Layout/font stability |
| `rate()`, `rateCard()`, `advance()`, `fullCard()`, `saveState()`, `canonicalCardId()`, `importDeck()` | FSRS scoring + progress integrity |
| All localStorage keys: `soloStudyingState_v1757`, `cozy_arcade_progress_v1`, `cozyQuestionSeconds351`, `bionicOn_v1751523` | Study history |
| Neural Atlas (`#atlas`, `na-` prefix, all atlas JS) | Working feature |
| The hunter/sword character animation | Identity + delight |
| `runFSRSValidation()` → 17/17 | Exam accuracy gate |
| All card content rendering | Medical accuracy non-negotiable |

---

## The Plan: 4 Phases

### Phase A — Variable Consolidation (foundation, no visual change)
**Goal:** Make a single CSS variable swap possible. Zero visual change.

1. Audit every hardcoded color (`#67e8f9`, `#7c3aed`, `#020611`, `rgba(103,232,249,...)`) and map to existing variable names
2. Append one authoritative `:root` override that sets warm-home / cold-game variable split:
   ```css
   :root { /* cozy home palette */ }
   .game { /* arcade cold palette — overrides at game level */ }
   ```
3. The existing two `:root` blocks are left untouched (too risky to edit inline). The new override wins by cascade position (appended last).

**Result:** All future color changes touch 1 block, not 88.

---

### Phase B — Dead CSS Audit + One Authoritative Mobile Block
**Goal:** Replace 9 conflicting `@media(max-width:760px)` blocks with one final authority block.

Selectors to confirm dead (verify before removing):
- `.gameMain371`, `.gameHud`, `.game-shell` — class names from old shell that don't appear in HTML
- `cursorGlow` on touch — disable via `@media(hover:none){.cursorGlow{display:none}}`
- Old `soloTrack` inset values at lines 40, 103, 120, 123, 128, 312, 12806 — all superseded by v175161 calc

Strategy: **don't delete** existing blocks (too risky). Instead, append one final `<style id="v175162-mobile-authority-css">` that:
- Re-declares every contested selector with a single authoritative value
- Uses `calc()`-based insets for soloTrack / orbArena (phone-height-aware)
- Is the only place anyone needs to look for mobile layout

---

### Phase C — Screen-by-Screen Mobile Fixes
*(Each item is one focused append — never editing prior code)*

#### C1: HUD Simplification (both games)
**Problem (IMG_8352, IMG_8357):** "Energy Level · +0 CE" + "Score 1000" compete for one cramped row. Gate/Round pill + streak + pause fill a second row. On a 390px-wide phone this is illegible.

**Fix:** On mobile, show only `Score` + `Round` in the HUD. Move streak to a transient toast (already exists). Energy label → abbreviate to just the delta when it changes ("+CE" flash, not a persistent label).

#### C2: Knowledge Expansion — Energy Shift Redesign  
**Problem (IMG_8352, IMG_8357, IMG_8358):** "ENERGY SHIFT" box takes 30% of the reveal panel. The long explanation text ("You found the current edge of recall...") is valuable content buried in a large styled div.

**Fix:** Collapse to a small inline badge: `⚡ +1 CE` or `⚡ –1 CE` that animates in for 1.5s then fades. The full explanation moves into the trigger/board-trigger section (already there as text).

#### C3: Knowledge Expansion — Prompt Card Proportions
**Problem (IMG_8357):** Card is too tall, text too large, squished. "HEM/ONC" badge + full prompt text don't fit.

**Fix:** C1 HUD fix recovers ~40px. v175161 already caps card at 20vh. Refine font-size to `clamp(13px,3.8vw,18px)` (current `clamp(13px,…)` values are inconsistent across patches).

#### C4: Settings — Prompt AI as Collapsible
**Problem (IMG_8351):** Full Prompt AI rules block always visible, ~120px tall on mobile.

**Fix:** Wrap existing `.box` content in `<details><summary>Prompt AI ▾</summary>…</details>` via JS patch. Closed by default. Content preserved exactly — only the container changes.

#### C5: Home Screen Redesign (bottom section)
**Problem (IMG_8360, IMG_8361):** Three stacked full-width buttons (Upload / Download / Progress) look like a settings page. KPI tiles (1249 / 22 / 12 / 1237 / 6) each take a full row.

**Fix:**
- Merge Upload + Download into a single `Import / Export ▾` dropdown chip (matches atlas button pattern)
- KPIs: restore 2-column grid on mobile (already works at 820px — it breaks down at 390px; fix with `repeat(2,1fr)` down to 320px)
- "Progress" button moves to its own subtle link below the KPI grid (it opens Atlas — already styled as primary)

#### C6: Home "Import a deck first" popup
**Problem (IMG_8360):** Tooltip/overlay shown when Review is clicked without a deck. No dismiss button visible. No upload affordance within it.

**Fix:** Add `✕` close button to the popup. Add a single "Upload deck" shortcut inside it.

#### C7: Review Screen Redesign
**Problem (user note + IMG_8361):** "Review Deck" heading + full review UI is styled differently from the rest of the app. Inconsistent dark aesthetic.

**Fix:** Match the Atlas import button style — dark pill header, `Progress` label in cyan, Upload/Download as icon-only pills within the same box.

---

### Phase D — Warm/Cold Aesthetic (after A-C are stable)
**Goal:** Home + Settings + Atlas feel "cozy." Gameplay feels "arcade."

| Screen | Background | Accent | Glow |
|--------|-----------|--------|------|
| `#home`, `.screen` (settings, review) | `#130c08` — warm near-black | `#f5c97a` gold | amber ember |
| `.game` (solo + domain) | `#020611` — current cold | `#67e8f9` cyan | keep current |
| `#atlas` | `#0a0f1a` — neutral dark | keep `--na-cyan` | keep current |

Token changes only (`:root` override + `.game` override). Every element that uses `var(--bg)`, `var(--panel)`, `var(--accent)` picks up the shift automatically. Elements still using hardcoded colors get a targeted selector in the same block.

---

## Cross-Check Against User Notes (after independent audit)

| User note | Independent finding | Alignment |
|-----------|-------------------|-----------|
| Prompt AI as dropdown | Confirmed: big static block | ✅ Same fix |
| Top bar too cluttered mobile | Confirmed: HUD crammed, illegible | ✅ C1 fix |
| Energy Shift — smaller, just words + score | Confirmed: oversized on mobile | ✅ C2 fix |
| Card font too large/squished in KE | Confirmed: clamp values inconsistent | ✅ C3 fix |
| ↑↓ arrows removed | Already done in v175161 | ✅ Done |
| Anime character great, smaller on mobile | Already scaled in v175161 | ✅ Done |
| cursorGlow irrelevant on mobile | Confirmed: wastes layer | ✅ disable on touch |
| Import deck popup — allow upload from popup, add X | Confirmed: no dismiss | ✅ C6 fix |
| Review section redesign | Confirmed: inconsistent | ✅ C7 fix |
| Upload/Download → dropdown | Confirmed: 3 buttons = bloated | ✅ C5 fix |
| Warm arcade aesthetic | Confirmed: cold everywhere | ✅ Phase D |
| Less words = more | Confirmed: "ENERGY SHIFT" verbose | ✅ C2 + C1 |
| Side view / landscape anticipation | iPad screenshot confirmed (IMG_8359) | ✅ Phase C landscape rules |

---

## Implementation Order (priority = study impact first)

| # | Task | Phase | Risk | Study Impact |
|---|------|-------|------|-------------|
| 1 | CSS variable consolidation + warm/cold root | A | Low | Enables all else |
| 2 | One authoritative mobile block | B | Low-Med | Kills glitch cascade |
| 3 | HUD simplification | C1 | Low | Daily use |
| 4 | Prompt AI collapsible | C4 | Low | Settings UX |
| 5 | KE energy shift redesign | C2 | Med | Daily use |
| 6 | Home bottom section redesign | C5 | Med | Entry UX |
| 7 | Import popup dismiss + upload | C6 | Low | Onboarding |
| 8 | Review screen redesign | C7 | Med | Weekly use |
| 9 | Warm/cold palette | D | Low | Aesthetic |
| 10 | KE card proportions final tune | C3 | Low | Daily use |

---

## Gate: Before Each Phase Ships
- `window.runFSRSValidation()` → 17/17
- `window.runCozySmokeTests()` → 6/6
- Bionic toggle: uncheck → Apply → reopen → still unchecked
- Timer shows and counts down in Solo
- Solo select → reveal → rating → next card cycles correctly
- KE orbs appear and are tappable

---

*This plan lives in `cozy-arcade-app/` only. PHASE2 is not touched.*
