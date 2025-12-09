import { getTheme } from './themes.js';

class JRPGInput extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  static get observedAttributes() {
    return ['value', 'placeholder', 'type', 'disabled', 'theme', 'primary-color', 'secondary-color', 'accent-color', 'width'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  render() {
    const themeKey = this.getAttribute('theme') || 'sharp';
    const theme = getTheme(themeKey);
    const primaryColor = this.getAttribute('primary-color') || theme.input?.primary || theme.button.primary;
    const secondaryColor = this.getAttribute('secondary-color') || theme.input?.secondary || theme.button.secondary;
    const accentColor = this.getAttribute('accent-color') || theme.input?.accent || theme.button.accent;

    const value = this.getAttribute('value') || '';
    const placeholder = this.getAttribute('placeholder') || '';
    const type = this.getAttribute('type') || 'text';
    const disabled = this.hasAttribute('disabled');
    const width = this.getAttribute('width') || '200px';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          font-family: 'Courier New', monospace;
        }

        .input-container {
          position: relative;
          display: inline-block;
          width: ${width};
        }

        .input-field {
          width: 100%;
          padding: 8px 12px;
          border: 2px solid ${primaryColor};
          background: ${secondaryColor};
          color: ${accentColor};
          font-family: inherit;
          font-size: 14px;
          border-radius: 4px;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s ease;
        }

        .input-field:focus {
          border-color: ${accentColor};
          box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
        }

        .input-field:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .input-field::placeholder {
          color: ${accentColor}80;
        }

        /* JRPG-style border effect */
        .input-container::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, ${primaryColor}, ${accentColor});
          border-radius: 6px;
          z-index: -1;
          opacity: 0.3;
        }

        .input-container:focus-within::before {
          opacity: 0.8;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.3; }
        }
      </style>

      <div class="input-container">
        <input
          type="${type}"
          value="${value}"
          placeholder="${placeholder}"
          ${disabled ? 'disabled' : ''}
          class="input-field"
        >
      </div>
    `;
  }

  setupEventListeners() {
    const input = this.shadowRoot.querySelector('.input-field');

    input.addEventListener('input', (e) => {
      this.setAttribute('value', e.target.value);
      this.dispatchEvent(new CustomEvent('jrpg-input', {
        detail: { value: e.target.value },
        bubbles: true,
        composed: true
      }));
    });

    input.addEventListener('change', (e) => {
      this.dispatchEvent(new CustomEvent('jrpg-change', {
        detail: { value: e.target.value },
        bubbles: true,
        composed: true
      }));
    });

    input.addEventListener('focus', () => {
      this.dispatchEvent(new CustomEvent('jrpg-focus', {
        bubbles: true,
        composed: true
      }));
    });

    input.addEventListener('blur', () => {
      this.dispatchEvent(new CustomEvent('jrpg-blur', {
        bubbles: true,
        composed: true
      }));
    });
  }

  get value() {
    return this.shadowRoot.querySelector('.input-field')?.value || '';
  }

  set value(val) {
    this.setAttribute('value', val);
    const input = this.shadowRoot.querySelector('.input-field');
    if (input) input.value = val;
  }

  focus() {
    this.shadowRoot.querySelector('.input-field')?.focus();
  }

  blur() {
    this.shadowRoot.querySelector('.input-field')?.blur();
  }
}

customElements.define('jrpg-input', JRPGInput);