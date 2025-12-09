/**
 * JRPG Menu Window Component
 * A Web Component for displaying menu options, character stats, or inventory
 * with classic JRPG styling and grid layouts.
 */

import { getDialogTheme } from './themes.js';

class JrpgMenu extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  static get observedAttributes() {
    return ['title', 'width', 'height', 'columns', 'primary-color', 'secondary-color', 'accent-color', 'theme'];
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
    const columns = parseInt(this.getAttribute('columns')) || 1;
    const theme = this.getAttribute('theme') || 'ff7';
    const primaryColor = this.getAttribute('primary-color') || '#4a2a1a';
    const secondaryColor = this.getAttribute('secondary-color') || '#2a1a0a';
    const accentColor = this.getAttribute('accent-color') || '#daa520';

    // Get theme properties
    const themeData = getDialogTheme(theme, accentColor);
    const borderRadius = themeData.borderRadius;
    const cornerDecoration = themeData.cornerDecoration;
    const innerPattern = themeData.innerPattern;
    const boxShadow = themeData.boxShadow;
    const fontFamily = themeData.fontFamily;

    // Get menu items from slots or children
    const items = Array.from(this.children).filter(child =>
      child.tagName === 'JRPG-MENU-ITEM' || child.hasAttribute('slot')
    );

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: ${fontFamily};
          font-size: 12px;
          color: #ffffff;
          margin: 10px;
        }

        .menu-container {
          position: relative;
          width: ${width};
          ${height !== 'auto' ? `height: ${height};` : ''}
          min-height: 60px;
          background: linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 100%);
          border-radius: ${borderRadius};
          box-shadow: ${boxShadow};
          overflow: hidden;
        }

        .menu-header {
          background: linear-gradient(90deg, ${accentColor} 0%, ${primaryColor} 100%);
          padding: 8px 16px 8px 28px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          font-weight: bold;
          font-size: 14px;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
          position: relative;
        }

        .menu-header::before {
          content: '';
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 4px;
          background: ${accentColor};
          box-shadow: 6px 0 0 ${accentColor}, 12px 0 0 ${accentColor};
        }

        .menu-content {
          padding: 12px;
          display: grid;
          grid-template-columns: repeat(${columns}, 1fr);
          gap: 8px;
        }

        .menu-item {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          padding: 8px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.8);
          position: relative;
        }

        .menu-item:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: ${accentColor};
          transform: translateY(-1px);
        }

        .menu-item.selected {
          background: ${accentColor};
          color: ${primaryColor};
          font-weight: bold;
        }

        .menu-item::before {
          content: '';
          position: absolute;
          left: 4px;
          top: 50%;
          transform: translateY(-50%);
          width: 2px;
          height: 2px;
          background: ${accentColor};
          opacity: 0.7;
        }

        /* Decorative elements */
        .menu-decoration {
          position: absolute;
          pointer-events: none;
        }

        .decoration-tl {
          top: 6px;
          left: 6px;
          width: 12px;
          height: 12px;
          background: ${cornerDecoration};
        }

        .decoration-tr {
          top: 6px;
          right: 6px;
          width: 12px;
          height: 12px;
          background: ${cornerDecoration};
          transform: scaleX(-1);
        }

        .decoration-bl {
          bottom: 6px;
          left: 6px;
          width: 12px;
          height: 12px;
          background: ${cornerDecoration};
          transform: scaleY(-1);
        }

        .decoration-br {
          bottom: 6px;
          right: 6px;
          width: 12px;
          height: 12px;
          background: ${cornerDecoration};
          transform: scale(-1, -1);
        }

        .inner-grid {
          position: absolute;
          top: 16px;
          left: 16px;
          right: 16px;
          bottom: 16px;
          background: ${innerPattern};
        }
      </style>

      <div class="menu-container">
        <div class="menu-decoration decoration-tl"></div>
        <div class="menu-decoration decoration-tr"></div>
        <div class="menu-decoration decoration-bl"></div>
        <div class="menu-decoration decoration-br"></div>
        <div class="inner-grid"></div>

        ${title ? `<div class="menu-header">${title}</div>` : ''}

        <div class="menu-content">
          ${items.length > 0 ?
            items.map((item, index) => `
              <div class="menu-item" data-index="${index}">
                ${item.textContent || item.innerHTML}
              </div>
            `).join('') :
            '<div class="menu-item">No items</div>'
          }
        </div>
      </div>
    `;

    // Add click handlers
    this.shadowRoot.querySelectorAll('.menu-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('menu-select', {
          detail: { index, item: items[index] }
        }));
      });
    });
  }
}

customElements.define('jrpg-menu', JrpgMenu);