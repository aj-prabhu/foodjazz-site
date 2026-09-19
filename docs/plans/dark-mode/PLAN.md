# Plan: dark mode for foodjazz.club
_Locked via claudex-loop — by Claude + Akshay (2026-09-18). Ledger and design defaults accepted in one reply ("go ahead"); toggle added by Akshay._

## Goal
foodjazz.club gets a dark theme that follows the visitor's system setting by default, plus a manual light/dark switch (in the phone menu, and as a small icon in the desktop nav). The choice persists across pages. Light mode must render exactly as it does today, apart from the new switch. Scope: `index.html`, `private-cooking-lessons-bay-area.html`, `intuitive-cooking.html`, `r.html`, `refer.html`. Out: `cohort.html` (unlinked), print/flyer/deck pages, `linkedin.html`, `og-image.html`.

## Approach
1. **Theme attribute, set before paint.** In the `<head>` of every in-scope page, before the first `<style>`/stylesheet, an inline script sets `document.documentElement.dataset.theme` to `"dark"` or `"light"`: stored choice in `localStorage['fj-theme']` wins (wrapped in try/catch; storage can throw), else `matchMedia('(prefers-color-scheme: dark)')`. When there is no stored choice, it also listens for `change` on that media query and updates the attribute live. It sets the `theme-color` meta to the matching background.
2. **No-JS visitors get light mode.** No token-only media-query fallback: tokens without the component overrides produce unreadable pairs (pale `.section-problem` behind pale text, pale text on white cards). Every dark rule is gated on `:root[data-theme="dark"]`, which only JS sets.
3. **All dark rules live in one block per page**, appended at the end of that page's (first) `<style>`: `:root[data-theme="dark"] { …tokens… }` followed by `:root[data-theme="dark"] <selector> { … }` overrides. `color-scheme: light` on `:root`, `color-scheme: dark` on `:root[data-theme="dark"]`. **No existing light-mode declaration is edited**, except where a hardcoded value must become a token to be overridable (only if an override selector can't reach it); any such edit must render identically in light.
4. **Dark tokens (index.html; mirror for the other pages' own `:root`):**
   - `--cream` (page background) → `#1B1A17`
   - `--warm-white` → `#22211D`
   - `--sage-wash` (alternate sections) → `#1F231D`
   - `--linen` (footer, card surfaces) → `#25231F`; `--linen-border` → `#3A3731`
   - `--charcoal` (headings/strong text) → `#F1EBE1`
   - `--warm-gray` (body text) → `#CFC8BC`; `--medium-gray` → `#A39D93`
   - `--sage` → `#9DB090`; `--sage-light` → `#B9C8AE`; `--sage-muted` (rules/borders) → `#3A4235`; `--sage-deep` stays `#6a7a60` **as a button fill only** (white text, ~4.6:1)
   - **New token `--accent-text`** for sage-deep used as TEXT (links, secondary buttons, `.related-pages a`, the inline-styled link in `private-cooking-lessons-bay-area.html`, hover/focus states). Light value `var(--sage-deep)` so light renders identically; dark value `#B9C8AE`. Every text use of `--sage-deep`, including inline `style="color: var(--sage-deep)"`, is switched to `var(--accent-text)`; fills stay on `--sage-deep`.
   - `--wood` → `#CBA47A`; `--wood-dark` (h3 colour) → `#D2AE84`
   - `--golden` unchanged
5. **Dual-role tokens — the main trap.** Audit every `var(--charcoal)`, `var(--cream)`, `var(--linen)`, `var(--sage)`, `var(--warm-white)` use and classify it as TEXT or SURFACE. Flipping a token flips both roles. Known surfaces that must be re-pinned in dark: `.section-problem` (background `--charcoal` → becomes the deepest band `#121210` with a 1px `#2E2C28` top/bottom rule; its text colours are already light rgba and stay), any `--charcoal`/`--sage` backgrounds on buttons, cards (e.g. the highlighted "Intuitive" cook card), badges, pills; anything using `--cream` as text on a dark surface (e.g. `.section-problem h2`) must stay light. (`.vt-play` is the exception: see 6, its triangle is pinned dark.) List each re-pinned selector in the PR.
6. **Hardcoded colours in CSS** (from recon, lines ~130-930 of index.html): `white` text on buttons/nav CTA stays; `.cook-card` `background: white` → `var(--linen)` surface; `.cook-type--light`/`.cook-desc--light`/`stroke: white` stay (they sit on the sage card); `.vt-play` cream disc stays (sits on video) and its triangle (`.vt-play svg`, `fill: var(--charcoal)`) is pinned to `#2E2E2C` in dark, including `:hover`; `rgba(122,140,110,0.18)` borders → `rgba(185,200,174,0.16)`; golden rgba washes stay; `box-shadow rgba(46,46,44,…)` → `rgba(0,0,0,…)` at similar strength; mask gradients (`#000`/`#fff` in `mask-image`) are masks, not colours — leave.
7. **Inline SVG colours** (≈110 presentation attributes on index.html: `#7A8C6E`×29, `#D4A843`×28, `#B8956A`×14, `#C47A5A`×10, `#2E2E2C`×6, `#A8B89D`×2, `#8B6D47`×2, plus rgba fills). Override with attribute selectors scoped to dark, which beat presentation attributes without touching markup, e.g. `:root[data-theme="dark"] svg [stroke="#7A8C6E"] { stroke: #B9C8AE }`, `[fill="#7A8C6E"]` likewise; `#2E2E2C` (hero spiral/breath circles, deco strokes) → `#F1EBE1` at the element's existing low opacity; `#8B6D47`/`#B8956A` → `#D2AE84`/`#CBA47A`; `#D4A843`, `#C47A5A` and the translucent rgba fills stay. Check the wave dividers (`#A8B89D`) read on dark.
8. **Raster decorations and texture:** `.deco-veg` PNGs drop to roughly half their current opacity in dark; the `body::after` noise overlay halves its opacity. Press-row logo filter (sage tint) is recalculated to the dark `--sage` so logos stay visible; photos, videos, posters untouched (their mask fades reveal the page background, so they dissolve into dark automatically).
9. **Type on dark:** body copy weight 300 → 400 (`p`, `.about-bio`, `.hero-sub`, list copy) in dark only; headings unchanged.
10. **The switch.**
    - Desktop (>768px): an icon-only `<button class="theme-toggle">` that does **not take part in nav layout**: `.nav-right` gets `position: relative`, the button is `position: absolute; right: 100%; top: 50%; transform: translateY(-50%); margin-right: 0.75rem`, so `.nav-inner`'s `space-between` sees the same children widths and the logo/links/CTA don't move. 40×40 hit area, moon icon in light / sun icon in dark (inline SVG, `currentColor`), `aria-label` "Switch to dark mode"/"Switch to light mode" and `aria-pressed` updated on toggle, visible focus ring. Hidden at ≤768px. Must not overlap the "About" link at any width 769-1440 (check 769, 900, 1024, 1100, 1280, 1440 with the scroll CTA both hidden and visible).
    - Phone (≤768px): a list item inside `.mobile-nav`, above "Call or Text", reading "Dark mode" / "Light mode" with the same icon; tapping it toggles and closes nothing else.
    - Clicking sets `data-theme`, writes `localStorage['fj-theme']`, updates the `theme-color` meta, and stops following system changes.
    - **One `applyTheme()` reconciler** (in the head script, exposed on `window`) owns: the attribute, the switch label/icon/aria, the `theme-color` meta, and whether system changes are followed. It runs on load, on `pageshow` (covers back-forward-cache restores), on `storage` events (other tabs), and on the system `change` event when no choice is stored.
    - Only `index.html` gets the switch UI; the other pages just honour the stored choice/system via the head script.
    - The nav must not reflow at any width from 769 to 1440 when the icon is added (it sits in `.nav-right`, which already hosts the conditional CTA).
11. **`theme-color` meta:** `r.html` and `refer.html` have none; add a `<meta name="theme-color">` to their `<head>` (light value `#FAF7F2`) before the bootstrap script, and the script creates one if still missing.
12. **Signup error text on `r.html`:** the hardcoded `#b4553f` error colour is ~3.3:1 on the dark newsletter band; in dark it becomes `#E08A72` (≥4.5:1 on `#1F231D`), captured in the invalid-email state.
13. **Other pages** (`private-cooking-lessons-bay-area.html`, `intuitive-cooking.html`, `r.html`, `refer.html`): same head script, same token set mapped onto each page's own `:root` names, plus overrides for their surfaces (brand bar, `.sage` sections, city pills, FAQ items, `.quote-card`, `.gift`, the email `<input>` on `r.html`, `.price-anchor`, `.related-pages`). No toggle UI.

## Key decisions & tradeoffs
- **JS-set attribute as the single switch; no-JS stays light.** One set of dark selectors serves system default and manual toggle. Tradeoff: a no-JS visitor with a dark system setting sees the light site (readable, on-brand).
- **Override, don't edit.** Dark rules and SVG attribute selectors sit on top of the existing CSS so light mode can't drift. Tradeoff: selector-heavy block; accepted for safety.
- **Warm near-black from the brand charcoal, not neutral grey or pure black.** Matches `.impeccable.md` ("organic but refined", "not dark/techy/neon").
- **Two-state switch, no visible "system" option.** First visit follows the system; a click pins a choice. Room is tight on the homepage nav (Akshay). Clearing storage returns to system.
- **Escape hatch:** design defaults (palette, essay band, deco opacity, weight bump) were accepted as recommended, not individually debated.

## Assumptions
1. Pages in scope/out of scope as above — source: Akshay's brief.
2. index.html colours mostly via 17 `:root` tokens (146 `var()` uses); ~30 hardcoded CSS colour values and ~110 SVG presentation-attribute colours — source: recon script.
3. Other in-scope pages keep colours in their own `:root` (13-15 tokens each) with ~13-16 hex values — source: recon.
4. Photo/video fades use `mask-image`, so they reveal whatever background is behind them — source: `.hero-media img`, `.hero--photo .hero-media img`.
5. CSS properties in a stylesheet override SVG presentation attributes — source: SVG/CSS cascade rules.
6. Vercel auto-deploys every branch as a preview; `main` is production — source: repo history today.
7. The VideoAsk widget (sage bubble) and Tally are third-party and unaffected — source: embed config.

## Proof gates (must pass before the diff is shown to Akshay)
- **Capture harness (G1/G2):** same-origin iframe harness that forces the theme attribute, disables transitions/animations, forces every scroll-reveal element visible (`.reveal-up`, `.problem-line`, `.closing-tagline`, outcomes headings/checks — add `.visible`/final state), pauses videos on their poster, awaits `document.fonts.ready` and image decode, pins the hero height to a fixed px (it uses `svh`), and captures: top-of-page and full-page for all 5 pages at 1440 and 390; the index nav at 769, 900, 1024, 1100, 1280 with the scroll CTA hidden and visible; the phone menu open; one FAQ item expanded; the `?submitted=true` modal; the `r.html` signup in its success state and in its invalid-email error state. For the `?submitted=true` modal: set every `.modal-stagger` to its final opacity/transform, set the checkmark stroke to its final dash offset, suppress confetti (remove the confetti container or stub `launchConfetti`), and assert the modal text is visible before capturing.
- **G1 Light mode unchanged:** that full set captured with `data-theme="light"` on `origin/main` vs the branch; `magick compare -metric AE` must be 0 everywhere except (a) the toggle's own box in the desktop index nav and (b) the open phone menu, where the new row and everything below it shift; for (b), crop and compare the pre-existing rows individually (each must match its old self, just offset). Also load each page with JS disabled and confirm it matches light.
- **G2 Dark renders:** same set with `data-theme="dark"`; Claude reviews every screenshot for unreadable text, cream surfaces left behind, invisible icons, broken fades.
- **G3 Contrast:** computed ratios for dark body text on page/alt/card surfaces ≥ 4.5:1; large text and UI glyphs ≥ 3:1. Table in the PR.
- **G4 Behaviour:** no flash of the wrong theme on load (head script runs before styles); stored choice persists across `/`, `/intuitive-cooking`, `/r`; back-forward restore and a second tab both reconcile to the stored choice; with no stored choice the page follows a system change live; the switch label/icon/aria-pressed update; keyboard focus visible on the switch; storage exceptions don't break the page.

## Toolchain
- Claude: `impeccable` design context (`.impeccable.md`) for the palette review; no new generation.
- Codex: builds with workspace-write in the `feat/dark-mode` worktree; no skills required.

## Risks / open questions
- Dual-role tokens missed in the audit → a cream band or invisible text in dark. Mitigated by G2 full-page screenshots.
- Selector-override block is long; future light-mode edits need a matching dark override. Note added to `.impeccable.md`.
- Third-party widgets stay light-styled.

## Out of scope
`cohort.html`, print/flyer/deck/og pages, a visible "system" third option, per-page toggles outside `index.html`, re-shooting or re-grading any photo/video.
