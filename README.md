# CRT Overlay Web Component

A self-contained Web Component that renders authentic CRT monitor effects over any content. No dependencies, no shims, drop-in ready.

![CRT Overlay Demo](assets/demo.jpg)

## Features

**Core Effects**
- **Scanlines** - Shadow-mask scanlines with animated hairlines and phosphor triads (RGB)
- **Chromatic Aberration** - Color fringing with jitter animation
- **Bloom/Halation** - Screen glow with scaling blur effect
- **Glass Reflection** - Subtle reflection layer (toggleable)
- **Vignette** - Edge darkening with customizable feather
- **Film Grain** - Noise pool with configurable opacity
- **Flicker** - Random scanline flicker animation

**Technical**
- **Barrel Distortion** - SVG-based lens curvature (optional scoped selector)
- **Scanline Masks** - 5 different mask types (shadow-mask, aperture-grille, slot-mask, sharp, soft)
- **21 Presets** - CRT, arcade, terminal, plasma, broadcast, professional, and phosphor variants
- **Dynamic Controls** - Built-in UI with sliders, dropdowns, and synchronized number inputs
- **Z-Index Modes** - Behind content, on top, or disabled
- **Framework Agnostic** - Works in vanilla JS, React, Vue, Angular, etc.

## Quick Start

### Installation

**Option 1: Direct Import (No Build Step)**
```html
<script type="module" src="component/crt-overlay.js"></script>
<crt-overlay controls></crt-overlay>
```

**Option 2: npm**
```bash
npm install crt-overlay
```

Then import in your project:
```javascript
import 'crt-overlay/component/crt-overlay.js';
```

**Option 3: Run Demo Locally**
```bash
npm run demo
# Opens http://localhost:8000
```

### Basic Usage

```html
<script type="module" src="component/crt-overlay.js"></script>

<!-- Minimal overlay with controls -->
<crt-overlay controls></crt-overlay>
```

### With Custom Parameters

```html
<crt-overlay
  controls
  scan-opacity="0.85"
  hairline-opacity="0.18"
  fringe-opacity="0.25"
  noise-opacity="0.22"
  barrel="2"
  bloom="0.15"
  flicker
  mode="1"
></crt-overlay>
```

## Z-Index Modes

The `mode` attribute controls how the overlay layers with your content:

### Mode 0: Disabled
```html
<crt-overlay mode="0"></crt-overlay>
```
The overlay is completely disabled and not rendered. Use this to toggle effects on/off.

### Mode 1: Behind Content (Default)
```html
<crt-overlay mode="1"></crt-overlay>
```
The overlay appears **behind** all page content at `z-index: -1`. This is ideal for:
- Applying CRT effects as a background layer
- Preserving all interactive elements on top
- When barrel distortion should only affect the background image

For this to work properly, ensure your page has a background element:
```html
<body>
  <div class="page-background" style="position: fixed; inset: 0; z-index: -100; background: url(...)"></div>
  <!-- Your content here -->
</body>
```

### Mode 2: On Top
```html
<crt-overlay mode="2"></crt-overlay>
```
The overlay appears **on top** of all content at `z-index: 9999`. This is useful for:
- Applying effects over the entire page including interactive elements
- Full-screen CRT aesthetic
- When you want scanlines/bloom over everything

## Controls Module

The built-in controls panel provides real-time adjustment of all parameters:

```html
<!-- Enable interactive controls -->
<crt-overlay controls></crt-overlay>
```

The controls panel includes:

### Parameter Categories
- **Scanlines** - Opacity, color, size, density, hairline, mask type
- **Fringe** - Opacity, dominant color, jitter speed/amount, phosphor size & opacity
- **Bloom** - Strength, color, radius, decay, blur, brightness
- **Vignette** - Opacity, radius, feather, light/dark colors
- **Reflection** - Opacity, size, position X/Y
- **Advanced** - Barrel, flicker, color palette shift, interlace speed, z-index mode

### Dual Input Controls
Each parameter has **both slider and number input** that stay synchronized:
- Adjust the slider for real-time feedback
- Type in the number input for precise values
- Changes apply instantly to the overlay

### Preset Selector
Quick-access dropdown to apply any of the 21 presets with a single click. All parameter sliders update automatically.

### Keyboard Shortcuts (in controls)
- Arrow keys to adjust focused slider
- Tab to move between controls
- Enter to confirm number input

## Interactive Controls Panel Usage

```html
<script type="module">
  import './crt-overlay.js';

  const overlay = document.querySelector('crt-overlay');

  // Listen to control changes
  overlay.addEventListener('config-change', (e) => {
    console.log('Updated config:', e.detail);
  });

  // Change mode from controls
  // Controls will automatically sync the mode slider (0, 1, 2)
</script>
```

## Scoped Barrel Distortion

Apply barrel distortion to a specific element instead of the whole page:

