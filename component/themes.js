/**
 * JRPG Theme Definitions
 * Centralized theme configurations for JRPG Web Components
 * Each theme defines visual properties that can be applied to components
 */

export const themes = {
  sharp: {
    borderRadius: '4px',
    cornerDecoration: (accentColor) => `linear-gradient(135deg, transparent 20%, ${accentColor} 20%, ${accentColor} 80%, transparent 80%)`,
    innerPattern: `linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 50%,
      rgba(0, 0, 0, 0.1) 100%
    )`,
    boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.2),
      inset 0 -1px 0 rgba(0, 0, 0, 0.3),
      0 2px 4px rgba(0, 0, 0, 0.3)`,
    fontFamily: "'Courier New', monospace",
    button: { primary: '#4a4a8a', secondary: '#2a2a5a', accent: '#ffd700' },
    dialog: { primary: '#2a4a7a', secondary: '#1a2a4a', accent: '#ffd700' },
    menu: { primary: '#4a2a1a', secondary: '#2a1a0a', accent: '#daa520' },
    card: { primary: '#2a4a7a', secondary: '#1a2a4a', accent: '#ffd700' },
    progress: { primary: '#4a4a8a', secondary: '#2a2a5a', accent: '#ffd700' },
    input: { primary: '#4a4a8a', secondary: '#2a2a5a', accent: '#ffd700' }
  },

  retro: {
    borderRadius: '0px',
    cornerDecoration: (accentColor) => `repeating-linear-gradient(
      45deg,
      transparent 0px,
      transparent 1px,
      ${accentColor} 1px,
      ${accentColor} 2px,
      transparent 2px,
      transparent 4px
    )`,
    innerPattern: `repeating-linear-gradient(
      0deg,
      transparent 0px,
      rgba(0, 255, 0, 0.1) 1px,
      rgba(0, 255, 0, 0.1) 2px,
      transparent 2px,
      transparent 4px
    ),
    repeating-linear-gradient(
      90deg,
      transparent 0px,
      rgba(255, 176, 0, 0.08) 1px,
      rgba(255, 176, 0, 0.08) 2px,
      transparent 2px,
      transparent 4px
    )`,
    boxShadow: `inset 0 1px 0 rgba(0, 255, 0, 0.2),
      inset 0 -1px 0 rgba(0, 0, 0, 0.9),
      0 1px 2px rgba(0, 0, 0, 0.8)`,
    fontFamily: "'Courier New', 'Fixedsys', 'Terminal', monospace",
    button: { primary: '#000000', secondary: '#000000', accent: '#00FF00' },
    dialog: { primary: '#000000', secondary: '#000000', accent: '#00FF00' },
    menu: { primary: '#001100', secondary: '#000000', accent: '#FFFF00' },
    card: { primary: '#000000', secondary: '#000000', accent: '#00FF00' },
    progress: { primary: '#000000', secondary: '#000000', accent: '#00FF00' },
    input: { primary: '#000000', secondary: '#000000', accent: '#00FF00' }
  },

  elegant: {
    borderRadius: '8px',
    cornerDecoration: (accentColor) => `radial-gradient(circle at 50% 50%, ${accentColor} 0%, transparent 70%)`,
    innerPattern: `linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.15) 0%,
      transparent 40%,
      rgba(0, 0, 0, 0.05) 100%
    )`,
    boxShadow: `inset 0 2px 0 rgba(255, 255, 255, 0.3),
      inset 0 -2px 0 rgba(0, 0, 0, 0.2),
      0 3px 6px rgba(0, 0, 0, 0.4)`,
    fontFamily: "'Times New Roman', serif",
    button: { primary: '#4a6a2a', secondary: '#2a4a1a', accent: '#90ee90' },
    dialog: { primary: '#4a6a2a', secondary: '#2a4a1a', accent: '#90ee90' },
    menu: { primary: '#2a4a4a', secondary: '#1a2a2a', accent: '#48d1cc' },
    card: { primary: '#4a6a2a', secondary: '#2a4a1a', accent: '#90ee90' },
    progress: { primary: '#4a6a2a', secondary: '#2a4a1a', accent: '#90ee90' },
    input: { primary: '#4a6a2a', secondary: '#2a4a1a', accent: '#90ee90' }
  },

  mystical: {
    borderRadius: '12px',
    cornerDecoration: (accentColor) => `conic-gradient(from 45deg, ${accentColor} 0deg, transparent 90deg, ${accentColor} 180deg, transparent 270deg)`,
    innerPattern: `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
      radial-gradient(circle at 70% 70%, rgba(0, 0, 0, 0.1) 0%, transparent 50%)`,
    boxShadow: `inset 0 3px 0 rgba(255, 255, 255, 0.25),
      inset 0 -3px 0 rgba(0, 0, 0, 0.15),
      0 4px 8px rgba(0, 0, 0, 0.5)`,
    fontFamily: "'Comic Sans MS', cursive",
    button: { primary: '#6a4a2a', secondary: '#4a2a1a', accent: '#ff8c00' },
    dialog: { primary: '#6a4a2a', secondary: '#4a2a1a', accent: '#ff8c00' },
    menu: { primary: '#4a4a1a', secondary: '#2a2a0a', accent: '#daa520' },
    card: { primary: '#6a4a2a', secondary: '#4a2a1a', accent: '#ff8c00' },
    progress: { primary: '#6a4a2a', secondary: '#4a2a1a', accent: '#ff8c00' },
    input: { primary: '#6a4a2a', secondary: '#4a2a1a', accent: '#ff8c00' }
  },

  minimal: {
    borderRadius: '0px',
    cornerDecoration: (accentColor) => `linear-gradient(45deg, ${accentColor} 0%, transparent 50%, ${accentColor} 100%)`,
    innerPattern: `linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.05) 0%,
      transparent 50%,
      rgba(0, 0, 0, 0.2) 100%
    )`,
    boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.1),
      inset 0 -1px 0 rgba(0, 0, 0, 0.4),
      0 1px 2px rgba(0, 0, 0, 0.2)`,
    fontFamily: "'Arial', sans-serif",
    button: { primary: '#4a2a4a', secondary: '#2a1a2a', accent: '#dda0dd' },
    dialog: { primary: '#4a2a4a', secondary: '#2a1a2a', accent: '#dda0dd' },
    menu: { primary: '#2a2a4a', secondary: '#1a1a2a', accent: '#ba55d3' },
    card: { primary: '#4a2a4a', secondary: '#2a1a2a', accent: '#dda0dd' },
    progress: { primary: '#4a2a4a', secondary: '#2a1a2a', accent: '#dda0dd' },
    input: { primary: '#4a2a4a', secondary: '#2a1a2a', accent: '#dda0dd' }
  },

  vintage: {
    borderRadius: '6px',
    cornerDecoration: (accentColor) => `linear-gradient(135deg, ${accentColor} 0%, transparent 25%, ${accentColor} 50%, transparent 75%, ${accentColor} 100%)`,
    innerPattern: `linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.12) 0%,
      transparent 45%,
      rgba(0, 0, 0, 0.08) 100%
    ),
    repeating-conic-gradient(from 0deg at 50% 50%, rgba(255, 255, 255, 0.02) 0deg 10deg, transparent 10deg 50deg)`,
    boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.2),
      inset 0 -1px 0 rgba(0, 0, 0, 0.3),
      0 2px 4px rgba(0, 0, 0, 0.3),
      inset 0 0 10px rgba(255, 255, 255, 0.05)`,
    fontFamily: "'Georgia', serif",
    button: { primary: '#2a4a6a', secondary: '#1a2a4a', accent: '#00ced1' },
    dialog: { primary: '#2a4a6a', secondary: '#1a2a4a', accent: '#00ced1' },
    menu: { primary: '#4a4a6a', secondary: '#2a2a4a', accent: '#4682b4' },
    card: { primary: '#2a4a6a', secondary: '#1a2a4a', accent: '#00ced1' },
    progress: { primary: '#2a4a6a', secondary: '#1a2a4a', accent: '#00ced1' },
    input: { primary: '#2a4a6a', secondary: '#1a2a4a', accent: '#00ced1' }
  },

  playful: {
    borderRadius: '10px',
    cornerDecoration: (accentColor) => `radial-gradient(ellipse at center, ${accentColor} 0%, transparent 60%, ${accentColor} 80%, transparent 100%)`,
    innerPattern: `linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.18) 0%,
      transparent 35%,
      rgba(0, 0, 0, 0.06) 100%
    )`,
    boxShadow: `inset 0 2px 0 rgba(255, 255, 255, 0.3),
      inset 0 -2px 0 rgba(0, 0, 0, 0.2),
      0 3px 6px rgba(0, 0, 0, 0.4),
      inset 0 0 8px rgba(255, 255, 255, 0.1)`,
    fontFamily: "'Comic Sans MS', cursive",
    button: { primary: '#6a4a8a', secondary: '#4a2a6a', accent: '#ff69b4' },
    dialog: { primary: '#6a4a8a', secondary: '#4a2a6a', accent: '#ff69b4' },
    menu: { primary: '#4a2a6a', secondary: '#2a1a4a', accent: '#da70d6' },
    card: { primary: '#6a4a8a', secondary: '#4a2a6a', accent: '#ff69b4' },
    progress: { primary: '#6a4a8a', secondary: '#4a2a6a', accent: '#ff69b4' },
    input: { primary: '#6a4a8a', secondary: '#4a2a6a', accent: '#ff69b4' }
  }
};

// Helper function to get theme properties with color substitution
export function getTheme(themeName, accentColor = '#ffd700') {
  const theme = themes[themeName] || themes.sharp;
  return {
    ...theme,
    cornerDecoration: theme.cornerDecoration(accentColor)
  };
}

// Dialog-specific themes (different boxShadow style)
export const dialogThemes = {
  sharp: {
    borderRadius: '0px',
    cornerDecoration: (accentColor) => `linear-gradient(135deg, transparent 30%, ${accentColor} 30%, ${accentColor} 70%, transparent 70%)`,
    innerPattern: `repeating-linear-gradient(
      0deg,
      transparent,
      transparent 1px,
      rgba(255, 255, 255, 0.05) 1px,
      rgba(255, 255, 255, 0.05) 2px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 1px,
      rgba(255, 255, 255, 0.05) 1px,
      rgba(255, 255, 255, 0.05) 2px
    )`,
    boxShadow: (accentColor) => `0 0 0 2px ${accentColor},
      inset 0 0 0 1px rgba(255, 255, 255, 0.1),
      0 4px 8px rgba(0, 0, 0, 0.5)`,
    fontFamily: "'Courier New', monospace"
  },

  retro: {
    borderRadius: '0px',
    cornerDecoration: (accentColor) => `repeating-linear-gradient(
      45deg,
      transparent 0px,
      transparent 1px,
      ${accentColor} 1px,
      ${accentColor} 2px,
      transparent 2px,
      transparent 4px
    )`,
    innerPattern: `repeating-linear-gradient(
      0deg,
      transparent 0px,
      rgba(0, 255, 0, 0.1) 1px,
      rgba(0, 255, 0, 0.1) 2px,
      transparent 2px,
      transparent 4px
    ),
    repeating-linear-gradient(
      90deg,
      transparent 0px,
      rgba(255, 176, 0, 0.08) 1px,
      rgba(255, 176, 0, 0.08) 2px,
      transparent 2px,
      transparent 4px
    )`,
    boxShadow: (accentColor) => `0 0 0 1px ${accentColor},
      inset 0 0 0 1px rgba(0, 255, 0, 0.2),
      0 2px 4px rgba(0, 0, 0, 0.9)`,
    fontFamily: "'Courier New', 'Fixedsys', 'Terminal', monospace"
  },

  elegant: {
    borderRadius: '12px',
    cornerDecoration: (accentColor) => `radial-gradient(circle at 50% 50%, ${accentColor} 0%, transparent 70%)`,
    innerPattern: `repeating-linear-gradient(
      45deg,
      transparent,
      transparent 3px,
      rgba(255, 255, 255, 0.05) 3px,
      rgba(255, 255, 255, 0.05) 6px
    )`,
    boxShadow: (accentColor) => `0 0 0 3px ${accentColor},
      inset 0 0 0 2px rgba(255, 255, 255, 0.2),
      0 4px 8px rgba(0, 0, 0, 0.6)`,
    fontFamily: "'Times New Roman', serif"
  },

  mystical: {
    borderRadius: '20px',
    cornerDecoration: (accentColor) => `conic-gradient(from 45deg, ${accentColor} 0deg, transparent 90deg, ${accentColor} 180deg, transparent 270deg)`,
    innerPattern: `radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
      radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
    boxShadow: (accentColor) => `0 0 0 4px ${accentColor},
      inset 0 0 0 3px rgba(255, 255, 255, 0.15),
      0 5px 10px rgba(0, 0, 0, 0.7)`,
    fontFamily: "'Comic Sans MS', cursive"
  },

  minimal: {
    borderRadius: '0px',
    cornerDecoration: (accentColor) => `linear-gradient(45deg, ${accentColor} 0%, transparent 50%, ${accentColor} 100%)`,
    innerPattern: `repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(255, 255, 255, 0.03) 2px,
      rgba(255, 255, 255, 0.03) 4px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 2px,
      rgba(255, 255, 255, 0.03) 2px,
      rgba(255, 255, 255, 0.03) 4px
    )`,
    boxShadow: (accentColor) => `0 0 0 1px ${accentColor},
      inset 0 0 0 1px rgba(255, 255, 255, 0.05),
      0 2px 4px rgba(0, 0, 0, 0.4)`,
    fontFamily: "'Arial', sans-serif"
  },

  vintage: {
    borderRadius: '8px',
    cornerDecoration: (accentColor) => `linear-gradient(135deg, ${accentColor} 0%, transparent 25%, ${accentColor} 50%, transparent 75%, ${accentColor} 100%)`,
    innerPattern: `repeating-conic-gradient(from 0deg at 50% 50%, rgba(255, 255, 255, 0.04) 0deg 10deg, transparent 10deg 50deg)`,
    boxShadow: (accentColor) => `0 0 0 2px ${accentColor},
      inset 0 0 0 1px rgba(255, 255, 255, 0.1),
      0 3px 6px rgba(0, 0, 0, 0.5),
      inset 0 0 20px rgba(255, 255, 255, 0.05)`,
    fontFamily: "'Georgia', serif"
  },

  playful: {
    borderRadius: '15px',
    cornerDecoration: (accentColor) => `radial-gradient(ellipse at center, ${accentColor} 0%, transparent 60%, ${accentColor} 80%, transparent 100%)`,
    innerPattern: `repeating-linear-gradient(
      45deg,
      transparent,
      transparent 4px,
      rgba(255, 255, 255, 0.06) 4px,
      rgba(255, 255, 255, 0.06) 8px
    )`,
    boxShadow: (accentColor) => `0 0 0 3px ${accentColor},
      inset 0 0 0 2px rgba(255, 255, 255, 0.2),
      0 4px 8px rgba(0, 0, 0, 0.6),
      inset 0 0 15px rgba(255, 255, 255, 0.1)`,
    fontFamily: "'Comic Sans MS', cursive"
  }
};

export function getDialogTheme(themeName, accentColor = '#ffd700') {
  const theme = dialogThemes[themeName] || dialogThemes.sharp;
  return {
    ...theme,
    cornerDecoration: theme.cornerDecoration(accentColor),
    boxShadow: theme.boxShadow(accentColor)
  };
}