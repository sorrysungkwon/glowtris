# Figma Naming Convention — AI-Optimized

> Goal: Every name in Figma maps 1:1 to a code token, component, or screen. No ambiguity, no visual descriptions.

---

## 1. Separator Rules

| Separator | Use |
|-----------|-----|
| `/` | Hierarchy (Figma variant groups) |
| `.` | Namespace (page or domain prefix) |
| `_` | Multi-word within same level |
| `-` | State or modifier suffix |
| `[bracket]` | Annotation only — never in production layers |

---

## 2. Pages

```
Game          — core game screens
UI            — HUD, overlays, modals
Design System — tokens, components, patterns
Marketing     — OG images, share cards
Archive       — deprecated (do not reference)
```

---

## 3. Frames (Screens)

Pattern: `Screen.ScreenName` or `Screen.ScreenName-State`

```
Screen.Home
Screen.Game-Playing
Screen.Game-Paused
Screen.Game-Over
Screen.Leaderboard
Screen.Settings
Screen.DailyChallenge
```

Sections within a screen:
```
Section.HUD
Section.Board
Section.Sidebar
Section.Overlay
```

---

## 4. Components

Pattern: `ComponentName/Variant/State`

- `ComponentName` — PascalCase, matches code component name
- `Variant` — named dimension (Mode, Size, Type)
- `State` — interaction state

```
Button/Primary/Default
Button/Primary/Hover
Button/Primary/Disabled
Button/Ghost/Default
Button/Ghost/Hover

ModeChip/Marathon/Default
ModeChip/Flow/Default
ModeChip/Sprint/Default
ModeChip/Blitz/Default
ModeChip/Daily/Default
ModeChip/Ultra/Default

ScoreDisplay/Size=Large/Mode=Marathon
ScoreDisplay/Size=Small/Mode=Flow

Modal/GameOver/Default
Modal/Settings/Default
Modal/Leaderboard/Default

Toast/Success/Default
Toast/Error/Default
Toast/Info/Default

Block/I/Default
Block/O/Default
Block/T/Default
Block/S/Default
Block/Z/Default
Block/L/Default
Block/J/Default
```

---

## 5. Design Tokens (Styles)

Map directly to CSS `--token-name` or `MODE_COLORS` key.

### Colors

Pattern: `color/category/name`

```
color/mode/marathon          → #00ff88  → --mode-primary (Marathon)
color/mode/flow              → #a000ff  → --mode-primary (Flow)
color/mode/sprint            → #00c8ff  → --mode-primary (Sprint)
color/mode/blitz             → #ffd000  → --mode-primary (Blitz)
color/mode/daily             → #ff7700  → --mode-primary (Daily)
color/mode/ultra             → #ff0080  → --mode-primary (Ultra)

color/surface/0              → --surface0
color/surface/1              → --surface1
color/surface/2              → --surface2
color/on-surface/primary     → --on-surface
color/on-surface/secondary   → --on-surface-secondary
color/on-surface/disabled    → --on-surface-disabled
```

### Typography

Pattern: `type/scale/property`

```
type/display/lg              → --type-display-lg
type/display/md              → --type-display-md
type/body/lg                 → --type-body-lg
type/body/sm                 → --type-body-sm
type/label/lg                → --type-label-lg
type/label/sm                → --type-label-sm
type/mono/md                 → --type-mono-md
```

### Spacing

Pattern: `space/step`

```
space/1   → 4px   → --space-1
space/2   → 8px   → --space-2
space/3   → 12px  → --space-3
space/4   → 16px  → --space-4
space/6   → 24px  → --space-6
space/8   → 32px  → --space-8
space/12  → 48px  → --space-12
```

### Radius

Pattern: `radius/size`

```
radius/xs   → --r-xs
radius/sm   → --r-sm
radius/md   → --r-md
radius/lg   → --r-lg
radius/xl   → --r-xl
radius/2xl  → --r-2xl
radius/full → --r-full
```

### Elevation / Glow

Pattern: `elevation/type/size`

```
elevation/glow/sm   → --glow-sm
elevation/glow/md   → --glow-md
elevation/glow/lg   → --glow-lg
elevation/shadow/sm → --shadow-sm
elevation/shadow/md → --shadow-md
```

### Motion

Pattern: `motion/duration/name` or `motion/easing/name`

```
motion/duration/fast      → --t-fast (100ms)
motion/duration/mid       → --t-mid (200ms)
motion/duration/slow      → --t-slow (300ms)
motion/duration/slowest   → --t-slowest (500ms)

motion/easing/standard    → --ease-standard
motion/easing/decelerate  → --ease-decelerate
motion/easing/emphasized  → --ease-emphasized
motion/easing/spring      → --ease-spring
motion/easing/out         → --ease-out
```

---

## 6. Layers

Pattern: `role_description` (snake_case, semantic)

```
bg_surface            — background fill layer
icon_close            — icon, named by function
text_score_value      — text, named by content role
frame_hud_container   — layout frame
img_block_preview     — image, named by content
divider_horizontal    — decorative separator
```

Never use:
- `Rectangle 1`, `Group 12`, `Frame 45` — auto-generated, meaningless
- `bg_blue`, `text_big` — visual description, not semantic
- `Copy of ...`, `old_...` — stale names

---

## 7. AI Query Patterns

When I query Figma via MCP, I use these patterns:

```
# Get all mode colors
GET styles WHERE name STARTS WITH "color/mode/"

# Get component variants
GET components WHERE name STARTS WITH "ModeChip/"

# Get a specific screen
GET frames WHERE name = "Screen.Game-Playing"

# Get all tokens for a category
GET styles WHERE name STARTS WITH "space/"
```

Consistent naming = predictable queries = reliable automation.

---

## 8. Mode Group Tags (comment only)

For components that are mode-aware, add `[mode=marathon]` in the description field, not the name:

```
Component name:  ModeChip/Marathon/Default
Description:     [mode=marathon] [group=endless]
```

This lets AI filter by mode without polluting the name.

---

## 9. Quick Checklist

- [ ] Name maps to a code symbol or CSS token?
- [ ] No color/size words in the name?
- [ ] Uses `/` for hierarchy, `_` for multi-word?
- [ ] State is last (`-Hover`, `-Disabled`, `-Active`)?
- [ ] Layer names are semantic, not auto-generated?