```html
<style>
  .crt-card {
    border: 2px dashed rgba(74, 163, 225, 0.5);
  }
</style>

<crt-overlay
  controls
  apply-barrel-to=".crt-card"
  barrel="2.4"
  mode="1"
></crt-overlay>

<div class="crt-card">
  <img src="monitor.jpg" alt="CRT Monitor">
</div>
```

In this mode:
- **Barrel filter** applies only to `.crt-card` element
- **All other effects** (scanlines, bloom, fringe, noise) render normally over the viewport
- The element receives the SVG barrel distortion filter

## Parameters

All parameters can be set via HTML attributes or JavaScript. Values are clamped to valid ranges.

### Scanlines & Structure
- `scan-opacity` (0–1, default: 0.85) - Overall scanline visibility
- `scanline-color` (0–1, default: 0) - Scanline darkness (0=pure black, 1=transparent)
- `scan-size` (2–8, default: 4) - Height of each scanline in pixels
- `scan-density` (1–4, default: 2) - Interlace density for hairlines (spacing)
- `hairline-opacity` (0–0.3, default: 0.18) - Brightness of animated hairlines between scanlines
- `scanline-mask` (default: `shadow-mask`) - Visual style: `shadow-mask`, `aperture-grille`, `slot-mask`, `sharp`, `soft`

### Chromatic Aberration (Color Fringing)
- `fringe-opacity` (0–0.6, default: 0.25) - Intensity of color fringing effect
- `fringe-dominant` (0–1, default: 0.5) - Tint balance: 0=blue dominant, 1=red dominant
- `fringe-jitter-speed` (1–5, default: 3.2) - Animation speed in seconds (lower=faster)
- `fringe-jitter-amount` (0–5, default: 2) - Jitter displacement in pixels
- `phosphor-size` (0.5–3, default: 1) - Size of RGB phosphor triads
- `phosphor-opacity-red` (0–0.3, default: 0.15) - Red phosphor opacity
- `phosphor-opacity-green` (0–0.3, default: 0.15) - Green phosphor opacity
- `phosphor-opacity-blue` (0–0.3, default: 0.15) - Blue phosphor opacity

### Bloom & Glow
- `bloom` (0–0.4, default: 0.15) - Bloom effect strength (0=disabled, 1=maximum)
- `bloom-color` (default: `white`) - Bloom tint: `white`, `amber`, `green`, `blue`
- `bloom-radius` (1200–1600, default: 1400) - Size of bloom glow ellipse in pixels
- `bloom-decay` (40–70, default: 55) - Falloff distance as percentage (lower=faster fade)
- `bloom-blur` (2–40, default: 10) - Blur amount in pixels (capped at 2.5px for performance)
- `bloom-brightness` (0.5–2, default: 1.2) - Brightness multiplier for bloom effect

### Vignette (Edge Darkening)
- `vignette-opacity` (0–1, default: 0.5) - Overall vignette strength
- `vignette-radius` (30–95, default: 85) - Size of the vignette ellipse (%)
- `vignette-feather` (10–80, default: 40) - Feather/softness of vignette edge (%)
- `vignette-color-light` (0–1, default: 0.35) - Inner vignette opacity
- `vignette-color-dark` (0–1, default: 0.7) - Outer vignette opacity

### Reflection (Glass Glare)
- `reflection` (true/false, default: false) - Enable/disable reflection layer
- `reflection-opacity` (0–0.15, default: 0.03) - Brightness of reflection glow
- `reflection-size` (800–2000, default: 1400) - Size of reflection ellipse in pixels
- `reflection-position-x` (0–100, default: 50) - Horizontal position (%)
- `reflection-position-y` (0–100, default: 10) - Vertical position (%)

### Visual & Animation
- `color-palette-shift` (-180–180, default: 0) - Hue rotation in degrees (useful for green/amber modes)
- `flicker` (true/false, default: true) - Enable/disable random scanline flicker
- `flicker-opacity` (0–0.2, default: 0.08) - Intensity of flicker effect
- `interlace-speed` (0.05–0.2, default: 0.08) - Hairline animation speed in seconds

### Distortion
- `barrel` (0–6, default: 2) - Barrel distortion amount (0=none, 6=extreme curvature)

### Layering & Controls
- `mode` (0, 1, or 2; default: 1) - **0**=disabled, **1**=behind content, **2**=on top
- `z-index` (deprecated in favor of `mode`) - Legacy parameter, use `mode` instead
- `controls` (true/false, default: false) - Show/hide interactive controls panel
- `apply-barrel-to` (CSS selector) - Optional selector to apply barrel filter to specific element only

## Presets (21 Total)

All presets are fully configured CRT styles. Apply via controls or JavaScript:

```javascript
overlay.applyPreset('arcade-crt');
```

