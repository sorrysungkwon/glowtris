# Glowtris Design System Specification
## ✦ Unified Brand Identity & Interface Foundations

The **Glowtris Design System** harmonizes two distinct worlds: the intense, retro-arcade cyberpunk wireframe environment of the Glowtris game, and the modern, high-contrast, typographically-driven interface of the Glowtris Blog. 

By referencing structural categories of the **Google Material Design 3 (M3)** guidelines (such as Color Roles, Typography Scales, Shape Categories, and Elevation), this design system establishes a unified design language tailored to our neon wireframe aesthetic.

---

## 0. Golden Rule & Token Sources

> **Never hardcode a design value (color, size, radius, duration, easing) in component code. Reference a token.** If the value you need has no token, add the token to the source first, then reference it. Then update this document.

| Domain | Game source of truth | Notes |
| :--- | :--- | :--- |
| Mode colors | `:root { --mode-* }` in `src/style.css` + `MODE_COLORS` in `src/shared.js` | CSS for stylesheets; JS map for canvas (backgrounds, share cards). Keep in sync. Alpha → `hexToRgba(hex,a)`. |
| Brand colors | `--cyan` `--purple` `--pink` (`src/style.css`) | Full gradient reserved for the GLOWTRIS wordmark. |
| Type / spacing / shape / elevation / motion / state | `:root` tokens in `src/style.css` | See §11 for the exact implemented token list. |

`getGameMode()` (`shared.js`) returns the mode key; `classic` === Marathon. The game uses **Orbitron only** (no Pretendard — that pairing applies to the Blog surface).

---

## 1. Design Philosophy: Cyberpunk Gestalt

Our visual language is guided by three core principles of Gestalt psychology:
1. **Figure-Ground Separation**: High-contrast dark backgrounds paired with layered glowing neon borders and drop-shadows to signify depth and priority.
2. **Proximity & Similarity**: Consistent shape categories (radii) and typography hierarchy to clearly group related elements (e.g., tags, metadata chips, control toggles).
3. **Continuity**: Linear gradients (Cyan to Purple to Pink) create visual flow and connect brand headers directly to interactive elements.

---

## 2. Color System: Cyber Neon

Glowtris adapts Material 3's color roles into a high-contrast Cyber Neon color scheme. Light theme uses deep royal blues and sleek grays for high readability; Dark theme uses electric cyber-colors set against deep cosmos-black backgrounds.

### Core Brand Palette
| Variable | Value (Light) | Value (Dark) | Sample / Semantic Purpose |
| :--- | :--- | :--- | :--- |
| `--cyan` | `#2563eb` (Royal Blue) | `#00c8ff` (Electric Cyan) | Main Brand Accent, Primary buttons, Focus indicators |
| `--purple` | `#7c3aed` (Deep Violet) | `#a855f7` (Neon Purple) | Secondary Brand Accent, Tags, Blockquote borders |
| `--pink` | `#db2777` (Deep Pink) | `#f472b6` (Neon Pink) | Brand Highlights, Alert borders, Callouts |
| `--green` | `#059669` (Emerald) | `#34d399` (Mint Green) | Success states, Saved indicators, Completed challenges |
| `--amber` | `#d97706` (Amber) | `#fbbf24` (Golden Yellow) | Warning states, Leaderboards, Draft badges |

### Mode Signature Colors (game)
Every game mode owns exactly **one** signature color, grouped by intent on a cool→warm intensity ramp. The accent themes the mode's card, its in-game background (`getBgTheme` in `ui.js`), and its share card (`leaderboard.js`).

| Group | Mode | Color | `--mode-*` (CSS) | `MODE_COLORS` (JS) |
| :--- | :--- | :--- | :--- | :--- |
| ♾️ **ENDLESS** | Marathon | 🟢 `#00ff88` green | `--mode-marathon` | `.marathon` / `.classic` |
| | Flow | 🟣 `#a000ff` violet | `--mode-flow` | `.flow` |
| ⚡ **SPEED** | Sprint | 🔵 `#00c8ff` cyan | `--mode-sprint` | `.sprint` |
| | Blitz | 🟡 `#ffd000` yellow | `--mode-blitz` | `.blitz` |
| 🏆 **CHALLENGE** | Daily | 🟠 `#ff7700` orange | `--mode-daily` | `.daily` |

Rules: one icon + one color per mode, consistent across card / HUD / background / share. The brand cyan→violet→pink gradient is NOT a mode accent. Changing a mode color = edit BOTH `--mode-*` and `MODE_COLORS`.

### Semantic Roles (game surfaces)
The game runs dark-only with translucent glass panels: `--surface`, `--surface-2` (raised card), `--surface-glass` (HUD); text `--on-surface` / `--on-surface-muted` / `--on-surface-faint`; lines `--outline` / `--outline-strong`; status `--success` / `--warning` / `--error`.

