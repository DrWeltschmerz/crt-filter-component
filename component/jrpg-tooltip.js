/**
 * JRPG Tooltip Component
 * A Web Component for displaying contextual information with classic JRPG styling
 * Features auto-positioning, rich content support, and theme integration.
 */

import { getTheme, themes } from './themes.js';

class JrpgTooltip extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isVisible = false;
    this.currentTarget = null;
    this.hideTimeout = null;
    this.render();
  }

  static get observedAttributes() {
    return ['content', 'position', 'theme', 'delay', 'max-width', 'trigger'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  connectedCallback() {
    // Ensure we have a portal container for overlay-safe UI (tooltips, toasts, etc.)
    let portal = document.querySelector('.jrpg-portal');
    if (!portal) {
      portal = document.createElement('div');
      portal.className = 'jrpg-portal';
      portal.style.position = 'fixed';
      portal.style.inset = '0';
      portal.style.pointerEvents = 'none';
      // Portal z-index: 8000 (below crt-overlay's 9999 in "On Top" mode)
      portal.style.zIndex = '8000';
      document.body.appendChild(portal);
    }

    if (this.parentElement !== portal) {
      portal.appendChild(this);
    }
    this.setupEventListeners();
  }

  disconnectedCallback() {
    this.cleanupEventListeners();
    // Clear any pending timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  setupEventListeners() {
    // Listen for tooltip-show and tooltip-hide events
    document.addEventListener('jrpg-tooltip-show', this.handleShowTooltip.bind(this));
    document.addEventListener('jrpg-tooltip-hide', this.handleHideTooltip.bind(this));

    // Global mouse move for positioning
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
  }

  cleanupEventListeners() {
    document.removeEventListener('jrpg-tooltip-show', this.handleShowTooltip.bind(this));
    document.removeEventListener('jrpg-tooltip-hide', this.handleHideTooltip.bind(this));
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
  }

  handleShowTooltip(event) {
    const { content, target, position = 'auto', theme: themeName, originalEvent } = event.detail;

    if (content) {
      this.setAttribute('content', content);
      if (position !== 'auto') this.setAttribute('position', position);
      if (themeName) this.setAttribute('theme', themeName);

      this.currentTarget = target;
      this.originalEvent = originalEvent; // Store the original event for positioning
      this.show();
    }
  }

  handleHideTooltip() {
    this.hide();
  }

  handleMouseMove(event) {
    if (this.isVisible) {
      this.updatePosition(event.clientX, event.clientY);
    }
  }

  updatePosition(mouseX, mouseY) {
    const tooltip = this.shadowRoot.querySelector('.tooltip');
    if (!tooltip) return;

    const rect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = mouseX + 10; // Offset from cursor
    let top = mouseY + 10;

    // Adjust position to stay within viewport
    if (left + rect.width > viewportWidth) {
      left = mouseX - rect.width - 10;
    }

    if (top + rect.height > viewportHeight) {
      top = mouseY - rect.height - 10;
    }

    // Ensure tooltip doesn't go off-screen
    left = Math.max(10, Math.min(left, viewportWidth - rect.width - 10));
    top = Math.max(10, Math.min(top, viewportHeight - rect.height - 10));

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  show() {
    const delay = parseInt(this.getAttribute('delay') || '0');
    const duration = parseInt(this.getAttribute('duration') || '3000'); // Auto-hide after 3 seconds

    // Clear any existing timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    setTimeout(() => {
      this.isVisible = true;
      this.render();
      // Position after layout has completed
      if (this.currentTarget) {
        let mouseX, mouseY;
        if (this.originalEvent && this.originalEvent.clientX !== undefined) {
          // Use click coordinates if available
          mouseX = this.originalEvent.clientX;
          mouseY = this.originalEvent.clientY;
        } else {
          // Fallback to target center
          const rect = this.currentTarget.getBoundingClientRect();
          mouseX = rect.left + rect.width / 2;
          mouseY = rect.top + rect.height / 2;
        }
        requestAnimationFrame(() => this.updatePosition(mouseX, mouseY));
      }

      // Auto-hide after duration
      this.hideTimeout = setTimeout(() => {
        this.hide();
      }, duration);
    }, delay);
  }

  hide() {
    this.isVisible = false;
    this.currentTarget = null;
    this.originalEvent = null; // Clear the stored event
    // Clear any pending timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    this.render();
  }

  render() {
    const content = this.getAttribute('content') || '';
    const position = this.getAttribute('position') || 'auto';
    const themeName = this.getAttribute('theme') || 'sharp';
    const maxWidth = this.getAttribute('max-width') || '300px';

    // Get theme colors from dialog theme (since tooltips are informational like dialogs)
    const themeColors = themes[themeName]?.dialog || themes.sharp.dialog;
    const theme = getTheme(themeName);

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          pointer-events: none;
          font-family: ${theme.fontFamily};
        }

        .tooltip {
          background: linear-gradient(135deg,
            ${themeColors.primary}dd,
            ${themeColors.secondary}dd
          );
          border: 2px solid ${themeColors.accent};
          border-radius: ${theme.borderRadius};
          padding: 12px 16px;
          box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 ${themeColors.primary}44,
            inset 0 -1px 0 ${themeColors.secondary}44;
          max-width: ${maxWidth};
          word-wrap: break-word;
          opacity: ${this.isVisible ? '1' : '0'};
          transform: ${this.isVisible ? 'scale(1)' : 'scale(0.9)'};
          transition: opacity 0.2s ease, transform 0.2s ease;
          position: fixed;
          z-index: inherit; /* Inherit portal stacking context so overlay can cover it when applicable */
          pointer-events: auto; /* Allow interactions if necessary */

        }

        .tooltip::before {
          content: '';
          position: absolute;
          width: 0;
          height: 0;
          border: 8px solid transparent;
        }

        .tooltip.top::before {
          bottom: -16px;
          left: 20px;
          border-top-color: ${themeColors.accent};
          border-bottom: none;
        }

        .tooltip.bottom::before {
          top: -16px;
          left: 20px;
          border-bottom-color: ${themeColors.accent};
          border-top: none;
        }

        .tooltip.left::before {
          right: -16px;
          top: 50%;
          transform: translateY(-50%);
          border-left-color: ${themeColors.accent};
          border-right: none;
        }

        .tooltip.right::before {
          left: -16px;
          top: 50%;
          transform: translateY(-50%);
          border-right-color: ${themeColors.accent};
          border-left: none;
        }

        .content {
          color: #ffffff;
          font-size: 14px;
          line-height: 1.4;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
        }

        .content h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: bold;
          color: ${themeColors.accent};
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .content p {
          margin: 0 0 8px 0;
        }

        .content p:last-child {
          margin-bottom: 0;
        }

        .content strong {
          color: ${themeColors.accent};
          font-weight: bold;
        }

        .content em {
          font-style: italic;
          color: #cccccc;
        }

        /* JRPG-style decorative elements */
        .tooltip::after {
          content: '';
          position: absolute;
          top: 4px;
          left: 4px;
          right: 4px;
          bottom: 4px;
          border: 1px solid ${themeColors.primary}33;
          border-radius: 4px;
          pointer-events: none;
        }

        /* Corner decorations */
        .corner-tl, .corner-tr, .corner-bl, .corner-br {
          position: absolute;
          width: 8px;
          height: 8px;
          border: 1px solid ${themeColors.accent}66;
        }

        .corner-tl {
          top: 2px;
          left: 2px;
          border-right: none;
          border-bottom: none;
        }

        .corner-tr {
          top: 2px;
          right: 2px;
          border-left: none;
          border-bottom: none;
        }

        .corner-bl {
          bottom: 2px;
          left: 2px;
          border-right: none;
          border-top: none;
        }

        .corner-br {
          bottom: 2px;
          right: 2px;
          border-left: none;
          border-top: none;
        }
      </style>

      <div class="tooltip ${position}" style="display: ${this.isVisible ? 'block' : 'none'}">
        <div class="corner-tl"></div>
        <div class="corner-tr"></div>
        <div class="corner-bl"></div>
        <div class="corner-br"></div>
        <div class="content">${content}</div>
      </div>
    `;
  }
}

// Static methods for easy tooltip management
JrpgTooltip.show = function(content, target, options = {}) {
  const event = new CustomEvent('jrpg-tooltip-show', {
    detail: { content, target, ...options }
  });
  document.dispatchEvent(event);
};

JrpgTooltip.hide = function() {
  const event = new CustomEvent('jrpg-tooltip-hide');
  document.dispatchEvent(event);
};

customElements.define('jrpg-tooltip', JrpgTooltip);

// Make JrpgTooltip available globally for easy access
window.JrpgTooltip = JrpgTooltip;

export default JrpgTooltip;