### Classic Desktop
- **default** - Balanced, general-purpose CRT monitor
- **trinitron-fd** - Crisp Trinitron FD series (low scanlines, aperture grille)
- **professional-monitor** - High-contrast business monitor (heavy noise)
- **monitor-1084s** - Commodore 1084S (warm, vibrant, high barrel)
- **studio-display-crt** - Apple Studio Display (flat, minimal effects)
- **arcade-crt** - Arcade cabinet monitor (high contrast, heavy barrel, vibrant)

### Phosphor Colors (Monochrome Terminal Styles)
- **amber-phosphor** - Classic amber terminal (warm, nostalgic)
- **green-phosphor** - Vintage green screen (VT220 hacker aesthetic)
- **blue-phosphor** - Rare blue phosphor (uncommon, distinctive)
- **phosphor-white** - Bright white terminal (business/professional)

### Professional/Specialized
- **broadcast-monitor** - Professional broadcast/production monitor
- **rgb-professional** - High-end RGB professional display
- **retro-studio** - Retro studio aesthetic with heavy effects
- **vt220-terminal** - DEC VT220 green terminal (minimal distortion)
- **lcd-handheld** - LCD handheld device (low scanlines, sharp)
- **classic-rgb** - Classic RGB home computer monitor
- **precision-flatcrt** - Precision flat CRT (minimal aberration)
- **composite-color** - Composite signal color display

### Alternative Display Tech
- **plasma-display** - Plasma panel (high flicker, dramatic effects)
- **vector-display** - Vector display (minimal scanlines, clean look)

## API

### Setting Properties Programmatically

```javascript
const overlay = document.querySelector('crt-overlay');

// Update single or multiple properties
overlay.updateConfig({
  barrel: 2.5,
  bloom: 0.18,
  scanOpacity: 0.9
});

// Apply a preset
overlay.applyPreset('arcade-crt');

// Get current configuration
console.log(overlay.config);
const { barrel, bloom, scanOpacity } = overlay.config;
```

### Events

```javascript
// Listen for barrel filter changes
overlay.addEventListener('barrel-change', (e) => {
  console.log('Filter ID:', e.detail.filterId);
  console.log('Barrel amount:', e.detail.barrel);
});

// Listen for any config changes
overlay.addEventListener('config-change', (e) => {
  console.log('Updated config:', e.detail);
});
```

### Web Component Lifecycle

```javascript
// Element is ready after connectedCallback
customElements.whenDefined('crt-overlay').then(() => {
  const overlay = document.querySelector('crt-overlay');
  overlay.updateConfig({ barrel: 3 });
});
```

## Demos

- **[Main Demo](demo/original-crt-demo.html)** - Full showcase with code examples and all features
- **[Playground](demo/crt-demo.html)** - Isolated sandbox with diverse content and effects
- **[Scoped Barrel](demo/scoped-crt-demo.html)** - Barrel distortion applied to specific selector
- **[Z-Index Test](demo/z-index-test.html)** - Interactive z-index layering demonstration

## Browser Support

**Chromium 88+** (Chrome, Edge, Brave, Opera)

Requires:
- Web Components (Custom Elements, Shadow DOM)
- CSS Custom Properties (CSS Variables)
- SVG Filters (for barrel distortion)
- CSS Backdrop Filter (`backdrop-filter` for blur/brightness)

**Not supported**: Firefox, Safari (due to SVG filter rendering differences)

## Performance

- **Bundle**: ~40 KB unminified (single .js file)
- **Rendering**: Pure CSS + SVG (GPU-accelerated)
- **Bloom blur**: Capped at 2.5px for optimal performance
- **Overhead**: Minimal with efficient layering and CSS variables
- **Animation**: 60fps noise cycles with smooth interpolation

## Performance Tips

1. **Disable unused effects** - Set opacity to 0 for effects you don't need
2. **Use presets** - Pre-configured presets are optimized for performance
3. **Avoid multiple instances** - Use a single overlay with mode switching
4. **Mode 1 (behind)** - Generally performs better than mode 2 (on top)
5. **Adjust bloom-blur** - Reduce if you see performance issues; capped at 2.5px anyway

## Troubleshooting

### Overlay not appearing
- Check that `<script type="module" src="crt-overlay.js"></script>` is loaded
- Ensure the element `<crt-overlay></crt-overlay>` is in the DOM
- Verify mode is not set to 0 (disabled)

### Barrel distortion not working in mode 1
- Provide a `.bg-image` element with content (image or background)
- Or use `apply-barrel-to` to target a specific element
- Barrel only applies where there's content to distort

### Controls panel not showing
- Add the `controls` attribute: `<crt-overlay controls></crt-overlay>`
- Check browser console for errors
- Ensure Shadow DOM is supported (Chromium 88+)

### Blur effect too strong/weak
- Adjust `bloom-blur` parameter (2–40 range)
- Reduce `bloom` strength if blur is too pronounced
- Blur is capped at 2.5px for performance

## License

MIT – Use freely in personal and commercial projects.
