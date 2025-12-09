/**
 * Isolated CRT Overlay Web Component (shippable copy)
 * - Per-instance namespacing for global side-effects
 * - `apply-barrel-to` attribute to target which page selector receives the barrel filter
 * - Simple bloom fallback when backdrop-filter is unavailable
 * 
 * Z-INDEX STACKING GUIDE:
 * ----------------------
 * The overlay creates a fixed-position stacking context with internal layers.
 * 
 * z-index: controls the overlay's base stacking position
 *   -1 = behind normal content (auto/0), above explicitly negative backgrounds
 *    0+ = in front of normal content
 * 
 * Barrel filtering: When barrel > 0, applies to page content via CSS selector
 *   Default: applies to all direct body children except overlay/controls/bloom
 *   Custom: use apply-barrel-to attribute to target specific elements (e.g., ".background")
 * 
 * Internal layer order (always preserved):
 *   scanlines (1) → fringe (2) → vignette (3) → noise (4) → reflection (5) → flicker (6)
 * 
 * External bloom layer: positioned just before overlay in DOM, inherits overlay z-index
 */
class CRTOverlay extends HTMLElement {
  static get observedAttributes() {
    return [
      'scan-opacity','hairline-opacity','fringe-opacity','fringe-dominant','noise-opacity',
      'barrel','scan-size','scan-density','phosphor-size','bloom','bloom-color','bloom-radius','bloom-decay','bloom-blur',
      'scanline-color','vignette-opacity','vignette-radius','vignette-feather','flicker-opacity','color-palette-shift','interlace-speed',
      'reflection-opacity','reflection-size','reflection-position-x','reflection-position-y',
      'flicker','reflection','controls','mode','apply-barrel-to'
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // ===== CONFIGURATION OBJECT =====
    this.config = {
      // Scanlines & structure
      scanOpacity: 0.85,
      scanlineColor: 0, // 0-1, controls darkness of scanlines (0=black, 1=transparent)
      hairlineOpacity: 0.18,
      fringeOpacity: 0.25,
      fringeDominant: 0.5, // 0=blue dominant, 1=red dominant, controls chromatic aberration tint
      fringeJitterSpeed: 3.2, // animation speed in seconds
      fringeJitterAmount: 2, // translation amount in px
      noiseOpacity: 0.22,
      barrel: 2,
      scanSize: 4,
      scanDensity: 2,
      phosphorSize: 1,
      phosphorOpacityRed: 0.15,
      phosphorOpacityGreen: 0.15,
      phosphorOpacityBlue: 0.15,
      scanlineMask: 'shadow-mask', // 'aperture-grille', 'shadow-mask', 'slot-mask', 'sharp', 'soft'
      
      // Bloom & glow effects
      bloom: 0.15,
      bloomColor: 'white', // 'white', 'amber', 'green', 'blue'
      bloomRadius: 1400, // size of bloom glow in px
      bloomDecay: 55, // falloff distance (0-100, %)
      bloomBlur: 10, // blur amount for bloom effect (px)
      bloomBrightness: 1.2, // brightness multiplier (0.5-2.0)
      
      // Color & visual effects
      colorPaletteShift: 0, // 0=none, positive=warm/amber, negative=cool/blue
      vignetteOpacity: 0.5,
      vignetteRadius: 85, // vignette ellipse size (%)
      vignetteFeather: 40, // vignette feather distance (%)
      vignetteColorLight: 0.35, // inner vignette opacity (0-1)
      vignetteColorDark: 0.7, // outer vignette opacity (0-1)
      reflectionOpacity: 0.03, // reflection glow opacity (0-1)
      reflectionSize: 1400, // reflection ellipse size in px
      reflectionPositionX: 50, // horizontal position (0-100, %)
      reflectionPositionY: 10, // vertical position (0-100, %)
      reflection: false, // enable/disable reflection layer
      
      // Animation & behavior
      flickerOpacity: 0.08,
      interlaceSpeed: 0.08, // 0.08 or 0.12 seconds per frame
      flicker: true,
      controls: false,
      mode: 1, // 0=disabled, 1=behind content (z-index:-1), 2=on top (z-index:9999)
      applyBarrelTo: null, // optional selector
      
      // Legacy toggles (runtime switchers available in controls)
      legacyInterlace: true,
      legacyBloom: true
    };

    // ===== INSTANCE STATE =====
    this.animationFrames = { noise: null, flicker: null };
    this.noisePool = [];
    this.currentNoiseUrl = null;
    this.controlsPortal = null;
    this.externalBloomLayer = null;
    this._globalStyle = null; // per-instance injected style
  }

  connectedCallback() {
    if (this._initialized) return;
    this.render();
    this.injectSVGFilter();
    this.ensureGlobalFilterStyle();
    this.createExternalBloomLayer();
    this.createControlsPortal();
    this.initializeEffects();
    this.updateStyles(); // Apply all CSS custom properties on initial load
    this.startAnimations();
    this.updateModeZIndex();
    this.updateBarrel();
    this.toggleReflection(); // Apply initial reflection state
    this._initialized = true;
  }

  disconnectedCallback() {
    this.stopAnimations();
    const svg = document.getElementById(`crt-barrel-${this._uid}`)?.closest('svg');
    if (svg) svg.remove();

    // Remove per-instance CSS var and body class
    const varName = `--crt-filter-chain-${this._uid}`;
    document.documentElement.style.removeProperty(varName);
    document.body.classList.remove(`crt-filtered-${this._uid}`);
    // Also remove legacy globals for compatibility with older demos
    document.documentElement.style.removeProperty('--crt-barrel-filter');
    document.documentElement.style.removeProperty('--bloom-strength');
    document.body.classList.remove('crt-filtered');

    if (this._globalStyle) {
      this._globalStyle.remove();
      this._globalStyle = null;
    }

    if (this.externalBloomLayer) {
      this.externalBloomLayer.remove();
      this.externalBloomLayer = null;
    }

    if (this.controlsPortal) {
      this.controlsPortal.remove();
      this.controlsPortal = null;
    }

    this._initialized = false;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    const map = {
      'scan-opacity':'scanOpacity','scanline-color':'scanlineColor','hairline-opacity':'hairlineOpacity','fringe-opacity':'fringeOpacity','fringe-dominant':'fringeDominant','fringe-jitter-speed':'fringeJitterSpeed','fringe-jitter-amount':'fringeJitterAmount','noise-opacity':'noiseOpacity',
      'barrel':'barrel','scan-size':'scanSize','scan-density':'scanDensity','phosphor-size':'phosphorSize','phosphor-opacity-red':'phosphorOpacityRed','phosphor-opacity-green':'phosphorOpacityGreen','phosphor-opacity-blue':'phosphorOpacityBlue','bloom':'bloom','bloom-color':'bloomColor','bloom-radius':'bloomRadius','bloom-decay':'bloomDecay','bloom-blur':'bloomBlur','bloom-brightness':'bloomBrightness','vignette-opacity':'vignetteOpacity','vignette-radius':'vignetteRadius','vignette-feather':'vignetteFeather','vignette-color-light':'vignetteColorLight','vignette-color-dark':'vignetteColorDark','reflection-opacity':'reflectionOpacity','reflection-size':'reflectionSize','reflection-position-x':'reflectionPositionX','reflection-position-y':'reflectionPositionY','scanline-mask':'scanlineMask','flicker-opacity':'flickerOpacity','color-palette-shift':'colorPaletteShift','interlace-speed':'interlaceSpeed',
      'flicker':'flicker','reflection':'reflection','controls':'controls','mode':'mode','apply-barrel-to':'applyBarrelTo'
    };
    const key = map[name];
    if (!key) return;
    if (name === 'flicker' || name === 'controls' || name === 'reflection') {
      this.config[key] = newValue !== null;
    } else if (name === 'apply-barrel-to') {
      this.config.applyBarrelTo = newValue || null;
    } else if (name === 'mode') {
      this.config.mode = parseInt(newValue, 10) || 1;
    } else if (name === 'bloom-color') {
      this.config.bloomColor = newValue || 'white';
    } else {
      const numeric = parseFloat(newValue);
      this.config[key] = Number.isNaN(numeric) ? this.config[key] : numeric;
    }

    if (this.shadowRoot.querySelector('.crt-container')) {
      this.updateStyles();
      if (name === 'barrel') this.updateBarrel();
      if (name === 'color-palette-shift') this.applyGlobalFilters();
      if (name === 'flicker') this.toggleFlicker();
      if (name === 'reflection') this.toggleReflection();
      if (name === 'controls') this.toggleControls();
      if (name === 'mode') this.updateModeZIndex();
      if (name === 'apply-barrel-to') this.applyGlobalFilters();
    }
  }

  render() {
    const template = `
      <style>
        :host{display:block;position:fixed;inset:0;pointer-events:none}
        .crt-container{--scan-opacity:${this.config.scanOpacity};--scanline-color:${this.config.scanlineColor};--hairline-opacity:${this.config.hairlineOpacity};--fringe-opacity:${this.config.fringeOpacity};--fringe-dominant:${this.config.fringeDominant};--noise-opacity:${this.config.noiseOpacity};--scan-size:${this.config.scanSize}px;--scan-density:${this.config.scanDensity};--phosphor-size:${this.config.phosphorSize}px;--bloom-strength:${this.config.bloom};--bloom-radius:${this.config.bloomRadius}px;--bloom-decay:${this.config.bloomDecay}%;--vignette-opacity:${this.config.vignetteOpacity};--vignette-radius:${this.config.vignetteRadius}%;--vignette-feather:${this.config.vignetteFeather}%;--flicker-opacity:${this.config.flickerOpacity};--color-palette-shift:${this.config.colorPaletteShift}deg;--interlace-speed:${this.config.interlaceSpeed}s;position:absolute;inset:0;pointer-events:none;filter:hue-rotate(var(--color-palette-shift))}
        .crt-layer{position:absolute;inset:0;pointer-events:none}
        .crt-scanlines{z-index:1;mix-blend-mode:multiply;opacity:var(--scan-opacity);background-image:repeating-linear-gradient(to bottom,transparent 0px,transparent calc(var(--scan-size) - 1px),rgba(0,0,0,calc(0.65 * (1 - var(--scanline-color)))) calc(var(--scan-size) - 1px),rgba(0,0,0,calc(0.65 * (1 - var(--scanline-color)))) var(--scan-size));background-size:100% var(--scan-size);background-position:0 0}
        /* hairline interlace - supports legacy/crisper toggle */
        .crt-scanlines::after{content:"";position:absolute;inset:0;mix-blend-mode:screen;opacity:var(--hairline-opacity);background-image:repeating-linear-gradient(to bottom,rgba(255,255,255,1) 0px,rgba(255,255,255,0.85) 0.8px,transparent 0.8px,transparent calc(var(--scan-size) * var(--scan-density)));background-size:100% calc(var(--scan-size) * var(--scan-density));animation:interlace var(--interlace-speed) steps(2) infinite;will-change:transform}
        @keyframes interlace{0%,100%{transform:translateY(0)}50%{transform:translateY(1px)}}
        .crt-fringe{z-index:2;mix-blend-mode:lighten;opacity:var(--fringe-opacity);background-image:radial-gradient(ellipse 70% 80% at 50% 50%,transparent 30%,rgba(255,50,80,0.35) 65%,rgba(255,30,60,0.5) 100%),radial-gradient(ellipse 75% 85% at 50% 50%,transparent 30%,rgba(0,150,255,0.3) 65%,rgba(0,120,255,0.45) 100%),linear-gradient(135deg, rgba(74,163,225,0.25), transparent 60%),linear-gradient(225deg, rgba(255,138,31,0.20), transparent 60%);background-blend-mode:screen;animation:fringeJitter var(--fringe-jitter-speed) ease-in-out infinite;filter:hue-rotate(calc((var(--fringe-dominant) - 0.5) * 180deg)) saturate(calc(0.8 + var(--fringe-dominant) * 0.4))}
        .crt-fringe::before{content:"";position:absolute;inset:0;opacity:0.35;background-image:repeating-linear-gradient(90deg,rgba(255,0,0,var(--phosphor-red)) 0px,rgba(255,0,0,var(--phosphor-red)) var(--phosphor-size),transparent var(--phosphor-size),transparent calc(var(--phosphor-size) * 2),rgba(0,255,0,var(--phosphor-green)) calc(var(--phosphor-size) * 2),rgba(0,255,0,var(--phosphor-green)) calc(var(--phosphor-size) * 3),transparent calc(var(--phosphor-size) * 3),transparent calc(var(--phosphor-size) * 4),rgba(0,0,255,var(--phosphor-blue)) calc(var(--phosphor-size) * 4),rgba(0,0,255,var(--phosphor-blue)) calc(var(--phosphor-size) * 5),transparent calc(var(--phosphor-size) * 5),transparent calc(var(--phosphor-size) * 6)),repeating-linear-gradient(0deg,transparent 0px,transparent calc(var(--scan-size) - 0.5px),rgba(0,0,0,0.2) calc(var(--scan-size) - 0.5px),rgba(0,0,0,0.2) var(--scan-size));background-size:calc(var(--phosphor-size) * 6) 100%,100% var(--scan-size);mix-blend-mode:screen}
        @keyframes fringeJitter{0%,100%{transform:translateX(0)}50%{transform:translateX(var(--fringe-jitter-amount))}}
        .crt-noise{z-index:4;mix-blend-mode:soft-light;opacity:var(--noise-opacity);background-repeat:repeat;background-size:512px 512px;will-change:background-position}
        .crt-vignette{z-index:3;background:radial-gradient(ellipse var(--vignette-radius) calc(var(--vignette-radius) + 5%) at 50% 50%,transparent calc(var(--vignette-feather) - 20%),rgba(0,0,0,var(--vignette-color-light)) calc(var(--vignette-feather) + 30%),rgba(0,0,0,var(--vignette-color-dark)) 100%);opacity:var(--vignette-opacity);filter:hue-rotate(var(--color-palette-shift))}
        .crt-reflection{z-index:5;background:radial-gradient(var(--reflection-size) 300px at var(--reflection-position-x) var(--reflection-position-y),rgba(255,255,255,var(--reflection-opacity)) 0%,transparent 50%);mix-blend-mode:screen}
        .crt-flicker{z-index:6;background:rgba(255,255,255,var(--flicker-opacity));mix-blend-mode:screen;opacity:0;pointer-events:none}
        .crt-flicker.flash{animation:flickerFlash 48ms ease-out 1}
        @keyframes flickerFlash{0%,100%{opacity:0;filter:brightness(1)}30%{opacity:0.25;filter:brightness(1.04)}}
        .crt-controls{display:none!important}
      </style>
      <div class="crt-container">
        <div class="crt-layer crt-scanlines"></div>
        <div class="crt-layer crt-fringe"></div>
        <div class="crt-layer crt-noise"></div>
        <div class="crt-layer crt-flicker"></div>
        <div class="crt-layer crt-vignette"></div>
        <div class="crt-layer crt-reflection"></div>
      </div>
      <div class="crt-controls"></div>
    `;

    this.shadowRoot.innerHTML = template;
  }

  injectSVGFilter() {
    if (document.getElementById(`crt-barrel-${this._uid}`)) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('width','0'); svg.setAttribute('height','0'); svg.style.position='absolute'; svg.style.pointerEvents='none'; svg.setAttribute('aria-hidden','true');
    const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
    const filter = document.createElementNS('http://www.w3.org/2000/svg','filter'); filter.id = `crt-barrel-${this._uid}`;
    const turb = document.createElementNS('http://www.w3.org/2000/svg','feTurbulence'); turb.id = `crt-turb-${this._uid}`; turb.setAttribute('type','fractalNoise'); turb.setAttribute('baseFrequency','0.35'); turb.setAttribute('numOctaves','1'); turb.setAttribute('stitchTiles','stitch'); turb.setAttribute('result','noise');
    const disp1 = document.createElementNS('http://www.w3.org/2000/svg','feDisplacementMap'); disp1.id = `crt-disp-${this._uid}`; disp1.setAttribute('in','SourceGraphic'); disp1.setAttribute('in2','noise'); disp1.setAttribute('scale',String(this.config.barrel)); disp1.setAttribute('xChannelSelector','R'); disp1.setAttribute('yChannelSelector','G'); disp1.setAttribute('result','displaced');
    const disp2 = document.createElementNS('http://www.w3.org/2000/svg','feDisplacementMap'); disp2.setAttribute('in','displaced'); disp2.setAttribute('in2','noise'); disp2.setAttribute('scale','1'); disp2.setAttribute('xChannelSelector','B'); disp2.setAttribute('yChannelSelector','A'); disp2.setAttribute('result','pincushion');
    const transfer = document.createElementNS('http://www.w3.org/2000/svg','feComponentTransfer'); transfer.setAttribute('in','pincushion');
    const funcR = document.createElementNS('http://www.w3.org/2000/svg','feFuncR'); funcR.setAttribute('type','linear'); funcR.setAttribute('slope','1.02');
    const funcG = document.createElementNS('http://www.w3.org/2000/svg','feFuncG'); funcG.setAttribute('type','linear'); funcG.setAttribute('slope','1.02');
    const funcB = document.createElementNS('http://www.w3.org/2000/svg','feFuncB'); funcB.setAttribute('type','linear'); funcB.setAttribute('slope','1.02');
    transfer.appendChild(funcR); transfer.appendChild(funcG); transfer.appendChild(funcB);
    filter.appendChild(turb); filter.appendChild(disp1); filter.appendChild(disp2); filter.appendChild(transfer);
    defs.appendChild(filter); svg.appendChild(defs);
    document.body.insertBefore(svg, document.body.firstChild);
  }

  initializeEffects() { this.generateNoisePool(); this.bindControls(); }

  generateNoisePool() {
    if (this.noisePool.length > 0) return;
    
    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Generate 60 noise frames for smooth 60fps animation
    for (let n = 0; n < 60; n++) {
      const img = ctx.createImageData(size, size);
      
      // Fill with random grayscale noise (RGBA)
      for (let i = 0; i < img.data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        img.data[i] = v * 0.6;     // R: slightly dimmed
        img.data[i + 1] = v * 0.6; // G: slightly dimmed
        img.data[i + 2] = v * 0.7; // B: slightly more blue
        img.data[i + 3] = 80;      // A: semi-transparent
      }
      
      ctx.putImageData(img, 0, 0);
      this.noisePool.push(canvas.toDataURL('image/png'));
    }
  }

  bindControls() { const root = this.controlsPortal || this.shadowRoot; }

  createControlsPortal() {
    if (this.controlsPortal) return;

    const portal = document.createElement('div');
    portal.className = 'crt-controls-portal';
    portal.style.position = 'fixed';
    portal.style.right = '18px';
    portal.style.bottom = '18px';
    portal.style.zIndex = '1000000';
    portal.style.pointerEvents = 'auto';
    portal.style.display = this.config.controls ? 'block' : 'none';
    portal.style.maxHeight = '80vh';
    portal.style.overflowY = 'auto';

    // Add style for dropdown options and scrollbar
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .crt-controls-portal select option {
        background: #1a1a1a;
        color: #e6f7ff;
      }
      .crt-controls-portal select option:hover,
      .crt-controls-portal select option:checked {
        background: #2a2a2a;
        color: #4aa3e1;
      }
      .crt-controls-portal optgroup {
        background: #1a1a1a;
        color: #e6f7ff;
      }
      /* Styled scrollbar */
      .crt-controls-portal::-webkit-scrollbar {
        width: 10px;
      }
      .crt-controls-portal::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 5px;
      }
      .crt-controls-portal::-webkit-scrollbar-thumb {
        background: rgba(74, 163, 225, 0.6);
        border-radius: 5px;
        border: 2px solid rgba(0, 0, 0, 0.3);
      }
      .crt-controls-portal::-webkit-scrollbar-thumb:hover {
        background: rgba(74, 163, 225, 0.8);
      }
      /* Collapsible section styling */
      .crt-section-toggle {
        cursor: pointer;
        user-select: none;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .crt-section-toggle::after {
        content: '▼';
        font-size: 10px;
        transition: transform 0.2s ease;
      }
      .crt-section-toggle.collapsed::after {
        transform: rotate(-90deg);
      }
    `;
    document.head.appendChild(styleEl);

    portal.innerHTML = `
      <details open style="background: rgba(0,0,0,0.85); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); color: #e6f7ff; font-family: system-ui, sans-serif; font-size: 12px; min-width: 280px;">
        <summary style="cursor:pointer; margin-bottom:8px; font-weight:600;">CRT Controls</summary>
        
        <!-- Preset selector -->
        <label style="display:flex; justify-content:space-between; align-items:center; margin:8px 0; gap:8px; font-weight:500; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">
          <span>Preset</span>
          <select class="ctl-preset" style="flex: 1; padding: 4px; border-radius: 4px; background: rgba(255,255,255,0.1); color: #e6f7ff; border: 1px solid rgba(255,255,255,0.2);">
            <option value="">Custom</option>
            <optgroup label="Classic Desktop">
              <option value="default">Default</option>
              <option value="trinitron-fd">Trinitron FD</option>
              <option value="professional-monitor">Professional Monitor</option>
              <option value="monitor-1084s">Monitor 1084S</option>
              <option value="studio-display-crt">Studio Display CRT</option>
              <option value="arcade-crt">Arcade CRT</option>
            </optgroup>
            <optgroup label="Professional Monitors">
              <option value="broadcast-monitor">Broadcast Monitor</option>
              <option value="rgb-professional">RGB Professional</option>
              <option value="retro-studio">Retro Studio</option>
            </optgroup>
            <optgroup label="Phosphor Colors">
              <option value="amber-phosphor">Amber Phosphor</option>
              <option value="green-phosphor">Green Phosphor</option>
              <option value="blue-phosphor">Blue Phosphor</option>
              <option value="phosphor-white">White Phosphor</option>
            </optgroup>
            <optgroup label="Specialized">
              <option value="vt220-terminal">VT220 Terminal</option>
              <option value="lcd-handheld">LCD Handheld</option>
              <option value="classic-rgb">Classic RGB</option>
              <option value="precision-flatcrt">Precision FlatCRT</option>
              <option value="composite-color">Composite Color</option>
            </optgroup>
            <optgroup label="Alternative Display Tech">
              <option value="plasma-display">Plasma Display</option>
              <option value="vector-display">Vector Display</option>
            </optgroup>
          </select>
        </label>

        <!-- SCANLINES SECTION -->
        <details open style="border-bottom:1px solid rgba(255,255,255,0.1); padding:8px 0; margin:8px 0;">
          <summary style="font-weight:600; color:#ffaa44; margin-bottom:6px; cursor:pointer;">Scanlines</summary>
          ${this._controlRow('Scan opacity','ctl-scan','0','1','0.02',this.config.scanOpacity,2)}
          ${this._controlRow('Scanline darkness','ctl-scanline-color','0','1','0.05',this.config.scanlineColor,2)}
          ${this._controlRow('Scan size','ctl-scan-size','2','8','0.5',this.config.scanSize,1)}
          <label style="display:flex; justify-content:space-between; align-items:center; margin:6px 0; gap:8px;">
            <span style="flex-shrink:0; min-width:140px;">Scanline mask</span>
            <select class="ctl-scanline-mask" style="flex:1; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.2); color:#e6f7ff; border-radius:4px; padding:4px 6px;">
              <option value="shadow-mask" ${this.config.scanlineMask === 'shadow-mask' ? 'selected' : ''}>Shadow Mask</option>
              <option value="aperture-grille" ${this.config.scanlineMask === 'aperture-grille' ? 'selected' : ''}>Aperture Grille</option>
              <option value="slot-mask" ${this.config.scanlineMask === 'slot-mask' ? 'selected' : ''}>Slot Mask</option>
              <option value="sharp" ${this.config.scanlineMask === 'sharp' ? 'selected' : ''}>Sharp</option>
              <option value="soft" ${this.config.scanlineMask === 'soft' ? 'selected' : ''}>Soft</option>
            </select>
          </label>
        </details>

        <!-- HAIRLINES SECTION -->
        <details open style="border-bottom:1px solid rgba(255,255,255,0.1); padding:8px 0; margin:8px 0;">
          <summary style="font-weight:600; color:#44aaff; margin-bottom:6px; cursor:pointer;">Hairlines</summary>
          ${this._controlRow('Hairline opacity','ctl-hairline','0','0.3','0.01',this.config.hairlineOpacity,2)}
          ${this._controlRow('Scan density','ctl-scan-density','1','4','0.1',this.config.scanDensity,1)}
        </details>

        <!-- FRINGE SECTION -->
        <details open style="border-bottom:1px solid rgba(255,255,255,0.1); padding:8px 0; margin:8px 0;">
          <summary style="font-weight:600; color:#ff88ff; margin-bottom:6px; cursor:pointer;">Chromatic Aberration</summary>
          ${this._controlRow('Fringe opacity','ctl-fringe','0','0.6','0.02',this.config.fringeOpacity,2)}
          ${this._controlRow('Fringe color shift','ctl-fringe-dominant','0','1','0.05',this.config.fringeDominant,2)}
          ${this._controlRow('Fringe jitter speed','ctl-fringe-jitter-speed','1','5','0.1',this.config.fringeJitterSpeed,1)}
          ${this._controlRow('Fringe jitter amount','ctl-fringe-jitter-amount','0','5','0.5',this.config.fringeJitterAmount,1)}
          ${this._controlRow('Phosphor size','ctl-phosphor','0.5','3','0.1',this.config.phosphorSize,1)}
          ${this._controlRow('Phosphor red opacity','ctl-phosphor-red','0','0.3','0.01',this.config.phosphorOpacityRed,2)}
          ${this._controlRow('Phosphor green opacity','ctl-phosphor-green','0','0.3','0.01',this.config.phosphorOpacityGreen,2)}
          ${this._controlRow('Phosphor blue opacity','ctl-phosphor-blue','0','0.3','0.01',this.config.phosphorOpacityBlue,2)}
        </details>

        <!-- NOISE SECTION -->
        <details style="border-bottom:1px solid rgba(255,255,255,0.1); padding:8px 0; margin:8px 0;">
          <summary style="font-weight:600; color:#88ff88; margin-bottom:6px; cursor:pointer;">Film Grain</summary>
          ${this._controlRow('Noise opacity','ctl-noise','0','0.4','0.01',this.config.noiseOpacity,2)}
        </details>

        <!-- VIGNETTE SECTION -->
        <details style="border-bottom:1px solid rgba(255,255,255,0.1); padding:8px 0; margin:8px 0;">
          <summary style="font-weight:600; color:#ff6644; margin-bottom:6px; cursor:pointer;">Vignette</summary>
          ${this._controlRow('Vignette opacity','ctl-vignette','0','1','0.05',this.config.vignetteOpacity,2)}
          ${this._controlRow('Vignette radius','ctl-vignette-radius','30','95','5',this.config.vignetteRadius,0)}
          ${this._controlRow('Vignette feather','ctl-vignette-feather','10','80','5',this.config.vignetteFeather,0)}
          ${this._controlRow('Vignette inner dark','ctl-vignette-color-light','0','1','0.05',this.config.vignetteColorLight,2)}
          ${this._controlRow('Vignette outer dark','ctl-vignette-color-dark','0','1','0.05',this.config.vignetteColorDark,2)}
        </details>

        <!-- REFLECTION SECTION -->
        <details style="border-bottom:1px solid rgba(255,255,255,0.1); padding:8px 0; margin:8px 0;">
          <summary style="font-weight:600; color:#44ff99; margin-bottom:6px; cursor:pointer;">Reflection</summary>
          <label style="display:flex; justify-content:space-between; align-items:center; margin:6px 0; gap:8px;">
            <input type="checkbox" class="ctl-reflection" ${this.config.reflection ? 'checked' : ''}>
            <span>Enable Reflection</span>
          </label>
          ${this._controlRow('Reflection size','ctl-reflection-size','800','2000','100',this.config.reflectionSize,0)}
          ${this._controlRow('Reflection opacity','ctl-reflection-opacity','0','0.15','0.01',this.config.reflectionOpacity,3)}
          ${this._controlRow('Reflection position X','ctl-reflection-position-x','0','100','5',this.config.reflectionPositionX,0)}
          ${this._controlRow('Reflection position Y','ctl-reflection-position-y','0','100','5',this.config.reflectionPositionY,0)}
        </details>

        <!-- FLICKER SECTION -->
        <details style="border-bottom:1px solid rgba(255,255,255,0.1); padding:8px 0; margin:8px 0;">
          <summary style="font-weight:600; color:#ffff44; margin-bottom:6px; cursor:pointer;">Flicker</summary>
          <label style="display:flex; justify-content:space-between; align-items:center; margin:6px 0; gap:8px;">
            <input type="checkbox" class="ctl-flicker" ${this.config.flicker ? 'checked' : ''}>
            <span>Enable Flicker</span>
          </label>
          ${this._controlRow('Flicker opacity','ctl-flicker-opacity','0','0.2','0.01',this.config.flickerOpacity,2)}
        </details>

        <!-- BLOOM SECTION -->
        <details style="border-bottom:1px solid rgba(255,255,255,0.1); padding:8px 0; margin:8px 0;">
          <summary style="font-weight:600; color:#ffccaa; margin-bottom:6px; cursor:pointer;">Bloom</summary>
          ${this._controlRow('Bloom strength','ctl-bloom','0','0.4','0.02',this.config.bloom,2)}
          ${this._controlRow('Bloom brightness','ctl-bloom-brightness','0.5','2','0.1',this.config.bloomBrightness,1)}
          ${this._controlRow('Bloom radius','ctl-bloom-radius','800','2000','100',this.config.bloomRadius,0)}
          ${this._controlRow('Bloom decay','ctl-bloom-decay','20','90','5',this.config.bloomDecay,0)}
          ${this._controlRow('Bloom blur','ctl-bloom-blur','2','40','2',this.config.bloomBlur,0)}
          <label style="display:flex; justify-content:space-between; align-items:center; margin:6px 0; gap:8px;">
            <span>Bloom color</span>
            <select class="ctl-bloom-color" style="flex: 1; padding: 4px; border-radius: 4px; background: rgba(255,255,255,0.1); color: #e6f7ff; border: 1px solid rgba(255,255,255,0.2);">
              <option value="white">White</option>
              <option value="amber">Amber</option>
              <option value="green">Green</option>
              <option value="blue">Blue</option>
            </select>
          </label>
        </details>

        <!-- COLOR & EFFECTS SECTION -->
        <details style="border-bottom:1px solid rgba(255,255,255,0.1); padding:8px 0; margin:8px 0;">
          <summary style="font-weight:600; color:#88ffaa; margin-bottom:6px; cursor:pointer;">Color & Effects</summary>
          ${this._controlRow('Color palette shift','ctl-color-palette-shift','-180','180','15',this.config.colorPaletteShift,0)}
          ${this._controlRow('Interlace speed','ctl-interlace-speed','0.05','0.2','0.01',this.config.interlaceSpeed,2)}
        </details>

        <!-- BARREL DISTORTION SECTION -->
        <details style="border-bottom:1px solid rgba(255,255,255,0.1); padding:8px 0; margin:8px 0;">
          <summary style="font-weight:600; color:#ff8844; margin-bottom:6px; cursor:pointer;">Barrel Distortion</summary>
          ${this._controlRow('Barrel amount','ctl-barrel','0','6','0.2',this.config.barrel,1)}
        </details>

        <!-- MODE SECTION -->
        <details open style="padding:8px 0; margin:8px 0;">
          <summary style="font-weight:600; color:#44ffaa; margin-bottom:6px; cursor:pointer;">Overlay Mode</summary>
          <label style="display:flex; justify-content:space-between; align-items:center; margin:6px 0; gap:8px;">
            <span>Mode</span>
            <select class="ctl-mode" style="flex: 1; padding: 4px; border-radius: 4px; background: rgba(255,255,255,0.1); color: #e6f7ff; border: 1px solid rgba(255,255,255,0.2);">
              <option value="0">Disabled</option>
              <option value="1">Behind Content</option>
              <option value="2">On Top</option>
            </select>
          </label>
        </details>
      </details>
    `;

    document.body.appendChild(portal);
    this.controlsPortal = portal;
    this.bindControls();
  }

  _controlRow(label, cls, min, max, step, value, decimals = 2) {
    const numberId = `${cls}-number`;
    return `
      <label style="display:flex; justify-content:space-between; align-items:center; margin:6px 0; gap:8px;">
        <span style="flex-shrink:0; min-width:140px;">${label}</span>
        <input type="range" class="${cls}" min="${min}" max="${max}" step="${step}" value="${value}" style="flex:1;">
        <input type="number" class="${numberId}" min="${min}" max="${max}" step="${step}" value="${Number(value).toFixed(decimals)}" style="width:70px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.2); color:#e6f7ff; border-radius:4px; padding:4px 6px; text-align:center; font-size:12px;">
      </label>
    `;
  }

  toggleControls() {
    const portal = this.controlsPortal;
    if (portal) {
      portal.style.display = this.config.controls ? 'block' : 'none';
    }
  }

  toggleFlicker() {
    // Clear any existing flicker animation
    if (this.animationFrames.flicker) {
      clearTimeout(this.animationFrames.flicker);
      this.animationFrames.flicker = null;
    }
    
    // Start new animation if enabled
    if (this.config.flicker) {
      this.animateFlicker();
    }
  }

  toggleReflection() {
    const reflectionLayer = this.shadowRoot.querySelector('.crt-reflection');
    if (reflectionLayer) {
      reflectionLayer.style.display = this.config.reflection ? 'block' : 'none';
    }
  }

  bindControls() {
    const root = this.controlsPortal || this.shadowRoot;
    const presetSelect = root.querySelector('.ctl-preset');
    
    const controls = {
      'ctl-scan': { prop: 'scanOpacity', attr: 'scan-opacity' },
      'ctl-scanline-color': { prop: 'scanlineColor', attr: 'scanline-color' },
      'ctl-hairline': { prop: 'hairlineOpacity', attr: 'hairline-opacity' },
      'ctl-fringe': { prop: 'fringeOpacity', attr: 'fringe-opacity' },
      'ctl-fringe-dominant': { prop: 'fringeDominant', attr: 'fringe-dominant' },
      'ctl-fringe-jitter-speed': { prop: 'fringeJitterSpeed', attr: 'fringe-jitter-speed' },
      'ctl-fringe-jitter-amount': { prop: 'fringeJitterAmount', attr: 'fringe-jitter-amount' },
      'ctl-noise': { prop: 'noiseOpacity', attr: 'noise-opacity' },
      'ctl-barrel': { prop: 'barrel', attr: 'barrel' },
      'ctl-scan-size': { prop: 'scanSize', attr: 'scan-size' },
      'ctl-scan-density': { prop: 'scanDensity', attr: 'scan-density' },
      'ctl-phosphor': { prop: 'phosphorSize', attr: 'phosphor-size' },
      'ctl-phosphor-red': { prop: 'phosphorOpacityRed', attr: 'phosphor-opacity-red' },
      'ctl-phosphor-green': { prop: 'phosphorOpacityGreen', attr: 'phosphor-opacity-green' },
      'ctl-phosphor-blue': { prop: 'phosphorOpacityBlue', attr: 'phosphor-opacity-blue' },
      'ctl-bloom': { prop: 'bloom', attr: 'bloom' },
      'ctl-bloom-brightness': { prop: 'bloomBrightness', attr: 'bloom-brightness' },
      'ctl-bloom-radius': { prop: 'bloomRadius', attr: 'bloom-radius' },
      'ctl-bloom-decay': { prop: 'bloomDecay', attr: 'bloom-decay' },
      'ctl-bloom-blur': { prop: 'bloomBlur', attr: 'bloom-blur' },
      'ctl-vignette': { prop: 'vignetteOpacity', attr: 'vignette-opacity' },
      'ctl-vignette-radius': { prop: 'vignetteRadius', attr: 'vignette-radius' },
      'ctl-vignette-feather': { prop: 'vignetteFeather', attr: 'vignette-feather' },
      'ctl-vignette-color-light': { prop: 'vignetteColorLight', attr: 'vignette-color-light' },
      'ctl-vignette-color-dark': { prop: 'vignetteColorDark', attr: 'vignette-color-dark' },
      'ctl-reflection-size': { prop: 'reflectionSize', attr: 'reflection-size' },
      'ctl-reflection-opacity': { prop: 'reflectionOpacity', attr: 'reflection-opacity' },
      'ctl-reflection-position-x': { prop: 'reflectionPositionX', attr: 'reflection-position-x' },
      'ctl-reflection-position-y': { prop: 'reflectionPositionY', attr: 'reflection-position-y' },
      'ctl-color-palette-shift': { prop: 'colorPaletteShift', attr: 'color-palette-shift' },
      'ctl-interlace-speed': { prop: 'interlaceSpeed', attr: 'interlace-speed' },
      'ctl-flicker-opacity': { prop: 'flickerOpacity', attr: 'flicker-opacity' }
    };

    Object.entries(controls).forEach(([className, { prop, attr }]) => {
      const slider = root.querySelector(`.${className}`);
      const numberInput = root.querySelector(`.${className}-number`);
      
      if (slider) {
        // Slider input updates config and number input
        slider.addEventListener('input', (e) => {
          const value = parseFloat(e.target.value);
          this.config[prop] = value;
          this.setAttribute(attr, value);
          if (presetSelect) presetSelect.value = '';
          
          // Sync number input
          if (numberInput) {
            const decimals = (attr === 'barrel' || attr.includes('size') || attr.includes('density')) ? 1 : 2;
            numberInput.value = value.toFixed(decimals);
          }
          
          if (attr === 'barrel') this.updateBarrel();
          this.updateStyles();
        });
      }
      
      if (numberInput) {
        // Number input updates config and slider
        numberInput.addEventListener('input', (e) => {
          const value = parseFloat(e.target.value);
          if (!isNaN(value)) {
            this.config[prop] = value;
            this.setAttribute(attr, value);
            if (presetSelect) presetSelect.value = '';
            
            // Sync slider
            if (slider) slider.value = value;
            
            if (attr === 'barrel') this.updateBarrel();
            this.updateStyles();
          }
        });
      }
    });

    // Scanline mask selector
    const scanlineMaskSelect = root.querySelector('.ctl-scanline-mask');
    if (scanlineMaskSelect) {
      scanlineMaskSelect.value = this.config.scanlineMask;
      scanlineMaskSelect.addEventListener('change', (e) => {
        this.config.scanlineMask = e.target.value;
        this.setAttribute('scanline-mask', e.target.value);
        if (presetSelect) presetSelect.value = '';
        this.updateStyles();
      });
    }

    // Bloom color selector
    const bloomColorSelect = root.querySelector('.ctl-bloom-color');
    if (bloomColorSelect) {
      bloomColorSelect.value = this.config.bloomColor;
      const updateBloomColor = (e) => {
        this.config.bloomColor = e.target.value;
        this.setAttribute('bloom-color', e.target.value);
        if (presetSelect) presetSelect.value = '';
        this.updateExternalBloomLayer();
      };
      bloomColorSelect.addEventListener('change', updateBloomColor);
      bloomColorSelect.addEventListener('input', updateBloomColor);
    }

    // Flicker toggle
    const flickerToggle = root.querySelector('.ctl-flicker');
    if (flickerToggle) {
      flickerToggle.addEventListener('change', (e) => {
        this.config.flicker = e.target.checked;
        if (e.target.checked) {
          this.setAttribute('flicker', '');
        } else {
          this.removeAttribute('flicker');
        }
        this.toggleFlicker();
      });
    }
    
    // Reflection toggle
    const reflectionToggle = root.querySelector('.ctl-reflection');
    if (reflectionToggle) {
      reflectionToggle.addEventListener('change', (e) => {
        this.config.reflection = e.target.checked;
        if (e.target.checked) {
          this.setAttribute('reflection', '');
        } else {
          this.removeAttribute('reflection');
        }
        this.toggleReflection();
      });
    }
    
    // Mode selector
    const modeSelect = root.querySelector('.ctl-mode');
    if (modeSelect) {
      modeSelect.value = String(this.config.mode);
      modeSelect.addEventListener('change', (e) => {
        const mode = parseInt(e.target.value, 10);
        this.config.mode = mode;
        this.setAttribute('mode', mode);
        if (presetSelect) presetSelect.value = '';
        this.updateModeZIndex();
      });
    }

    // Preset dropdown
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        const preset = this.getPreset(e.target.value);
        if (preset) {
          this.applyPreset(preset);
        }
      });
    }
  }

  startAnimations() { 
    this.animateNoise(); 
    if (this.config.flicker) this.animateFlicker(); 
  }
  
  stopAnimations() { 
    if (this.animationFrames.noise) clearTimeout(this.animationFrames.noise); 
    if (this.animationFrames.flicker) clearTimeout(this.animationFrames.flicker); 
  }

  animateNoise() { 
    const noiseLayer = this.shadowRoot.querySelector('.crt-noise'); 
    if (!noiseLayer || this.noisePool.length === 0) return; 
    
    // Initialize background images on first run
    if (!this.currentNoiseUrl) { 
      const urls = this.noisePool.map(u => `url(${u})`).join(', '); 
      noiseLayer.style.backgroundImage = urls; 
      this.currentNoiseUrl = urls; 
    } 
    
    // Randomly shift background positions for film grain effect
    const positions = this.noisePool.map(() => { 
      const x = Math.floor(Math.random() * 10) - 5; 
      const y = Math.floor(Math.random() * 10) - 5; 
      return `${x}px ${y}px`; 
    }); 
    noiseLayer.style.backgroundPosition = positions.join(', '); 
    
    this.animationFrames.noise = setTimeout(() => this.animateNoise(), 16); 
  }

  animateFlicker() { 
    if (!this.config.flicker) return; 
    
    const flashLayer = this.shadowRoot.querySelector('.crt-flicker'); 
    
    // 60% chance of flicker effect per cycle
    if (Math.random() > 0.4) { 
      if (flashLayer) { 
        flashLayer.classList.remove('flash'); 
        void flashLayer.offsetWidth; // Force reflow
        flashLayer.classList.add('flash'); 
      } 
      this.dispatchEvent(new CustomEvent('flicker', {
        detail: { duration: 35 }, 
        bubbles: true, 
        composed: true
      })); 
    } 
    
    // Random interval between 150-550ms
    this.animationFrames.flicker = setTimeout(() => this.animateFlicker(), 150 + Math.random() * 400); 
  }

  updateStyles() {
    const container = this.shadowRoot.querySelector('.crt-container'); if (!container) return;
    container.style.setProperty('--scan-opacity', this.config.scanOpacity);
    container.style.setProperty('--scanline-color', this.config.scanlineColor);
    container.style.setProperty('--hairline-opacity', this.config.hairlineOpacity);
    container.style.setProperty('--fringe-opacity', this.config.fringeOpacity);
    container.style.setProperty('--fringe-jitter-speed', `${this.config.fringeJitterSpeed}s`);
    container.style.setProperty('--fringe-jitter-amount', `${this.config.fringeJitterAmount}px`);
    container.style.setProperty('--noise-opacity', this.config.noiseOpacity);
    container.style.setProperty('--scan-size', `${this.config.scanSize}px`);
    container.style.setProperty('--scan-density', this.config.scanDensity);
    container.style.setProperty('--phosphor-size', `${this.config.phosphorSize}px`);
    container.style.setProperty('--phosphor-red', this.config.phosphorOpacityRed);
    container.style.setProperty('--phosphor-green', this.config.phosphorOpacityGreen);
    container.style.setProperty('--phosphor-blue', this.config.phosphorOpacityBlue);
    container.style.setProperty('--bloom-strength', this.config.bloom);
    container.style.setProperty('--fringe-dominant', this.config.fringeDominant);
    container.style.setProperty('--bloom-radius', `${this.config.bloomRadius}px`);
    container.style.setProperty('--bloom-decay', `${this.config.bloomDecay}%`);
    container.style.setProperty('--vignette-opacity', this.config.vignetteOpacity);
    container.style.setProperty('--vignette-radius', `${this.config.vignetteRadius}%`);
    container.style.setProperty('--vignette-feather', `${this.config.vignetteFeather}%`);
    container.style.setProperty('--vignette-color-light', this.config.vignetteColorLight);
    container.style.setProperty('--vignette-color-dark', this.config.vignetteColorDark);
    container.style.setProperty('--reflection-opacity', this.config.reflectionOpacity);
    container.style.setProperty('--reflection-size', `${this.config.reflectionSize}px`);
    container.style.setProperty('--reflection-position-x', `${this.config.reflectionPositionX}%`);
    container.style.setProperty('--reflection-position-y', `${this.config.reflectionPositionY}%`);
    container.style.setProperty('--color-palette-shift', `${this.config.colorPaletteShift}deg`);
    container.style.setProperty('--interlace-speed', `${this.config.interlaceSpeed}s`);
    container.style.setProperty('--flicker-opacity', this.config.flickerOpacity);
    this.applyScanlineMask();
    this.updateModeZIndex();
    this.updateExternalBloomLayer(); this.applyGlobalFilters(); this.dispatchEvent(new CustomEvent('bloom-change',{detail:{bloom:this.config.bloom},bubbles:true,composed:true}));
  }

  applyScanlineMask() {
    const container = this.shadowRoot.querySelector('.crt-container');
    if (!container) return;
    
    // Create style element if it doesn't exist
    let maskStyle = this.shadowRoot.querySelector('#scanline-mask-style');
    if (!maskStyle) {
      maskStyle = document.createElement('style');
      maskStyle.id = 'scanline-mask-style';
      this.shadowRoot.appendChild(maskStyle);
    }
    
    // Apply different scanline + hairline + interlacing patterns based on mask type
    switch (this.config.scanlineMask) {
      case 'aperture-grille':
        // Trinitron-style: vertical stripes only, no horizontal scanlines or interlacing
        maskStyle.textContent = `
          .crt-scanlines { background-image: repeating-linear-gradient(90deg, rgba(0,0,0,var(--scanline-color)) 0px, transparent 1px, transparent 2px) !important; }
          .crt-scanlines::after { display: none !important; }
        `;
        break;
      case 'slot-mask':
        // Vertical slots with subtle horizontal pattern, no interlacing animation
        maskStyle.textContent = `
          .crt-scanlines { background-image: repeating-linear-gradient(90deg, rgba(0,0,0,var(--scanline-color)) 0px, transparent 0.5px, transparent 3px), repeating-linear-gradient(0deg, transparent 0px, rgba(0,0,0,calc(var(--scanline-color) * 0.3)) calc(var(--scan-size) - 0.5px), rgba(0,0,0,calc(var(--scanline-color) * 0.3)) var(--scan-size)) !important; }
          .crt-scanlines::after { background-image: repeating-linear-gradient(90deg, rgba(255,255,255,0.4) 0px, transparent 0.3px, transparent 3px) !important; background-size: 100% 100% !important; animation: none !important; }
        `;
        break;
      case 'sharp':
        // High-definition sharp scanlines with crisp hairlines, no interlacing (static pattern)
        maskStyle.textContent = `
          .crt-scanlines { background-image: repeating-linear-gradient(0deg, transparent 0px, transparent calc(var(--scan-size) - 1px), rgba(0,0,0,var(--scanline-color)) calc(var(--scan-size) - 1px), rgba(0,0,0,var(--scanline-color)) var(--scan-size)) !important; }
          .crt-scanlines::after { background-image: repeating-linear-gradient(0deg, rgba(255,255,255,1) 0px, transparent 0.5px, transparent calc(var(--scan-size) * var(--scan-density))) !important; animation: none !important; }
        `;
        break;
      case 'soft':
        // Softer, blended scanlines with subtle hairlines and gentle interlacing
        maskStyle.textContent = `
          .crt-scanlines { background-image: repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,calc(var(--scanline-color) * 0.6)) calc(var(--scan-size) * 0.5), rgba(0,0,0,0) var(--scan-size)) !important; }
          .crt-scanlines::after { 
            background-image: repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.4) 0.5px, transparent 0.8px, transparent calc(var(--scan-size) * var(--scan-density))) !important; 
            animation: interlaceSoft var(--interlace-speed) ease-in-out infinite !important;
          }
          @keyframes interlaceSoft {
            0%, 100% { transform: translateY(0); opacity: var(--hairline-opacity); }
            50% { transform: translateY(0.5px); opacity: calc(var(--hairline-opacity) * 0.8); }
          }
        `;
        break;
      case 'shadow-mask':
      default:
        // Traditional CRT: standard horizontal scanlines with animated interlaced hairlines
        maskStyle.textContent = `
          .crt-scanlines { background-image: repeating-linear-gradient(0deg, transparent 0px, transparent calc(var(--scan-size) - 0.5px), rgba(0,0,0,calc(0.65 * (1 - var(--scanline-color)))) calc(var(--scan-size) - 0.5px), rgba(0,0,0,calc(0.65 * (1 - var(--scanline-color)))) var(--scan-size)) !important; }
          .crt-scanlines::after { 
            background-image: repeating-linear-gradient(0deg, rgba(255,255,255,1) 0px, rgba(255,255,255,0.85) 0.8px, transparent 0.8px, transparent calc(var(--scan-size) * var(--scan-density))) !important; 
            animation: interlace var(--interlace-speed) steps(2) infinite !important;
          }
        `;
        break;
    }
  }

  updateModeZIndex() {
    let zIndex;
    switch(this.config.mode) {
      case 0: // disabled
        this.style.visibility = 'hidden';
        this.style.pointerEvents = 'none';
        // Disable bloom layer when disabled
        if (this.externalBloomLayer) {
          this.externalBloomLayer.style.visibility = 'hidden';
        }
        return;
      case 1: // behind content
        zIndex = -1;
        break;
      case 2: // on top
        zIndex = 9999;
        break;
      default:
        zIndex = -1;
    }
    this.style.visibility = 'visible';
    this.style.pointerEvents = 'none';
    this.style.zIndex = String(zIndex);
    if (this.externalBloomLayer) {
      this.externalBloomLayer.style.visibility = 'visible';
      this.externalBloomLayer.style.zIndex = String(zIndex);
    }
  }

  updateBarrel() {
    const disp = document.getElementById(`crt-disp-${this._uid}`);
    const turb = document.getElementById(`crt-turb-${this._uid}`);
    if (disp) disp.setAttribute('scale', String(this.config.barrel));
    if (turb){ const freq = Math.max(0.12, 0.35*(this.config.barrel/3)); turb.setAttribute('baseFrequency', String(freq)); }
    
    // Only apply barrel if enabled (mode 1 or 2, not mode 0)
    const shouldApplyBarrel = this.config.barrel > 0 && this.config.mode > 0;
    const filterValue = shouldApplyBarrel ? `url(#crt-barrel-${this._uid})` : 'none';
    const container = this.shadowRoot.querySelector('.crt-container'); if (container) container.style.filter = 'none';
    this.applyGlobalFilters(filterValue);
    this.dispatchEvent(new CustomEvent('barrel-change',{detail:{barrel:this.config.barrel,filterId:`crt-barrel-${this._uid}`},bubbles:true,composed:true}));
  }

  applyGlobalFilters(barrelFilterValue){
    const varName = `--crt-filter-chain-${this._uid}`;
    const bodyClass = `crt-filtered-${this._uid}`;
    
    // Set barrel filter CSS var
    const barrel = barrelFilterValue || (this.config.barrel>0 && this.config.mode > 0 ? `url(#crt-barrel-${this._uid})` : 'none');
    document.documentElement.style.setProperty(varName, barrel);
    
    // Determine target for barrel filter based on mode
    let target;
    if (this.config.mode === 1) {
      // Behind content mode: apply barrel only to background
      target = this.config.applyBarrelTo || '.bg-image';
    } else if (this.config.mode === 2) {
      // On top mode: apply barrel to all content
      target = this.config.applyBarrelTo || '> *:not(crt-overlay):not(.crt-controls-portal):not(.crt-external-bloom)';
    } else {
      // Disabled mode: no barrel
      target = null;
    }
    
    // Build complete filter chain: barrel + hue-rotate
    let filterChain = barrel;
    if (this.config.colorPaletteShift !== 0) {
      const hueFilter = `hue-rotate(${this.config.colorPaletteShift}deg)`;
      filterChain = barrel === 'none' 
        ? hueFilter 
        : `${barrel} ${hueFilter}`;
    }
    document.documentElement.style.setProperty(varName, filterChain);
    
    // Inject CSS rule for filter application (barrel + color shift)
    if (this._globalStyle && target) {
      const css = `body.${bodyClass} ${target} { filter: var(${varName}, none) !important; }`;
      this._globalStyle.textContent = css;
    } else if (this._globalStyle) {
      this._globalStyle.textContent = '';
    }
    
    // Add or remove body class based on whether any global filter is active
    if ((this.config.barrel > 0 || this.config.colorPaletteShift !== 0) && this.config.mode > 0) {
      document.body.classList.add(bodyClass);
    } else {
      document.body.classList.remove(bodyClass);
    }
  }

  ensureGlobalFilterStyle() { 
    if (this._globalStyle) return; 
    
    const id = `crt-global-filter-style-${this._uid}`; 
    const style = document.createElement('style'); 
    style.id = id; 
    this._globalStyle = style; 
    document.head.appendChild(style); 
  }

  createExternalBloomLayer() { 
    if (this.externalBloomLayer) return; 
    
    const layer = document.createElement('div'); 
    layer.className = 'crt-external-bloom'; 
    layer.style.position = 'fixed'; 
    layer.style.inset = '0'; 
    layer.style.pointerEvents = 'none'; 
    
    // Insert before overlay in DOM to respect z-index
    if (this.parentElement) {
      this.parentElement.insertBefore(layer, this); 
    } else {
      document.body.appendChild(layer); 
    }
    
    this.externalBloomLayer = layer; 
    this.updateExternalBloomLayer(); 
  }

  updateExternalBloomLayer() {
    if (!this.externalBloomLayer) return;
    const s = this.externalBloomLayer.style;
    const b = this.config.bloom;
    this.updateModeZIndex(); // Ensure z-index is correct
    
    // Hide bloom layer completely when bloom is very low or disabled
    if (b < 0.05) {
      s.backdropFilter = 'none';
      s.webkitBackdropFilter = 'none';
      return;
    }
    
    // Apply bloom glow effect using only backdrop-filter blur + brightness
    // Blur scales with bloom strength to avoid excessive blurring (0.15 bloom = ~0.5px blur)
    const blurPx = this.config.bloomBlur * Math.max(0.15, b); // Scale blur with bloom strength (min 0.15x)
    const bright = 1 + b * this.config.bloomBrightness * 0.4; // Reduce brightness impact
    s.backdropFilter = `blur(${Math.min(blurPx, 1.5)}px) brightness(${bright})`;
    s.webkitBackdropFilter = s.backdropFilter;
  }


  getPreset(name){
    const presets = {
      // CLASSIC DESKTOP CRTs
      'default': { 
        scanOpacity:0.85, scanlineColor:0, hairlineOpacity:0.18, fringeOpacity:0.25, fringeDominant:0.5, fringeJitterSpeed:3.2, fringeJitterAmount:2, noiseOpacity:0.22, 
        barrel:2, scanSize:4, scanDensity:2, phosphorSize:1, phosphorOpacityRed:0.15, phosphorOpacityGreen:0.15, phosphorOpacityBlue:0.15, bloom:0.15, bloomColor:'white', bloomRadius:1400, bloomDecay:55, bloomBlur:10, bloomBrightness:1.2,
        vignetteOpacity:0.5, vignetteRadius:85, vignetteFeather:40, vignetteColorLight:0.35, vignetteColorDark:0.7, reflectionOpacity:0.03, reflectionSize:1400, reflectionPositionX:50, reflectionPositionY:10, reflection:false, scanlineMask:'shadow-mask', flickerOpacity:0.08, flicker:true, colorPaletteShift:0, interlaceSpeed:0.08
      },
      'trinitron-fd': { 
        // Trinitron FD series: crisp, low scanline visibility, minimal aberration, aperture grille
        scanOpacity:0.72, scanlineColor:0.08, hairlineOpacity:0.16, fringeOpacity:0.12, fringeDominant:0.4, fringeJitterSpeed:2.8, fringeJitterAmount:1.5, noiseOpacity:0.1, 
        barrel:1.8, scanSize:3.5, scanDensity:2.2, phosphorSize:0.9, phosphorOpacityRed:0.14, phosphorOpacityGreen:0.15, phosphorOpacityBlue:0.13, bloom:0.24, bloomColor:'white', bloomRadius:1350, bloomDecay:50, bloomBlur:9, bloomBrightness:1.3,
        vignetteOpacity:0.88, vignetteRadius:82, vignetteFeather:35, vignetteColorLight:0.3, vignetteColorDark:0.65, reflectionOpacity:0.025, reflectionSize:1350, reflectionPositionX:50, reflectionPositionY:10, reflection:false, scanlineMask:'aperture-grille', flickerOpacity:0.05, flicker:true, colorPaletteShift:0, interlaceSpeed:0.08
      },
      'professional-monitor': { 
        // Professional business monitor: high contrast, visible scanlines, heavy noise
        scanOpacity:0.92, scanlineColor:0.02, hairlineOpacity:0.14, fringeOpacity:0.18, fringeDominant:0.6, fringeJitterSpeed:3.5, fringeJitterAmount:2.5, noiseOpacity:0.32, 
        barrel:2.6, scanSize:4.5, scanDensity:1.8, phosphorSize:1.1, phosphorOpacityRed:0.16, phosphorOpacityGreen:0.14, phosphorOpacityBlue:0.15, bloom:0.09, bloomColor:'white', bloomRadius:1300, bloomDecay:60, bloomBlur:8, bloomBrightness:1,
        vignetteOpacity:0.94, vignetteRadius:88, vignetteFeather:38, vignetteColorLight:0.4, vignetteColorDark:0.75, reflectionOpacity:0.035, reflectionSize:1300, reflectionPositionX:50, reflectionPositionY:10, reflection:false, scanlineMask:'shadow-mask', flickerOpacity:0.12, flicker:true, colorPaletteShift:0, interlaceSpeed:0.08
      },
      'monitor-1084s': { 
        // 1084S home computer monitor: warm, visible scanlines, high barrel, vibrant
        scanOpacity:0.88, scanlineColor:0.06, hairlineOpacity:0.21, fringeOpacity:0.32, fringeDominant:0.65, fringeJitterSpeed:3.8, fringeJitterAmount:3, noiseOpacity:0.35, 
        barrel:3.4, scanSize:6, scanDensity:1.6, phosphorSize:1.4, phosphorOpacityRed:0.18, phosphorOpacityGreen:0.15, phosphorOpacityBlue:0.12, bloom:0.2, bloomColor:'amber', bloomRadius:1450, bloomDecay:52, bloomBlur:12, bloomBrightness:1.4,
        vignetteOpacity:0.87, vignetteRadius:84, vignetteFeather:42, vignetteColorLight:0.32, vignetteColorDark:0.68, reflectionOpacity:0.04, reflectionSize:1450, reflectionPositionX:50, reflectionPositionY:10, reflection:false, scanlineMask:'shadow-mask', flickerOpacity:0.13, flicker:true, colorPaletteShift:15, interlaceSpeed:0.08
      },
      'studio-display-crt': { 
        // Studio Display CRT: flat, minimal effects, clean professional look
        scanOpacity:0.65, scanlineColor:0.18, hairlineOpacity:0.25, fringeOpacity:0.1, fringeDominant:0.35, fringeJitterSpeed:2.5, fringeJitterAmount:1, noiseOpacity:0.06, 
        barrel:1.1, scanSize:2.8, scanDensity:2.8, phosphorSize:0.65, phosphorOpacityRed:0.13, phosphorOpacityGreen:0.15, phosphorOpacityBlue:0.14, bloom:0.32, bloomColor:'white', bloomRadius:1250, bloomDecay:65, bloomBlur:14, bloomBrightness:1.5,
        vignetteOpacity:0.82, vignetteRadius:80, vignetteFeather:32, vignetteColorLight:0.25, vignetteColorDark:0.55, reflectionOpacity:0.02, reflectionSize:1250, reflectionPositionX:50, reflectionPositionY:10, reflection:false, scanlineMask:'sharp', flickerOpacity:0.03, flicker:false, colorPaletteShift:-5, interlaceSpeed:0.12
      },
      'arcade-crt': { 
        // Arcade Monitor: high contrast, heavy barrel, visible grain, vibrant bloom
        scanOpacity:0.95, scanlineColor:0, hairlineOpacity:0.13, fringeOpacity:0.38, fringeDominant:0.7, fringeJitterSpeed:4.2, fringeJitterAmount:3.5, noiseOpacity:0.42, 
        barrel:4.8, scanSize:7.5, scanDensity:1.3, phosphorSize:1.8, phosphorOpacityRed:0.16, phosphorOpacityGreen:0.15, phosphorOpacityBlue:0.14, bloom:0.32, bloomColor:'white', bloomRadius:1500, bloomDecay:48, bloomBlur:11, bloomBrightness:1.1,
        vignetteOpacity:0.93, vignetteRadius:87, vignetteFeather:40, vignetteColorLight:0.38, vignetteColorDark:0.72, reflectionOpacity:0.045, reflectionSize:1500, reflectionPositionX:50, reflectionPositionY:10, reflection:false, scanlineMask:'soft', flickerOpacity:0.16, flicker:true, colorPaletteShift:0, interlaceSpeed:0.08
      },
      
      // PHOSPHOR COLOR VARIANTS
      'amber-phosphor': { 
        // Monochrome amber terminal: vintage computing aesthetic
        scanOpacity:0.78, scanlineColor:0.22, hairlineOpacity:0.2, fringeOpacity:0.08, fringeDominant:0.5, fringeJitterSpeed:3, fringeJitterAmount:1.5, noiseOpacity:0.18, 
        barrel:2.1, scanSize:4, scanDensity:2, phosphorSize:0.95, phosphorOpacityRed:0.18, phosphorOpacityGreen:0.12, phosphorOpacityBlue:0.08, bloom:0.22, bloomColor:'amber', bloomRadius:1400, bloomDecay:54, bloomBlur:11, bloomBrightness:1.3,
        vignetteOpacity:0.86, vignetteRadius:84, vignetteFeather:39, vignetteColorLight:0.33, vignetteColorDark:0.66, reflectionOpacity:0.028, reflectionSize:1400, reflectionPositionX:50, reflectionPositionY:10, reflection:false, scanlineMask:'shadow-mask', flickerOpacity:0.09, flicker:true, colorPaletteShift:25, interlaceSpeed:0.08
      },
      'green-phosphor': { 
        // Monochrome green terminal: hacker aesthetic, VT220 style
        scanOpacity:0.8, scanlineColor:0.18, hairlineOpacity:0.22, fringeOpacity:0.08, fringeDominant:0.5, fringeJitterSpeed:3, fringeJitterAmount:1.5, noiseOpacity:0.2, 
        barrel:2.2, scanSize:4, scanDensity:2, phosphorSize:0.95, phosphorOpacityRed:0.08, phosphorOpacityGreen:0.18, phosphorOpacityBlue:0.08, bloom:0.2, bloomColor:'green', bloomRadius:1380, bloomDecay:56, bloomBlur:10, bloomBrightness:1.2,
        vignetteOpacity:0.88, vignetteRadius:85, vignetteFeather:40, vignetteColorLight:0.34, vignetteColorDark:0.69, reflectionOpacity:0.03, reflectionSize:1380, reflectionPositionX:50, reflectionPositionY:10, reflection:false, scanlineMask:'shadow-mask', flickerOpacity:0.08, flicker:true, colorPaletteShift:120, interlaceSpeed:0.08
      },
      'blue-phosphor': { 
        // Rare blue phosphor: uncommon but distinctive
        scanOpacity:0.76, scanlineColor:0.12, hairlineOpacity:0.19, fringeOpacity:0.1, fringeDominant:0.45, fringeJitterSpeed:2.8, fringeJitterAmount:1.5, noiseOpacity:0.16, 
        barrel:1.9, scanSize:4, scanDensity:2.1, phosphorSize:0.9, phosphorOpacityRed:0.08, phosphorOpacityGreen:0.08, phosphorOpacityBlue:0.18, bloom:0.24, bloomColor:'blue', bloomRadius:1420, bloomDecay:53, bloomBlur:11, bloomBrightness:1.35,
        vignetteOpacity:0.89, vignetteRadius:86, vignetteFeather:41, vignetteColorLight:0.36, vignetteColorDark:0.71, reflectionOpacity:0.032, reflectionSize:1420, reflectionPositionX:50, reflectionPositionY:10, reflection:false, scanlineMask:'shadow-mask', flickerOpacity:0.07, flicker:true, colorPaletteShift:-40, interlaceSpeed:0.08
      },
      
      // SPECIALIZED MONITORS
      'vt220-terminal': { 
        // DEC VT220 green-screen terminal: minimal distortion, functional aesthetic
        scanOpacity:0.82, scanlineColor:0.15, hairlineOpacity:0.24, fringeOpacity:0.05, fringeDominant:0.5, fringeJitterSpeed:2.5, fringeJitterAmount:1, noiseOpacity:0.12, 
        barrel:0.8, scanSize:3.2, scanDensity:2.5, phosphorSize:0.8, phosphorOpacityRed:0.05, phosphorOpacityGreen:0.18, phosphorOpacityBlue:0.05, bloom:0.15, bloomColor:'green', bloomRadius:1300, bloomDecay:58, bloomBlur:9, bloomBrightness:1.1,
        vignetteOpacity:0.85, vignetteRadius:83, vignetteFeather:36, vignetteColorLight:0.28, vignetteColorDark:0.6, reflectionOpacity:0.02, reflectionSize:1300, reflectionPositionX:50, reflectionPositionY:10, reflection:false, scanlineMask:'sharp', flickerOpacity:0.06, flicker:false, colorPaletteShift:120, interlaceSpeed:0.12
      },
      'lcd-handheld': { 
        // 1980s LCD handheld (Game Boy style): no scanlines, high noise, heavy barrel, monochrome green
        scanOpacity:0.5, scanlineColor:0.4, hairlineOpacity:0.35, fringeOpacity:0.02, fringeDominant:0.5, fringeJitterSpeed:4.5, fringeJitterAmount:4, noiseOpacity:0.48, 
        barrel:3.6, scanSize:2, scanDensity:1, phosphorSize:0.6, phosphorOpacityRed:0.06, phosphorOpacityGreen:0.16, phosphorOpacityBlue:0.06, bloom:0.06, bloomColor:'green', bloomRadius:1200, bloomDecay:62, bloomBlur:8, bloomBrightness:0.8,
        vignetteOpacity:0.91, vignetteRadius:81, vignetteFeather:44, vignetteColorLight:0.42, vignetteColorDark:0.78, reflectionOpacity:0.05, reflectionSize:1200, reflectionPositionX:50, reflectionPositionY:10, reflection:false, scanlineMask:'soft', flickerOpacity:0.2, flicker:true, colorPaletteShift:140, interlaceSpeed:0.12
      },
      'classic-rgb': { 
        // Classic RGB Monitor (80s-90s): warm phosphor, moderate barrel, color fringing visible
        scanOpacity:0.79, scanlineColor:0.11, hairlineOpacity:0.19, fringeOpacity:0.28, fringeDominant:0.55, fringeJitterSpeed:3.3, fringeJitterAmount:2, noiseOpacity:0.19, 
        barrel:1.5, scanSize:3.8, scanDensity:2.3, phosphorSize:1.05, phosphorOpacityRed:0.15, phosphorOpacityGreen:0.15, phosphorOpacityBlue:0.15, bloom:0.18, bloomColor:'white', bloomRadius:1380, bloomDecay:55, bloomBlur:10, bloomBrightness:1.2,
        vignetteOpacity:0.86, vignetteRadius:84, vignetteFeather:38, vignetteColorLight:0.32, vignetteColorDark:0.67, reflectionOpacity:0.03, reflectionSize:1380, reflectionPositionX:50, reflectionPositionY:10, reflection:false, scanlineMask:'shadow-mask', flickerOpacity:0.1, flicker:true, colorPaletteShift:10, interlaceSpeed:0.08
      },
      'precision-flatcrt': { 
        // Precision flat CRT: minimal distortion, clean look, slight phosphor glow
        scanOpacity:0.68, scanlineColor:0.16, hairlineOpacity:0.22, fringeOpacity:0.13, fringeDominant:0.3, fringeJitterSpeed:2.6, fringeJitterAmount:1.2, noiseOpacity:0.08, 
        barrel:1.3, scanSize:3, scanDensity:2.6, phosphorSize:0.8, phosphorOpacityRed:0.12, phosphorOpacityGreen:0.13, phosphorOpacityBlue:0.12, bloom:0.28, bloomColor:'white', bloomRadius:1320, bloomDecay:60, bloomBlur:13, bloomBrightness:1.4,
        vignetteOpacity:0.83, vignetteRadius:79, vignetteFeather:30, vignetteColorLight:0.22, vignetteColorDark:0.5, reflectionOpacity:0.015, reflectionSize:1320, reflectionPositionX:50, reflectionPositionY:10, reflection:false, scanlineMask:'sharp', flickerOpacity:0.04, flicker:false, colorPaletteShift:-10, interlaceSpeed:0.12
      },
      'retro-studio': { 
        // Retro studio aesthetic: high barrel, visible scanlines, pleasant bloom, warm white
        scanOpacity:0.84, scanlineColor:0.04, hairlineOpacity:0.17, fringeOpacity:0.22, fringeDominant:0.52, fringeJitterSpeed:3.2, fringeJitterAmount:2, noiseOpacity:0.24, 
        barrel:2.4, scanSize:4.2, scanDensity:2, phosphorSize:1.08, phosphorOpacityRed:0.15, phosphorOpacityGreen:0.15, phosphorOpacityBlue:0.15, bloom:0.2, bloomColor:'white', bloomRadius:1400, bloomDecay:54, bloomBlur:10, bloomBrightness:1.25,
        vignetteOpacity:0.89, vignetteRadius:86, vignetteFeather:41, vignetteColorLight:0.35, vignetteColorDark:0.7, reflectionOpacity:0.032, reflectionSize:1400, reflectionPositionX:50, reflectionPositionY:10, reflection:false, scanlineMask:'shadow-mask', flickerOpacity:0.11, flicker:true, colorPaletteShift:5, interlaceSpeed:0.08
      },
      
      // PROFESSIONAL & BROADCAST
      'broadcast-monitor': { 
        // Professional broadcast monitor: accurate colors, minimal distortion, high quality
        scanOpacity:0.7, scanlineColor:0.12, hairlineOpacity:0.2, fringeOpacity:0.08, fringeDominant:0.45, fringeJitterSpeed:2.7, fringeJitterAmount:1, noiseOpacity:0.08, 
        barrel:1.2, scanSize:3, scanDensity:2.5, phosphorSize:0.85, phosphorOpacityRed:0.14, phosphorOpacityGreen:0.15, phosphorOpacityBlue:0.14, bloom:0.26, bloomColor:'white', bloomRadius:1280, bloomDecay:58, bloomBlur:12, bloomBrightness:1.35,
        vignetteOpacity:0.84, vignetteRadius:81, vignetteFeather:34, vignetteColorLight:0.26, vignetteColorDark:0.58, reflectionOpacity:0.022, reflectionSize:1280, reflectionPositionX:50, reflectionPositionY:10, reflection:false, scanlineMask:'sharp', flickerOpacity:0.04, flicker:false, colorPaletteShift:-3, interlaceSpeed:0.12
      },
      'rgb-professional': { 
        // RGB professional video monitor: pristine image quality, aperture grille
        scanOpacity:0.68, scanlineColor:0.15, hairlineOpacity:0.18, fringeOpacity:0.06, fringeDominant:0.38, fringeJitterSpeed:2.5, fringeJitterAmount:0.8, noiseOpacity:0.05, 
        barrel:0.9, scanSize:2.8, scanDensity:2.7, phosphorSize:0.75, phosphorOpacityRed:0.13, phosphorOpacityGreen:0.15, phosphorOpacityBlue:0.13, bloom:0.3, bloomColor:'white', bloomRadius:1220, bloomDecay:62, bloomBlur:13, bloomBrightness:1.4,
        vignetteOpacity:0.81, vignetteRadius:78, vignetteFeather:30, vignetteColorLight:0.23, vignetteColorDark:0.52, reflectionOpacity:0.018, reflectionSize:1220, reflectionPositionX:50, reflectionPositionY:10, reflection:false, scanlineMask:'aperture-grille', flickerOpacity:0.03, flicker:false, colorPaletteShift:-8, interlaceSpeed:0.12
      },
      'phosphor-white': { 
        // White phosphor monochrome terminal: crisp high-contrast display
        scanOpacity:0.75, scanlineColor:0.2, hairlineOpacity:0.23, fringeOpacity:0.05, fringeDominant:0.5, fringeJitterSpeed:2.8, fringeJitterAmount:1.2, noiseOpacity:0.14, 
        barrel:1.8, scanSize:3.8, scanDensity:2.2, phosphorSize:0.9, phosphorOpacityRed:0.16, phosphorOpacityGreen:0.16, phosphorOpacityBlue:0.16, bloom:0.18, bloomColor:'white', bloomRadius:1350, bloomDecay:56, bloomBlur:10, bloomBrightness:1.25,
        vignetteOpacity:0.87, vignetteRadius:83, vignetteFeather:37, vignetteColorLight:0.31, vignetteColorDark:0.64, reflectionOpacity:0.026, reflectionSize:1350, reflectionPositionX:50, reflectionPositionY:10, reflection:false, scanlineMask:'sharp', flickerOpacity:0.07, flicker:true, colorPaletteShift:0, interlaceSpeed:0.08
      },
      'composite-color': { 
        // Composite color with artifacts: color bleeding, visible artifacts
        scanOpacity:0.9, scanlineColor:0.05, hairlineOpacity:0.16, fringeOpacity:0.42, fringeDominant:0.68, fringeJitterSpeed:3.9, fringeJitterAmount:3.2, noiseOpacity:0.38, 
        barrel:3.2, scanSize:5.5, scanDensity:1.7, phosphorSize:1.3, phosphorOpacityRed:0.17, phosphorOpacityGreen:0.14, phosphorOpacityBlue:0.16, bloom:0.12, bloomColor:'amber', bloomRadius:1420, bloomDecay:58, bloomBlur:9, bloomBrightness:1.05,
        vignetteOpacity:0.92, vignetteRadius:87, vignetteFeather:40, vignetteColorLight:0.37, vignetteColorDark:0.74, reflectionOpacity:0.038, reflectionSize:1420, reflectionPositionX:50, reflectionPositionY:10, reflection:false, scanlineMask:'shadow-mask', flickerOpacity:0.14, flicker:true, colorPaletteShift:20, interlaceSpeed:0.08
      },
      'plasma-display': { 
        // Early 2000s plasma display: unique phosphor glow, no scanlines
        scanOpacity:0.4, scanlineColor:0.5, hairlineOpacity:0.08, fringeOpacity:0.15, fringeDominant:0.48, fringeJitterSpeed:3.5, fringeJitterAmount:1.8, noiseOpacity:0.12, 
        barrel:0.5, scanSize:2, scanDensity:3, phosphorSize:0.7, phosphorOpacityRed:0.16, phosphorOpacityGreen:0.14, phosphorOpacityBlue:0.15, bloom:0.35, bloomColor:'white', bloomRadius:1600, bloomDecay:45, bloomBlur:16, bloomBrightness:1.6,
        vignetteOpacity:0.78, vignetteRadius:88, vignetteFeather:38, vignetteColorLight:0.28, vignetteColorDark:0.62, reflectionOpacity:0.05, reflectionSize:1600, reflectionPositionX:50, reflectionPositionY:10, reflection:false, scanlineMask:'soft', flickerOpacity:0.06, flicker:false, colorPaletteShift:-15, interlaceSpeed:0.12
      },
      'vector-display': { 
        // Vector monitor (Asteroids/Vectrex): bright phosphor trails, minimal structure
        scanOpacity:0.3, scanlineColor:0.6, hairlineOpacity:0.05, fringeOpacity:0.05, fringeDominant:0.5, fringeJitterSpeed:2.2, fringeJitterAmount:0.5, noiseOpacity:0.08, 
        barrel:1.6, scanSize:2, scanDensity:1, phosphorSize:0.5, phosphorOpacityRed:0.08, phosphorOpacityGreen:0.18, phosphorOpacityBlue:0.1, bloom:0.45, bloomColor:'green', bloomRadius:1800, bloomDecay:35, bloomBlur:18, bloomBrightness:1.8,
        vignetteOpacity:0.88, vignetteRadius:86, vignetteFeather:45, vignetteColorLight:0.38, vignetteColorDark:0.76, reflectionOpacity:0.02, reflectionSize:1800, reflectionPositionX:50, reflectionPositionY:10, reflection:false, scanlineMask:'soft', flickerOpacity:0.05, flicker:false, colorPaletteShift:130, interlaceSpeed:0.12
      }
    };
    return presets[name];
  }

  applyPreset(preset){
    Object.assign(this.config, preset);

    Object.entries(preset).forEach(([key, value]) => {
      const attrName = key.replace(/([A-Z])/g,'-$1').toLowerCase();
      this.setAttribute(attrName, String(value));
    });

    const root = this.controlsPortal || this.shadowRoot;
    const formatter = (key, val) => {
      const oneDec = ['barrel','scanSize','scanDensity','phosphorSize'];
      return typeof val === 'string' ? val : val.toFixed(oneDec.includes(key) ? 1 : 2);
    };

    const controls = {
      scanOpacity: 'ctl-scan',
      scanlineColor: 'ctl-scanline-color',
      hairlineOpacity: 'ctl-hairline',
      fringeOpacity: 'ctl-fringe',
      fringeDominant: 'ctl-fringe-dominant',
      fringeJitterSpeed: 'ctl-fringe-jitter-speed',
      fringeJitterAmount: 'ctl-fringe-jitter-amount',
      noiseOpacity: 'ctl-noise',
      barrel: 'ctl-barrel',
      scanSize: 'ctl-scan-size',
      scanDensity: 'ctl-scan-density',
      phosphorSize: 'ctl-phosphor',
      phosphorOpacityRed: 'ctl-phosphor-red',
      phosphorOpacityGreen: 'ctl-phosphor-green',
      phosphorOpacityBlue: 'ctl-phosphor-blue',
      bloom: 'ctl-bloom',
      bloomRadius: 'ctl-bloom-radius',
      bloomDecay: 'ctl-bloom-decay',
      bloomBlur: 'ctl-bloom-blur',
      bloomBrightness: 'ctl-bloom-brightness',
      vignetteOpacity: 'ctl-vignette',
      vignetteRadius: 'ctl-vignette-radius',
      vignetteFeather: 'ctl-vignette-feather',
      vignetteColorLight: 'ctl-vignette-color-light',
      vignetteColorDark: 'ctl-vignette-color-dark',
      reflectionSize: 'ctl-reflection-size',
      reflectionOpacity: 'ctl-reflection-opacity',
      colorPaletteShift: 'ctl-color-palette-shift',
      interlaceSpeed: 'ctl-interlace-speed',
      flickerOpacity: 'ctl-flicker-opacity'
    };

    Object.entries(controls).forEach(([configKey, className]) => {
      const input = root.querySelector(`.${className}`);
      const numberInput = root.querySelector(`.${className}-number`);
      const valueDisplay = root.querySelector(`.val-${className.replace('ctl-','')}`);
      if (input && preset[configKey] !== undefined) {
        input.value = preset[configKey];
      }
      if (numberInput && preset[configKey] !== undefined) {
        const decimals = formatter(configKey, preset[configKey]).split('.')[1]?.length || 0;
        numberInput.value = Number(preset[configKey]).toFixed(decimals);
      }
      if (valueDisplay && preset[configKey] !== undefined) {
        valueDisplay.textContent = formatter(configKey, preset[configKey]);
      }
    });

    // Update bloom color selector
    const bloomColorSelect = root.querySelector('.ctl-bloom-color');
    if (bloomColorSelect && preset.bloomColor) {
      bloomColorSelect.value = preset.bloomColor;
    }

    // Update scanline mask selector
    const scanlineMaskSelect = root.querySelector('.ctl-scanline-mask');
    if (scanlineMaskSelect && preset.scanlineMask) {
      scanlineMaskSelect.value = preset.scanlineMask;
    }

    // Update reflection checkbox
    const reflectionCheckbox = root.querySelector('.ctl-reflection');
    if (reflectionCheckbox && preset.reflection !== undefined) {
      reflectionCheckbox.checked = preset.reflection;
    }

    // Update flicker checkbox
    const flickerCheckbox = root.querySelector('.ctl-flicker');
    if (flickerCheckbox && preset.flicker !== undefined) {
      flickerCheckbox.checked = preset.flicker;
    }

    this.updateStyles();
    this.updateBarrel();
  }

  get _uid() { 
    if (!this.__uid) {
      this.__uid = Math.random().toString(36).substr(2, 9); 
    }
    return this.__uid; 
  }
  
  getBarrelFilterId() { 
    return `crt-barrel-${this._uid}`; 
  }
  
  updateConfig(cfg) { 
    Object.entries(cfg).forEach(([k, v]) => { 
      const attr = k.replace(/([A-Z])/g, '-$1').toLowerCase(); 
      this.setAttribute(attr, v); 
    }); 
  }
}

if (!customElements.get('crt-overlay')) customElements.define('crt-overlay', CRTOverlay);

export default CRTOverlay;
