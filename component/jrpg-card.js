/**
 * JRPG Card Component
 * A Web Component for displaying content cards with JRPG styling
 * featuring ornate borders, themes, and interactive effects.
 */

import { getDialogTheme } from './themes.js';

class JrpgCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  static get observedAttributes() {
    return ['title', 'width', 'height', 'primary-color', 'secondary-color', 'accent-color', 'theme'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  render() {
    const title = this.getAttribute('title') || '';
    const width = this.getAttribute('width') || '300px';
    const height = this.getAttribute('height') || 'auto';
    const theme = this.getAttribute('theme') || 'sharp';
    const primaryColor = this.getAttribute('primary-color') || '#2a4a7a';
    const secondaryColor = this.getAttribute('secondary-color') || '#1a2a4a';
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
          font-size: 14px;
          color: #ffffff;
          margin: 10px;
        }

        .card-container {
          position: relative;
          width: ${width};
          ${height !== 'auto' ? `height: ${height};` : ''}
          min-height: 100px;
          background: linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 100%);
          border-radius: ${borderRadius};
          box-shadow: ${boxShadow};
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
        }

        .card-container:hover {
          transform: translateY(-2px);
          box-shadow:
            0 0 0 3px ${accentColor},
            inset 0 0 0 2px rgba(255, 255, 255, 0.2),
            0 8px 16px rgba(0, 0, 0, 0.8);
        }

        .card-header {
          background: linear-gradient(90deg, ${accentColor} 0%, ${primaryColor} 100%);
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          font-weight: bold;
          font-size: 16px;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        }

        .card-content {
          padding: 16px;
          ${height === 'auto' ? '' : 'height: calc(100% - 60px); overflow-y: auto;'}
        }

        .card-footer {
          background: rgba(0, 0, 0, 0.2);
          padding: 8px 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 12px;
          opacity: 0.8;
        }

        /* Decorative elements */
        .card-decoration {
          position: absolute;
          pointer-events: none;
        }

        .decoration-tl {
          top: 4px;
          left: 4px;
          width: 16px;
          height: 16px;
          background: ${cornerDecoration};
        }

        .decoration-tr {
          top: 4px;
          right: 4px;
          width: 16px;
          height: 16px;
          background: ${cornerDecoration};
          transform: scaleX(-1);
        }

        .decoration-bl {
          bottom: 4px;
          left: 4px;
          width: 16px;
          height: 16px;
          background: ${cornerDecoration};
          transform: scaleY(-1);
        }

        .decoration-br {
          bottom: 4px;
          right: 4px;
          width: 16px;
          height: 16px;
          background: ${cornerDecoration};
          transform: scale(-1, -1);
        }

        .inner-border {
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

      <div class="card-container">
        <div class="card-decoration decoration-tl"></div>
        <div class="card-decoration decoration-tr"></div>
        <div class="card-decoration decoration-bl"></div>
        <div class="card-decoration decoration-br"></div>
        <div class="inner-border"></div>

        ${title ? `<div class="card-header">${title}</div>` : ''}

        <div class="card-content">
          <slot></slot>
        </div>

        <slot name="footer">
          <div class="card-footer">
            <slot name="footer-content">Card Footer</slot>
          </div>
        </slot>
      </div>
    `;

    // Add click handler
    const card = this.shadowRoot.querySelector('.card-container');
    card.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('jrpg-card-click', {
        bubbles: true,
        composed: true,
        detail: { card: this }
      }));
    });
  }
}

customElements.define('jrpg-card', JrpgCard);