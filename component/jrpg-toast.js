import { themes } from './themes.js';

class JRPGToast extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.timeoutId = null;
    this.isVisible = false;
  }

  static get observedAttributes() {
    return ['message', 'type', 'duration', 'theme', 'position'];
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

    this.render();
    this.setupEventListeners();
  }

  disconnectedCallback() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  setupEventListeners() {
    // Close on click
    this.shadowRoot.addEventListener('click', () => {
      this.hide();
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }

  show() {
    if (this.isVisible) return;

    this.isVisible = true;
    this.style.display = 'block';

    // Force reflow
    this.offsetHeight;

    this.classList.add('visible');

    // Auto-hide after duration
    const duration = parseInt(this.getAttribute('duration')) || 4000;
    this.timeoutId = setTimeout(() => {
      this.hide();
    }, duration);
  }

  hide() {
    if (!this.isVisible) return;

    this.isVisible = false;
    this.classList.remove('visible');

    setTimeout(() => {
      this.style.display = 'none';
      this.dispatchEvent(new CustomEvent('jrpg-toast-hidden', {
        bubbles: true,
        composed: true
      }));
    }, 300); // Match transition duration
  }

  render() {
    const message = this.getAttribute('message') || '';
    const type = this.getAttribute('type') || 'info';
    const theme = this.getAttribute('theme') || 'sharp';
    const position = this.getAttribute('position') || 'top-right';

    const themeData = themes[theme] || themes.sharp;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          z-index: 10003;
          display: none;
          font-family: inherit;
          font-size: 0.9rem;
          pointer-events: auto;
        }

        :host(.visible) .toast {
          opacity: 1;
          transform: translateY(0);
        }

        /* Position variants */
        :host([position="top-left"]) {
          top: 20px;
          left: 20px;
        }

        :host([position="top-center"]) {
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
        }

        :host([position="top-right"]) {
          top: 20px;
          right: 20px;
        }

        :host([position="bottom-left"]) {
          bottom: 20px;
          left: 20px;
        }

        :host([position="bottom-center"]) {
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
        }

        :host([position="bottom-right"]) {
          bottom: 20px;
          right: 20px;
        }

        .toast {
          background: rgba(0, 0, 0, 0.9);
          border: 2px solid;
          border-radius: 8px;
          padding: 12px 16px;
          min-width: 250px;
          max-width: 400px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
          opacity: 0;
          transform: translateY(-20px);
          transition: all 0.3s ease;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .toast:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.6);
        }

        /* Type variants */
        :host([type="success"]) .toast {
          border-color: #4ade80;
          background: rgba(74, 222, 128, 0.1);
        }

        :host([type="error"]) .toast {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        :host([type="warning"]) .toast {
          border-color: #f59e0b;
          background: rgba(245, 158, 11, 0.1);
        }

        :host([type="info"]) .toast {
          border-color: ${themeData.button.primary};
          background: rgba(0, 0, 0, 0.9);
        }

        :host([type="battle"]) .toast {
          border-color: #dc2626;
          background: rgba(220, 38, 38, 0.1);
        }

        :host([type="item"]) .toast {
          border-color: #16a34a;
          background: rgba(22, 163, 74, 0.1);
        }

        :host([type="quest"]) .toast {
          border-color: #7c3aed;
          background: rgba(124, 58, 237, 0.1);
        }

        .icon {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
        }

        :host([type="success"]) .icon {
          color: #4ade80;
        }

        :host([type="error"]) .icon {
          color: #ef4444;
        }

        :host([type="warning"]) .icon {
          color: #f59e0b;
        }

        :host([type="info"]) .icon {
          color: ${themeData.button.accent};
        }

        :host([type="battle"]) .icon {
          color: #dc2626;
        }

        :host([type="item"]) .icon {
          color: #16a34a;
        }

        :host([type="quest"]) .icon {
          color: #7c3aed;
        }

        .content {
          flex: 1;
          color: #ffffff;
          line-height: 1.4;
        }

        .close {
          flex-shrink: 0;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          font-size: 12px;
          margin-left: 8px;
        }

        .close:hover {
          color: #ffffff;
        }

        /* Theme-aware colors */
        :host([theme]) .toast {
          border-color: ${themeData.button.primary};
        }

        :host([theme]) .content {
          color: #ffffff;
        }
      </style>

      <div class="toast">
        <div class="icon">
          ${this.getIcon(type)}
        </div>
        <div class="content">${message}</div>
        <div class="close">×</div>
      </div>
    `;
  }

  getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
      battle: '⚔',
      item: '🎒',
      quest: '📜'
    };
    return icons[type] || icons.info;
  }
}

customElements.define('jrpg-toast', JRPGToast);
