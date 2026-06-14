# Glowtris Reusable UI Components (Material 3 Mapping)

This document catalogs the reusable UI component patterns in the Glowtris codebase, mapping them directly to **Google Material Design 3 (M3)** component specs.

---

## ✦ Material 3 Component Mapping Table

| M3 Component | Glowtris Implementation | CSS Classes / IDs | Purpose & Interactive States |
| :--- | :--- | :--- | :--- |
| **Buttons** | Common Button | `.action-btn` | Primary actions. States: Hover shimmer, Pressed scale `0.98`, Focus double ring. |
| | Outlined Button | `.action-btn.ghost` | Secondary actions. States: Border transitions, background overlay. |
| | Segmented Button | `.lb-tabs`, `.lb-mode-toggle` | Tab filtering. Segmented pill controls. |
| | Icon Button | `.tbtn`, `.hud-btn` | Touch controls and HUD audio toggles. |
| **Cards** | Outlined Card | `.panel` | Outlined glassmorphic card for HUD widgets. |
| | Elevated Card | `.glass-panel` | Elevated overlays and modals with radial backdrops. |
| **Badges** | Large Badge | `.streak-badge`, `.combo-badge` | Status chips / badges for streaks and combos. |
| **Text Fields** | Outlined Text Field | `.neon-input` | Text inputs with active neon outline focus states. |
| **Snackbars** | Snackbar / Toast | `.achievement-toast`, `#offline-bar` | Slide-up alerts and achievements toasts. |
| **Dialogs** | Modal Dialog | `#htp-overlay`, `#pwa-modal` | Full-screen interactive modal dialogs. |

---

## 1. Buttons (M3 Buttons & Segmented Controls)

### HTML Markup
```html
<!-- M3 Common Button (Primary Action) -->
<button class="action-btn">PLAY GAME</button>

<!-- M3 Outlined Button (Secondary Action) -->
<button class="action-btn ghost">SETTINGS</button>

<!-- M3 Icon Button -->
<button class="tbtn">
  <span class="material-icons-round">pause</span>
</button>

<!-- M3 Segmented Button (Tabs) -->
<div class="lb-tabs">
  <button class="lb-tab active">MARATHON</button>
  <button class="lb-tab">SPRINT</button>
</div>
```

---

## 2. Cards (M3 Cards)

### HTML Markup
```html
<!-- M3 Outlined Card -->
<div class="panel">
  <div class="panel-title">SCORE</div>
  <div class="score-val">024,500</div>
</div>

<!-- M3 Elevated Card (Modal Dialog Box) -->
<div class="glass-panel">
  <h1 class="pwa-modal-title">GAME OVER</h1>
  <button class="action-btn">RETRY</button>
</div>
```

---

## 3. Badges (M3 Badges)

### HTML Markup
```html
<!-- M3 Large Badges / Status Chips -->
<span class="streak-badge">3 STREAK</span>
<span class="combo-badge">COMBO x5</span>
```

---

## 4. Text Fields (M3 Text Fields)

### HTML Markup
```html
<!-- M3 Outlined Text Field -->
<input type="text" class="neon-input" placeholder="ENTER NAME" maxlength="10" />
```

---

## 5. Snackbars & Dialogs (M3 Snackbars / Dialogs)

### HTML Markup
```html
<!-- M3 Snackbar / Slide-up Toast -->
<div class="achievement-toast show">
  <span class="ach-icon">🏆</span>
  <div class="ach-text">
    <strong>Void Clear</strong>
    <p>Achieve an All-Clear bonus</p>
  </div>
</div>

<!-- M3 Modal Dialog Overlay -->
<div id="stats-overlay" class="visible">
  <div id="stats-box" class="glass-panel">
    <div id="stats-title">STATISTICS</div>
    <!-- Content -->
    <button id="stats-close">CLOSE</button>
  </div>
</div>
```

---

## ✦ Interactive State Layer Specifications (M3 Compliance)

To comply with M3 guidelines, all interactive elements use the standard state layer overlays (`:before` / `:after` pseudoclasses):
1. **Hover State**: Layer opacity `0.08` white overlay (`.action-btn:hover`, `.tbtn:hover`).
2. **Pressed State**: Layer opacity `0.16` white overlay and downscaling to `0.96` (`.action-btn:active`, `.tbtn.pressed`).
3. **Focused State**: Custom `2px` solid Cyan ring with `4px` offset on keyboard navigation (`.using-kb *:focus`).
4. **Disabled State**: Opacity reduced to `0.45` (`--state-disabled-opacity`) and `pointer-events: none`.
