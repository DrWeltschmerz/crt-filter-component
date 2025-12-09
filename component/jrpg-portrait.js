/**
 * JRPG Character Portrait Component
 * A Web Component for displaying character portraits with ornate frames
 * inspired by classic JRPG character selection screens.
 */

import { getDialogTheme } from './themes.js';

class JrpgPortrait extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  static get observedAttributes() {
    return ['src', 'name', 'level', 'hp', 'mp', 'size', 'frame-color', 'accent-color', 'theme'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  render() {
    const src = this.getAttribute('src') || '';
    const name = this.getAttribute('name') || '';
    const level = this.getAttribute('level') || '';
    const hp = this.getAttribute('hp') || '';
    const mp = this.getAttribute('mp') || '';
    const size = this.getAttribute('size') || '120px';
    const theme = this.getAttribute('theme') || 'ff7';
    const frameColor = this.getAttribute('frame-color') || '#8b4513';
    const accentColor = this.getAttribute('accent-color') || '#ffd700';

    // Get theme properties
    const themeData = getDialogTheme(theme, accentColor);
    const borderRadius = themeData.borderRadius;
    const cornerDecoration = themeData.cornerDecoration;
    const innerPattern = themeData.innerPattern;
    const boxShadow = themeData.boxShadow;
    const fontFamily = themeData.fontFamily;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: ${fontFamily};
          font-size: 11px;
          color: #ffffff;
          margin: 10px;
        }

        .portrait-container {
          position: relative;
          width: ${size};
          height: ${size};
          background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
          border-radius: ${borderRadius};
          overflow: hidden;
          box-shadow: ${boxShadow};
        }

        .portrait-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          ${src ? `background: url('${src}') center/cover no-repeat;` : ''}
        }

        .portrait-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent 0%, rgba(0, 0, 0, 0.8) 100%);
          padding: 8px;
          text-align: center;
        }

        .character-name {
          font-weight: bold;
          color: ${accentColor};
          font-size: 12px;
          margin-bottom: 2px;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        }

        .character-stats {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          opacity: 0.9;
        }

        .stat-hp {
          color: #ff6b6b;
        }

        .stat-mp {
          color: #4ecdc4;
        }

        .level-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          background: ${accentColor};
          color: #000;
          font-size: 10px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 10px;
          text-shadow: none;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        /* Ornate frame decorations */
        .frame-decoration {
          position: absolute;
          pointer-events: none;
        }

        .decoration-tl {
          top: -2px;
          left: -2px;
          width: 8px;
          height: 8px;
          background: ${cornerDecoration};
        }

        .decoration-tr {
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background: ${cornerDecoration};
          transform: scaleX(-1);
        }

        .decoration-bl {
          bottom: -2px;
          left: -2px;
          width: 8px;
          height: 8px;
          background: ${cornerDecoration};
          transform: scaleY(-1);
        }

        .decoration-br {
          bottom: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background: ${cornerDecoration};
          transform: scale(-1, -1);
        }

        /* Inner frame pattern */
        .inner-frame {
          position: absolute;
          top: 6px;
          left: 6px;
          right: 6px;
          bottom: 6px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          background: ${innerPattern};
        }

        /* Selection indicator */
        .selection-ring {
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          border: 2px solid ${accentColor};
          border-radius: 10px;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        :host(.selected) .selection-ring {
          opacity: 1;
        }

        :host(.selected) .portrait-container {
          box-shadow:
            0 0 0 3px ${accentColor},
            0 0 0 6px rgba(255, 215, 0, 0.3),
            inset 0 0 0 1px rgba(255, 255, 255, 0.1),
            0 4px 8px rgba(0, 0, 0, 0.5);
        }
      </style>

      <div class="portrait-container">
        <div class="frame-decoration decoration-tl"></div>
        <div class="frame-decoration decoration-tr"></div>
        <div class="frame-decoration decoration-bl"></div>
        <div class="frame-decoration decoration-br"></div>
        <div class="inner-frame"></div>

        <div class="portrait-image"></div>

        ${level ? `<div class="level-badge">Lv.${level}</div>` : ''}

        <div class="portrait-overlay">
          ${name ? `<div class="character-name">${name}</div>` : ''}
          ${(hp || mp) ? `
            <div class="character-stats">
              ${hp ? `<span class="stat-hp">HP:${hp}</span>` : ''}
              ${mp ? `<span class="stat-mp">MP:${mp}</span>` : ''}
            </div>
          ` : ''}
        </div>

        <div class="selection-ring"></div>
      </div>
    `;
  }
}

customElements.define('jrpg-portrait', JrpgPortrait);