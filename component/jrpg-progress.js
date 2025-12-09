/**
 * JRPG Progress Component
 * A Web Component for progress bars with classic JRPG styling
 * featuring animated fills and theme-aware colors.
 */

import { getTheme, themes } from './themes.js';

class JrpgProgress extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  static get observedAttributes() {
    return ['value', 'max', 'theme', 'primary-color', 'secondary-color', 'accent-color', 'label', 'animated', 'size'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  connectedCallback() {
    // Animate on value changes
    if (this.hasAttribute('animated')) {
      this.animateProgress();
    }
  }

  animateProgress() {
    const bar = this.shadowRoot.querySelector('.progress-fill');
    if (bar) {
      const value = parseFloat(this.getAttribute('value') || 0);
      const max = parseFloat(this.getAttribute('max') || 100);
      const percentage = Math.min(100, Math.max(0, (value / max) * 100));

      bar.style.transition = 'width 0.8s ease-out';
      bar.style.width = percentage + '%';
    }
  }

  render() {
    const value = parseFloat(this.getAttribute('value') || 0);
    const max = parseFloat(this.getAttribute('max') || 100);
    const theme = this.getAttribute('theme') || 'sharp';
    const accentColor = this.getAttribute('accent-color') || '#ffd700';
    const label = this.getAttribute('label') || '';
    const size = this.getAttribute('size') || 'medium'; // small, medium, large

    // Get theme properties
    const themeData = getTheme(theme, accentColor);
    const borderRadius = themeData.borderRadius;
    const cornerDecoration = themeData.cornerDecoration;
    const innerPattern = themeData.innerPattern;
    const boxShadow = themeData.boxShadow;
    const fontFamily = themeData.fontFamily;

    // Get progress colors from theme
    const progressColors = themes[theme]?.progress || themes.sharp.progress;
    let progressPrimary = progressColors.primary;
    let progressSecondary = progressColors.secondary;
    let progressAccent = progressColors.accent;

    // Calculate percentage
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    // Size properties
    let height = '20px';
    let fontSize = '11px';
    let padding = '2px';

    if (size === 'small') {
      height = '16px';
      fontSize = '10px';
      padding = '1px';
    } else if (size === 'large') {
      height = '28px';
      fontSize = '13px';
      padding = '4px';
    }

    const progressContent = `
      <div class="progress-container">
        <div class="progress-background">
          <div class="progress-decoration progress-decoration-left"></div>
          <div class="progress-decoration progress-decoration-right"></div>
          <div class="progress-fill" style="width: ${percentage}%"></div>
          <div class="progress-inner-highlight"></div>
        </div>
        ${label ? `<div class="progress-label">${label}</div>` : ''}
        <div class="progress-text">${Math.round(value)}/${Math.round(max)}</div>
      </div>
    `;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: ${fontFamily};
          margin: ${label ? '32px 0 8px 0' : '8px 0'};
        }

        .progress-container {
          position: relative;
          width: 100%;
        }

        .progress-background {
          position: relative;
          width: 100%;
          height: ${height};
          background: linear-gradient(135deg, ${progressSecondary} 0%, ${progressPrimary} 100%);
          border: 2px solid ${progressAccent};
          border-radius: ${borderRadius};
          box-shadow: ${boxShadow};
          overflow: hidden;
        }

        .progress-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(90deg, ${progressAccent} 0%, ${this.adjustColor(progressAccent, 0.2)} 100%);
          border-radius: ${borderRadius};
          transition: width 0.3s ease;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .progress-decoration {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          background: ${cornerDecoration};
        }

        .progress-decoration-left {
          left: 4px;
        }

        .progress-decoration-right {
          right: 4px;
        }

        .progress-inner-highlight {
          position: absolute;
          top: 2px;
          left: 2px;
          right: 2px;
          bottom: 2px;
          border-radius: 2px;
          background: ${innerPattern};
          pointer-events: none;
        }

        .progress-label {
          position: absolute;
          top: -20px;
          left: 0;
          font-size: ${fontSize};
          font-weight: bold;
          color: #ffffff;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
          pointer-events: none;
        }

        .progress-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: ${fontSize};
          font-weight: bold;
          color: #ffffff;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
          pointer-events: none;
          z-index: 1;
        }

        /* Low health warning */
        :host([value]:is([value="0"], [value="1"], [value="2"], [value="3"], [value="4"], [value="5"], [value="6"], [value="7"], [value="8"], [value="9"], [value="10"], [value="11"], [value="12"], [value="13"], [value="14"], [value="15"], [value="16"], [value="17"], [value="18"], [value="19"], [value="20"])) .progress-fill {
          background: linear-gradient(90deg, #ff4444 0%, #cc2222 100%);
        }

        /* Critical health flash */
        :host([value]:is([value="0"], [value="1"], [value="2"], [value="3"], [value="4"], [value="5"])) .progress-background {
          animation: critical-flash 0.5s infinite alternate;
        }

        @keyframes critical-flash {
          0% { border-color: #ff4444; }
          100% { border-color: #ff8888; }
        }
      </style>

      ${progressContent}
    `;

    // Trigger animation if animated
    if (this.hasAttribute('animated')) {
      setTimeout(() => this.animateProgress(), 50);
    }
  }

  adjustColor(color, amount) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const newR = Math.max(0, Math.min(255, Math.round(r + (r * amount))));
    const newG = Math.max(0, Math.min(255, Math.round(g + (g * amount))));
    const newB = Math.max(0, Math.min(255, Math.round(b + (b * amount))));

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
}

customElements.define('jrpg-progress', JrpgProgress);