### Surface & Background Tokens (blog)
| Variable | Value (Light) | Value (Dark) | Semantic Purpose |
| :--- | :--- | :--- | :--- |
| `--bg` | `#f8f8fc` | `#080814` | Body background |
| `--surface` | `#ffffff` | `#0e0e20` | Cards, Modals, Editor textareas |
| `--surface-2` | `#f0f0f8` | `#141428` | Secondary containers, input backgrounds |
| `--surface-3` | `#e8e8f4` | `#1c1c34` | Tertiary containers, active tabs |
| `--border` | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.06)` | Low-contrast separators |
| `--border-hi` | `rgba(0,0,0,0.10)` | `rgba(255,255,255,0.11)` | Interactive borders, focus states |

```mermaid
graph TD
  A[Glowtris Brand Colors] --> B[Core Accents]
  A --> C[Surfaces & UI]
  
  B --> B1[--cyan: Electric brand color]
  B --> B2[--purple: Secondary highlights]
  B --> B3[--pink: Micro accents]

  C --> C1[--bg: Base Canvas]
  C --> C2[--surface: Cards & Modals]
  C --> C3[--border: Wireframe boundaries]
```

---

## 3. Typography: Arcade vs. Editorial

Glowtris pairs **Orbitron** (a geometric, sci-fi brand typeface) with **Pretendard Variable** (a highly readable, modern sans-serif typeface) to separate decorative gaming labels from readable post bodies.

### Type Scale (Material 3 Inspired)

| M3 Category | Token / Class | Font Family | Weight | Size (Desktop / Mobile) | Line-Height | Semantic Use |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Large** | `.hero-title` | `'Orbitron'` | `900` | `66px` / `34px` | `1.06` / `1.2` | Page main headers (e.g., Blog Hero Title) |
| **Headline Medium**| `h2` / `.post-title` | `Pretendard` | `700` | `21px` / `18px` | `1.3` / `1.4` | Section titles, Post titles on list views |
| **Title Medium** | `h3` / `.admin-card-title` | `Pretendard` | `700` | `17px` / `15px` | `1.4` | Sub-sections, Admin dashboard lists |
| **Body Medium** | `p` / `.post-desc` | `Pretendard` | `400` | `15px` / `13px` | `1.65` / `1.6` | General body copy, readable articles |
| **Label Small** | `.filter-label` | `'Orbitron'` | `700` | `10px` / `10px` | `1.0` | Small tech badges, Category pills, Meta info labels |
| **Code Block** | `pre`, `code` | `'JetBrains Mono'` | `400` | `13px` / `12.5px` | `1.7` | In-line code snippet, Code block viewers |

---

## 4. Shape: Radii Hierarchy

To establish a clear sense of Gestalt *similarity*, border radiuses are grouped systematically:

```
[--r-xs] 4px     -->   In-line code chips, very small badges (e.g., KO/EN lang badges)
[--r-sm] 6px     -->   Small button elements, select options, version badges
[--r-md] 8px     -->   Input fields, primary buttons, small cards
[--r-lg] 12px    -->   Post list cards, admin cards, editor pane containers
[--r-xl] 18px    -->   Featured post cards, modal dialogs, main panels
[--r-full] 9999px -->   Pill CTAs, Category filter buttons, Search bar inputs
```

> [!NOTE]
> Implemented game radii (`--r-*`): `--r-xs 4` chips/inputs · `--r-sm 6` badges · `--r-md 8` small buttons · `--r-lg 12` cards · `--r-xl 16` mode groups · `--r-2xl 20` dialogs · `--r-full` pills/circles. Cards and panels favor the **Large/XL** end (12–20px) for a soft neon-glass look; tiny badges use **Small** (6px).

---

## 5. Elevation & Shadow Depth

Material 3's shadow elevation levels (1 to 5) are translated into neon wireframe glow levels and dark-surface shadows.

* **Elevation 0 (Flat)**: Standard cards, flat inputs. Separated strictly via `--border` wireframe strokes.
* **Elevation 1 (`--shadow-xs`)**: In-line code boxes, small toggles. 
* **Elevation 2 (`--shadow-sm`)**: Normal blog cards, admin buttons.
* **Elevation 3 (`--shadow-md`)**: Featured post cards, navigation headers. Added drop-shadow glow:
  `box-shadow: var(--shadow-md), 0 0 12px rgba(0, 200, 255, 0.08);`
* **Elevation 4 (`--shadow-lg`)**: Editor draft lists, user modals, dropdown menus.
* **Elevation 5 (Neon Glow)**: Active/Focused cards, main hero title glows. Implemented via:
  `filter: drop-shadow(0 2px 10px rgba(0, 200, 255, 0.2));`

---

## 6. Spacing & 4px Grid

All margins, paddings, and flex gaps are aligned to a 4px base grid to ensure clean proportion layouts.

* `var(--space-1)`: `4px` (Tight padding, badge internal gaps)
* `var(--space-2)`: `8px` (Icon to text gaps, small buttons padding)
* `var(--space-3)`: `12px` (Tab bar padding, small spacing)
* `var(--space-4)`: `16px` (Default container padding, grid gaps)
* `var(--space-5)`: `20px` (Card internal padding)
* `var(--space-6)`: `24px` (Main article margin-bottom, content gaps)
* `var(--space-8)`: `32px` (Section gaps)
* `var(--space-10)`: `40px` (Hero padding top/bottom)
* `var(--space-12)`: `48px` (Main header spacing)

---

## 7. Interactive States & Micro-interactions

Every interactive element has distinct visual responses:

### 1. Hover State (Transitions)
Hovering on cards, buttons, or links uses the `--ease-out` transition (`cubic-bezier(0.16, 1, 0.3, 1)`) with a `--t-fast` (`120ms`) or `--t-mid` (`200ms`) timing:
* **Card Hovers**: Translates up (`transform: translateY(-5px)`) and elevates shadow (`box-shadow: var(--shadow-lg)`).
* **Button Hovers**: Text/Border changes to `--cyan` or `--pink`. Background shifts slightly.
* **Link Hovers**: Text color changes with a smooth transition.

```css
/* Example of Design Token Implementation on hover */
.interactive-card {
  transition: transform var(--t-mid) var(--ease-out),
              box-shadow var(--t-mid) var(--ease-out);
}
.interactive-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--cyan);
}
```

### 2. Active (Press) State
* Button reduces in scale slightly (`transform: scale(0.97)`) or shifts down (`transform: translateY(1px)`) to provide tactile push response.

### 3. Focus State (Accessibility)
* Outlines are customized to prevent jarring browser defaults:
  `outline: 2px solid var(--border-focus); outline-offset: 3px;`
* On keyboard navigation, focus outline offset increases for clarity (`outline-offset: 4px`).

### 4. Disabled State
* Opacity falls to `0.5`, background cursor changes to `not-allowed`, and pointer-events are disabled.

---

## 8. Theme Sync & Consistency Guidelines

To maintain visual integrity across the application:
1. **Never use generic pure colors**: (e.g., `#ff0000` or `#0000ff`). Instead, use color system variables like `var(--pink)` or `var(--cyan)`.
2. **Combine light & dark themes seamlessly**: Toggling theme must only switch variable values, not swap CSS files.
3. **Respect mobile constraints**: Touch targets (buttons, links) must stay above `44px` height and width for accessibility, and category filters must scroll horizontally (`flex-wrap: nowrap`) to avoid vertical clutter on small viewports.

