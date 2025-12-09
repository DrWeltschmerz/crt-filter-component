/**
 * JRPG Button Component
 * A Web Component for interactive buttons with classic JRPG styling
 * featuring embossed effects and hover animations.
 */

import { getTheme, themes } from './themes.js';

class JrpgButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  static get observedAttributes() {
    return ['disabled', 'variant', 'size', 'primary-color', 'secondary-color', 'accent-color', 'theme', 'active'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  connectedCallback() {
    this.addEventListener('click', this.handleClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.handleClick);
  }

  adjustColor(color, amount, mixColor = null) {
    // Simple color adjustment - darken/lighten and optionally mix
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    let newR = Math.max(0, Math.min(255, Math.round(r + (r * amount))));
    let newG = Math.max(0, Math.min(255, Math.round(g + (g * amount))));
    let newB = Math.max(0, Math.min(255, Math.round(b + (b * amount))));

    if (mixColor) {
      const mixHex = mixColor.replace('#', '');
      const mixR = parseInt(mixHex.substr(0, 2), 16);
      const mixG = parseInt(mixHex.substr(2, 2), 16);
      const mixB = parseInt(mixHex.substr(4, 2), 16);

      // Simple 50/50 mix
      newR = Math.round((newR + mixR) / 2);
      newG = Math.round((newG + mixG) / 2);
      newB = Math.round((newB + mixB) / 2);
    }

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  handleClick = (event) => {
    if (this.hasAttribute('disabled')) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // Add pressed effect
    const button = this.shadowRoot.querySelector('.button');
    button.classList.add('pressed');

    setTimeout(() => {
      button.classList.remove('pressed');
    }, 150);

    // Dispatch custom event
    this.dispatchEvent(new CustomEvent('jrpg-click', {
      bubbles: true,
      composed: true,
      detail: { originalEvent: event }
    }));
  };

  render() {
    const disabled = this.hasAttribute('disabled');
    const active = this.hasAttribute('active');
    const variant = this.getAttribute('variant') || 'primary'; // primary, secondary, danger
    const size = this.getAttribute('size') || 'medium'; // small, medium, large
    const theme = this.getAttribute('theme') || 'sharp';
    const accentColor = this.getAttribute('accent-color') || '#ffd700';

    // Get theme properties
    const themeData = getTheme(theme, accentColor);
    const borderRadius = themeData.borderRadius;
    const cornerDecoration = themeData.cornerDecoration;
    const innerPattern = themeData.innerPattern;
    const boxShadow = themeData.boxShadow;
    const fontFamily = themeData.fontFamily;

    // Get button colors from theme
    const buttonColors = themes[theme]?.button || themes.sharp.button;
    let buttonPrimary = buttonColors.primary;
    let buttonSecondary = buttonColors.secondary;
    let buttonAccent = buttonColors.accent;

    if (variant === 'secondary') {
      // Use muted/darker versions of the theme colors
      buttonPrimary = this.adjustColor(buttonColors.primary, -0.3);
      buttonSecondary = this.adjustColor(buttonColors.secondary, -0.3);
      buttonAccent = this.adjustColor(buttonColors.accent, -0.2);
    } else if (variant === 'danger') {
      // Use red-tinted versions based on accent color
      buttonPrimary = this.adjustColor(buttonColors.primary, -0.2, '#8a4a4a');
      buttonSecondary = this.adjustColor(buttonColors.secondary, -0.2, '#5a2a2a');
      buttonAccent = '#ff6b6b'; // Keep danger accent as red
    }

    // Size properties
    let padding = '8px 16px';
    let fontSize = '12px';
    let minWidth = '80px';

    if (size === 'small') {
      padding = '6px 12px';
      fontSize = '11px';
      minWidth = '60px';
    } else if (size === 'large') {
      padding = '12px 24px';
      fontSize = '14px';
      minWidth = '120px';
    }

    const buttonContent = this.textContent || 'Button';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          font-family: ${fontFamily};
          margin: 4px;
        }

        .button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: ${minWidth};
          padding: ${padding};
          font-size: ${fontSize};
          font-weight: bold;
          color: #ffffff;
          background: linear-gradient(135deg, ${buttonSecondary} 0%, ${buttonPrimary} 100%);
          border: 2px solid ${buttonAccent};
          border-radius: ${borderRadius};
          cursor: ${disabled ? 'not-allowed' : 'pointer'};
          transition: all 0.15s ease;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
          box-shadow: ${boxShadow};
          user-select: none;
          ${disabled ? 'opacity: 0.5;' : ''}
        }

        .button:hover {
          ${!disabled ? `
            background: linear-gradient(135deg, ${buttonPrimary} 0%, ${buttonSecondary} 100%);
            transform: translateY(-1px);
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.3),
              inset 0 -1px 0 rgba(0, 0, 0, 0.2),
              0 4px 8px rgba(0, 0, 0, 0.4);
          ` : ''}
        }

        .button:active,
        .button.pressed {
          transform: translateY(0);
          box-shadow:
            inset 0 -1px 0 rgba(255, 255, 255, 0.2),
            inset 0 1px 0 rgba(0, 0, 0, 0.3),
            0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .button:focus {
          outline: none;
          border-color: ${accentColor};
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            inset 0 -1px 0 rgba(0, 0, 0, 0.3),
            0 2px 4px rgba(0, 0, 0, 0.3),
            0 0 0 2px rgba(255, 215, 0, 0.3);
        }

        .button.active {
          background: linear-gradient(135deg, ${buttonPrimary} 0%, ${buttonSecondary} 100%);
          border-color: #ffffff;
          color: #ffffff;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            inset 0 -1px 0 rgba(0, 0, 0, 0.2),
            0 4px 8px rgba(0, 0, 0, 0.4),
            0 0 0 4px rgba(255, 255, 255, 0.3);
        }

        /* Decorative elements */
        .button-decoration {
          position: absolute;
          pointer-events: none;
        }

        .decoration-tl {
          top: 2px;
          left: 2px;
          width: 4px;
          height: 4px;
          background: ${cornerDecoration};
        }

        .decoration-tr {
          top: 2px;
          right: 2px;
          width: 4px;
          height: 4px;
          background: ${cornerDecoration};
          transform: scaleX(-1);
        }

        .decoration-bl {
          bottom: 2px;
          left: 2px;
          width: 4px;
          height: 4px;
          background: ${cornerDecoration};
          transform: scaleY(-1);
        }

        .decoration-br {
          bottom: 2px;
          right: 2px;
          width: 4px;
          height: 4px;
          background: ${cornerDecoration};
          transform: scale(-1, -1);
        }

        /* Inner highlight */
        .inner-highlight {
          position: absolute;
          top: 3px;
          left: 3px;
          right: 3px;
          bottom: 3px;
          border-radius: 2px;
          background: ${innerPattern};
          pointer-events: none;
        }

        .button.pressed .inner-highlight {
          background: linear-gradient(
            135deg,
            rgba(0, 0, 0, 0.2) 0%,
            transparent 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
        }

        /* Ripple effect */
        .ripple {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: scale(0);
          animation: ripple 0.6s linear;
          pointer-events: none;
        }

        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      </style>

      <button class="button ${active ? 'active' : ''}" ${disabled ? 'disabled' : ''}>
        <div class="button-decoration decoration-tl"></div>
        <div class="button-decoration decoration-tr"></div>
        <div class="button-decoration decoration-bl"></div>
        <div class="button-decoration decoration-br"></div>
        <div class="inner-highlight"></div>
        <span class="button-text">${buttonContent}</span>
      </button>
    `;

    // Add ripple effect on click
    const button = this.shadowRoot.querySelector('.button');
    button.addEventListener('click', (e) => {
      if (disabled) return;

      const ripple = document.createElement('div');
      ripple.className = 'ripple';
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      button.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  }
}

customElements.define('jrpg-button', JrpgButton);