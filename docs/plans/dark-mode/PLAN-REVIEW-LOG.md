# Plan Review Log: dark mode for foodjazz.club
Phases 0-1 (recon + interrogation) complete — plan locked with Akshay 2026-09-18 ("go ahead", toggle added). MAX_ROUNDS=2.

## Round 1 — Codex

1. **P1 — The no-JS fallback produces unreadable content.** `PLAN.md:9` changes tokens without component overrides. Consequently, `.section-problem` becomes pale behind pale text, while white `.cook-card` surfaces retain newly pale text ([index.html:451](/private/tmp/claude-501/-Users-akshay-Documents-Obsidian-Vault/56da0015-5fc5-4595-9664-6d356d68092b/scratchpad/fj-dark/index.html:451)). This exceeds the accepted decoration-only degradation.  
   **Fix:** Apply the complete dark component rules and `color-scheme` under the no-JS media query, and verify with JavaScript disabled.

2. **P2 — The play icon mapping is backwards.** `PLAN.md:21–22` says the `.vt-play` icon should stay light while retaining its cream disc. The actual icon uses `fill: var(--charcoal)`; flipping that token makes the triangle nearly disappear against the disc ([index.html:428](/private/tmp/claude-501/-Users-akshay-Documents-Obsidian-Vault/56da0015-5fc5-4595-9664-6d356d68092b/scratchpad/fj-dark/index.html:428)).  
   **Fix:** Explicitly retain a dark `.vt-play svg` fill in dark mode, including hover.

3. **P2 — Keeping `--sage-deep` unchanged breaks text contrast.** `PLAN.md:18` treats it as a button-fill token, but it also colors ordinary links and secondary-button text. Its calculated contrast is only **3.47–3.78:1** against the proposed backgrounds, below G3’s 4.5:1 requirement; one affected link even uses an inline declaration ([private-cooking-lessons-bay-area.html:373](/private/tmp/claude-501/-Users-akshay-Documents-Obsidian-Vault/56da0015-5fc5-4595-9664-6d356d68092b/scratchpad/fj-dark/private-cooking-lessons-bay-area.html:373)).  
   **Fix:** Separate the button-fill and text-accent roles, explicitly covering inline uses and interaction states.

4. **P2 — The proposed nav insertion contradicts pixel-identical light mode.** Adding a 40px button plus the existing 20px gap expands `.nav-right`; the parent’s `justify-content: space-between` then moves the middle links outside G1’s permitted toggle box ([index.html:120](/private/tmp/claude-501/-Users-akshay-Documents-Obsidian-Vault/56da0015-5fc5-4595-9664-6d356d68092b/scratchpad/fj-dark/index.html:120)). Screenshots at 390 and 1440 also cannot establish the stated 769–1440 layout guarantee.  
   **Fix:** Specify placement that preserves existing item positions and verify breakpoint-adjacent widths with the scroll CTA visible.

5. **P2 — Theme persistence misses restored pages.** The initialization/change-listener design in `PLAN.md:8,29` omits history restoration: visit a subpage in light mode, navigate home, select dark, then press Back; a back-forward-cache restoration can retain the old light DOM without rerunning the head script. Other open tabs likewise stay stale.  
   **Fix:** Reconcile the stored preference on `pageshow` and `storage`, updating the attribute, controls, meta, and system-following state together.

6. **P2 — G1/G2 can pass without inspecting substantial content.** Disabling transitions does not reveal `.reveal-up` or outcomes headings: visibility depends on intersection observers and timers ([index.html:2050](/private/tmp/claude-501/-Users-akshay-Documents-Obsidian-Vault/56da0015-5fc5-4595-9664-6d356d68092b/scratchpad/fj-dark/index.html:2050)). Full-page captures also omit the open mobile menu, expanded FAQ answers, confirmation modal, and form errors.  
   **Fix:** Deterministically reveal content, await fonts/images, and capture those interactive states separately in both themes.