---

## 11. Implemented Game Tokens (`:root` in `src/style.css`)

The exact token names available in the game today. Reference these; do not paste raw values.

**Color** — brand `--cyan` `--purple` `--pink`; modes `--mode-marathon|flow|sprint|blitz|daily`; surfaces `--surface` `--surface-2` `--surface-glass`; text `--on-surface` `--on-surface-muted` `--on-surface-faint`; lines `--outline` `--outline-strong`; status `--success` `--warning` `--error`. (`--panel-bg`, `--border` kept as legacy aliases.)

**Typography** — `--font-display` (Orbitron sans), `--font-ui` (Orbitron mono); weights `--fw-regular|bold|black` (400/700/900). Type scale: `--type-display-l|m|s` (44/36/28), `--type-headline` (22), `--type-title-l|m|s` (18/15/13), `--type-body-l|m|s` (12/11/10), `--type-label-l|m|s` (9/8/7). Tracking: `--tracking-normal|wide|wider|widest` (1/2/4/6px).

**Spacing (4px grid)** — `--space-1..12` = 4/8/12/16/20/24/32/40/48px (keys 1,2,3,4,5,6,8,10,12).

**Shape** — `--r-xs|sm|md|lg|xl|2xl|full` = 4/6/8/12/16/20/9999px.

**Elevation** — glow sizes `--glow-sm|md|lg` (8/14/25px, pair with a color, e.g. `box-shadow: var(--glow-md) var(--mode-sprint)`); depth `--shadow-sm` `--shadow-md`.

**Motion** — durations `--t-fast` (120ms) `--t-mid` (200ms) `--t-slow` (300ms) `--t-slowest` (600ms). Easing: `--ease-standard` (general UI), `--ease-decelerate` (entrances), `--ease-emphasized` (playful overshoot — house style), `--ease-spring` (bouncy hero moments), `--ease-out` (legacy decelerate). Gate non-essential motion on `prefers-reduced-motion` and the in-game `animIntensity` setting.

**State** — `--state-disabled-opacity` (0.45, + `pointer-events:none`), `--focus-ring` (`2px solid var(--cyan)`).

> Adding/changing a token: edit `:root` (and `MODE_COLORS` if canvas needs the color), update this §11 + the relevant section above, then reference it. Migrate legacy hardcoded values opportunistically when touching a component.
