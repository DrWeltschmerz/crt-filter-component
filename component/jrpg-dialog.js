/**
 * JRPG Dialog Box Component
 * A Web Component that creates ornate dialog/message boxes inspired by classic JRPGs
 * like Final Fantasy VII/IX and PS2 era games.
 *
 * Features:
 * - SVG-based ornate borders and decorations
 * - Gradient backgrounds
 * - Customizable colors and styling
 * - Auto-sizing text content
 * - Optional speaker name display
 */

import { getDialogTheme } from './themes.js';

class JrpgDialog extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  static get observedAttributes() {
    return ['speaker', 'text', 'width', 'height', 'primary-color', 'secondary-color', 'accent-color', 'theme'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  render() {
    const speaker = this.getAttribute('speaker') || '';
    const text = this.getAttribute('text') || this.textContent || '';
    const width = this.getAttribute('width') || '400px';
    const height = this.getAttribute('height') || 'auto';
    const primaryColor = this.getAttribute('primary-color') || '#2a4a7a';
    const secondaryColor = this.getAttribute('secondary-color') || '#1a2a4a';
    const accentColor = this.getAttribute('accent-color') || '#ffd700';
    const theme = this.getAttribute('theme') || 'ff7';

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
          font-family: 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.4;
          color: #ffffff;
          margin: 10px;
        }

        .dialog-container {
          position: relative;
          width: ${width};
          ${height !== 'auto' ? `height: ${height};` : ''}
          min-height: 80px;
          background: linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 100%);
          border-radius: ${borderRadius};
          box-shadow: ${boxShadow};
          overflow: hidden;
        }

        .dialog-border {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .dialog-content {
          position: relative;
          z-index: 2;
          padding: 20px;
          ${height === 'auto' ? '' : 'height: 100%;'}
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .speaker-name {
          font-weight: bold;
          color: ${accentColor};
          margin-bottom: 8px;
          font-size: 16px;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
          font-family: ${fontFamily};
        }

        .dialog-text {
          flex: 1;
          text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.8);
          word-wrap: break-word;
          overflow-wrap: break-word;
          font-family: ${fontFamily};
        }

        /* Ornate corner decorations */
        .corner-decoration {
          position: absolute;
          width: 20px;
          height: 20px;
        }

        .corner-tl {
          top: 4px;
          left: 4px;
          background: ${cornerDecoration};
        }

        .corner-tr {
          top: 4px;
          right: 4px;
          background: ${cornerDecoration};
          transform: scaleX(-1);
        }

        .corner-bl {
          bottom: 4px;
          left: 4px;
          background: ${cornerDecoration};
          transform: scaleY(-1);
        }

        .corner-br {
          bottom: 4px;
          right: 4px;
          background: ${cornerDecoration};
          transform: scale(-1, -1);
        }

        /* Inner border pattern */
        .inner-pattern {
          position: absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          bottom: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          background: ${innerPattern};
        }
      </style>

      <div class="dialog-container">
        <div class="dialog-border">
          <div class="corner-decoration corner-tl"></div>
          <div class="corner-decoration corner-tr"></div>
          <div class="corner-decoration corner-bl"></div>
          <div class="corner-decoration corner-br"></div>
          <div class="inner-pattern"></div>
        </div>

        <div class="dialog-content">
          ${speaker ? `<div class="speaker-name">${speaker}</div>` : ''}
          <div class="dialog-text">${text}</div>
        </div>
      </div>
    `;
  }
}

customElements.define('jrpg-dialog', JrpgDialog);