7. **P2 — The shared meta-update assumption is false.** Unlike the other three pages, `r.html` and `refer.html` contain no `theme-color` meta element; blindly updating an existing element will throw, while a null guard alone leaves the requirement unmet.  
   **Fix:** Explicitly create the missing meta elements before the bootstrap script runs.

VERDICT: REVISE

### Claude's response
- 1 (no-JS fallback): accepted the problem, different fix. Dropped the token-only fallback entirely; no-JS visitors get light mode. Duplicating every component override into a media query doubles the block and the drift risk for a tiny audience.
- 2 (play icon): accepted. `.vt-play svg` pinned dark incl. hover.
- 3 (sage-deep as text): accepted. New `--accent-text` token (light = sage-deep, identical render), all text/inline uses moved to it; fills stay on sage-deep.
- 4 (nav reflow): accepted. Toggle absolutely positioned against `.nav-right` so it takes no layout space; nav checked at 769/900/1024/1100/1280/1440 with CTA hidden and visible.
- 5 (bfcache/tabs): accepted. One applyTheme() reconciler on load, pageshow, storage, and system change.
- 6 (capture gaps): accepted. Harness forces reveal states, awaits fonts, pins hero height, and adds menu-open, FAQ-open, modal and signup-state captures; JS-off check added to G1.
- 7 (missing theme-color meta): accepted. Added to r.html/refer.html head; script creates it if absent.

## Round 2 — Codex

The no-JS fallback, accent-text token, desktop positioning, cache/tab reconciliation, and missing-meta changes address the prior findings. The play-icon correction is present, but one contradictory instruction remains.

1. **P2 — G1 cannot pass for the open mobile menu.** [PLAN.md:55](/private/tmp/claude-501/-Users-akshay-Documents-Obsidian-Vault/56da0015-5fc5-4595-9664-6d356d68092b/scratchpad/fj-dark/PLAN.md:55) permits differences only inside the toggle’s box. Inserting a row above “Call or Text” also moves that row, “Apply Now,” and the menu’s bottom edge. These differences occur outside the permitted box.  
   **Fix:** Define a mobile-menu exception for the inserted row and resulting displacement, while separately verifying existing rows’ appearance.

2. **P2 — The modal capture can still conceal regressions.** The revised harness disables animations, but `.modal-stagger` starts at `opacity: 0` and becomes visible through animation; the checkmark similarly needs its final stroke offset (`index.html:2281–2301`). Disabling those animations without setting their final states produces an incomplete modal screenshot. Randomized confetti also undermines exact comparisons.  
   **Fix:** Explicitly finalize modal opacity/transforms/checkmark strokes, suppress confetti, and assert modal content is visible before capture.

3. **P2 — The signup error color fails the proposed contrast gate.** [r.html:186](/private/tmp/claude-501/-Users-akshay-Documents-Obsidian-Vault/56da0015-5fc5-4595-9664-6d356d68092b/scratchpad/fj-dark/r.html:186) hardcodes error text to `#b4553f`; against the proposed newsletter background `#1F231D`, contrast is approximately **3.28:1**, below 4.5:1. Capturing merely “its status note shown” does not ensure this state gets checked.  
   **Fix:** Specify a compliant dark error-text color and explicitly capture the invalid-email state.

4. **P3 — The play-icon instructions still contradict each other.** [PLAN.md:22](/private/tmp/claude-501/-Users-akshay-Documents-Obsidian-Vault/56da0015-5fc5-4595-9664-6d356d68092b/scratchpad/fj-dark/PLAN.md:22) still lists `.vt-play` among icons that “must stay light,” while line 23 correctly pins its triangle dark.  
   **Fix:** Remove the stale `.vt-play` example from line 22.

VERDICT: REVISE

### Claude's response
- All four accepted and folded into PLAN.md: mobile-menu exception in G1 with per-row crops; modal final-state + confetti suppression + visibility assert; dark error colour #E08A72 and an invalid-email capture; stale .vt-play example removed.
- MAX_ROUNDS=2 reached with VERDICT: REVISE. No disagreement remains; the final revision is NOT re-reviewed by Codex. Flagged to Akshay rather than claimed as approved.
